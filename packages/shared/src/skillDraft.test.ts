import { describe, expect, it } from "vitest";
import {
  applySkillPick,
  playerIgnoresIncomingDamage,
  rollSkillDraft,
  shouldOpenSkillDraft,
  validateSkillPick,
} from "./skillDraft.js";

describe("rollSkillDraft", () => {
  it("returns three unowned ids from the pool when enough remain", () => {
    const pool = ["a", "b", "c", "d", "e"];
    const owned = ["a"];
    let i = 0;
    const rng = () => {
      const seq = [0.1, 0.2, 0.3];
      return seq[i++] ?? 0;
    };
    const offers = rollSkillDraft(pool, owned, rng);
    expect(offers).toHaveLength(3);
    expect(new Set(offers).size).toBe(3);
    for (const id of offers) {
      expect(owned).not.toContain(id);
      expect(pool).toContain(id);
    }
  });

  it("returns all remaining unowned when fewer than three", () => {
    const offers = rollSkillDraft(["x", "y"], ["x"], () => 0);
    expect(offers).toEqual(["y"]);
  });

  it("returns empty when nothing left to offer", () => {
    expect(rollSkillDraft(["only"], ["only"], () => 0)).toEqual([]);
  });
});

describe("validateSkillPick", () => {
  it("accepts id in current offers only", () => {
    expect(validateSkillPick("b", ["a", "b", "c"])).toBe(true);
    expect(validateSkillPick("z", ["a", "b", "c"])).toBe(false);
  });
});

describe("applySkillPick", () => {
  it("appends pick and clears draft state", () => {
    const next = applySkillPick({
      ownedSkillIds: ["rf01_s01"],
      draftOfferIds: ["rf02_s02", "rf02_s03", "rf02_s04"],
      lastActiveSkillId: "",
      skillId: "rf02_s03",
      skillKind: "active",
    });
    expect(next.ownedSkillIds).toEqual(["rf01_s01", "rf02_s03"]);
    expect(next.awaitingSkillDraft).toBe(false);
    expect(next.draftOfferIds).toEqual([]);
    expect(next.lastActiveSkillId).toBe("rf02_s03");
  });

  it("does not set last active for passive-only pick", () => {
    const next = applySkillPick({
      ownedSkillIds: [],
      draftOfferIds: ["rf02_s05"],
      lastActiveSkillId: "rf01_s01",
      skillId: "rf02_s05",
      skillKind: "passive",
    });
    expect(next.lastActiveSkillId).toBe("rf01_s01");
  });
});

describe("playerIgnoresIncomingDamage", () => {
  it("is true while awaiting SkillDraft", () => {
    expect(playerIgnoresIncomingDamage(true)).toBe(true);
    expect(playerIgnoresIncomingDamage(false)).toBe(false);
  });
});

describe("shouldOpenSkillDraft", () => {
  it("opens on realm floor increase not qi layer alone", () => {
    expect(shouldOpenSkillDraft(1, 2)).toBe(true);
    expect(shouldOpenSkillDraft(2, 2)).toBe(false);
    expect(shouldOpenSkillDraft(2, 3)).toBe(true);
  });
});
