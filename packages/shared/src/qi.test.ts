import { describe, expect, it } from "vitest";
import { applyOrbPickup, promoteRealmFloor } from "./qi.js";
import { maxQiForRealm } from "./balance.js";

describe("applyOrbPickup", () => {
  it("adds orb value up to max Qi", () => {
    expect(applyOrbPickup(10, 8, 100)).toBe(18);
    expect(applyOrbPickup(95, 8, 100)).toBe(100);
  });
});

describe("promoteRealmFloor", () => {
  it("promotes when CurrentQi crosses thresholds", () => {
    expect(promoteRealmFloor(50, 1)).toBe(1);
    expect(promoteRealmFloor(80, 1)).toBe(2);
    expect(promoteRealmFloor(140, 2)).toBe(3);
  });

  it("respects max Qi cap context via caller", () => {
    const floor = promoteRealmFloor(80, 1);
    expect(maxQiForRealm(floor)).toBeGreaterThan(100);
  });
});
