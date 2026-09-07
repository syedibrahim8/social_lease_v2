"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  ClipboardCheck,
  Compass,
  FileText,
  Lock,
  Megaphone,
  MessagesSquare,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatRow, type Stat } from "@/components/dashboard/stat-row";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Amount } from "@/components/money/amount";
import { EmptyState } from "@/components/feedback/empty-state";
import { getContracts } from "@/lib/api/endpoints/contracts";
import { getMyCampaigns } from "@/lib/api/endpoints/campaigns";
import { getWallet } from "@/lib/api/endpoints/payments";
import {
  getMyApplications,
  getReceivedApplications,
} from "@/lib/api/endpoints/applications";
import { CONTRACT_STATUS } from "@/lib/config/labels";
import { refOrNull } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { qk } from "@/lib/query";

/** Contract states where the ball is in someone's court. */
const OPEN = new Set(["PENDING_FUNDING", "FUNDED", "IN_PROGRESS", "SUBMITTED", "APPROVED"]);

const LINKS = {
  CREATOR: [
    { href: "/marketplace", icon: Compass, label: "Find campaigns" },
    { href: "/negotiations", icon: MessagesSquare, label: "Negotiations" },
    { href: "/contracts", icon: FileText, label: "Contracts" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
  ],
  BRAND: [
    { href: "/campaigns/mine", icon: Megaphone, label: "My campaigns" },
    { href: "/assets", icon: Users, label: "Find creators" },
    { href: "/contracts", icon: FileText, label: "Contracts" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
  ],
  ADMIN: [],
} as const;

export default function DashboardPage() {
  const { user, role } = useAuth();
  const isCreator = role === "CREATOR";

  const contracts = useQuery({
    queryKey: qk.contracts(),
    queryFn: () => getContracts(),
    enabled: Boolean(role) && role !== "ADMIN",
  });

  // Creator-only: the wallet endpoint is authorize('CREATOR') on the backend.
  const wallet = useQuery({
    queryKey: qk.wallet(),
    queryFn: getWallet,
    enabled: isCreator,
  });

  const campaigns = useQuery({
    queryKey: qk.myCampaigns(),
    queryFn: () => getMyCampaigns(),
    enabled: role === "BRAND",
  });

  const applications = useQuery({
    queryKey: qk.applications(isCreator ? "mine" : "received"),
    queryFn: () => (isCreator ? getMyApplications() : getReceivedApplications()),
    enabled: Boolean(role) && role !== "ADMIN",
  });

  if (!user || !role) return null;

  const firstName = user.name.split(" ")[0] ?? user.name;
  const items = contracts.data?.items ?? [];
  const open = items.filter((c) => OPEN.has(c.status));
  const awaitingMe = items.filter((c) =>
    isCreator ? c.status === "FUNDED" || c.status === "IN_PROGRESS" : c.status === "SUBMITTED",
  );
  const inEscrow = items
    .filter((c) => OPEN.has(c.status) && c.status !== "PENDING_FUNDING")
    .reduce((sum, c) => sum + c.agreedPrice, 0);
  const liveOffers = (applications.data?.items ?? []).filter(
    (a) => a.status === "PENDING" || a.status === "NEGOTIATING",
  ).length;

  const loading =
    contracts.isPending || applications.isPending || (isCreator && wallet.isPending);

  const stats: Stat[] = isCreator
    ? [
        {
          label: "Available",
          icon: Banknote,
          value: wallet.data?.availableBalance ?? 0,
          money: true,
          currency: wallet.data?.currency ?? "USD",
          hint: "Settled to your Stripe account",
        },
        {
          label: "In escrow",
          icon: Lock,
          value: wallet.data?.pendingBalance ?? 0,
          money: true,
          currency: wallet.data?.currency ?? "USD",
          hint: "Held against active contracts",
          emphasis: (wallet.data?.pendingBalance ?? 0) > 0,
        },
        { label: "Open contracts", icon: FileText, value: open.length },
        { label: "Live offers", icon: MessagesSquare, value: liveOffers },
      ]
    : [
        {
          label: "Committed",
          icon: Lock,
          value: inEscrow,
          money: true,
          hint: "Held in escrow across active contracts",
          emphasis: inEscrow > 0,
        },
        {
          label: "Awaiting your review",
          icon: ClipboardCheck,
          value: awaitingMe.length,
          hint: awaitingMe.length > 0 ? "Deliveries need approving" : undefined,
        },
        { label: "Open contracts", icon: FileText, value: open.length },
        {
          label: "Live campaigns",
          icon: Megaphone,
          value: (campaigns.data?.items ?? []).filter((c) => c.status === "PUBLISHED").length,
        },
      ];

  if (role === "ADMIN") {
    return (
      <>
        <PageHeader title={`Welcome back, ${firstName}`} />
        <Card>
          <CardBody>
            <p className="text-muted text-[13px] leading-relaxed">
              Vault covers the creator and brand workflows. Admin review still lives in the
              original app.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Escrow-backed work, from first offer to cleared payout."
      />

      <StatRow stats={stats} loading={loading} />

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="text-bone mb-3 text-[13px] font-medium">
            {awaitingMe.length > 0 ? "Needs you" : "Active contracts"}
          </h2>

          {loading ? null : open.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nothing in flight"
              description={
                isCreator
                  ? "Once an offer is accepted and the brand funds escrow, the work shows up here."
                  : "Accept a creator's offer and fund escrow, and the contract will appear here."
              }
            />
          ) : (
            <div className="space-y-2.5">
              {(awaitingMe.length > 0 ? awaitingMe : open).slice(0, 5).map((c) => {
                const status = CONTRACT_STATUS[c.status];
                const campaign = refOrNull(c.campaignId);
                const other = refOrNull(isCreator ? c.brandId : c.creatorId);
                return (
                  <Link key={c.id} href={`/contracts/${c.id}`} className="group block">
                    <Card className="hover:border-line transition-colors">
                      <CardBody className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <p className="text-bone group-hover:text-gold-lo mt-1.5 truncate text-[13px] font-medium transition-colors">
                            {campaign?.title ?? "Contract"}
                          </p>
                          <p className="text-muted mt-0.5 truncate text-xs">
                            {other?.name ?? "—"}
                          </p>
                        </div>
                        <Amount
                          minor={c.agreedPrice}
                          currency={c.currency}
                          className="text-[13px]"
                        />
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-bone mb-3 text-[13px] font-medium">Go to</h2>
          <div className="grid gap-2">
            {LINKS[role].map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.href} href={l.href} className="group block">
                  <Card className="hover:border-line transition-colors">
                    <CardBody className="flex items-center gap-3 py-3.5">
                      <span className="bg-bone/6 text-muted group-hover:text-gold-lo grid size-8 shrink-0 place-items-center rounded-lg transition-colors">
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-bone-2 group-hover:text-bone text-[13px] transition-colors">
                        {l.label}
                      </span>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
