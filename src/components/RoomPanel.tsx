import {
  BroadcastIcon,
  ChatCircleDotsIcon,
  CheckIcon,
  CopyIcon,
  CrownSimpleIcon,
  DeviceMobileIcon,
  GlobeIcon,
  HeadphonesIcon,
  LockSimpleIcon,
  PaperPlaneRightIcon,
  PlusIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
  UserMinusIcon,
  UsersIcon,
  XIcon,
} from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import type { RoomApi } from "../hooks/useRoom";
import { cn } from "../lib/format";
import { AVATARS, avatarName, savedAvatar, savedNickname } from "../lib/room";
import { selectCurrent, usePlayer } from "../player/player";
import { Artwork } from "./Artwork";
import { AvatarArt } from "./AvatarArt";
import { Equalizer } from "./Brand";
import { Modal } from "./Modal";

function getAvatarStyle(name: string, isMe = false): React.CSSProperties {
  if (isMe) {
    return {
      background: "linear-gradient(135deg, var(--accent) 0%, var(--surface-3) 100%)",
      color: "var(--accent-ink)",
    };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h}, 70%, 55%) 0%, hsl(${(h + 40) % 360}, 75%, 40%) 100%)`,
    color: "#ffffff",
  };
}

const PERM_LABELS: Array<[keyof RoomApi["permissions"], string]> = [
  ["play_pause", "Allow members to play & pause"],
  ["next", "Allow members to skip tracks"],
  ["seek", "Allow members to seek track position"],
  ["add_song", "Allow members to queue tracks"],
];

export function RoomPanel({
  room,
  onToast,
  }: {
  open?: boolean;
  onClose?: () => void;
  room: RoomApi;
  onToast: (msg: string) => void;
  inline?: boolean;
  }) {
  const currentTrack = usePlayer(selectCurrent);
  const isPlaying = usePlayer((s) => s.status === "playing");

  const [nick, setNick] = useState(() => savedNickname());

  // Emoji avatar mirror (roster + chat share it). useRoom owns the saved value; mirror for instant UI.
  const [avatar, setAvatar] = useState<number>(() => {
    const initial = typeof room.avatar === "number" && room.avatar >= 0 ? room.avatar : savedAvatar();
    return initial;
  });
  useEffect(() => {
    if (typeof room.avatar === "number" && room.avatar >= 0) setAvatar(room.avatar);
  }, [room.avatar]);

  // Profile editor (name + emoji avatar) — editable any time via Edit Identity.
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(() => nick);
  const [profileAvatar, setProfileAvatar] = useState<number>(() => avatar);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const openProfileEditor = () => {
    setProfileName(nick);
    setProfileAvatar(avatar);
    setProfileOpen(true);
  };

  const saveProfile = (): boolean => {
    if (!room.updateNickname(profileName.trim())) {
      profileInputRef.current?.focus();
      return false;
    }
    if (!room.updateAvatar(profileAvatar)) {
      onToast("Please pick an avatar");
      profileInputRef.current?.focus();
      return false;
    }
    setNick(profileName.trim());
    return true;
  };

  const commitProfile = () => {
    if (saveProfile()) setProfileOpen(false);
  };

  const avatarGrid = (
    <div className="flex flex-col gap-3.5 mb-3.5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">Boys Character Arts</p>
          <span className="text-[10px] text-fg-3 font-mono">8 Avatars</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {AVATARS.slice(0, 8).map((av, i) => (
            <button
              key={`boy-${i}`}
              type="button"
              onClick={() => setProfileAvatar(i)}
              title={`${av.name} • ${av.tag}`}
              className={cn(
                "group relative aspect-square rounded-2xl p-1 border transition-all overflow-hidden flex flex-col items-center justify-center",
                profileAvatar === i
                  ? "border-accent ring-2 ring-accent/60 bg-[var(--accent-soft)] shadow-md scale-105"
                  : "border-line bg-surface-2 hover:bg-surface-3 hover:scale-102"
              )}
            >
              <AvatarArt id={i} className="size-full rounded-xl" />
              {profileAvatar === i && (
                <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-accent text-accent-ink grid place-items-center shadow-xs">
                  <CheckIcon size={9} weight="bold" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">Girls Character Arts</p>
          <span className="text-[10px] text-fg-3 font-mono">8 Avatars</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {AVATARS.slice(8).map((av, i) => (
            <button
              key={`girl-${i}`}
              type="button"
              onClick={() => setProfileAvatar(i + 8)}
              title={`${av.name} • ${av.tag}`}
              className={cn(
                "group relative aspect-square rounded-2xl p-1 border transition-all overflow-hidden flex flex-col items-center justify-center",
                profileAvatar === i + 8
                  ? "border-accent ring-2 ring-accent/60 bg-[var(--accent-soft)] shadow-md scale-105"
                  : "border-line bg-surface-2 hover:bg-surface-3 hover:scale-102"
              )}
            >
              <AvatarArt id={i + 8} className="size-full rounded-xl" />
              {profileAvatar === i + 8 && (
                <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-accent text-accent-ink grid place-items-center shadow-xs">
                  <CheckIcon size={9} weight="bold" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {profileAvatar >= 0 && AVATARS[profileAvatar] && (
        <div className="p-2.5 rounded-xl bg-surface-2 border border-line flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-fg">{AVATARS[profileAvatar].name}</span>
            <span className="text-fg-3">• {AVATARS[profileAvatar].tag}</span>
          </div>
          <span className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">Selected</span>
        </div>
      )}
    </div>
  );

  const profileBody = (
    <>
      <p className="text-xs text-fg-3 mb-3">
        Enter your display name and choose your real avatar art — everyone in the room will see this character portrait.
        Generic names (Guest, Listener) and duplicate room names are not allowed.
      </p>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "size-13 rounded-2xl overflow-hidden shadow-md ring-2 shrink-0 bg-surface-2",
            profileAvatar >= 0 ? "ring-accent/60" : "ring-line"
          )}
        >
          <AvatarArt id={profileAvatar} className="size-full" />
        </div>
        <input
          ref={profileInputRef}
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitProfile();
            }
          }}
          maxLength={24}
          placeholder="Enter your name to continue..."
          className="min-w-0 flex-1 h-11 px-3.5 rounded-xl bg-surface-2 border border-line text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          autoFocus
        />
      </div>
      {avatarGrid}
      <button
        type="button"
        onClick={() => {
          if (saveProfile()) setProfileOpen(false);
        }}
        disabled={profileName.trim().length === 0 || profileAvatar < 0}
        className={cn(
          "w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
          profileName.trim() && profileAvatar >= 0
            ? "bg-accent text-accent-ink hover:brightness-105 active:scale-[0.98] shadow-md"
            : "bg-surface-2 text-fg-3 cursor-not-allowed border border-line"
        )}
      >
        <CheckIcon size={16} weight="bold" /> Save Profile
      </button>
    </>
  );

  // Profile (name + emoji avatar). Saved once on first visit; re-editable any time from Your Identity.
  // (States + saveProfile are declared above.)

  // Create Room Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [control, setControl] = useState<"host" | "shared">("host");

  // Join Code Form State
  const [joinCode, setJoinCode] = useState("");

  // In-Room State
  const [inRoomTab, setInRoomTab] = useState<"chat" | "info">("chat");
  const [chatDraft, setChatDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const inRoom = room.inRoom;
  const isHost = room.isHost;

  useEffect(() => {
    if (inRoom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [inRoom, room.chat.length, room.typingUsers.length]);

  const copy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast(`Copied ${label} to clipboard`);
  };

  const ensureNick = (): boolean => {
    if (!nick.trim()) {
      onToast("Please set your name in Rooms first");
      openProfileEditor();
      return false;
    }
    return true;
  };

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;
    room.sendChat(text);
    setChatDraft("");
    room.sendTyping(false);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  /* ============================================================ */
  /* 1. LOBBY VIEW (Positioned: Active Rooms -> Create & Join)    */
  /* ============================================================ */
  if (!inRoom) {
      return (
        <div className="flex flex-col gap-3.5 max-w-4xl mx-auto w-full px-2 sm:px-4 py-2 sm:py-3 animate-in fade-in duration-300">
                {/* User Identity Banner — avatar and name update instantly, and can be edited any time */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-surface-1 border border-line shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              title="Change your name & avatar"
              onClick={openProfileEditor}
              className="size-12 rounded-2xl overflow-hidden shadow-md ring-2 ring-accent/40 shrink-0 transition-transform active:scale-95 bg-surface-2"
            >
              <AvatarArt id={avatar} className="size-full" />
            </button>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider font-semibold text-fg-3">Your Identity</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-semibold text-fg truncate">{nick || "Anonymous Listener"}</span>
                <span className="shrink-0 text-[10px] font-mono text-fg-3 px-1.5 py-0.5 rounded bg-surface-2 border border-line">
                  {avatar >= 0 ? avatarName(avatar) : "no avatar"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openProfileEditor}
            className="shrink-0 px-3 h-9 rounded-xl bg-surface-3 hover:bg-surface-2 border border-line text-xs font-semibold text-fg-2 hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <SparkleIcon size={14} /> Edit
          </button>
        </div>

        {/* Error / Status notices */}
        {(room.status === "denied" || room.status === "closed" || room.status === "error") && (
          <div className="p-3.5 rounded-2xl bg-danger/10 border border-danger/25 text-sm text-danger flex items-center gap-2.5">
            <XIcon size={18} />
            <span>
              {room.status === "denied"
                ? "Your join request was declined by the room host."
                : room.status === "closed"
                ? "The room was closed by the host."
                : "Unable to connect to the requested room. Please verify the code."}
            </span>
          </div>
        )}

        {/* Active Rooms Section (Positioned on top of Create A Room section) */}
        <div className="p-5 rounded-2xl bg-surface-1 border border-line flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <BroadcastIcon size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-fg">Active Rooms</h3>
                  {room.publicRooms.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-soft)] text-[var(--accent-text)] border border-accent/20">
                      <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                      Live Now
                    </span>
                  )}
                </div>
                <p className="text-xs text-fg-3">Browse and instantly join ongoing listening sessions</p>
              </div>
            </div>
            <span className="text-xs text-fg-3 font-mono px-2.5 py-1 rounded-lg bg-surface-2 border border-line">
              {room.publicRooms.length} {room.publicRooms.length === 1 ? "room online" : "rooms online"}
            </span>
          </div>

          {room.publicRooms.length === 0 ? (
            <div className="py-4 px-4 rounded-xl bg-surface-2/40 border border-line/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="size-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)] grid place-items-center shrink-0">
                  <BroadcastIcon size={18} className="animate-pulse" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">No public broadcast sessions active right now</p>
                  <p className="text-xs text-fg-3">Host your own session below or enter a private invite code to join a room.</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex text-[11px] font-mono px-2.5 py-1 rounded-md bg-surface-3 text-fg-3 border border-line shrink-0">
                0 live
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {room.publicRooms.map((r) => (
                <div
                  key={r.code}
                  className="p-4 rounded-xl bg-surface-2 hover:bg-surface-3/80 border border-line hover:border-accent/40 transition-all flex flex-col justify-between gap-3 shadow-xs group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-fg truncate group-hover:text-accent transition-colors">
                        {r.name}
                      </h4>
                      <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-3 text-fg-2 shrink-0 border border-line">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {r.count} online
                      </span>
                    </div>
                    <p className="text-xs text-fg-3 mt-1.5 flex items-center gap-1.5 truncate">
                      <span className="size-4 rounded-full bg-surface-3 text-[10px] grid place-items-center font-bold text-fg-2">
                        {(r.hostName || "H")[0].toUpperCase()}
                      </span>
                      <span>Host: {r.hostName || "Host"}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!ensureNick()) return;
                      room.joinRoom(r.code, nick);
                    }}
                    className="w-full h-8 rounded-lg bg-accent text-accent-ink font-semibold text-xs hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <HeadphonesIcon size={14} weight="bold" /> Join Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Grid: Create & Join */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Create Room Card */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-line flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <PlusIcon size={20} weight="bold" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-fg">Create a Room</h3>
                <p className="text-xs text-fg-3">Host a listening session with synchronized playback</p>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-medium text-fg-2 block mb-1">Room Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${nick || "Host"}'s Session`}
                  maxLength={40}
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-line text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-fg-2 block mb-1">Room Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("public")}
                    className={cn(
                      "flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-medium border transition-all",
                      type === "public"
                        ? "bg-[var(--accent-soft)] border-accent text-[var(--accent-text)] font-semibold shadow-xs"
                        : "bg-surface-2 border-line text-fg-2 hover:bg-surface-3"
                    )}
                  >
                    <GlobeIcon size={16} /> Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("private")}
                    className={cn(
                      "flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-medium border transition-all",
                      type === "private"
                        ? "bg-[var(--accent-soft)] border-accent text-[var(--accent-text)] font-semibold shadow-xs"
                        : "bg-surface-2 border-line text-fg-2 hover:bg-surface-3"
                    )}
                  >
                    <LockSimpleIcon size={16} /> Private
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-2 block mb-1">Playback Control</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setControl("host")}
                    className={cn(
                      "flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-medium border transition-all",
                      control === "host"
                        ? "bg-[var(--accent-soft)] border-accent text-[var(--accent-text)] font-semibold shadow-xs"
                        : "bg-surface-2 border-line text-fg-2 hover:bg-surface-3"
                    )}
                  >
                    <CrownSimpleIcon size={16} /> Host Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setControl("shared")}
                    className={cn(
                      "flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-medium border transition-all",
                      control === "shared"
                        ? "bg-[var(--accent-soft)] border-accent text-[var(--accent-text)] font-semibold shadow-xs"
                        : "bg-surface-2 border-line text-fg-2 hover:bg-surface-3"
                    )}
                  >
                    <UsersIcon size={16} /> Shared
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!ensureNick()) return;
                  room.createRoom({
                    name: name.trim() || `${nick || "Host"}'s Session`,
                    type,
                    requireApproval: false,
                    control,
                    chatEnabled: true,
                    voiceEnabled: false,
                    nickname: nick,
                  });
                }}
                className="w-full h-11 mt-2 rounded-xl bg-accent text-accent-ink font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <SparkleIcon size={18} weight="bold" /> Start Room
              </button>
            </div>
          </div>

          {/* Join with Code Card */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-line flex flex-col justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-surface-3 text-fg-2">
                  <BroadcastIcon size={20} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-fg">Join with Code</h3>
                  <p className="text-xs text-fg-3">Enter an invite code to join an active room</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium text-fg-2 block mb-1">Room Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AB12CD"
                    maxLength={10}
                    className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-line text-base font-mono uppercase tracking-widest text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!ensureNick()) return;
                    if (!joinCode.trim()) {
                      onToast("Please enter a room code");
                      return;
                    }
                    room.joinRoom(joinCode.trim(), nick);
                  }}
                  className="w-full h-11 rounded-xl bg-surface-3 hover:bg-surface-4 text-fg font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-line-strong"
                >
                  Join Room
                </button>
              </div>
            </div>

            {/* Hint Box */}
            <div className="p-3 rounded-xl bg-surface-2/60 border border-line text-xs text-fg-3 flex items-start gap-2">
              <HeadphonesIcon size={16} className="shrink-0 text-[var(--accent-text)] mt-0.5" />
              <span>Music streams and position sync automatically across all listeners in the room.</span>
            </div>
          </div>
        </div>

        {/* Identity editing any time: closable popup */}
        <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Your Identity" center>
          {profileBody}
        </Modal>
      </div>
    );
  }

  /* ============================================================ */
  /* 2. ACTIVE ROOM STUDIO (Dynamic, Fits Screen, Zero Overlap)    */
  /* ============================================================ */
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden max-w-6xl mx-auto w-full px-2 sm:px-4 pt-1 pb-2 sm:py-2">
      {/* Top Header Bar */}
      <div className={cn(
        "flex shrink-0 items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-surface-1/95 backdrop-blur-md border border-line mb-2 shadow-sm",
        ""
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={getAvatarStyle(room.room?.name || "Room", false)}
            className="size-10 rounded-full shrink-0 grid place-items-center font-bold text-sm shadow ring-2 ring-accent/30"
          >
            {(room.room?.name || "R")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-fg truncate">{room.room?.name || "Live Session"}</h2>
              <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] border border-accent/35 text-[11px] text-[var(--accent-text)] font-mono font-medium">
                <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <button
                onClick={() => copy(room.room?.code || "", "Room Code")}
                className="flex items-center gap-1 text-xs font-mono text-fg-3 hover:text-[var(--accent-text)] transition-colors"
                title="Click to copy code"
              >
                <span>Code: {room.room?.code}</span>
                {copied ? <CheckIcon size={12} className="text-emerald-400" /> : <CopyIcon size={12} />}
              </button>
              <span className="text-fg-3 text-xs">•</span>
              <span className="text-xs text-fg-3">{room.members.length} listening</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Leave Button */}
          <button
            type="button"
            onClick={() => room.leave()}
            aria-label="Leave Room"
            className="size-9 sm:size-auto sm:px-3 sm:py-1.5 grid place-items-center sm:flex sm:items-center sm:gap-1.5 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-xs font-semibold transition-all active:scale-95"
          >
            <SignOutIcon size={16} />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden shrink-0 grid-cols-2 grid gap-1.5 mb-2 p-1 rounded-xl bg-surface-1 border border-line">
        <button
          type="button"
          onClick={() => setInRoomTab("chat")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            inRoomTab === "chat" ? "bg-accent text-accent-ink shadow-xs" : "text-fg-3 hover:text-fg"
          )}
        >
          <ChatCircleDotsIcon size={16} />
          <span>Live Chat ({room.chat.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setInRoomTab("info")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            inRoomTab === "info" ? "bg-accent text-accent-ink shadow-xs" : "text-fg-3 hover:text-fg"
          )}
        >
          <UsersIcon size={16} />
          <span>Music & Listeners ({room.members.length})</span>
        </button>
      </div>

      {/* Studio Viewport (2 Columns on Desktop, Full Single View on Mobile) */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {/* Left Column: Now Playing & Listeners List */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-88 shrink-0 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1",
            inRoomTab === "chat" ? "hidden md:flex" : "flex"
          )}
        >
          {/* Synchronized Playback Card */}
          <div className="p-4 rounded-2xl bg-surface-1 border border-line flex flex-col gap-3 shadow-sm shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeadphonesIcon size={18} className="text-[var(--accent-text)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-fg-3">Synced Playback</h3>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--accent-text)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full border border-accent/20">
                <Equalizer live={isPlaying} className="h-2.5 shrink-0" />
                <span>{isPlaying ? "Playing" : "Paused"}</span>
              </span>
            </div>

            {currentTrack ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-2 border border-line">
                <Artwork src={currentTrack.thumb || currentTrack.art} className="size-12 rounded-lg shrink-0 shadow-xs" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-fg truncate">{currentTrack.title}</h4>
                  <p className="text-[11px] text-fg-3 truncate mt-0.5">{currentTrack.artist || "Unknown Artist"}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-2 text-center text-xs text-fg-3">
                No track active. Play a song from CReEPUSIK to share with the room.
              </div>
            )}

            <div className="text-[11px] text-fg-3 flex items-center justify-between pt-1 border-t border-line/60">
              <span>Control Mode:</span>
              <span className="font-semibold text-fg-2">
                {isHost ? "Host Controlling Playback" : "Synchronized with Room"}
              </span>
            </div>
          </div>

          {/* Listeners List Card */}
          <div className="p-4 rounded-2xl bg-surface-1 border border-line flex flex-col gap-3 flex-1 min-h-[160px] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UsersIcon size={18} className="text-fg-2" />
                <h3 className="text-sm font-semibold text-fg">Listeners</h3>
              </div>
              <span className="text-xs font-mono text-fg-3 px-2 py-0.5 rounded-full bg-surface-2 border border-line">
                {room.members.length} online
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">
              {room.members.map((m) => {
                const isUserHost = m.role === "host" || m.role === "owner";
                const isMe = m.id === room.me;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-2/60 border border-line hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-full overflow-hidden shadow-xs shrink-0 ring-1 ring-line/60 bg-surface-3">
                        {typeof m.avatar === "number" && m.avatar >= 0 ? (
                          <AvatarArt id={m.avatar} className="size-full" />
                        ) : (
                          <div
                            style={getAvatarStyle(m.nickname, isMe)}
                            className="size-full grid place-items-center font-bold text-xs"
                          >
                            {m.nickname[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-fg truncate">
                          {m.nickname} {isMe && "(You)"}
                        </span>
                        {m.apk && (
                          <span
                            className="shrink-0"
                            title="Joined from the CReEPUSIK Android app"
                            aria-label="Joined from the CReEPUSIK Android app"
                          >
                            <DeviceMobileIcon size={13} weight="fill" className="text-[var(--accent-text)]" />
                          </span>
                        )}
                        <span className="text-[10px] text-fg-3 font-mono">
                          {isUserHost ? "Session Host" : "Listener"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUserHost && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                          <CrownSimpleIcon size={12} weight="fill" /> {m.role === "owner" ? "Owner" : "Co-Host"}
                        </span>
                      )}

                      {isHost && !isMe && m.role !== "owner" && (
                        <div className="flex items-center gap-1">
                          {room.isOwner && (
                            <>
                              <button
                                type="button"
                                title={m.role === "host" ? "Demote to listener" : "Promote to Co-Host"}
                                onClick={() => {
                                  if (m.role === "host") room.demoteHost(m.id);
                                  else room.promoteToHost(m.id);
                                }}
                                className="p-1 rounded-lg bg-surface-3 hover:bg-surface-2 text-fg-2 hover:text-accent border border-line text-[11px] transition-colors"
                              >
                                <SparkleIcon size={13} />
                              </button>
                              <button
                                type="button"
                                title="Transfer room ownership"
                                onClick={() => {
                                  if (window.confirm(`Transfer host of this room to ${m.nickname}?`)) {
                                    room.transferHost(m.id);
                                  }
                                }}
                                className="p-1 rounded-lg bg-surface-3 hover:bg-surface-2 text-fg-2 hover:text-amber-400 border border-line text-[11px] transition-colors"
                              >
                                <CrownSimpleIcon size={13} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            title="Remove listener"
                            onClick={() => {
                              if (window.confirm(`Remove ${m.nickname} from this room?`)) {
                                room.kick(m.id, false);
                              }
                            }}
                            className="p-1 rounded-lg bg-surface-3 hover:bg-red-500/20 text-fg-3 hover:text-red-400 border border-line text-[11px] transition-colors"
                          >
                            <UserMinusIcon size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="p-4 rounded-2xl bg-surface-1 border border-line flex flex-col gap-3 shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontalIcon size={18} className="text-fg-2" />
                <h3 className="text-sm font-semibold text-fg">Host Controls</h3>
              </div>
              <div className="flex flex-col gap-2">
                {PERM_LABELS.map(([key, label]) => {
                  const allowed = room.permissions[key];
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between p-2 rounded-xl bg-surface-2/60 border border-line text-xs text-fg-2 cursor-pointer hover:bg-surface-2 transition-colors"
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={allowed}
                        onChange={(e) => {
                          room.updatePermissions({
                            ...room.permissions,
                            [key]: e.target.checked,
                          });
                        }}
                        className="rounded border-line-strong text-accent focus:ring-accent"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Live Chat Column */}
        <div
          className={cn(
            "flex-1 flex flex-col rounded-2xl bg-surface-1 border border-line overflow-hidden min-h-0 shadow-sm",
            inRoomTab !== "chat" ? "hidden md:flex" : "flex"
          )}
        >
          {/* Chat Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-line bg-surface-1/90 backdrop-blur">
            <div className="flex items-center gap-2">
              <ChatCircleDotsIcon size={18} className="text-[var(--accent-text)]" />
              <span className="text-sm font-semibold text-fg">Live Room Chat</span>
            </div>
            <span className="text-xs font-mono text-fg-3">{room.chat.length} messages</span>
          </div>

          {/* Mobile Only: Compact Synced Track Bar inside Chat */}
          {currentTrack && (
            <div className="md:hidden shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-surface-2/70 border-b border-line text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Equalizer live={isPlaying} className="h-3 shrink-0 text-accent" />
                <span className="font-semibold text-fg truncate">{currentTrack.title}</span>
                <span className="text-fg-3 truncate">- {currentTrack.artist}</span>
              </div>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
            {room.chat.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-fg-3">
                <ChatCircleDotsIcon size={36} className="mb-2 text-fg-3/50" />
                <p className="text-sm font-medium text-fg-2">No messages yet</p>
                <p className="text-xs text-fg-3 mt-1">Say hello to everyone in the room!</p>
              </div>
            ) : (
              room.chat.map((m) => {
                const isMine = m.userId === room.me;
                if (m.system) {
                  return (
                    <div key={m.id} className="text-center py-1">
                      <span className="text-[11px] font-medium text-fg-3 px-3 py-1 rounded-full bg-surface-2 border border-line">
                        {m.message}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={cn("flex gap-2.5 max-w-[85%] sm:max-w-[75%]", isMine ? "ml-auto flex-row-reverse" : "")}
                  >
                    {!isMine && (
                      <div className="size-8 rounded-full shrink-0 overflow-hidden shadow-xs ring-1 ring-line/60 bg-surface-3">
                        {typeof m.avatar === "number" && m.avatar >= 0 ? (
                          <AvatarArt id={m.avatar} className="size-full" />
                        ) : (
                          <div
                            style={getAvatarStyle(m.nickname, false)}
                            className="size-full grid place-items-center font-bold text-xs"
                          >
                            {m.nickname[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      {!isMine && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="text-[11px] font-semibold text-fg-2">{m.nickname}</span>
                          {room.members.find((mb) => mb.id === m.userId)?.apk && (
                            <span
                              title="Joined from the CReEPUSIK Android app"
                              aria-label="Joined from the CReEPUSIK Android app"
                              className="shrink-0"
                            >
                              <DeviceMobileIcon size={12} weight="fill" className="text-[var(--accent-text)]" />
                            </span>
                          )}
                          <span className="text-[10px] text-fg-3 font-mono ml-0.5">
                            {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed break-words",
                          isMine
                            ? "bg-[var(--accent-soft)] border border-accent/40 text-fg rounded-tr-none shadow-xs font-normal"
                            : "bg-surface-2 border border-line text-fg rounded-tl-none shadow-xs"
                        )}
                      >
                        {m.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {room.typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-fg-3 px-2 py-1">
                <span className="size-1.5 rounded-full bg-accent animate-bounce" />
                <span className="size-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                <span className="size-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                <span className="font-medium text-fg-2">
                  {room.typingUsers.join(", ")} {room.typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Dock */}
          <form
            onSubmit={handleSendChat}
            className="shrink-0 p-2.5 sm:p-3 border-t border-line bg-surface-1/95 backdrop-blur flex items-center gap-2"
          >
            <input
              type="text"
              value={chatDraft}
              onChange={(e) => {
                setChatDraft(e.target.value);
                room.sendTyping(e.target.value.length > 0);
              }}
              onKeyDown={handleChatKeyDown}
              placeholder="Send a message to the room..."
              className="flex-1 h-10 sm:h-11 px-3.5 sm:px-4 rounded-full bg-surface-2 border border-line text-xs sm:text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
            <button
              type="submit"
              disabled={!chatDraft.trim()}
              className={cn(
                "size-10 sm:size-11 rounded-full grid place-items-center transition-all shrink-0",
                chatDraft.trim()
                  ? "bg-accent text-accent-ink hover:brightness-110 active:scale-95 shadow-md"
                  : "bg-surface-2 text-fg-3 cursor-not-allowed border border-line"
              )}
            >
              <PaperPlaneRightIcon size={18} weight="fill" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
