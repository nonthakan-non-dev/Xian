/** DaoPath ids, kit rules, and passive helpers (server-authoritative). */

export type DaoPathId = "" | "sword" | "body" | "lightning" | "shadow";

export const DAO_PATH_IDS = ["sword", "body", "lightning", "shadow"] as const;
export type DaoPathChoice = (typeof DAO_PATH_IDS)[number];

export const DAO_PATH_UI_TH: Record<
  DaoPathChoice,
  { title: string; blurb: string }
> = {
  sword: {
    title: "วิชากระบี่บิน",
    blurb: "คลื่นกระบี่ · กระบี่โคจร · Dash ฟัน",
  },
  body: {
    title: "หลอมกายา",
    blurb: "ต่อยใกล้ · กายาทอง · โล่สะท้อน",
  },
  lightning: {
    title: "เต๋าอัคนี",
    blurb: "สายฟ้า · Overload · ฟ้าผ่า AoE",
  },
  shadow: {
    title: "เงาพิษ",
    blurb: "ลูกศรพิษ · ล่องหน · วาร์ปช้า",
  },
};

export const PATH_CHOICE_REALM = 2;
export const HERB_BUFF_MS = 10_000;
export const ACTIVE_SKILL_COOLDOWN_MS = 2800;
export const SHIELD_DURATION_MS = 1500;
export const STUN_MS = 500;
export const SLOW_MS = 1200;
export const SHADOW_STEALTH_MS = 3000;
export const FLYING_SWORD_INTERVAL_MS = 700;
export const FLYING_SWORD_RANGE = 160;
export const FLYING_SWORD_DAMAGE = 6;
export const DASH_DISTANCE = 140;
export const LIGHTNING_AOE_RADIUS = 110;
export const SHADOW_WARP_RANGE = 200;

export function isValidDaoPath(id: string): id is DaoPathChoice {
  return (DAO_PATH_IDS as readonly string[]).includes(id);
}

export function isCombatKitActive(
  realmFloor: number,
  daoPath: string,
  awaitingPathChoice: boolean,
): boolean {
  return (
    realmFloor >= PATH_CHOICE_REALM &&
    !awaitingPathChoice &&
    daoPath !== ""
  );
}

export function shouldAwaitPathChoice(
  realmFloor: number,
  daoPath: string,
): boolean {
  return realmFloor >= PATH_CHOICE_REALM && daoPath === "";
}

export function addPoisonStack(current: number): number {
  return Math.min(5, current + 1);
}

export function overloadOnSkillUse(stacks: number): {
  stacks: number;
  crit: boolean;
} {
  if (stacks >= 2) {
    return { stacks: 0, crit: true };
  }
  return { stacks: stacks + 1, crit: false };
}

export function applyIronSkinDamage(
  incoming: number,
  daoPath: string,
): number {
  if (daoPath !== "body" || incoming <= 0) return incoming;
  return incoming * 0.8;
}

export function isBodyStunImmune(
  daoPath: string,
  currentQi: number,
  maxQi: number,
): boolean {
  return daoPath === "body" && currentQi > maxQi * 0.5;
}

export function flyingSwordCount(realmFloor: number): number {
  return Math.min(5, Math.max(0, realmFloor - 1));
}

export function resolveBasicDamage(
  daoPath: string,
  crit: boolean,
): number {
  let base = 14;
  switch (daoPath) {
    case "sword":
      base = 13;
      break;
    case "body":
      base = 18;
      break;
    case "lightning":
      base = 22;
      break;
    case "shadow":
      base = 11;
      break;
    default:
      base = 14;
  }
  return crit ? base * 2 : base;
}

export function resolveActiveDamage(
  daoPath: string,
  crit: boolean,
): number {
  let base = 20;
  switch (daoPath) {
    case "sword":
      base = 24;
      break;
    case "body":
      base = 8;
      break;
    case "lightning":
      base = 28;
      break;
    case "shadow":
      base = 16;
      break;
    default:
      base = 20;
  }
  return crit ? base * 2 : base;
}

export function basicAttackRange(daoPath: string): number {
  switch (daoPath) {
    case "body":
      return 72;
    case "lightning":
      return 200;
    case "shadow":
      return 190;
    case "sword":
    default:
      return 130;
  }
}

export function herbSpeedMultiplier(daoPath: string, herbActive: boolean): number {
  if (!herbActive) return 1;
  if (daoPath === "sword") return 1.15;
  if (daoPath === "shadow") return 1.1;
  return 1;
}

export function herbDamageTakenMultiplier(
  daoPath: string,
  herbActive: boolean,
): number {
  if (!herbActive || daoPath !== "body") return 1;
  return 0.85;
}

export function herbAoeRadiusBonus(daoPath: string, herbActive: boolean): number {
  if (!herbActive || daoPath !== "lightning") return 0;
  return 25;
}

export function herbPoisonTickMultiplier(
  daoPath: string,
  herbActive: boolean,
): number {
  if (!herbActive || daoPath !== "shadow") return 1;
  return 1.35;
}

export function shadowStealthSpeedBonus(
  daoPath: string,
  msSinceDamage: number,
): number {
  if (daoPath !== "shadow" || msSinceDamage < SHADOW_STEALTH_MS) return 1;
  return 1.25;
}
