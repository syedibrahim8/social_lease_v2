import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Empty is a designed state, not an accident.
 *
 * This app has no fixtures — when a collection is empty the person genuinely
 * has nothing there, and the screen owes them an explanation and a next step
 * rather than a blank rectangle. `description` should say what would put
 * something here, and `action` should be the shortest route to doing it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line-2 flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <span className="bg-bone/5 text-muted mb-4 grid size-11 place-items-center rounded-xl">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="font-display text-bone text-base">{title}</p>
      <p className="text-muted mt-1.5 max-w-[46ch] text-xs leading-relaxed">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
