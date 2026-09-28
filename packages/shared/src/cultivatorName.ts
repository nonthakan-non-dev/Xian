import {
  familyNames,
  firstNames,
  lastNames,
  middleNames,
} from "./cultivatorNameWords.js";

export const CULTIVATOR_DISPLAY_NAME_MAX = 24;
export const CULTIVATOR_NAME_FOUR_PART_CHANCE = 0.5;

const MAX_REROLL = 8;

export type CultivatorNamePattern = "three" | "four";

function pickWord<T>(words: readonly T[], random: () => number): T {
  const idx = Math.floor(random() * words.length);
  return words[idx]!;
}

export function pickCultivatorNamePattern(
  random: () => number,
): CultivatorNamePattern {
  return random() < CULTIVATOR_NAME_FOUR_PART_CHANCE ? "three" : "four";
}

function buildCultivatorDisplayName(
  pattern: CultivatorNamePattern,
  random: () => number,
): string {
  const family = pickWord(familyNames, random);
  const first = pickWord(firstNames, random);
  const last = pickWord(lastNames, random);
  if (pattern === "three") {
    return family + first + last;
  }
  const middle = pickWord(middleNames, random);
  return family + first + middle + last;
}

function rollWithinMaxLength(
  pattern: CultivatorNamePattern,
  random: () => number,
): string | undefined {
  for (let i = 0; i < MAX_REROLL; i++) {
    const name = buildCultivatorDisplayName(pattern, random);
    if (name.length <= CULTIVATOR_DISPLAY_NAME_MAX) return name;
  }
  return undefined;
}

export function rollCultivatorDisplayName(
  random: () => number,
  options?: { pattern?: CultivatorNamePattern },
): string {
  const pattern = options?.pattern ?? pickCultivatorNamePattern(random);

  const rolled = rollWithinMaxLength(pattern, random);
  if (rolled) return rolled;

  if (pattern === "four") {
    const threePart = rollWithinMaxLength("three", random);
    if (threePart) return threePart;
  }

  const fallback = buildCultivatorDisplayName("three", random);
  return fallback.slice(0, CULTIVATOR_DISPLAY_NAME_MAX);
}
