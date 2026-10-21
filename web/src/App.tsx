import { useEffect, useLayoutEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType } from "react-router";
import { AddToPlaylistDialog, ShortcutsDialog } from "./components/Dialogs";
import { MiniPlayer, TabBar } from "./components/MobileChrome";
import { NowPlayingSheet, PanelDrawer, SidePanel } from "./components/NowPlaying";
import { SideChatDrawer } from "./components/SideChatDrawer";
import { PlayerBar } from "./components/PlayerBar";
import { Rail } from "./components/Rail";
import { TitleBar } from "./components/TitleBar";
import { desktop } from "./lib/desktop";
import { SettingsDialog } from "./components/SettingsDialog";
import { Toasts } from "./components/Toasts";
import { TrackMenu } from "./components/TrackMenu";
import { FloatingVideo, Theater } from "./components/Video";
import { MD, useMediaQuery } from "./hooks/useMediaQuery";
import { useShortcuts } from "./hooks/useShortcuts";
import { getT } from "./i18n";
import { capabilities } from "./lib/api";
import { cn } from "./lib/format";
import { legacyRedirect, NOW_PLAYING_HASH, paths } from "./lib/routes";
import { usePlayer } from "./player/player";
import { useLibrary } from "./stores/library";
import { openSettings, useSystem } from "./stores/system";
import { toast, useUi } from "./stores/ui";
import Album from "./views/Album";
import Artist from "./views/Artist";
import BatchSearch from "./views/BatchSearch";
import Collection from "./views/Collection";
import Genre from "./views/Genre";
import Home from "./views/Home";
import Library from "./views/Library";
import Search from "./views/Search";
import Rooms from "./views/Rooms";
import { useRoom } from "./hooks/useRoom";
import { useRoomStore } from "./stores/roomStore";
import { readInviteCode } from "./lib/room";
import type { PlaybackState } from "./lib/room";

const SHEET_HASH = `#${NOW_PLAYING_HASH}`;

export default function App() {
  const location = useLocation();
  const legacy = legacyRedirect(location.pathname, location.search, location.hash);
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const isMd = useMediaQuery(MD);
  const panelOpen = useUi((s) => s.panelOpen);
  const hasTrack = usePlayer((s) => s.queue.length > 0);
  const loadLibrary = useLibrary((s) => s.load);
  const loadSystem = useSystem((s) => s.load);
  const main = useRef<HTMLElement>(null);

  const isApplyingRemoteRef = useRef(false);

  const room = useRoom({
    getPlayback: () => {
      const s = usePlayer.getState();
      const curr = s.queue[s.index];
      if (!curr) return null;
      return {
        videoId: curr.id,
        title: curr.title,
        artist: curr.artist,
        thumb: curr.thumb || curr.art || "",
        isPlaying: s.status === "playing",
        position: s.position,
      };
    },
    applyPlayback: (pb: PlaybackState) => {
      // If remote has no valid song, NEVER pause or interfere with local music!
      if (!pb || !pb.videoId || !pb.videoId.trim()) return;

      isApplyingRemoteRef.current = true;
      try {
        const s = usePlayer.getState();
        const curr = s.queue[s.index];
        if (!curr || curr.id !== pb.videoId) {
          s.playTrack({
            id: pb.videoId,
            title: pb.title || "Track",
            artist: pb.artist || "",
            album: "",
            duration: 0,
            thumb: pb.thumb || "",
            art: pb.thumb || "",
            kind: "song",
          });
        }
        if (pb.position && Math.abs(s.position - pb.position) > 2.5) {
          s.seek(pb.position);
        }
        // ONLY sync play if remote is explicitly playing.
        // Never auto-pause user's existing music when joining a room.
        if (pb.isPlaying && s.status !== "playing") {
          s.toggle();
        }
      } finally {
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 500);
      }
    },
    getQueue: () => usePlayer.getState().queue,
    onToast: (msg: string) => toast(msg, "info"),
  });

  useEffect(() => {
    useRoomStore.getState().setRoomApi(room);
  }, [room]);

  // Synchronize local playback events to the active room when canDrive is true
  useEffect(() => {
    let lastTrackId = "";
    let lastStatus = "";
    const unsub = usePlayer.subscribe((state) => {
      if (isApplyingRemoteRef.current) return;
      const roomApi = useRoomStore.getState().roomApi;
      if (!roomApi || !roomApi.inRoom) return;
      if (!roomApi.canDrive) return;

      const curr = state.queue[state.index];
      const currId = curr?.id || "";
      const status = state.status;

      if (currId !== lastTrackId || status !== lastStatus) {
        lastTrackId = currId;
        lastStatus = status;
        roomApi.pushPlayback();
      }
    });
    return unsub;
  }, []);

  // Auto-navigate to rooms when invite code is present, or redirect to home on refresh
  useEffect(() => {
    try {
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const isReload =
        navEntries.length > 0
          ? navEntries[0].type === "reload"
          : (window.performance as any)?.navigation?.type === 1;

      if (isReload && (location.pathname === paths.rooms || location.pathname.startsWith("/room"))) {
        navigate(paths.home, { replace: true });
        return;
      }
    } catch {}

    const invite = readInviteCode();
    if (invite && location.pathname !== paths.rooms) {
      navigate(paths.rooms);
    }
  }, [location.pathname, navigate]);

  useShortcuts();

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  // Check yt-dlp shortly after start and say so once if something needs doing (not on Android: no yt-dlp there).
  useEffect(() => {
    if (!capabilities.engineSettings) return;
    const t = setTimeout(async () => {
      await loadSystem();
      const info = useSystem.getState().info;
      if (!info) return;
      const t = getT();
      if (!info.ytdlp.path) {
        toast(t.toasts.ytdlpMissing, "error", { label: t.common.install, run: openSettings });
        return;
      }
      const latest = info.ytdlp.latest[info.ytdlp.channel];
      if (info.ytdlp.updateAvailable && latest) {
        try {
          if (sessionStorage.getItem("musike:update-notice") === latest) return;
          sessionStorage.setItem("musike:update-notice", latest);
        } catch {
          /* private mode */
        }
        toast(t.toasts.ytdlpUpdate(latest), "info", { label: t.common.update, run: openSettings });
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [loadSystem]);

  // Where each history entry was scrolled to, so Back returns to the same spot (say, deep in a genre's artists).
  const scrollMemo = useRef(new Map<string, number>());
  const entryKey = useRef(location.key);
  useEffect(() => {
    const el = main.current;
    if (!el) return;
    const onScroll = () => scrollMemo.current.set(entryKey.current, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // New page, back to the top; Back and Forward return to where it was (the sheet hash is not a page change).
  // A layout effect, so the scroll the old page's removal causes is already filed under the new entry.
  useLayoutEffect(() => {
    entryKey.current = location.key;
    const saved = navigationType === "POP" ? scrollMemo.current.get(location.key) : undefined;
    main.current?.scrollTo({ top: 0 });
    // Pages that keep their data (genre, artist) render in full right away, so one frame is enough.
    if (saved) requestAnimationFrame(() => main.current?.scrollTo({ top: saved }));
  }, [location.pathname]);

  const inRoom = Boolean(room.inRoom);
  const lockScroll = inRoom && location.pathname === paths.rooms;

  useEffect(() => {
    if (inRoom && location.pathname === paths.rooms) {
      main.current?.scrollTo({ top: 0 });
    }
  }, [inRoom, location.pathname]);
  const sheetOpen = !isMd && location.hash === SHEET_HASH;
  const closeSheet = () => {
    // Pop the history entry the sheet pushed, so Back and the close button behave the same.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate({ hash: "" }, { replace: true });
  };

  return (
    <div className={cn("grain flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg md:gap-2 md:p-2", desktop && "md:pt-0")}>
      {desktop && <TitleBar />}
      <div className="flex min-h-0 flex-1 overflow-hidden md:gap-2">
        <Rail />
        <main
          ref={main}
          className={cn(
            "relative min-w-0 flex-1 md:rounded-[20px] md:bg-surface-1 md:ring-1 md:ring-line",
            lockScroll ? "overflow-hidden" : "scroll-area overflow-y-auto",
            hasTrack ? "pb-[calc(152px+env(safe-area-inset-bottom))]" : "pb-[calc(88px+env(safe-area-inset-bottom))]",
            "md:pb-0",
          )}
        >
          {legacy ? (
            <Navigate to={legacy} replace />
          ) : (
            <Routes>
              <Route path={paths.home} element={<Home />} />
              <Route path={paths.search} element={<Search />} />
              <Route path={paths.searchList} element={<BatchSearch />} />
              <Route path="/search/genre/:id" element={<Genre />} />
              <Route path="/search/artist/:id" element={<Artist />} />
              <Route path="/search/album/:id" element={<Album />} />
              <Route path={paths.library} element={<Library />} />
              <Route path={paths.rooms} element={<Rooms />} />
              <Route path="/room/:code" element={<Rooms />} />
              <Route path="/rooms/:code" element={<Rooms />} />
              <Route path={paths.favorites} element={<Collection kind="favorites" />} />
              <Route path={paths.history} element={<Collection kind="history" />} />
              <Route path="/playlist/:id" element={<Collection kind="playlist" />} />
              <Route path="*" element={<Home />} />
            </Routes>
          )}
        </main>
        {panelOpen && hasTrack && <SidePanel />}
      </div>

      {isMd ? (
        <PlayerBar />
      ) : (
        <>
          <MiniPlayer />
          <TabBar />
        </>
      )}

      <PanelDrawer />
      <SideChatDrawer />
      <NowPlayingSheet open={sheetOpen} onClose={closeSheet} />
      <FloatingVideo />
      <Theater />
      <TrackMenu />
      <AddToPlaylistDialog />
      <ShortcutsDialog />
      <SettingsDialog />
      <Toasts />
    </div>
  );
}
