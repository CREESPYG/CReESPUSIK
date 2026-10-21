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
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
          androidSdkVersion: 30,
          hl: "en",
          gl: "US",
        },
      },
    };

    const ytRes = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
        "x-goog-api-key": "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
        authorization: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
        "x-youtube-client-name": "3",
        "x-youtube-client-version": "20.10.38",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!ytRes.ok) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Upstream player API failed", code: "bot_check" }));
      return;
    }

    const data: any = await ytRes.json();
    const formats: any[] = [
      ...(data.streamingData?.adaptiveFormats ?? []),
      ...(data.streamingData?.formats ?? []),
    ].filter((f) => f.mimeType?.includes("audio") && typeof f.url === "string");

    // Pick itag 140 (AAC 128k - universally supported) first, else best m4a, else highest bitrate
    const byItag = formats.find((f) => f.itag === 140);
    const m4a = formats
      .filter((f) => String(f.mimeType).includes("mp4"))
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
    const best = byItag || m4a[0] || formats.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];

    if (!best?.url) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: data.playabilityStatus?.reason || "No audio stream format found",
          status: data.playabilityStatus?.status,
          code: "bot_check",
        })
      );
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
