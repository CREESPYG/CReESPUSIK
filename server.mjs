import { createServer } from "node:http";
import { existsSync, statSync, createReadStream, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_DIR = join(__dirname, "dist");
const PORT = Number(process.env.PORT || 3000);

const MIMES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".apk": "application/vnd.android.package-archive",
  ".webmanifest": "application/manifest+json",
};

// Handlers cache
let searchHandler, streamHandler, suggestHandler, genresHandler, radioHandler;

async function getHandlers() {
  if (!searchHandler) {
    const [s, st, sg, g, r] = await Promise.all([
      import("./api/search.ts"),
      import("./api/stream/[id]/audio.ts"),
      import("./api/suggest.ts"),
      import("./api/genres.ts"),
      import("./api/radio/[id].ts"),
    ]);
    searchHandler = s.default;
    streamHandler = st.default;
    suggestHandler = sg.default;
    genresHandler = g.default;
    radioHandler = r.default;
  }
  return { searchHandler, streamHandler, suggestHandler, genresHandler, radioHandler };
}

function serveStatic(filePath, req, res) {
  try {
    const stats = statSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIMES[ext] || "application/octet-stream";

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (start >= stats.size) {
        res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
        return res.end();
      }

      const chunksize = end - start + 1;
      const file = createReadStream(filePath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        ...(ext === ".html" ? { "Cache-Control": "no-cache" } : { "Cache-Control": "public, max-age=31536000, immutable" }),
      });
      createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.statusCode = 500;
    res.end("Internal error serving asset");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // 1. API routes
  if (pathname.startsWith("/api/")) {
    try {
      const handlers = await getHandlers();

      if (pathname.startsWith("/api/stream/") && pathname.endsWith("/audio")) {
        return await handlers.streamHandler(req, res);
      }
      if (pathname === "/api/search") {
        return await handlers.searchHandler(req, res);
      }
      if (pathname === "/api/suggest") {
        return await handlers.suggestHandler(req, res);
      }
      if (pathname === "/api/genres") {
        return await handlers.genresHandler(req, res);
      }
      if (pathname.startsWith("/api/radio/")) {
        return await handlers.radioHandler(req, res);
      }

      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "API route not found" }));
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: err?.message || "Internal API error" }));
      }
      return;
    }
  }

  // 2. Static files from /dist
  const decodedPath = decodeURIComponent(pathname);
  let filePath = join(DIST_DIR, decodedPath);

  // If path is a file that exists
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return serveStatic(filePath, req, res);
  }

  // 3. Fallback to /dist/index.html (Single Page App routing)
  const indexHtml = join(DIST_DIR, "index.html");
  if (existsSync(indexHtml)) {
    return serveStatic(indexHtml, req, res);
  }

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CReEPUSIK Web server running on http://0.0.0.0:${PORT}`);
});
