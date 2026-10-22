import { Capacitor, CapacitorHttp } from "@capacitor/core";

export interface DirectAudioResult {
  url: string;
  mime: string;
  title?: string;
  duration?: number;
  expiresAt: number;
}

const cache = new Map<string, DirectAudioResult>();
const inflight = new Map<string, Promise<string | null>>();

/**
 * Resolves a YouTube track's direct GoogleVideo audio stream URL natively on the device.
 * On Android, this uses CapacitorHttp (Android native Java networking) so YouTube cryptographically
 * binds the signed GoogleVideo CDN URL directly to the phone's IP address.
 * The HTML5 <audio> element can then stream directly from Google's nearest CDN with zero server timeouts,
 * zero proxy lag, and hardware-accelerated playback that continues playing with the screen locked!
 */
export async function resolveDirectAudio(videoId: string): Promise<string | null> {
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt - Date.now() > 60_000) {
    return cached.url;
  }

  let job = inflight.get(videoId);
  if (!job) {
    job = resolveNativeInnertube(videoId).finally(() => inflight.delete(videoId));
    inflight.set(videoId, job);
  }
  return job;
}

async function resolveNativeInnertube(videoId: string): Promise<string | null> {
  // If running in Capacitor native Android app, resolve via Android Java HTTP stack (CapacitorHttp)
  if (Capacitor.isNativePlatform()) {
    try {
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

      const res = await CapacitorHttp.request({
        url: "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
          "x-goog-api-key": "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
          authorization: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
          "x-youtube-client-name": "3",
          "x-youtube-client-version": "20.10.38",
        },
        data: payload,
      });

      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      const formats: any[] = [
        ...(data?.streamingData?.adaptiveFormats ?? []),
        ...(data?.streamingData?.formats ?? []),
      ].filter((f: any) => f?.mimeType?.includes("audio") && typeof f?.url === "string");

      // Pick itag 140 (AAC 128k - universally supported) first, else best m4a, else highest bitrate
      const byItag = formats.find((f: any) => f.itag === 140);
      const m4a = formats
        .filter((f: any) => String(f.mimeType).includes("mp4"))
        .sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
      const best = byItag || m4a[0] || formats.sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];

      if (best?.url) {
        const expireParam = new URL(best.url).searchParams.get("expire");
        const expiresAt = expireParam ? Number(expireParam) * 1000 : Date.now() + 3 * 3600_000;
        cache.set(videoId, {
          url: best.url,
          mime: best.mimeType || "audio/mp4",
          expiresAt,
        });
        return best.url;
      }
    } catch (err) {
      console.warn("[DirectStream] CapacitorHttp resolution failed:", err);
    }
  }

  return null;
}

/** Invalidate cached stream URL if expired or failed */
export function invalidateDirectAudio(url: string) {
  for (const [id, r] of cache) {
    if (r.url === url) cache.delete(id);
  }
}
