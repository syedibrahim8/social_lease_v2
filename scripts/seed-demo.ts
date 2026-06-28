/**
 * Demo data seed — populates Atlas with a coherent, REMOVABLE dataset so the
 * live app never looks empty.
 *
 *   pnpm seed:demo      → wipe any existing demo data, then insert a fresh set
 *   pnpm unseed:demo    → remove all demo data (pass --clean)
 *
 * Everything is tagged by the demo email domain (`@demo.creatormarket.dev`); the
 * cleanup cascades from those users across every collection it touches, so the
 * whole set can be removed later with one command and nothing else is affected.
 *
 * Login for every demo account: password `Demo1234!`.
 */
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';
import { hashPassword } from '@/utils/password';
import { UserModel } from '@/modules/users/user.model';
import { AuthProvider } from '@/modules/users/user.types';
import { CreatorProfileModel } from '@/modules/creators/creator.model';
import { BrandProfileModel } from '@/modules/brands/brand.model';
import { CampaignModel } from '@/modules/campaigns/campaign.model';
import { AssetModel } from '@/modules/assets/asset.model';
import { NotificationModel } from '@/modules/notifications/notification.model';
import { ASSET_TYPE_CATEGORY, type MarketplaceAssetType } from '@/modules/assets/asset.types';

const DOMAIN = '@demo.creatormarket.dev';
const PASSWORD = 'Demo1234!';
const email = (local: string): string => `${local}${DOMAIN}`;

/** Remove all demo data, cascading from the demo users. Idempotent. */
async function cleanDemo(): Promise<number> {
  const users = await UserModel.find({ email: { $regex: `${DOMAIN}$` } })
    .select('_id')
    .lean();
  const ids = users.map((u) => u._id);
  if (ids.length === 0) return 0;

  await Promise.all([
    CreatorProfileModel.deleteMany({ userId: { $in: ids } }),
    BrandProfileModel.deleteMany({ userId: { $in: ids } }),
    CampaignModel.deleteMany({ brandId: { $in: ids } }),
    AssetModel.deleteMany({ creatorId: { $in: ids } }),
    NotificationModel.deleteMany({ userId: { $in: ids } }),
  ]);
  await UserModel.deleteMany({ _id: { $in: ids } });
  return ids.length;
}

async function seed(): Promise<void> {
  const password = await hashPassword(PASSWORD);
  const mk = (name: string, local: string, role: 'CREATOR' | 'BRAND' | 'ADMIN') => ({
    name,
    email: email(local),
    role,
    isVerified: true,
    provider: AuthProvider.LOCAL,
    password,
  });

  // Users -----------------------------------------------------------------
  const [admin, northwind, lumen, maya, devon, aria] = await UserModel.create([
    mk('Platform Admin', 'admin', 'ADMIN'),
    mk('Northwind Studio', 'northwind', 'BRAND'),
    mk('Lumen', 'lumen', 'BRAND'),
    mk('Maya Okonkwo', 'maya', 'CREATOR'),
    mk('Devon Pierce', 'devon', 'CREATOR'),
    mk('Aria Nwosu', 'aria', 'CREATOR'),
  ]);

  // Brand profiles --------------------------------------------------------
  await BrandProfileModel.create([
    {
      userId: northwind._id,
      companyName: 'Northwind Studio',
      website: 'https://northwind.example',
      industry: 'Retail & E-commerce',
      companySize: '11-50',
      verifiedStatus: 'VERIFIED',
      description: 'A modern lifestyle brand for the everyday.',
    },
    {
      userId: lumen._id,
      companyName: 'Lumen',
      website: 'https://lumen.example',
      industry: 'Technology',
      companySize: '51-200',
      verifiedStatus: 'VERIFIED',
      description: 'Consumer tech that fits your life.',
    },
  ]);

  // Creator profiles ------------------------------------------------------
  await CreatorProfileModel.create([
    {
      userId: maya._id,
      displayName: 'Maya Okonkwo',
      niche: 'Technology',
      location: 'Lagos, NG',
      bio: 'High-retention tech Reels for a loyal audience.',
      verificationStatus: 'VERIFIED',
      profileOwnershipStatus: 'VERIFIED',
      socialLinks: { instagram: 'https://instagram.com/mayacreates' },
      metrics: { followers: 240000, engagementRate: 4.8, averageReach: 86000 },
    },
    {
      userId: devon._id,
      displayName: 'Devon Pierce',
      niche: 'UGC',
      location: 'Austin, US',
      bio: 'Authentic, conversion-focused UGC reviews.',
      verificationStatus: 'VERIFIED',
      profileOwnershipStatus: 'UNVERIFIED',
      socialLinks: { instagram: 'https://instagram.com/devonp' },
      metrics: { followers: 120000, engagementRate: 6.1, averageReach: 52000 },
    },
    {
      userId: aria._id,
      displayName: 'Aria Nwosu',
      niche: 'Business',
      location: 'London, UK',
      bio: 'Long-form founder spotlights for B2B brands.',
      verificationStatus: 'UNVERIFIED',
      profileOwnershipStatus: 'UNVERIFIED',
      socialLinks: { linkedin: 'https://linkedin.com/in/arianwosu' },
      metrics: { followers: 48000, engagementRate: 3.4, averageReach: 21000 },
    },
  ]);

  // Campaigns (PUBLISHED so they show in the marketplace) -----------------
  const now = new Date();
  const campaign = (
    brandId: typeof northwind._id,
    title: string,
    description: string,
    assetType: string,
    platform: string,
    budgetMin: number,
    budgetMax: number,
    duration: number,
    requirements: string[]
  ) => ({
    brandId,
    title,
    description,
    assetType,
    platform,
    duration,
    budgetMin,
    budgetMax,
    currency: 'USD',
    requirements,
    status: 'PUBLISHED' as const,
    publishedAt: now,
  });

  await CampaignModel.create([
    campaign(
      northwind._id,
      'Summer Launch — Instagram Reel',
      'Launch our summer collection with a high-energy Reel.',
      'INSTAGRAM_REEL',
      'INSTAGRAM',
      300000,
      500000,
      14,
      ['1 Reel (30–45s)', 'Link in bio for 7 days']
    ),
    campaign(
      lumen._id,
      'Holiday UGC Bundle',
      'Three authentic UGC clips for paid social.',
      'UGC_CONTENT',
      'TIKTOK',
      100000,
      250000,
      10,
      ['3 UGC videos (15s)', 'Raw + edited delivery']
    ),
    campaign(
      northwind._id,
      'Q4 Ambassador Program',
      'Quarter-long ambassadorship with a dedicated review.',
      'YOUTUBE_VIDEO',
      'YOUTUBE',
      800000,
      1200000,
      90,
      ['1 long-form video', '30-day exclusivity']
    ),
    campaign(
      lumen._id,
      'App Install Sprint',
      'Drive installs with a punchy onboarding demo.',
      'YOUTUBE_SHORT',
      'YOUTUBE',
      200000,
      400000,
      7,
      ['1 short (20s)', 'Trackable link']
    ),
    campaign(
      northwind._id,
      'Brand Story Series',
      'A 5-frame Story series telling our founding story.',
      'INSTAGRAM_STORY',
      'INSTAGRAM',
      80000,
      150000,
      5,
      ['5 Story frames', 'Swipe-up link']
    ),
    campaign(
      lumen._id,
      'Fintech Explainer Thread',
      'A clear thread explaining how our escrow works.',
      'TWITTER_PINNED_POST',
      'TWITTER',
      100000,
      200000,
      7,
      ['1 thread (6–8 posts)', 'Link to docs']
    ),
  ]);

  // Assets ----------------------------------------------------------------
  const asset = (
    creatorId: typeof maya._id,
    assetType: MarketplaceAssetType,
    platform: string,
    title: string,
    description: string,
    estimatedReach: number,
    averageViews: number,
    availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE',
    verificationStatus: 'VERIFIED' | 'UNVERIFIED'
  ) => ({
    creatorId,
    assetType,
    platform,
    category: ASSET_TYPE_CATEGORY[assetType],
    title,
    description,
    estimatedReach,
    averageViews,
    availability: { status: availability, leadTimeDays: 5 },
    verificationStatus,
  });

  await AssetModel.create([
    asset(
      maya._id,
      'INSTAGRAM_REEL',
      'INSTAGRAM',
      'Daily Tech Reels',
      'High-retention tech Reels with a loyal audience.',
      240000,
      86000,
      'AVAILABLE',
      'VERIFIED'
    ),
    asset(
      devon._id,
      'PRODUCT_REVIEW',
      'TIKTOK',
      'Honest UGC Reviews',
      'Authentic, conversion-focused product reviews.',
      120000,
      52000,
      'BUSY',
      'VERIFIED'
    ),
    asset(
      aria._id,
      'LINKEDIN_FEATURED_POST',
      'LINKEDIN',
      'Founder Story Features',
      'Long-form founder spotlights for B2B brands.',
      48000,
      21000,
      'AVAILABLE',
      'UNVERIFIED'
    ),
    asset(
      maya._id,
      'YOUTUBE_VIDEO',
      'YOUTUBE',
      'Tech Deep-dives',
      'In-depth tech reviews with chapters.',
      310000,
      104000,
      'AVAILABLE',
      'VERIFIED'
    ),
    asset(
      devon._id,
      'UNBOXING_VIDEO',
      'INSTAGRAM',
      'Beauty Unboxings',
      'Aesthetic unboxings with high conversion.',
      175000,
      63000,
      'AVAILABLE',
      'VERIFIED'
    ),
    asset(
      aria._id,
      'INSTAGRAM_PINNED_POST',
      'INSTAGRAM',
      'Pinned Brand Features',
      'Evergreen pinned brand features.',
      64000,
      24000,
      'AVAILABLE',
      'UNVERIFIED'
    ),
  ]);

  // Notifications for Maya (so the bell isn't empty) ----------------------
  await NotificationModel.create([
    {
      userId: maya._id,
      type: 'OFFER_RECEIVED',
      title: 'New offer',
      body: 'Northwind Studio countered at $1,200.00.',
      channels: ['IN_APP'],
      read: false,
    },
    {
      userId: maya._id,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment released',
      body: '$1,350.00 was released to your wallet.',
      channels: ['IN_APP'],
      read: false,
    },
    {
      userId: maya._id,
      type: 'VERIFICATION_APPROVED',
      title: 'Verification approved',
      body: 'Your profile ownership is now verified.',
      channels: ['IN_APP'],
      read: true,
    },
  ]);

  logger.info('Demo seed complete', {
    accounts: {
      admin: admin.email,
      brands: [northwind.email, lumen.email],
      creators: [maya.email, devon.email, aria.email],
      password: PASSWORD,
    },
  });
}

async function main(): Promise<void> {
  const cleanOnly = process.argv.includes('--clean');
  await connectDatabase();
  try {
    const removed = await cleanDemo();
    logger.info(`Removed ${removed} demo user(s) and their data`);
    if (!cleanOnly) await seed();
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error: unknown) => {
  logger.error('Demo seed failed', { error: error instanceof Error ? error.message : error });
  process.exitCode = 1;
});
