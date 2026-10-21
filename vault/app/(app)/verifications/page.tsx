"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { SubmitVerificationDialog } from "@/components/verification/submit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BRAND_VERIFICATION_TYPES,
  CREATOR_VERIFICATION_TYPES,
  getMyVerifications,
  type VerificationRequest,
  type VerificationType,
} from "@/lib/api/endpoints/verifications";
import { useAuth } from "@/lib/auth/auth-provider";
import { useMyProfile } from "@/lib/auth/use-profile";
import { VERIFICATION_REQUEST_STATUS, VERIFICATION_TYPE_LABEL } from "@/lib/config/labels";
import { qk } from "@/lib/query";
import { formatDistanceToNow } from "date-fns";

/** The most recent request of each type (the list is newest first). */
function latestByType(items: VerificationRequest[]): Map<VerificationType, VerificationRequest> {
  const map = new Map<VerificationType, VerificationRequest>();
  for (const r of [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (!map.has(r.verificationType)) map.set(r.verificationType, r);
  }
  return map;
}

export default function VerificationsPage() {
  const { role } = useAuth();
  const { missing } = useMyProfile();
  const [open, setOpen] = useState<VerificationType | null>(null);
  const applies = role === "CREATOR" || role === "BRAND";
  const query = useQuery({ queryKey: qk.myVerifications(), queryFn: getMyVerifications, enabled: applies });

  if (!applies) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Verification is for creators and brands"
        description="Review requests from the admin queue."
      />
    );
  }

  const types = role === "CREATOR" ? CREATOR_VERIFICATION_TYPES : BRAND_VERIFICATION_TYPES;

  return (
    <>
      <PageHeader
        title="Verification"
        description={
          role === "CREATOR"
            ? "Verified creators rank higher for brands and get paid with fewer questions."
            : "Verified brands get more and better applications from creators."
        }
      />
      {missing ? (
        <EmptyState
          icon={ShieldCheck}
          title="Set up your profile first"
          description="Verification is recorded on your profile, so create it before requesting one."
        />
      ) : (
        <QueryBoundary
          query={query}
          skeleton={
            <div className="grid gap-3 md:grid-cols-3">
              {types.map((t) => (
                <Skeleton key={t} className="h-44 w-full" />
              ))}
            </div>
          }
        >
          {(page) => {
            const latest = latestByType(page.items);
            return (
              <div className="grid gap-3 md:grid-cols-3">
                {types.map((type) => {
                  const request = latest.get(type);
                  const status = request ? VERIFICATION_REQUEST_STATUS[request.status] : null;
                  const pending = request?.status === "PENDING";
                  const approved = request?.status === "APPROVED";
                  return (
                    <Card key={type}>
                      <CardBody className="flex h-full flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-bone text-[14px] font-medium">{VERIFICATION_TYPE_LABEL[type].label}</p>
                          {status ? (
                            <Badge tone={status.tone}>
                              {approved ? <BadgeCheck aria-hidden="true" /> : null}
                              {status.label}
                            </Badge>
                          ) : (
                            <Badge tone="muted">Not requested</Badge>
                          )}
                        </div>
                        <p className="text-muted flex-1 text-[12px] leading-relaxed">
                          {VERIFICATION_TYPE_LABEL[type].description}
                        </p>
                        {request?.status === "REJECTED" && request.reviewNote ? (
                          <p className="border-negative/25 bg-negative/8 text-bone-2 rounded-lg border px-3 py-2 text-[12px] leading-relaxed">
                            {request.reviewNote}
                          </p>
                        ) : null}
                        {request ? (
                          <p className="text-muted text-[11px]">
                            {pending ? "Sent" : "Reviewed"}{" "}
                            {formatDistanceToNow(new Date(request.reviewedAt ?? request.createdAt), { addSuffix: true })}
                          </p>
                        ) : null}
                        {approved ? null : (
                          <Button
                            size="sm"
                            variant={request?.status === "REJECTED" ? "quiet" : "gold"}
                            disabled={pending}
                            onClick={() => setOpen(type)}
                          >
                            {pending ? "In review" : request?.status === "REJECTED" ? "Try again" : "Request"}
                          </Button>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            );
          }}
        </QueryBoundary>
      )}
      {open ? (
        <SubmitVerificationDialog type={open} open onOpenChange={(next) => !next && setOpen(null)} />
      ) : null}
    </>
  );
}
