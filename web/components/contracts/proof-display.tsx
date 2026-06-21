import {
  BarChart3,
  ExternalLink,
  FileText,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { proofTypeLabel, type ProofType } from "@/lib/config/contracts";
import type { ProofItem } from "@/lib/api/mock/contracts";

const iconFor: Record<ProofType, LucideIcon> = {
  SCREENSHOT: ImageIcon,
  ANALYTICS_SCREENSHOT: BarChart3,
  DOCUMENT: FileText,
  LINK: ExternalLink,
};

export function ProofDisplay({
  proof,
  note,
}: {
  proof: ProofItem[];
  note?: string;
}) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {proof.map((item) => {
          const Icon = iconFor[item.type];
          return (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.caption || proofTypeLabel(item.type)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{item.url}</p>
                </div>
                <ExternalLink className="text-muted-foreground ml-auto size-3.5 shrink-0" />
              </a>
            </li>
          );
        })}
      </ul>
      {note ? <p className="text-muted-foreground text-sm">{note}</p> : null}
    </div>
  );
}
