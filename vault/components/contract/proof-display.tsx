import { ExternalLink, FileText, ImageIcon, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/money";
import type { ProofFileType, Submission } from "@/lib/api/types";

const FILE_ICON: Record<ProofFileType, typeof ImageIcon> = {
  SCREENSHOT: ImageIcon,
  ANALYTICS_SCREENSHOT: LineChart,
  DOCUMENT: FileText,
};

const ANALYTICS_LABEL: Record<string, string> = {
  impressions: "Impressions",
  reach: "Reach",
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  saves: "Saves",
};

/** What was delivered, as the brand sees it when deciding whether to approve. */
export function ProofDisplay({ submission }: { submission: Submission }) {
  const analytics = Object.entries(submission.analytics ?? {}).filter(
    ([, v]) => typeof v === "number",
  );

  return (
    <div className="space-y-5">
      {submission.links.length > 0 ? (
        <div>
          <p className="text-muted mb-2 text-[10px] tracking-[0.14em] uppercase">Live links</p>
          <ul className="space-y-1.5">
            {submission.links.map((l, i) => (
              <li key={`${l.url}-${i}`}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bone-2 hover:text-gold-lo -my-1 inline-flex items-center gap-2 py-1 text-[13px] transition-colors"
                >
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{l.label ?? l.url}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {submission.files.length > 0 ? (
        <div>
          <p className="text-muted mb-2 text-[10px] tracking-[0.14em] uppercase">Files</p>
          <ul className="space-y-1.5">
            {submission.files.map((f, i) => {
              const Icon = FILE_ICON[f.type];
              return (
                <li key={`${f.url}-${i}`}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bone-2 hover:text-gold-lo -my-1 inline-flex items-center gap-2 py-1 text-[13px] transition-colors"
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{f.caption ?? f.url}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {analytics.length > 0 ? (
        <div>
          <p className="text-muted mb-2 text-[10px] tracking-[0.14em] uppercase">
            Reported performance
          </p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {analytics.map(([key, value]) => (
              <div key={key} className="border-line-2 rounded-lg border px-3 py-2">
                <dt className="text-muted text-[10px] tracking-wider uppercase">
                  {ANALYTICS_LABEL[key] ?? key}
                </dt>
                <dd className="tnum text-bone mt-1 text-sm">{formatNumber(value as number)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {submission.note ? (
        <div>
          <p className="text-muted mb-2 text-[10px] tracking-[0.14em] uppercase">
            Note from the creator
          </p>
          <p className="text-bone-2 text-[13px] leading-relaxed whitespace-pre-wrap">
            {submission.note}
          </p>
        </div>
      ) : null}

      {submission.reviewNote ? (
        <div className="border-line-2 bg-bone/[0.03] rounded-lg border px-3.5 py-3">
          <div className="mb-1.5 flex items-center gap-2">
            <p className="text-muted text-[10px] tracking-[0.14em] uppercase">
              Feedback from the brand
            </p>
            <Badge tone={submission.status === "REJECTED" ? "negative" : "info"}>
              {submission.status === "REJECTED" ? "Rejected" : "Revision requested"}
            </Badge>
          </div>
          <p className="text-bone-2 text-[13px] leading-relaxed whitespace-pre-wrap">
            {submission.reviewNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}
