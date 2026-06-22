"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Plus } from "lucide-react";
import { getMyVerifications } from "@/lib/api/endpoints/verifications";
import { useAuth } from "@/lib/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { VerificationItem } from "@/components/verifications/verification-item";
import { VerificationRequestDialog } from "@/components/verifications/verification-request-dialog";
import type { VerificationRequest } from "@/lib/api/mock/verifications";
import type { VerificationEvidence } from "@/lib/api/mock/verifications";

export default function VerificationsPage() {
  const { role, user } = useAuth();
  const query = useQuery({ queryKey: ["verifications", "mine"], queryFn: getMyVerifications });
  const [extra, setExtra] = useState<VerificationRequest[]>([]);
  const [open, setOpen] = useState(false);

  const items = [...extra, ...(query.data ?? [])];

  const onSubmit = (type: string, evidence: VerificationEvidence) => {
    setExtra((prev) => [
      {
        id: `ver_new_${Date.now()}`,
        verificationType: type,
        role: role === "BRAND" ? "BRAND" : "CREATOR",
        submitterName: user.name,
        status: "PENDING",
        evidence,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast.success("Verification submitted", {
      description: "We'll review it shortly.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="Submit verification requests and track their status."
        actions={
          <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
            <Plus />
            Request verification
          </Button>
        }
      />

      {query.isPending ? (
        <Card className="gap-0 divide-border divide-y p-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </Card>
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : items.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<BadgeCheck />}
            title="No verification requests"
            description="Get verified to build trust and unlock more opportunities."
            action={
              <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
                Request verification
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="gap-0 divide-border divide-y p-0">
          {items.map((r) => (
            <VerificationItem key={r.id} request={r} />
          ))}
        </Card>
      )}

      <VerificationRequestDialog
        open={open}
        onOpenChange={setOpen}
        role={role}
        onSubmit={onSubmit}
      />
    </div>
  );
}
