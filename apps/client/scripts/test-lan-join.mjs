import "../src/colyseus018JoinPatch.js";
import { Client } from "colyseus.js";
import { XianState } from "@xian/shared";

const LAN = process.env.LAN ?? "10.0.2.98";
const serverUrl = `http://${LAN}:2567`;
const origin = `http://${LAN}:5173`;

async function main() {
  const res = await fetch(`${origin}/matchmake/joinOrCreate/xian`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "lan-test" }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("matchmake fail", data);
    process.exit(1);
  }
  const roomPayload = data.room ?? {
    name: data.name,
    roomId: data.roomId,
    processId: data.processId,
  };
  const seat = {
    sessionId: String(data.sessionId),
    room: {
      name: String(roomPayload.name),
      roomId: String(roomPayload.roomId),
      processId: String(roomPayload.processId),
    },
    protocol: data.protocol,
  };
  console.log("matchmake ok", seat.room.processId, seat.room.roomId);
  const client = new Client(serverUrl);
  const room = await client.consumeSeatReservation(seat, XianState);
  console.log("joined", room.sessionId);
  await room.leave();
  console.log("OK");
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});
