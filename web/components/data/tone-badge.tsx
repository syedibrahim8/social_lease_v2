import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/config/status-maps";

const toneStyles: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-brand-muted text-brand-text",
  success: "bg-success-muted text-success-text",
  warning: "bg-warning-muted text-warning-text",
  danger: "bg-danger-muted text-danger-text",
  info: "bg-info-muted text-info-text",
};

/** Generic tinted pill for ad-hoc labels (transaction types, etc.). */
export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
