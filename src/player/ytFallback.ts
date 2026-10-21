/**
 * Embedded YouTube Player Fallback Engine.
 * When the server-side stream proxy is blocked by YouTube's bot-detection (common on cloud/datacenter IPs),
 * this engine seamlessly plays the song via YouTube's official IFrame Player API.
 * It provides identical controls: play, pause, seek, volume, progress, and end detection.
 */

let apiPromise: Promise<any> | null = null;

export function loadYouTubeIframeAPI(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const w = window as any;
    if (w.YT && w.YT.Player) {
      resolve(w.YT);
      return;
    }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export interface YtPlayerCallbacks {
  onPlaying: () => void;
  onPaused: () => void;
  onBuffering: () => void;
  onEnded: () => void;
  onTimeUpdate: (position: number, duration: number) => void;
  onError: (err: any) => void;
}

export class YtFallbackController {
  private player: any = null;
  private isReady = false;
  private timer: any = null;
  private active = false;
  private callbacks: YtPlayerCallbacks | null = null;
  private currentVideoId = "";
  private initialVolume = 1;
  private isMuted = false;
  private pendingStart: { videoId: string; startAt: number; autoplay: boolean } | null = null;

  init(callbacks: YtPlayerCallbacks) {
    this.callbacks = callbacks;
    if (typeof document === "undefined") return;

    let container = document.getElementById("yt-fallback-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "yt-fallback-container";
      container.style.cssText =
        "position: fixed; top: 0; left: 0; width: 200px; height: 200px; opacity: 0.001; pointer-events: none; z-index: -999;";
      container.setAttribute("aria-hidden", "true");
      document.body.appendChild(container);
    }

    let mount = document.getElementById("yt-fallback-mount");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "yt-fallback-mount";
      container.appendChild(mount);
    }

    loadYouTubeIframeAPI()
      .then((YT) => {
        this.player = new YT.Player("yt-fallback-mount", {
          width: "200",
          height: "200",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            rel: 0,
            iv_load_policy: 3,
            fs: 0,
          },
          events: {
            onReady: () => {
              this.isReady = true;
              try {
                this.player.setVolume(Math.round(this.initialVolume * 100));
                if (this.isMuted) this.player.mute();
              } catch {}
              if (this.pendingStart) {
                const { videoId, startAt, autoplay } = this.pendingStart;
                this.pendingStart = null;
                this.playVideo(videoId, startAt, autoplay);
              }
            },
            onStateChange: (e: any) => {
              if (!this.active) return;
              // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
              if (e.data === 1) {
                this.startTicker();
                this.callbacks?.onPlaying();
              } else if (e.data === 2) {
                this.stopTicker();
                this.callbacks?.onPaused();
              } else if (e.data === 3) {
                this.callbacks?.onBuffering();
              } else if (e.data === 0) {
                this.stopTicker();
                this.callbacks?.onEnded();
              }
            },
            onError: (e: any) => {
              if (!this.active) return;
              this.stopTicker();
              this.callbacks?.onError(e);
            },
          },
        });
      })
      .catch(() => {});
  }

  playVideo(videoId: string, startAt = 0, autoplay = true) {
    this.active = true;
    this.currentVideoId = videoId;
    if (!this.isReady || !this.player) {
      this.pendingStart = { videoId, startAt, autoplay };
      return;
    }

    try {
      if (autoplay) {
        this.player.loadVideoById({ videoId, startSeconds: startAt });
      } else {
        this.player.cueVideoById({ videoId, startSeconds: startAt });
      }
    } catch {
      this.pendingStart = { videoId, startAt, autoplay };
    }
  }

  pause() {
    if (!this.active || !this.player) return;
    try {
      this.player.pauseVideo();
    } catch {}
    this.stopTicker();
  }

  resume() {
    if (!this.active || !this.player) return;
    try {
      this.player.playVideo();
    } catch {}
  }

  seek(seconds: number) {
    if (!this.active || !this.player) return;
    try {
      this.player.seekTo(Math.max(0, seconds), true);
    } catch {}
  }

  setVolume(vol: number) {
    this.initialVolume = vol;
    if (!this.player) return;
    try {
      this.player.setVolume(Math.round(vol * 100));
    } catch {}
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.player) return;
    try {
      if (muted) this.player.mute();
      else this.player.unMute();
    } catch {}
  }

  stop() {
    this.active = false;
    this.stopTicker();
    if (this.player) {
      try {
        this.player.stopVideo();
      } catch {}
    }
  }

  isActive() {
    return this.active;
  }

  getVideoId() {
    return this.currentVideoId;
  }

  private startTicker() {
    this.stopTicker();
    this.timer = setInterval(() => {
      if (!this.active || !this.player) return;
      try {
        const cur = this.player.getCurrentTime?.() ?? 0;
        const dur = this.player.getDuration?.() ?? 0;
        this.callbacks?.onTimeUpdate(cur, dur);
      } catch {}
    }, 250);
  }

  private stopTicker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const ytFallback = new YtFallbackController();
