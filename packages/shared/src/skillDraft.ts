import type { SkillKind } from "./cultivationSkillTypes.js";

export type SkillDraftPickInput = {
  ownedSkillIds: readonly string[];
  draftOfferIds: readonly string[];
  lastActiveSkillId: string;
  skillId: string;
  skillKind: SkillKind;
};

export type SkillDraftPickResult = {
  ownedSkillIds: string[];
  draftOfferIds: string[];
  awaitingSkillDraft: boolean;
  lastActiveSkillId: string;
};

/** หมดเวลาแล้ว server สุ่มเลือกวิชาให้ (กัน AFK ระหว่าง draft). */
export const SKILL_DRAFT_PICK_TIMEOUT_MS = 30_000;

/** ก่อนเปิด modal เลือกวิชา — แสดงขึ้นขั้น (client VFX). */
export const SKILL_DRAFT_CELEBRATE_MS = 1200;

export function pickRandomDraftOffer(
  draftOfferIds: readonly string[],
  random: () => number,
): string | undefined {
  if (draftOfferIds.length === 0) return undefined;
  const idx = Math.floor(random() * draftOfferIds.length);
  return draftOfferIds[idx];
}

export function shouldOpenSkillDraft(
  prevRealmFloor: number,
  nextRealmFloor: number,
): boolean {
  return nextRealmFloor > prevRealmFloor;
}

/** Modal SkillDraft — ไม่รับดาเมจจาก combat / poison tick (server). */
export function playerIgnoresIncomingDamage(
  awaitingSkillDraft: boolean,
): boolean {
  return awaitingSkillDraft;
}

export function rollSkillDraft(
  poolIds: readonly string[],
  ownedIds: readonly string[],
  random: () => number,
): string[] {
  const owned = new Set(ownedIds);
  const candidates = poolIds.filter((id) => !owned.has(id));
  if (candidates.length === 0) return [];

  const count = Math.min(3, candidates.length);
  const bag = [...candidates];
  const picked: string[] = [];
  for (let n = 0; n < count; n++) {
    const idx = Math.floor(random() * bag.length);
    picked.push(bag[idx]!);
    bag.splice(idx, 1);
  }
  return picked;
}

export function validateSkillPick(
  skillId: string,
  draftOfferIds: readonly string[],
): boolean {
  return draftOfferIds.includes(skillId);
}

export function applySkillPick(input: SkillDraftPickInput): SkillDraftPickResult {
  const ownedSkillIds = [...input.ownedSkillIds, input.skillId];
  const isActive =
    input.skillKind === "active" || input.skillKind === "hybrid";
  return {
    ownedSkillIds,
    draftOfferIds: [],
    awaitingSkillDraft: false,
    lastActiveSkillId: isActive
      ? input.skillId
      : input.lastActiveSkillId,
  };
}
