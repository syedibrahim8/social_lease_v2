/**
 * Verification for the surgical backend changes behind the Vault frontend.
 *
 *   pnpm tsx scripts/verify-vault-backend.ts
 *
 * Drives the real services against the real database. Every document it creates
 * is tracked and removed in a `finally` block, and all users are namespaced
 * `vault-test-*@test.local` so nothing else is ever touched.
 *
 * Covers spec §8.1 (refund guard) and §8.2 (brand-side ledger).
 */
import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';
import { hashPassword } from '@/utils/password';
import { UserModel } from '@/modules/users/user.model';
import { AuthProvider } from '@/modules/users/user.types';
import { CampaignModel } from '@/modules/campaigns/campaign.model';
import { ContractModel } from '@/modules/contracts/contract.model';
import { PaymentModel } from '@/modules/payments/payment.model';
import { TransactionModel } from '@/modules/payments/transaction.model';
import { WalletModel } from '@/modules/payments/wallet.model';
import { paymentService } from '@/modules/payments/payment.service';
import type { ContractStatus } from '@/modules/contracts/contract.types';
import type { PaymentStatus } from '@/modules/payments/payment.types';

const DOMAIN = '@test.local';
const PREFIX = 'vault-test-';

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean): void {
  if (ok) {
    passed += 1;
    logger.info(`PASS  ${name}`);
  } else {
    failed += 1;
    logger.error(`FAIL  ${name}`);
  }
}

/** Everything created by this script, removed in the finally block. */
const created = {
  users: [] as Types.ObjectId[],
  campaigns: [] as Types.ObjectId[],
  contracts: [] as Types.ObjectId[],
  payments: [] as Types.ObjectId[],
};

interface Fixture {
  brandId: string;
  creatorId: string;
  contractId: string;
  paymentId: string;
  grossAmount: number;
  commissionAmount: number;
  creatorAmount: number;
}

/**
 * Build a complete brand → campaign → contract → payment chain at the given
 * statuses. `applicationId` is a free-standing ObjectId: the contract only
 * references it, and no code path under test reads the application back.
 */
async function seedChain(
  label: string,
  contractStatus: ContractStatus,
  paymentStatus: PaymentStatus
): Promise<Fixture> {
  const password = await hashPassword('VaultTest123!');

  const [brand, creator] = await UserModel.create([
    {
      name: 'Vault Test Brand',
      email: `${PREFIX}brand-${label}${DOMAIN}`,
      role: 'BRAND',
      isVerified: true,
      provider: AuthProvider.LOCAL,
      password,
    },
    {
      name: 'Vault Test Creator',
      email: `${PREFIX}creator-${label}${DOMAIN}`,
      role: 'CREATOR',
      isVerified: true,
      provider: AuthProvider.LOCAL,
      password,
    },
  ]);
  if (!brand || !creator) throw new Error('Failed to seed users');
  created.users.push(brand._id, creator._id);

  const campaign = await CampaignModel.create({
    brandId: brand._id,
    title: `Vault verification campaign (${label})`,
    description: 'Temporary campaign created by verify-vault-backend.ts.',
    assetType: 'INSTAGRAM_REEL',
    platform: 'INSTAGRAM',
    duration: 30,
    budgetMin: 100_000,
    budgetMax: 900_000,
    currency: 'USD',
    requirements: ['One reel', 'Analytics screenshot'],
    status: 'FUNDED',
  });
  created.campaigns.push(campaign._id);

  const agreedPrice = 500_000; // $5,000.00 in minor units
  const contract = await ContractModel.create({
    applicationId: new Types.ObjectId(),
    campaignId: campaign._id,
    brandId: brand._id,
    creatorId: creator._id,
    assetType: 'INSTAGRAM_REEL',
    platform: 'INSTAGRAM',
    agreedPrice,
    currency: 'USD',
    deliverables: [{ description: 'One Instagram reel', completed: false }],
    timeline: { durationDays: 30 },
    status: contractStatus,
  });
  created.contracts.push(contract._id);

  const commissionAmount = Math.round((agreedPrice * 10) / 100);
  const creatorAmount = agreedPrice - commissionAmount;
  const payment = await PaymentModel.create({
    contractId: contract._id,
    campaignId: campaign._id,
    brandId: brand._id,
    creatorId: creator._id,
    amount: agreedPrice,
    commissionAmount,
    creatorAmount,
    currency: 'USD',
    status: paymentStatus,
    stripePaymentIntentId: 'pi_vault_verification',
  });
  created.payments.push(payment._id);

  return {
    brandId: brand._id.toString(),
    creatorId: creator._id.toString(),
    contractId: contract._id.toString(),
    paymentId: payment._id.toString(),
    grossAmount: agreedPrice,
    commissionAmount,
    creatorAmount,
  };
}

async function cleanup(): Promise<void> {
  await Promise.all([
    WalletModel.deleteMany({ userId: { $in: created.users } }),
    TransactionModel.deleteMany({ paymentId: { $in: created.payments } }),
    PaymentModel.deleteMany({ _id: { $in: created.payments } }),
    ContractModel.deleteMany({ _id: { $in: created.contracts } }),
    CampaignModel.deleteMany({ _id: { $in: created.campaigns } }),
  ]);
  await UserModel.deleteMany({ _id: { $in: created.users } });
  // Belt and braces: remove any stray namespaced user from an aborted run.
  await UserModel.deleteMany({ email: { $regex: `^${PREFIX}.*${DOMAIN}$` } });
}

async function main(): Promise<void> {
  await connectDatabase();
  try {
    // ── §8.1 — a refund must be refused once the delivery has been approved.
    const approved = await seedChain('refund-guard', 'APPROVED', 'PAID');

    let rejected = false;
    let message = '(no error thrown — the refund went through)';
    try {
      await paymentService.refundPayment(approved.contractId, approved.brandId);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
      rejected = /approved/i.test(message);
    }
    check('refund is rejected when the contract is APPROVED', rejected);
    logger.info(`      ↳ ${message}`);

    // The payment must be untouched by the rejected attempt.
    const after = await PaymentModel.findById(approved.paymentId).lean();
    check('a rejected refund leaves the payment PAID', after?.status === 'PAID');

    // ── §8.2 — funding must write a brand-side ledger row as well as the
    // creator's. Drive the webhook handler directly; going through Stripe would
    // need a hosted Checkout session a script can't complete.
    const funded = await seedChain('brand-ledger', 'PENDING_FUNDING', 'PENDING');
    await paymentService.handleCheckoutCompleted({
      id: 'cs_test_vault_verification',
      metadata: { paymentId: funded.paymentId, contractId: funded.contractId },
      payment_intent: 'pi_vault_verification_funded',
    } as unknown as Parameters<typeof paymentService.handleCheckoutCompleted>[0]);

    const brandRows = await TransactionModel.find({ userId: funded.brandId }).lean();
    check('funding writes exactly one brand ledger row', brandRows.length === 1);
    check('the brand row is a SPEND', brandRows[0]?.type === 'SPEND');
    check(
      'the brand row is the negative GROSS amount (commission included)',
      brandRows[0]?.amount === -funded.grossAmount
    );
    logger.info(`      ↳ brand row: ${brandRows[0]?.type} ${String(brandRows[0]?.amount)}`);

    const creatorRows = await TransactionModel.find({ userId: funded.creatorId }).lean();
    check('the creator row is still an EARNING', creatorRows[0]?.type === 'EARNING');
    check(
      'the creator row still uses creatorAmount, not gross',
      creatorRows[0]?.amount === funded.creatorAmount
    );
    logger.info(`      ↳ creator row: ${creatorRows[0]?.type} ${String(creatorRows[0]?.amount)}`);
    check(
      'the two sides differ by exactly the commission',
      (brandRows[0]?.amount ?? 0) + (creatorRows[0]?.amount ?? 0) === -funded.commissionAmount
    );
  } finally {
    await cleanup();
    await disconnectDatabase();
    logger.info(`verify-vault-backend: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

main().catch((error: unknown) => {
  logger.error('verify-vault-backend crashed', {
    error: error instanceof Error ? error.message : error,
  });
  process.exitCode = 1;
});
