"use client";

import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import Lenis from "lenis";

/**
 * Lenis smooth scroll.
 *
 * Under reduced motion this does not initialise at all — it is not enough to
 * shorten a hijacked scroll, because the discomfort comes from the scroll not
 * tracking the input, not from its duration. Native scrolling is the correct
 * degradation.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({ lerp: 0.09 });
    let frame = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
