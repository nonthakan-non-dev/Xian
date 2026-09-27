/** Tunables — single source of truth for gameplay numbers. */

import {
  CULTIVATION_FLOOR_MAX,
  QI_LAYER_MAX,
  cultivationFloorDef,
  effectiveStatTier,
} from "./cultivationCatalog.js";

export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 4000;

export const MAX_PLAYERS = 32;
export const TICK_RATE_MS = 50;

export const ORB_VALUE = 8;
export const ORB_PICKUP_RADIUS_BASE = 48;
export const ORB_TARGET_COUNT = 120;
export const ORB_SPAWN_INTERVAL_MS = 500;

export const HERB_PICKUP_RADIUS_BASE = 52;
export const HERB_QI_BONUS = 12;
export const HERB_SPAWN_INTERVAL_MS = 8000;
export const HERB_TARGET_COUNT = 6;

/** @deprecated Use realmDisplayName / cultivation catalog — kept for legacy imports. */
export const REALM_NAMES_TH: Record<number, string> = Object.fromEntries(
  Array.from({ length: CULTIVATION_FLOOR_MAX }, (_, i) => {
    const floor = i + 1;
    return [floor, cultivationFloorDef(floor).nameTh];
  }),
);

const LEGACY_MAX_QI_BY_FLOOR: Record<number, number> = {
  1: 100,
  2: 150,
  3: 220,
  4: 320,
  5: 450,
  6: 620,
  7: 850,
};

const LEGACY_REALM_QI_THRESHOLDS: Record<number, number> = {
  2: 80,
  3: 140,
  4: 210,
  5: 300,
  6: 420,
  7: 580,
};

function buildRealmMaxQi(): Record<number, number> {
  const table: Record<number, number> = { ...LEGACY_MAX_QI_BY_FLOOR };
  let cap = LEGACY_MAX_QI_BY_FLOOR[7]!;
  for (let floor = 8; floor <= CULTIVATION_FLOOR_MAX; floor++) {
    cap = Math.floor(cap * 1.22);
    table[floor] = cap;
  }
  return table;
}

function buildRealmPromotionThresholds(): Record<number, number> {
  const table: Record<number, number> = { ...LEGACY_REALM_QI_THRESHOLDS };
  let need = LEGACY_REALM_QI_THRESHOLDS[7]!;
  for (let floor = 8; floor <= CULTIVATION_FLOOR_MAX; floor++) {
    need = Math.floor(need * 1.32);
    table[floor] = need;
  }
  return table;
}

export const REALM_MAX_QI = buildRealmMaxQi();
export const REALM_QI_THRESHOLDS = buildRealmPromotionThresholds();

/** MaxQi while on floor 1 (หนิngชี่) per QiLayer. */
export const NINGQI_MAX_QI_BY_LAYER: Record<number, number> = Object.fromEntries(
  Array.from({ length: QI_LAYER_MAX }, (_, i) => {
    const layer = i + 1;
    const cap = Math.round(40 + ((layer - 1) * 60) / (QI_LAYER_MAX - 1));
    return [layer, cap];
  }),
);

export function ningqiLayerThreshold(layer: number): number {
  if (layer <= 1) return 0;
  return (layer - 1) * 5;
}

export function realmPromotionThreshold(floor: number): number {
  return REALM_QI_THRESHOLDS[floor] ?? Number.POSITIVE_INFINITY;
}

export const BASE_MOVE_SPEED = 220;
const STAT_TIER_SPEED_MIN = 0.65;
const STAT_TIER_SPEED_MAX = 1.12;

export function maxQiForRealm(realmFloor: number, qiLayer = 1): number {
  if (realmFloor <= 1) {
    const layer = Math.max(1, Math.min(QI_LAYER_MAX, Math.floor(qiLayer)));
    return NINGQI_MAX_QI_BY_LAYER[layer] ?? NINGQI_MAX_QI_BY_LAYER[1]!;
  }
  const floor = Math.max(1, Math.min(CULTIVATION_FLOOR_MAX, Math.floor(realmFloor)));
  return REALM_MAX_QI[floor] ?? REALM_MAX_QI[CULTIVATION_FLOOR_MAX]!;
}

export function moveSpeedForRealm(realmFloor: number, qiLayer = 1): number {
  const t = effectiveStatTier(realmFloor, qiLayer);
  const factor =
    STAT_TIER_SPEED_MAX -
    ((t - 1) * (STAT_TIER_SPEED_MAX - STAT_TIER_SPEED_MIN)) /
      (CULTIVATION_FLOOR_MAX - 1);
  return BASE_MOVE_SPEED * factor;
}

export function orbPickupRadiusForCultivation(
  realmFloor: number,
  qiLayer = 1,
): number {
  const tier = effectiveStatTier(realmFloor, qiLayer);
  return ORB_PICKUP_RADIUS_BASE + Math.floor(tier * 2.2);
}

export function herbPickupRadiusForCultivation(
  realmFloor: number,
  qiLayer = 1,
): number {
  return orbPickupRadiusForCultivation(realmFloor, qiLayer) + 4;
}

/** @deprecated use orbPickupRadiusForCultivation */
export const ORB_PICKUP_RADIUS = ORB_PICKUP_RADIUS_BASE;
/** @deprecated use herbPickupRadiusForCultivation */
export const HERB_PICKUP_RADIUS = HERB_PICKUP_RADIUS_BASE;
