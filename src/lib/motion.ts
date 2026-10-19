import type { Transition, Variants } from "motion/react";

/**
 * Shared motion vocabulary so every animation in the app feels related.
 * Durations stay short (≤ 250ms) — motion should explain changes, not delay them.
 * Users with "reduce motion" enabled get instant transitions via <MotionConfig>.
 */

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const spring = {
  /** Sliding indicators (active tab, workspace pill). */
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.8 },
  /** List items settling into a new position. */
  gentle: { type: "spring", stiffness: 360, damping: 32 },
} satisfies Record<string, Transition>;

/** Route content entering after a navigation. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
};

/** Rows in a list: rise in, collapse out. */
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.18, ease: EASE_OUT } },
};

/** Parent that staggers its children on first appearance. */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.035, delayChildren: 0.02 } },
};

/** Section that expands/collapses its height (e.g. "Completed"). */
export const collapseVariants: Variants = {
  collapsed: { opacity: 0, height: 0, transition: { duration: 0.18, ease: EASE_OUT } },
  expanded: { opacity: 1, height: "auto", transition: { duration: 0.22, ease: EASE_OUT } },
};
