import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Admin Overview" };

export default function AdminPage() {
  return (
    <RoutePlaceholder
      title="Admin Overview"
      description="GMV, revenue, escrow, and platform health."
      layer="Layer 4"
    />
  );
}
