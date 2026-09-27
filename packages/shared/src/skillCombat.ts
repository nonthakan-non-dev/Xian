import { effectiveCombatTier } from "./cultivation.js";
import type { CultivationSkillDef, SkillRangeClass } from "./cultivationSkillTypes.js";
import { getSkillById } from "./cultivationSkills.js";

export const WEAK_BASIC_DAMAGE = 8;
export const WEAK_BASIC_RANGE = 92;
export const POST_DRAFT_BASIC_DAMAGE = 14;
export const POST_DRAFT_BASIC_RANGE = 130;

export function resolveBasicAttackDamage(ownedSkillIds: readonly string[]): number {
  if (ownedSkillIds.length === 0) return WEAK_BASIC_DAMAGE;
  return POST_DRAFT_BASIC_DAMAGE + Math.min(8, ownedSkillIds.length);
}

export function resolveBasicAttackRange(ownedSkillIds: readonly string[]): number {
  if (ownedSkillIds.length === 0) return WEAK_BASIC_RANGE;
  return POST_DRAFT_BASIC_RANGE;
}

export function basicArcWidthForLoadout(ownedSkillIds: readonly string[]): number {
  if (ownedSkillIds.length === 0) return Math.PI * 0.45;
  return Math.PI * 0.55;
}

/** Maps design atkPercent to CurrentQi damage (ADR 0003). */
export function qiDamageFromSkill(
  skill: CultivationSkillDef,
  realmFloor: number,
  crit: boolean,
): number {
  const tier = effectiveCombatTier(realmFloor, 1);
  const scalar = 8 + tier * 3;
  const base = Math.max(1, Math.round((skill.atkPercent / 100) * scalar));
  return crit ? base * 2 : base;
}

export function activeSkillRangeClass(
  skillId: string,
): SkillRangeClass | undefined {
  return getSkillById(skillId)?.rangeClass;
}

export function rangeForSkillClass(rangeClass: SkillRangeClass): number {
  switch (rangeClass) {
    case "self":
      return 95;
    case "single":
      return 190;
    case "line":
      return 200;
    case "cone":
      return 175;
    case "circle":
      return 110;
    case "dash":
      return 140;
    case "global":
      return 240;
    default:
      return 150;
  }
}

export function arcWidthForSkillClass(rangeClass: SkillRangeClass): number {
  switch (rangeClass) {
    case "cone":
      return Math.PI * 0.35;
    case "single":
    case "line":
      return Math.PI * 0.22;
    case "self":
    case "circle":
      return Math.PI * 0.75;
    default:
      return Math.PI * 0.55;
  }
}

export function ownedUsesMeleeBasic(ownedSkillIds: readonly string[]): boolean {
  return ownedSkillIds.some((id) => {
    const s = getSkillById(id);
    return (
      s?.kind === "passive" &&
      s.rangeClass === "self" &&
      (s.nameEn.toLowerCase().includes("body") ||
        s.nameTh.includes("กาย") ||
        s.nameTh.includes("หมัด"))
    );
  });
}

export function hasStealthPassive(ownedSkillIds: readonly string[]): boolean {
  return ownedSkillIds.some((id) => {
    const s = getSkillById(id);
    if (!s || s.kind !== "passive") return false;
    const en = s.nameEn.toLowerCase();
    return en.includes("shadow") || en.includes("stealth") || s.ccType === "blind";
  });
}

export function passiveDamageTakenMultiplier(
  ownedSkillIds: readonly string[],
): number {
  let mult = 1;
  for (const id of ownedSkillIds) {
    const s = getSkillById(id);
    if (s?.kind !== "passive") continue;
    if (
      s.nameEn.toLowerCase().includes("shield") ||
      s.nameEn.toLowerCase().includes("citadel") ||
      s.nameEn.toLowerCase().includes("barrier") ||
      s.nameTh.includes("โล่") ||
      s.nameTh.includes("เกราะ")
    ) {
      mult *= 0.92;
    }
  }
  return Math.max(0.65, mult);
}

export function hasFlyingBladePassive(ownedSkillIds: readonly string[]): boolean {
  return ownedSkillIds.some((id) => {
    const s = getSkillById(id);
    if (!s || s.kind !== "passive") return false;
    const en = s.nameEn.toLowerCase();
    return en.includes("flying") || en.includes("blade") || en.includes("sword");
  });
}

export function hasOverloadPassive(ownedSkillIds: readonly string[]): boolean {
  return ownedSkillIds.some((id) => {
    const s = getSkillById(id);
    if (!s || s.kind !== "passive") return false;
    const en = s.nameEn.toLowerCase();
    return en.includes("frenzy") || en.includes("overload");
  });
}

export function skillAppliesPoisonOnHit(skillId: string): boolean {
  const s = getSkillById(skillId);
  if (!s) return false;
  return s.ccType === "drain" || s.nameEn.toLowerCase().includes("poison");
}

export function skillAccentColorForActive(skillId: string): number {
  const s = getSkillById(skillId);
  if (!s) return 0xcccccc;
  switch (s.rangeClass) {
    case "dash":
    case "line":
      return 0x99eeff;
    case "self":
    case "circle":
      return 0xffcc55;
    case "global":
      return 0xbbddff;
    default:
      return 0xbb88ff;
  }
}
