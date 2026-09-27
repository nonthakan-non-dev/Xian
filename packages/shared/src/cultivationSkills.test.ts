import { describe, expect, it } from "vitest";
import {
  getSkillById,
  getSkillPoolForRealm,
  validateSkillCatalog,
  REALM_SKILL_FLOOR_MAX,
  SKILLS_PER_REALM_FLOOR,
  SKILL_CATALOG,
} from "./cultivationSkills.js";

describe("cultivation skill catalog", () => {
  it("has 250 skills in 25 pools of 10", () => {
    expect(SKILL_CATALOG.length).toBe(250);
    expect(validateSkillCatalog()).toEqual([]);
  });

  it("indexes pools by realm floor", () => {
    for (let floor = 1; floor <= REALM_SKILL_FLOOR_MAX; floor++) {
      const pool = getSkillPoolForRealm(floor);
      expect(pool).toHaveLength(SKILLS_PER_REALM_FLOOR);
      expect(pool.every((s) => s.realmFloor === floor)).toBe(true);
    }
  });

  it("resolves skills by global id", () => {
    const skill = getSkillById("rf01_s01");
    expect(skill?.nameTh).toBe("คลื่นปราณผ่าอากาศ");
    expect(skill?.realmFloor).toBe(1);
  });
});
