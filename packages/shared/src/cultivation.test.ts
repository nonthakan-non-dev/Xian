import { describe, expect, it } from "vitest";
import {
  CULTIVATION_CATALOG,
  CULTIVATION_FLOOR_MAX,
  QI_LAYER_MAX,
  clampRealmFloor,
  demoteCultivation,
  effectiveCombatTier,
  promoteCultivation,
  realmDisplayName,
} from "./cultivation.js";
import {
  maxQiForRealm,
  ningqiLayerThreshold,
  realmPromotionThreshold,
} from "./balance.js";

describe("cultivation catalog", () => {
  it("lists twenty-five floors in novel order starting at 凝气", () => {
    expect(CULTIVATION_CATALOG).toHaveLength(CULTIVATION_FLOOR_MAX);
    expect(CULTIVATION_CATALOG[0]?.nameZh).toBe("凝气");
    expect(CULTIVATION_CATALOG[0]?.nameTh).toBe("รวมลมปราณ");
    expect(CULTIVATION_CATALOG[24]?.nameZh).toBe("踏天");
    expect(CULTIVATION_CATALOG[24]?.nameTh).toBe("ย่ำสวรรค์");
  });
});

describe("promoteCultivation", () => {
  it("starts at floor 1 layer 1 with low Qi", () => {
    expect(promoteCultivation(4, 1, 1)).toEqual({
      realmFloor: 1,
      qiLayer: 1,
    });
  });

  it("does not lower QiLayer when CurrentQi drops after damage", () => {
    expect(promoteCultivation(4, 1, 8)).toEqual({
      realmFloor: 1,
      qiLayer: 8,
    });
  });

  it("raises QiLayer within floor 1 before realm promotion", () => {
    const needLayer3 = ningqiLayerThreshold(3);
    expect(promoteCultivation(needLayer3, 1, 1).qiLayer).toBe(3);
    expect(promoteCultivation(needLayer3, 1, 1).realmFloor).toBe(1);
  });

  it("promotes to floor 2 only at layer 15 with enough Qi", () => {
    const atLayer14 = ningqiLayerThreshold(14);
    expect(promoteCultivation(atLayer14, 1, 14)).toEqual({
      realmFloor: 1,
      qiLayer: 14,
    });
    const atLayer15BelowFloor2 = ningqiLayerThreshold(15);
    expect(promoteCultivation(atLayer15BelowFloor2, 1, 15)).toEqual({
      realmFloor: 1,
      qiLayer: 15,
    });
    const needFloor2 = realmPromotionThreshold(2);
    expect(promoteCultivation(needFloor2, 1, 15)).toEqual({
      realmFloor: 2,
      qiLayer: 1,
    });
  });

  it("promotes through multiple floors when Qi is high enough", () => {
    const needFloor3 = realmPromotionThreshold(3);
    expect(promoteCultivation(needFloor3, 2, 1)).toEqual({
      realmFloor: 3,
      qiLayer: 1,
    });
  });

  it("caps promotion at floor 25", () => {
    expect(promoteCultivation(1_000_000, 25, 1)).toEqual({
      realmFloor: 25,
      qiLayer: 1,
    });
  });
});

describe("demoteCultivation", () => {
  it("drops one QiLayer on floor 1", () => {
    expect(demoteCultivation(1, 5)).toEqual({ realmFloor: 1, qiLayer: 4 });
    expect(demoteCultivation(1, 1)).toEqual({ realmFloor: 1, qiLayer: 1 });
  });

  it("sends floor 2 losers back to floor 1 layer 15", () => {
    expect(demoteCultivation(2, 1)).toEqual({ realmFloor: 1, qiLayer: 15 });
  });

  it("drops one floor above floor 2 and resets QiLayer", () => {
    expect(demoteCultivation(5, 1)).toEqual({ realmFloor: 4, qiLayer: 1 });
  });
});

describe("maxQiForRealm", () => {
  it("uses QiLayer caps on floor 1 and floor caps on floor 2+", () => {
    expect(maxQiForRealm(1, 1)).toBeLessThan(maxQiForRealm(1, 15));
    expect(maxQiForRealm(2, 1)).toBeGreaterThan(maxQiForRealm(1, 15));
    expect(maxQiForRealm(2, 99)).toBe(maxQiForRealm(2, 1));
  });
});

describe("realmDisplayName", () => {
  it("shows layer on floor 1", () => {
    expect(realmDisplayName(1, 7)).toBe("รวมลมปราณ · ชั้น 7");
  });

  it("shows catalog Thai name on floor 2+", () => {
    expect(realmDisplayName(2, 1)).toBe("สร้างฐานปราณ");
  });

  it("clamps invalid floors safely", () => {
    expect(realmDisplayName(0, 1)).toBe("รวมลมปราณ · ชั้น 1");
    expect(realmDisplayName(99, 1)).toBe("ย่ำสวรรค์");
  });
});

describe("effectiveCombatTier", () => {
  it("maps floor 1 progress through QiLayer and caps legacy combat at seven", () => {
    expect(effectiveCombatTier(1, 1)).toBe(1);
    expect(effectiveCombatTier(1, QI_LAYER_MAX)).toBe(7);
    expect(effectiveCombatTier(8, 1)).toBe(7);
    expect(effectiveCombatTier(25, 1)).toBe(7);
  });
});

describe("early demo pacing", () => {
  it("keeps legacy thresholds for floors 2–7", () => {
    expect(realmPromotionThreshold(2)).toBe(80);
    expect(realmPromotionThreshold(7)).toBe(580);
  });
});

describe("clampRealmFloor", () => {
  it("keeps floors within catalog bounds", () => {
    expect(clampRealmFloor(-3)).toBe(1);
    expect(clampRealmFloor(12)).toBe(12);
    expect(clampRealmFloor(100)).toBe(CULTIVATION_FLOOR_MAX);
  });
});
