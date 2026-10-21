/**
 * Report data that would block the payment-safety unique indexes, then (with
 * --apply) sync the payment collections' indexes to the schemas.
 *
 *   pnpm tsx scripts/check-payment-indexes.ts           # report only
 *   pnpm tsx scripts/check-payment-indexes.ts --apply   # report, then syncIndexes
 */
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';
import { PaymentModel } from '@/modules/payments/payment.model';
import { TransactionModel } from '@/modules/payments/transaction.model';
import { WalletModel } from '@/modules/payments/wallet.model';
import { StripeEventModel } from '@/modules/payments/stripe-event.model';

async function duplicates(
  model: typeof WalletModel | typeof TransactionModel,
  key: Record<string, string>,
  match: Record<string, unknown> = {}
): Promise<unknown[]> {
  return (model as typeof WalletModel).aggregate([
    { $match: match },
    { $group: { _id: key, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
}

async function main(): Promise<void> {
  await connectDatabase();
  const counts = {
    payments: await PaymentModel.countDocuments(),
    wallets: await WalletModel.countDocuments(),
    transactions: await TransactionModel.countDocuments(),
  };
  const dupAccounts = await duplicates(
    WalletModel,
    { a: '$stripeAccountId' },
    { stripeAccountId: { $exists: true } }
  );
  const dupLedger = await duplicates(TransactionModel, {
    p: '$paymentId',
    u: '$userId',
    t: '$type',
  });
  logger.info('Payment data', { ...counts, dupAccounts, dupLedger });

  if (process.argv.includes('--apply')) {
    if (dupAccounts.length || dupLedger.length) {
      throw new Error('Resolve the duplicates above before building unique indexes');
    }
    for (const model of [PaymentModel, WalletModel, TransactionModel, StripeEventModel]) {
      const dropped = await (model as typeof PaymentModel).syncIndexes();
      logger.info(`Indexes synced: ${model.modelName}`, { dropped });
    }
  }
  await disconnectDatabase();
}

main().catch((error: unknown) => {
  logger.error('check-payment-indexes failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
