import { describe, expect, it } from "vitest";
import { damageDemon, isInAnyDemonZone } from "./demons.js";
import { MAP_WIDTH, MAP_HEIGHT } from "./balance.js";

describe("damageDemon", () => {
  it("reduces demon Qi", () => {
    expect(damageDemon(40, 15)).toBe(25);
  });
});

describe("demon zones", () => {
  it("marks center of map zones", () => {
    expect(isInAnyDemonZone(MAP_WIDTH * 0.5, MAP_HEIGHT * 0.22)).toBe(true);
    expect(isInAnyDemonZone(100, 100)).toBe(false);
  });
});
