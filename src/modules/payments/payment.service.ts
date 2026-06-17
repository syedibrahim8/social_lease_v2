import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { isStripeConfigured } from '@/config/stripe';
import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { userRepository } from '@/modules/users/user.repository';
import { campaignRepository } from '@/modules/campaigns/campaign.repository';
import { contractRepository } from '@/modules/contracts/contract.repository';
import { stripeAdapter } from '@/modules/payments/payment.stripe';
import { paymentRepository, type PaymentFilter } from '@/modules/payments/payment.repository';
import { walletRepository } from '@/modules/payments/wallet.repository';
import { transactionRepository } from '@/modules/payments/transaction.repository';
import type { IContractDocument } from '@/modules/contracts/contract.types';
import type {
  AccountUpdatedObject,
  CheckoutCompletedSession,
  PaymentIntentRef,
  StripeEvent,
} from '@/modules/payments/payment.stripe';
import type {
  IPaymentDocument,
  ITransactionDocument,
  IWalletDocument,
} from '@/modules/payments/payment.types';
import type { ListPaymentsQuery } from '@/modules/payments/payment.validators';

/** Split a gross amount into platform commission + creator share (minor units). */
function computeSplit(amount: number): { commissionAmount: number; creatorAmount: number } {
  const commissionAmount = Math.round((amount * env.PLATFORM_COMMISSION_PERCENT) / 100);
  return { commissionAmount, creatorAmount: amount - commissionAmount };
}

function paymentIntentId(value: PaymentIntentRef): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.id;
}

export const paymentService = {
  // --- Connect onboarding ------------------------------------------------

  /** Create (if needed) the creator's connected account + an onboarding link. */
  async onboardCreator(creatorId: string): Promise<{ onboardingUrl: string }> {
    const wallet = await walletRepository.ensureForUser(creatorId, 'USD');
    let accountId = wallet.stripeAccountId;

    if (!accountId) {
      const user = await userRepository.findById(creatorId);
      if (!user) throw ApiError.notFound('User not found');
      const account = await stripeAdapter.createConnectedAccount(user.email);
      accountId = account.id;
      await walletRepository.setStripeAccount(creatorId, accountId);
    }

    const link = await stripeAdapter.createAccountLink(accountId);
    return { onboardingUrl: link.url };
  },

  /** Refresh + return the creator's payout-onboarding status from Stripe. */
  async getConnectStatus(
    creatorId: string
  ): Promise<{ hasAccount: boolean; onboardingComplete: boolean; payoutsEnabled: boolean }> {
    const wallet = await walletRepository.ensureForUser(creatorId, 'USD');
    if (!wallet.stripeAccountId) {
      return { hasAccount: false, onboardingComplete: false, payoutsEnabled: false };
    }
    const account = await stripeAdapter.retrieveAccount(wallet.stripeAccountId);
    const payoutsEnabled = account.payouts_enabled ?? false;
    const onboardingComplete = account.details_submitted ?? false;
    await walletRepository.setOnboardingStatus(
      wallet.stripeAccountId,
      payoutsEnabled,
      onboardingComplete
    );
    return { hasAccount: true, onboardingComplete, payoutsEnabled };
  },

  /**
   * Guard before a creator commits to work (e.g. applying to a campaign): ensure
   * they can actually be paid out, so the platform never engages a creator whose
   * escrow it couldn't later release (avoids disputes / stuck funds). Trusts a
   * persisted payouts-enabled wallet; otherwise re-checks live with Stripe to
   * tolerate webhook lag. No-ops when payments aren't configured for this env.
   */
  async assertCreatorCanReceivePayouts(creatorId: string): Promise<void> {
    if (!isStripeConfigured()) return;
    const wallet = await walletRepository.findByUserId(creatorId);
    if (wallet?.payoutsEnabled) return;
    if (wallet?.stripeAccountId) {
      // Persisted state isn't payout-ready yet — confirm live before rejecting.
      const status = await this.getConnectStatus(creatorId);
      if (status.payoutsEnabled) return;
    }
    throw ApiError.forbidden(
      'Connect a Stripe payout account before applying to campaigns — start onboarding at POST /payments/connect/onboard.'
    );
  },

  // --- Brand pays (checkout) --------------------------------------------

  /** Create a Checkout Session funding a contract; returns the hosted URL. */
  async createCheckout(
    contractId: string,
    brandUserId: string
  ): Promise<{ checkoutUrl: string; paymentId: string }> {
    const contract = await contractRepository.findDocById(contractId);
    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.brandId.toString() !== brandUserId) {
      throw ApiError.forbidden('Only the contract owner can fund it');
    }
    if (contract.status !== 'PENDING_FUNDING') {
      throw ApiError.conflict(`Contract is ${contract.status} and cannot be funded`);
    }

    const existing = await paymentRepository.findByContractId(contractId);
    if (existing && existing.status !== 'PENDING') {
      throw ApiError.conflict('This contract already has an active payment');
    }

    const { commissionAmount, creatorAmount } = computeSplit(contract.agreedPrice);
    const payment =
      existing ??
      (await paymentRepository.create({
        contractId,
        campaignId: contract.campaignId.toString(),
        brandId: contract.brandId.toString(),
        creatorId: contract.creatorId.toString(),
        amount: contract.agreedPrice,
        commissionAmount,
        creatorAmount,
        currency: contract.currency,
      }));

    const session = await stripeAdapter.createCheckoutSession({
      amount: contract.agreedPrice,
      currency: contract.currency,
      productName: `Campaign contract ${contractId}`,
      paymentId: payment._id.toString(),
      contractId,
    });
    await paymentRepository.updateById(payment._id.toString(), {
      stripeCheckoutSessionId: session.id,
    });

    if (!session.url) throw ApiError.internal('Stripe did not return a checkout URL');
    return { checkoutUrl: session.url, paymentId: payment._id.toString() };
  },

  // --- Release / refund --------------------------------------------------

  /**
   * Brand-initiated payout. Gated on the submission having been APPROVED (proof
   * of work accepted) — this is the seam the submissions module relies on. Also
   * used to complete a payout that was deferred because the creator hadn't
   * finished onboarding at approval time.
   */
  async releasePayment(contractId: string, brandUserId: string): Promise<IPaymentDocument> {
    const contract = await contractRepository.findDocById(contractId);
    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.brandId.toString() !== brandUserId) {
      throw ApiError.forbidden('Only the contract owner can release payment');
    }
    if (contract.status !== 'APPROVED') {
      throw ApiError.conflict('The submission must be approved before the payout can be released');
    }

    const payment = await paymentRepository.findByContractId(contractId);
    if (!payment || payment.status !== 'PAID') {
      throw ApiError.conflict('Payment is not in a releasable state');
    }

    const wallet = await walletRepository.findByUserId(payment.creatorId.toString());
    if (!wallet?.stripeAccountId || !wallet.payoutsEnabled) {
      throw ApiError.conflict('The creator has not completed payout onboarding yet');
    }

    return this.performRelease(payment, contract, wallet.stripeAccountId);
  },

  /**
   * Auto-release invoked by the submissions module right after a brand approves
   * the proof of work. Non-throwing on the not-yet-onboarded case: the contract
   * stays APPROVED so the brand can complete the payout via `releasePayment`
   * once the creator finishes Connect onboarding.
   */
  async releaseForApprovedContract(
    contractId: string
  ): Promise<{ released: boolean; payment: IPaymentDocument | null }> {
    const contract = await contractRepository.findDocById(contractId);
    if (!contract || contract.status !== 'APPROVED') return { released: false, payment: null };

    const payment = await paymentRepository.findByContractId(contractId);
    if (!payment || payment.status !== 'PAID') return { released: false, payment: payment ?? null };

    const wallet = await walletRepository.findByUserId(payment.creatorId.toString());
    if (!wallet?.stripeAccountId || !wallet.payoutsEnabled) return { released: false, payment };

    const released = await this.performRelease(payment, contract, wallet.stripeAccountId);
    return { released: true, payment: released };
  },

  /**
   * Execute the Stripe Transfer + state transitions (escrow → creator). Assumes
   * all guards (ownership, APPROVED, PAID, payouts-enabled) have already passed.
   */
  async performRelease(
    payment: IPaymentDocument,
    contract: IContractDocument,
    destination: string
  ): Promise<IPaymentDocument> {
    const transfer = await stripeAdapter.createTransfer({
      amount: payment.creatorAmount,
      currency: payment.currency,
      destination,
      paymentId: payment._id.toString(),
      contractId: contract._id.toString(),
    });

    const updated = await paymentRepository.updateById(payment._id.toString(), {
      status: 'RELEASED',
      stripeTransferId: transfer.id,
      releasedAt: new Date(),
    });
    await walletRepository.release(payment.creatorId.toString(), payment.creatorAmount);
    await transactionRepository.create({
      userId: payment.creatorId,
      paymentId: payment._id,
      contractId: contract._id,
      type: 'PAYOUT',
      amount: payment.creatorAmount,
      currency: payment.currency,
      description: `Payout released for contract ${contract._id.toString()}`,
    });

    contract.status = 'COMPLETED';
    await contractRepository.save(contract);
    await campaignRepository.updateById(payment.campaignId.toString(), { status: 'COMPLETED' });

    return updated ?? payment;
  },

  /** Refund the brand before payout; reverses the escrow credit. */
  async refundPayment(contractId: string, brandUserId: string): Promise<IPaymentDocument> {
    const contract = await contractRepository.findDocById(contractId);
    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.brandId.toString() !== brandUserId) {
      throw ApiError.forbidden('Only the contract owner can request a refund');
    }

    const payment = await paymentRepository.findByContractId(contractId);
    if (!payment || payment.status !== 'PAID') {
      throw ApiError.conflict('Only a paid, not-yet-released payment can be refunded');
    }
    if (!payment.stripePaymentIntentId) {
      throw ApiError.conflict('Missing payment intent; cannot refund');
    }

    const refund = await stripeAdapter.createRefund(payment.stripePaymentIntentId);
    const updated = await paymentRepository.updateById(payment._id.toString(), {
      status: 'REFUNDED',
      stripeRefundId: refund.id,
      refundedAt: new Date(),
    });
    await walletRepository.reversePending(payment.creatorId.toString(), payment.creatorAmount);
    await transactionRepository.create({
      userId: payment.creatorId,
      paymentId: payment._id,
      contractId: contract._id,
      type: 'REFUND',
      amount: -payment.creatorAmount,
      currency: payment.currency,
      description: `Escrow reversed (refund) for contract ${contractId}`,
    });

    contract.status = 'CANCELLED';
    await contractRepository.save(contract);
    await campaignRepository.updateById(payment.campaignId.toString(), { status: 'CANCELLED' });

    return updated ?? payment;
  },

  // --- Webhook event handling -------------------------------------------

  async processWebhookEvent(event: StripeEvent): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;
      default:
        logger.debug('Unhandled Stripe event', { type: event.type });
    }
  },

  /** Payment succeeded → funds in escrow; credit the creator's pending balance. */
  async handleCheckoutCompleted(session: CheckoutCompletedSession): Promise<void> {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) {
      logger.warn('checkout.session.completed without paymentId metadata', { session: session.id });
      return;
    }
    const payment = await paymentRepository.findDocById(paymentId);
    if (!payment || payment.status !== 'PENDING') {
      // Idempotent: already processed or unknown.
      return;
    }

    await paymentRepository.updateById(paymentId, {
      status: 'PAID',
      stripePaymentIntentId: paymentIntentId(session.payment_intent),
      paidAt: new Date(),
    });

    const contract = await contractRepository.findDocById(payment.contractId.toString());
    if (contract && contract.status === 'PENDING_FUNDING') {
      contract.status = 'FUNDED';
      await contractRepository.save(contract);
    }
    await campaignRepository.updateById(payment.campaignId.toString(), { status: 'FUNDED' });

    await walletRepository.ensureForUser(payment.creatorId.toString(), payment.currency);
    await walletRepository.creditPending(payment.creatorId.toString(), payment.creatorAmount);
    await transactionRepository.create({
      userId: payment.creatorId,
      paymentId: payment._id,
      contractId: payment.contractId,
      type: 'EARNING',
      amount: payment.creatorAmount,
      currency: payment.currency,
      description: `Escrow funded for contract ${payment.contractId.toString()}`,
    });

    logger.info('Payment captured (escrow funded)', { paymentId, amount: payment.amount });
  },

  async handleAccountUpdated(account: AccountUpdatedObject): Promise<void> {
    await walletRepository.setOnboardingStatus(
      account.id,
      account.payouts_enabled ?? false,
      account.details_submitted ?? false
    );
  },

  // --- Reads -------------------------------------------------------------

  async getPayment(id: string, userId: string): Promise<IPaymentDocument> {
    const payment = await paymentRepository.findDocById(id);
    if (
      !payment ||
      (payment.brandId.toString() !== userId && payment.creatorId.toString() !== userId)
    ) {
      throw ApiError.notFound('Payment not found');
    }
    return (await paymentRepository.findById(id)) ?? payment;
  },

  async listMyPayments(
    userId: string,
    query: ListPaymentsQuery
  ): Promise<Paginated<IPaymentDocument>> {
    const filter: PaymentFilter = { $or: [{ brandId: userId }, { creatorId: userId }] };
    if (query.status) filter.status = query.status;
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await paymentRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  getWallet(creatorId: string): Promise<IWalletDocument> {
    return walletRepository.ensureForUser(creatorId, 'USD');
  },

  async listMyTransactions(
    userId: string,
    query: ListPaymentsQuery
  ): Promise<Paginated<ITransactionDocument>> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await transactionRepository.listByUser(userId, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};

export type PaymentService = typeof paymentService;
