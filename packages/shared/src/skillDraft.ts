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

export function shouldOpenSkillDraft(
  prevRealmFloor: number,
  nextRealmFloor: number,
): boolean {
  return nextRealmFloor > prevRealmFloor;
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
