import "./colyseus018JoinPatch.js";
import { Client, Room } from "colyseus.js";
import { XianState } from "@xian/shared";
import { matchmakeBase } from "./serverUrl.js";

/** Matchmake via fetch (proxy in dev) then join with schema decoder. */
export async function joinXianRoom(
  client: Client,
  serverUrl: string,
  name: string,
): Promise<Room<XianState>> {
  const base = matchmakeBase(serverUrl);
  let res: Response;
  try {
    res = await fetch(`${base}/matchmake/joinOrCreate/xian`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  } catch {
    throw new Error(
      "เชื่อม HTTP ไม่ได้ — ตรวจว่า server รันอยู่ (pnpm dev ต้องเห็น Colyseus listening)",
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

  return (client as ClientWithSeat).consumeSeatReservation(seat, XianState);
}
