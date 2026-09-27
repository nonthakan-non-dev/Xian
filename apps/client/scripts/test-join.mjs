import "../src/colyseus018JoinPatch.ts";
import { Client } from "colyseus.js";
import { XianState } from "@xian/shared";

const res = await fetch(
  "http://127.0.0.1:2567/matchmake/joinOrCreate/xian",
  {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "test" }),
  },
);
const data = await res.json();
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
};
const client = new Client("http://127.0.0.1:2567");
const room = await client.consumeSeatReservation(seat, XianState);
console.log(
  "joined",
  room.sessionId,
  "players",
  room.state.players.size,
  "orbs",
  room.state.orbs.size,
);
await room.leave();
console.log("ok");
