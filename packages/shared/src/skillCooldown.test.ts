import { describe, expect, it } from "vitest";
import {
  isSkillOnCooldown,
  skillCooldownRemainingMs,
} from "./skillCooldown.js";

describe("skillCooldown", () => {
  it("remaining decreases with time", () => {
    expect(skillCooldownRemainingMs(1000, 0, 2800)).toBe(0);
    expect(skillCooldownRemainingMs(2000, 1000, 2800)).toBe(1800);
    expect(skillCooldownRemainingMs(4000, 1000, 2800)).toBe(0);
  });

  it("isSkillOnCooldown", () => {
    expect(isSkillOnCooldown(1500, 1000, 2800)).toBe(true);
    expect(isSkillOnCooldown(4000, 1000, 2800)).toBe(false);
  });
});
