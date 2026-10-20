"use client";

import { Megaphone } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { CampaignForm } from "@/components/campaign/campaign-form";
import { useAuth } from "@/lib/auth/auth-provider";

export default function NewCampaignPage() {
  const { role } = useAuth();
  if (role !== "BRAND") {
    return (
      <EmptyState
        icon={Megaphone}
        title="Campaigns are posted by brands"
        description="Creators apply to campaigns from the marketplace."
      />
    );
  }
  return (
    <>
      <BackLink href="/campaigns/mine">My campaigns</BackLink>
      <PageHeader
        title="New campaign"
        description="Saved as a private draft until you publish it."
      />
      <CampaignForm />
    </>
  );
}
