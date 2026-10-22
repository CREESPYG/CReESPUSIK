import { getLang, getT } from "../i18n";
import {
  ApiError,
  type Channel,
  type ErrorCode,
  type ImportResult,
  type MusikeApi,
  type Prepared,
  type SystemInfo,
  type SystemJob,
  type SystemMedia,
} from "./apiTypes";
import type { AlbumCard, AlbumPage, ArtistPage, Genre, GenreArtist, GenrePage, Library, Playlist, Track } from "./types";

import { Capacitor, CapacitorHttp, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { resolveDirectAudio, invalidateDirectAudio } from "./directStream";

// The HTTP backend: the Musike server (web app, desktop app). The Android build swaps this module for native/api.ts.
export * from "./apiTypes";

/** The server answers errors (and YouTube Music answers names, like genres) in the app's language. */
const LANG_HEADER = "x-musike-lang";

export const REMOTE_API_HOST = "https://creepusik.vercel.app";

/** Resolves API paths: uses relative paths in Vite dev server (port 5173), but prepends remote server for Capacitor APK */
export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (typeof window !== "undefined" && window.location.hostname === "localhost" && window.location.port === "5173") {
    return path;
  }
  if (
    typeof window !== "undefined" &&
    (Capacitor.isNativePlatform() ||
      window.location.protocol === "capacitor:" ||
      window.location.protocol === "file:" ||
      (window.location.hostname === "localhost" && window.location.port !== "5173"))
  ) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${REMOTE_API_HOST}${cleanPath}`;
  }
  return path;
}

async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const url = resolveApiUrl(path);
  const { json, ...rest } = init ?? {};

  // In native Android APK, use CapacitorHttp for bulletproof Java-level networking without CORS restrictions
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await CapacitorHttp.request({
        url,
        method: rest.method || (json !== undefined ? "POST" : "GET"),
        headers: {
          [LANG_HEADER]: getLang(),
          ...(json !== undefined ? { "content-type": "application/json" } : {}),
          ...(rest.headers as Record<string, string> | undefined),
        },
        data: json !== undefined ? json : undefined,
      });
      if (res.status === 204) return undefined as T;
      const body = typeof res.data === "string" ? JSON.parse(res.data || "{}") : res.data;
      if (res.status >= 400) {
        throw new ApiError(res.status, body?.error ?? getT().player.httpError(res.status), body?.code);
      }
      return body as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      // Fallback to browser fetch if CapacitorHttp encounters an issue
    }
  }

  const res = await fetch(url, {
    ...rest,
    headers: {
      [LANG_HEADER]: getLang(),
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...(rest.headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? getT().player.httpError(res.status), body.code);
  return body as T;
}

const LOCAL_LIB_KEY = "musike:local-library";

function readLocalLib(): Library {
  try {
    const raw = localStorage.getItem(LOCAL_LIB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    }
  } catch {}
  return { favorites: [], playlists: [], history: [] };
}

function writeLocalLib(lib: Library) {
  try {
    localStorage.setItem(LOCAL_LIB_KEY, JSON.stringify(lib));
  } catch {}
}

export const api: MusikeApi = {
  search: (q: string, type: "song" | "video", signal?: AbortSignal) =>
    request<{ tracks: Track[] }>(`/api/search?q=${encodeURIComponent(q)}&type=${type}`, { signal }).then((r) => r.tracks),
  suggest: (q: string, signal?: AbortSignal) =>
    request<{ suggestions: string[] }>(`/api/suggest?q=${encodeURIComponent(q)}`, { signal }).then((r) => r.suggestions),
  radio: (id: string) => request<{ tracks: Track[] }>(`/api/radio/${id}`).then((r) => r.tracks),
  genres: () => request<{ genres: Genre[] }>("/api/genres").then((r) => r.genres),
  genre: (id: string, signal?: AbortSignal) => request<GenrePage>(`/api/genres/${encodeURIComponent(id)}`, { signal }),
  genreArtists: (id: string, offset: number) =>
    request<{ artists: GenreArtist[]; hasMore: boolean }>(`/api/genres/${encodeURIComponent(id)}/artists?offset=${offset}`),
  artist: (id: string, signal?: AbortSignal) => request<ArtistPage>(`/api/artists/${encodeURIComponent(id)}`, { signal }),
  album: (id: string, signal?: AbortSignal) => request<AlbumPage>(`/api/albums/${encodeURIComponent(id)}`, { signal }),
  searchAlbums: (q: string, signal?: AbortSignal) =>
    request<{ albums: AlbumCard[] }>(`/api/search/albums?q=${encodeURIComponent(q)}`, { signal }).then((r) => r.albums),
  /** The music video matching a song, or null when YouTube has none. */
  videoFor: (t: Track) =>
    request<{ track: Track | null }>(
      `/api/video-for/${t.id}?${new URLSearchParams({ title: t.title, artist: t.artist, duration: String(t.duration || "") })}`,
    ).then((r) => r.track),
  prepare: (id: string, signal?: AbortSignal) =>
    request<Prepared>(`/api/prepare/${id}`, {
      method: "POST",
      signal,
    }),

  library: async () => {
    try {
      const remote = await request<Library>("/api/library");
      if (remote && Array.isArray(remote.favorites)) {
        writeLocalLib(remote);
        return remote;
      }
    } catch {}
    return readLocalLib();
  },
  addFavorite: async (t: Track) => {
    try {
      const res = await request<{ favorites: Track[] }>(`/api/favorites/${t.id}`, { method: "PUT", json: t });
      if (res?.favorites) {
        const lib = readLocalLib();
        lib.favorites = res.favorites;
        writeLocalLib(lib);
        return res;
      }
    } catch {}
    const lib = readLocalLib();
    if (!lib.favorites.some((f) => f.id === t.id)) {
      lib.favorites = [t, ...lib.favorites];
      writeLocalLib(lib);
    }
    return { favorites: lib.favorites };
  },
  addFavorites: async (tracks: Track[]) => {
    try {
      const res = await request<{ favorites: Track[] }>("/api/favorites", { method: "POST", json: { tracks } });
      if (res?.favorites) {
        const lib = readLocalLib();
        lib.favorites = res.favorites;
        writeLocalLib(lib);
        return res;
      }
    } catch {}
    const lib = readLocalLib();
    const existing = new Set(lib.favorites.map((f) => f.id));
    const toAdd = tracks.filter((t) => !existing.has(t.id));
    lib.favorites = [...toAdd, ...lib.favorites];
    writeLocalLib(lib);
    return { favorites: lib.favorites };
  },
  removeFavorite: async (id: string) => {
    try {
      const res = await request<{ favorites: Track[] }>(`/api/favorites/${id}`, { method: "DELETE" });
      if (res?.favorites) {
        const lib = readLocalLib();
        lib.favorites = res.favorites;
        writeLocalLib(lib);
        return res;
      }
    } catch {}
    const lib = readLocalLib();
    lib.favorites = lib.favorites.filter((f) => f.id !== id);
    writeLocalLib(lib);
    return { favorites: lib.favorites };
  },
  pushHistory: async (t: Track) => {
    try {
      const res = await request<{ history: Track[] }>("/api/history", { method: "POST", json: t });
      if (res?.history) {
        const lib = readLocalLib();
        lib.history = res.history;
        writeLocalLib(lib);
        return res;
      }
    } catch {}
    const lib = readLocalLib();
    lib.history = [t, ...lib.history.filter((h) => h.id !== t.id)].slice(0, 60);
    writeLocalLib(lib);
    return { history: lib.history };
  },
  createPlaylist: async (name: string, tracks: Track[] = []) => {
    try {
      const p = await request<Playlist>("/api/playlists", { method: "POST", json: { name, tracks } });
      if (p) {
        const lib = readLocalLib();
        lib.playlists = [p, ...lib.playlists.filter((x) => x.id !== p.id)];
        writeLocalLib(lib);
        return p;
      }
    } catch {}
    const lib = readLocalLib();
    const now = Date.now();
    const p: Playlist = {
      id: "pl_" + now.toString(36) + "_" + Math.random().toString(36).slice(2, 6),
      name,
      tracks,
      createdAt: now,
      updatedAt: now,
    };
    lib.playlists = [p, ...lib.playlists];
    writeLocalLib(lib);
    return p;
  },
  renamePlaylist: async (id: string, name: string) => {
    try {
      const p = await request<Playlist>(`/api/playlists/${id}`, { method: "PATCH", json: { name } });
      if (p) {
        const lib = readLocalLib();
        lib.playlists = lib.playlists.map((x) => (x.id === id ? p : x));
        writeLocalLib(lib);
        return p;
      }
    } catch {}
    const lib = readLocalLib();
    const target = lib.playlists.find((x) => x.id === id);
    if (target) {
      target.name = name;
      target.updatedAt = Date.now();
      writeLocalLib(lib);
      return target;
    }
    const now = Date.now();
    return { id, name, tracks: [], createdAt: now, updatedAt: now };
  },
  deletePlaylist: async (id: string) => {
    try {
      await request<void>(`/api/playlists/${id}`, { method: "DELETE" });
    } catch {}
    const lib = readLocalLib();
    lib.playlists = lib.playlists.filter((x) => x.id !== id);
    writeLocalLib(lib);
  },
  addToPlaylist: async (id: string, t: Track | Track[]) => {
    try {
      const p = await request<Playlist>(`/api/playlists/${id}/tracks`, { method: "POST", json: Array.isArray(t) ? { tracks: t } : t });
      if (p) {
        const lib = readLocalLib();
        lib.playlists = lib.playlists.map((x) => (x.id === id ? p : x));
        writeLocalLib(lib);
        return p;
      }
    } catch {}
    const lib = readLocalLib();
    const target = lib.playlists.find((x) => x.id === id);
    const toAdd = Array.isArray(t) ? t : [t];
    if (target) {
      target.tracks = [...target.tracks, ...toAdd];
      target.updatedAt = Date.now();
      writeLocalLib(lib);
      return target;
    }
    const now = Date.now();
    return { id, name: "Playlist", tracks: toAdd, createdAt: now, updatedAt: now };
  },
  removeFromPlaylist: async (id: string, trackId: string) => {
    try {
      const p = await request<Playlist>(`/api/playlists/${id}/tracks/${trackId}`, { method: "DELETE" });
      if (p) {
        const lib = readLocalLib();
        lib.playlists = lib.playlists.map((x) => (x.id === id ? p : x));
        writeLocalLib(lib);
        return p;
      }
    } catch {}
    const lib = readLocalLib();
    const target = lib.playlists.find((x) => x.id === id);
    if (target) {
      target.tracks = target.tracks.filter((tr) => tr.id !== trackId);
      target.updatedAt = Date.now();
      writeLocalLib(lib);
      return target;
    }
    const now = Date.now();
    return { id, name: "Playlist", tracks: [], createdAt: now, updatedAt: now };
  },

  importLibrary: async (backup: unknown, mode: "merge" | "replace") => {
    try {
      const res = await request<ImportResult>("/api/library/import", { method: "POST", json: { backup, mode } });
      if (res) return res;
    } catch {}
    const raw = (backup ?? {}) as any;
    const lib = readLocalLib();
    const newFavorites = Array.isArray(raw.favorites) ? raw.favorites : [];
    const newPlaylists = Array.isArray(raw.playlists) ? raw.playlists : [];
    if (mode === "replace") {
      lib.favorites = newFavorites;
      lib.playlists = newPlaylists;
    } else {
      const favIds = new Set(lib.favorites.map((f) => f.id));
      lib.favorites = [...lib.favorites, ...newFavorites.filter((f: any) => !favIds.has(f.id))];
      lib.playlists = [...lib.playlists, ...newPlaylists];
    }
    writeLocalLib(lib);
    return {
      favoritesAdded: newFavorites.length,
      playlistsAdded: newPlaylists.length,
      playlistsMerged: 0,
      tracksAdded: 0,
    };
  },

  system: async (): Promise<SystemInfo> => {
    try {
      const res = await request<SystemInfo>("/api/system");
      if (res?.ytdlp) return res;
    } catch {}
    return {
      version: "1.6.2",
      arch: "web",
      os: "web",
      ytdlp: { path: "", version: "", channel: "stable", latest: { stable: "", nightly: "", master: "" }, updateAvailable: false },
      deno: true,
      ffmpeg: true,
    } as any;
  },
  updateYtdlp: (channel: Channel) => request<SystemJob>("/api/system/ytdlp", { method: "POST", json: { channel } }),
};

/** What a media element plays for a track: resolves direct GoogleVideo CDN stream on mobile or server proxy on web. */
export const streamSource = async (
  id: string,
  kind: "audio" | "video" = "audio",
  quality: "sd" | "hd" = "sd"
): Promise<string> => {
  if (kind === "audio") {
    // 1. Direct device-side resolution: signed with device IP, plays natively in <audio> with zero timeouts
    const direct = await resolveDirectAudio(id).catch(() => null);
    if (direct) return direct;
    // 2. Server-side stream proxy fallback
    return resolveApiUrl(`/api/stream/${id}/audio`);
  }
  return resolveApiUrl(`/api/stream/${id}/video?q=${quality}`);
};

/** Saves a text file the way this platform does it: a browser download (the desktop app shows "Save as"). */
export async function saveFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

interface PlaybackPlugin {
  update(options: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: string;
    playing?: boolean;
    position?: number;
    duration?: number;
  }): Promise<void>;
  addListener(event: "action", fn: (e: { action: string; position?: number }) => void): Promise<PluginListenerHandle>;
}

const noop = async () => {};
const Playback = registerPlugin<PlaybackPlugin>("MusikePlayback", {
  web: () => ({ update: noop, addListener: async () => ({ remove: noop }) }),
});

interface MessageBridge {
  postMessage(message: unknown): void;
}

const iosBridge =
  typeof globalThis !== "undefined"
    ? (globalThis as { webkit?: { messageHandlers?: { musikeMedia?: MessageBridge } } }).webkit?.messageHandlers?.musikeMedia
    : undefined;

let lastMedia = { playing: false, position: 0, at: 0 };

function worthSendingMedia(playing: boolean, position: number): boolean {
  const now = Date.now();
  const expected = lastMedia.playing ? lastMedia.position + (now - lastMedia.at) / 1000 : lastMedia.position;
  if (playing === lastMedia.playing && Math.abs(position - expected) < 2 && now - lastMedia.at < 15_000) return false;
  lastMedia = { playing, position, at: now };
  return true;
}

const androidSystemMedia: SystemMedia = {
  setTrack(track) {
    lastMedia = { playing: lastMedia.playing, position: 0, at: Date.now() };
    void Playback.update({
      title: track.title,
      artist: track.artist,
      album: track.album || "",
      artwork: track.artwork || "",
      position: 0,
    });
  },
  setState({ playing, position, duration }) {
    if (!worthSendingMedia(playing, position)) return;
    void Playback.update({
      playing,
      position: Math.max(0, position),
      duration: Number.isFinite(duration) ? duration : 0,
    });
  },
  onAction(handler) {
    void Playback.addListener("action", (e) => {
      if (e?.action) {
        handler(e.action as Parameters<typeof handler>[0], e.position);
      }
    });
  },
};

const iosSystemMedia: SystemMedia = {
  setTrack(track) {
    lastMedia = { playing: lastMedia.playing, position: 0, at: Date.now() };
    iosBridge?.postMessage({ type: "track", ...track, position: 0 });
  },
  setState({ playing, position, duration }) {
    if (!worthSendingMedia(playing, position)) return;
    iosBridge?.postMessage({ type: "state", playing, position, duration: Number.isFinite(duration) ? duration : 0 });
  },
  onAction(handler) {
    (globalThis as { __musikeMediaAction?: (action: string, position?: number) => void }).__musikeMediaAction = (
      action,
      position,
    ) => handler(action as Parameters<typeof handler>[0], position);
  },
};

/** Native media controls bridge for Android APK (lock screen notification, background audio, bluetooth/headphone controls) */
export const systemMedia: SystemMedia = iosBridge ? iosSystemMedia : androidSystemMedia;

/** What this build can do. The Android build has no video yet, no yt-dlp to manage, and retries expired streams. */
export const capabilities = { video: false, engineSettings: false, retryOnError: true };

/** Media elements hide the HTTP error body; fetch it to show the real reason. */
export async function explainStreamError(url: string): Promise<{ message: string; code?: ErrorCode }> {
  invalidateDirectAudio(url);
  const t = getT();
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-0", [LANG_HEADER]: getLang() } });
    if (res.ok) return { message: t.player.browserCantPlay };
    const body = await res.json().catch(() => ({}));
    return { message: body.error ?? t.player.httpError(res.status), code: body.code };
  } catch {
    return { message: t.player.serverDown };
  }
}
