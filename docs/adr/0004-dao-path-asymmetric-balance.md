# ADR 0004: DaoPath asymmetric balance

## Status

Accepted

## Context

Playable MVP targets a **2-tab demo** where every DaoPath has a clear role (PX), not identical TTK. Sword passive (FlyingSwords) dominated PvE; shadow poison stacks never fell off; body shield felt like a wall without payoff.

## Decision

1. **Asymmetric roles** — tune paths for feel and spec roles; compare paths with caps and Vitest bounds, not forced equal DPS.
2. **FlyingSwords** — slight nerf: damage 5, interval 820ms; realm-based blade count unchanged.
3. **PoisonDecay** — if poison is not refreshed for 2s, lose 1 stack every 2s (shared `tickPoisonDecayState`, server maps for refresh timestamps).
4. **Body shield** — pulse 14 / radius 95 on cast; 50% reflect while active; end-of-shield shockwave 10 / radius 75.
5. **Shadow** — basic damage 13. **Lightning Overload** — crit on skill use when stacks ≥ 3, then reset (spec: stack 3 → next skill crit).
6. **Tunables** live in `packages/shared` (`daoPath.ts`, `status.ts`) with Vitest coverage.

## Consequences

- Rebalance numbers require updating shared constants and tests, not scattered magic numbers in the room.
- Poison decay state is server-side (not replicated on schema) to keep bandwidth minimal.
- Future status UI should read stacks from schema; decay remains authoritative on server.
