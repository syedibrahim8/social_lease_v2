"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/motion/count-up";
import { PayoutRelease } from "@/components/motion/payout-release";
import { Badge } from "@/components/ui/badge";

/** Interactive corner of the style page — the motion pieces need state to show. */
export function MotionDemo() {
  const [runId, setRunId] = useState(0);
  const [released, setReleased] = useState(false);
  const reduced = useReducedMotion();

  // The server cannot know this preference, so reporting it during SSR would
  // mismatch on hydration. Read it only after mount.
  const mounted = useMounted();
  const reducedLabel = !mounted
    ? "checking motion preference"
    : reduced
      ? "reduced motion ON"
      : "reduced motion off";

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <p className="text-faint text-[10px] tracking-wider uppercase">
            Count-up · first mount only
          </p>
          <Badge tone={mounted && reduced ? "warning" : "muted"}>{reducedLabel}</Badge>
        </div>
        <div key={runId}>
          <CountUp minor={4825000} className="block text-4xl" />
        </div>
        <Button
          variant="quiet"
          size="sm"
          className="mt-4"
          onClick={() => setRunId((n) => n + 1)}
        >
          Remount to replay
        </Button>
        <p className="text-muted mt-3 max-w-[62ch] text-[11px] leading-relaxed">
          Only remounting replays it. A refetch that changes the value snaps instead — a
          balance that re-animated on every background poll would be moving several times a
          minute, and an animation seen that often stops being delight and becomes a number
          you cannot read.
        </p>
      </div>

      <div>
        <p className="text-faint mb-3 text-[10px] tracking-wider uppercase">
          Payout release · the set-piece
        </p>
        {released ? (
          <PayoutRelease
            amount={900000}
            escrowBefore={1240000}
            availableBefore={4825000}
          />
        ) : (
          <div className="border-line-2 grid gap-4 rounded-xl border border-dashed p-6 sm:grid-cols-2">
            <p className="text-muted text-xs">
              Escrow $12,400.00 · Available $48,250.00
            </p>
            <p className="text-muted text-xs">Releasing $9,000.00…</p>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="gold" size="sm" onClick={() => setReleased(true)}>
            Release payout
          </Button>
          <Button variant="quiet" size="sm" onClick={() => setReleased(false)}>
            Reset
          </Button>
        </div>
        <p className="text-muted mt-3 max-w-[62ch] text-[11px] leading-relaxed">
          The one animation allowed to be theatrical, and it earns it on frequency — a few
          times a month, not a hundred times a day. It also does a job: showing that one
          balance <em>became</em> the other is exactly the mental model escrow requires, and
          the thing people most often distrust.
        </p>
      </div>
    </div>
  );
}
