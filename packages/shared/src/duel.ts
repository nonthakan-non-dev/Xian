import { MAP_HEIGHT, MAP_WIDTH, maxQiForRealm } from "./balance.js";
import { applyOrbPickup } from "./qi.js";

export const POCKET_QI_TRANSFER_RATE = 0.4;

export interface DuelZoneDef {
  id: string;
  cx: number;
  cy: number;
  radius: number;
}

/** FFA duel ring on main map */
export const DUEL_ZONES: DuelZoneDef[] = [
  {
    id: "duel-center",
    cx: MAP_WIDTH * 0.5,
    cy: MAP_HEIGHT * 0.5,
    radius: 300,
  },
];

/** Isolated pocket arena (partition on same map). */
export const POCKET_SPAWN_A = { x: 3600, y: 3600 };
export const POCKET_SPAWN_B = { x: 3780, y: 3600 };

export function isInDuelZone(x: number, y: number): boolean {
  return DUEL_ZONES.some(
    (z) => Math.hypot(x - z.cx, y - z.cy) <= z.radius,
  );
}

export function ejectFromDuelZone(
  x: number,
  y: number,
  zone: DuelZoneDef,
): { x: number; y: number } {
  const angle = Math.atan2(y - zone.cy, x - zone.cx);
  const dist = zone.radius + 48;
  return {
    x: zone.cx + Math.cos(angle) * dist,
    y: zone.cy + Math.sin(angle) * dist,
  };
}

export type ChallengeRejectReason = "in_duel_zone" | "in_pocket";

export function tryStartChallenge(input: {
  challengerInDuelZone: boolean;
  targetInDuelZone: boolean;
  challengerInPocket: boolean;
  targetInPocket: boolean;
}):
  | { ok: true }
  | { ok: false; reason: ChallengeRejectReason } {
  if (input.challengerInDuelZone || input.targetInDuelZone) {
    return { ok: false, reason: "in_duel_zone" };
  }
  if (input.challengerInPocket || input.targetInPocket) {
    return { ok: false, reason: "in_pocket" };
  }
  return { ok: true };
}

export function isMutualChallenge(
  challengerId: string,
  targetChallengeTo: string,
): boolean {
  return targetChallengeTo === challengerId;
}

export function resolvePocketDuel(input: {
  loserQiBeforeZero: number;
  loserRealmFloor: number;
  winnerQi: number;
  winnerRealmFloor: number;
}): {
  winnerQi: number;
  loserRealmFloor: number;
  transferAmount: number;
} {
  const transferAmount = Math.floor(
    input.loserQiBeforeZero * POCKET_QI_TRANSFER_RATE,
  );
  const cap = maxQiForRealm(input.winnerRealmFloor);
  const winnerQi = applyOrbPickup(input.winnerQi, transferAmount, cap);
  const loserRealmFloor = Math.max(1, input.loserRealmFloor - 1);
  return { winnerQi, loserRealmFloor, transferAmount };
}

export function canEngagePvP(a: {
  inPocketDuel: boolean;
  pocketOpponentId: string;
  sessionId: string;
}, b: {
  inPocketDuel: boolean;
  pocketOpponentId: string;
  sessionId: string;
}): boolean {
  if (a.inPocketDuel || b.inPocketDuel) {
    return (
      a.inPocketDuel &&
      b.inPocketDuel &&
      a.pocketOpponentId === b.sessionId &&
      b.pocketOpponentId === a.sessionId
    );
  }
  return true;
}
