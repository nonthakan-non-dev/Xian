/** Ordered RealmFloor ladder — shared by UI, balance, and skill pools. */

export type CultivationFloorKind = "cultivation" | "transition";

export type CultivationMajorStep =
  | "ningqi"
  | "foundation"
  | "core"
  | "embryo"
  | "nascent"
  | "transform"
  | "immortal"
  | "ascendant"
  | "yin"
  | "yang"
  | "nirvanaGlimpse"
  | "nirvanaPurify"
  | "nirvanaShatter"
  | "fiveDecay"
  | "voidNirvana"
  | "voidSpirit"
  | "voidProfound"
  | "mysticTribulation"
  | "voidAeon"
  | "goldenSovereign"
  | "heavenlyVenerable"
  | "lunarVenerable"
  | "grandVenerable"
  | "nineBridges"
  | "heavenTread";

export interface CultivationFloorDef {
  floor: number;
  nameTh: string;
  nameZh: string;
  majorStep: CultivationMajorStep;
  kind: CultivationFloorKind;
}

export const CULTIVATION_FLOOR_MAX = 25;
export const QI_LAYER_MAX = 15;

export const CULTIVATION_CATALOG: readonly CultivationFloorDef[] = [
  { floor: 1, nameTh: "รวมลมปราณ", nameZh: "凝气", majorStep: "ningqi", kind: "cultivation" },
  { floor: 2, nameTh: "สร้างฐานปราณ", nameZh: "筑基", majorStep: "foundation", kind: "cultivation" },
  { floor: 3, nameTh: "จินตาน", nameZh: "金丹", majorStep: "core", kind: "cultivation" },
  { floor: 4, nameTh: "หล่อร่างทารก", nameZh: "结婴", majorStep: "embryo", kind: "cultivation" },
  { floor: 5, nameTh: "วิญญาณก่อกำเนิด", nameZh: "元婴", majorStep: "nascent", kind: "cultivation" },
  { floor: 6, nameTh: "แปลงวิญญาณ", nameZh: "化神", majorStep: "transform", kind: "cultivation" },
  { floor: 7, nameTh: "ปราณเซียน", nameZh: "炼虚", majorStep: "immortal", kind: "cultivation" },
  { floor: 8, nameTh: "ถามเต๋า", nameZh: "问鼎", majorStep: "ascendant", kind: "cultivation" },
  { floor: 9, nameTh: "หยินเสื่อมถาวร", nameZh: "阴虚", majorStep: "yin", kind: "transition" },
  { floor: 10, nameTh: "หยางแท้", nameZh: "阳实", majorStep: "yang", kind: "transition" },
  { floor: 11, nameTh: "ส่องนิพพาน", nameZh: "窥涅", majorStep: "nirvanaGlimpse", kind: "cultivation" },
  { floor: 12, nameTh: "ชำระนิพพาน", nameZh: "净涅", majorStep: "nirvanaPurify", kind: "cultivation" },
  { floor: 13, nameTh: "สลายนิพพาน", nameZh: "碎涅", majorStep: "nirvanaShatter", kind: "cultivation" },
  { floor: 14, nameTh: "ห้าเสื่อมถาวร", nameZh: "天人五衰", majorStep: "fiveDecay", kind: "transition" },
  { floor: 15, nameTh: "สุญญนิพพาน", nameZh: "空涅", majorStep: "voidNirvana", kind: "cultivation" },
  { floor: 16, nameTh: "สุญญวิญญาณ", nameZh: "空晶", majorStep: "voidSpirit", kind: "cultivation" },
  { floor: 17, nameTh: "สุญญว่างลึก", nameZh: "空灵", majorStep: "voidProfound", kind: "cultivation" },
  { floor: 18, nameTh: "เคราะห์ลับเร้n", nameZh: "玄劫", majorStep: "mysticTribulation", kind: "transition" },
  { floor: 19, nameTh: "สุญญกัลป์", nameZh: "空劫", majorStep: "voidAeon", kind: "cultivation" },
  { floor: 20, nameTh: "เจ้าทองคำ", nameZh: "金尊", majorStep: "goldenSovereign", kind: "transition" },
  { floor: 21, nameTh: "บรมเทวะ", nameZh: "天尊", majorStep: "heavenlyVenerable", kind: "cultivation" },
  { floor: 22, nameTh: "บรมเทวะจันทร์", nameZh: "月天尊", majorStep: "lunarVenerable", kind: "cultivation" },
  { floor: 23, nameTh: "มหาเทพบรม", nameZh: "大天尊", majorStep: "grandVenerable", kind: "cultivation" },
  { floor: 24, nameTh: "สะพานเก้าสู่สวรรค์", nameZh: "踏天九桥", majorStep: "nineBridges", kind: "transition" },
  { floor: 25, nameTh: "ย่ำสวรรค์", nameZh: "踏天", majorStep: "heavenTread", kind: "cultivation" },
] as const;

export function cultivationFloorDef(floor: number): CultivationFloorDef {
  const idx = Math.max(0, Math.min(CULTIVATION_CATALOG.length - 1, floor - 1));
  return CULTIVATION_CATALOG[idx]!;
}

export function effectiveStatTier(
  realmFloor: number,
  qiLayer: number,
): number {
  const floor = Math.max(
    1,
    Math.min(CULTIVATION_FLOOR_MAX, Math.floor(realmFloor)),
  );
  if (floor === 1) {
    return Math.max(1, Math.min(QI_LAYER_MAX, Math.floor(qiLayer)));
  }
  return floor;
}
