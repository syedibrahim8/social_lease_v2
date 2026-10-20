"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  ChartColumn,
  Clock,
  Inbox,
  Receipt,
  Undo2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BackLink } from "@/components/layout/back-link";
import { StatRow } from "@/components/dashboard/stat-row";
import { BarList } from "@/components/charts/bar-list";
import { Meter } from "@/components/charts/meter";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { Amount } from "@/components/money/amount";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getBrandAnalytics,
  getCreatorAnalytics,
  type BrandAnalytics,
  type CreatorAnalytics,
} from "@/lib/api/endpoints/analytics";
import type { AssetCategory, CampaignStatus, ContractStatus, Platform, SubmissionStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  ASSET_CATEGORY_LABEL,
  CAMPAIGN_STATUS,
  CONTRACT_STATUS,
  PLATFORM_LABEL,
  SUBMISSION_STATUS,
} from "@/lib/config/labels";
import { toBars } from "@/lib/charts";
import { formatNumber } from "@/lib/money";
import { qk } from "@/lib/query";

function Loading() {
  return (
    <div className="space-y-4">
      <StatRow loading stats={[]} />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-[11px]">{label}</p>
      <p className="font-display text-bone mt-1 text-xl tabular-nums">{value}</p>
    </div>
  );
}

function CreatorView({ data: a }: { data: CreatorAnalytics }) {
  const d = a.delivered;
  return (
    <div className="space-y-6">
      <StatRow
        stats={[
          { label: "Earned", icon: Banknote, value: a.earnings.totalEarned, money: true, currency: a.currency },
          { label: "Held in escrow", icon: Clock, value: a.earnings.pendingBalance, money: true, currency: a.currency, hint: "Released when work is approved" },
          { label: "Paid out", icon: Wallet, value: a.earnings.availableBalance, money: true, currency: a.currency },
          { label: "Payouts", icon: Receipt, value: a.earnings.payoutCount },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody>
            <Meter
              label="Applications accepted"
              value={a.conversion.conversionRate}
              detail={`${formatNumber(a.conversion.accepted)} of ${formatNumber(a.conversion.applications)} applications`}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Meter
              label="Deliveries approved"
              value={a.deliveries.approvalRate}
              detail={`${formatNumber(a.deliveries.approved)} approved of ${formatNumber(a.deliveries.total)} reviewed or pending`}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody>
            <BarList
              title="Listings by category"
              data={toBars(a.assetPerformance.byCategory, (k) => ASSET_CATEGORY_LABEL[k as AssetCategory] ?? k)}
              emptyLabel="No listings yet."
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <BarList
              title="Listings by platform"
              data={toBars(a.assetPerformance.byPlatform, (k) => PLATFORM_LABEL[k as Platform] ?? k)}
              emptyLabel="No listings yet."
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <BarList
              title="Deliveries"
              data={toBars(a.deliveries.byStatus, (k) => SUBMISSION_STATUS[k as SubmissionStatus]?.label ?? k)}
              emptyLabel="No deliveries yet."
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <p className="text-bone text-[13px] font-medium">Delivered results</p>
            <p className="text-muted mt-0.5 text-[12px]">
              Totals from the analytics on your {formatNumber(d.approvedCount)} approved deliveries.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Figure label="Impressions" value={formatNumber(d.impressions)} />
            <Figure label="Reach" value={formatNumber(d.reach)} />
            <Figure label="Likes" value={formatNumber(d.likes)} />
            <Figure label="Comments" value={formatNumber(d.comments)} />
            <Figure label="Shares" value={formatNumber(d.shares)} />
            <Figure label="Saves" value={formatNumber(d.saves)} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function BrandView({ data: b }: { data: BrandAnalytics }) {
  return (
    <div className="space-y-6">
      <StatRow
        stats={[
          { label: "Funded", icon: Banknote, value: b.spend.funded, money: true, currency: b.currency },
          { label: "Refunded", icon: Undo2, value: b.spend.refunded, money: true, currency: b.currency },
          { label: "Net spend", icon: Wallet, value: b.spend.net, money: true, currency: b.currency, emphasis: true },
          { label: "Applications received", icon: Inbox, value: b.applicationsReceived },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody className="space-y-5">
            <Meter
              label="Campaigns completed"
              value={b.campaigns.completionRate}
              detail={`Of ${formatNumber(b.campaigns.total)} campaigns posted`}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <BarList
              title="Campaigns"
              data={toBars(b.campaigns.byStatus, (k) => CAMPAIGN_STATUS[k as CampaignStatus]?.label ?? k)}
              emptyLabel="No campaigns yet."
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <BarList
              title="Contracts"
              data={toBars(b.contracts.byStatus, (k) => CONTRACT_STATUS[k as ContractStatus]?.label ?? k)}
              emptyLabel="No contracts yet."
            />
          </CardBody>
        </Card>
      </div>

      <Card tone="money">
        <CardBody className="space-y-4">
          <div>
            <p className="text-bone text-[13px] font-medium">Return on spend</p>
            {/* The backend's own caveat, verbatim: this is a delivery proxy. */}
            <p className="text-muted mt-0.5 max-w-[70ch] text-[12px] leading-relaxed">{b.roi.note}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Figure label="Delivered impressions" value={formatNumber(b.roi.deliveredImpressions)} />
            <Figure label="Delivered reach" value={formatNumber(b.roi.deliveredReach)} />
            <Figure label="Impressions per $1" value={formatNumber(Math.round(b.roi.impressionsPerDollar))} />
            <div>
              <p className="text-muted text-[11px]">Effective CPM</p>
              <Amount minor={Math.round(b.roi.effectiveCpmCents)} currency={b.currency} className="mt-1 block text-xl" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AnalyticsBody() {
  const { role } = useAuth();
  const params = useSearchParams();
  // An admin looks at someone else's dashboard; everyone else sees their own.
  const targetUser = role === "ADMIN" ? (params.get("userId") ?? undefined) : undefined;
  const targetRole = role === "ADMIN" ? params.get("role") : role;
  const isCreatorView = targetRole === "CREATOR";
  const isBrandView = targetRole === "BRAND";

  const creator = useQuery({
    queryKey: qk.analytics("creator", targetUser),
    queryFn: () => getCreatorAnalytics(targetUser),
    enabled: isCreatorView && (role !== "ADMIN" || Boolean(targetUser)),
  });
  const brand = useQuery({
    queryKey: qk.analytics("brand", targetUser),
    queryFn: () => getBrandAnalytics(targetUser),
    enabled: isBrandView && (role !== "ADMIN" || Boolean(targetUser)),
  });

  if (role === "ADMIN" && (!targetUser || (!isCreatorView && !isBrandView))) {
    return (
      <EmptyState
        icon={ChartColumn}
        title="Pick someone to look at"
        description="Open a creator's or brand's analytics from the verification queue. Platform totals are on the overview."
      />
    );
  }

  return (
    <>
      {role === "ADMIN" ? <BackLink href="/admin/verifications">Verification queue</BackLink> : null}
      <PageHeader
        title={role === "ADMIN" ? (isCreatorView ? "Creator analytics" : "Brand analytics") : "Analytics"}
        description={
          isCreatorView
            ? "What you've earned, how often you land work, and what your deliveries achieved."
            : "What you've spent, how campaigns are going, and what the work delivered."
        }
      />
      {isCreatorView ? (
        <QueryBoundary query={creator} skeleton={<Loading />}>
          {(data) => <CreatorView data={data} />}
        </QueryBoundary>
      ) : (
        <QueryBoundary query={brand} skeleton={<Loading />}>
          {(data) => <BrandView data={data} />}
        </QueryBoundary>
      )}
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AnalyticsBody />
    </Suspense>
  );
}

