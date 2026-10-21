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
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20231204.01.00",
          hl: "en",
          gl: "US",
        },
      },
      videoId,
      playlistId: "RDAMVM" + videoId,
      enablePersistentPlaylistPanel: true,
      isAudioOnly: true,
    };

    const nextRes = await fetch("https://music.youtube.com/youtubei/v1/next?prettyPrint=false", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://music.youtube.com/",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const tracks: Track[] = [];
    const seen = new Set<string>([videoId]);

    if (nextRes.ok) {
      const data: any = await nextRes.json();
      const tabs = data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
      const tab = tabs?.find((t: any) => {
        const title = t.tabRenderer?.title;
        const str = typeof title === "string" ? title : title?.runs?.[0]?.text;
        return str?.toLowerCase?.()?.includes("up next");
      }) || tabs?.[0];
      const items = tab?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];

      for (const item of items) {
        const r = item.playlistPanelVideoRenderer;
        if (!r || !r.videoId || seen.has(r.videoId)) continue;
        seen.add(r.videoId);

        const title = r.title?.runs?.[0]?.text || "Unknown Track";
        const artist = r.shortBylineText?.runs?.[0]?.text || "Unknown Artist";
        const durationStr = r.lengthText?.runs?.[0]?.text;
        const duration = parseDuration(durationStr);

        tracks.push({
          id: r.videoId,
          title,
          artist,
          duration,
          thumb: `https://i.ytimg.com/vi/${r.videoId}/default.jpg`,
          art: `https://i.ytimg.com/vi/${r.videoId}/hq720.jpg`,
          kind: "song",
        });
        if (tracks.length >= 50) break;
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
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
