import { ORB_VALUE } from "./balance.js";

export const VASSANA_CAP = 100;
export const VASSANA_PASSIVE_PER_SEC = 2;
export const VASSANA_ZONE_MULT = 2.5;
export const VASSANA_KILL_BONUS = 8;

export function tickVassana(
  current: number,
  dtSec: number,
  inDemonZone: boolean,
): number {
  let rate = VASSANA_PASSIVE_PER_SEC;
  if (inDemonZone) rate *= VASSANA_ZONE_MULT;
  return Math.min(VASSANA_CAP, current + rate * dtSec);
}

export function addVassanaOnDemonKill(current: number): number {
  return Math.min(VASSANA_CAP, current + VASSANA_KILL_BONUS);
}

/** Roll orb value with vassana — higher luck → chance of bonus chunk. */
export function rollOrbWithVassana(baseValue: number, vassana: number): number {
  const roll = Math.random();
  const bonusThreshold = 0.85 - (vassana / VASSANA_CAP) * 0.35;
  if (roll > bonusThreshold) {
    return baseValue + Math.floor(ORB_VALUE * (0.5 + vassana / VASSANA_CAP));
  }
  return baseValue;
}
