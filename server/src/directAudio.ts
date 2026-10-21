import type { Lang } from "./i18n.js";
import { text, withClient } from "./search.js";

/**
 * A track's audio asked straight from YouTube's API, without yt-dlp. The Android app plays it this way, and the
 * server falls back to it when yt-dlp fails (YouTube's bot check on some connections, an outdated yt-dlp).
 */

export const DEFAULT_CLIENTS = ["ANDROID", "VISIONOS"];
const REMOTE_CONFIG = "https://raw.githubusercontent.com/Ernani1234/musike/main/mobile/streaming.json";

export interface DirectAudio {
  url: string;
  mime: string;
  title: string;
  duration: number;
  /** When the URL stops working (ms). */
  expiresAt: number;
}

export const validClients = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length > 0 && v.every((c) => typeof c === "string" && /^[A-Z_]{2,30}$/.test(c)) ? (v as string[]) : null;

/**
 * The client list published in the repository, or null when it can't be read.
 */
export async function fetchRemoteClients(key: "clients" | "ios" = "clients"): Promise<string[] | null> {
  try {
    const res = await fetch(REMOTE_CONFIG, { signal: AbortSignal.timeout(6000) });
    return validClients(((await res.json()) as Record<string, unknown>)[key]);
  } catch {
    return null; // offline or no config: keep what we have
  }
}

/** Directly queries YouTube's Innertube API using the Android client with Google API key.
 * Completely avoids bot checks and IP restrictions on servers, Vercel, and devices.
 */
export async function fetchAndroidDirectAudio(id: string): Promise<DirectAudio | null> {
  try {
    const payload = {
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '20.10.38',
          androidSdkVersion: 34,
          hl: 'en',
          gl: 'US'
        }
      },
      videoId: id
    };
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14; US; Pixel 7 Pro) gzip',
        'x-goog-api-key': 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data.playabilityStatus?.status !== 'OK') return null;

    const formats: any[] = [
      ...(data.streamingData?.adaptiveFormats ?? []),
      ...(data.streamingData?.formats ?? [])
    ].filter((f) => f.mimeType?.includes('audio') && typeof f.url === 'string');

    // AAC (m4a) first: it plays everywhere. Highest bitrate within the same kind.
    const best = formats.sort(
      (a, b) =>
        Number(b.mimeType?.startsWith('audio/mp4')) - Number(a.mimeType?.startsWith('audio/mp4')) ||
        (b.bitrate ?? 0) - (a.bitrate ?? 0)
    )[0];
    if (!best?.url) return null;

    const expire = Number(new URL(best.url).searchParams.get('expire')) * 1000;
    return {
      url: best.url,
      mime: best.mimeType?.startsWith('audio/webm') ? 'audio/webm' : 'audio/mp4',
      title: data.videoDetails?.title ?? '',
      duration: Number(data.videoDetails?.lengthSeconds) || 0,
      expiresAt: expire || Date.now() + 3 * 3600_000
    };
  } catch {
    return null;
  }
}

/** Tries Android direct query first, then each client in turn. */
export async function directAudio(id: string, clients: string[], lang?: Lang): Promise<DirectAudio> {
  const direct = await fetchAndroidDirectAudio(id);
  if (direct) return direct;

  let reason = "";
  for (const client of clients) {
    try {
      const info: any = await withClient((yt) => yt.getBasicInfo(id, { client: client as never }), lang);
      const status = info.playability_status;
      if (status?.status && status.status !== "OK") {
        reason = text(status.reason) || reason;
        continue;
      }
      const formats: any[] = [...(info.streaming_data?.adaptive_formats ?? []), ...(info.streaming_data?.formats ?? [])].filter(
        (f) => f.has_audio && !f.has_video && typeof f.url === "string",
      );
      const best = formats.sort(
        (a, b) => Number(b.mime_type?.startsWith("audio/mp4")) - Number(a.mime_type?.startsWith("audio/mp4")) || (b.bitrate ?? 0) - (a.bitrate ?? 0),
      )[0];
      if (!best) continue;
      const expire = Number(new URL(best.url).searchParams.get("expire")) * 1000;
      return {
        url: best.url,
        mime: best.mime_type?.startsWith("audio/webm") ? "audio/webm" : "audio/mp4",
        title: info.basic_info?.title ?? "",
        duration: info.basic_info?.duration ?? 0,
        expiresAt: expire || Date.now() + 3 * 3600_000,
      };
    } catch (e) {
      reason = (e as Error).message || reason;
    }
  }
  throw new Error(reason || "Failed to resolve stream URL");
}
