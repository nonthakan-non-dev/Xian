import { REALM_QI_THRESHOLDS } from "./balance.js";

export function applyOrbPickup(
  currentQi: number,
  orbValue: number,
  maxQi: number,
): number {
  return Math.min(maxQi, currentQi + orbValue);
}

export function promoteRealmFloor(
  currentQi: number,
  realmFloor: number,
): number {
  let floor = realmFloor;
  while (floor < 7) {
    const next = floor + 1;
    const need = REALM_QI_THRESHOLDS[next];
    if (need === undefined || currentQi < need) break;
    floor = next;
  }
  return floor;
}
