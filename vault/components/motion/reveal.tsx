"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { durations, easings } from "@/lib/motion";

/**
 * Scroll-triggered entrance. Marketing surfaces only.
 *
 * Deliberately NOT used on app screens: a dashboard is visited many times a
 * day, and an animation seen that often stops being delight and becomes
 * latency. Reveals earn their place on a page you read once.
 *
 * HYDRATION: the server cannot know `prefers-reduced-motion`, so the element
 * tree and the `initial` style must NOT branch on it — that renders one thing
 * on the server and another on the client and React discards the tree. Instead
 * there is one tree with one initial style, and reduced motion collapses the
 * transition to zero duration. The content still ends up visible; it just
 * arrives without travelling.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, transform: "translateY(16px)" }}
      animate={
        inView
          ? { opacity: 1, transform: "translateY(0px)" }
          : { opacity: 0, transform: "translateY(16px)" }
      }
      transition={
        reduced
          ? { duration: 0, delay: 0 }
          : { duration: durations.base, ease: easings.out, delay }
      }
    >
      {children}
    </motion.div>
  );
}
