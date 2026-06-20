import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "My Campaigns" };

export default function MyCampaignsPage() {
  return (
    <RoutePlaceholder
      title="My Campaigns"
      description="Create, publish, and manage your campaigns."
      layer="Layer 5"
    />
  );
}
