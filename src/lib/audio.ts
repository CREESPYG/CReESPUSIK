/**
 * The audio element the player drives.
 *
 * On Android it is not an `<audio>` either: playback there is owned natively by the Media3 engine
 * (mobile/android/app/src/main/java/app/creepusik/android/PlaybackEngine.java) so it survives the app being
 * minimized with lock screen and notification controls. This class keeps the slice of the HTMLMediaElement API
 * the player uses — src, play, pause, currentTime, duration, volume, buffered and the events — backed by the
 * native player over the MusikePlayback Capacitor plugin.
 *
 * On iOS the same trick runs through the `musikeAudio` handler (ios/App/App/MusikeAudio.swift); the web view's
 * media stack gets cut off by YouTube a few hundred kilobytes into a track there.
 *
 * Everywhere else it is the plain `<audio>` the app has always used.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

interface Bridge {
  postMessage(message: unknown): void;
}

interface NativePayload {
  position?: number;
  duration?: number;
  buffered?: number;
  message?: string;
}

const nativeBridge = (globalThis as { webkit?: { messageHandlers?: { musikeAudio?: Bridge } } }).webkit?.messageHandlers
  ?.musikeAudio;

interface AudioPlaybackPlugin {
  load(options: { url: string }): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(options: { to: number }): Promise<void>;
  volume(options: { value: number }): Promise<void>;
  muted(options: { value: boolean }): Promise<void>;
  update(options: Record<string, unknown>): Promise<void>;
  addListener(
    eventName: "audioEvent",
    listenerFunc: (data: NativePayload & { event: string }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(eventName: string, listenerFunc: (data: unknown) => void): Promise<PluginListenerHandle>;
}

const noop = async () => {};
const NativePlayback = registerPlugin<AudioPlaybackPlugin>("MusikePlayback", {
  web: () => ({
    load: noop,
    play: noop,
    pause: noop,
    seekTo: noop,
    volume: noop,
    muted: noop,
    update: noop,
    addListener: async () => ({ remove: noop }),
  }),
});

const isAndroidApp = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

class Buffered {
  constructor(private to: number) {}
  get length() {
    return this.to > 0 ? 1 : 0;
  }
  end(_index: number) {
    return this.to;
  }
}

class NativeAudio extends EventTarget {
  // The player sets these; the native side only needs to know about them.
  private _volume = 1;
  private _muted = false;
  private _src = "";
  private _position = 0;
  private _duration = NaN;
  private _paused = true;
  private _ended = false;
  private _bufferedEnd = 0;
  /** Set while a seek is in flight: the native player keeps reporting the old position until it lands. */
  private _seekTarget: number | null = null;

  readyState = 0;
  networkState = 0;
  playbackRate = 1;
  error: { code: number; message: string } | null = null;
  preload = "auto";

  constructor(private bridge: Bridge) {
    super();
    const host = globalThis as {
      __musikeAudioEvent?: (event: string, data: NativePayload) => void;
      __musikeAudioEl?: NativeAudio;
    };
    host.__musikeAudioEvent = (event, data) => this.fromNative(event, data ?? {});
    // Handy when something needs to poke the player from the console.
    host.__musikeAudioEl = this;
  }

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    this._ended = false;
    this.error = null;
    this.readyState = 0;
    this._bufferedEnd = 0;
    this.bridge.postMessage({ cmd: "load", url: value });
  }

  get currentTime() {
    return this._position;
  }

  set currentTime(value: number) {
    this._position = value;
    this._seekTarget = value;
    this.bridge.postMessage({ cmd: "seek", to: value });
  }

  get duration() {
    return this._duration;
  }

  get paused() {
    return this._paused;
  }

  get ended() {
    return this._ended;
  }

  get volume() {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = value;
    this.bridge.postMessage({ cmd: "volume", value });
  }

  get muted() {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    this.bridge.postMessage({ cmd: "muted", value });
  }

  get buffered() {
    return new Buffered(this._bufferedEnd);
  }

  getAttribute(name: string) {
    return name === "src" ? this._src : null;
  }

  setAttribute(name: string, value: string) {
    if (name === "src") this.src = value;
  }

  removeAttribute(name: string) {
    if (name !== "src") return;
    this._src = "";
    this._position = 0;
    this.bridge.postMessage({ cmd: "load", url: "" });
  }

  load() {
    if (this._src) this.bridge.postMessage({ cmd: "load", url: this._src });
  }

  play() {
    this._paused = false;
    this.bridge.postMessage({ cmd: "play" });
    return Promise.resolve();
  }

  pause() {
    this._paused = true;
    this.bridge.postMessage({ cmd: "pause" });
    this.dispatchEvent(new Event("pause"));
  }

  private fromNative(event: string, data: NativePayload) {
    switch (event) {
      case "ready":
        this._duration = data.duration ?? NaN;
        this.readyState = 4;
        this.dispatchEvent(new Event("loadedmetadata"));
        this.dispatchEvent(new Event("durationchange"));
        break;
      case "time": {
        const position = data.position ?? this._position;
        if (data.duration && Number.isFinite(data.duration)) this._duration = data.duration;
        // Right after a seek the player reports no loaded ranges; keep the bar at least up to the playhead.
        const loaded = data.buffered ?? 0;
        if (loaded > 0) this._bufferedEnd = Math.max(loaded, position);
        // Ignore positions from before a pending seek; otherwise the player snaps back to where it was.
        if (this._seekTarget !== null && Math.abs(position - this._seekTarget) > 1.5) {
          this.dispatchEvent(new Event("progress"));
          break;
        }
        this._seekTarget = null;
        this._position = position;
        this._bufferedEnd = Math.max(this._bufferedEnd, position);
        this.dispatchEvent(new Event("timeupdate"));
        this.dispatchEvent(new Event("progress"));
        break;
      }
      case "seeked":
        this._seekTarget = null;
        this._position = data.position ?? this._position;
        this._bufferedEnd = Math.max(this._bufferedEnd, this._position);
        this.dispatchEvent(new Event("seeked"));
        this.dispatchEvent(new Event("timeupdate"));
        this.dispatchEvent(new Event("progress"));
        break;
      case "playing":
        this._paused = false;
        this.readyState = 4;
        this.dispatchEvent(new Event("playing"));
        break;
      case "ended":
        this._ended = true;
        this._paused = true;
        this.dispatchEvent(new Event("ended"));
        break;
      case "error":
        this.error = { code: 4, message: data.message ?? "Playback failed" };
        this.dispatchEvent(new Event("error"));
        break;
      default:
        break;
    }
  }
}

/** Android twin of NativeAudio: same protocol, out over Capacitor to the Media3 engine instead of over webkit. */
class AndroidAudio extends EventTarget {
  // The player sets these; the native side only needs to know about them.
  private _volume = 1;
  private _muted = false;
  private _src = "";
  private _position = 0;
  private _duration = NaN;
  private _paused = true;
  private _ended = false;
  private _bufferedEnd = 0;
  /** Set while a seek is in flight: the native player keeps reporting the old position until it lands. */
  private _seekTarget: number | null = null;

  readyState = 0;
  networkState = 0;
  playbackRate = 1;
  error: { code: number; message: string } | null = null;
  preload = "auto";

  constructor() {
    super();
    void NativePlayback.addListener("audioEvent", (data) => this.fromNative(data.event, data ?? {}));
    const host = globalThis as { __musikeAudioEl?: AndroidAudio };
    // Handy when something needs to poke the player from the console.
    host.__musikeAudioEl = this;
  }

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    this._ended = false;
    this.error = null;
    this.readyState = 0;
    this._bufferedEnd = 0;
    void NativePlayback.load({ url: value });
  }

  get currentTime() {
    return this._position;
  }

  set currentTime(value: number) {
    this._position = value;
    this._seekTarget = value;
    void NativePlayback.seekTo({ to: value });
  }

  get duration() {
    return this._duration;
  }

  get paused() {
    return this._paused;
  }

  get ended() {
    return this._ended;
  }

  get volume() {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = value;
    void NativePlayback.volume({ value });
  }

  get muted() {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    void NativePlayback.muted({ value });
  }

  get buffered() {
    return new Buffered(this._bufferedEnd);
  }

  getAttribute(name: string) {
    return name === "src" ? this._src : null;
  }

  setAttribute(name: string, value: string) {
    if (name === "src") this.src = value;
  }

  removeAttribute(name: string) {
    if (name !== "src") return;
    this._src = "";
    this._position = 0;
    void NativePlayback.load({ url: "" });
  }

  load() {
    if (this._src) void NativePlayback.load({ url: this._src });
  }

  play() {
    this._paused = false;
    void NativePlayback.play();
    return Promise.resolve();
  }

  pause() {
    this._paused = true;
    void NativePlayback.pause();
    this.dispatchEvent(new Event("pause"));
  }

  private fromNative(event: string, data: NativePayload) {
    switch (event) {
      case "ready":
        this._duration = data.duration ?? NaN;
        this.readyState = 4;
        this.dispatchEvent(new Event("loadedmetadata"));
        this.dispatchEvent(new Event("durationchange"));
        break;
      case "playing":
        this._paused = false;
        this.readyState = 4;
        this.dispatchEvent(new Event("playing"));
        break;
      case "time": {
        const position = data.position ?? this._position;
        if (data.duration && Number.isFinite(data.duration)) this._duration = data.duration;
        // Right after a seek the player reports no loaded ranges; keep the bar at least up to the playhead.
        const loaded = data.buffered ?? 0;
        if (loaded > 0) this._bufferedEnd = Math.max(loaded, position);
        // Ignore positions from before a pending seek; otherwise the player snaps back to where it was.
        if (this._seekTarget !== null && Math.abs(position - this._seekTarget) > 1.5) {
          this.dispatchEvent(new Event("progress"));
          break;
        }
        this._seekTarget = null;
        this._position = position;
        this._bufferedEnd = Math.max(this._bufferedEnd, position);
        this.dispatchEvent(new Event("timeupdate"));
        this.dispatchEvent(new Event("progress"));
        break;
      }
      case "seeked":
        this._seekTarget = null;
        this._position = data.position ?? this._position;
        this._bufferedEnd = Math.max(this._bufferedEnd, this._position);
        this.dispatchEvent(new Event("seeked"));
        this.dispatchEvent(new Event("timeupdate"));
        this.dispatchEvent(new Event("progress"));
        break;
      case "pause":
        this._paused = true;
        this._position = data.position ?? this._position;
        this.dispatchEvent(new Event("pause"));
        break;
      case "ended":
        this._ended = true;
        this._paused = true;
        this.dispatchEvent(new Event("ended"));
        break;
      case "error":
        this.error = { code: 4, message: data.message ?? "Playback failed" };
        this.dispatchEvent(new Event("error"));
        break;
      default:
        break;
    }
  }
}

/** The audio element for this platform: native on iOS and Android, a real `<audio>` everywhere else. */
export function createAudio(): HTMLAudioElement {
  if (nativeBridge) return new NativeAudio(nativeBridge) as unknown as HTMLAudioElement;
  if (isAndroidApp) return new AndroidAudio() as unknown as HTMLAudioElement;
  const audio = new Audio();
  audio.preload = "auto";
  return audio;
}
