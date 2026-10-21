"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { FraudCheck } from "@/components/ai/fraud-check";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  approveVerification,
  getVerificationAudit,
  rejectVerification,
  type VerificationRequest,
} from "@/lib/api/endpoints/verifications";
import { refId, refOrNull } from "@/lib/api/types";
import { VERIFICATION_REQUEST_STATUS, VERIFICATION_TYPE_LABEL } from "@/lib/config/labels";
import { invalidateFor, qk } from "@/lib/query";

function EvidenceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-gold-lo inline-flex max-w-full items-center gap-1 text-[13px] break-all hover:underline"
    >
      {label}
      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
    </a>
  );
}

const ACTION_LABEL = { SUBMITTED: "Submitted", APPROVED: "Approved", REJECTED: "Rejected" } as const;

/** One request: its evidence, its history, and the decision. */
export function ReviewSheet({
  request,
  onOpenChange,
}: {
  request: VerificationRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const audit = useQuery({
    queryKey: qk.verificationAudit(request?.id ?? ""),
    queryFn: () => getVerificationAudit(request?.id ?? ""),
    enabled: Boolean(request),
  });

  const done = (message: string) => {
    invalidateFor(queryClient, "verification", [qk.verificationAudit(request?.id ?? "")]);
    setNote("");
    setNoteError(null);
    toast.success(message);
    onOpenChange(false);
  };
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not record the decision.");

  const approve = useMutation({
    mutationFn: () => approveVerification(request?.id ?? "", note.trim() || undefined),
    onSuccess: () => done("Approved. Their profile now shows as verified."),
    onError: fail,
  });
  const reject = useMutation({
    mutationFn: () => rejectVerification(request?.id ?? "", note.trim()),
    onSuccess: () => done("Rejected. They'll see your note."),
    onError: fail,
  });

  const user = request ? refOrNull(request.userId) : null;
  const pending = request?.status === "PENDING";

  return (
    <Sheet open={Boolean(request)} onOpenChange={onOpenChange}>
      <SheetContent title="Review verification request" side="right" className="w-full max-w-md overflow-y-auto">
        {request ? (
          <div className="space-y-6 pt-2">
            <div>
              <p className="text-muted text-[11px]">{request.role === "CREATOR" ? "Creator" : "Brand"}</p>
              <p className="text-bone text-[16px] font-medium">{user?.name ?? "Unknown user"}</p>
              {user?.email ? <p className="text-muted text-[12px]">{user.email}</p> : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="muted">{VERIFICATION_TYPE_LABEL[request.verificationType].label}</Badge>
                <Badge tone={VERIFICATION_REQUEST_STATUS[request.status].tone}>
                  {VERIFICATION_REQUEST_STATUS[request.status].label}
                </Badge>
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="text-bone-2 text-xs font-medium">Evidence</h3>
              {request.evidence.profileUrl ? <EvidenceLink href={request.evidence.profileUrl} label={request.evidence.profileUrl} /> : null}
              {request.evidence.handle ? <p className="text-bone-2 text-[13px]">Handle: {request.evidence.handle}</p> : null}
              {request.evidence.businessEmail ? (
                <p className="text-bone-2 text-[13px]">Email: {request.evidence.businessEmail}</p>
              ) : null}
              {request.evidence.documents?.map((d, i) => (
                <div key={d}>
                  <EvidenceLink href={d} label={`Document ${i + 1}`} />
                </div>
              ))}
              {request.evidence.note ? (
                <p className="text-muted text-[12px] leading-relaxed">“{request.evidence.note}”</p>
              ) : null}
            </section>

            <section className="flex flex-wrap gap-2">
              {request.role === "CREATOR" ? <FraudCheck triggerLabel="Audience risk check" /> : null}
              <Button asChild variant="ghost" size="sm">
                <Link href={`/analytics?userId=${refId(request.userId)}&role=${request.role}`}>View their analytics</Link>
              </Button>
            </section>

            <section className="space-y-2">
              <h3 className="text-bone-2 text-xs font-medium">History</h3>
              {audit.isPending ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <ol className="border-line-2 space-y-3 border-l pl-4">
                  {(audit.data ?? []).map((entry) => (
                    <li key={entry.id} className="text-[12px]">
                      <p className="text-bone-2">
                        {ACTION_LABEL[entry.action]}
                        {refOrNull(entry.actorId) ? ` by ${refOrNull(entry.actorId)?.name}` : ""}
                      </p>
                      <p className="text-muted">{format(new Date(entry.createdAt), "d MMM yyyy, HH:mm")}</p>
                      {entry.note ? <p className="text-muted mt-0.5">“{entry.note}”</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {pending ? (
              <section className="border-line-2 space-y-3 border-t pt-4">
                <Field
                  label="Note"
                  htmlFor="review-note"
                  hint="Required to reject: tell them what to fix."
                  error={noteError ?? undefined}
                >
                  <Textarea id="review-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={reject.isPending}
                    onClick={() => {
                      if (!note.trim()) {
                        setNoteError("Add a note so they know why.");
                        return;
                      }
                      reject.mutate();
                    }}
                  >
                    Reject
                  </Button>
                  <Button variant="gold" size="sm" loading={approve.isPending} onClick={() => approve.mutate()}>
                    Approve
                  </Button>
                </div>
              </section>
            ) : request.reviewNote ? (
              <p className="text-muted text-[12px]">Review note: “{request.reviewNote}”</p>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
