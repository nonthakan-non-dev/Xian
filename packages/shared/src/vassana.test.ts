import { describe, expect, it } from "vitest";
import { rollOrbWithVassana, tickVassana, VASSANA_CAP } from "./vassana.js";

describe("tickVassana", () => {
  it("increases over time and caps", () => {
    const next = tickVassana(0, 10, false);
    expect(next).toBeGreaterThan(0);
    expect(tickVassana(VASSANA_CAP, 10, true)).toBe(VASSANA_CAP);
  });

  it("grows faster in demon zone", () => {
    const open = tickVassana(0, 5, false);
    const zone = tickVassana(0, 5, true);
    expect(zone).toBeGreaterThan(open);
  });
});

describe("rollOrbWithVassana", () => {
  it("returns at least base value", () => {
    expect(rollOrbWithVassana(8, 0)).toBeGreaterThanOrEqual(8);
  });
});
