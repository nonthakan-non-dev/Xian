export function skillCooldownRemainingMs(
  nowMs: number,
  lastUseMs: number,
  cooldownMs: number,
): number {
  if (cooldownMs <= 0 || lastUseMs <= 0) return 0;
  return Math.max(0, cooldownMs - (nowMs - lastUseMs));
}

export function isSkillOnCooldown(
  nowMs: number,
  lastUseMs: number,
  cooldownMs: number,
): boolean {
  return skillCooldownRemainingMs(nowMs, lastUseMs, cooldownMs) > 0;
}
