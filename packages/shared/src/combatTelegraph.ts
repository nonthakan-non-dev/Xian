import { DASH_DISTANCE } from "./daoPath.js";
import type { CultivationSkillDef } from "./cultivationSkillTypes.js";
import {
  arcWidthForSkillClass,
  basicArcWidthForLoadout,
  ownedUsesMeleeBasic,
  rangeForSkillClass,
  resolveBasicAttackRange,
} from "./skillCombat.js";

/** Matches server hit detection shapes (preview only). */
export type DamageTelegraph =
  | { kind: "circle"; cx: number; cy: number; radius: number }
  | {
      kind: "arc";
      cx: number;
      cy: number;
      angle: number;
      radius: number;
      halfAngle: number;
    }
  | {
      kind: "dash";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      hitRadius: number;
    };

export const DASH_TELEGRAPH_HIT_RADIUS = 48;

export function telegraphForBasicAttack(
  originX: number,
  originY: number,
  aimX: number,
  aimY: number,
  ownedSkillIds: readonly string[],
): DamageTelegraph {
  const range = resolveBasicAttackRange(ownedSkillIds);
  if (ownedUsesMeleeBasic(ownedSkillIds)) {
    return { kind: "circle", cx: originX, cy: originY, radius: range };
  }
  const angle = Math.atan2(aimY - originY, aimX - originX);
  return {
    kind: "arc",
    cx: originX,
    cy: originY,
    angle,
    radius: range,
    halfAngle: basicArcWidthForLoadout(ownedSkillIds) / 2,
  };
}

export function telegraphForActiveSkill(
  originX: number,
  originY: number,
  aimX: number,
  aimY: number,
  skill: CultivationSkillDef,
): DamageTelegraph {
  const angle = Math.atan2(aimY - originY, aimX - originX);
  const rc = skill.rangeClass;

  if (rc === "dash") {
    return {
      kind: "dash",
      x1: originX,
      y1: originY,
      x2: originX + Math.cos(angle) * DASH_DISTANCE,
      y2: originY + Math.sin(angle) * DASH_DISTANCE,
      hitRadius: DASH_TELEGRAPH_HIT_RADIUS,
    };
  }

  if (rc === "self" || rc === "circle") {
    return {
      kind: "circle",
      cx: originX,
      cy: originY,
      radius: rangeForSkillClass(rc),
    };
  }

  return {
    kind: "arc",
    cx: originX,
    cy: originY,
    angle,
    radius: rangeForSkillClass(rc),
    halfAngle: arcWidthForSkillClass(rc) / 2,
  };
}
