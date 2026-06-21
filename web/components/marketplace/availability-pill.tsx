import { cn } from "@/lib/utils";

const map = {
  AVAILABLE: { label: "Available", pill: "bg-success-muted text-success-text", dot: "bg-success" },
  BUSY: { label: "Limited", pill: "bg-warning-muted text-warning-text", dot: "bg-warning" },
  UNAVAILABLE: { label: "Unavailable", pill: "bg-danger-muted text-danger-text", dot: "bg-danger" },
} as const;

export type AvailabilityStatus = keyof typeof map;

export function AvailabilityPill({
  status,
  className,
}: {
  status: AvailabilityStatus;
  className?: string;
}) {
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        s.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
