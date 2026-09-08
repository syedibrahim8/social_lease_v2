import { cn } from "@/lib/utils";

/**
 * Skeletons mirror the shape of what they replace — never a generic grey bar.
 * A balance skeleton is the height of a balance; a ledger skeleton has rows.
 * That is what keeps the layout from jumping when real data lands.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-bone/6 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}
