import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "cors";
import { createServer } from "http";
import { XianRoom } from "./rooms/XianRoom.js";

const port = Number(process.env.PORT ?? 2567);
const host = process.env.HOST ?? "0.0.0.0";

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
  },
});

gameServer.define("xian", XianRoom);

await gameServer.listen(port, host, undefined, () => {
  console.log(`[xian] Colyseus listening on http://${host}:${port}`);
});
