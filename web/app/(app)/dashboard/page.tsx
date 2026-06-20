import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <RoutePlaceholder
      title="Dashboard"
      description="Your workspace at a glance."
      layer="Layer 4"
    />
  );
}
