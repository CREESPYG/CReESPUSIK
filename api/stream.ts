import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);
    // Support /api/stream/:id/audio, /api/stream?id=:id, or req.query.id
    const videoId = req.query?.id || url.searchParams.get("id") || parts[2] || parts[1] || "";

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
    });

    if (!ytRes.ok) {
      res.statusCode = ytRes.status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `YouTube responded with ${ytRes.status}` }));
      return;
    }

    const data: any = await ytRes.json();
    const formats = [
      ...(data.streamingData?.adaptiveFormats ?? []),
      ...(data.streamingData?.formats ?? []),
    ];

    const audioFormats = formats
      .filter((f: any) => typeof f.mimeType === "string" && f.mimeType.startsWith("audio/"))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    const selected = audioFormats[0];
    if (!selected || !selected.url) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "No audio stream format found" }));
      return;
    }

    const upstreamHeaders: Record<string, string> = {
      "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
    };
    if (req.headers.range) {
      upstreamHeaders["Range"] = req.headers.range;
    }

    const audioRes = await fetch(selected.url, {
      headers: upstreamHeaders,
    });

    res.statusCode = audioRes.status;
    const passHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ];

    for (const h of passHeaders) {
      const val = audioRes.headers.get(h);
      if (val) res.setHeader(h, val);
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (!audioRes.body) {
      res.end();
      return;
    }

    const reader = audioRes.body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          if (value) {
            res.write(Buffer.from(value));
          }
        }
      } catch (streamErr) {
        if (!res.writableEnded) res.end();
      }
    };

    await pump();
  } catch (err: any) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Internal streaming error" }));
    }
  }
}
