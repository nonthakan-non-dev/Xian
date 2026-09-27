import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const clientDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    dedupe: ["@colyseus/schema"],
    alias: {
      "@colyseus/schema": path.resolve(
        clientDir,
        "node_modules/@colyseus/schema",
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/matchmake": {
        target: "http://127.0.0.1:2567",
        changeOrigin: true,
      },
    },
  },
});
