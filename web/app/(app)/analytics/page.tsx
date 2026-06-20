import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <RoutePlaceholder
      title="Analytics"
      description="Performance, earnings, and platform metrics."
      layer="Layer 9"
    />
  );
}
