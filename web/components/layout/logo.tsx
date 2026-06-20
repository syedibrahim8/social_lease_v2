import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

/** Brand wordmark used in the sidebar and (later) marketing chrome. */
export function Logo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-brand flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm">
        <LayoutGrid className="text-brand-foreground size-4" />
      </span>
      {!collapsed && (
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
          Creator Market
        </span>
      )}
    </span>
  );
}
