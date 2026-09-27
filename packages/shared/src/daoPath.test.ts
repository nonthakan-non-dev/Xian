import { describe, expect, it } from "vitest";
import {
  addPoisonStack,
  applyIronSkinDamage,
  flyingSwordCount,
  flyingSwordMaxPassiveDps,
  FLYING_SWORD_DAMAGE,
  FLYING_SWORD_INTERVAL_MS,
  combatKitBlockReason,
  isCombatKitActive,
  OVERLOAD_STACKS_FOR_CRIT,
  overloadOnSkillUse,
  resolveActiveDamage,
  resolveBasicDamage,
  resolveFacingUnitVector,
} from "./daoPath.js";

describe("isCombatKitActive", () => {
  it("blocks while awaiting SkillDraft", () => {
    expect(isCombatKitActive(true)).toBe(false);
    expect(isCombatKitActive(false)).toBe(true);
  });

  it("combatKitBlockReason reports draft gate", () => {
    expect(combatKitBlockReason(true)).toBe("awaiting_skill_draft");
    expect(combatKitBlockReason(false)).toBe(null);
  });
});

describe("poisonStacks", () => {
  it("addPoisonStack caps at five", () => {
    expect(addPoisonStack(0)).toBe(1);
    expect(addPoisonStack(4)).toBe(5);
    expect(addPoisonStack(5)).toBe(5);
  });
});

describe("overloadCrit", () => {
  it("after three stacks the next skill crits and resets", () => {
    expect(OVERLOAD_STACKS_FOR_CRIT).toBe(3);
    expect(overloadOnSkillUse(0)).toEqual({ stacks: 1, crit: false });
    expect(overloadOnSkillUse(1)).toEqual({ stacks: 2, crit: false });
    expect(overloadOnSkillUse(2)).toEqual({ stacks: 3, crit: false });
    expect(overloadOnSkillUse(3)).toEqual({ stacks: 0, crit: true });
  });
});

describe("applyIronSkinDamage", () => {
  it("body path reduces incoming damage by twenty percent", () => {
    expect(applyIronSkinDamage(100, "body")).toBe(80);
    expect(applyIronSkinDamage(100, "sword")).toBe(100);
  });
});

describe("flyingSwordCount", () => {
  it("scales with realm floor up to five", () => {
    expect(flyingSwordCount(1)).toBe(0);
    expect(flyingSwordCount(3)).toBe(2);
    expect(flyingSwordCount(7)).toBe(5);
  });
});

describe("flyingSwordMaxPassiveDps", () => {
  it("caps peak passive DPS at realm seven", () => {
    const dps = flyingSwordMaxPassiveDps(7);
    expect(dps).toBeCloseTo(
      (5 * FLYING_SWORD_DAMAGE * 1000) / FLYING_SWORD_INTERVAL_MS,
    );
    expect(dps).toBeLessThanOrEqual(35);
  });
});

describe("bodyShieldPulse", () => {
  it("active skill pulse deals fourteen before shockwave", () => {
    expect(resolveActiveDamage("body", false)).toBe(14);
  });
});

describe("shadowBasic", () => {
  it("basic bolt buffed to thirteen", () => {
    expect(resolveBasicDamage("shadow", false)).toBe(13);
  });
});

describe("resolveBasicDamage", () => {
  it("lightning bolt hits harder than sword fan", () => {
    expect(resolveBasicDamage("lightning", false)).toBeGreaterThan(
      resolveBasicDamage("sword", false),
    );
  });
});

describe("resolveFacingUnitVector", () => {
  it("prefers movement input over cursor aim", () => {
    const f = resolveFacingUnitVector(0, -1, 100, 100, 200, 200);
    expect(f.x).toBeCloseTo(0);
    expect(f.y).toBeCloseTo(-1);
  });
});
