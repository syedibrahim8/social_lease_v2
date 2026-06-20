import { cn } from "@/lib/utils";
import {
  getStatusMeta,
  type StatusDomain,
  type StatusTone,
} from "@/lib/config/status-maps";

const toneStyles: Record<StatusTone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  brand: { pill: "bg-brand-muted text-brand-text", dot: "bg-brand" },
  success: { pill: "bg-success-muted text-success-text", dot: "bg-success" },
  warning: { pill: "bg-warning-muted text-warning-text", dot: "bg-warning" },
  danger: { pill: "bg-danger-muted text-danger-text", dot: "bg-danger" },
  info: { pill: "bg-info-muted text-info-text", dot: "bg-info" },
};

interface StatusBadgeProps {
  domain: StatusDomain;
  status: string;
  withDot?: boolean;
  className?: string;
}

/**
 * Consistent status pill across the whole platform. Pass the backend domain +
 * raw status; tone and label come from the central status map.
 */
export function StatusBadge({
  domain,
  status,
  withDot = true,
  className,
}: StatusBadgeProps) {
  const { label, tone } = getStatusMeta(domain, status);
  const styles = toneStyles[tone];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        styles.pill,
        className,
      )}
    >
      {withDot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", styles.dot)}
        />
      )}
      {label}
    </span>
  );
}
