import { MAP_HEIGHT, MAP_WIDTH } from "./balance.js";
import { applyDamageToQi } from "./combat.js";

export type DemonKind = "wild" | "deep";

export interface DemonZoneDef {
  id: string;
  cx: number;
  cy: number;
  radius: number;
  wildQuota: number;
  deepQuota: number;
}

export const DEMON_ZONES: DemonZoneDef[] = [
  {
    id: "z-north",
    cx: MAP_WIDTH * 0.5,
    cy: MAP_HEIGHT * 0.22,
    radius: 420,
    wildQuota: 4,
    deepQuota: 0,
  },
  {
    id: "z-east",
    cx: MAP_WIDTH * 0.78,
    cy: MAP_HEIGHT * 0.55,
    radius: 380,
    wildQuota: 3,
    deepQuota: 2,
  },
  {
    id: "z-south",
    cx: MAP_WIDTH * 0.35,
    cy: MAP_HEIGHT * 0.78,
    radius: 400,
    wildQuota: 2,
    deepQuota: 3,
  },
];

export const DEMON_STATS: Record<
  DemonKind,
  { maxQi: number; damage: number; speed: number; orbDrop: number }
> = {
  wild: { maxQi: 45, damage: 7, speed: 95, orbDrop: 22 },
  deep: { maxQi: 85, damage: 13, speed: 110, orbDrop: 38 },
};

export function pointInZone(
  x: number,
  y: number,
  zone: DemonZoneDef,
): boolean {
  return Math.hypot(x - zone.cx, y - zone.cy) <= zone.radius;
}

export function isInAnyDemonZone(x: number, y: number): boolean {
  return DEMON_ZONES.some((z) => pointInZone(x, y, z));
}

export function zoneForPoint(x: number, y: number): DemonZoneDef | undefined {
  return DEMON_ZONES.find((z) => pointInZone(x, y, z));
}

export function damageDemon(currentQi: number, damage: number): number {
  return applyDamageToQi(currentQi, damage);
}

export function randomPointInZone(zone: DemonZoneDef): { x: number; y: number } {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * zone.radius * 0.85;
    const x = zone.cx + Math.cos(angle) * r;
    const y = zone.cy + Math.sin(angle) * r;
    if (x > 80 && y > 80 && x < MAP_WIDTH - 80 && y < MAP_HEIGHT - 80) {
      return { x, y };
    }
  }
  return { x: zone.cx, y: zone.cy };
}
