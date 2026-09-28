const STORAGE_KEY = "xian-server-url";

/** LAN/mobile: fail fast instead of browser TCP hang. */
export const JOIN_FETCH_TIMEOUT_MS = 8_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = JOIN_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      const sec = Math.round(timeoutMs / 1000);
      throw new Error(
        `หมดเวลา ${sec} วิ — ตรวจ URL เซิร์ver และว่ามือถือเข้า :2567 ได้ (อย่าใช้ localhost บนมือถือ)`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function normalizeServerUrl(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

function pageHostname(): string {
  if (typeof window === "undefined") return "localhost";
  return window.location.hostname;
}

function isLocalPageHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLocalServerHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Suggested default when nothing stored (LAN-friendly from page hostname). */
export function getDefaultServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return normalizeServerUrl(import.meta.env.VITE_SERVER_URL);
  }
  const hostname = pageHostname();
  if (isLocalPageHost(hostname)) {
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

/** อย่าใช้ localhost ใน localStorage เมื่อเปิด client จาก IP/LAN */
export function storedServerUrlForPage(): string | null {
  const stored = loadStoredServerUrl();
  if (!stored) return null;
  try {
    const u = new URL(stored);
    const page = pageHostname();
    if (!isLocalPageHost(page) && isLocalServerHost(u.hostname)) {
      return null;
    }
  } catch {
    return null;
  }
  return stored;
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
  const stored = storedServerUrlForPage();
  if (stored) return stored;
  return getDefaultServerUrl();
}

/** Desktop localhost dev: matchmake via Vite proxy; WebSocket ยังไป :2567 ตรง */
export function useViteMatchmakeProxy(serverUrl: string): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_SERVER_URL) return false;
  if (!import.meta.env.DEV) return false;
  if (!isLocalPageHost(pageHostname())) return false;
  const u = normalizeServerUrl(serverUrl);
  return u === "http://localhost:2567" || u === "http://127.0.0.1:2567";
}

export function matchmakeBase(serverUrl: string): string {
  if (useViteMatchmakeProxy(serverUrl)) {
    return window.location.origin;
  }
  return normalizeServerUrl(serverUrl);
}

/** Colyseus WebSocket ต้องต่อที่ game server — ไม่ใช่พอร์ต Vite */
export function colyseusClientUrl(serverUrl: string): string {
  return normalizeServerUrl(serverUrl);
}

export async function probeServerHealth(serverUrl: string): Promise<void> {
  const base = normalizeServerUrl(serverUrl);
  let res: Response;
  try {
    res = await fetchWithTimeout(`${base}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("หมดเวลา")) {
      throw e;
    }
    throw new Error(
      `เข้า ${base}/health ไม่ได้ — รัน pnpm dev ให้เห็น Colyseus listening; มือถือ/LAN ต้องเข้า IP นี้ได้ (macOS: System Settings → Firewall)`,
    );
  }
  if (!res.ok) {
    throw new Error(`health ตอบ HTTP ${res.status} จาก ${base}`);
  }
}
