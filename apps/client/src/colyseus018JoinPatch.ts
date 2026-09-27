/**
 * Colyseus 0.18 JOIN_ROOM adds a varint length before state reflection and
 * optional tagged sections. colyseus.js 0.16 reads reflection until EOF and
 * breaks handshake decoding.
 */
import { decode } from "@colyseus/schema";
import { Protocol, Room, SchemaSerializer } from "colyseus.js";

let applied = false;

export function applyColyseus018JoinPatch(): void {
  if (applied) return;
  applied = true;

  const original = Room.prototype["onMessageCallback"] as (
    this: Room,
    event: MessageEvent,
  ) => void;

  const PROTOCOL_CODE_MASK = 0x1f;

  Room.prototype["onMessageCallback"] = function (
    this: Room,
    event: MessageEvent,
  ) {
    const buffer = new Uint8Array(event.data as ArrayBuffer);
    const messageCode = buffer[0] & PROTOCOL_CODE_MASK;
    if (messageCode !== Protocol.JOIN_ROOM) {
      original.call(this, event);
      return;
    }

    const it = { offset: 1 };
    const reconnectionToken = decode.utf8Read(
      buffer,
      it,
      buffer[it.offset++],
    );
    this.serializerId = decode.utf8Read(buffer, it, buffer[it.offset++]);

    if (!this.serializer) {
      this.serializer = new SchemaSerializer();
    }

    const handshakeLength = decode.number(buffer, it);
    const handshakeEnd = it.offset + handshakeLength;
    if (
      handshakeLength > 0 &&
      this.serializer.handshake &&
      handshakeEnd <= buffer.byteLength
    ) {
      this.serializer.handshake(buffer, it);
      it.offset = handshakeEnd;
    }

    while (it.offset < buffer.byteLength) {
      it.offset++; // section tag
      const sectionLen = decode.number(buffer, it);
      it.offset += sectionLen;
    }

    this.reconnectionToken = `${this.roomId}:${reconnectionToken}`;
    this.hasJoined = true;
    this.onJoin.invoke();

    const ack = new Uint8Array(1);
    ack[0] = Protocol.JOIN_ROOM;
    this.connection.send(ack);
  };
}

applyColyseus018JoinPatch();
