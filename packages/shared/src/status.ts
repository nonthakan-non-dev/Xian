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

/** No poison refresh for this long before stacks begin to decay. */
export const POISON_DECAY_IDLE_MS = 2000;
/** Each decay step removes one stack after idle threshold. */
export const POISON_DECAY_STEP_MS = 2000;

export interface PoisonDecayState {
  lastRefreshMs: number;
  nextDecayAt: number;
}

export function poisonDecayStateOnRefresh(now: number): PoisonDecayState {
  return {
    lastRefreshMs: now,
    nextDecayAt: now + POISON_DECAY_IDLE_MS,
  };
}

export function tickPoisonDecayState(
  stacks: number,
  state: PoisonDecayState | undefined,
  now: number,
): { stacks: number; state: PoisonDecayState | undefined } {
  if (stacks <= 0) {
    return { stacks: 0, state: undefined };
  }
  if (!state || state.lastRefreshMs <= 0) {
    return { stacks, state };
  }

  let s = stacks;
  let next = state.nextDecayAt;
  if (next <= 0) {
    next = state.lastRefreshMs + POISON_DECAY_IDLE_MS;
  }

  while (s > 0 && now >= next) {
    s -= 1;
    next += POISON_DECAY_STEP_MS;
  }

  if (s <= 0) {
    return { stacks: 0, state: undefined };
  }

  return {
    stacks: s,
    state: { lastRefreshMs: state.lastRefreshMs, nextDecayAt: next },
  };
}
