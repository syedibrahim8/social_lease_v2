"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Inbox } from "lucide-react";
import { AdminOnly } from "@/components/layout/admin-only";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { ReviewSheet } from "@/components/verification/review-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChoicePills } from "@/components/ui/choice-pills";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  VERIFICATION_REQUEST_STATUSES,
  VERIFICATION_TYPES,
  getVerifications,
  type VerificationFilters,
  type VerificationRequest,
  type VerificationRequestStatus,
  type VerificationType,
} from "@/lib/api/endpoints/verifications";
import { refOrNull } from "@/lib/api/types";
import { VERIFICATION_REQUEST_STATUS, VERIFICATION_TYPE_LABEL } from "@/lib/config/labels";
import { qk } from "@/lib/query";

const LIMIT = 20;

function Queue() {
  const [status, setStatus] = useState<VerificationRequestStatus | "ALL">("PENDING");
  const [role, setRole] = useState<"CREATOR" | "BRAND" | "ALL">("ALL");
  const [type, setType] = useState<VerificationType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<VerificationRequest | null>(null);

  const filters: VerificationFilters = {
    page,
    limit: LIMIT,
    ...(status !== "ALL" ? { status } : {}),
    ...(role !== "ALL" ? { role } : {}),
    ...(type !== "ALL" ? { verificationType: type } : {}),
  };
  const query = useQuery({ queryKey: qk.verifications(filters), queryFn: () => getVerifications(filters) });

  // Any filter change starts from the first page.
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <>
      <div className="mb-5 space-y-3">
        <ChoicePills
          label="Status"
          options={[
            ...VERIFICATION_REQUEST_STATUSES.map((s) => ({ value: s, label: VERIFICATION_REQUEST_STATUS[s].label })),
            { value: "ALL" as const, label: "All" },
          ]}
          value={status}
          onChange={reset(setStatus)}
        />
        <div className="flex flex-wrap gap-3">
          <ChoicePills
            label="Role"
            options={[
              { value: "ALL" as const, label: "Everyone" },
              { value: "CREATOR" as const, label: "Creators" },
              { value: "BRAND" as const, label: "Brands" },
            ]}
            value={role}
            onChange={reset(setRole)}
          />
          <ChoicePills
            label="Type"
            options={[
              { value: "ALL" as const, label: "Any type" },
              ...VERIFICATION_TYPES.map((t) => ({ value: t, label: VERIFICATION_TYPE_LABEL[t].label })),
            ]}
            value={type}
            onChange={reset(setType)}
          />
        </div>
      </div>

      <QueryBoundary query={query} skeleton={<Skeleton className="h-64 w-full" />}>
        {(result) =>
          result.items.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={status === "PENDING" ? "Nothing waiting for review" : "No requests match"}
              description={
                status === "PENDING"
                  ? "New verification requests from creators and brands appear here."
                  : "Try a different filter."
              }
            />
          ) : (
            <>
              <div className="scroll-x">
                <Table>
                  <THead>
                    <TR>
                      <TH>Who</TH>
                      <TH>Type</TH>
                      <TH>Submitted</TH>
                      <TH>Status</TH>
                      <TH className="text-right">
                        <span className="sr-only">Open</span>
                      </TH>
                    </TR>
                  </THead>
                  <TBody>
                    {result.items.map((r) => {
                      const user = refOrNull(r.userId);
                      return (
                        <TR key={r.id}>
                          <TD>
                            <p className="text-bone text-[13px]">{user?.name ?? "Unknown"}</p>
                            <p className="text-muted text-[11px]">
                              {r.role === "CREATOR" ? "Creator" : "Brand"}
                              {user?.email ? ` · ${user.email}` : ""}
                            </p>
                          </TD>
                          <TD>{VERIFICATION_TYPE_LABEL[r.verificationType].label}</TD>
                          <TD className="text-muted">
                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </TD>
                          <TD>
                            <Badge tone={VERIFICATION_REQUEST_STATUS[r.status].tone}>
                              {VERIFICATION_REQUEST_STATUS[r.status].label}
                            </Badge>
                          </TD>
                          <TD className="text-right">
                            <Button size="sm" variant={r.status === "PENDING" ? "quiet" : "ghost"} onClick={() => setOpen(r)}>
                              {r.status === "PENDING" ? "Review" : "View"}
                            </Button>
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
              {result.meta && result.meta.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="tnum text-muted text-[12px]">
                    Page {result.meta.page} of {result.meta.totalPages} · {result.meta.totalItems} requests
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" disabled={!result.meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button size="sm" variant="ghost" disabled={!result.meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )
        }
      </QueryBoundary>

      <ReviewSheet request={open} onOpenChange={(next) => !next && setOpen(null)} />
    </>
  );
}

export default function AdminVerificationsPage() {
  return (
    <AdminOnly>
      <PageHeader
        title="Verification queue"
        description="Approving updates the person's profile badge straight away. Rejecting needs a note, and they see it."
      />
      <Queue />
    </AdminOnly>
  );
}
