import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const q = req.query?.q || url.searchParams.get("q") || "";

    if (!q.trim()) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ suggestions: [] }));
      return;
    }

    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q.trim())}`;
    const suggestRes = await fetch(suggestUrl, {
      signal: AbortSignal.timeout(5000),
    });

    let suggestions: string[] = [];
    if (suggestRes.ok) {
      const data: any = await suggestRes.json();
      if (Array.isArray(data[1])) {
        suggestions = data[1].filter((s: any) => typeof s === "string").slice(0, 8);
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.end(JSON.stringify({ suggestions }));
  } catch {
    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ suggestions: [] }));
    }
  }
}
