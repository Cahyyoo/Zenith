/**
 * Fractional ordering for Kanban cards: a moved card takes the midpoint of
 * its new neighbours, so a move is a single-row update. When neighbours get
 * too close for float precision the column is rebalanced.
 */
export const POSITION_STEP = 1024;
const MIN_GAP = 1e-6;

export function positionBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined) return after === undefined ? POSITION_STEP : after - POSITION_STEP;
  if (after === undefined) return before + POSITION_STEP;
  return (before + after) / 2;
}

export function needsRebalance(before: number | undefined, after: number | undefined): boolean {
  return before !== undefined && after !== undefined && after - before < MIN_GAP;
}

export function positionAtEnd(positions: readonly number[]): number {
  return positions.length === 0 ? POSITION_STEP : Math.max(...positions) + POSITION_STEP;
}

/** Evenly spaced positions for a rebalanced column, in the given order. */
export function rebalancedPositions(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * POSITION_STEP);
}
