import type { IncomingMessage, ServerResponse } from "node:http";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumb: string;
  art: string;
  kind: "song" | "video";
}

function parseDuration(str?: string): number {
  if (!str) return 0;
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  return parts[0] || 0;
}

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const q = req.query?.q || url.searchParams.get("q") || "";
    const type = (req.query?.type || url.searchParams.get("type") || "song") as "song" | "video";

    if (!q.trim()) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing search query", tracks: [] }));
      return;
    }

    const payload = {
      query: q.trim(),
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

    const ytRes = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
        "x-goog-api-key": "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!ytRes.ok) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Upstream search failed", tracks: [] }));
      return;
    }

    const data: any = await ytRes.json();
    const tracks: Track[] = [];
    const seen = new Set<string>();

    const sections = data.contents?.sectionListRenderer?.contents || [];
    for (const sec of sections) {
      const items = sec.itemSectionRenderer?.contents || [];
      for (const it of items) {
        const v = it.videoRenderer || it.compactVideoRenderer;
        if (!v?.videoId || seen.has(v.videoId)) continue;
        seen.add(v.videoId);

        const title = v.title?.runs?.[0]?.text || "Untitled";
        const artist = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || "";
        const duration = parseDuration(v.lengthText?.runs?.[0]?.text || v.lengthText?.simpleText);
        const thumb = v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`;
        const art = `https://i.ytimg.com/vi/${v.videoId}/hq720.jpg`;

        tracks.push({
          id: v.videoId,
          title,
          artist,
          duration,
          thumb,
          art,
          kind: type,
        });
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.end(JSON.stringify({ tracks }));
  } catch (err: any) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Internal search error", tracks: [] }));
    }
  }
}
