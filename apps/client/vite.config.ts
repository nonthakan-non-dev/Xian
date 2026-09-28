import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const clientDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon.svg"],
      manifest: {
        name: "仙 Xian IO",
        short_name: "Xian IO",
        description: "เกม .io เทพเซียน — multiplayer บนเว็บ",
        theme_color: "#0a0f14",
        background_color: "#0a0f14",
        display: "standalone",
        lang: "th",
        start_url: "/",
        icons: [
          {
            src: "pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
    host: true,
    port: 5173,
    proxy: {
      "/matchmake": {
        target: "http://127.0.0.1:2567",
        changeOrigin: true,
      },
    },
  },
});
