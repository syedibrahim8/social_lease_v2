"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Banknote, HandCoins, Landmark, Lock, ShieldCheck } from "lucide-react";
import { AdminOnly } from "@/components/layout/admin-only";
import { PageHeader } from "@/components/layout/page-header";
import { StatRow } from "@/components/dashboard/stat-row";
import { BarList } from "@/components/charts/bar-list";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { Amount } from "@/components/money/amount";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getPlatformAnalytics } from "@/lib/api/endpoints/analytics";
import { getVerifications } from "@/lib/api/endpoints/verifications";
import type { CampaignStatus, ContractStatus } from "@/lib/api/types";
import {
  CAMPAIGN_STATUS,
  CONTRACT_STATUS,
  PAYMENT_STATUS_LABEL,
  TRANSACTION_TYPE_LABEL,
} from "@/lib/config/labels";
import { toBars } from "@/lib/charts";
import { formatNumber } from "@/lib/money";
import { qk } from "@/lib/query";

function Overview() {
  const query = useQuery({ queryKey: qk.analytics("platform"), queryFn: getPlatformAnalytics });
  const pending = useQuery({
    queryKey: qk.verifications({ status: "PENDING", limit: 1 }),
    queryFn: () => getVerifications({ status: "PENDING", limit: 1 }),
  });
  const waiting = pending.data?.meta?.totalItems ?? pending.data?.items.length ?? 0;

  return (
    <QueryBoundary
      query={query}
      skeleton={
        <div className="space-y-4">
          <StatRow loading stats={[]} />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      {(p) => (
        <div className="space-y-6">
          <StatRow
            stats={[
              { label: "Gross merchandise value", icon: Landmark, value: p.gmv, money: true, currency: p.currency, hint: "Funded contract value" },
              { label: "Platform revenue", icon: HandCoins, value: p.totalRevenue, money: true, currency: p.currency, hint: "Fees on released payouts" },
              { label: "Held in escrow", icon: Lock, value: p.escrowHeld, money: true, currency: p.currency, emphasis: p.escrowHeld > 0 },
              { label: "Paid to creators", icon: Banknote, value: p.creatorEarningsPaidOut, money: true, currency: p.currency },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardBody className="grid gap-4 sm:grid-cols-4">
                {(
                  [
                    ["Users", p.users.total],
                    ["Creators", p.users.creators],
                    ["Brands", p.users.brands],
                    ["Admins", p.users.admins],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted text-[11px]">{label}</p>
                    <p className="font-display text-bone mt-1 text-2xl tabular-nums">{formatNumber(value)}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Link
              href="/admin/verifications"
              className="focus-visible:ring-gold/50 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:border-bone/15 h-full transition-colors">
                <CardBody className="flex h-full items-center justify-between gap-3">
                  <div>
                    <p className="text-muted flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                      Waiting for review
                    </p>
                    <p className="font-display text-bone mt-1 text-2xl tabular-nums">{waiting}</p>
                  </div>
                  <ArrowRight className="text-muted size-4" aria-hidden="true" />
                </CardBody>
              </Card>
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardBody>
                <BarList
                  title={`Campaigns (${formatNumber(p.totalCampaigns)})`}
                  data={toBars(p.campaignsByStatus, (k) => CAMPAIGN_STATUS[k as CampaignStatus]?.label ?? k)}
                />
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <BarList
                  title={`Contracts (${formatNumber(p.totalContracts)})`}
                  data={toBars(p.contractsByStatus, (k) => CONTRACT_STATUS[k as ContractStatus]?.label ?? k)}
                />
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <BarList
                  title={`Payments (${formatNumber(p.payments.total)})`}
                  data={toBars(p.payments.byStatus, (k) => PAYMENT_STATUS_LABEL[k] ?? k)}
                />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <p className="text-bone mb-3 text-[13px] font-medium">
                Ledger ({formatNumber(p.totalTransactions)} entries)
              </p>
              {Object.keys(p.transactionsByType).length === 0 ? (
                <p className="text-muted text-[12px]">No money has moved yet.</p>
              ) : (
                <div className="scroll-x">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Type</TH>
                        <TH className="text-right">Entries</TH>
                        <TH className="text-right">Net amount</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {Object.entries(p.transactionsByType).map(([type, row]) => (
                        <TR key={type}>
                          <TD>{TRANSACTION_TYPE_LABEL[type] ?? type}</TD>
                          <TD className="tnum text-right">{formatNumber(row.count)}</TD>
                          <TD className="text-right">
                            <Amount minor={row.amount} currency={p.currency} />
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>

          <p className="text-muted text-[11px]">
            Figures as of {format(new Date(p.generatedAt), "d MMM yyyy, HH:mm")}.
          </p>
        </div>
      )}
    </QueryBoundary>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminOnly>
      <PageHeader title="Platform overview" description="Money, people and activity across Social Lease." />
      <Overview />
    </AdminOnly>
  );
}
