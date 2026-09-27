import type { DaoPathChoice } from "./daoPath.js";
import {
  clampRealmFloor,
  cultivationFloorDef,
} from "./cultivation.js";
import type { CultivationMajorStep } from "./cultivationCatalog.js";

/** Fill colors by major cultivation step — geometric aura base. */
const MAJOR_STEP_FILL: Record<CultivationMajorStep, number> = {
  ningqi: 0x88ccff,
  foundation: 0x66aaff,
  core: 0x44ddaa,
  embryo: 0x55ccbb,
  nascent: 0xddcc44,
  transform: 0xdd8844,
  immortal: 0xcc44aa,
  ascendant: 0xffeedd,
  yin: 0x8899cc,
  yang: 0xffcc66,
  nirvanaGlimpse: 0xaaccff,
  nirvanaPurify: 0x99eedd,
  nirvanaShatter: 0xffaa88,
  fiveDecay: 0xaa7788,
  voidNirvana: 0x778899,
  voidSpirit: 0x8899aa,
  voidProfound: 0x667788,
  mysticTribulation: 0xccaa44,
  voidAeon: 0x554466,
  goldenSovereign: 0xffdd55,
  heavenlyVenerable: 0xeeddcc,
  lunarVenerable: 0xccddee,
  grandVenerable: 0xffeedd,
  nineBridges: 0xbbddff,
  heavenTread: 0xffffff,
};

const MAJOR_STEP_GLOW: Record<CultivationMajorStep, number> = {
  ningqi: 0x446688,
  foundation: 0x3355aa,
  core: 0x228866,
  embryo: 0x226655,
  nascent: 0xaa9922,
  transform: 0xaa5522,
  immortal: 0x882266,
  ascendant: 0xddccaa,
  yin: 0x334466,
  yang: 0xaa7722,
  nirvanaGlimpse: 0x446688,
  nirvanaPurify: 0x338866,
  nirvanaShatter: 0x884422,
  fiveDecay: 0x553344,
  voidNirvana: 0x334455,
  voidSpirit: 0x445566,
  voidProfound: 0x223344,
  mysticTribulation: 0x665522,
  voidAeon: 0x221133,
  goldenSovereign: 0xaa8822,
  heavenlyVenerable: 0x887766,
  lunarVenerable: 0x556677,
  grandVenerable: 0x998877,
  nineBridges: 0x446688,
  heavenTread: 0xcccccc,
};

/** Stroke accent by DaoPath. */
export const DAO_PATH_ACCENT: Record<DaoPathChoice | "", number> = {
  "": 0xcccccc,
  sword: 0x99eeff,
  body: 0xffcc55,
  lightning: 0xbbddff,
  shadow: 0xbb88ff,
};

export function realmFillColor(realmFloor: number): number {
  const step = cultivationFloorDef(clampRealmFloor(realmFloor)).majorStep;
  return MAJOR_STEP_FILL[step];
}

export function realmGlowColor(realmFloor: number): number {
  const step = cultivationFloorDef(clampRealmFloor(realmFloor)).majorStep;
  return MAJOR_STEP_GLOW[step];
}

export function daoPathAccentColor(daoPath: string): number {
  if (daoPath === "sword" || daoPath === "body" || daoPath === "lightning" || daoPath === "shadow") {
    return DAO_PATH_ACCENT[daoPath];
  }
  return DAO_PATH_ACCENT[""];
}

export function playerBodyRadius(realmFloor: number): number {
  const floor = clampRealmFloor(realmFloor);
  return 14 + Math.min(25, floor) * 1.4;
}
