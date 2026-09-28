import { describe, expect, it } from "vitest";
import {
  JOIN_FETCH_TIMEOUT_MS,
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

describe("JOIN_FETCH_TIMEOUT_MS", () => {
  it("is a short LAN-friendly timeout", () => {
    expect(JOIN_FETCH_TIMEOUT_MS).toBeGreaterThanOrEqual(5_000);
    expect(JOIN_FETCH_TIMEOUT_MS).toBeLessThanOrEqual(15_000);
  });
});

describe("matchmakeBase", () => {
  it("returns normalized server url when not using proxy", () => {
    expect(matchmakeBase("http://192.168.1.10:2567/")).toBe(
      "http://192.168.1.10:2567",
    );
  });
});
