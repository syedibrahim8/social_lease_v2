import type { ReactNode } from "react";
import { StatusBadge } from "@/components/data/status-badge";
import { verificationTypeLabel } from "@/lib/config/verification";
import { formatRelative } from "@/lib/format";
import type { VerificationRequest } from "@/lib/api/mock/verifications";

export function VerificationItem({
  request,
  showSubmitter = false,
  actions,
}: {
  request: VerificationRequest;
  showSubmitter?: boolean;
  actions?: ReactNode;
}) {
  const ev = request.evidence;
  const summary =
    ev.profileUrl ?? ev.website ?? ev.businessEmail ?? ev.handle ?? ev.documents?.[0] ?? ev.note;

  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {verificationTypeLabel(request.verificationType)}
          </p>
          <StatusBadge domain="verification" status={request.status} />
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {showSubmitter ? `${request.submitterName} · ` : ""}submitted{" "}
          {formatRelative(request.createdAt)}
        </p>
        {summary ? (
          <p className="text-muted-foreground mt-1 truncate text-xs">{summary}</p>
        ) : null}
        {request.reviewNote ? (
          <p className="text-danger-text mt-1 text-xs">{request.reviewNote}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
