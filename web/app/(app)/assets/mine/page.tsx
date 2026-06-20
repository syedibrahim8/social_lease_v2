import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "My Assets" };

export default function MyAssetsPage() {
  return (
    <RoutePlaceholder
      title="My Assets"
      description="List your assets and manage availability."
      layer="Layer 5"
    />
  );
}
