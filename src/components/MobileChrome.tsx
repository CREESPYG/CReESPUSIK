import { BooksIcon, HouseIcon, MagnifyingGlassIcon, RadioIcon, SkipForwardIcon, UsersIcon } from "@phosphor-icons/react";
import { NavLink, useNavigate } from "react-router";
import { cn } from "../lib/format";
import { useT } from "../i18n";
import { NOW_PLAYING_HASH, paths } from "../lib/routes";
import { selectCurrent, usePlayer, useStatusText } from "../player/player";
import { Artwork } from "./Artwork";
import { PlayPauseIcon } from "./Controls";
import { toast } from "../stores/ui";
import { useRoomStore } from "../stores/roomStore";

const tabs = [
  { to: paths.home, key: "home", Icon: HouseIcon, end: true },
  { to: paths.search, key: "search", Icon: MagnifyingGlassIcon, end: false },
  { to: paths.library, key: "library", Icon: BooksIcon, end: false },
  { to: paths.rooms, key: "rooms", Icon: UsersIcon, end: false },
] as const;

export function TabBar() {
  const t = useT();
  const roomApi = useRoomStore((s) => s.roomApi);
  const hasActiveRooms = Boolean((roomApi?.publicRooms?.length ?? 0) > 0);
  const inRoom = Boolean(roomApi?.inRoom);

  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line/75 bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul className="grid h-14 grid-cols-4 items-center">
        {tabs.map(({ to, key, Icon, end }) => {
          const isRooms = key === "rooms";
          return (
            <li key={key} className="h-full">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-full flex-col items-center justify-center gap-1 transition-colors duration-200",
                    isActive ? "text-accent-text" : "text-fg-3 hover:text-fg-2",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon size={20} weight={isActive ? "fill" : "regular"} />
                      {isRooms && (hasActiveRooms || inRoom) && (
                        <span className="absolute -top-1 -right-1.5 flex size-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-emerald-500 ring-1 ring-bg" />
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-medium leading-none">
                      {t.nav[key]}
                      {isRooms && hasActiveRooms && (
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MiniPlayer() {
  const track = usePlayer(selectCurrent);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const status = usePlayer((s) => s.status);
  const statusText = useStatusText();
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const startRadio = usePlayer((s) => s.startRadio);
  const t = useT();
  const navigate = useNavigate();
  if (!track) return null;
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  const handleStartRadio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const roomApi = useRoomStore.getState().roomApi;
    if (roomApi?.inRoom && !roomApi.canPlayPause) {
      toast("🔒 Only host can start radio for the room", "info");
      return;
    }
    void startRadio(track);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const roomApi = useRoomStore.getState().roomApi;
    if (roomApi?.inRoom && !roomApi.canSkip) {
      toast("🔒 Skipping tracks is locked for members in this room", "info");
      return;
    }
    next();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const roomApi = useRoomStore.getState().roomApi;
    if (roomApi?.inRoom && !roomApi.canPlayPause) {
      toast("🔒 Playback control is locked for members in this room", "info");
      return;
    }
    toggle();
  };

  return (
    <div className="fixed inset-x-2 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20">
      <div className="island p-1! shadow-[0_10px_30px_rgb(0_0_0/0.35)]">
        <div className="island-core relative flex h-14 items-center gap-2 overflow-hidden pr-2 pl-1.5">
          <button
            type="button"
            onClick={() => navigate({ hash: NOW_PLAYING_HASH })}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            aria-label={t.player.openNowPlaying(track.title)}
          >
            <Artwork src={track.thumb} className="size-11 rounded-[10px]" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{track.title}</span>
              <span className={cn("block truncate text-xs", status === "error" ? "text-danger" : "text-fg-2")}>
                {statusText ?? track.artist}
              </span>
            </span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleStartRadio}
              aria-label={t.nowPlaying.startRadio}
              className="grid size-9 shrink-0 place-items-center rounded-full text-fg-2 hover:text-accent-text hover:bg-surface-3 active:scale-90 transition-colors"
              title={t.nowPlaying.startRadio}
            >
              <RadioIcon size={19} />
            </button>
            <button
              type="button"
              onClick={handleToggle}
              aria-label={status === "playing" ? t.common.pause : t.common.play}
              className="grid size-10 shrink-0 place-items-center rounded-full text-fg active:scale-90"
            >
              <PlayPauseIcon size={23} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={t.player.next}
              className="grid size-9 shrink-0 place-items-center rounded-full text-fg-2 hover:text-fg active:scale-90 transition-colors"
            >
              <SkipForwardIcon size={19} weight="fill" />
            </button>
          </div>

          <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-surface-4">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </span>
        </div>
      </div>
    </div>
  );
}
