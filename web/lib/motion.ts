import type { Transition, Variants } from "framer-motion";

/**
 * Shared Framer Motion presets. Only fade / slide / scale — subtle and
 * professional. Durations and easing match the design tokens. Global
 * `prefers-reduced-motion` handling lives in globals.css; for JS-driven
 * values, gate with framer-motion's `useReducedMotion()` at the call site.
 */

export const easeOutQuint: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const durations = {
  fast: 0.12,
  base: 0.18,
  slow: 0.24,
} as const;

export const transition: Transition = {
  duration: durations.base,
  ease: easeOutQuint,
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition },
};

/** Parent that staggers its children's entrance (use with the variants above). */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};
