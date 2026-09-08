"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { durations, easings } from "@/lib/motion";

/**
 * A plain integer counting up once, when it scrolls into view.
 *
 * The money equivalent is <CountUp>, which formats currency. This one exists
 * for the landing page's figures, which are not amounts: a percentage, a count
 * of steps. Marketing surfaces only, for the same reason: a number someone
 * reads every day should not make them wait for it.
 *
 * HYDRATION: the server cannot know `prefers-reduced-motion`, so the rendered
 * tree must not branch on it. Both sides start at zero and an effect decides
 * what happens next; under reduced motion that decision is a zero-duration
 * animation, which routes the still case through the same code path rather
 * than a second one.
 */
export function CountNumber({
  to,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const controls = animate(reduced ? to : 0, to, {
      duration: reduced ? 0 : durations.money,
      ease: easings.out,
      onUpdate: (v) => setValue(Math.round(v)),
    });

    return () => controls.stop();
  }, [inView, to, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
