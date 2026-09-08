/**
 * Seed a negotiation and the contract it produces, between existing demo users.
 *
 *   pnpm tsx scripts/seed-negotiation.ts          → create
 *   pnpm tsx scripts/seed-negotiation.ts --clean  → remove
 *
 * WHY THIS EXISTS: `pnpm seed:demo` creates users, campaigns and assets, but no
 * applications — and it cannot, because applying is gated on the creator having
 * a payout-ready Stripe Connect account, which needs a hosted browser KYC flow.
 * That leaves no path from seeded data to a contract, so the whole money spine
 * (contracts, funding, delivery, payout) is unreachable in a fresh environment.
 *
 * This writes the Application and Contract documents directly, deliberately
 * bypassing that gate. It is a development fixture, not a test of the apply
 * path — the real apply flow, including its 403, is exercised through the API.
 */
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';
import { UserModel } from '@/modules/users/user.model';
import { CampaignModel } from '@/modules/campaigns/campaign.model';
import { ApplicationModel } from '@/modules/applications/application.model';
import { ContractModel } from '@/modules/contracts/contract.model';

const BRAND_EMAIL = 'northwind@demo.creatormarket.dev';
const CREATOR_EMAIL = 'maya@demo.creatormarket.dev';
const AGREED_PRICE = 400_000; // $4,000.00 in minor units

async function clean(): Promise<void> {
  const creator = await UserModel.findOne({ email: CREATOR_EMAIL }).select('_id').lean();
  if (!creator) {
    logger.info('No demo creator found; nothing to clean.');
    return;
  }
  const apps = await ApplicationModel.find({ creatorId: creator._id }).select('_id').lean();
  const ids = apps.map((a) => a._id);
  const contracts = await ContractModel.deleteMany({ applicationId: { $in: ids } });
  const removed = await ApplicationModel.deleteMany({ _id: { $in: ids } });
  logger.info(
    `Removed ${removed.deletedCount} application(s) and ${contracts.deletedCount} contract(s).`
  );
}

async function seed(): Promise<void> {
  const [brand, creator] = await Promise.all([
    UserModel.findOne({ email: BRAND_EMAIL }),
    UserModel.findOne({ email: CREATOR_EMAIL }),
  ]);
  if (!brand || !creator) {
    throw new Error('Demo users are missing. Run `pnpm seed:demo` first.');
  }

  const campaign = await CampaignModel.findOne({ brandId: brand._id, status: 'PUBLISHED' });
  if (!campaign) {
    throw new Error('No published campaign for the demo brand. Run `pnpm seed:demo` first.');
  }

  await clean();

  const now = new Date();
  const application = await ApplicationModel.create({
    campaignId: campaign._id,
    brandId: brand._id,
    creatorId: creator._id,
    assetType: campaign.assetType,
    proposal:
      'I would shoot this as a single take with a strong hook in the first two seconds, then cut to the product in use.',
    proposedPrice: 450_000,
    estimatedReach: 82_000,
    currency: campaign.currency,
    status: 'ACCEPTED',
    agreedPrice: AGREED_PRICE,
    offers: [
      {
        sender: creator._id,
        receiver: brand._id,
        amount: 450_000,
        message: 'Opening offer based on my usual rate for a reel of this scope.',
        status: 'COUNTERED',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        sender: brand._id,
        receiver: creator._id,
        amount: AGREED_PRICE,
        message: 'We can do $4,000 if the turnaround stays inside two weeks.',
        status: 'ACCEPTED',
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
    ],
  });

  const contract = await ContractModel.create({
    applicationId: application._id,
    campaignId: campaign._id,
    brandId: brand._id,
    creatorId: creator._id,
    assetType: campaign.assetType,
    platform: campaign.platform,
    agreedPrice: AGREED_PRICE,
    currency: campaign.currency,
    deliverables: [
      {
        description: `One ${campaign.assetType.toLowerCase().replace(/_/g, ' ')}`,
        completed: false,
      },
      ...campaign.requirements.map((r) => ({ description: r, completed: false })),
    ],
    timeline: { durationDays: campaign.duration },
    status: 'PENDING_FUNDING',
  });

  logger.info('Seeded negotiation + contract', {
    campaign: campaign.title,
    applicationId: application._id.toString(),
    contractId: contract._id.toString(),
    agreedPrice: AGREED_PRICE,
    brand: BRAND_EMAIL,
    creator: CREATOR_EMAIL,
  });
}

async function main(): Promise<void> {
  await connectDatabase();
  try {
    if (process.argv.includes('--clean')) await clean();
    else await seed();
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error: unknown) => {
  logger.error('seed-negotiation failed', {
    error: error instanceof Error ? error.message : error,
  });
  process.exitCode = 1;
});
