import { Check } from "lucide-react";
import type { ContractStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * The contract state machine, rendered.
 *
 * This is the product's spine: escrow is money HELD, and this is the thing that
 * tells you where it is being held and what has to happen for it to move. The
 * steps map 1:1 onto the backend's contract statuses — nothing here is
 * decorative, and nothing is inferred client-side.
 *
 *   PENDING_FUNDING → 0 steps done
 *   FUNDED          → 1  (money is in escrow)
 *   IN_PROGRESS     → 1  (a revision was requested; back to work, still funded)
 *   SUBMITTED       → 2  (proof is in, awaiting the brand)
 *   APPROVED        → 3  (accepted; payout releasing or deferred)
 *   COMPLETED       → 4  (transferred)
 *
 * CANCELLED and DISPUTED are terminal and do not belong on a progress track —
 * showing a half-finished bar for a dead contract is a lie, so they render as
 * their own state instead.
 */
const STEPS = [
  { label: "Escrow funded", hint: "Brand paid; funds held by the platform" },
  { label: "Proof submitted", hint: "Creator delivered the asset" },
  { label: "Brand approved", hint: "Delivery accepted" },
  { label: "Payout released", hint: "Transferred to the creator" },
] as const;

const COMPLETED_STEPS: Record<ContractStatus, number> = {
  PENDING_FUNDING: 0,
  FUNDED: 1,
  IN_PROGRESS: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  COMPLETED: 4,
  CANCELLED: 0,
  DISPUTED: 0,
};

export function EscrowTracker({
  status,
  className,
}: {
  status: ContractStatus;
  className?: string;
}) {
  if (status === "CANCELLED" || status === "DISPUTED") {
    return (
      <div
        className={cn(
          "border-line-2 bg-bone/[0.03] rounded-lg border border-dashed px-4 py-3",
          className,
        )}
      >
        <p className="text-muted text-xs">
          {status === "CANCELLED"
            ? "This contract was cancelled. Any escrowed funds were returned to the brand."
            : "This contract is under dispute. Escrow is frozen until it is resolved."}
        </p>
      </div>
    );
  }

  const done = COMPLETED_STEPS[status];

  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {STEPS.map((step, i) => {
        const isDone = i < done;
        const isCurrent = i === done;

        return (
          <li key={step.label} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 grid size-4 shrink-0 place-items-center rounded-full",
                isDone && "bg-positive/15 text-positive",
                isCurrent && "bg-gold/20 text-gold animate-pulse",
                !isDone && !isCurrent && "bg-faint/25",
              )}
            >
              {isDone ? <Check className="size-2.5" strokeWidth={3} /> : null}
            </span>
            <div className="min-w-0">
              {/* Never colour alone: the current step also says so in words. */}
              <p
                className={cn(
                  "text-xs leading-tight",
                  isDone && "text-bone-2",
                  isCurrent && "text-gold-lo font-medium",
                  !isDone && !isCurrent && "text-muted",
                )}
              >
                {step.label}
                {isCurrent ? <span className="text-muted ml-1.5">· in progress</span> : null}
              </p>
              <p className="text-muted mt-0.5 text-[11px] leading-snug">{step.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
