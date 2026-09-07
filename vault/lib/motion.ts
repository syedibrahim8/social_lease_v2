/**
 * Motion tokens, mirroring the CSS custom properties in styles/globals.css so
 * JS-driven and CSS-driven animation share one rhythm. If you change a value
 * here, change it there.
 *
 * ease-in is deliberately absent. It delays the first movement — the exact
 * moment the user is watching — so at an identical duration it reads as
 * sluggish. Entering and exiting elements use ease-out; things moving on screen
 * use ease-in-out.
 */

export const easings = {
  /** Entering, exiting, and anything that should feel immediate. */
  out: [0.23, 1, 0.32, 1] as const,
  /** Moving or morphing on screen. */
  inOut: [0.77, 0, 0.175, 1] as const,
} as const;

/**
 * UI durations stay under 300ms. `money` is the deliberate exception: it is
 * explanatory rather than interactive, and on the screens where it runs it is
 * the thing the person came to see.
 */
export const durations = {
  press: 0.14,
  fast: 0.18,
  base: 0.26,
  money: 0.9,
} as const;

/**
 * Apple-style spring parameters — easier to reason about than mass/stiffness/
 * damping, and springs keep their velocity when interrupted, which duration
 * animations cannot.
 */
export const springs = {
  gentle: { type: "spring", duration: 0.5, bounce: 0.15 },
  snappy: { type: "spring", duration: 0.35, bounce: 0.1 },
} as const;

/** Stagger delay between items in a list. Long delays read as slowness. */
export const STAGGER_SECONDS = 0.05;
