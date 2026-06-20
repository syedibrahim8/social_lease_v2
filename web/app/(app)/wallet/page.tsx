import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Wallet" };

export default function WalletPage() {
  return (
    <RoutePlaceholder
      title="Wallet"
      description="Balances, payouts, and your transaction ledger."
      layer="Layer 8"
    />
  );
}
