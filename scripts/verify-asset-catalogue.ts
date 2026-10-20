/**
 * Verify the shared asset catalogue end to end against REAL Atlas.
 *
 *   pnpm tsx scripts/verify-asset-catalogue.ts
 *
 * Every asset type must be accepted by BOTH campaigns and listings (through the
 * real Zod validators and services), land in the right category, be priced, and
 * refuse the wrong platform. Also checks no stored record still carries a value
 * outside the catalogue. Test data is namespaced and deleted in `finally`.
 */
import mongoose, { Types } from 'mongoose';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { hashPassword } from '@/utils/password';
import { UserModel } from '@/modules/users/user.model';
import { AuthProvider } from '@/modules/users/user.types';
import { CampaignModel } from '@/modules/campaigns/campaign.model';
import { campaignService } from '@/modules/campaigns/campaign.service';
import { createCampaignSchema } from '@/modules/campaigns/campaign.validators';
import { AssetModel } from '@/modules/assets/asset.model';
import { assetService } from '@/modules/assets/asset.service';
import { createAssetSchema } from '@/modules/assets/asset.validators';
import { pricingService } from '@/modules/ai/pricing.service';
import { pricingSchema } from '@/modules/ai/ai.validators';
import { CreatorProfileModel } from '@/modules/creators/creator.model';
import {
  ASSET_TYPES,
  ASSET_TYPE_CATEGORY,
  ASSET_TYPE_PLATFORM,
  PLATFORMS,
  type AssetType,
  type Platform,
} from '@/types/assets';

const DOMAIN = '@test.local';
const PREFIX = 'asset-cat-';

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) passed += 1;
  else failed += 1;
  logger[ok ? 'info' : 'error'](`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function threw(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

const users: Types.ObjectId[] = [];

function platformFor(type: AssetType): Platform {
  return ASSET_TYPE_PLATFORM[type] ?? 'TIKTOK';
}

function wrongPlatformFor(type: AssetType): Platform {
  const canonical = ASSET_TYPE_PLATFORM[type];
  return PLATFORMS.find((p) => p !== canonical && p !== 'OTHER') ?? 'OTHER';
}

async function main(): Promise<void> {
  await connectDatabase();
  try {
    const password = await hashPassword('AssetCat123!');
    const [brand, creator] = await UserModel.create([
      {
        name: 'Catalogue Brand',
        email: `${PREFIX}brand${DOMAIN}`,
        role: 'BRAND',
        isVerified: true,
        provider: AuthProvider.LOCAL,
        password,
      },
      {
        name: 'Catalogue Creator',
        email: `${PREFIX}creator${DOMAIN}`,
        role: 'CREATOR',
        isVerified: true,
        provider: AuthProvider.LOCAL,
        password,
      },
    ]);
    if (!brand || !creator) throw new Error('seed failed');
    users.push(brand._id, creator._id);
    const brandId = brand._id.toString();
    const creatorId = creator._id.toString();

    check(
      'the catalogue has 36 asset types across 11 platforms',
      ASSET_TYPES.length === 36 && PLATFORMS.length === 11
    );
    for (const platform of [
      'TIKTOK',
      'FACEBOOK',
      'THREADS',
      'PINTEREST',
      'SNAPCHAT',
      'TWITCH',
    ] as const) {
      check(
        `${platform} has at least one asset type`,
        ASSET_TYPES.some((t) => ASSET_TYPE_PLATFORM[t] === platform)
      );
    }

    let campaignsOk = 0;
    let assetsOk = 0;
    let categoriesOk = 0;
    let pricedOk = 0;
    let campaignRejects = 0;
    let assetRejects = 0;
    const failures: string[] = [];

    for (const type of ASSET_TYPES) {
      const platform = platformFor(type);
      try {
        const dto = createCampaignSchema.parse({
          title: `Catalogue ${type}`,
          description: 'Campaign created by verify-asset-catalogue.ts.',
          assetType: type,
          platform,
          duration: 7,
          budgetMin: 10_000,
          budgetMax: 20_000,
        });
        const campaign = await campaignService.createCampaign(brandId, dto);
        if (campaign.assetType === type) campaignsOk += 1;
      } catch (error) {
        failures.push(
          `campaign ${type}: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      try {
        const dto = createAssetSchema.parse({
          assetType: type,
          platform,
          title: `Catalogue ${type}`,
          description: 'Listing created by verify-asset-catalogue.ts.',
          estimatedReach: 10_000,
        });
        const asset = await assetService.create(creatorId, dto);
        if (asset.assetType === type) assetsOk += 1;
        if (asset.category === ASSET_TYPE_CATEGORY[type]) categoriesOk += 1;
      } catch (error) {
        failures.push(`asset ${type}: ${error instanceof Error ? error.message : String(error)}`);
      }

      const price = await pricingService.recommend(
        pricingSchema.parse({ platform, followers: 50_000, engagementRate: 3, assetType: type })
      );
      if (price.suggested > 0 && price.min <= price.suggested && price.suggested <= price.max) {
        pricedOk += 1;
      }

      if (ASSET_TYPE_PLATFORM[type]) {
        const wrong = wrongPlatformFor(type);
        const badCampaign = await threw(() =>
          campaignService.createCampaign(
            brandId,
            createCampaignSchema.parse({
              title: `Wrong ${type}`,
              description: 'Should be refused for its platform.',
              assetType: type,
              platform: wrong,
              duration: 7,
              budgetMin: 1,
              budgetMax: 1,
            })
          )
        );
        const badAsset = await threw(() =>
          assetService.create(
            creatorId,
            createAssetSchema.parse({
              assetType: type,
              platform: wrong,
              title: `Wrong ${type}`,
              description: 'Should be refused for its platform.',
            })
          )
        );
        if (badCampaign) campaignRejects += 1;
        if (badAsset) assetRejects += 1;
      }
    }

    const locked = ASSET_TYPES.filter((t) => ASSET_TYPE_PLATFORM[t]).length;
    for (const f of failures) logger.error(`      ↳ ${f}`);
    check(
      'every type is accepted as a campaign',
      campaignsOk === ASSET_TYPES.length,
      `${campaignsOk}/36`
    );
    check('every type is accepted as a listing', assetsOk === ASSET_TYPES.length, `${assetsOk}/36`);
    check('every listing gets its derived category', categoriesOk === ASSET_TYPES.length);
    check('every type is priced', pricedOk === ASSET_TYPES.length, `${pricedOk}/36`);
    check(
      'campaigns refuse the wrong platform for locked types',
      campaignRejects === locked,
      `${campaignRejects}/${locked}`
    );
    check(
      'listings refuse the wrong platform for locked types',
      assetRejects === locked,
      `${assetRejects}/${locked}`
    );

    const ugcAnywhere = await assetService.create(
      creatorId,
      createAssetSchema.parse({
        assetType: 'UNBOXING_VIDEO',
        platform: 'TWITCH',
        title: 'UGC on any platform',
        description: 'UGC types are platform-flexible.',
      })
    );
    check('UGC types may be listed on any platform', ugcAnywhere.platform === 'TWITCH');

    const priced = await assetService.create(
      creatorId,
      createAssetSchema.parse({
        assetType: 'TIKTOK_VIDEO',
        platform: 'TIKTOK',
        title: 'Priced listing',
        description: 'Listing with an asking price.',
        price: 45_000,
      })
    );
    const underBudget = await assetService.browse({ creatorId, maxPrice: 50_000 });
    const overBudget = await assetService.browse({ creatorId, maxPrice: 40_000 });
    check(
      'listings carry a price (minor units) and filter by maxPrice',
      priced.price === 45_000 &&
        priced.currency === 'USD' &&
        underBudget.items.some((a) => a._id.equals(priced._id)) &&
        !overBudget.items.some((a) => a._id.equals(priced._id))
    );

    check(
      'the old campaign values are refused',
      !createCampaignSchema.safeParse({
        title: 'Old value',
        description: 'Uses a retired enum value.',
        assetType: 'UGC_CONTENT',
        platform: 'TIKTOK',
        duration: 7,
        budgetMin: 1,
        budgetMax: 1,
      }).success
    );

    const profile = await CreatorProfileModel.create({
      userId: creator._id,
      displayName: 'Catalogue Creator',
      socialLinks: {
        tiktok: 'https://tiktok.com/@cat',
        threads: 'https://threads.net/@cat',
        pinterest: 'https://pinterest.com/cat',
        snapchat: 'https://snapchat.com/add/cat',
        twitch: 'https://twitch.tv/cat',
      },
    });
    const links = profile.toObject().socialLinks as Record<string, string>;
    check(
      'creator profiles store the new social links',
      ['tiktok', 'threads', 'pinterest', 'snapchat', 'twitch'].every((k) => Boolean(links[k]))
    );

    const db = mongoose.connection.db;
    let stale = 0;
    for (const name of ['campaigns', 'applications', 'contracts', 'submissions', 'assets']) {
      stale +=
        (await db?.collection(name).countDocuments({ assetType: { $nin: [...ASSET_TYPES] } })) ?? 0;
    }
    check('no stored record uses a value outside the catalogue', stale === 0, `${stale} stale`);
  } finally {
    await Promise.all([
      CampaignModel.deleteMany({ brandId: { $in: users } }),
      AssetModel.deleteMany({ creatorId: { $in: users } }),
      CreatorProfileModel.deleteMany({ userId: { $in: users } }),
    ]);
    await UserModel.deleteMany({ email: { $regex: `^${PREFIX}.*@test\\.local$` } });
    await disconnectDatabase();
    logger.info(`verify-asset-catalogue: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

main().catch((error: unknown) => {
  logger.error('verify-asset-catalogue crashed', {
    error: error instanceof Error ? error.stack : error,
  });
  process.exitCode = 1;
});
