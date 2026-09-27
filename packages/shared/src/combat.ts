/** Qi-as-HP damage and death drops. */

export const RESPAWN_QI = 20;
export const ORB_DROP_CHUNK = 8;
export const BASIC_ATTACK_DAMAGE = 14;
export const BASIC_ATTACK_RANGE = 130;
export const BASIC_ATTACK_COOLDOWN_MS = 450;
export const MELEE_HIT_ANGLE = Math.PI * 0.55;

export function applyDamageToQi(currentQi: number, damage: number): number {
  if (damage <= 0) return currentQi;
  return Math.max(0, currentQi - damage);
}

/** Split remaining Qi into orb pickup values (each ≥ 1). */
export function qiToOrbValues(remainingQi: number): number[] {
  if (remainingQi <= 0) return [];
  const values: number[] = [];
  let left = Math.floor(remainingQi);
  while (left > 0) {
    const chunk = Math.min(ORB_DROP_CHUNK, left);
    values.push(chunk);
    left -= chunk;
  }
  return values;
}

export function angleToTarget(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

export function isInAttackArc(
  fromX: number,
  fromY: number,
  aimAngle: number,
  targetX: number,
  targetY: number,
  range: number,
  arcWidth = MELEE_HIT_ANGLE,
): boolean {
  const dist = Math.hypot(targetX - fromX, targetY - fromY);
  if (dist > range || dist < 1) return false;
  const angleTo = angleToTarget(fromX, fromY, targetX, targetY);
  let diff = angleTo - aimAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= arcWidth / 2;
}
