import { describe, expect, it } from "vitest";
import { isInDuelZone, DUEL_ZONES } from "./duel.js";

describe("isInDuelZone", () => {
  it("detects center duel ring", () => {
    const z = DUEL_ZONES[0];
    expect(isInDuelZone(z.cx, z.cy)).toBe(true);
    expect(isInDuelZone(0, 0)).toBe(false);
  });
});
