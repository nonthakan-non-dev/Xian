import { maxQiForRealm } from "./balance.js";
import { promoteCultivation } from "./cultivation.js";

export function applyOrbPickup(
  currentQi: number,
  orbValue: number,
  maxQi: number,
): number {
  return Math.min(maxQi, currentQi + orbValue);
}

/** @deprecated Prefer promoteCultivation — returns RealmFloor only. */
export function promoteRealmFloor(
  currentQi: number,
  realmFloor: number,
  qiLayer = 1,
): number {
  return promoteCultivation(currentQi, realmFloor, qiLayer).realmFloor;
}

export function applyQiGainWithCultivation(
  currentQi: number,
  realmFloor: number,
  qiLayer: number,
  gain: number,
): { currentQi: number; realmFloor: number; qiLayer: number } {
  const capBefore = maxQiForRealm(realmFloor, qiLayer);
  let qi = applyOrbPickup(currentQi, gain, capBefore);
  const rank = promoteCultivation(qi, realmFloor, qiLayer);
  const capAfter = maxQiForRealm(rank.realmFloor, rank.qiLayer);
  qi = Math.min(qi, capAfter);
  return { currentQi: qi, realmFloor: rank.realmFloor, qiLayer: rank.qiLayer };
}
