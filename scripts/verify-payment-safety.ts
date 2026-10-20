/**
 * Verify the payment-safety guarantees against REAL Stripe test mode + Atlas.
 *
 *   pnpm tsx scripts/verify-payment-safety.ts
 *
 * Drives the money path the way production does — concurrent requests, signed
 * webhooks over HTTP, replays, and failure injection — and asserts that money
 * is never counted twice, never kept without a live payment, and always paid to
 * the contract's creator.
 *
 * The payout checks need a creator with an ACTIVE Connect account. Completing
 * Express KYC needs a browser, so they reuse the seeded `maya@demo` creator whose
 * account was onboarded by hand. Their wallet is snapshotted first and restored
 * in `finally`; everything else this script creates is namespaced and deleted.
 */
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { Types } from 'mongoose';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { getStripe } from '@/config/stripe';
import { createApp } from '@/app';
import { hashPassword } from '@/utils/password';
import { UserModel } from '@/modules/users/user.model';
import { AuthProvider } from '@/modules/users/user.types';
import { CampaignModel } from '@/modules/campaigns/campaign.model';
import { ContractModel } from '@/modules/contracts/contract.model';
import { contractService } from '@/modules/contracts/contract.service';
import { PaymentModel } from '@/modules/payments/payment.model';
import { TransactionModel } from '@/modules/payments/transaction.model';
import { WalletModel } from '@/modules/payments/wallet.model';
import { StripeEventModel } from '@/modules/payments/stripe-event.model';
import { NotificationModel } from '@/modules/notifications/notification.model';
import { paymentService } from '@/modules/payments/payment.service';
import { paymentRepository } from '@/modules/payments/payment.repository';
import { stripeAdapter } from '@/modules/payments/payment.stripe';
import type { DisputeObject } from '@/modules/payments/payment.stripe';
import type { ContractStatus } from '@/modules/contracts/contract.types';
import {
  createPaidPaymentIntent,
  eventEnvelope,
  paidSession,
  signPayload,
} from './lib/stripe-test';

const DOMAIN = '@test.local';
const PREFIX = 'pay-safety-';
const PAYOUT_CREATOR_EMAIL = 'maya@demo.creatormarket.dev';
const AGREED = 50_000; // $500.00 — small, so the test balance isn't drained

let passed = 0;
let failed = 0;
let skipped = 0;

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    passed += 1;
    logger.info(`PASS  ${name}${detail ? `  (${detail})` : ''}`);
  } else {
    failed += 1;
    logger.error(`FAIL  ${name}${detail ? `  (${detail})` : ''}`);
  }
}

function skip(name: string, why: string): void {
  skipped += 1;
  logger.warn(`SKIP  ${name}  (${why})`);
}

const created = {
  users: [] as Types.ObjectId[],
  campaigns: [] as Types.ObjectId[],
  contracts: [] as Types.ObjectId[],
  eventIds: [] as string[],
};

async function errorOf(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function makeUser(label: string, role: 'BRAND' | 'CREATOR'): Promise<string> {
  const user = await UserModel.create({
    name: `Pay Safety ${role} ${label}`,
    email: `${PREFIX}${role.toLowerCase()}-${label}${DOMAIN}`,
    role,
    isVerified: true,
    provider: AuthProvider.LOCAL,
    password: await hashPassword('PaySafety123!'),
  });
  created.users.push(user._id);
  return user._id.toString();
}

/** campaign + contract, PENDING_FUNDING unless told otherwise. */
async function makeContract(
  label: string,
  brandId: string,
  creatorId: string,
  status: ContractStatus = 'PENDING_FUNDING'
): Promise<string> {
  const campaign = await CampaignModel.create({
    brandId,
    title: `Payment safety (${label})`,
    description: 'Temporary campaign created by verify-payment-safety.ts.',
    assetType: 'INSTAGRAM_REEL',
    platform: 'INSTAGRAM',
    duration: 14,
    budgetMin: AGREED,
    budgetMax: AGREED,
    currency: 'USD',
    status: 'NEGOTIATION',
  });
  created.campaigns.push(campaign._id);
  const contract = await ContractModel.create({
    applicationId: new Types.ObjectId(),
    campaignId: campaign._id,
    brandId,
    creatorId,
    assetType: 'INSTAGRAM_REEL',
    platform: 'INSTAGRAM',
    agreedPrice: AGREED,
    currency: 'USD',
    deliverables: [{ description: 'One reel', completed: false }],
    timeline: { durationDays: 14 },
    status,
  });
  created.contracts.push(contract._id);
  return contract._id.toString();
}

/** Create the payment through the real checkout path, then fund it with a real PI. */
async function fund(
  contractId: string,
  brandId: string
): Promise<{ paymentId: string; intentId: string; chargeId: string }> {
  const { paymentId } = await paymentService.createCheckout(contractId, brandId);
  const intent = await createPaidPaymentIntent(
    AGREED,
    { paymentId, contractId },
    `contract-${contractId}`
  );
  await paymentService.applyCheckoutSession(
    paidSession({
      sessionId: `cs_test_fund_${paymentId}`,
      paymentId,
      contractId,
      paymentIntentId: intent.id,
      amount: AGREED,
    })
  );
  const chargeId =
    typeof intent.latest_charge === 'string'
      ? intent.latest_charge
      : (intent.latest_charge?.id ?? '');
  return { paymentId, intentId: intent.id, chargeId };
}

async function ledger(paymentId: string, type: string): Promise<number> {
  return TransactionModel.countDocuments({ paymentId, type });
}

async function pending(userId: string): Promise<number> {
  return (await WalletModel.findOne({ userId }).lean())?.pendingBalance ?? 0;
}

async function refundsFor(intentId: string): Promise<number> {
  return (await getStripe().refunds.list({ payment_intent: intentId, limit: 20 })).data.length;
}

async function transfersFor(contractId: string): Promise<string[]> {
  const page = await getStripe().transfers.list({
    transfer_group: `contract-${contractId}`,
    limit: 20,
  });
  return page.data.map((t) => t.id);
}

async function startServer(): Promise<{ server: Server; webhookUrl: string }> {
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return { server, webhookUrl: `http://127.0.0.1:${port}${env.API_PREFIX}/payments/webhook` };
}

async function postEvent(webhookUrl: string, payload: string, signature?: string): Promise<number> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature ?? signPayload(payload, env.STRIPE_WEBHOOK_SECRET ?? ''),
    },
    body: payload,
  });
  return res.status;
}

async function main(): Promise<void> {
  if (!env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Needs STRIPE_SECRET_KEY (test mode) and STRIPE_WEBHOOK_SECRET');
  }
  await connectDatabase();
  const { server, webhookUrl } = await startServer();

  const payoutCreator = await UserModel.findOne({ email: PAYOUT_CREATOR_EMAIL }).lean();
  const payoutWallet = payoutCreator
    ? await WalletModel.findOne({ userId: payoutCreator._id }).lean()
    : null;
  const snapshot = payoutWallet
    ? {
        pendingBalance: payoutWallet.pendingBalance,
        availableBalance: payoutWallet.availableBalance,
        totalEarned: payoutWallet.totalEarned,
      }
    : null;

  try {
    const brandId = await makeUser('brand', 'BRAND');
    const creatorId = await makeUser('creator', 'CREATOR');

    // ── 1. Commission is the configured 2% ───────────────────────────────────
    const cFee = await makeContract('fee', brandId, creatorId);
    const concurrent = await Promise.all([
      paymentService.createCheckout(cFee, brandId),
      paymentService.createCheckout(cFee, brandId),
      paymentService.createCheckout(cFee, brandId),
    ]);
    const feePayment = await PaymentModel.findOne({ contractId: cFee }).lean();
    check(
      'commission is PLATFORM_COMMISSION_PERCENT (2%) of the agreed price',
      env.PLATFORM_COMMISSION_PERCENT === 2 &&
        feePayment?.commissionAmount === Math.round(AGREED * 0.02) &&
        feePayment.creatorAmount === AGREED - feePayment.commissionAmount,
      `${feePayment?.commissionAmount} / ${feePayment?.creatorAmount}`
    );

    // ── 2. One payable checkout per contract ────────────────────────────────
    const urls = new Set(concurrent.map((c) => c.checkoutUrl));
    check('three concurrent checkouts return ONE session', urls.size === 1);
    check('only one session was created', feePayment?.checkoutAttempt === 1);
    check(
      'one payment row per contract',
      (await PaymentModel.countDocuments({ contractId: cFee })) === 1
    );
    const again = await paymentService.createCheckout(cFee, brandId);
    check(
      'a later checkout reuses the open session',
      again.checkoutUrl === concurrent[0]?.checkoutUrl
    );

    if (feePayment?.stripeCheckoutSessionId) {
      await stripeAdapter.expireCheckoutSession(feePayment.stripeCheckoutSessionId);
    }
    const renewed = await paymentService.createCheckout(cFee, brandId);
    const renewedPayment = await PaymentModel.findOne({ contractId: cFee }).lean();
    check(
      'an expired session is replaced by a new one',
      renewed.checkoutUrl !== again.checkoutUrl && renewedPayment?.checkoutAttempt === 2
    );
    const bound = renewedPayment?.stripeCheckoutSessionId
      ? await stripeAdapter.retrieveCheckoutSession(renewedPayment.stripeCheckoutSessionId)
      : null;
    const brandWallet = await WalletModel.findOne({ userId: brandId }).lean();
    check(
      'the session is bound to the brand customer and the contract',
      Boolean(bound?.customer) &&
        bound?.customer === brandWallet?.stripeCustomerId &&
        bound?.client_reference_id === cFee
    );

    // ── 3. Signed webhook, delivered twice at once, applies once ────────────
    const paymentId = feePayment?._id.toString() ?? '';
    const intent = await createPaidPaymentIntent(
      AGREED,
      { paymentId, contractId: cFee },
      `contract-${cFee}`
    );
    const session = paidSession({
      sessionId: renewedPayment?.stripeCheckoutSessionId ?? 'cs_missing',
      paymentId,
      contractId: cFee,
      paymentIntentId: intent.id,
      amount: AGREED,
    });
    const eventId = `evt_test_${new Types.ObjectId().toString()}`;
    created.eventIds.push(eventId);
    const payload = eventEnvelope(eventId, 'checkout.session.completed', session);
    const before = await pending(creatorId);
    const statuses = await Promise.all([
      postEvent(webhookUrl, payload),
      postEvent(webhookUrl, payload),
      postEvent(webhookUrl, payload),
    ]);
    check(
      'every delivery is acknowledged 200',
      statuses.every((s) => s === 200),
      statuses.join(',')
    );
    const paid = await PaymentModel.findById(paymentId).lean();
    check(
      'payment is PAID with the charge recorded',
      paid?.status === 'PAID' && Boolean(paid.stripeChargeId)
    );
    check('exactly one EARNING row', (await ledger(paymentId, 'EARNING')) === 1);
    check('exactly one SPEND row', (await ledger(paymentId, 'SPEND')) === 1);
    check(
      'creator escrow credited exactly once',
      (await pending(creatorId)) - before === (paid?.creatorAmount ?? -1)
    );
    check('contract is FUNDED', (await ContractModel.findById(cFee).lean())?.status === 'FUNDED');
    check('the event is recorded once', (await StripeEventModel.countDocuments({ eventId })) === 1);

    const replayId = `evt_test_${new Types.ObjectId().toString()}`;
    created.eventIds.push(replayId);
    await postEvent(webhookUrl, eventEnvelope(replayId, 'checkout.session.completed', session));
    check(
      'a re-sent event with a new id changes nothing',
      (await ledger(paymentId, 'EARNING')) === 1 &&
        (await pending(creatorId)) - before === (paid?.creatorAmount ?? -1)
    );

    check(
      'a bad signature is rejected with 400',
      (await postEvent(webhookUrl, payload, 't=1,v1=deadbeef')) === 400
    );

    // ── 4. Money that doesn't belong to a live payment is refunded ──────────
    const strayIntent = await createPaidPaymentIntent(AGREED, { paymentId, contractId: cFee });
    await paymentService.applyCheckoutSession(
      paidSession({
        sessionId: `cs_test_second_${paymentId}`,
        paymentId,
        contractId: cFee,
        paymentIntentId: strayIntent.id,
        amount: AGREED,
      })
    );
    check(
      'a second paid session is refunded automatically',
      (await refundsFor(strayIntent.id)) === 1
    );
    check(
      'the second session books nothing',
      (await ledger(paymentId, 'EARNING')) === 1 &&
        (await PaymentModel.findById(paymentId).lean())?.stripePaymentIntentId === intent.id
    );

    const cMismatch = await makeContract('mismatch', brandId, creatorId);
    const mm = await paymentService.createCheckout(cMismatch, brandId);
    const mmIntent = await createPaidPaymentIntent(AGREED - 1, {
      paymentId: mm.paymentId,
      contractId: cMismatch,
    });
    await paymentService.applyCheckoutSession(
      paidSession({
        sessionId: `cs_test_mismatch_${mm.paymentId}`,
        paymentId: mm.paymentId,
        contractId: cMismatch,
        paymentIntentId: mmIntent.id,
        amount: AGREED - 1,
      })
    );
    check(
      'a wrong amount is refunded and the payment FAILED',
      (await refundsFor(mmIntent.id)) === 1 &&
        (await PaymentModel.findById(mm.paymentId).lean())?.status === 'FAILED' &&
        (await ledger(mm.paymentId, 'EARNING')) === 0
    );

    const cCancel = await makeContract('cancel', brandId, creatorId);
    const cc = await paymentService.createCheckout(cCancel, brandId);
    await contractService.cancel(cCancel, brandId);
    const ccPayment = await PaymentModel.findById(cc.paymentId).lean();
    const ccSession = ccPayment?.stripeCheckoutSessionId
      ? await stripeAdapter.retrieveCheckoutSession(ccPayment.stripeCheckoutSessionId)
      : null;
    check('cancelling a contract expires its checkout', ccSession?.status === 'expired');
    const ccIntent = await createPaidPaymentIntent(AGREED, {
      paymentId: cc.paymentId,
      contractId: cCancel,
    });
    await paymentService.applyCheckoutSession(
      paidSession({
        sessionId: `cs_test_cancelled_${cc.paymentId}`,
        paymentId: cc.paymentId,
        contractId: cCancel,
        paymentIntentId: ccIntent.id,
        amount: AGREED,
      })
    );
    check(
      'a payment for a cancelled contract is refunded, nothing booked',
      (await refundsFor(ccIntent.id)) === 1 &&
        (await PaymentModel.findById(cc.paymentId).lean())?.status === 'FAILED' &&
        (await ContractModel.findById(cCancel).lean())?.status === 'CANCELLED' &&
        (await ledger(cc.paymentId, 'EARNING')) === 0
    );

    // ── 5. Refund: double click refunds once ────────────────────────────────
    const cRefund = await makeContract('refund', brandId, creatorId);
    const rf = await fund(cRefund, brandId);
    const pendingBeforeRefund = await pending(creatorId);
    const refundResults = await Promise.allSettled([
      paymentService.refundPayment(cRefund, brandId),
      paymentService.refundPayment(cRefund, brandId),
    ]);
    check(
      'two concurrent refunds: one succeeds, one is refused',
      refundResults.filter((r) => r.status === 'fulfilled').length === 1
    );
    check('Stripe holds exactly one refund', (await refundsFor(rf.intentId)) === 1);
    const refunded = await PaymentModel.findById(rf.paymentId).lean();
    check(
      'payment REFUNDED, both REFUND rows written once',
      refunded?.status === 'REFUNDED' && (await ledger(rf.paymentId, 'REFUND')) === 2
    );
    check(
      'creator escrow reversed exactly once',
      pendingBeforeRefund - (await pending(creatorId)) === (refunded?.creatorAmount ?? -1)
    );

    // ── 6. Disputes freeze escrow ───────────────────────────────────────────
    const cDispute = await makeContract('dispute-won', brandId, creatorId);
    const dw = await fund(cDispute, brandId);
    const dispute = (status: string) =>
      ({
        id: `dp_test_${dw.paymentId}`,
        object: 'dispute',
        charge: dw.chargeId,
        payment_intent: dw.intentId,
        status,
      }) as unknown as DisputeObject;
    await paymentService.handleDisputeCreated(dispute('needs_response'));
    check(
      'a dispute moves payment and contract to DISPUTED',
      (await PaymentModel.findById(dw.paymentId).lean())?.status === 'DISPUTED' &&
        (await ContractModel.findById(cDispute).lean())?.status === 'DISPUTED'
    );
    check(
      'a disputed payment cannot be refunded',
      (await errorOf(() => paymentService.refundPayment(cDispute, brandId))) !== null
    );
    await paymentService.handleDisputeClosed(dispute('won'));
    check(
      'a won dispute returns the money to escrow and the contract to FUNDED',
      (await PaymentModel.findById(dw.paymentId).lean())?.status === 'PAID' &&
        (await ContractModel.findById(cDispute).lean())?.status === 'FUNDED'
    );

    const cLost = await makeContract('dispute-lost', brandId, creatorId);
    const dl = await fund(cLost, brandId);
    const lost = (status: string) =>
      ({
        id: `dp_test_${dl.paymentId}`,
        object: 'dispute',
        charge: dl.chargeId,
        payment_intent: dl.intentId,
        status,
      }) as unknown as DisputeObject;
    await paymentService.handleDisputeCreated(lost('needs_response'));
    await paymentService.handleDisputeClosed(lost('lost'));
    check(
      'a lost dispute books the refund and cancels the contract',
      (await PaymentModel.findById(dl.paymentId).lean())?.status === 'REFUNDED' &&
        (await ledger(dl.paymentId, 'REFUND')) === 2 &&
        (await ContractModel.findById(cLost).lean())?.status === 'CANCELLED'
    );

    // ── 7. A refund issued from the Stripe dashboard is booked once ─────────
    const cDash = await makeContract('dashboard-refund', brandId, creatorId);
    const dr = await fund(cDash, brandId);
    await getStripe().refunds.create({ payment_intent: dr.intentId });
    const charge = await getStripe().charges.retrieve(dr.chargeId);
    await paymentService.handleChargeRefunded(charge);
    await paymentService.handleChargeRefunded(charge);
    check(
      'a dashboard refund is booked, and only once',
      (await PaymentModel.findById(dr.paymentId).lean())?.status === 'REFUNDED' &&
        (await ledger(dr.paymentId, 'REFUND')) === 2
    );

    // ── 8. Payouts reach the contract's creator, once ───────────────────────
    const account = payoutWallet?.stripeAccountId
      ? await stripeAdapter.retrieveAccount(payoutWallet.stripeAccountId)
      : null;
    const payoutReady =
      payoutCreator && account?.payouts_enabled && account.capabilities?.transfers === 'active';

    if (!payoutReady || !payoutCreator) {
      skip('payout checks', `no ACTIVE Connect account on ${PAYOUT_CREATOR_EMAIL}`);
    } else {
      const payoutCreatorId = payoutCreator._id.toString();
      const cRelease = await makeContract('release', brandId, payoutCreatorId);
      const rl = await fund(cRelease, brandId);
      await ContractModel.updateOne({ _id: cRelease }, { status: 'APPROVED' });
      const pendingBefore = await pending(payoutCreatorId);
      const outcomes = await Promise.allSettled([
        paymentService.releasePayment(cRelease, brandId),
        paymentService.releaseForApprovedContract(cRelease),
        paymentService.releasePayment(cRelease, brandId),
      ]);
      const transfers = await transfersFor(cRelease);
      check(
        'three concurrent releases send ONE transfer',
        transfers.length === 1,
        transfers.join(',')
      );
      check(
        'the other attempts are refused or deferred',
        outcomes.filter((o) => o.status === 'rejected').length >= 1
      );
      const released = await PaymentModel.findById(rl.paymentId).lean();
      check(
        "the payout went to the contract creator's account",
        released?.status === 'RELEASED' &&
          released.destinationAccountId === account.id &&
          released.stripeTransferId === transfers[0]
      );
      const transfer = transfers[0] ? await getStripe().transfers.retrieve(transfers[0]) : null;
      check(
        'the transfer is the creator share, sourced from the funding charge',
        transfer?.amount === released?.creatorAmount &&
          transfer?.destination === account.id &&
          (typeof transfer?.source_transaction === 'string'
            ? transfer.source_transaction
            : transfer?.source_transaction?.id) === rl.chargeId
      );
      check(
        'PAYOUT row written once, escrow moved once',
        (await ledger(rl.paymentId, 'PAYOUT')) === 1 &&
          pendingBefore - (await pending(payoutCreatorId)) === (released?.creatorAmount ?? -1)
      );
      check(
        'contract COMPLETED',
        (await ContractModel.findById(cRelease).lean())?.status === 'COMPLETED'
      );
      const rebound = await stripeAdapter.retrieveAccount(account.id);
      check(
        'the connected account is bound to its creator',
        rebound.metadata?.userId === payoutCreatorId
      );

      // ── 9. Reconciler finishes an interrupted payout without paying twice ──
      const cRecon = await makeContract('reconcile', brandId, payoutCreatorId);
      const rc = await fund(cRecon, brandId);
      await ContractModel.updateOne({ _id: cRecon }, { status: 'APPROVED' });
      const claim = await paymentRepository.claim(rc.paymentId, ['PAID'], {
        set: {
          status: 'RELEASING',
          claimedAt: new Date(Date.now() - 10 * 60 * 1000),
          destinationAccountId: account.id,
        },
        inc: { releaseAttempt: 1 },
      });
      // The process "died" after Stripe accepted the transfer.
      const sent = await stripeAdapter.createTransfer({
        amount: claim?.creatorAmount ?? 0,
        currency: 'USD',
        destination: account.id,
        paymentId: rc.paymentId,
        contractId: cRecon,
        attempt: claim?.releaseAttempt ?? 1,
        transferGroup: `contract-${cRecon}`,
        sourceTransaction: rc.chargeId,
      });
      await paymentService.reconcile();
      const recon = await PaymentModel.findById(rc.paymentId).lean();
      const reconTransfers = await transfersFor(cRecon);
      check(
        'the reconciler books the transfer that already went out',
        recon?.status === 'RELEASED' && recon.stripeTransferId === sent.id
      );
      check('and does not send a second one', reconTransfers.length === 1);
      check('PAYOUT row written once', (await ledger(rc.paymentId, 'PAYOUT')) === 1);

      // A payout to anyone but the contract creator is refused outright.
      const cWrong = await makeContract('wrong-creator', brandId, creatorId);
      const wr = await fund(cWrong, brandId);
      await ContractModel.updateOne({ _id: cWrong }, { status: 'APPROVED' });
      await WalletModel.updateOne({ userId: creatorId }, { $set: { payoutsEnabled: true } });
      const wrongErr = await errorOf(() => paymentService.releasePayment(cWrong, brandId));
      check(
        'a creator without their own account cannot be paid',
        wrongErr !== null &&
          (await PaymentModel.findById(wr.paymentId).lean())?.status === 'PAID' &&
          (await transfersFor(cWrong)).length === 0,
        wrongErr ?? ''
      );
    }

    // ── 10. Books balance for the test creator ──────────────────────────────
    const livePaid = await PaymentModel.find({
      creatorId,
      status: { $in: ['PAID', 'DISPUTED'] },
    }).lean();
    const expectedPending = livePaid.reduce((sum, p) => sum + p.creatorAmount, 0);
    check(
      'creator pending balance equals the creator share of payments still in escrow',
      (await pending(creatorId)) === expectedPending,
      `${await pending(creatorId)} vs ${expectedPending}`
    );
  } finally {
    await cleanup(snapshot, payoutCreator?._id);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
    logger.info(`verify-payment-safety: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

async function cleanup(
  snapshot: { pendingBalance: number; availableBalance: number; totalEarned: number } | null,
  payoutCreatorId: Types.ObjectId | undefined
): Promise<void> {
  const payments = await PaymentModel.find({ contractId: { $in: created.contracts } })
    .select('_id')
    .lean();
  const paymentIds = payments.map((p) => p._id);
  await Promise.all([
    TransactionModel.deleteMany({ paymentId: { $in: paymentIds } }),
    PaymentModel.deleteMany({ _id: { $in: paymentIds } }),
    ContractModel.deleteMany({ _id: { $in: created.contracts } }),
    CampaignModel.deleteMany({ _id: { $in: created.campaigns } }),
    StripeEventModel.deleteMany({ eventId: { $in: created.eventIds } }),
    NotificationModel.deleteMany({
      $or: [
        { userId: { $in: created.users } },
        { 'data.paymentId': { $in: paymentIds.map((id) => id.toString()) } },
      ],
    }),
    WalletModel.deleteMany({ userId: { $in: created.users } }),
  ]);
  if (snapshot && payoutCreatorId) {
    await WalletModel.updateOne({ userId: payoutCreatorId }, { $set: snapshot });
  }
  await UserModel.deleteMany({ _id: { $in: created.users } });
  await UserModel.deleteMany({ email: { $regex: `^${PREFIX}.*${DOMAIN.replace('.', '\\.')}$` } });
}

main().catch((error: unknown) => {
  logger.error('verify-payment-safety crashed', {
    error: error instanceof Error ? error.stack : error,
  });
  process.exitCode = 1;
});
