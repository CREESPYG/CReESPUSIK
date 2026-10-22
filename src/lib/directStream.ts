import { Capacitor, registerPlugin } from "@capacitor/core";

export interface DirectAudioResult {
  url: string;
  mime: string;
  expiresAt: number;
}

interface NativePlaybackPlugin {
  resolveAudio(options: { videoId: string }): Promise<{ url: string; mime?: string }>;
}

const noop = async () => ({ url: "" });
const NativePlayback = registerPlugin<NativePlaybackPlugin>("MusikePlayback", {
  web: () => ({ resolveAudio: noop }),
});

const cache = new Map<string, DirectAudioResult>();
const inflight = new Map<string, Promise<string | null>>();

/**
 * Resolves a YouTube track's direct GoogleVideo audio stream URL.
 * On Android, this delegates to the native Java MusikePlaybackPlugin which connects
 * to YouTube using Android Java networking (no browser Origin header, no CORS blocks).
 * The returned GoogleVideo stream URL is cryptographically bound to the device's IP,
 * allowing HTML5 <audio> to stream directly from Google's nearest CDN with hardware
 * acceleration and zero Vercel proxy timeouts!
 */
export async function resolveDirectAudio(videoId: string): Promise<string | null> {
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt - Date.now() > 60_000) {
    return cached.url;
  }

  let job = inflight.get(videoId);
  if (!job) {
    job = resolveNativeStream(videoId).finally(() => inflight.delete(videoId));
    inflight.set(videoId, job);
  }
  return job;
}

async function resolveNativeStream(videoId: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const res = await NativePlayback.resolveAudio({ videoId });
    if (res?.url) {
      const expireParam = new URL(res.url).searchParams.get("expire");
      const expiresAt = expireParam ? Number(expireParam) * 1000 : Date.now() + 3 * 3600_000;
      cache.set(videoId, {
        url: res.url,
        mime: res.mime || "audio/mp4",
        expiresAt,
      });
      return res.url;
    }
  } catch (err) {
    console.warn("[DirectStream] Native Java audio resolution failed:", err);
  }

  return null;
}

/** Invalidate cached stream URL if expired or failed */
export function invalidateDirectAudio(url: string) {
  for (const [id, r] of cache) {
    if (r.url === url) cache.delete(id);
  }
}
