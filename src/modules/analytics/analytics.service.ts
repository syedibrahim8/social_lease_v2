import { paymentRepository } from '@/modules/payments/payment.repository';
import { transactionRepository } from '@/modules/payments/transaction.repository';
import { walletRepository } from '@/modules/payments/wallet.repository';
import { campaignRepository } from '@/modules/campaigns/campaign.repository';
import { contractRepository } from '@/modules/contracts/contract.repository';
import { applicationRepository } from '@/modules/applications/application.repository';
import { submissionRepository } from '@/modules/submissions/submission.repository';
import { assetRepository } from '@/modules/assets/asset.repository';
import { userRepository } from '@/modules/users/user.repository';
import type {
  BrandAnalytics,
  CreatorAnalytics,
  PlatformAnalytics,
} from '@/modules/analytics/analytics.types';

const DEFAULT_CURRENCY = 'USD';
const ROI_NOTE =
  'Delivery-based proxy: audience value delivered (impressions/reach/engagement) per net spend. ' +
  'The platform does not track downstream sales, so this is not financial ROI.';

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Sum the `count` field of grouped rows. */
const totalCount = (rows: ReadonlyArray<{ count: number }>): number =>
  rows.reduce((sum, r) => sum + r.count, 0);

/** Grouped rows → `{ [status]: count }`. */
const countsByKey = (rows: ReadonlyArray<{ _id: string; count: number }>): Record<string, number> =>
  Object.fromEntries(rows.map((r) => [r._id, r.count]));

/**
 * Analytics dashboard use-cases.
 *
 * Read-only orchestration that composes focused aggregations from each module's
 * repository (no second seam over any model). Money values are minor units.
 */
export const analyticsService = {
  /** Platform-wide metrics (ADMIN). */
  async platform(): Promise<PlatformAnalytics> {
    const [pay, tx, campaigns, contracts, walletTotals, roles] = await Promise.all([
      paymentRepository.statusBreakdown(),
      transactionRepository.typeBreakdown(),
      campaignRepository.statusBreakdown(),
      contractRepository.statusBreakdown(),
      walletRepository.platformTotals(),
      userRepository.countByRole(),
    ]);

    const payByStatus = new Map(pay.map((r) => [r._id, r]));
    const paidAmount = payByStatus.get('PAID')?.amount ?? 0;
    const releasedAmount = payByStatus.get('RELEASED')?.amount ?? 0;

    return {
      currency: DEFAULT_CURRENCY,
      gmv: paidAmount + releasedAmount,
      totalRevenue: payByStatus.get('RELEASED')?.commission ?? 0,
      escrowHeld: payByStatus.get('PAID')?.creatorAmount ?? 0,
      payments: {
        total: totalCount(pay),
        byStatus: countsByKey(pay),
      },
      totalTransactions: totalCount(tx),
      transactionsByType: Object.fromEntries(
        tx.map((r) => [r._id, { count: r.count, amount: r.amount }])
      ),
      totalCampaigns: totalCount(campaigns),
      campaignsByStatus: countsByKey(campaigns),
      totalContracts: totalCount(contracts),
      contractsByStatus: countsByKey(contracts),
      users: {
        creators: roles.CREATOR,
        brands: roles.BRAND,
        admins: roles.ADMIN,
        total: roles.CREATOR + roles.BRAND + roles.ADMIN,
      },
      creatorEarningsPaidOut: walletTotals.totalEarned,
      generatedAt: new Date().toISOString(),
    };
  },

  /** A creator's earnings, conversion + asset performance. */
  async creator(userId: string): Promise<CreatorAnalytics> {
    const [apps, subs, delivered, wallet, assetPerformance, tx] = await Promise.all([
      applicationRepository.statusBreakdown({ creatorId: userId }),
      submissionRepository.statusBreakdown({ creatorId: userId }),
      submissionRepository.deliveredAnalytics({ creatorId: userId }),
      walletRepository.findByUserId(userId),
      assetRepository.analyticsForCreator(userId),
      transactionRepository.typeBreakdown(userId),
    ]);

    const applications = totalCount(apps);
    const accepted = apps.find((r) => r._id === 'ACCEPTED')?.count ?? 0;
    const subByStatus = countsByKey(subs);
    const approved = subByStatus.APPROVED ?? 0;
    const rejected = subByStatus.REJECTED ?? 0;
    const reviewed = approved + rejected;
    const payoutCount = tx.find((r) => r._id === 'PAYOUT')?.count ?? 0;

    return {
      currency: wallet?.currency ?? DEFAULT_CURRENCY,
      earnings: {
        totalEarned: wallet?.totalEarned ?? 0,
        availableBalance: wallet?.availableBalance ?? 0,
        pendingBalance: wallet?.pendingBalance ?? 0,
        payoutCount,
      },
      conversion: {
        applications,
        accepted,
        conversionRate: applications > 0 ? round2(accepted / applications) : 0,
      },
      deliveries: {
        total: totalCount(subs),
        approved,
        approvalRate: reviewed > 0 ? round2(approved / reviewed) : 0,
        byStatus: subByStatus,
      },
      assetPerformance,
      delivered,
      generatedAt: new Date().toISOString(),
    };
  },

  /** A brand's spend, campaign performance + ROI proxy. */
  async brand(userId: string): Promise<BrandAnalytics> {
    const [pay, campaigns, contracts, apps, delivered] = await Promise.all([
      paymentRepository.statusBreakdown({ brandId: userId }),
      campaignRepository.statusBreakdown(userId),
      contractRepository.statusBreakdown({ brandId: userId }),
      applicationRepository.statusBreakdown({ brandId: userId }),
      submissionRepository.deliveredAnalytics({ brandId: userId }),
    ]);

    const payByStatus = new Map(pay.map((r) => [r._id, r]));
    const funded =
      (payByStatus.get('PAID')?.amount ?? 0) + (payByStatus.get('RELEASED')?.amount ?? 0);
    const refunded = payByStatus.get('REFUNDED')?.amount ?? 0;
    const net = funded - refunded;

    const campaignsTotal = totalCount(campaigns);
    const completed = campaigns.find((r) => r._id === 'COMPLETED')?.count ?? 0;

    const deliveredEngagement =
      delivered.likes + delivered.comments + delivered.shares + delivered.saves;
    const netDollars = net / 100;

    return {
      currency: DEFAULT_CURRENCY,
      spend: { funded, refunded, net },
      campaigns: {
        total: campaignsTotal,
        byStatus: countsByKey(campaigns),
        completionRate: campaignsTotal > 0 ? round2(completed / campaignsTotal) : 0,
      },
      applicationsReceived: totalCount(apps),
      contracts: { total: totalCount(contracts), byStatus: countsByKey(contracts) },
      roi: {
        netSpend: net,
        deliveredImpressions: delivered.impressions,
        deliveredReach: delivered.reach,
        deliveredEngagement,
        impressionsPerDollar: netDollars > 0 ? round2(delivered.impressions / netDollars) : 0,
        effectiveCpmCents:
          delivered.impressions > 0 ? Math.round((net / delivered.impressions) * 1000) : 0,
        note: ROI_NOTE,
      },
      generatedAt: new Date().toISOString(),
    };
  },
};

export type AnalyticsService = typeof analyticsService;
