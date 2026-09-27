/** Tunables — single source of truth for gameplay numbers. */

export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 4000;

export const MAX_PLAYERS = 32;
export const TICK_RATE_MS = 50;

export const ORB_VALUE = 8;
export const ORB_PICKUP_RADIUS = 48;
export const ORB_TARGET_COUNT = 120;
export const ORB_SPAWN_INTERVAL_MS = 500;

export const MAX_QI_BY_REALM: Record<number, number> = {
  1: 100,
  2: 150,
  3: 220,
  4: 320,
  5: 450,
  6: 620,
  7: 850,
};

export const REALM_QI_THRESHOLDS: Record<number, number> = {
  2: 80,
  3: 140,
  4: 210,
  5: 300,
  6: 420,
  7: 580,
};

export const REALM_NAMES_TH: Record<number, string> = {
  1: "รวบรวมปราณ",
  2: "สร้างฐานปราณ",
  3: "จินตาน",
  4: "วิญญาณทารก",
  5: "ตัดวิญญาณ",
  6: "แปลงวิญญาณ",
  7: "ถามเต๋า",
};

export const BASE_MOVE_SPEED = 220;
export const REALM_SPEED_FACTOR: Record<number, number> = {
  1: 1.12,
  2: 1.06,
  3: 1,
  4: 0.94,
  5: 0.88,
  6: 0.82,
  7: 0.76,
};

export function maxQiForRealm(realmFloor: number): number {
  return MAX_QI_BY_REALM[realmFloor] ?? MAX_QI_BY_REALM[1];
}

export function moveSpeedForRealm(realmFloor: number): number {
  return BASE_MOVE_SPEED * (REALM_SPEED_FACTOR[realmFloor] ?? 1);
}
