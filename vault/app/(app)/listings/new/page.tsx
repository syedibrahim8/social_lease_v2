"use client";

import { LayoutGrid } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { AssetForm } from "@/components/assets/asset-form";
import { useAuth } from "@/lib/auth/auth-provider";

export default function NewListingPage() {
  const { role } = useAuth();
  if (role !== "CREATOR") {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Listings belong to creators"
        description="Brands browse them from Find creators."
      />
    );
  }
  return (
    <>
      <BackLink href="/listings">My listings</BackLink>
      <PageHeader title="New listing" description="Brands can find it as soon as you publish." />
      <AssetForm />
    </>
  );
}
