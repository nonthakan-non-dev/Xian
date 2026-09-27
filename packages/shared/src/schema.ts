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
    daoPath: t.string(),
    awaitingPathChoice: t.boolean(),
    poisonStacks: t.number(),
    overloadStacks: t.number(),
    stunUntil: t.number(),
    slowUntil: t.number(),
    shieldUntil: t.number(),
    herbBuffUntil: t.number(),
    lastDamagedAt: t.number(),
    inPocketDuel: t.boolean(),
    pocketOpponentId: t.string(),
    returnX: t.number(),
    returnY: t.number(),
    challengeTo: t.string(),
    challengeFrom: t.string(),
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
    poisonStacks: t.number(),
  },
  "Demon",
);

export const Herb = schema(
  {
    id: t.string(),
    x: t.number(),
    y: t.number(),
  },
  "Herb",
);
export type Herb = SchemaType<typeof Herb>;
export type Demon = SchemaType<typeof Demon>;

export const XianState = schema(
  {
    players: t.map(Player),
    orbs: t.map(Orb),
    demons: t.map(Demon),
    herbs: t.map(Herb),
  },
  "XianState",
);
export type XianState = SchemaType<typeof XianState>;
