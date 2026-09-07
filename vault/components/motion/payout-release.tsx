"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Amount } from "@/components/money/amount";
import { durations, easings } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The payout set-piece: escrow drains, the available balance absorbs it.
 *
 * This is the ONE animation in the app allowed to be theatrical, and it earns
 * it on frequency alone — a creator sees a payout release a handful of times a
 * month, not a hundred times a day. It also does a job beyond delight: it shows
 * that one balance BECAME the other, which is exactly the mental model escrow
 * requires and the thing people most often distrust.
 *
 * HYDRATION: the server cannot know `prefers-reduced-motion`, so the state
 * initialisers must not branch on it — both sides start from the "before"
 * figures and the effect resolves the rest. Under reduced motion the tween runs
 * with zero duration, so the numbers land on their final values immediately
 * without travelling there.
 */
export function PayoutRelease({
  amount,
  escrowBefore,
  availableBefore,
  currency = "USD",
  onDone,
  className,
}: {
  /** Minor units released from escrow to available. */
  amount: number;
  escrowBefore: number;
  availableBefore: number;
  currency?: string;
  onDone?: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const escrowAfter = escrowBefore - amount;
  const availableAfter = availableBefore + amount;

  const [escrow, setEscrow] = useState(escrowBefore);
  const [available, setAvailable] = useState(availableBefore);
  const [settled, setSettled] = useState(false);

  // Kept in a ref so a parent passing an inline callback cannot restart the
  // animation. Assigned in an effect, never during render.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // Zero duration under reduced motion routes the "no movement" case through
    // the same path, so the outcome is identical and nothing is set
    // synchronously in the effect body.
    const duration = reduced ? 0 : durations.money;

    const drain = animate(escrowBefore, escrowAfter, {
      duration,
      ease: easings.inOut,
      onUpdate: (v) => setEscrow(Math.round(v)),
    });
    const fill = animate(availableBefore, availableAfter, {
      duration,
      ease: easings.inOut,
      onUpdate: (v) => setAvailable(Math.round(v)),
      onComplete: () => {
        setSettled(true);
        doneRef.current?.();
      },
    });

    // Interruptible: stopping leaves no timer running against an unmounted tree.
    return () => {
      drain.stop();
      fill.stop();
    };
  }, [availableAfter, availableBefore, escrowAfter, escrowBefore, reduced]);

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)} aria-live="polite">
      <div className="border-line-2 bg-surface rounded-xl border p-5">
        <p className="text-muted text-[10px] font-semibold tracking-[0.17em] uppercase">
          In escrow
        </p>
        <Amount minor={escrow} currency={currency} className="mt-2 block text-2xl" />
      </div>

      <div
        className={cn(
          "border-line relative overflow-hidden rounded-xl border p-5",
          "bg-gradient-to-br from-emerald-deep to-[#0C1614]",
          // Box-shadow only, so this survives reduced motion intact.
          "transition-[box-shadow] duration-500",
          settled && "shadow-[var(--shadow-gold)]",
        )}
      >
        <p className="text-muted text-[10px] font-semibold tracking-[0.17em] uppercase">
          Available balance
        </p>
        <Amount
          minor={available}
          currency={currency}
          variant="display"
          className="mt-2 block text-3xl"
        />
        {settled ? (
          <p className="text-positive mt-3 flex items-center gap-1.5 text-xs">
            <Check className="size-3.5" aria-hidden="true" />
            Payout released
          </p>
        ) : null}
      </div>
    </div>
  );
}
