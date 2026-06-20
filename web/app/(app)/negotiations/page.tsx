import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Negotiations" };

export default function NegotiationsPage() {
  return (
    <RoutePlaceholder
      title="Negotiation Center"
      description="Track offers and counter, accept, or reject."
      layer="Layer 6"
    />
  );
}
