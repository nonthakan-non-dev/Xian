const STORAGE_KEY = "xian-server-url";

export function normalizeServerUrl(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

/** Suggested default when nothing stored (LAN-friendly from page hostname). */
export function getDefaultServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return normalizeServerUrl(import.meta.env.VITE_SERVER_URL);
  }
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:2567";
  }
  return `http://${hostname}:2567`;
}

export function loadStoredServerUrl(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) return normalizeServerUrl(v);
  } catch {
    /* private mode */
  }
  return null;
}

export function saveServerUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, normalizeServerUrl(url));
  } catch {
    /* ignore */
  }
}

export function resolveServerUrl(override?: string): string {
  if (override?.trim()) return normalizeServerUrl(override);
  const stored = loadStoredServerUrl();
  if (stored) return stored;
  return getDefaultServerUrl();
}

/** Desktop localhost dev: matchmake via Vite proxy; WS still uses serverUrl. */
export function useViteMatchmakeProxy(serverUrl: string): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_SERVER_URL) return false;
  if (!import.meta.env.DEV) return false;
  const { hostname } = window.location;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return false;
  const u = normalizeServerUrl(serverUrl);
  return u === "http://localhost:2567" || u === "http://127.0.0.1:2567";
}

export function matchmakeBase(serverUrl: string): string {
  if (useViteMatchmakeProxy(serverUrl)) {
    return window.location.origin;
  }
  return normalizeServerUrl(serverUrl);
}
