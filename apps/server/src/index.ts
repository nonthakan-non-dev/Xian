import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import { XianRoom } from "./rooms/XianRoom.js";

const port = Number(process.env.PORT ?? 2567);
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

await gameServer.listen(port, host, undefined, () => {
  console.log(`[xian] Colyseus listening on http://${host}:${port}`);
});
