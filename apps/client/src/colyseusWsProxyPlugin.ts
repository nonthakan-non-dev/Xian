import type { Server } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { Plugin } from "vite";
import httpProxy from "http-proxy";

const COLYSEUS_ROOM_PATH = /^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/;

function attachColyseusWsProxy(
  httpServer: Server | null | undefined,
  target: string,
) {
  if (!httpServer) return;
  const proxy = httpProxy.createProxyServer({
    target,
    ws: true,
    changeOrigin: true,
  });

  httpServer.on(
    "upgrade",
    (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const pathOnly = (req.url ?? "").split("?")[0];
      if (!COLYSEUS_ROOM_PATH.test(pathOnly)) {
        return;
      }
      proxy.ws(req, socket, head);
    },
  );
}

/** Vite `proxy.ws` + regex ไม่ relay Colyseus room WS — ใช้ upgrade hook แทน */
export function colyseusWsProxyPlugin(
  target = "http://127.0.0.1:2567",
): Plugin {
  return {
    name: "xian-colyseus-ws-proxy",
    configureServer(server) {
      attachColyseusWsProxy(server.httpServer as Server | null, target);
    },
    configurePreviewServer(server) {
      attachColyseusWsProxy(server.httpServer as Server, target);
    },
  };
}
