import { Capacitor } from "@capacitor/core";

/**
 * Room Mode — types & helpers for CREESPY "Listen Together".
 *
 * The realtime layer rides on Supabase Realtime (broadcast + presence). Two
 * channels per room:
 *   room:{code}:lobby  → open; carries join_request / join_response only
 *   room:{code}        → approved host + members only; presence, playback, chat
 *
 * Pending / rejected users never subscribe to the members channel, so private
 * playback & chat aren't delivered to them. For DB-backed persistence and
 * server-enforced RLS, apply supabase/schema.sql (playback still syncs by
 * timestamp, never per-frame writes).
 */

export type RoomType = "public" | "private";
export type MemberRole = "owner" | "host" | "member";
export type PublicControl = "host" | "shared";

export interface Permissions {
  play_pause: boolean;
  next: boolean;
  previous: boolean;
  seek: boolean;
  add_song: boolean;
  queue_control: boolean;
  shuffle: boolean;
  repeat: boolean;
}

export const HOST_ONLY_PERMS: Permissions = {
  play_pause: false,
  next: false,
  previous: false,
  seek: false,
  add_song: false,
  queue_control: false,
  shuffle: false,
  repeat: false,
};

export const SHARED_PERMS: Permissions = {
  play_pause: true,
  next: true,
  previous: true,
  seek: true,
  add_song: true,
  queue_control: false,
  shuffle: false,
  repeat: false,
};

export interface RoomInfo {
  code: string;
  name: string;
  type: RoomType;
  requireApproval: boolean;
  hostId: string; // The Owner of the room (creator)
  hostName: string;
  chatEnabled: boolean;
  voiceEnabled: boolean;
  myId?: string;
}

export type MemberState = "active" | "away" | "reconnecting" | "left";

export interface Member {
  id: string;
  nickname: string;
  name?: string;
  role: MemberRole;
  at: number;
  joinedAt?: number;
  state?: MemberState;
  /** Joined from the Android app (APK) rather than a browser — shown as a phone badge in the roster. */
  apk?: boolean;
  /** Chosen emoji avatar (index into AVATARS), shared to everyone in the room. */
  avatar?: number;
  lastSeen?: number;
  inVoice?: boolean;
  selfMuted?: boolean;
  hostMuted?: boolean;
  canSpeak?: boolean;
  canHear?: boolean;
  speaking?: boolean;
}

export interface VoiceParticipant {
  userId: string;
  nickname: string;
  role: MemberRole;
  selfMuted: boolean;
  hostMuted: boolean;
  canSpeak: boolean;
  canHear: boolean;
  speaking: boolean;
  connectedAt: number;
}

export interface JoinRequest {
  userId: string;
  nickname: string;
  at: number;
}

export type ChatDeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMsg {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  ts: number;
  mine?: boolean;
  system?: boolean;
  status?: ChatDeliveryStatus;
  /** Sender's emoji avatar id at send time, so chat bubbles match the roster. */
  avatar?: number;
}

export interface PlaybackState {
  videoId: string;
  title: string;
  artist: string;
  thumb: string;
  isPlaying: boolean;
  position: number;
  ts: number;
  by: string;
}

export type RoomStatus =
  | "idle"
  | "hosting"
  | "requesting"
  | "waiting"
  | "member"
  | "denied"
  | "closed"
  | "error";

export type ConnState = "connected" | "reconnecting" | "offline";

let memoryTabUid = "";

/**
 * Phase 22 — BROWSER-level identity shared by every tab of this browser.
 * Previously per-tab: two tabs in one browser joined a room as two separate
 * members and double-counted the public directory. Now the id lives in
 * localStorage (shared across tabs), so identical sessions collapse into a
 * single presence/member. A legacy per-tab id on window is adopted on the
 * first call so already-joined sessions keep their identity across upgrade.
 */
export function userId(): string {
  if (typeof window === "undefined") {
    if (!memoryTabUid) {
      memoryTabUid = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
    return memoryTabUid;
  }
  const legacy = (window as any).__CREESPY_UID__;
  if (legacy) {
    try {
      localStorage.setItem("creespy.uid", legacy);
    } catch {
      /* noop */
    }
    return legacy;
  }
  try {
    let id = localStorage.getItem("creespy.uid");
    if (!id) {
      id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("creespy.uid", id);
    }
    (window as any).__CREESPY_UID__ = id;
    return id;
  } catch {
    if (!memoryTabUid) {
      memoryTabUid = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
    return memoryTabUid;
  }
}

export function savedNickname(): string {
  try {
    const raw = (localStorage.getItem("creespy.nick") || "").trim();
    if (!raw || raw === "false" || raw === "null" || raw === "undefined") return "";
    return raw;
  } catch {
    return "";
  }
}

/** Whether this client runs inside the Android app container (APK), so presence meta can carry a device badge. */
export function isAndroidApp(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

/**
 * Shared avatar set: 16 distinct real character art avatars (boys 0–7, girls 8–15).
 * The avatar id is saved locally, carried in room presence meta (`avatar`) and chat messages.
 */
export interface AvatarMeta {
  id: number;
  name: string;
  category: "boy" | "girl";
  tag: string;
}

export const AVATARS: AvatarMeta[] = [
  { id: 0, name: "Cyber Neo", category: "boy", tag: "Techwear & Visor" },
  { id: 1, name: "Audio DJ", category: "boy", tag: "Snapback & Cans" },
  { id: 2, name: "Lofi Chill", category: "boy", tag: "Messy & Knit" },
  { id: 3, name: "Synthwave", category: "boy", tag: "Retro Shades" },
  { id: 4, name: "Urban Fade", category: "boy", tag: "Streetwear & Stud" },
  { id: 5, name: "Scholar", category: "boy", tag: "Classic Frames" },
  { id: 6, name: "Skater Beanie", category: "boy", tag: "Fringe & Beanie" },
  { id: 7, name: "Tech Starlight", category: "boy", tag: "Cyber Spikes" },
  { id: 8, name: "Cyber Pop", category: "girl", tag: "Neon Space Buns" },
  { id: 9, name: "Acoustic Indie", category: "girl", tag: "Beanie & Waves" },
  { id: 10, name: "Chic Bob", category: "girl", tag: "Cat-Eye Shades" },
  { id: 11, name: "RGB Gamer", category: "girl", tag: "Cat Headphones" },
  { id: 12, name: "Solar Queen", category: "girl", tag: "Afro Puffs & Hoops" },
  { id: 13, name: "Star Dreamer", category: "girl", tag: "Pastel & Clips" },
  { id: 14, name: "Lofi Scholar", category: "girl", tag: "Wireframes & Bun" },
  { id: 15, name: "Electro Punk", category: "girl", tag: "Undercut & Biker" },
];

const BOYS_LAST_ID = 7;

export function avatarName(id: number): string {
  return AVATARS[id]?.name ?? "Avatar";
}

/** Legacy helper kept for backward compatibility */
export function avatarEmoji(id: number): string {
  return AVATARS[id]?.name ?? "";
}

/** A stable warm gradient per avatar id, so circles look consistent across devices. */
export function avatarGradientStyle(id: number): { background: string } {
  const hue = Number.isInteger(id) && id >= 0 ? ((id * 47 + 205) % 360 + 360) % 360 : 210;
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 64%, 46%) 0%, hsl(${(hue + 42) % 360}, 66%, 38%) 100%)`,
  };
}

export function isBoysAvatar(id: number): boolean {
  return Number.isInteger(id) && id >= 0 && id <= BOYS_LAST_ID;
}

export const savedAvatar = (): number => {
  try {
    const raw = localStorage.getItem("creespy.avatar");
    const n = raw === null ? -1 : parseInt(raw, 10);
    return Number.isInteger(n) && n >= 0 && n < AVATARS.length ? n : -1;
  } catch {
    return -1;
  }
};

export function saveAvatar(n: number) {
  try {
    if (Number.isInteger(n) && n >= 0 && n < AVATARS.length) {
      localStorage.setItem("creespy.avatar", String(Math.floor(n)));
    }
  } catch {
    /* noop */
  }
}

export function saveNickname(n: string) {
  try {
    const clean = String(n || "").trim().slice(0, 24);
    if (!clean || clean === "false" || clean === "null" || clean === "undefined") return;
    localStorage.setItem("creespy.nick", clean);
  } catch {
    /* noop */
  }
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function genRoomCode(): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export const lobbyChannel = (code: string) => `room:${code.toUpperCase()}:lobby`;
export const roomChannel = (code: string) => `room:${code.toUpperCase()}`;
export const roomChatChannel = (code: string) => `room:${code.toUpperCase()}:chat`;
export const roomSyncChannel = (code: string) => `room:${code.toUpperCase()}:sync`;

/** Global directory — every public-room host announces here; all clients read it. */
export const DIRECTORY_CHANNEL = "creespy:public-rooms";

export interface PublicRoomEntry {
  code: string;
  name: string;
  hostName: string;
  count: number;
  requireApproval: boolean;
  at: number;
}

export function inviteLink(code: string): string {
  const cleanCode = code.toUpperCase();
  const origin = typeof location !== "undefined" && location.origin ? location.origin : "https://creepusik.vercel.app";
  return `${origin}/?room=${cleanCode}#room=${cleanCode}`;
}

export function readInviteCode(): string | null {
  if (typeof location === "undefined") return null;

  // 1. Search Query Params (?room=ABCD, ?code=ABCD, ?join=ABCD)
  try {
    const params = new URLSearchParams(location.search);
    const qRoom = params.get("room") || params.get("code") || params.get("join");
    if (qRoom && /^[A-Za-z0-9]{4,8}$/.test(qRoom.trim())) {
      return qRoom.trim().toUpperCase();
    }
  } catch {}
  const searchMatch = location.search.match(/[?&](?:room|code|join)=([A-Za-z0-9]{4,8})(?:&|$)/i);
  if (searchMatch) return searchMatch[1].toUpperCase();

  // 2. Hash (#room=ABCD, #/room/ABCD, #ABCD)
  const hashMatch = location.hash.match(/(?:room=|room\/|^#)([A-Za-z0-9]{4,8})(?:&|$)/i);
  if (hashMatch) return hashMatch[1].toUpperCase();

  // 3. Path (/room/ABCD, /rooms/ABCD)
  const pathMatch = location.pathname.match(/\/(?:rooms?)\/([A-Za-z0-9]{4,8})/i);
  if (pathMatch) return pathMatch[1].toUpperCase();

  return null;
}

/* ---------------- Room Session Persistence ---------------- */

export interface RoomSession {
  roomCode: string;
  roomName: string;
  role: MemberRole;
  userId: string;
  sessionId: string;
  joinedAt: number;
  voiceAutoReconnect?: boolean;
}

const ROOM_SESSION_KEY = "creespy.room_session.v1";
let currentTabSessionId = "";

export function getTabSessionId(): string {
  if (!currentTabSessionId) {
    if (typeof sessionStorage !== "undefined") {
      let id = sessionStorage.getItem("creespy.tab_session_id");
      if (!id) {
        id = `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
        sessionStorage.setItem("creespy.tab_session_id", id);
      }
      currentTabSessionId = id;
    } else {
      currentTabSessionId = `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    }
  }
  return currentTabSessionId;
}

export function saveRoomSession(session: RoomSession): void {
  try {
    const raw = JSON.stringify(session);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(ROOM_SESSION_KEY, raw);
    }
  } catch {
    /* noop */
  }
}

export function loadRoomSession(): RoomSession | null {
  try {
    const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(ROOM_SESSION_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoomSession;
    if (parsed && parsed.roomCode && parsed.userId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearRoomSession(): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(ROOM_SESSION_KEY);
    }
  } catch {
    /* noop */
  }
}

