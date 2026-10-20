import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { withTransaction } from '@/config/database';
import { isStripeConfigured } from '@/config/stripe';
import { eventBus } from '@/events/event-bus';
import { ApiError } from '@/utils/ApiError';
import { isDuplicateKeyError } from '@/utils/mongo';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { userRepository } from '@/modules/users/user.repository';
import { campaignRepository } from '@/modules/campaigns/campaign.repository';
import { CAMPAIGN_STATUSES, type CampaignStatus } from '@/modules/campaigns/campaign.types';
import { contractRepository } from '@/modules/contracts/contract.repository';
import { CONTRACT_STATUSES, type ContractStatus } from '@/modules/contracts/contract.types';
import {
  isDefinitiveStripeFailure,
  stripeAdapter,
  stripeErrorMessage,
} from '@/modules/payments/payment.stripe';
import { paymentRepository, type PaymentFilter } from '@/modules/payments/payment.repository';
import { walletRepository } from '@/modules/payments/wallet.repository';
import { transactionRepository } from '@/modules/payments/transaction.repository';
import { stripeEventRepository } from '@/modules/payments/stripe-event.repository';
import type { IContractDocument } from '@/modules/contracts/contract.types';
import type {
  AccountUpdatedObject,
  ChargeObject,
  CheckoutCompletedSession,
  DisputeObject,
  StripeEvent,
} from '@/modules/payments/payment.stripe';
import type {
  IPaymentDocument,
  ITransactionDocument,
  IWalletDocument,
} from '@/modules/payments/payment.types';
import type { ListPaymentsQuery } from '@/modules/payments/payment.validators';

/** How long one request holds the right to create a checkout session. */
const CHECKOUT_LEASE_MS = 15_000;
/** A claim or session untouched for this long is treated as interrupted. */
const STALE_AFTER_MS = 2 * 60 * 1000;
/** Abandoned checkouts older than this are no longer swept. */
const SWEEP_WINDOW_MS = 48 * 60 * 60 * 1000;
const SWEEP_BATCH = 50;

/** Contract states a refund or chargeback can still cancel. */
const OPEN_CONTRACT_STATUSES: readonly ContractStatus[] = [
  'PENDING_FUNDING',
  'FUNDED',
  'IN_PROGRESS',
  'SUBMITTED',
  'APPROVED',
  'DISPUTED',
];

/** Thrown inside a funding transaction to roll it back when the contract moved. */
class ContractNotFundableError extends Error {}

/** Split a gross amount into platform commission + creator share (minor units). */
function computeSplit(amount: number): { commissionAmount: number; creatorAmount: number } {
  const commissionAmount = Math.round((amount * env.PLATFORM_COMMISSION_PERCENT) / 100);
  return { commissionAmount, creatorAmount: amount - commissionAmount };
}

/** Stripe expandable fields arrive as an id or as the expanded object. */
function refId(value: string | { id: string } | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.id;
}

function defaultCurrency(): string {
  return env.SUPPORTED_CURRENCIES[0] ?? 'USD';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A wallet holds one currency; money in another must never be summed into it. */
function assertWalletCurrency(wallet: IWalletDocument, currency: string): void {
  if (wallet.currency !== currency.toUpperCase()) {
    throw ApiError.conflict(
      `This account settles in ${wallet.currency}; a ${currency.toUpperCase()} payment cannot be added to it`
    );
  }
}

function isContractStatus(value: unknown): value is ContractStatus {
  return typeof value === 'string' && (CONTRACT_STATUSES as readonly string[]).includes(value);
}

function isCampaignStatus(value: unknown): value is CampaignStatus {
  return typeof value === 'string' && (CAMPAIGN_STATUSES as readonly string[]).includes(value);
}

export const paymentService = {
  // --- Connect onboarding (creators) ---------------------------------------

  /** Create (if needed) the creator's connected account + an onboarding link. */
  async onboardCreator(creatorId: string): Promise<{ onboardingUrl: string }> {
    const wallet = await walletRepository.ensureForUser(creatorId, defaultCurrency());
    let accountId = wallet.stripeAccountId;

    if (!accountId) {
      const user = await userRepository.findById(creatorId);
      if (!user) throw ApiError.notFound('User not found');
      // Idempotent per user, so two concurrent onboarding clicks get ONE account.
      const account = await stripeAdapter.createConnectedAccount(user.email, creatorId);
      const stored = await walletRepository.setStripeAccountIfMissing(creatorId, account.id);
      accountId = stored?.stripeAccountId ?? account.id;
    }

    const link = await stripeAdapter.createAccountLink(accountId);
    return { onboardingUrl: link.url };
  },

  /** Refresh + return the creator's payout-onboarding status from Stripe. */
  async getConnectStatus(
    creatorId: string
  ): Promise<{ hasAccount: boolean; onboardingComplete: boolean; payoutsEnabled: boolean }> {
    const wallet = await walletRepository.ensureForUser(creatorId, defaultCurrency());
    if (!wallet.stripeAccountId) {
      return { hasAccount: false, onboardingComplete: false, payoutsEnabled: false };
    }
    const account = await stripeAdapter.retrieveAccount(wallet.stripeAccountId);
    const payoutsEnabled =
      account.payouts_enabled === true && account.capabilities?.transfers === 'active';
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

  /**
   * The connected account a contract's payout goes to, checked live.
   *
   * The money must reach the creator on the CONTRACT, so this asserts that the
   * payment's creator is the contract's creator, that the account on file is
   * bound to that user (Stripe metadata), and that it can receive transfers.
   * Accounts created before the binding existed are bound on first use.
   */
  async resolvePayoutDestination(
    payment: IPaymentDocument,
    contract: IContractDocument
  ): Promise<string> {
    const creatorId = contract.creatorId.toString();
    if (
      payment.creatorId.toString() !== creatorId ||
      payment.contractId.toString() !== contract._id.toString()
    ) {
      logger.error('Payment and contract parties disagree; payout refused', {
        paymentId: payment._id.toString(),
        contractId: contract._id.toString(),
      });
      throw ApiError.internal('Payment record does not match its contract');
    }

    const wallet = await walletRepository.findByUserId(creatorId);
    if (!wallet?.stripeAccountId) {
      throw ApiError.conflict('The creator has not completed payout onboarding yet');
    }

    const account = await stripeAdapter.retrieveAccount(wallet.stripeAccountId);
    const boundTo = account.metadata?.userId;
    if (boundTo && boundTo !== creatorId) {
      logger.error('Connected account is bound to a different user; payout refused', {
        accountId: account.id,
        expected: creatorId,
        boundTo,
      });
      throw ApiError.forbidden('The payout account on file does not belong to this creator');
    }
    if (!boundTo) await stripeAdapter.bindAccountToUser(account.id, creatorId);

    const ready = account.payouts_enabled === true && account.capabilities?.transfers === 'active';
    await walletRepository.setOnboardingStatus(
      account.id,
      ready,
      account.details_submitted ?? false
    );
    if (!ready) throw ApiError.conflict('The creator has not completed payout onboarding yet');
    return account.id;
  },

  // --- Brand billing ---------------------------------------------------------

  /** The Stripe Customer this brand's checkouts are bound to (created once). */
  async ensureBrandCustomer(brandId: string, currency: string): Promise<string> {
    const wallet = await walletRepository.ensureForUser(brandId, currency);
    assertWalletCurrency(wallet, currency);
    if (wallet.stripeCustomerId) return wallet.stripeCustomerId;

    const user = await userRepository.findById(brandId);
    if (!user) throw ApiError.notFound('User not found');
    const customer = await stripeAdapter.createCustomer({
      email: user.email,
      name: user.name,
      userId: brandId,
    });
    const stored = await walletRepository.setStripeCustomerIfMissing(brandId, customer.id);
    return stored?.stripeCustomerId ?? customer.id;
  },

  // --- Brand pays (checkout) ---------------------------------------------------

  /**
   * Return THE checkout for a contract, creating it only when none is payable.
   *
   * A contract has at most one payable Checkout Session at a time: an open
   * session is handed back as-is, a completed one is confirmed rather than
   * replaced, and a new one is created only after the old one expired — under a
   * short lease, so two concurrent clicks can't each create one.
   */
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
    const currency = contract.currency.toUpperCase();
    if (!env.SUPPORTED_CURRENCIES.includes(currency)) {
      throw ApiError.conflict(`Payments in ${currency} are not supported`);
    }
    const creatorWallet = await walletRepository.findByUserId(contract.creatorId.toString());
    if (creatorWallet) assertWalletCurrency(creatorWallet, currency);

    let payment = await paymentRepository.findByContractId(contractId);
    if (!payment) {
      const { commissionAmount, creatorAmount } = computeSplit(contract.agreedPrice);
      try {
        payment = await paymentRepository.create({
          contractId,
          campaignId: contract.campaignId.toString(),
          brandId: contract.brandId.toString(),
          creatorId: contract.creatorId.toString(),
          amount: contract.agreedPrice,
          commissionAmount,
          creatorAmount,
          currency,
        });
      } catch (error) {
        // A concurrent request created it first (unique contractId) — use theirs.
        if (!isDuplicateKeyError(error)) throw error;
        payment = await paymentRepository.findByContractId(contractId);
        if (!payment) throw error;
      }
    }
    if (payment.status !== 'PENDING') {
      throw ApiError.conflict('This contract already has an active payment');
    }
    const paymentId = payment._id.toString();

    const existingUrl = await this.reusableCheckoutUrl(payment);
    if (existingUrl) return { checkoutUrl: existingUrl, paymentId };

    const leased = await paymentRepository.takeCheckoutLease(paymentId, CHECKOUT_LEASE_MS);
    if (!leased) {
      // Another request is creating the session right now; wait for it briefly.
      for (let i = 0; i < 12; i += 1) {
        await sleep(250);
        const fresh = await paymentRepository.findDocById(paymentId);
        const url = fresh ? await this.reusableCheckoutUrl(fresh) : null;
        if (url) return { checkoutUrl: url, paymentId };
      }
      throw ApiError.conflict('A checkout is already being prepared. Try again in a moment.');
    }

    try {
      // Re-check under the lease: a session may have landed since the first read.
      const raced = await this.reusableCheckoutUrl(leased);
      if (raced) {
        await paymentRepository.releaseCheckoutLease(paymentId);
        return { checkoutUrl: raced, paymentId };
      }

      const customerId = await this.ensureBrandCustomer(brandUserId, currency);
      const session = await stripeAdapter.createCheckoutSession({
        amount: leased.amount,
        currency: leased.currency,
        productName: `Campaign contract ${contractId}`,
        paymentId,
        contractId,
        brandId: brandUserId,
        creatorId: leased.creatorId.toString(),
        customerId,
        transferGroup: leased.transferGroup ?? `contract-${contractId}`,
        attempt: leased.checkoutAttempt,
      });
      await paymentRepository.setCheckoutSession(paymentId, session.id);
      if (!session.url) throw ApiError.internal('Stripe did not return a checkout URL');
      return { checkoutUrl: session.url, paymentId };
    } catch (error) {
      await paymentRepository.releaseCheckoutLease(paymentId);
      throw error;
    }
  },

  /**
   * The URL of the payment's current session if it can still be paid. A session
   * that already completed is confirmed (idempotently) and reported as paid.
   */
  async reusableCheckoutUrl(payment: IPaymentDocument): Promise<string | null> {
    if (!payment.stripeCheckoutSessionId) return null;
    const session = await stripeAdapter.retrieveCheckoutSession(payment.stripeCheckoutSessionId);
    if (session.status === 'open' && session.url) return session.url;
    if (session.status === 'complete') {
      await this.applyCheckoutSession(session);
      throw ApiError.conflict(
        'This contract has already been paid; the payment is being confirmed'
      );
    }
    return null;
  },

  /** Close the contract's open checkout so a cancelled contract can't be paid. */
  async expireOpenCheckout(contractId: string): Promise<void> {
    if (!isStripeConfigured()) return;
    const payment = await paymentRepository.findByContractId(contractId);
    if (payment?.status !== 'PENDING' || !payment.stripeCheckoutSessionId) return;
    try {
      const session = await stripeAdapter.retrieveCheckoutSession(payment.stripeCheckoutSessionId);
      if (session.status === 'open') {
        await stripeAdapter.expireCheckoutSession(session.id);
      }
    } catch (error) {
      // A session paid in this window is refunded by the funding handler.
      logger.warn('Could not expire checkout session on cancel', {
        contractId,
        error: stripeErrorMessage(error),
      });
    }
  },

  /**
   * Confirm a contract's checkout directly with Stripe. The success page calls
   * this while the webhook is on its way; it applies through the same
   * idempotent handler, so a later webhook is a no-op.
   */
  async syncContractPayment(contractId: string, userId: string): Promise<IPaymentDocument> {
    const payment = await paymentRepository.findByContractId(contractId);
    if (
      !payment ||
      (payment.brandId.toString() !== userId && payment.creatorId.toString() !== userId)
    ) {
      throw ApiError.notFound('Payment not found');
    }
    if (payment.status === 'PENDING' && payment.stripeCheckoutSessionId && isStripeConfigured()) {
      const session = await stripeAdapter.retrieveCheckoutSession(payment.stripeCheckoutSessionId);
      if (session.status === 'complete') await this.applyCheckoutSession(session);
    }
    return (await paymentRepository.findById(payment._id.toString())) ?? payment;
  },

  // --- Funding (webhook / sync / reconciler) ----------------------------------

  /**
   * Apply a paid Checkout Session to its payment — exactly once.
   *
   * Every path that learns "the brand paid" lands here: the webhook, the
   * success-page sync and the reconciler. The PENDING → PAID claim, the wallet
   * credit, both ledger rows and the contract/campaign move commit together in
   * one transaction, and only the request that wins the claim writes anything.
   *
   * Money that doesn't belong to a live payment is never kept silently: a
   * second paid session, an amount/currency mismatch, or a contract cancelled
   * mid-checkout is refunded automatically.
   */
  async applyCheckoutSession(session: CheckoutCompletedSession, eventId?: string): Promise<void> {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) {
      logger.warn('Checkout session without paymentId metadata', { session: session.id });
      return;
    }
    // Async methods (bank debits) complete before the money arrives; wait for
    // checkout.session.async_payment_succeeded.
    if (session.payment_status !== 'paid') return;

    const payment = await paymentRepository.findDocById(paymentId);
    if (!payment || session.metadata?.contractId !== payment.contractId.toString()) {
      logger.error('Paid checkout session does not match a payment', {
        session: session.id,
        paymentId,
      });
      return;
    }
    const paymentIntentId = refId(session.payment_intent);
    if (!paymentIntentId) {
      logger.error('Paid checkout session has no payment intent', { session: session.id });
      return;
    }

    if (payment.status !== 'PENDING') {
      if (payment.stripePaymentIntentId === paymentIntentId) return; // already applied
      // The contract was already paid through another session: refund this one.
      await this.refundStrayCharge(paymentIntentId, `dup-refund-${session.id}`, {
        reason: 'duplicate_checkout',
        paymentId,
      });
      return;
    }

    if (
      session.amount_total !== payment.amount ||
      session.currency?.toUpperCase() !== payment.currency
    ) {
      await this.refundStrayCharge(paymentIntentId, `mismatch-refund-${session.id}`, {
        reason: 'amount_mismatch',
        paymentId,
      });
      await paymentRepository.claim(payment._id, ['PENDING'], {
        set: {
          status: 'FAILED',
          lastError: `Charged ${session.amount_total ?? '?'} ${session.currency ?? '?'}, expected ${payment.amount} ${payment.currency}; refunded`,
        },
      });
      return;
    }

    const intent = await stripeAdapter.retrievePaymentIntent(paymentIntentId);
    const chargeId = refId(intent.latest_charge);

    let funded: IPaymentDocument | null;
    try {
      funded = await withTransaction(async (txn) => {
        const claimed = await paymentRepository.claim(
          payment._id,
          ['PENDING'],
          {
            set: {
              status: 'PAID',
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              ...(chargeId ? { stripeChargeId: chargeId } : {}),
              paidAt: new Date(),
            },
            unset: ['checkoutLockUntil', 'lastError'],
          },
          txn
        );
        if (!claimed) return null; // a concurrent delivery got here first

        const contract = await contractRepository.transitionStatus(
          claimed.contractId,
          ['PENDING_FUNDING'],
          'FUNDED',
          txn
        );
        if (!contract) throw new ContractNotFundableError();
        await campaignRepository.setStatus(claimed.campaignId, 'FUNDED', txn);

        const creatorId = claimed.creatorId.toString();
        const wallet = await walletRepository.ensureForUser(creatorId, claimed.currency, txn);
        assertWalletCurrency(wallet, claimed.currency);
        await walletRepository.creditPending(creatorId, claimed.creatorAmount, txn);
        await transactionRepository.create(
          {
            userId: claimed.creatorId,
            paymentId: claimed._id,
            contractId: claimed.contractId,
            type: 'EARNING',
            amount: claimed.creatorAmount,
            currency: claimed.currency,
            description: `Escrow funded for contract ${claimed.contractId.toString()}`,
          },
          txn
        );
        // The brand's mirror of the same movement. Uses the GROSS amount — what the
        // brand actually paid — so the two sides of the ledger differ by exactly the
        // platform commission.
        await transactionRepository.create(
          {
            userId: claimed.brandId,
            paymentId: claimed._id,
            contractId: claimed.contractId,
            type: 'SPEND',
            amount: -claimed.amount,
            currency: claimed.currency,
            description: `Escrow funded for contract ${claimed.contractId.toString()}`,
          },
          txn
        );
        if (eventId) await stripeEventRepository.record(eventId, 'funding', txn);
        return claimed;
      });
    } catch (error) {
      if (error instanceof ContractNotFundableError) {
        // Cancelled while the brand was on the checkout page: give the money back.
        await this.refundStrayCharge(paymentIntentId, `orphan-refund-${session.id}`, {
          reason: 'contract_not_fundable',
          paymentId,
        });
        await paymentRepository.claim(payment._id, ['PENDING'], {
          set: { status: 'FAILED', lastError: 'Contract was no longer fundable; refunded' },
        });
        return;
      }
      if (isDuplicateKeyError(error)) return; // the event or ledger rows already exist
      throw error;
    }

    if (!funded) return;
    eventBus.emit('payment.received', {
      paymentId,
      contractId: funded.contractId.toString(),
      creatorId: funded.creatorId.toString(),
      amount: funded.creatorAmount,
      currency: funded.currency,
    });
    logger.info('Payment captured (escrow funded)', { paymentId, amount: funded.amount });
  },

  /** Refund a charge that has no live payment to belong to. Idempotent on `key`. */
  async refundStrayCharge(
    paymentIntentId: string,
    key: string,
    metadata: Record<string, string>
  ): Promise<void> {
    const refund = await stripeAdapter.createRefund(paymentIntentId, key, metadata);
    logger.error('Refunded a charge with no live payment', {
      paymentIntentId,
      refundId: refund.id,
      ...metadata,
    });
  },

  // --- Release ---------------------------------------------------------------

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
    return this.executeRelease(payment, contract);
  },

  /**
   * Auto-release invoked by the submissions module right after a brand approves
   * the proof of work. Never throws: when the payout can't go out now (creator
   * not onboarded, a release already in flight, Stripe trouble) the contract
   * stays APPROVED and the brand — or the reconciler — completes it later.
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

    try {
      const released = await this.executeRelease(payment, contract);
      return { released: released.status === 'RELEASED', payment: released };
    } catch (error) {
      logger.warn('Auto-release deferred', { contractId, error: stripeErrorMessage(error) });
      return { released: false, payment };
    }
  },

  /** Verify the destination, claim PAID → RELEASING, then send the Transfer. */
  async executeRelease(
    payment: IPaymentDocument,
    contract: IContractDocument
  ): Promise<IPaymentDocument> {
    const destination = await this.resolvePayoutDestination(payment, contract);
    const claimed = await paymentRepository.claim(payment._id, ['PAID'], {
      set: { status: 'RELEASING', claimedAt: new Date(), destinationAccountId: destination },
      unset: ['lastError'],
      inc: { releaseAttempt: 1 },
    });
    if (!claimed) {
      throw ApiError.conflict('A payout or refund is already in progress for this contract');
    }
    return this.completeRelease(claimed);
  },

  /**
   * Send the Transfer for a RELEASING claim and book it. Safe to call again for
   * the same claim (the reconciler does): the idempotency key, and past its 24h
   * life a lookup by transfer group, return the Transfer already sent.
   */
  async completeRelease(
    payment: IPaymentDocument,
    { reconciling = false }: { reconciling?: boolean } = {}
  ): Promise<IPaymentDocument> {
    const paymentId = payment._id.toString();
    const destination = payment.destinationAccountId;
    if (!destination) throw ApiError.internal('Release claim has no destination account');

    let transferId: string;
    try {
      const existing =
        reconciling && payment.transferGroup
          ? await stripeAdapter.findTransferForPayment(payment.transferGroup, paymentId)
          : null;
      transferId =
        existing?.id ??
        (
          await stripeAdapter.createTransfer({
            amount: payment.creatorAmount,
            currency: payment.currency,
            destination,
            paymentId,
            contractId: payment.contractId.toString(),
            attempt: payment.releaseAttempt,
            ...(payment.transferGroup ? { transferGroup: payment.transferGroup } : {}),
            ...(payment.stripeChargeId ? { sourceTransaction: payment.stripeChargeId } : {}),
          })
        ).id;
    } catch (error) {
      const message = stripeErrorMessage(error);
      if (isDefinitiveStripeFailure(error)) {
        // Nothing was sent; hand the payment back so the payout can be retried.
        await paymentRepository.claim(payment._id, ['RELEASING'], {
          set: { status: 'PAID', lastError: message },
          unset: ['claimedAt'],
        });
        logger.warn('Payout transfer rejected by Stripe', { paymentId, error: message });
        throw ApiError.conflict(`The payout could not be sent: ${message}`);
      }
      // Unknown outcome. Keep the claim; the reconciler retries with the same key.
      logger.error('Payout transfer outcome unknown; will reconcile', {
        paymentId,
        error: message,
      });
      throw ApiError.internal(
        'The payout is being confirmed with Stripe and will complete shortly'
      );
    }

    const released = await withTransaction(async (txn) => {
      const done = await paymentRepository.claim(
        payment._id,
        ['RELEASING'],
        {
          set: { status: 'RELEASED', stripeTransferId: transferId, releasedAt: new Date() },
          unset: ['claimedAt', 'lastError'],
        },
        txn
      );
      if (!done) return null; // already booked by a concurrent completion

      await walletRepository.release(done.creatorId.toString(), done.creatorAmount, txn);
      await transactionRepository.create(
        {
          userId: done.creatorId,
          paymentId: done._id,
          contractId: done.contractId,
          type: 'PAYOUT',
          amount: done.creatorAmount,
          currency: done.currency,
          description: `Payout released for contract ${done.contractId.toString()}`,
        },
        txn
      );
      await contractRepository.transitionStatus(done.contractId, ['APPROVED'], 'COMPLETED', txn);
      await campaignRepository.setStatus(done.campaignId, 'COMPLETED', txn);
      return done;
    });

    if (released) {
      logger.info('Payout released', { paymentId, transferId, destination });
      return released;
    }
    return (await paymentRepository.findDocById(paymentId)) ?? payment;
  },

  // --- Refund ----------------------------------------------------------------

  /** Refund the brand before payout; reverses the escrow credit. */
  async refundPayment(contractId: string, brandUserId: string): Promise<IPaymentDocument> {
    const contract = await contractRepository.findDocById(contractId);
    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.brandId.toString() !== brandUserId) {
      throw ApiError.forbidden('Only the contract owner can request a refund');
    }
    // Proof of work was already accepted. The payout may still be sitting in
    // escrow (auto-release defers when the creator isn't payout-onboarded yet),
    // but the brand no longer gets to take the money back — it must be released.
    if (contract.status === 'APPROVED') {
      throw ApiError.conflict(
        'This delivery was approved; the payout must be released, not refunded'
      );
    }

    const payment = await paymentRepository.findByContractId(contractId);
    if (!payment || payment.status !== 'PAID') {
      throw ApiError.conflict('Only a paid, not-yet-released payment can be refunded');
    }
    if (!payment.stripePaymentIntentId) {
      throw ApiError.conflict('Missing payment intent; cannot refund');
    }

    const claimed = await paymentRepository.claim(payment._id, ['PAID'], {
      set: { status: 'REFUNDING', claimedAt: new Date() },
      unset: ['lastError'],
      inc: { refundAttempt: 1 },
    });
    if (!claimed) {
      throw ApiError.conflict('A payout or refund is already in progress for this contract');
    }
    return this.completeRefund(claimed);
  },

  /** Issue the refund for a REFUNDING claim and book it. Safe to repeat. */
  async completeRefund(
    payment: IPaymentDocument,
    { reconciling = false }: { reconciling?: boolean } = {}
  ): Promise<IPaymentDocument> {
    const paymentId = payment._id.toString();
    const intentId = payment.stripePaymentIntentId;
    if (!intentId) throw ApiError.internal('Refund claim has no payment intent');

    let refundId: string;
    try {
      const existing = reconciling
        ? await stripeAdapter.findRefundForPaymentIntent(intentId)
        : null;
      refundId =
        existing?.id ??
        (
          await stripeAdapter.createRefund(
            intentId,
            `refund-${paymentId}-${payment.refundAttempt}`,
            {
              paymentId,
            }
          )
        ).id;
    } catch (error) {
      const message = stripeErrorMessage(error);
      if (isDefinitiveStripeFailure(error)) {
        await paymentRepository.claim(payment._id, ['REFUNDING'], {
          set: { status: 'PAID', lastError: message },
          unset: ['claimedAt'],
        });
        throw ApiError.conflict(`The refund could not be issued: ${message}`);
      }
      logger.error('Refund outcome unknown; will reconcile', { paymentId, error: message });
      throw ApiError.internal(
        'The refund is being confirmed with Stripe and will complete shortly'
      );
    }

    const refunded = await this.finalizeRefund(payment._id.toString(), ['REFUNDING'], refundId);
    return refunded ?? (await paymentRepository.findDocById(paymentId)) ?? payment;
  },

  /**
   * Book a refund that has happened at Stripe: our own, one issued from the
   * Stripe dashboard, or a lost chargeback. Claims from `from` → REFUNDED, so
   * whichever path reports it first books it and the rest are no-ops.
   */
  async finalizeRefund(
    paymentId: string,
    from: readonly IPaymentDocument['status'][],
    refundId?: string,
    note?: string
  ): Promise<IPaymentDocument | null> {
    return withTransaction(async (txn) => {
      const done = await paymentRepository.claim(
        paymentId,
        from,
        {
          set: {
            status: 'REFUNDED',
            refundedAt: new Date(),
            ...(refundId ? { stripeRefundId: refundId } : {}),
            ...(note ? { lastError: note } : {}),
          },
          unset: ['claimedAt'],
        },
        txn
      );
      if (!done) return null;

      const contractId = done.contractId.toString();
      await walletRepository.reversePending(done.creatorId.toString(), done.creatorAmount, txn);
      await transactionRepository.create(
        {
          userId: done.creatorId,
          paymentId: done._id,
          contractId: done.contractId,
          type: 'REFUND',
          amount: -done.creatorAmount,
          currency: done.currency,
          description: `Escrow reversed (refund) for contract ${contractId}`,
        },
        txn
      );
      // The brand gets the gross charge back, commission included.
      await transactionRepository.create(
        {
          userId: done.brandId,
          paymentId: done._id,
          contractId: done.contractId,
          type: 'REFUND',
          amount: done.amount,
          currency: done.currency,
          description: `Refund received for contract ${contractId}`,
        },
        txn
      );
      await contractRepository.transitionStatus(
        done.contractId,
        OPEN_CONTRACT_STATUSES,
        'CANCELLED',
        txn
      );
      await campaignRepository.setStatus(done.campaignId, 'CANCELLED', txn);
      return done;
    });
  },

  // --- Disputes and refunds made outside the app ------------------------------

  /** A chargeback freezes escrow: no release or refund until it is decided. */
  async handleDisputeCreated(dispute: DisputeObject): Promise<void> {
    const payment = await paymentRepository.findByPaymentIntentOrCharge(
      refId(dispute.payment_intent),
      refId(dispute.charge)
    );
    if (!payment) return;
    if (payment.status !== 'PAID') {
      logger.error('Dispute opened on a payment that is no longer in escrow', {
        paymentId: payment._id.toString(),
        status: payment.status,
        disputeId: dispute.id,
      });
      return;
    }

    await withTransaction(async (txn) => {
      const contract = await contractRepository.findDocById(payment.contractId.toString(), txn);
      const claimed = await paymentRepository.claim(
        payment._id,
        ['PAID'],
        {
          set: {
            status: 'DISPUTED',
            disputedAt: new Date(),
            ...(contract ? { contractStatusBeforeDispute: contract.status } : {}),
          },
        },
        txn
      );
      if (!claimed) return;
      await contractRepository.transitionStatus(
        claimed.contractId,
        OPEN_CONTRACT_STATUSES,
        'DISPUTED',
        txn
      );
      await campaignRepository.setStatus(claimed.campaignId, 'DISPUTED', txn);
    });
    logger.warn('Payment disputed; escrow frozen', {
      paymentId: payment._id.toString(),
      disputeId: dispute.id,
    });
  },

  /** Won → back into escrow where it was. Lost → the brand has the money back. */
  async handleDisputeClosed(dispute: DisputeObject): Promise<void> {
    const payment = await paymentRepository.findByPaymentIntentOrCharge(
      refId(dispute.payment_intent),
      refId(dispute.charge)
    );
    if (payment?.status !== 'DISPUTED') return;

    if (dispute.status === 'lost') {
      await this.finalizeRefund(
        payment._id.toString(),
        ['DISPUTED'],
        undefined,
        `Chargeback lost (${dispute.id})`
      );
      return;
    }

    const previous = isContractStatus(payment.contractStatusBeforeDispute)
      ? payment.contractStatusBeforeDispute
      : 'FUNDED';
    await withTransaction(async (txn) => {
      const restored = await paymentRepository.claim(
        payment._id,
        ['DISPUTED'],
        { set: { status: 'PAID' }, unset: ['disputedAt', 'contractStatusBeforeDispute'] },
        txn
      );
      if (!restored) return;
      await contractRepository.transitionStatus(restored.contractId, ['DISPUTED'], previous, txn);
      if (isCampaignStatus(previous)) {
        await campaignRepository.setStatus(restored.campaignId, previous, txn);
      }
    });
  },

  /** A full refund issued from the Stripe dashboard is booked like our own. */
  async handleChargeRefunded(charge: ChargeObject): Promise<void> {
    const payment = await paymentRepository.findByPaymentIntentOrCharge(
      refId(charge.payment_intent),
      charge.id
    );
    if (!payment) return; // e.g. our own refund of a stray/duplicate charge
    if (charge.amount_refunded < charge.amount) {
      logger.error('Partial refund on an escrow charge needs manual review', {
        paymentId: payment._id.toString(),
        refunded: charge.amount_refunded,
        amount: charge.amount,
      });
      return;
    }
    if (payment.status === 'RELEASED' || payment.status === 'RELEASING') {
      logger.error('Charge refunded after the payout was released; platform is short', {
        paymentId: payment._id.toString(),
      });
      return;
    }
    await this.finalizeRefund(
      payment._id.toString(),
      ['PAID', 'REFUNDING', 'DISPUTED'],
      refId(charge.refunds?.data[0])
    );
  },

  async handleAccountUpdated(account: AccountUpdatedObject): Promise<void> {
    const wallet = await walletRepository.findByStripeAccountId(account.id);
    if (!wallet) return;
    const boundTo = account.metadata?.userId;
    if (boundTo && boundTo !== wallet.userId.toString()) {
      logger.error('account.updated for an account bound to another user; ignored', {
        accountId: account.id,
      });
      return;
    }
    await walletRepository.setOnboardingStatus(
      account.id,
      account.payouts_enabled === true && account.capabilities?.transfers === 'active',
      account.details_submitted ?? false
    );
  },

  // --- Webhook dispatch -------------------------------------------------------

  /**
   * Apply a verified Stripe event once. Events already recorded are skipped; a
   * re-delivery racing the first is stopped by the atomic claims inside each
   * handler. A handler that throws leaves the event unrecorded, so Stripe's
   * retry (on our 5xx) runs it again.
   */
  async processWebhookEvent(event: StripeEvent): Promise<void> {
    if (await stripeEventRepository.isProcessed(event.id)) return;

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await this.applyCheckoutSession(event.data.object, event.id);
        break;
      case 'checkout.session.async_payment_failed':
        logger.warn('Checkout payment failed', { session: event.data.object.id });
        break;
      case 'checkout.session.expired':
        // Nothing to undo: createCheckout replaces expired sessions on demand.
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;
      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object);
        break;
      case 'charge.dispute.closed':
        await this.handleDisputeClosed(event.data.object);
        break;
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;
      default:
        logger.debug('Unhandled Stripe event', { type: event.type });
    }

    try {
      await stripeEventRepository.record(event.id, event.type);
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  },

  // --- Reconciler ------------------------------------------------------------

  /**
   * Repair anything a crash, a timeout or a lost webhook left half-done:
   * paid sessions nobody applied, and payout/refund claims that never finished.
   * Every repair goes through the same idempotent paths, so running this on
   * several instances at once can't move money twice.
   */
  async reconcile(): Promise<{ funded: number; released: number; refunded: number }> {
    const result = { funded: 0, released: 0, refunded: 0 };
    if (!isStripeConfigured()) return result;
    const now = Date.now();
    const staleBefore = new Date(now - STALE_AFTER_MS);

    const pending = await paymentRepository.findStalePending(staleBefore, SWEEP_BATCH);
    for (const payment of pending) {
      if (payment.updatedAt.getTime() < now - SWEEP_WINDOW_MS || !payment.stripeCheckoutSessionId) {
        continue;
      }
      try {
        const session = await stripeAdapter.retrieveCheckoutSession(
          payment.stripeCheckoutSessionId
        );
        if (session.status === 'complete' && session.payment_status === 'paid') {
          await this.applyCheckoutSession(session);
          result.funded += 1;
        }
      } catch (error) {
        logger.warn('Reconcile: checkout check failed', {
          paymentId: payment._id.toString(),
          error: stripeErrorMessage(error),
        });
      }
    }

    for (const payment of await paymentRepository.findStaleClaims(
      'RELEASING',
      staleBefore,
      SWEEP_BATCH
    )) {
      try {
        const done = await this.completeRelease(payment, { reconciling: true });
        if (done.status === 'RELEASED') result.released += 1;
      } catch (error) {
        logger.warn('Reconcile: release retry failed', {
          paymentId: payment._id.toString(),
          error: stripeErrorMessage(error),
        });
      }
    }

    for (const payment of await paymentRepository.findStaleClaims(
      'REFUNDING',
      staleBefore,
      SWEEP_BATCH
    )) {
      try {
        const done = await this.completeRefund(payment, { reconciling: true });
        if (done.status === 'REFUNDED') result.refunded += 1;
      } catch (error) {
        logger.warn('Reconcile: refund retry failed', {
          paymentId: payment._id.toString(),
          error: stripeErrorMessage(error),
        });
      }
    }

    return result;
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
    return walletRepository.ensureForUser(creatorId, defaultCurrency());
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
