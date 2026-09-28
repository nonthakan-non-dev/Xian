import { describe, expect, it } from "vitest";
import {
  telegraphForActiveSkill,
  telegraphForBasicAttack,
} from "./combatTelegraph.js";
import { getSkillById } from "./cultivationSkills.js";

describe("telegraphForBasicAttack", () => {
  it("uses arc for empty loadout weak basic", () => {
    const t = telegraphForBasicAttack(0, 0, 100, 0, []);
    expect(t.kind).toBe("arc");
    if (t.kind === "arc") {
      expect(t.radius).toBeGreaterThan(80);
      expect(t.angle).toBeCloseTo(0);
    }
  });
});

describe("telegraphForActiveSkill", () => {
  it("uses circle for self-range skill", () => {
    const skill = getSkillById("rf01_s07");
    expect(skill).toBeDefined();
    const t = telegraphForActiveSkill(10, 10, 200, 200, skill!);
    expect(t.kind).toBe("circle");
  });
});
