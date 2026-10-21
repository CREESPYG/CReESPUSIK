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
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);
    const videoId = req.query?.id || parts[2] || url.searchParams.get("id") || "";

    if (!videoId) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ tracks: [] }));
      return;
    }

    const payload = {
      videoId,
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
          hl: "en",
          gl: "US",
        },
      },
    };

    const nextRes = await fetch("https://www.youtube.com/youtubei/v1/next?prettyPrint=false", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
        "x-goog-api-key": "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const tracks: Track[] = [];
    const seen = new Set<string>([videoId]);

    if (nextRes.ok) {
      const data: any = await nextRes.json();
      const items =
        data.contents?.singleColumnWatchNextResults?.results?.results?.contents ||
        data.contents?.sectionListRenderer?.contents ||
        [];

      for (const item of items) {
        const v =
          item.itemSectionRenderer?.contents?.[0]?.compactVideoRenderer ||
          item.compactVideoRenderer ||
          item.videoRenderer;
        if (!v?.videoId || seen.has(v.videoId)) continue;
        seen.add(v.videoId);

        tracks.push({
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || "Untitled",
          artist: v.shortBylineText?.runs?.[0]?.text || "",
          duration: parseDuration(v.lengthText?.runs?.[0]?.text || v.lengthText?.simpleText),
          thumb: v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
          art: `https://i.ytimg.com/vi/${v.videoId}/hq720.jpg`,
          kind: "song",
        });
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.end(JSON.stringify({ tracks }));
  } catch {
    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ tracks: [] }));
    }
  }
}
