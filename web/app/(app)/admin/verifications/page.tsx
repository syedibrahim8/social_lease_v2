"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ShieldCheck, X } from "lucide-react";
import { getAllVerifications } from "@/lib/api/endpoints/verifications";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/field";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { VerificationItem } from "@/components/verifications/verification-item";
import type { VerificationRequest } from "@/lib/api/mock/verifications";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminVerificationsPage() {
  const query = useQuery({ queryKey: ["verifications", "all"], queryFn: getAllVerifications });
  const [overrides, setOverrides] = useState<Record<string, VerificationRequest>>({});
  const [status, setStatus] = useState("all");
  const [rejecting, setRejecting] = useState<VerificationRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const items = useMemo(() => {
    const merged = (query.data ?? []).map((r) => overrides[r.id] ?? r);
    return merged.filter((r) => status === "all" || r.status === status);
  }, [query.data, overrides, status]);

  const now = () => new Date().toISOString();

  const approve = (r: VerificationRequest) => {
    setOverrides((p) => ({ ...p, [r.id]: { ...r, status: "APPROVED", reviewedAt: now() } }));
    toast.success("Verification approved", { description: `${r.submitterName}'s profile updated.` });
  };

  const confirmReject = () => {
    if (!rejecting) return;
    const r = rejecting;
    setOverrides((p) => ({
      ...p,
      [r.id]: { ...r, status: "REJECTED", reviewedAt: now(), reviewNote: rejectNote || undefined },
    }));
    setRejecting(null);
    setRejectNote("");
    toast.success("Verification rejected");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification Queue"
        description="Review and approve identity and ownership requests."
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {query.isPending ? (
        <Card className="gap-0 divide-border divide-y p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))}
        </Card>
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : items.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={<ShieldCheck />} title="Nothing to review" />
        </Card>
      ) : (
        <Card className="gap-0 divide-border divide-y p-0">
          {items.map((r) => (
            <VerificationItem
              key={r.id}
              request={r}
              showSubmitter
              actions={
                r.status === "PENDING" ? (
                  <>
                    <Button variant="brand" size="sm" onClick={() => approve(r)}>
                      <Check />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejecting(r);
                        setRejectNote("");
                      }}
                    >
                      <X />
                      Reject
                    </Button>
                  </>
                ) : undefined
              }
            />
          ))}
        </Card>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject verification</DialogTitle>
            <DialogDescription>
              Optionally tell the submitter why so they can resubmit.
            </DialogDescription>
          </DialogHeader>
          <Field label="Reason (optional)" htmlFor="reject-note">
            <Textarea
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="What needs to change…"
            />
          </Field>
          <DialogFooter>
            <Button variant="destructive-solid" onClick={confirmReject}>
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
