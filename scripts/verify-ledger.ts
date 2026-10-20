/**
 * Read-only audit: do the books balance?
 *
 *   pnpm tsx scripts/verify-ledger.ts
 *
 * Recomputes every creator's escrow (pending) and released (available /
 * totalEarned) balance from the payments themselves and compares it with the
 * wallet. Also checks each payment has exactly the ledger rows its status
 * implies, and flags payout/refund claims stuck in flight. Exits 1 on any drift.
 */
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';
import { PaymentModel } from '@/modules/payments/payment.model';
import { TransactionModel } from '@/modules/payments/transaction.model';
import { WalletModel } from '@/modules/payments/wallet.model';

const IN_ESCROW = new Set(['PAID', 'DISPUTED', 'RELEASING', 'REFUNDING']);
const STUCK_AFTER_MS = 10 * 60 * 1000;

/** Ledger rows each status must have, keyed `party:type`. */
const EXPECTED_ROWS: Record<string, string[]> = {
  PENDING: [],
  FAILED: [],
  PAID: ['creator:EARNING', 'brand:SPEND'],
  DISPUTED: ['creator:EARNING', 'brand:SPEND'],
  RELEASING: ['creator:EARNING', 'brand:SPEND'],
  REFUNDING: ['creator:EARNING', 'brand:SPEND'],
  RELEASED: ['creator:EARNING', 'brand:SPEND', 'creator:PAYOUT'],
  REFUNDED: ['creator:EARNING', 'brand:SPEND', 'creator:REFUND', 'brand:REFUND'],
};

async function main(): Promise<void> {
  await connectDatabase();
  const problems: string[] = [];

  const payments = await PaymentModel.find().lean();
  const rows = await TransactionModel.find().lean();
  const rowsByPayment = new Map<string, string[]>();
  for (const row of rows) {
    const payment = payments.find((p) => p._id.equals(row.paymentId));
    const party = payment?.brandId.equals(row.userId) ? 'brand' : 'creator';
    const key = row.paymentId.toString();
    rowsByPayment.set(key, [...(rowsByPayment.get(key) ?? []), `${party}:${row.type}`]);
  }

  const expected = new Map<string, { pending: number; released: number }>();
  for (const p of payments) {
    const creator = p.creatorId.toString();
    const bucket = expected.get(creator) ?? { pending: 0, released: 0 };
    if (IN_ESCROW.has(p.status)) bucket.pending += p.creatorAmount;
    if (p.status === 'RELEASED') bucket.released += p.creatorAmount;
    expected.set(creator, bucket);

    const want = [...(EXPECTED_ROWS[p.status] ?? [])].sort().join(',');
    const have = [...(rowsByPayment.get(p._id.toString()) ?? [])].sort().join(',');
    if (want !== have) {
      problems.push(
        `payment ${p._id.toString()} (${p.status}): ledger [${have}] expected [${want}]`
      );
    }
    if (p.amount !== p.commissionAmount + p.creatorAmount) {
      problems.push(`payment ${p._id.toString()}: amount ≠ commission + creator share`);
    }
    if (
      (p.status === 'RELEASING' || p.status === 'REFUNDING') &&
      p.claimedAt &&
      Date.now() - p.claimedAt.getTime() > STUCK_AFTER_MS
    ) {
      problems.push(
        `payment ${p._id.toString()} stuck in ${p.status} since ${p.claimedAt.toISOString()}`
      );
    }
  }

  for (const wallet of await WalletModel.find().lean()) {
    const want = expected.get(wallet.userId.toString()) ?? { pending: 0, released: 0 };
    if (wallet.pendingBalance !== want.pending) {
      problems.push(
        `wallet ${wallet.userId.toString()}: pending ${wallet.pendingBalance}, payments say ${want.pending}`
      );
    }
    if (wallet.totalEarned !== want.released || wallet.availableBalance !== want.released) {
      problems.push(
        `wallet ${wallet.userId.toString()}: earned ${wallet.totalEarned}/available ${wallet.availableBalance}, payments say ${want.released}`
      );
    }
  }

  for (const problem of problems) logger.error(`DRIFT  ${problem}`);
  logger.info(
    `verify-ledger: ${payments.length} payments, ${rows.length} ledger rows, ${problems.length} problem(s)`
  );
  await disconnectDatabase();
  process.exitCode = problems.length > 0 ? 1 : 0;
}

main().catch((error: unknown) => {
  logger.error('verify-ledger crashed', { error: error instanceof Error ? error.message : error });
  process.exitCode = 1;
});
