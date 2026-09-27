/** Minimal status framework — extended when DaoPath lands. */

export type StatusKind = "stun" | "slow" | "poison" | "shield";

export interface StatusTick {
  kind: StatusKind;
  remainingMs: number;
  magnitude: number;
}

export function tickStatuses(
  statuses: StatusTick[],
  dtMs: number,
): StatusTick[] {
  return statuses
    .map((s) => ({ ...s, remainingMs: s.remainingMs - dtMs }))
    .filter((s) => s.remainingMs > 0);
}

export function poisonDamagePerTick(
  stacks: number,
  tickMultiplier = 1,
): number {
  if (stacks <= 0) return 0;
  return stacks * 0.4 * tickMultiplier;
}
