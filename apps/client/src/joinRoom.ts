import "./colyseus018JoinPatch.js";
import { Client, Room } from "colyseus.js";
import { XianState } from "@xian/shared";
import { matchmakeBase, probeServerHealth } from "./serverUrl.js";

/** Matchmake via fetch (proxy in dev) then join with schema decoder. */
export async function joinXianRoom(
  client: Client,
  serverUrl: string,
  name: string,
): Promise<Room<XianState>> {
  await probeServerHealth(serverUrl);

  const base = matchmakeBase(serverUrl);
  let res: Response;
  try {
    res = await fetch(`${base}/matchmake/joinOrCreate/xian`, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  } catch {
    throw new Error(
      `matchmake ไม่ถึง ${base} — ถ้าเป็นมือถือ/LAN ให้เปิด client ที่ http://<IP-PC>:5173 และใส่เซิร์ver http://<IP-PC>:2567 (จะ relay ผ่าน Vite ในโหมด dev)`,
    );
  }

  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`matchmake ตอบไม่ใช่ JSON (${res.status}): ${raw.slice(0, 80)}`);
  }

  if (!res.ok || data.error) {
    throw new Error(String(data.error ?? `matchmake HTTP ${res.status}`));
  }

  // 0.15: { room: {...}, sessionId }; 0.18 flat — normalize for colyseus.js
  const roomPayload =
    (data.room as Record<string, unknown>) ??
    ({
      name: data.name,
      roomId: data.roomId,
      processId: data.processId,
    } as Record<string, unknown>);

  const seat = {
    sessionId: String(data.sessionId),
    room: {
      name: String(roomPayload.name),
      roomId: String(roomPayload.roomId),
      processId: String(roomPayload.processId),
    },
    protocol: data.protocol as string | undefined,
  };

  type ClientWithSeat = Client & {
    consumeSeatReservation: (
      response: typeof seat,
      rootSchema: typeof XianState,
    ) => Promise<Room<XianState>>;
  };

  try {
    return await (client as ClientWithSeat).consumeSeatReservation(
      seat,
      XianState,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `WebSocket เข้าห้องไม่สำเร็จ (${msg}) — ตรวจว่า URL เซิร์ver ตรง IP ของเครื่องที่รัน Colyseus`,
    );
  }
}
