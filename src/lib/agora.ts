/**
 * Agora Voice-only Engine for CREESPY Room Voice Chat.
 *
 * Replaces the browser WebRTC mesh with Agora RTC (voice-only):
 *   - join flow: createClient({mode:"rtc"}) -> join -> createMicrophoneAudioTrack -> publish
 *   - remote users auto-play audio (user-published / user-unpublished events)
 *   - speaking detection via 250ms getVolumeLevel() polling (local + remote)
 *   - per-user volume, local mute, and input/output device switching
 *
 * The room roster, host moderation state, and presence still flow over the
 * Supabase Realtime room channel (see hooks/useVoice.ts); this class only
 * handles the audio transport.
 */

import AgoraRTC from "agora-rtc-sdk-ng";
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

/** App ID from Agora Console; overridable via .env.local */
export const AGORA_APP_ID = String(
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AGORA_APP_ID) ||
    "6f35ac1ac6f34d0f912fbfbdca988ae0"
).trim();

/** Optional shared token (only needed when the project has an App Certificate enabled). */
export const AGORA_TOKEN: string | null =
  (typeof import.meta !== "undefined" && String((import.meta as any).env?.VITE_AGORA_TOKEN || "").trim()) ||
  null;

/** Agora channel name for a room's voice chat. */
export function agoraVoiceChannelName(roomCode: string): string {
  return `voice_${roomCode.toUpperCase()}`;
}

/* Manual temporary-token override (Agora Console tokens expire after 24h). */
const TOKEN_OVERRIDE_KEY = "creespy.agora.token";
const CHANNEL_OVERRIDE_KEY = "creespy.agora.channel";

export interface ManualAgoraCredential {
  token: string;
  channel: string;
}

export function getManualAgoraCredentials(): ManualAgoraCredential {
  try {
    return {
      token: localStorage.getItem(TOKEN_OVERRIDE_KEY) || "",
      channel: (localStorage.getItem(CHANNEL_OVERRIDE_KEY) || "").trim(),
    };
  } catch {
    return { token: "", channel: "" };
  }
}

export function setManualAgoraCredentials(token: string, channel: string): void {
  try {
    const t = String(token || "").trim();
    const c = String(channel || "").trim();
    if (t) localStorage.setItem(TOKEN_OVERRIDE_KEY, t);
    else localStorage.removeItem(TOKEN_OVERRIDE_KEY);
    if (c) localStorage.setItem(CHANNEL_OVERRIDE_KEY, c.toUpperCase());
    else localStorage.removeItem(CHANNEL_OVERRIDE_KEY);
  } catch {
    /* noop */
  }
}

export type AgoraEngineState = "connecting" | "connected" | "reconnecting" | "closed";

export interface AgoraVoiceCallbacks {
  onSpeakingChange: (userId: string, isSpeaking: boolean) => void;
  onConnectionState: (state: AgoraEngineState) => void;
  onRemoteJoined?: (userId: string) => void;
  onRemoteLeft?: (userId: string) => void;
  /** Fired with the friendly label of the device actually used for capture. */
  onMicrophoneDevice?: (label: string, deviceId: string | null) => void;
  onError: (error: string) => void;
}

/**
 * Windows (and some Linux/macOS setups) ship "loopback" input devices that relay
 * ALL desktop/system audio into what looks like a microphone. If one of those is
 * the OS default input, the whole desktop ends up in the voice channel. These
 * patterns identify them so the app can pick a real microphone instead.
 */
const LOOPBACK_MIC_PATTERN =
  /stereo\s*mi+x|loop\s*back|voice\s*meeter|voicemeter|vb-?audio|virtual\s*(audio|cable|input|raio|mic|device)|cable\s*(output|input|aux)|what\s*u\s*hear|dante|spdif|s\/pdif|wave\s*out|obs\s*(output|virtual)|speaker\s*(out|playback)|digital\s*audio|audio\s*repeater|mix\s*console|pulse\s*passthrough/i;

/** Pick a real microphone id; explicit user choice is always respected. */
export async function pickSafeMicrophoneId(preferred?: string | null): Promise<string | null> {
  if (preferred) return preferred;
  let devices: Array<{ label?: string; deviceId?: string }> = [];
  try {
    devices = (await AgoraRTC.getMicrophones()) as any;
  } catch {
    return null;
  }
  const usable = devices.filter((d) => String(d?.deviceId || "").trim().length > 0);
  if (!usable.length) return null;
  const real = usable.filter((d) => !LOOPBACK_MIC_PATTERN.test(String(d.label || "")));
  const pool = real.length ? real : usable;
  const labeled = pool.filter((d) =>
    /mic|headset|webcam|camera|builtin|internal|ear|macbook|studio/i.test(String(d.label || ""))
  );
  const chosen = (labeled.length ? labeled : pool)[0];
  return String(chosen?.deviceId || "").trim() || null;
}

/** Resolve a friendly label for a capture device id (or the system default). */
export async function resolveMicrophoneLabel(deviceId: string | null): Promise<string> {
  type MicInfo = { label?: string; deviceId?: string };
  try {
    const list = ((await AgoraRTC.getMicrophones()) || []) as MicInfo[];
    if (deviceId) {
      const exact = list.find((d) => String(d?.deviceId || "") === deviceId);
      if (exact?.label) return String(exact.label);
    }
    const first =
      list.find((d) => !LOOPBACK_MIC_PATTERN.test(String(d?.label || "")) && String(d?.label || "").length > 0) ||
      list.find((d) => String(d?.label || "").length > 0);
    return String(first?.label || "Default microphone");
  } catch {
    return "Default microphone";
  }
}

export interface AgoraStartOptions {
  channel: string;
  uid: string;
  deviceId?: string;
  /** Noise suppression (ANS) on the capture — ON by default. */
  noiseCancel?: boolean;
  /** Fetch a signed token from the app's backend (used when the App Certificate is enabled). */
  tokenProvider?: () => Promise<string | null>;
}

const SPEAK_START = 0.08;
const SPEAK_STOP = 0.04;
const POLL_MS = 250;
const MAX_VOLUME = 100; // Agora remote playback volume range is [0, 100]

/** Agora join failures that mean "no gateway / bad token" — retryable with a signed token. */
function isTokenGatewayError(err: any): boolean {
  const raw = String(err?.message || err?.code || err || "");
  return /CAN_NOT_GET_GATEWAY_SERVER|INVALID_TOKEN|TOKEN_EXPIRED|UNAUTHORIZED|invalid token|cannot get gateway|can not get gateway/i.test(
    raw
  );
}

function friendlyGatewayError(): Error {
  return new Error(
    "Agora refused the voice gateway for this project — the App ID's App Certificate is enabled, so a signed token is required. Fix: set AGORA_APP_CERTIFICATE on the server (the app then auto-fetches tokens), or open Voice Settings and paste a temporary token from Agora Console (Security > Generate Temporary Token, valid 24h)."
  );
}

function volumeKey(userId: string): string {
  return `creespy_voice_vol_${userId}`;
}

function storedVolume(userId: string): number {
  try {
    const raw = localStorage.getItem(volumeKey(userId));
    if (raw !== null) {
      const n = Math.round(Number(raw));
      if (Number.isFinite(n) && n >= 0 && n <= 150) return n;
    }
  } catch {}
  return 100;
}

function clampPlaybackVolume(volume: number): number {
  return Math.max(0, Math.min(MAX_VOLUME, Math.round(Number(volume) || 0)));
}

export class AgoraVoiceManager {
  // Local voice permission flags (mirrored from useVoice host-moderation state)
  public canSpeak = true;
  public canHear = true;
  public selfMuted = false;
  public hostMuted = false;

  private localUserId: string;
  private callbacks: AgoraVoiceCallbacks;
  private client: IAgoraRTCClient | null = null;
  private micTrack: IMicrophoneAudioTrack | null = null;
  private remotes = new Map<string, IRemoteAudioTrack>();
  private pollTimer: number | null = null;
  private speakingOn = new Set<string>();
  private locallyMuted = new Set<string>();
  private destroyed = false;
  private published = false;
  private micDeviceId: string | null = null;
  private playbackDeviceId: string | null = null;
  private micDeviceLabel: string | null = null;

  constructor(localUserId: string, callbacks: AgoraVoiceCallbacks) {
    this.localUserId = localUserId;
    this.callbacks = callbacks;
    try {
      // numeric levels: 0 DEBUG / 1 INFO / 2 WARNING / 4 ERROR
      AgoraRTC.setLogLevel(2);
    } catch {}
  }

  private get effectiveMuted(): boolean {
    return this.selfMuted || this.hostMuted || !this.canSpeak;
  }

  /* ---------------- Media device helpers ---------------- */

  /** Noise-suppression preference for the mic capture (default ON). */
  noiseCancel = true;

  async start(opts: AgoraStartOptions): Promise<void> {
    if (this.destroyed) throw new Error("Engine was destroyed");
    this.micDeviceId = opts.deviceId || null;
    this.noiseCancel = opts.noiseCancel !== false;
    this.callbacks.onConnectionState("connecting");

    const manual = getManualAgoraCredentials();
    const channelName = manual.channel || opts.channel;

    // Attempt 1: manual/console token if present, otherwise App-ID only
    // (works when the project's App Certificate is disabled — "testing mode").
    const firstToken = manual.token || AGORA_TOKEN || null;
    try {
      await this.joinAndPublish(channelName, firstToken, opts.uid, opts.deviceId);
    } catch (err: any) {
      const retryable = isTokenGatewayError(err) && !firstToken && !!opts.tokenProvider;
      if (!retryable) {
        throw new Error(this.humanJoinError(err));
      }
      // Attempt 2: fetch a signed token from the app's backend and retry once.
      let serverToken: string | null = null;
      try {
        serverToken = await opts.tokenProvider!();
      } catch {
        serverToken = null;
      }
      if (!serverToken) {
        throw friendlyGatewayError();
      }
      try {
        await this.joinAndPublish(channelName, serverToken, opts.uid, opts.deviceId);
      } catch (secondErr: any) {
        throw new Error(this.humanJoinError(secondErr));
      }
    }

    this.callbacks.onConnectionState("connected");
  }

  /** Create a FRESH client, join, create the mic track, and publish. */
  private async joinAndPublish(
    channelName: string,
    token: string | null,
    uid: string,
    deviceId?: string
  ): Promise<void> {
    // Clean up any leftovers from a previous attempt so retry always starts fresh.
    if (this.micTrack) {
      try {
        this.micTrack.close();
      } catch {}
      this.micTrack = null;
      this.published = false;
    }
    if (this.client) {
      const old = this.client;
      this.client = null;
      try {
        await old.leave();
      } catch {}
    }

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.client = client;
    this.bindClientEvents(client);

    await client.join(AGORA_APP_ID, channelName, token, uid || null);

    // Never trust the OS default blindly: if no device was chosen, resolve one
    // that is a real microphone and NOT a desktop-audio loopback device.
    const micDeviceId = await pickSafeMicrophoneId(deviceId || null);
    this.micDeviceId = micDeviceId || deviceId || null;

    this.micTrack = await AgoraRTC.createMicrophoneAudioTrack({
      // Capture ONLY the microphone signal: echo cancellation removes anything
      // the speakers/system playback feeds back, and noise suppression drops
      // desktop noise — ANS follows the user's Voice Settings toggle (default on).
      microphoneId: micDeviceId || undefined,
      AEC: true,
      ANS: this.noiseCancel,
      AGC: true,
      bypassWebAudio: false,
    });

    // Surface which physical device is doing the capture so wrong-device
    // routing (OS loopback / stale default) is instantly visible.
    const trackDeviceId = ((): string | null => {
      try {
        const id = (this.micTrack as any).getDeviceId?.();
        return id ? String(id) : micDeviceId;
      } catch {
        return micDeviceId;
      }
    })();
    this.micDeviceLabel = await resolveMicrophoneLabel(trackDeviceId || micDeviceId);
    this.callbacks.onMicrophoneDevice?.(this.micDeviceLabel, trackDeviceId || micDeviceId);

    // Agora refuses to publish a DISABLED track (TRACK_IS_DISABLED). The track
    // is freshly created and therefore enabled — publish first, and only then
    // fold the current mute state (self/host muted or talk permission off)
    // into the live track.
    await client.publish([this.micTrack]);
    this.published = true;
    this.applyMicEnabled();

    this.startPolling();
  }

  private humanJoinError(err: any): string {
    const raw = String(err?.message || err?.code || err || "Unknown error");
    if (/NOT_ALLOWED|NotAllowedError|PermissionDeniedError|Permission|denied/i.test(raw)) {
      return "Microphone permission denied. Please allow microphone access.";
    }
    if (/token/i.test(raw) && /(invalid|expired|unauth)/i.test(raw)) {
      return "Voice channel rejected the token — regenerate the temporary token (valid 24h) in Agora Console and update it in Voice Settings.";
    }
    if (isTokenGatewayError(raw)) {
      return friendlyGatewayError().message;
    }
    if (/api.?id/i.test(raw)) return "Invalid Agora App ID — check VITE_AGORA_APP_ID.";
    if (/websocket|network|dispatch|timeout/i.test(raw)) {
      return "Voice network error — your connection or firewall may block Agora voice servers.";
    }
    return raw.slice(0, 220);
  }

  private bindClientEvents(client: IAgoraRTCClient) {
    client.on("user-published", async (user, mediaType) => {
      if (mediaType !== "audio" || !this.client) return;
      const uid = String(user.uid ?? "");
      if (!uid) return;
      try {
        await this.client.subscribe(user, "audio");
        if (this.destroyed) return;
        const track = user.audioTrack;
        if (!track) return;
        this.remotes.set(uid, track);
        this.applyRemotePlayback(uid, track);
        this.callbacks.onRemoteJoined?.(uid);
      } catch (err: any) {
        this.callbacks.onError(`Subscribe failed: ${err?.message || err}`);
      }
    });

    client.on("user-unpublished", (user) => {
      const uid = String(user.uid ?? "");
      if (!uid) return;
      const track = this.remotes.get(uid);
      if (track) {
        try {
          track.stop();
        } catch {}
      }
      this.remotes.delete(uid);
      this.pushSpeaking(uid, false);
    });

    client.on("user-left", (user) => {
      const uid = String(user.uid ?? "");
      if (!uid) return;
      const track = this.remotes.get(uid);
      if (track) {
        try {
          track.stop();
        } catch {}
      }
      this.remotes.delete(uid);
      this.pushSpeaking(uid, false);
      this.callbacks.onRemoteLeft?.(uid);
    });

    client.on("connection-state-change", (cur: string) => {
      if (cur === "CONNECTED") this.callbacks.onConnectionState("connected");
      else if (cur === "RECONNECTING") this.callbacks.onConnectionState("reconnecting");
      else if (cur === "CLOSED") this.callbacks.onConnectionState("closed");
      else if (cur === "DISCONNECTED") this.callbacks.onConnectionState("reconnecting");
    });

    // Error events are surfaced in catch paths; leave handling there.
  }

  private applyRemotePlayback(uid: string, track: IRemoteAudioTrack) {
    const muted = this.locallyMuted.has(uid) || !this.canHear;
    try {
      if (muted) {
        stopRemote(track);
      } else {
        track.play();
        // setVolume is sync (0-100 playback volume)
        track.setVolume(clampPlaybackVolume(this.getUserVolume(uid)));
        if (this.playbackDeviceId) track.setPlaybackDevice(this.playbackDeviceId).catch(() => {});
      }
    } catch {}
  }

  /* ---------------- Speaking detection (polling) ---------------- */

  private startPolling() {
    if (this.pollTimer !== null) return;
    this.pollTimer = window.setInterval(() => {
      if (this.destroyed) return;
      // Local voice activity
      let localLevel = 0;
      const track = this.micTrack;
      if (track) {
        try {
          localLevel = Number(track.getVolumeLevel()) || 0;
        } catch {}
      }
      const localSpeaking = !this.effectiveMuted && localLevel > SPEAK_START;
      this.pushSpeaking(this.localUserId, localSpeaking);

      // Remote voice activity (with small hysteresis handled by thresholds)
      this.remotes.forEach((track2, uid) => {
        let level = 0;
        try {
          level = Number(track2.getVolumeLevel()) || 0;
        } catch {}
        const isOn = this.speakingOn.has(uid);
        const next = isOn ? level > SPEAK_STOP : level > SPEAK_START;
        this.pushSpeaking(uid, next);
      });
    }, POLL_MS);
  }

  private pushSpeaking(userId: string, isSpeaking: boolean) {
    const prev = this.speakingOn.has(userId);
    if (prev === isSpeaking) return;
    if (isSpeaking) this.speakingOn.add(userId);
    else this.speakingOn.delete(userId);
    this.callbacks.onSpeakingChange(userId, isSpeaking);
  }

  /* ---------------- Local mic control ---------------- */

  /** Mute-state changes read the permission flags; call after changing flags. */
  updateLocalTrackState(): void {
    this.applyMicEnabled();
  }

  private applyMicEnabled() {
    if (!this.micTrack) return;
    const enable = !this.effectiveMuted;
    this.micTrack.setEnabled(enable).catch(() => {});
  }

  private applyMuteFlags() {
    // Publishing is kept; we simply disable the track when muted
    // (remote hears silence — user-unpublished/user-published resume automatically).
    this.applyMicEnabled();
  }

  setSelfMuted(muted: boolean) {
    this.selfMuted = muted;
    this.applyMuteFlags();
  }

  setHostMuted(muted: boolean) {
    this.hostMuted = muted;
    this.applyMuteFlags();
  }

  setCanSpeak(allowed: boolean) {
    this.canSpeak = allowed;
    this.applyMuteFlags();
  }

  setCanHear(allowed: boolean) {
    this.canHear = allowed;
    this.remotes.forEach((track, uid) => this.applyRemotePlayback(uid, track));
  }

  /** Switch microphone by device id — recreates & republishes the track.
   * Optionally (re)applies the noise-suppression flag in the same recreate. */
  async setMicrophoneDevice(deviceId: string, ans?: boolean): Promise<void> {
    if (!this.client) return;
    if (typeof ans === "boolean") this.noiseCancel = ans;
    const old = this.micTrack;
    const next = await AgoraRTC.createMicrophoneAudioTrack({
      microphoneId: deviceId,
      AEC: true,
      ANS: this.noiseCancel,
      AGC: true,
      bypassWebAudio: false,
    });
    this.micDeviceLabel = await resolveMicrophoneLabel(deviceId);
    this.callbacks.onMicrophoneDevice?.(this.micDeviceLabel, deviceId);
    if (old && this.published) {
      try {
        await this.client.unpublish([old]);
      } catch {}
    }
    old?.close();
    this.micTrack = next;
    this.micDeviceId = deviceId;
    // Same order-of-operations rule as the initial publish: an enabled track is
    // required for publish; mute state folds in afterwards.
    if (this.published) {
      await this.client.publish([next]);
    }
    this.applyMicEnabled();
  }

  /** Toggle noise suppression live: recreates the mic track with the new ANS
   * flag on the currently selected device (no-op when not connected). */
  async setNoiseCancellation(on: boolean): Promise<void> {
    if (!this.client || !this.micTrack) {
      this.noiseCancel = on;
      return;
    }
    await this.setMicrophoneDevice(this.micDeviceId || "default", on);
  }

  /** Set remote playback output device (Chrome support). */
  async setPlaybackDevice(deviceId: string): Promise<void> {
    this.playbackDeviceId = deviceId;
    this.remotes.forEach((track) => {
      try {
        track.setPlaybackDevice(deviceId).catch(() => {});
      } catch {}
    });
  }

  /* ---------------- Per-user volume & local mute ---------------- */

  getUserVolume(userId: string): number {
    return storedVolume(userId);
  }

  setUserVolume(userId: string, volume: number): void {
    const v = Math.max(0, Math.min(150, Math.round(Number(volume) || 0)));
    try {
      localStorage.setItem(volumeKey(userId), String(v));
    } catch {}
    const track = this.remotes.get(userId);
    if (track && !this.locallyMuted.has(userId) && this.canHear) {
      try {
        track.setVolume(clampPlaybackVolume(v));
      } catch {}
    }
  }

  toggleLocalMuteUser(userId: string): boolean {
    if (this.locallyMuted.has(userId)) {
      this.locallyMuted.delete(userId);
      const track = this.remotes.get(userId);
      if (track) {
        try {
          track.play();
          track.setVolume(clampPlaybackVolume(this.getUserVolume(userId)));
        } catch {}
      }
      return false;
    }
    this.locallyMuted.add(userId);
    const track = this.remotes.get(userId);
    if (track) {
      try {
        track.stop();
      } catch {}
    }
    return true;
  }

  isUserLocallyMuted(userId: string): boolean {
    return this.locallyMuted.has(userId);
  }

  /* ---------------- Compat & teardown ---------------- */

  /** Kept for call-site compatibility (Agora manages its own audio pipeline). */
  async ensureAudioContext(): Promise<void> {}

  debugSnapshot(): Record<string, unknown> {
    return {
      engine: "agora",
      joined: Boolean(this.client),
      connectionState: (this.client as any)?.connectionState ?? null,
      remoteCount: this.remotes.size,
      speakingCount: this.speakingOn.size,
      micDeviceId: this.micDeviceId,
      micDeviceLabel: this.micDeviceLabel,
      playbackDeviceId: this.playbackDeviceId,
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.micTrack) {
      try {
        this.micTrack.close();
      } catch {}
      this.micTrack = null;
    }
    this.published = false;

    this.remotes.forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
    this.remotes.clear();
    this.speakingOn.clear();

    if (this.client) {
      const client = this.client;
      this.client = null;
      client.leave().catch(() => {});
    }
  }
}

function stopRemote(track: IRemoteAudioTrack) {
  try {
    track.stop();
  } catch {}
}
