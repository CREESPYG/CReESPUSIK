import { DatabaseIcon, GlobeIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Cover, type CoverKind } from "../components/Cover";
import { NamePlaylistDialog } from "../components/Dialogs";
import { PageHeader } from "../components/Page";
import { useT } from "../i18n";
import { paths } from "../lib/routes";
import type { Track } from "../lib/types";
import { IconButton } from "../components/IconButton";
import { useLibrary } from "../stores/library";
import { useUi } from "../stores/ui";
import { cn } from "../lib/format";

function Entry({
  to,
  name,
  kind,
  tracks,
  sub,
  isGlobal,
}: {
  to: string;
  name: string;
  kind: CoverKind;
  tracks: Track[];
  sub: string;
  isGlobal?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-center gap-3 rounded-[16px] p-2 transition-colors hover:bg-surface-2 md:flex-col md:items-stretch md:gap-3 md:p-3 relative"
      >
        <div className="relative">
          <Cover
            kind={kind}
            tracks={tracks}
            iconSize={26}
            className="size-16 shrink-0 rounded-[12px] md:aspect-square md:size-auto md:w-full md:rounded-[14px] md:shadow-[0_12px_32px_rgb(0_0_0/0.3)]"
          />
          {isGlobal && (
            <span
              title="Synced globally from Supabase"
              className="absolute top-1.5 right-1.5 size-5 rounded-full bg-black/60 backdrop-blur-xs text-accent grid place-items-center shadow-xs border border-white/10"
            >
              <GlobeIcon size={12} weight="bold" />
            </span>
          )}
        </div>
        <span className="min-w-0">
          <span className="block truncate font-medium group-hover:text-accent transition-colors">{name}</span>
          <span className="block truncate text-sm text-fg-2">{sub}</span>
        </span>
      </Link>
    </li>
  );
}

export default function Library() {
  const { favorites, playlists, globalPlaylists, history, createPlaylist } = useLibrary();
  const [filter, setFilter] = useState<"all" | "community" | "personal">("all");
  const [creating, setCreating] = useState(false);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const navigate = useNavigate();
  const t = useT();

  const globalIds = new Set(globalPlaylists.map((g) => g.id));
  const personalPlaylists = playlists.filter((p) => !globalIds.has(p.id));

  const displayedPlaylists =
    filter === "community"
      ? globalPlaylists
      : filter === "personal"
      ? personalPlaylists
      : playlists;

  return (
    <div className="pb-8">
      <PageHeader
        title={t.nav.library}
        actions={
          <>
            <IconButton label={t.library.backup} onClick={() => setSettingsOpen(true)}>
              <DatabaseIcon size={20} />
            </IconButton>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-10 items-center gap-1.5 rounded-full bg-accent pr-4 pl-3 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.97]"
            >
              <PlusIcon size={18} weight="bold" /> <span className="hidden sm:inline">{t.nav.newPlaylist}</span>
              <span className="sm:hidden">{t.library.newShort}</span>
            </button>
          </>
        }
      />

      {/* Filter Tabs & Supabase Global Sync Indicator */}
      <div className="flex items-center justify-between px-3 md:px-5 py-2 mb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-2 border border-line text-xs font-medium">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full transition-all",
              filter === "all" ? "bg-accent text-accent-ink font-semibold shadow-xs" : "text-fg-2 hover:text-fg"
            )}
          >
            All ({playlists.length})
          </button>
          <button
            onClick={() => setFilter("community")}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full transition-all",
              filter === "community" ? "bg-accent text-accent-ink font-semibold shadow-xs" : "text-fg-2 hover:text-fg"
            )}
          >
            <GlobeIcon size={13} weight="bold" />
            <span>Community ({globalPlaylists.length})</span>
          </button>
          <button
            onClick={() => setFilter("personal")}
            className={cn(
              "px-3 py-1 rounded-full transition-all",
              filter === "personal" ? "bg-accent text-accent-ink font-semibold shadow-xs" : "text-fg-2 hover:text-fg"
            )}
          >
            Personal ({personalPlaylists.length})
          </button>
        </div>

        {globalPlaylists.length > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[var(--accent-text)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full border border-accent/25">
            <SparkleIcon size={13} weight="fill" />
            <span>Supabase Synced</span>
          </span>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-1 px-2 pt-2 md:grid-cols-3 md:gap-2 md:px-4 lg:grid-cols-4 2xl:grid-cols-6">
        {filter !== "community" && (
          <>
            <Entry
              to={paths.favorites}
              name={t.nav.favorites}
              kind="favorites"
              tracks={favorites}
              sub={t.common.tracks(favorites.length)}
            />
            <Entry
              to={paths.history}
              name={t.nav.recentlyPlayed}
              kind="history"
              tracks={history}
              sub={t.common.tracks(history.length)}
            />
          </>
        )}

        {displayedPlaylists.map((p) => {
          const isGlobal = globalIds.has(p.id);
          return (
            <Entry
              key={p.id}
              to={paths.playlist(p.id)}
              name={p.name}
              kind="playlist"
              tracks={p.tracks}
              sub={isGlobal ? `${p.tracks.length} tracks · Community` : t.library.playlistSub(p.tracks.length)}
              isGlobal={isGlobal}
            />
          );
        })}
      </ul>

      {displayedPlaylists.length === 0 && (
        <p className="px-4 pt-6 text-sm text-fg-2 md:px-6">
          {filter === "community" ? "Connecting to Supabase community playlists..." : t.library.noPlaylists}
        </p>
      )}

      <NamePlaylistDialog
        open={creating}
        title={t.nav.newPlaylist}
        action={t.library.create}
        onClose={() => setCreating(false)}
        onSubmit={async (name) => {
          const p = await createPlaylist(name);
          setCreating(false);
          if (p) navigate(paths.playlist(p.id));
        }}
      />
    </div>
  );
}
