import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Campaign Marketplace" };

export default function MarketplacePage() {
  return (
    <RoutePlaceholder
      title="Campaign Marketplace"
      description="Browse published campaigns and apply."
      layer="Layer 5"
    />
  );
}
