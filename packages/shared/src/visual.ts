import type { DaoPathChoice } from "./daoPath.js";

/** Fill colors by RealmFloor (1–7) — geometric aura base. */
export const REALM_FILL_COLORS: readonly number[] = [
  0x88ccff, 0x66aaff, 0x44ddaa, 0xddcc44, 0xdd8844, 0xcc44aa, 0xffeedd,
];

/** Outer glow tint per realm. */
export const REALM_GLOW_COLORS: readonly number[] = [
  0x446688, 0x3355aa, 0x228866, 0xaa9922, 0xaa5522, 0x882266, 0xddccaa,
];

/** Stroke accent by DaoPath. */
export const DAO_PATH_ACCENT: Record<DaoPathChoice | "", number> = {
  "": 0xcccccc,
  sword: 0x99eeff,
  body: 0xffcc55,
  lightning: 0xbbddff,
  shadow: 0xbb88ff,
};

export function realmFillColor(realmFloor: number): number {
  const idx = Math.max(0, Math.min(6, realmFloor - 1));
  return REALM_FILL_COLORS[idx] ?? REALM_FILL_COLORS[0];
}

export function realmGlowColor(realmFloor: number): number {
  const idx = Math.max(0, Math.min(6, realmFloor - 1));
  return REALM_GLOW_COLORS[idx] ?? REALM_GLOW_COLORS[0];
}

export function daoPathAccentColor(daoPath: string): number {
  if (daoPath === "sword" || daoPath === "body" || daoPath === "lightning" || daoPath === "shadow") {
    return DAO_PATH_ACCENT[daoPath];
  }
  return DAO_PATH_ACCENT[""];
}

export function playerBodyRadius(realmFloor: number): number {
  return 14 + realmFloor * 2;
}
