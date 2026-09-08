"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Lock, Receipt, Wallet as WalletIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConnectStatusCard } from "@/components/wallet/connect-status-card";
import { BalanceCard } from "@/components/money/balance-card";
import { LedgerTable } from "@/components/money/ledger-table";
import { Amount } from "@/components/money/amount";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTransactions, getWallet } from "@/lib/api/endpoints/payments";
import { useAuth } from "@/lib/auth/auth-provider";
import { qk } from "@/lib/query";
import type { Transaction } from "@/lib/api/types";

function LedgerSkeleton() {
  return (
    <Card>
      <CardBody className="space-y-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </CardBody>
    </Card>
  );
}

/** Sum one direction of the ledger. Signs are the backend's. */
function total(rows: Transaction[], predicate: (t: Transaction) => boolean): number {
  return rows.filter(predicate).reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export default function WalletPage() {
  const { role } = useAuth();
  const isCreator = role === "CREATOR";

  // GET /payments/wallet is authorize('CREATOR'), so a brand has no wallet
  // document at all — their figures come from the ledger instead.
  const wallet = useQuery({
    queryKey: qk.wallet(),
    queryFn: getWallet,
    enabled: isCreator,
  });

  const transactions = useQuery({
    queryKey: qk.transactions(),
    queryFn: () => getTransactions({ limit: 100 }),
    enabled: Boolean(role),
  });

  const rows = transactions.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Wallet"
        description={
          isCreator
            ? "What you have earned, what is still held in escrow, and every movement behind it."
            : "What you have committed to escrow, what came back, and every movement behind it."
        }
      />

      {isCreator ? (
        <div className="space-y-4">
          <ConnectStatusCard />

          {wallet.isPending ? (
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <BalanceCard
                label="Available"
                minor={wallet.data?.availableBalance ?? 0}
                currency={wallet.data?.currency ?? "USD"}
                sub="Released to your Stripe account"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    title="Payouts to your bank are scheduled by Stripe"
                  >
                    <a
                      href="https://dashboard.stripe.com/test/connect/accounts/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View in Stripe
                    </a>
                  </Button>
                }
              />

              <Card>
                <CardBody className="space-y-4">
                  <div>
                    <p className="text-muted flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase">
                      <Lock className="size-3" aria-hidden="true" />
                      In escrow
                    </p>
                    <Amount
                      minor={wallet.data?.pendingBalance ?? 0}
                      currency={wallet.data?.currency ?? "USD"}
                      className="mt-2 block text-xl"
                    />
                    <p className="text-muted mt-1.5 text-[11px] leading-relaxed">
                      Funded by brands and held until they approve your delivery.
                    </p>
                  </div>
                  <div className="border-line-2 border-t pt-4">
                    <p className="text-muted flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase">
                      <Banknote className="size-3" aria-hidden="true" />
                      Earned all time
                    </p>
                    <Amount
                      minor={wallet.data?.totalEarned ?? 0}
                      currency={wallet.data?.currency ?? "USD"}
                      className="mt-2 block text-xl"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <QueryBoundary
          query={transactions}
          skeleton={
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          }
        >
          {(page) => {
            const spent = total(page.items, (t) => t.type === "SPEND");
            const refunded = total(page.items, (t) => t.type === "REFUND");
            return (
              <div className="grid gap-4 sm:grid-cols-3">
                <BalanceCard
                  label="Committed"
                  minor={spent - refunded}
                  sub="Net of anything refunded"
                />
                <Card>
                  <CardBody>
                    <p className="text-muted text-[10px] font-semibold tracking-[0.16em] uppercase">
                      Funded to escrow
                    </p>
                    <Amount minor={spent} className="mt-2 block text-xl" />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-muted text-[10px] font-semibold tracking-[0.16em] uppercase">
                      Refunded to you
                    </p>
                    <Amount minor={refunded} className="mt-2 block text-xl" />
                  </CardBody>
                </Card>
              </div>
            );
          }}
        </QueryBoundary>
      )}

      <div className="mt-8">
        <h2 className="text-bone mb-3 text-[13px] font-medium">Every movement</h2>
        <QueryBoundary query={transactions} skeleton={<LedgerSkeleton />}>
          {(page) =>
            page.items.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nothing has moved yet"
                description={
                  isCreator
                    ? "Once a brand funds a contract you are on, the escrow credit shows up here, followed by the payout when they approve your work."
                    : "Fund a contract and both the escrow charge and any refund will be recorded here."
                }
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href={isCreator ? "/marketplace" : "/contracts"}>
                      {isCreator ? "Find campaigns" : "Go to contracts"}
                    </Link>
                  </Button>
                }
              />
            ) : (
              <LedgerTable transactions={page.items} />
            )
          }
        </QueryBoundary>
      </div>

      {rows.length > 0 ? (
        <p className="text-muted mt-3 flex items-center gap-1.5 text-[11px]">
          <WalletIcon className="size-3" aria-hidden="true" />
          {isCreator
            ? "Your creator rows are net of the platform fee. The brand's ledger records the gross they paid."
            : "Your rows record the gross you paid. The creator's ledger records their share, net of the platform fee."}
        </p>
      ) : null}
    </>
  );
}
