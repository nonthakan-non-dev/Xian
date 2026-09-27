/** CultivationSkill catalog types (SkillDraft / xian-10a). */

export type SkillKind = "passive" | "active" | "hybrid";

export type SkillRangeClass =
  | "self"
  | "single"
  | "line"
  | "cone"
  | "circle"
  | "dash"
  | "global";

export type CultivationSkillDef = {
  id: string;
  realmFloor: number;
  nameTh: string;
  nameEn: string;
  kind: SkillKind;
  descriptionTh: string;
  atkPercent: number;
  rangeClass: SkillRangeClass;
  ccType?: string;
  cooldownMs?: number;
};

export const REALM_SKILL_FLOOR_MIN = 1;
export const REALM_SKILL_FLOOR_MAX = 25;
export const SKILLS_PER_REALM_FLOOR = 10;
