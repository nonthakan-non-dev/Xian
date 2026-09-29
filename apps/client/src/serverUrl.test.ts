import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultServerUrl,
  JOIN_FETCH_TIMEOUT_MS,
  matchmakeBase,
  normalizeServerUrl,
  storedServerUrlForPage,
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

describe("getDefaultServerUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses same origin on localhost Docker (8080)", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "127.0.0.1",
        port: "8080",
        origin: "http://127.0.0.1:8080",
      },
    });
    expect(getDefaultServerUrl()).toBe("http://127.0.0.1:8080");
  });

  it("uses :2567 when Vite dev client is on 5173", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
        port: "5173",
        origin: "http://localhost:5173",
      },
    });
    expect(getDefaultServerUrl()).toBe("http://localhost:2567");
  });
});

describe("storedServerUrlForPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores dev :2567 URL when page is Docker on 8080", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    });
    store.set("xian-server-url", "http://localhost:2567");
    vi.stubGlobal("window", {
      location: {
        hostname: "127.0.0.1",
        port: "8080",
        origin: "http://127.0.0.1:8080",
      },
    });
    expect(storedServerUrlForPage()).toBeNull();
  });
});
