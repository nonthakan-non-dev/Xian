import { describe, expect, it } from "vitest";
import { getSkillById } from "./cultivationSkills.js";
import {
  qiDamageFromSkill,
  resolveBasicAttackDamage,
  WEAK_BASIC_DAMAGE,
} from "./skillCombat.js";

describe("resolveBasicAttackDamage", () => {
  it("uses WeakBasic when loadout is empty", () => {
    expect(resolveBasicAttackDamage([])).toBe(WEAK_BASIC_DAMAGE);
  });

  it("uses stronger basic after first drafted skill", () => {
    expect(resolveBasicAttackDamage(["rf02_s01"])).toBeGreaterThan(
      WEAK_BASIC_DAMAGE,
    );
  });
});

describe("qiDamageFromSkill", () => {
  it("scales with realm floor and atk percent", () => {
    const skill = getSkillById("rf01_s02");
    expect(skill).toBeDefined();
    const low = qiDamageFromSkill(skill!, 1, false);
    const high = qiDamageFromSkill(skill!, 10, false);
    expect(high).toBeGreaterThan(low);
    expect(qiDamageFromSkill(skill!, 5, true)).toBe(
      qiDamageFromSkill(skill!, 5, false) * 2,
    );
  });
});
