import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import { XianRoom } from "./rooms/XianRoom.js";

function resolveListenPort(): number {
  const raw = process.env.PORT;
  if (raw !== undefined && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    console.warn(`[xian] invalid PORT=${JSON.stringify(raw)}, using fallback`);
  }
  return process.env.NODE_ENV === "production" ? 8080 : 2567;
}

const port = resolveListenPort();
const host = process.env.HOST ?? "0.0.0.0";
const clientDist = process.env.CLIENT_DIST?.trim();

const httpServer = createServer();

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
  express: (app) => {
    app.use(
      cors({
        origin: true,
        credentials: true,
      }),
    );
    app.get("/health", (_req, res) => res.json({ ok: true }));

    if (clientDist) {
      app.use(express.static(clientDist, { index: false }));
      app.get("/", (_req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
      });
    }
  },
});

gameServer.define("xian", XianRoom);

try {
  await gameServer.listen(port, host, undefined, (err?: Error) => {
    if (err) {
      console.error("[xian] listen callback error:", err);
      return;
    }
    console.log(
      `[xian] Colyseus listening on http://${host}:${port} (NODE_ENV=${process.env.NODE_ENV ?? "unset"}, PORT env=${process.env.PORT ?? "unset"})`,
    );
  });
} catch (err) {
  console.error("[xian] failed to start:", err);
  process.exit(1);
}
