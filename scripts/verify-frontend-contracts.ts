/**
 * Verify the requests the Social Lease frontend sends are the ones the API
 * accepts — over real HTTP, against REAL Atlas.
 *
 *   pnpm tsx scripts/verify-frontend-contracts.ts
 *
 * Each payload below is shaped exactly as the frontend builds it (see the
 * matching file in vault/), so a drift between the two shows up here instead of
 * as a 422 in someone's browser. Test users are namespaced and deleted in
 * `finally`, along with everything they created.
 */
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { createApp } from '@/app';
import { UserModel } from '@/modules/users/user.model';
import { CreatorProfileModel } from '@/modules/creators/creator.model';
import { BrandProfileModel } from '@/modules/brands/brand.model';
import { CampaignModel } from '@/modules/campaigns/campaign.model';
import { AssetModel } from '@/modules/assets/asset.model';
import {
  NotificationModel,
  NotificationPreferenceModel,
} from '@/modules/notifications/notification.model';
import {
  VerificationAuditLogModel,
  VerificationRequestModel,
} from '@/modules/verifications/verification.model';

const STAMP = Date.now();
const PREFIX = `fe-contract-${STAMP}`;
const PASSWORD = 'FeContract123!';

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) passed += 1;
  else failed += 1;
  logger[ok ? 'info' : 'error'](`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

let base = '';

interface Reply<T = unknown> {
  status: number;
  body: { success: boolean; message: string; data: T; errors?: unknown[] };
}

async function call<T = unknown>(
  method: string,
  path: string,
  token?: string,
  body?: unknown
): Promise<Reply<T>> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: (await res.json()) as Reply<T>['body'] };
}

async function signUp(role: 'CREATOR' | 'BRAND'): Promise<{ token: string; id: string }> {
  const email = `${PREFIX}-${role.toLowerCase()}@test.local`;
  await call('POST', '/auth/register', undefined, {
    name: `FE ${role}`,
    email,
    password: PASSWORD,
    role,
  });
  const login = await call<{ accessToken: string; user: { id: string } }>(
    'POST',
    '/auth/login',
    undefined,
    { email, password: PASSWORD }
  );
  return { token: login.body.data.accessToken, id: login.body.data.user.id };
}

function detail(r: Reply): string {
  return `${r.status} ${r.body.message}${r.body.errors?.length ? ` ${JSON.stringify(r.body.errors)}` : ''}`;
}

async function main(): Promise<void> {
  await connectDatabase();
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}${env.API_PREFIX}`;

  try {
    const creator = await signUp('CREATOR');
    const brand = await signUp('BRAND');

    // ── Onboarding (vault/lib/validations/profile.ts → creatorPayload/brandPayload)
    const missing = await call('GET', '/creators/me', creator.token);
    check('a new creator has no profile (404 drives onboarding)', missing.status === 404);

    const creatorProfile = await call('POST', '/creators', creator.token, {
      displayName: 'FE Creator',
      niche: 'Fitness',
      location: 'Lagos',
      bio: 'Short-form fitness content.',
      socialLinks: { tiktok: 'https://tiktok.com/@fe', instagram: 'https://instagram.com/fe' },
      metrics: { followers: 48000, engagementRate: 3.4, averageReach: 20000 },
    });
    check(
      'onboarding creates a creator profile',
      creatorProfile.status === 201,
      detail(creatorProfile)
    );
    const dup = await call('POST', '/creators', creator.token, {
      displayName: 'Again',
      socialLinks: {},
      metrics: {},
    });
    check('a second profile is refused with 409', dup.status === 409);

    const reach = await call('PATCH', '/creators/me', creator.token, {
      socialLinks: { twitch: 'https://twitch.tv/fe' },
      metrics: { followers: 50000, engagementRate: 3.1, averageReach: 0 },
    });
    check('Channels settings save links and metrics', reach.status === 200, detail(reach));

    const brandProfile = await call('POST', '/brands', brand.token, {
      companyName: 'FE Brand',
      website: 'https://example.com',
      companySize: '11-50',
    });
    check(
      'onboarding creates a company profile',
      brandProfile.status === 201,
      detail(brandProfile)
    );

    // ── Campaign form (vault/components/campaign/campaign-form.tsx → toInput)
    const created = await call<{ id: string; status: string }>('POST', '/campaigns', brand.token, {
      title: 'FE TikTok launch',
      description: 'A short TikTok showing the product in use.',
      platform: 'TIKTOK',
      assetType: 'TIKTOK_VIDEO',
      duration: 14,
      budgetMin: 50000,
      budgetMax: 150000,
      currency: 'USD',
      requirements: ['Tag the brand', 'Link in bio for 3 days'],
    });
    check(
      'the campaign form creates a draft',
      created.status === 201 && created.body.data.status === 'DRAFT',
      detail(created)
    );
    const campaignId = created.body.data.id;
    const read = await call<{ brandId: { id: string } | string }>(
      'GET',
      `/campaigns/${campaignId}`,
      brand.token
    );
    const brandRef = read.body.data.brandId;
    check(
      'campaign reads populate brandId (owner check uses refId)',
      typeof brandRef === 'object' && brandRef.id === brand.id
    );
    const edited = await call('PATCH', `/campaigns/${campaignId}`, brand.token, {
      title: 'FE TikTok launch v2',
      description: 'A short TikTok showing the product in use.',
      platform: 'TIKTOK',
      assetType: 'TIKTOK_VIDEO',
      duration: 21,
      budgetMin: 60000,
      budgetMax: 150000,
      currency: 'USD',
      requirements: [],
    });
    check('the edit form saves', edited.status === 200, detail(edited));
    const published = await call<{ status: string }>(
      'POST',
      `/campaigns/${campaignId}/publish`,
      brand.token
    );
    check('owner actions publish', published.body.data?.status === 'PUBLISHED');
    const mine = await call<unknown[]>('GET', '/campaigns/mine?status=PUBLISHED', brand.token);
    check('My campaigns filters by status', mine.status === 200 && mine.body.data.length === 1);
    const wrong = await call('POST', '/campaigns', brand.token, {
      title: 'Wrong platform',
      description: 'A TikTok type on YouTube should be refused.',
      platform: 'YOUTUBE',
      assetType: 'TIKTOK_VIDEO',
      duration: 7,
      budgetMin: 1,
      budgetMax: 1,
      currency: 'USD',
      requirements: [],
    });
    check('a mismatched platform is refused (the picker never sends one)', wrong.status === 400);

    // ── Listing form (vault/components/assets/asset-form.tsx → toInput)
    const asset = await call<{ id: string; price: number; category: string }>(
      'POST',
      '/assets',
      creator.token,
      {
        platform: 'TIKTOK',
        assetType: 'TIKTOK_PINNED_VIDEO',
        title: 'Pinned TikTok for 7 days',
        description: 'Your product pinned to the top of my profile.',
        price: 45000,
        currency: 'USD',
        estimatedReach: 30000,
        averageViews: 12000,
        availability: { status: 'AVAILABLE', leadTimeDays: 3 },
        audienceDemographics: {
          genderSplit: { female: 62, male: 36 },
          topCountries: [{ country: 'Nigeria', percentage: 41 }],
          topCities: ['Lagos', 'Abuja'],
        },
      }
    );
    check(
      'the listing form creates a priced listing',
      asset.status === 201 &&
        asset.body.data.price === 45000 &&
        asset.body.data.category === 'PROFILE_ASSETS',
      detail(asset)
    );
    const assetId = asset.body.data.id;
    const cleared = await call('PATCH', `/assets/${assetId}`, creator.token, {
      platform: 'TIKTOK',
      assetType: 'TIKTOK_PINNED_VIDEO',
      title: 'Pinned TikTok for 7 days',
      description: 'Your product pinned to the top of my profile.',
      availability: { status: 'BUSY' },
      audienceDemographics: {},
    });
    check('an edit with no demographics saves', cleared.status === 200, detail(cleared));

    const block = await call<{ availability: { blocks: { _id: string }[] } }>(
      'POST',
      `/assets/${assetId}/availability/blocks`,
      creator.token,
      { startDate: '2026-12-01', endDate: '2026-12-05', note: 'Booked' }
    );
    check('the calendar adds a block from date inputs', block.status === 201, detail(block));
    const overlap = await call('POST', `/assets/${assetId}/availability/blocks`, creator.token, {
      startDate: '2026-12-04',
      endDate: '2026-12-08',
    });
    check('an overlapping block is refused with 409 (shown inline)', overlap.status === 409);
    const blockId = block.body.data.availability.blocks[0]?._id ?? '';
    const freed = await call(
      'DELETE',
      `/assets/${assetId}/availability/blocks/${blockId}`,
      creator.token
    );
    check('the calendar removes a block by _id', freed.status === 200);
    const myAssets = await call<unknown[]>('GET', '/assets/mine', creator.token);
    const analytics = await call<{ totalAssets: number }>(
      'GET',
      '/assets/analytics',
      creator.token
    );
    check(
      'My listings loads listings and analytics',
      myAssets.body.data.length === 1 && analytics.body.data.totalAssets === 1
    );
    const byCategory = await call<unknown[]>(
      'GET',
      '/assets?category=PROFILE_ASSETS&maxPrice=50000',
      brand.token
    );
    check(
      'Find creators filters by the real category values',
      byCategory.status === 200,
      detail(byCategory)
    );

    // ── AI tools (vault/lib/api/endpoints/ai.ts)
    const brief = await call<{ generatedBy: string; deliverables: string[] }>(
      'POST',
      '/ai/campaign-brief',
      brand.token,
      {
        productDescription: 'A reusable bottle that keeps drinks cold for 24 hours.',
        productName: 'ColdKeep',
        targetAudience: 'Runners, 25–40',
        platform: 'TIKTOK',
      }
    );
    check(
      'Draft with AI returns a brief',
      brief.status === 200 && Array.isArray(brief.body.data.deliverables),
      brief.body.data?.generatedBy
    );
    const price = await call<{ suggested: number }>('POST', '/ai/pricing', creator.token, {
      platform: 'TIKTOK',
      assetType: 'TIKTOK_PINNED_VIDEO',
      followers: 50000,
      engagementRate: 3.1,
    });
    check(
      'Suggest a price works for a creator',
      price.status === 200 && price.body.data.suggested > 0,
      detail(price)
    );
    const recs = await call<{ creators: unknown[] }>('POST', '/ai/recommendations', brand.token, {
      platform: 'TIKTOK',
      limit: 20,
    });
    check(
      'Recommended creators ranks the pool',
      recs.status === 200 && Array.isArray(recs.body.data.creators)
    );
    const fraud = await call<{ riskLevel: string }>('POST', '/ai/fraud-check', brand.token, {
      followers: 30000,
      engagementRate: 0.2,
      avgLikes: 40,
      avgComments: 2,
    });
    check(
      'the risk check scores numbers',
      fraud.status === 200 && Boolean(fraud.body.data.riskLevel),
      fraud.body.data?.riskLevel
    );

    // ── Verifications (vault/components/verification/*)
    const social = await call<{ id: string }>('POST', '/verifications', creator.token, {
      verificationType: 'SOCIAL_PROFILE',
      evidence: { profileUrl: 'https://tiktok.com/@fe', handle: '@fe' },
    });
    check('a creator requests social profile verification', social.status === 201, detail(social));
    const again = await call('POST', '/verifications', creator.token, {
      verificationType: 'SOCIAL_PROFILE',
      evidence: { profileUrl: 'https://tiktok.com/@fe' },
    });
    check('a second pending request of that type is refused (409)', again.status === 409);
    const identity = await call<{ id: string }>('POST', '/verifications', creator.token, {
      verificationType: 'IDENTITY',
      evidence: { documents: ['https://drive.example.com/id.pdf'], note: 'Passport' },
    });
    check('identity verification takes document links', identity.status === 201, detail(identity));
    const noEvidence = await call('POST', '/verifications', brand.token, {
      verificationType: 'BUSINESS_EMAIL',
      evidence: {},
    });
    check(
      'missing evidence is refused with a field error',
      noEvidence.status === 422 || noEvidence.status === 400
    );
    const email = await call('POST', '/verifications', brand.token, {
      verificationType: 'BUSINESS_EMAIL',
      evidence: { businessEmail: 'ops@example.com' },
    });
    check('a brand requests business email verification', email.status === 201, detail(email));
    const mineV = await call<unknown[]>('GET', '/verifications/mine?limit=100', creator.token);
    check(
      'the verification page lists my requests',
      mineV.status === 200 && mineV.body.data.length === 2
    );

    const adminEmail = `${PREFIX}-admin@test.local`;
    await call('POST', '/auth/register', undefined, {
      name: 'FE Admin',
      email: adminEmail,
      password: PASSWORD,
      role: 'CREATOR',
    });
    await UserModel.updateOne({ email: adminEmail }, { $set: { role: 'ADMIN' } });
    const adminLogin = await call<{ accessToken: string }>('POST', '/auth/login', undefined, {
      email: adminEmail,
      password: PASSWORD,
    });
    const admin = adminLogin.body.data.accessToken;
    const queue = await call<{ id: string }[]>(
      'GET',
      `/verifications?page=1&limit=20&status=PENDING&role=CREATOR&userId=${creator.id}`,
      admin
    );
    check(
      'the admin queue filters by status, role and user',
      queue.status === 200 && queue.body.data.length === 2
    );
    const forbidden = await call('GET', '/verifications', creator.token);
    check('non-admins cannot read the queue', forbidden.status === 403);
    const approved = await call<{ status: string }>(
      'POST',
      `/verifications/${social.body.data.id}/approve`,
      admin,
      {}
    );
    check(
      'approve with no note',
      approved.status === 200 && approved.body.data.status === 'APPROVED',
      detail(approved)
    );
    const rejectNoNote = await call(
      'POST',
      `/verifications/${identity.body.data.id}/reject`,
      admin,
      {
        reviewNote: '',
      }
    );
    check(
      'reject without a note is refused',
      rejectNoNote.status === 422 || rejectNoNote.status === 400
    );
    const rejected = await call('POST', `/verifications/${identity.body.data.id}/reject`, admin, {
      reviewNote: 'The document is blurry.',
    });
    check('reject with a note', rejected.status === 200, detail(rejected));
    const history = await call<{ action: string }[]>(
      'GET',
      `/verifications/${social.body.data.id}/audit`,
      admin
    );
    check(
      'the review sheet shows the audit trail',
      history.status === 200 &&
        history.body.data
          .map((h) => h.action)
          .sort()
          .join(',') === 'APPROVED,SUBMITTED'
    );
    const profileAfter = await call<{ verificationStatus: string }>(
      'GET',
      '/creators/me',
      creator.token
    );
    check(
      'approval turns the profile badge to VERIFIED',
      profileAfter.body.data.verificationStatus === 'VERIFIED'
    );

    // ── Analytics (vault/app/(app)/analytics + admin overview)
    const platform = await call<{
      users: { total: number };
      campaignsByStatus: object;
      transactionsByType: object;
    }>('GET', '/analytics/platform', admin);
    check(
      'the admin overview loads platform analytics',
      platform.status === 200 &&
        platform.body.data.users.total > 0 &&
        typeof platform.body.data.campaignsByStatus === 'object' &&
        typeof platform.body.data.transactionsByType === 'object'
    );
    const platformDenied = await call('GET', '/analytics/platform', brand.token);
    check('platform analytics is admin-only', platformDenied.status === 403);
    const ownCreator = await call<{
      conversion: { conversionRate: number };
      assetPerformance: object;
    }>('GET', '/analytics/creator', creator.token);
    check(
      'a creator loads their own analytics (rates are 0–1)',
      ownCreator.status === 200 &&
        ownCreator.body.data.conversion.conversionRate >= 0 &&
        ownCreator.body.data.conversion.conversionRate <= 1
    );
    const ownBrand = await call<{ roi: { note: string }; campaigns: { completionRate: number } }>(
      'GET',
      '/analytics/brand',
      brand.token
    );
    check(
      'a brand loads their own analytics with the ROI caveat',
      ownBrand.status === 200 && ownBrand.body.data.roi.note.length > 0
    );
    const adminView = await call('GET', `/analytics/creator?userId=${creator.id}`, admin);
    check(
      "an admin opens a creator's analytics from the queue",
      adminView.status === 200,
      detail(adminView)
    );
    const adminNoUser = await call('GET', '/analytics/brand', admin);
    check('an admin must say whose analytics (400)', adminNoUser.status === 400);

    // Owner delete paths last.
    const delAsset = await call('DELETE', `/assets/${assetId}`, creator.token);
    const delCampaign = await call('DELETE', `/campaigns/${campaignId}`, brand.token);
    check(
      'owners can delete their listing and campaign',
      delAsset.status === 200 && delCampaign.status === 200
    );
  } finally {
    const users = await UserModel.find({ email: { $regex: `^${PREFIX}` } })
      .select('_id')
      .lean();
    const ids = users.map((u) => u._id);
    const requests = await VerificationRequestModel.find({ userId: { $in: ids } })
      .select('_id')
      .lean();
    await Promise.all([
      CreatorProfileModel.deleteMany({ userId: { $in: ids } }),
      BrandProfileModel.deleteMany({ userId: { $in: ids } }),
      CampaignModel.deleteMany({ brandId: { $in: ids } }),
      AssetModel.deleteMany({ creatorId: { $in: ids } }),
      NotificationModel.deleteMany({ userId: { $in: ids } }),
      NotificationPreferenceModel.deleteMany({ userId: { $in: ids } }),
      VerificationAuditLogModel.deleteMany({ requestId: { $in: requests.map((r) => r._id) } }),
      VerificationRequestModel.deleteMany({ userId: { $in: ids } }),
    ]);
    await UserModel.deleteMany({ _id: { $in: ids } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
    logger.info(`verify-frontend-contracts: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

main().catch((error: unknown) => {
  logger.error('verify-frontend-contracts crashed', {
    error: error instanceof Error ? error.stack : error,
  });
  process.exitCode = 1;
});
