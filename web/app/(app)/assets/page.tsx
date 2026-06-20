import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Find Creators" };

export default function AssetsMarketplacePage() {
  return (
    <RoutePlaceholder
      title="Creator Asset Marketplace"
      description="Discover creator-owned assets and availability."
      layer="Layer 5"
    />
  );
}
