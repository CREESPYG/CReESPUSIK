import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AgoraVoiceManager } from "../lib/agora";
import { backgroundKeepAlive } from "../lib/backgroundKeepAlive";
import { notify as notifyBrowserEvent, requestNotificationPermission } from "../lib/notify";
import type { Member, MemberRole, VoiceParticipant } from "../lib/room";
import { getTabSessionId } from "../lib/room";
import { voiceJoinChime, voiceDropChime } from "../lib/tones";

/**
 * The Agora engine is a heavy chunk — load it only the first time the user
 * actually joins voice, so the app's initial bundle stays lean.
 */
let agoraLoadPromise: Promise<typeof import("../lib/agora")> | null = null;
function loadAgoraEngine(): Promise<typeof import("../lib/agora")> {
  if (!agoraLoadPromise) {
    agoraLoadPromise = import("../lib/agora");
  }
  return agoraLoadPromise;
}

export type VoiceStatus =
  | "disconnected"
  | "requesting_mic"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "voice_disabled"
  | "mic_blocked";

export interface UseVoiceOptions {
  roomId: string | null;
  channel: RealtimeChannel | null;
  myUserId: string;
  myNickname: string;
  myRole: MemberRole;
  voiceEnabled: boolean;
  members: Member[];
  onToast: (msg: string) => void;
}

function notifyVoiceEvent(title: string, body: string, tag?: string) {
  notifyBrowserEvent(title, body, { tag: tag ? `voice-${tag}` : undefined });
}

export function useVoice({
  roomId,
  channel,
  myUserId,
  myNickname,
  myRole,
  voiceEnabled,
  members,
  onToast,
}: UseVoiceOptions) {
  const [status, setStatus] = useState<VoiceStatus>("disconnected");
  const [selfMuted, setSelfMuted] = useState(false);
  const [hostMuted, setHostMuted] = useState(false);
  const [canSpeak, setCanSpeak] = useState(true);
  const [canHear, setCanHear] = useState(true);
  const [speakingMap, setSpeakingMap] = useState<Record<string, boolean>>({});
  const [voiceUsers, setVoiceUsers] = useState<Map<string, VoiceParticipant>>(new Map());
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>("");
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [, setVolTicker] = useState(0);
  const [lastError, setLastError] = useState<string>("");
  const [captureDeviceLabel, setCaptureDeviceLabel] = useState<string>("");
  // Noise cancellation is ON by default; the preference is per-user persisted.
  const [noiseCancel, setNoiseCancelState] = useState<boolean>(() => {
    try {
      if (localStorage.getItem("creespy_voice_ans") === "0") return false;
    } catch {}
    return true;
  });
  const [manualCreds, setManualCreds] = useState<{ token: string; channel: string }>({ token: "", channel: "" });

  const rtcRef = useRef<AgoraVoiceManager | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(channel);
  chanRef.current = channel;
  const myParticipantRef = useRef<VoiceParticipant | null>(null);
  const missingTimerRef = useRef<Map<string, number>>(new Map());
  // Uids we actually saw in voice — guards the drop chime from stale broadcasts.
  const voiceDropRef = useRef<Set<string>>(new Set());
  const statusRef = useRef<VoiceStatus>(status);
  statusRef.current = status;
  const membersRef = useRef<Member[]>(members);
  membersRef.current = members;
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const boundChannelRef = useRef<RealtimeChannel | null>(null);
  const intentionalLeaveRef = useRef(false);

  const isOwner = myRole === "owner";
  const isHostOrOwner = myRole === "owner" || myRole === "host";

  // Enumerate audio hardware devices
  const loadDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(all.filter((d) => d.kind === "audioinput"));
      setAudioOutputs(all.filter((d) => d.kind === "audiooutput"));
    } catch {}
  }, []);

  useEffect(() => {
    loadDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices);
      return () => navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    }
  }, [loadDevices]);

  /** Send a WebRTC or Voice control signal over Supabase Realtime */
  const sendVoiceBroadcast = useCallback((event: string, payload: any) => {
    const ch = chanRef.current;
    if (!ch) return;
    ch.send({
      type: "broadcast",
      event,
      payload,
    }).catch(() => {});
  }, []);

  /** Leave Room Voice */
  const leaveVoice = useCallback((notify = true) => {
    myParticipantRef.current = null;
    missingTimerRef.current.forEach((t) => window.clearTimeout(t));
    missingTimerRef.current.clear();

    // Mark intentional so the engine's CLOSED event doesn't double-notify.
    intentionalLeaveRef.current = true;
    window.setTimeout(() => {
      intentionalLeaveRef.current = false;
    }, 1200);

    if (rtcRef.current) {
      rtcRef.current.destroy();
      rtcRef.current = null;
    }
    sendVoiceBroadcast("voice_leave", { userId: myUserId });
    setVoiceUsers((prev) => {
      const next = new Map(prev);
      next.delete(myUserId);
      return next;
    });
    setSpeakingMap({});
    setStatus("disconnected");
    setCaptureDeviceLabel("");
    if (notify) {
      onToast("Disconnected from Voice Channel");
      voiceDropChime();
      notifyVoiceEvent("Voice Chat", "Disconnected from Voice Channel", "self-status");
    }
  }, [myUserId, sendVoiceBroadcast, onToast]);

  // Handle voice disabled globally
  useEffect(() => {
    if (!voiceEnabled && statusRef.current !== "disconnected") {
      leaveVoice(false);
      setStatus("voice_disabled");
      onToastRef.current("Voice has been disabled by the host");
    }
  }, [voiceEnabled, leaveVoice]);

  // Leave voice if room changes or user leaves room
  useEffect(() => {
    if (!roomId && status !== "disconnected") {
      leaveVoice(false);
    }
  }, [roomId, leaveVoice]);

  /** Join Room Voice (Opt-In) */
  const joinVoice = useCallback(async () => {
    if (!voiceEnabled) {
      onToast("Voice is currently disabled in this room");
      return;
    }
    if (!roomId) return;

    setStatus("requesting_mic");
    setLastError("");

    let agoraModule: typeof import("../lib/agora");
    try {
      agoraModule = await loadAgoraEngine();
    } catch {
      setStatus("disconnected");
      onToast("Voice engine failed to load. Check your connection and try again.");
      return;
    }
    rtcRef.current = null;

    const mgr = new agoraModule.AgoraVoiceManager(myUserId, {
      onSpeakingChange: (uid, isSpeaking) => {
        setSpeakingMap((prev) => (prev[uid] === isSpeaking ? prev : { ...prev, [uid]: isSpeaking }));
      },
      onConnectionState: (state) => {
        if (state === "connected") {
          setStatus((s) => (s === "reconnecting" ? "connected" : s));
        } else if (state === "reconnecting") {
          setStatus((s) => (s === "connected" || s === "reconnecting" ? "reconnecting" : s));
        } else if (state === "closed") {
          if (!intentionalLeaveRef.current && myParticipantRef.current && statusRef.current !== "disconnected") {
            leaveVoice(true);
          }
        }
      },
      onRemoteJoined: (_uid) => {
        // A voice peer appeared in Agora before we saw their Supabase metadata;
        // ask everyone to re-announce so the roster stays complete.
        sendVoiceBroadcast("voice_query", { from: myUserId });
      },
      onError: (err) => {
        onToast(`Voice notice: ${err}`);
      },
      onMicrophoneDevice: (label) => {
        setCaptureDeviceLabel(label);
      },
    });

    rtcRef.current = mgr;
    mgr.canSpeak = canSpeak;
    mgr.canHear = canHear;
    mgr.selfMuted = selfMuted;
    mgr.hostMuted = hostMuted;

    try {
      const channelName = agoraModule.agoraVoiceChannelName(roomId);
      const tokenProvider = async (): Promise<string | null> => {
        // Ask the app's backend to mint a signed token (used when the Agora
        // project has an App Certificate enabled). Returns null when the
        // backend has no certificate configured.
        try {
          const res = await fetch(
            `/api/agora-token?channel=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(myUserId)}`
          );
          if (!res.ok) return null;
          const data = await res.json().catch(() => null);
          return typeof data?.token === "string" && data.token ? data.token : null;
        } catch {
          return null;
        }
      };
      await mgr.start({
        channel: channelName,
        uid: myUserId,
        deviceId: selectedInput || undefined,
        noiseCancel,
        tokenProvider,
      });
      setStatus("connected");
      onToast("Connected to Voice Channel");
      voiceJoinChime();
      notifyVoiceEvent("Voice Chat", "Connected to Voice Channel", "self-status");
      requestNotificationPermission();

      const meParticipant: VoiceParticipant = {
        userId: myUserId,
        nickname: myNickname,
        role: myRole,
        selfMuted,
        hostMuted,
        canSpeak,
        canHear,
        speaking: false,
        connectedAt: Date.now(),
      };

      myParticipantRef.current = meParticipant;

      setVoiceUsers((prev) => {
        const next = new Map(prev);
        next.set(myUserId, meParticipant);
        return next;
      });

      sendVoiceBroadcast("voice_join", meParticipant);
      sendVoiceBroadcast("voice_query", { from: myUserId });
      loadDevices();
    } catch (err: any) {
      const raw = String(err?.message || err || "");
      if (/NOT_ALLOWED|NotAllowedError|PermissionDeniedError|denied/i.test(raw)) {
        setStatus("mic_blocked");
        setLastError("Microphone permission denied. Please allow microphone access.");
        onToast("Microphone permission denied. Please allow microphone access.");
      } else {
        setStatus("disconnected");
        setLastError(raw.slice(0, 400));
        onToast(`Voice error: ${raw.slice(0, 180)}`);
      }
      mgr.destroy();
      rtcRef.current = null;
      myParticipantRef.current = null;
    }
  }, [
    voiceEnabled,
    roomId,
    myUserId,
    myNickname,
    myRole,
    canSpeak,
    canHear,
    selfMuted,
    hostMuted,
    selectedInput,
    sendVoiceBroadcast,
    onToast,
    loadDevices,
    leaveVoice,
  ]);

  /** Toggle Self Mute */
  const toggleSelfMute = useCallback(() => {
    setSelfMuted((prev) => {
      const next = !prev;
      if (rtcRef.current) {
        rtcRef.current.selfMuted = next;
        rtcRef.current.updateLocalTrackState();
      }
      sendVoiceBroadcast("voice_state", {
        userId: myUserId,
        selfMuted: next,
        hostMuted,
        canSpeak,
        canHear,
      });
      return next;
    });
  }, [myUserId, hostMuted, canSpeak, canHear, sendVoiceBroadcast]);

  /** Set Per-User Local Volume (0% - 150%) */
  const setUserVolume = useCallback((userId: string, volume: number) => {
    rtcRef.current?.setUserVolume(userId, volume);
    setVolTicker((t) => t + 1);
  }, []);

  const getUserVolume = useCallback((userId: string): number => {
    if (rtcRef.current) return rtcRef.current.getUserVolume(userId);
    try {
      const stored = localStorage.getItem(`creespy_voice_vol_${userId}`);
      if (stored !== null) return Math.max(0, Math.min(150, Number(stored)));
    } catch {}
    return 100;
  }, []);

  const toggleLocalMuteUser = useCallback((userId: string): boolean => {
    const res = rtcRef.current?.toggleLocalMuteUser(userId) || false;
    setVolTicker((t) => t + 1);
    return res;
  }, []);

  const isUserLocallyMuted = useCallback((userId: string): boolean => {
    return rtcRef.current?.isUserLocallyMuted(userId) || false;
  }, []);

  /* ---------------- Manual temporary-token credentials (Agora Console) ---------------- */

  const getManualCredentials = useCallback(async (): Promise<{ token: string; channel: string }> => {
    try {
      const m = await loadAgoraEngine();
      const creds = m.getManualAgoraCredentials();
      setManualCreds(creds);
      return creds;
    } catch {
      return { token: "", channel: "" };
    }
  }, []);

  const saveManualCredentials = useCallback(async (token: string, channel: string): Promise<boolean> => {
    try {
      const m = await loadAgoraEngine();
      m.setManualAgoraCredentials(token, channel);
      const creds = m.getManualAgoraCredentials();
      setManualCreds(creds);
      return true;
    } catch {
      return false;
    }
  }, []);

  /** Change Audio Input Device */
  const setAudioInputDevice = useCallback(async (deviceId: string) => {    setSelectedInput(deviceId);
    if (status === "connected" && rtcRef.current) {
      try {
        await rtcRef.current.setMicrophoneDevice(deviceId);
        onToast("Microphone switched");
      } catch {
        onToast("Failed to switch microphone");
      }
    }
  }, [status, onToast]);

  /** Change Audio Output Device */
  const setAudioOutputDevice = useCallback(async (deviceId: string) => {
    setSelectedOutput(deviceId);
    try {
      await rtcRef.current?.setPlaybackDevice(deviceId);
      onToast("Audio output switched");
    } catch {
      onToast("Speaker output selection not supported in this browser");
    }
  }, [onToast]);

  /** Toggle noise cancellation (ANS) — live when connected, persisted always. */
  const setNoiseCancel = useCallback(
    async (on: boolean) => {
      setNoiseCancelState(on);
      try {
        localStorage.setItem("creespy_voice_ans", on ? "1" : "0");
      } catch {}
      if (statusRef.current === "connected" && rtcRef.current) {
        try {
          await rtcRef.current.setNoiseCancellation(on);
          onToast(on ? "Noise cancellation enabled" : "Noise cancellation disabled");
        } catch {
          onToast("Could not apply noise cancellation change");
        }
      } else {
        onToast(on ? "Noise cancellation enabled" : "Noise cancellation disabled");
      }
    },
    [onToast]
  );

  useEffect(() => {
    if (myParticipantRef.current) {
      myParticipantRef.current.selfMuted = selfMuted;
      myParticipantRef.current.hostMuted = hostMuted;
      myParticipantRef.current.canSpeak = canSpeak;
      myParticipantRef.current.canHear = canHear;
      myParticipantRef.current.role = myRole;
      myParticipantRef.current.nickname = myNickname;
    }
  }, [selfMuted, hostMuted, canSpeak, canHear, myRole, myNickname]);

  /* ---------------- Host / Owner Moderation Actions ---------------- */

  const setMemberHostMuted = useCallback((targetUserId: string, muted: boolean) => {
    const targetMember = members.find((m) => m.id === targetUserId);
    if (targetMember?.role === "owner") {
      onToast("Cannot mute the Room Owner");
      return;
    }
    setVoiceUsers((prev) => {
      const existing = prev.get(targetUserId);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(targetUserId, { ...existing, hostMuted: muted });
      return next;
    });
    sendVoiceBroadcast("voice_host_action", {
      targetUserId,
      action: "host_mute",
      value: muted,
      byUserId: myUserId,
    });
    onToast(muted ? `Muted ${targetMember?.nickname || "member"}` : `Unmuted ${targetMember?.nickname || "member"}`);
  }, [members, myUserId, sendVoiceBroadcast, onToast]);

  const setMemberCanSpeak = useCallback((targetUserId: string, allowed: boolean) => {
    const targetMember = members.find((m) => m.id === targetUserId);
    if (targetMember?.role === "owner") {
      onToast("Cannot restrict Room Owner");
      return;
    }
    setVoiceUsers((prev) => {
      const existing = prev.get(targetUserId);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(targetUserId, { ...existing, canSpeak: allowed });
      return next;
    });
    sendVoiceBroadcast("voice_host_action", {
      targetUserId,
      action: "can_speak",
      value: allowed,
      byUserId: myUserId,
    });
    onToast(allowed ? `Allowed talk for ${targetMember?.nickname || "member"}` : `Revoked talk for ${targetMember?.nickname || "member"}`);
  }, [members, myUserId, sendVoiceBroadcast, onToast]);

  const setMemberCanHear = useCallback((targetUserId: string, allowed: boolean) => {
    const targetMember = members.find((m) => m.id === targetUserId);
    if (targetMember?.role === "owner") {
      onToast("Cannot restrict Room Owner");
      return;
    }
    setVoiceUsers((prev) => {
      const existing = prev.get(targetUserId);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(targetUserId, { ...existing, canHear: allowed });
      return next;
    });
    sendVoiceBroadcast("voice_host_action", {
      targetUserId,
      action: "can_hear",
      value: allowed,
      byUserId: myUserId,
    });
    onToast(allowed ? `Enabled hearing for ${targetMember?.nickname || "member"}` : `Muted hearing for ${targetMember?.nickname || "member"}`);
  }, [members, myUserId, sendVoiceBroadcast, onToast]);

  const kickFromVoice = useCallback((targetUserId: string) => {
    const targetMember = members.find((m) => m.id === targetUserId);
    if (targetMember?.role === "owner") {
      onToast("Cannot disconnect Room Owner");
      return;
    }
    setVoiceUsers((prev) => {
      const next = new Map(prev);
      next.delete(targetUserId);
      return next;
    });
    setSpeakingMap((prev) => {
      if (!prev[targetUserId]) return prev;
      const next = { ...prev };
      delete next[targetUserId];
      return next;
    });
    sendVoiceBroadcast("voice_host_action", {
      targetUserId,
      action: "kick_voice",
      value: true,
      byUserId: myUserId,
    });
    onToast(`Disconnected ${targetMember?.nickname || "member"} from voice`);
  }, [members, myUserId, sendVoiceBroadcast, onToast]);

  /* ---------------- Realtime Broadcast Listeners for Voice ---------------- */

  useEffect(() => {
    const ch = channel;
    if (!ch) return;

    if (boundChannelRef.current === ch) return;
    boundChannelRef.current = ch;

    /** Phase 21 — prune voice participants whose heartbeat stops (12s TTL,
     *  heartbeat ticks every 2.5s ≈ 4 missed beats). Re-armed on any activity. */
    const armMissing = (userId: string) => {
      voiceDropRef.current.add(userId);
      const prev = missingTimerRef.current.get(userId);
      if (prev) window.clearTimeout(prev);
      const t = window.setTimeout(() => {
        missingTimerRef.current.delete(userId);
        voiceDropRef.current.delete(userId);
        setVoiceUsers((prevUsers) => {
          if (!prevUsers.has(userId)) return prevUsers;
          // Meet-style farewell when someone silently drops from voice.
          if (statusRef.current === "connected") voiceDropChime();
          const next = new Map(prevUsers);
          next.delete(userId);
          return next;
        });
        setSpeakingMap((prevMap) => {
          if (!prevMap[userId]) return prevMap;
          const next = { ...prevMap };
          delete next[userId];
          return next;
        });
      }, 12000);
      missingTimerRef.current.set(userId, t);
    };

    // A remote peer joined voice
    const onVoiceJoin = ({ payload }: { payload: VoiceParticipant }) => {
      if (!payload || payload.userId === myUserId) return;

      armMissing(payload.userId);

      setVoiceUsers((prev) => {
        const next = new Map(prev);
        next.set(payload.userId, payload);
        return next;
      });

      // Only announce to user if local user is actually active in voice
      if (statusRef.current === "connected" && payload.nickname) {
        onToastRef.current(`${payload.nickname} joined voice`);
        voiceJoinChime();
        notifyVoiceEvent("Voice Chat", `${payload.nickname} joined voice`, `user-${payload.userId}-join`);
      }

      // Reply with our participant metadata so the joiner's roster fills fast
      if (myParticipantRef.current && statusRef.current === "connected") {
        sendVoiceBroadcast("voice_announce", {
          to: payload.userId,
          participant: myParticipantRef.current,
        });
      }
      // Agora handles the audio transport automatically — metadata only.
    };

    const onVoiceQuery = ({ payload }: { payload: { from: string } }) => {
      if (!payload?.from || payload.from === myUserId) return;
      if (myParticipantRef.current && statusRef.current === "connected") {
        sendVoiceBroadcast("voice_announce", {
          to: payload.from,
          participant: myParticipantRef.current,
        });
      }
    };

    const onVoiceAnnounce = ({ payload }: { payload: { to?: string; participant: VoiceParticipant } }) => {
      if (!payload?.participant) return;
      if (payload.to && payload.to !== myUserId) return;
      const p = payload.participant;
      if (p.userId === myUserId) return;

      armMissing(p.userId);

      setVoiceUsers((prev) => {
        const next = new Map(prev);
        next.set(p.userId, p);
        return next;
      });

      // Agora handles audio transport automatically — metadata announce only.
    };

    const onVoiceHeartbeat = ({ payload }: { payload: { participant: VoiceParticipant } }) => {
      if (!payload?.participant) return;
      const p = payload.participant;
      if (p.userId === myUserId) return;

      armMissing(p.userId);

      setVoiceUsers((prev) => {
        const existing = prev.get(p.userId);
        if (
          existing &&
          existing.nickname === p.nickname &&
          existing.role === p.role &&
          existing.selfMuted === p.selfMuted &&
          existing.hostMuted === p.hostMuted &&
          existing.canSpeak === p.canSpeak &&
          existing.canHear === p.canHear &&
          existing.speaking === p.speaking
        ) {
          return prev;
        }
        const next = new Map(prev);
        next.set(p.userId, { ...(existing || {}), ...p });
        return next;
      });
    };

    const onVoiceLeave = ({ payload }: { payload: { userId: string } }) => {
      if (!payload?.userId) return;
      const t = missingTimerRef.current.get(payload.userId);
      if (t) {
        window.clearTimeout(t);
        missingTimerRef.current.delete(payload.userId);
      }
      if (statusRef.current === "connected" && voiceDropRef.current.has(payload.userId)) {
        voiceDropRef.current.delete(payload.userId);
        voiceDropChime();
      }
      setVoiceUsers((prev) => {
        const next = new Map(prev);
        next.delete(payload.userId);
        return next;
      });
      setSpeakingMap((prev) => {
        if (!prev[payload.userId]) return prev;
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
    };

    const onVoiceState = ({ payload }: { payload: any }) => {
      if (!payload?.userId) return;
      setVoiceUsers((prev) => {
        const existing = prev.get(payload.userId);
        if (!existing) return prev;
        const next = new Map(prev);
        next.set(payload.userId, { ...existing, ...payload });
        return next;
      });
    };

    const onVoiceHostAction = ({ payload }: { payload: any }) => {
      if (!payload) return;
      const { targetUserId, action, value } = payload;

      setVoiceUsers((prev) => {
        const existing = prev.get(targetUserId);
        if (!existing) return prev;
        const next = new Map(prev);
        if (action === "host_mute") next.set(targetUserId, { ...existing, hostMuted: value });
        else if (action === "can_speak") next.set(targetUserId, { ...existing, canSpeak: value });
        else if (action === "can_hear") next.set(targetUserId, { ...existing, canHear: value });
        return next;
      });

      if (targetUserId === myUserId) {
        if (action === "host_mute") {
          setHostMuted(value);
          if (rtcRef.current) {
            rtcRef.current.hostMuted = value;
            rtcRef.current.updateLocalTrackState();
          }
          onToastRef.current(value ? "You were muted by the Host" : "Host unmuted your microphone");
        } else if (action === "can_speak") {
          setCanSpeak(value);
          if (rtcRef.current) {
            rtcRef.current.canSpeak = value;
            rtcRef.current.updateLocalTrackState();
          }
          onToastRef.current(value ? "Talk permission granted" : "Talk permission revoked by Host");
        } else if (action === "can_hear") {
          setCanHear(value);
          if (rtcRef.current) {
            rtcRef.current.setCanHear(value);
          }
          onToastRef.current(value ? "Hearing permission enabled" : "Hearing permission disabled by Host");
        } else if (action === "kick_voice") {
          leaveVoice();
          onToastRef.current("You were disconnected from voice by the Host");
        }
      }
    };

    ch.on("broadcast", { event: "voice_join" }, onVoiceJoin);
    ch.on("broadcast", { event: "voice_query" }, onVoiceQuery);
    ch.on("broadcast", { event: "voice_announce" }, onVoiceAnnounce);
    ch.on("broadcast", { event: "voice_heartbeat" }, onVoiceHeartbeat);
    ch.on("broadcast", { event: "voice_leave" }, onVoiceLeave);
    ch.on("broadcast", { event: "voice_state" }, onVoiceState);
    ch.on("broadcast", { event: "voice_host_action" }, onVoiceHostAction);

    return () => {};
  }, [channel, myUserId, sendVoiceBroadcast, leaveVoice]);

  /** Heartbeat emitter when connected to voice */
  useEffect(() => {
    if (status !== "connected" || !myParticipantRef.current) return;
    const unbind = backgroundKeepAlive.onTick(() => {
      if (myParticipantRef.current && statusRef.current === "connected") {
        sendVoiceBroadcast("voice_heartbeat", { participant: myParticipantRef.current });
      }
    });
    return unbind;
  }, [status, sendVoiceBroadcast]);

  /** Auto-resync when switching back to this tab */
  useEffect(() => {
    const handleReSync = () => {
      if (document.visibilityState !== "visible") return;
      if (statusRef.current !== "connected" || !myParticipantRef.current) return;

      // Agora manages its own audio pipeline — nothing to wake.

      sendVoiceBroadcast("voice_query", { from: myUserId });
      sendVoiceBroadcast("voice_announce", { participant: myParticipantRef.current });
    };

    document.addEventListener("visibilitychange", handleReSync);
    window.addEventListener("focus", handleReSync);
    window.addEventListener("pageshow", handleReSync);
    return () => {
      document.removeEventListener("visibilitychange", handleReSync);
      window.removeEventListener("focus", handleReSync);
      window.removeEventListener("pageshow", handleReSync);
    };
  }, [myUserId, sendVoiceBroadcast]);

  // Clean tear-down on unmount
  useEffect(() => {
    return () => {
      missingTimerRef.current.forEach((t) => window.clearTimeout(t));
      missingTimerRef.current.clear();
      if (rtcRef.current) {
        rtcRef.current.destroy();
        rtcRef.current = null;
      }
    };
  }, []);

  const participantsList = useMemo(() => {
    return Array.from(voiceUsers.values()).sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      if (a.role === "host") return -1;
      if (b.role === "host") return 1;
      return a.connectedAt - b.connectedAt;
    });
  }, [voiceUsers]);

  const effectiveMicMuted = !canSpeak || selfMuted || hostMuted;

  return {
    status,
    isInVoice: status === "connected" || status === "reconnecting",
    inVoice: status === "connected" || status === "reconnecting",
    selfMuted,
    hostMuted,
    canSpeak,
    canHear,
    effectiveMicMuted,
    effectiveMicEnabled: !effectiveMicMuted,
    voiceEnabled,
    speakingMap,
    lastError,
    captureDeviceLabel,
    voiceUsers: participantsList,
    participants: participantsList,
    voiceCount: participantsList.length,
    audioInputs,
    audioOutputs,
    selectedInput,
    selectedOutput,
    manualCreds,
    getManualCredentials,
    saveManualCredentials,
    isOwner,
    isHostOrOwner,
    // Actions
    joinVoice,
    leaveVoice,
    toggleSelfMute,
    toggleMic: toggleSelfMute,
    setUserVolume,
    getUserVolume,
    toggleLocalMuteUser,
    isUserLocallyMuted,
    setAudioInputDevice,
    setAudioOutputDevice,
    setNoiseCancel,
    noiseCancel,
    setMemberHostMuted,
    setMemberCanSpeak,
    setMemberCanHear,
    kickFromVoice,
    // Phase 17 — read-only debug telemetry (no secrets/credentials exposed)
    debugGet: () => ({
      roomId,
      channelId: channel?.topic ?? null,
      channelState: channel?.state ?? null,
      status,
      myUserId,
      sessionId: getTabSessionId(),
      visibility: typeof document !== "undefined" ? document.visibilityState : "unknown",
      disconnected: typeof navigator !== "undefined" ? !navigator.onLine : false,
      voiceUserCount: participantsList.length,
      selectedInput: selectedInput || null,
      rtc: rtcRef.current?.debugSnapshot() ?? null,
    }),
  };
}

export type VoiceApi = ReturnType<typeof useVoice>;
