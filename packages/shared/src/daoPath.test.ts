import { describe, expect, it } from "vitest";
import {
  addPoisonStack,
  applyIronSkinDamage,
  flyingSwordCount,
  isCombatKitActive,
  overloadOnSkillUse,
  resolveBasicDamage,
  resolveFacingUnitVector,
} from "./daoPath.js";

describe("isCombatKitActive", () => {
  it("requires realm 2+, path chosen, not awaiting modal", () => {
    expect(isCombatKitActive(2, "sword", false)).toBe(true);
    expect(isCombatKitActive(1, "sword", false)).toBe(false);
    expect(isCombatKitActive(2, "", false)).toBe(false);
    expect(isCombatKitActive(2, "sword", true)).toBe(false);
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
  it("third skill use triggers crit and resets stacks", () => {
    expect(overloadOnSkillUse(0)).toEqual({ stacks: 1, crit: false });
    expect(overloadOnSkillUse(1)).toEqual({ stacks: 2, crit: false });
    expect(overloadOnSkillUse(2)).toEqual({ stacks: 0, crit: true });
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
