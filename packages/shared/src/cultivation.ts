import {
  ningqiLayerThreshold,
  realmPromotionThreshold,
} from "./balance.js";
import {
  CULTIVATION_CATALOG,
  CULTIVATION_FLOOR_MAX,
  QI_LAYER_MAX,
  cultivationFloorDef,
} from "./cultivationCatalog.js";

export {
  CULTIVATION_CATALOG,
  CULTIVATION_FLOOR_MAX,
  QI_LAYER_MAX,
  cultivationFloorDef,
} from "./cultivationCatalog.js";
export type {
  CultivationFloorDef,
  CultivationFloorKind,
  CultivationMajorStep,
} from "./cultivationCatalog.js";

export function clampRealmFloor(realmFloor: number): number {
  if (!Number.isFinite(realmFloor)) return 1;
  return Math.max(1, Math.min(CULTIVATION_FLOOR_MAX, Math.floor(realmFloor)));
}

export function clampQiLayer(qiLayer: number): number {
  if (!Number.isFinite(qiLayer)) return 1;
  return Math.max(1, Math.min(QI_LAYER_MAX, Math.floor(qiLayer)));
}

function qiLayerFromCurrentQi(currentQi: number): number {
  let layer = 1;
  for (let l = 2; l <= QI_LAYER_MAX; l++) {
    if (currentQi >= ningqiLayerThreshold(l)) layer = l;
    else break;
  }
  return layer;
}

export function promoteCultivation(
  currentQi: number,
  realmFloor: number,
  qiLayer: number,
): { realmFloor: number; qiLayer: number } {
  let floor = clampRealmFloor(realmFloor);
  let layer = floor === 1 ? clampQiLayer(qiLayer) : 1;

  if (floor === 1) {
    layer = Math.max(layer, qiLayerFromCurrentQi(currentQi));
    const needFloor2 = realmPromotionThreshold(2);
    if (layer >= QI_LAYER_MAX && currentQi >= needFloor2) {
      floor = 2;
      layer = 1;
    }
  }

  while (floor < CULTIVATION_FLOOR_MAX) {
    const next = floor + 1;
    const need = realmPromotionThreshold(next);
    if (currentQi < need) break;
    floor = next;
    layer = 1;
  }

  return { realmFloor: floor, qiLayer: layer };
}

export function demoteCultivation(
  realmFloor: number,
  qiLayer: number,
): { realmFloor: number; qiLayer: number } {
  const floor = clampRealmFloor(realmFloor);
  if (floor > 2) {
    return { realmFloor: floor - 1, qiLayer: 1 };
  }
  if (floor === 2) {
    return { realmFloor: 1, qiLayer: QI_LAYER_MAX };
  }
  return { realmFloor: 1, qiLayer: Math.max(1, clampQiLayer(qiLayer) - 1) };
}

export function realmDisplayName(realmFloor: number, qiLayer: number): string {
  const floor = clampRealmFloor(realmFloor);
  const def = cultivationFloorDef(floor);
  if (floor === 1) {
    const layer = clampQiLayer(qiLayer);
    return `${def.nameTh} · ชั้น ${layer}`;
  }
  return def.nameTh;
}

/** Legacy DaoPath combat scaling — caps at seven like the old ladder. */
export function effectiveCombatTier(
  realmFloor: number,
  qiLayer: number,
): number {
  const floor = clampRealmFloor(realmFloor);
  if (floor <= 1) {
    return Math.max(1, Math.min(7, Math.ceil((clampQiLayer(qiLayer) * 7) / QI_LAYER_MAX)));
  }
  return Math.min(7, floor);
}

export { effectiveStatTier } from "./cultivationCatalog.js";
