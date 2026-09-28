import { describe, expect, it } from "vitest";
import {
  matchmakeBase,
  normalizeServerUrl,
} from "./serverUrl.js";

describe("normalizeServerUrl", () => {
  it("trims and strips trailing slash", () => {
    expect(normalizeServerUrl("  http://localhost:2567/  ")).toBe(
      "http://localhost:2567",
    );
  });
});

describe("matchmakeBase", () => {
  it("returns normalized server url when not using proxy", () => {
    expect(matchmakeBase("http://192.168.1.10:2567/")).toBe(
      "http://192.168.1.10:2567",
    );
  });
});
