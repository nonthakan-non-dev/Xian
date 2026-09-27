import { schema, t, type SchemaType } from "@colyseus/schema";

export const Player = schema(
  {
    sessionId: t.string(),
    name: t.string(),
    x: t.number(),
    y: t.number(),
    currentQi: t.number(),
    realmFloor: t.number(),
    inputX: t.number(),
    inputY: t.number(),
    vassana: t.number(),
  },
  "Player",
);
export type Player = SchemaType<typeof Player>;

export const Orb = schema(
  {
    id: t.string(),
    x: t.number(),
    y: t.number(),
    value: t.number(),
  },
  "Orb",
);
export type Orb = SchemaType<typeof Orb>;

export const Demon = schema(
  {
    id: t.string(),
    x: t.number(),
    y: t.number(),
    currentQi: t.number(),
    kind: t.string(),
    zoneId: t.string(),
  },
  "Demon",
);
export type Demon = SchemaType<typeof Demon>;

export const XianState = schema(
  {
    players: t.map(Player),
    orbs: t.map(Orb),
    demons: t.map(Demon),
  },
  "XianState",
);
export type XianState = SchemaType<typeof XianState>;
