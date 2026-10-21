import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

/**
 * Dev middleware to serve /api routes locally using the same handlers that run on Vercel.
 */
function apiDevServer(): Plugin {
  return {
    name: "creepusik-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        try {
          const url = new URL(req.url, "http://localhost");
          const pathname = url.pathname;

          if (pathname === "/api/stream" || (pathname.startsWith("/api/stream/") && pathname.endsWith("/audio"))) {
            const { default: handler } = await import("./api/stream");
            return await handler(req as any, res as any);
          }
          if (pathname === "/api/search") {
            const { default: handler } = await import("./api/search");
            return await handler(req as any, res as any);
          }
          if (pathname === "/api/suggest") {
            const { default: handler } = await import("./api/suggest");
            return await handler(req as any, res as any);
          }
          if (pathname === "/api/genres") {
            const { default: handler } = await import("./api/genres");
            return await handler(req as any, res as any);
          }
          if (pathname === "/api/radio" || pathname.startsWith("/api/radio/")) {
            const { default: handler } = await import("./api/radio");
            return await handler(req as any, res as any);
          }
        } catch (err: any) {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err?.message || "Internal API dev error" }));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    define: { __APP_VERSION__: JSON.stringify(version) },
    plugins: [
      react(),
      tailwindcss(),
      apiDevServer(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "CReEPUSIK",
          short_name: "CReEPUSIK",
          description: "Your music, uninterrupted.",
          lang: "en",
          theme_color: "#0B0C0F",
          background_color: "#0B0C0F",
          display: "standalone",
          start_url: "/",
          icons: [
            { src: "icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api\//, /^\/downloads\//],
          runtimeCaching: [
            {
              // Artwork only. Streams and API responses are never cached by the service worker.
              urlPattern: ({ url }) => /(^|\.)ytimg\.com$|googleusercontent\.com$|ggpht\.com$/.test(url.hostname),
              handler: "CacheFirst",
              options: {
                cacheName: "artwork",
                expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  };
});
