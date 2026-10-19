import { describe, expect, it } from "vitest";

import { POSITION_STEP, needsRebalance, positionAtEnd, positionBetween, rebalancedPositions } from "./position";

describe("positionBetween", () => {
  it("returns the midpoint between neighbours", () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
  });

  it("steps before the first and after the last card", () => {
    expect(positionBetween(undefined, 1024)).toBe(1024 - POSITION_STEP);
    expect(positionBetween(2048, undefined)).toBe(2048 + POSITION_STEP);
    expect(positionBetween(undefined, undefined)).toBe(POSITION_STEP);
  });

  it("keeps strict ordering after many inserts at the same spot", () => {
    let low = 0;
    const high = 1;
    for (let i = 0; i < 30; i += 1) {
      const next = positionBetween(low, high);
      expect(next).toBeGreaterThan(low);
      expect(next).toBeLessThan(high);
      low = next;
    }
  });
});

describe("needsRebalance", () => {
  it("flags neighbours that are too close for float precision", () => {
    expect(needsRebalance(1, 1 + 1e-9)).toBe(true);
    expect(needsRebalance(1, 2)).toBe(false);
    expect(needsRebalance(undefined, 2)).toBe(false);
  });
});

describe("positionAtEnd / rebalancedPositions", () => {
  it("appends after the largest position", () => {
    expect(positionAtEnd([])).toBe(POSITION_STEP);
    expect(positionAtEnd([10, 3000, 20])).toBe(3000 + POSITION_STEP);
  });

  it("spaces a rebalanced column evenly", () => {
    expect(rebalancedPositions(3)).toEqual([1024, 2048, 3072]);
  });
});
