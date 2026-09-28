import { describe, expect, it } from "vitest";
import {
  CULTIVATOR_DISPLAY_NAME_MAX,
  pickCultivatorNamePattern,
  rollCultivatorDisplayName,
} from "./cultivatorName.js";
import {
  familyNames,
  firstNames,
  lastNames,
  middleNames,
} from "./cultivatorNameWords.js";

describe("pickCultivatorNamePattern", () => {
  it("returns four when random is above chance threshold", () => {
    expect(pickCultivatorNamePattern(() => 0.6)).toBe("four");
  });

  it("returns three when random is below chance threshold", () => {
    expect(pickCultivatorNamePattern(() => 0.4)).toBe("three");
  });
});

describe("rollCultivatorDisplayName", () => {
  it("concatenates index-zero words for three-part pattern", () => {
    const alwaysZero = () => 0;
    const name = rollCultivatorDisplayName(alwaysZero, { pattern: "three" });
    expect(name).toBe(familyNames[0] + firstNames[0] + lastNames[0]);
  });

  it("includes middle syllable for four-part pattern", () => {
    const alwaysZero = () => 0;
    const name = rollCultivatorDisplayName(alwaysZero, { pattern: "four" });
    expect(name).toBe(
      familyNames[0] +
        firstNames[0] +
        middleNames[0] +
        lastNames[0],
    );
  });

  it("never exceeds display name max for many random rolls", () => {
    let seed = 12345;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 200; i++) {
      const name = rollCultivatorDisplayName(rng);
      expect(name.length).toBeGreaterThan(0);
      expect(name.length).toBeLessThanOrEqual(CULTIVATOR_DISPLAY_NAME_MAX);
    }
  });
});
