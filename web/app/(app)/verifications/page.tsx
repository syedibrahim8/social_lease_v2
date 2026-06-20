import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Verification" };

export default function VerificationsPage() {
  return (
    <RoutePlaceholder
      title="Verification"
      description="Submit verification requests and track their status."
      layer="Layer 10"
    />
  );
}
