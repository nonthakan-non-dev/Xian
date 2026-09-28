import {
  ACTIVE_SKILL_COOLDOWN_MS,
  BASIC_ATTACK_COOLDOWN_MS,
  getSkillById,
  skillCooldownRemainingMs,
  type CultivationSkillDef,
} from "@xian/shared";

let lastSkillUsedAtMs = 0;
let lastBasicAttackAtMs = 0;

export function recordClientSkillUse(atMs = performance.now()): void {
  lastSkillUsedAtMs = atMs;
}

export function resetClientSkillCooldown(): void {
  lastSkillUsedAtMs = 0;
  lastBasicAttackAtMs = 0;
}

export function recordClientBasicAttack(atMs = performance.now()): void {
  lastBasicAttackAtMs = atMs;
}

export function clientBasicAttackCooldownRemainingMs(
  nowMs = performance.now(),
): number {
  return Math.max(0, BASIC_ATTACK_COOLDOWN_MS - (nowMs - lastBasicAttackAtMs));
}

export function clientSkillCooldownRemainingMs(
  skill: CultivationSkillDef | undefined,
  nowMs = performance.now(),
): number {
  if (!skill) return 0;
  const cd = skill.cooldownMs ?? ACTIVE_SKILL_COOLDOWN_MS;
  return skillCooldownRemainingMs(nowMs, lastSkillUsedAtMs, cd);
}

export function clientSkillCooldownForPlayer(
  lastActiveSkillId: string,
  nowMs = performance.now(),
): { skill: CultivationSkillDef | undefined; remainingMs: number; totalMs: number } {
  const skill = lastActiveSkillId
    ? getSkillById(lastActiveSkillId)
    : undefined;
  const totalMs = skill?.cooldownMs ?? ACTIVE_SKILL_COOLDOWN_MS;
  const remainingMs = clientSkillCooldownRemainingMs(skill, nowMs);
  return { skill, remainingMs, totalMs };
}
