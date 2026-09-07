import { Check, Circle } from "lucide-react";
import type { Deliverable } from "@/lib/api/types";

/**
 * Seeded from the campaign when the contract is generated: the asset line plus
 * each requirement. Read-only here — the backend owns `completed`, and delivery
 * is proven through submissions rather than by ticking a box.
 */
export function DeliverablesList({ deliverables }: { deliverables: Deliverable[] }) {
  if (deliverables.length === 0) {
    return <p className="text-muted text-xs">No deliverables were recorded on this contract.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {deliverables.map((d, i) => (
        <li key={i} className="flex items-start gap-2.5">
          {d.completed ? (
            <Check className="text-positive mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Circle className="text-faint mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className={d.completed ? "text-muted text-[13px] line-through" : "text-bone-2 text-[13px]"}>
            {d.description}
          </span>
        </li>
      ))}
    </ul>
  );
}
