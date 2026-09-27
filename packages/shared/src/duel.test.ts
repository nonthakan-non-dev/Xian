import { describe, expect, it } from "vitest";
import {
  isInDuelZone,
  isMutualChallenge,
  resolvePocketDuel,
  tryStartChallenge,
  DUEL_ZONES,
} from "./duel.js";
import { maxQiForRealm } from "./balance.js";

describe("tryStartChallenge", () => {
  it("rejects when either player is in DuelZone", () => {
    expect(
      tryStartChallenge({
        challengerInDuelZone: true,
        targetInDuelZone: false,
        challengerInPocket: false,
        targetInPocket: false,
      }).ok,
    ).toBe(false);
    const inZone = tryStartChallenge({
      challengerInDuelZone: false,
      targetInDuelZone: true,
      challengerInPocket: false,
      targetInPocket: false,
    });
    expect(inZone.ok).toBe(false);
    if (!inZone.ok) expect(inZone.reason).toBe("in_duel_zone");
  });

  it("rejects when in pocket duel", () => {
    const inPocket = tryStartChallenge({
      challengerInDuelZone: false,
      targetInDuelZone: false,
      challengerInPocket: true,
      targetInPocket: false,
    });
    expect(inPocket.ok).toBe(false);
    if (!inPocket.ok) expect(inPocket.reason).toBe("in_pocket");
  });

  it("allows challenge outside duel zone", () => {
    expect(
      tryStartChallenge({
        challengerInDuelZone: false,
        targetInDuelZone: false,
        challengerInPocket: false,
        targetInPocket: false,
      }).ok,
    ).toBe(true);
  });
});

describe("isMutualChallenge", () => {
  it("detects when target already challenged back", () => {
    expect(isMutualChallenge("a", "a")).toBe(true);
    expect(isMutualChallenge("a", "b")).toBe(false);
  });
});

describe("resolvePocketDuel", () => {
  it("transfers forty percent Qi and demotes realm floor", () => {
    const r = resolvePocketDuel({
      loserQiBeforeZero: 100,
      loserRealmFloor: 3,
      loserQiLayer: 1,
      winnerQi: 50,
      winnerRealmFloor: 3,
      winnerQiLayer: 1,
    });
    expect(r.transferAmount).toBe(40);
    expect(r.winnerQi).toBe(
      Math.min(maxQiForRealm(3), 50 + 40),
    );
    expect(r.loserRealmFloor).toBe(2);
    expect(r.loserQiLayer).toBe(1);
  });

  it("does not demote realm below one", () => {
    const r = resolvePocketDuel({
      loserQiBeforeZero: 30,
      loserRealmFloor: 1,
      loserQiLayer: 3,
      winnerQi: 20,
      winnerRealmFloor: 2,
      winnerQiLayer: 1,
    });
    expect(r.loserRealmFloor).toBe(1);
    expect(r.loserQiLayer).toBe(2);
    expect(r.transferAmount).toBe(12);
  });
});

describe("isInDuelZone", () => {
  it("detects center duel ring", () => {
    const z = DUEL_ZONES[0];
    expect(isInDuelZone(z.cx, z.cy)).toBe(true);
    expect(isInDuelZone(0, 0)).toBe(false);
  });
});
