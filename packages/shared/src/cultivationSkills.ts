/** CultivationSkill pools and catalog validation. */

import { SKILL_CATALOG as _SKILL_CATALOG } from "./cultivationSkillCatalog.js";

export { SKILL_CATALOG } from "./cultivationSkillCatalog.js";

const SKILL_CATALOG = _SKILL_CATALOG;
import type { CultivationSkillDef } from "./cultivationSkillTypes.js";
import {
  REALM_SKILL_FLOOR_MAX,
  REALM_SKILL_FLOOR_MIN,
  SKILLS_PER_REALM_FLOOR,
} from "./cultivationSkillTypes.js";

export type {
  CultivationSkillDef,
  SkillKind,
  SkillRangeClass,
} from "./cultivationSkillTypes.js";
export {
  REALM_SKILL_FLOOR_MAX,
  REALM_SKILL_FLOOR_MIN,
  SKILLS_PER_REALM_FLOOR,
} from "./cultivationSkillTypes.js";

const byId = new Map<string, CultivationSkillDef>();
const byFloor = new Map<number, CultivationSkillDef[]>();

for (const skill of SKILL_CATALOG) {
  byId.set(skill.id, skill);
  const list = byFloor.get(skill.realmFloor) ?? [];
  list.push(skill);
  byFloor.set(skill.realmFloor, list);
}

export function getSkillById(id: string): CultivationSkillDef | undefined {
  return byId.get(id);
}

export function getSkillPoolForRealm(
  realmFloor: number,
): readonly CultivationSkillDef[] {
  return byFloor.get(realmFloor) ?? [];
}

export function validateSkillCatalog(): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (let floor = REALM_SKILL_FLOOR_MIN; floor <= REALM_SKILL_FLOOR_MAX; floor++) {
    const pool = byFloor.get(floor);
    if (!pool || pool.length !== SKILLS_PER_REALM_FLOOR) {
      errors.push(
        `floor ${floor}: expected ${SKILLS_PER_REALM_FLOOR} skills, got ${pool?.length ?? 0}`,
      );
      continue;
    }
    for (const skill of pool) {
      if (skill.realmFloor !== floor) {
        errors.push(`${skill.id}: realmFloor ${skill.realmFloor} !== ${floor}`);
      }
      if (seenIds.has(skill.id)) {
        errors.push(`duplicate id ${skill.id}`);
      }
      seenIds.add(skill.id);
      if (
        (skill.kind === "active" || skill.kind === "hybrid") &&
        skill.cooldownMs === undefined
      ) {
        errors.push(`${skill.id}: active skill missing cooldownMs`);
      }
    }
  }

  if (SKILL_CATALOG.length !== REALM_SKILL_FLOOR_MAX * SKILLS_PER_REALM_FLOOR) {
    errors.push(
      `catalog length ${SKILL_CATALOG.length} !== ${REALM_SKILL_FLOOR_MAX * SKILLS_PER_REALM_FLOOR}`,
    );
  }

  return errors;
}

export function assertValidSkillCatalog(): void {
  const errors = validateSkillCatalog();
  if (errors.length > 0) {
    throw new Error(`Invalid skill catalog:\n${errors.join("\n")}`);
  }
}

assertValidSkillCatalog();
