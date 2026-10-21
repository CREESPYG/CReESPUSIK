import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);
    // Path: /api/stream/:id/audio
    const videoId = req.query?.id || parts[2] || url.searchParams.get("id") || "";

    if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid video id" }));
      return;
    }

    const payload = {
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
          androidSdkVersion: 34,
          hl: "en",
          gl: "US",
        },
      },
      videoId,
    };

    const ytRes = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14; US; Pixel 7 Pro) gzip",
        "x-goog-api-key": "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!ytRes.ok) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Upstream player API failed" }));
      return;
    }

    const data: any = await ytRes.json();
    const formats: any[] = [
      ...(data.streamingData?.adaptiveFormats ?? []),
      ...(data.streamingData?.formats ?? []),
    ].filter((f) => f.mimeType?.includes("audio") && typeof f.url === "string");

    const best = formats.sort(
      (a, b) =>
        Number(b.mimeType?.startsWith("audio/mp4")) - Number(a.mimeType?.startsWith("audio/mp4")) ||
        (b.bitrate ?? 0) - (a.bitrate ?? 0),
    )[0];

    if (!best?.url) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "No audio stream format found" }));
      return;
    }

    // Forward byte range if provided
    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const upstream = await fetch(best.url, { headers });
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", best.mimeType || "audio/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-store");

    for (const h of ["content-length", "content-range"]) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }

    if (upstream.body) {
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Internal stream error" }));
    }
  }
}
