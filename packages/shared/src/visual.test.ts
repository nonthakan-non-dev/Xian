import { describe, expect, it } from "vitest";
import {
  daoPathAccentColor,
  realmFillColor,
  playerBodyRadius,
} from "./visual.js";

describe("visual palette", () => {
  it("realmFillColor scales with floor", () => {
    expect(realmFillColor(1)).not.toBe(realmFillColor(4));
  });

  it("daoPathAccentColor differs per path", () => {
    expect(daoPathAccentColor("sword")).not.toBe(daoPathAccentColor("shadow"));
  });

  it("playerBodyRadius grows with realm", () => {
    expect(playerBodyRadius(3)).toBeGreaterThan(playerBodyRadius(1));
  });
});
