import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deliverable } from "@/lib/api/mock/contracts";

export function DeliverablesList({ items }: { items: Deliverable[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((d, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          <span
            className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
              d.completed
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border",
            )}
          >
            {d.completed ? <Check className="size-3" /> : null}
          </span>
          <span className={cn(d.completed && "text-muted-foreground line-through")}>
            {d.description}
          </span>
        </li>
      ))}
    </ul>
  );
}
