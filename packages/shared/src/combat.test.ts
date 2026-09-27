import { describe, expect, it } from "vitest";
import {
  applyDamageToQi,
  isInAttackArc,
  qiToOrbValues,
} from "./combat.js";

describe("applyDamageToQi", () => {
  it("reduces Qi and floors at zero", () => {
    expect(applyDamageToQi(30, 10)).toBe(20);
    expect(applyDamageToQi(5, 20)).toBe(0);
  });
});

describe("qiToOrbValues", () => {
  it("spawns at least one orb when Qi remained", () => {
    const values = qiToOrbValues(25);
    expect(values.length).toBeGreaterThan(0);
    expect(values.reduce((a, b) => a + b, 0)).toBe(25);
  });
});

describe("isInAttackArc", () => {
  it("hits targets in front within range", () => {
    expect(isInAttackArc(0, 0, 0, 50, 0, 100)).toBe(true);
    expect(isInAttackArc(0, 0, 0, -50, 0, 100)).toBe(false);
  });
});
