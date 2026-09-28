import { MAP_HEIGHT, MAP_WIDTH } from "./balance.js";

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
