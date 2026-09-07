"use client";

import Link from "next/link";
import { Compass, FileText, Megaphone, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * The dashboard's real metrics arrive with the wallet and contract screens.
 * Until then it shows only what is genuinely known — who you are and where the
 * work happens — rather than inventing numbers to fill the space.
 */
const ROUTES = {
  CREATOR: [
    { href: "/marketplace", icon: Compass, label: "Find campaigns", copy: "Browse briefs that are open to applications." },
    { href: "/negotiations", icon: FileText, label: "Negotiations", copy: "Offers waiting on you or on the brand." },
    { href: "/contracts", icon: FileText, label: "Contracts", copy: "Agreed work, funding status and delivery." },
    { href: "/wallet", icon: Wallet, label: "Wallet", copy: "Balances, escrow and your payout account." },
  ],
  BRAND: [
    { href: "/campaigns/mine", icon: Megaphone, label: "My campaigns", copy: "Briefs you have posted and their status." },
    { href: "/assets", icon: Users, label: "Find creators", copy: "Browse creators and what they offer." },
    { href: "/contracts", icon: FileText, label: "Contracts", copy: "Fund escrow, review delivery, release payment." },
    { href: "/wallet", icon: Wallet, label: "Wallet", copy: "What you have committed and what was refunded." },
  ],
  ADMIN: [],
} as const;

export default function DashboardPage() {
  const { user, role } = useAuth();
  if (!user || !role) return null;

  const firstName = user.name.split(" ")[0] ?? user.name;
  const routes = ROUTES[role];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          role === "ADMIN"
            ? "The admin console is not part of this app yet."
            : "Escrow-backed work, from first offer to cleared payout."
        }
      />

      {routes.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-muted text-[13px] leading-relaxed">
              Vault covers the creator and brand workflows. Admin review still lives in the
              original app.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {routes.map((r) => {
            const Icon = r.icon;
            return (
              <Link key={r.href} href={r.href} className="group">
                <Card className="hover:border-line h-full transition-colors">
                  <CardBody className="flex items-start gap-3.5">
                    <span className="bg-bone/6 text-muted group-hover:text-gold-lo grid size-9 shrink-0 place-items-center rounded-lg transition-colors">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-bone text-[13px] font-medium">{r.label}</p>
                      <p className="text-muted mt-1 text-xs leading-relaxed">{r.copy}</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
