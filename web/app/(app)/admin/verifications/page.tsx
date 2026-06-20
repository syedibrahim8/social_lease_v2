import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Verification Queue" };

export default function AdminVerificationsPage() {
  return (
    <RoutePlaceholder
      title="Verification Queue"
      description="Review and approve identity and ownership requests."
      layer="Layer 10"
    />
  );
}
