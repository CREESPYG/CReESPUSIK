import {
  GlobeIcon,
  CheckIcon,
  PlusIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";
import { useT, type Messages } from "../i18n";
import { cn } from "../lib/format";
import { useLibrary } from "../stores/library";
import { useUi } from "../stores/ui";
import { Artwork } from "./Artwork";
import { Modal } from "./Modal";

export function AddToPlaylistDialog() {
  const tracks = useUi((s) => s.addToPlaylist);
  const close = useUi((s) => s.openAddToPlaylist);
  const playlists = useLibrary((s) => s.playlists);
  const add = useLibrary((s) => s.addToPlaylist);
  const create = useLibrary((s) => s.createPlaylist);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const many = !!tracks && tracks.length > 1;
  const t = useT();

  useEffect(() => {
    if (tracks) {
      setCreating(playlists.length === 0);
      setName("");
    }
  }, [tracks]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!tracks || !name.trim()) return;
    const p = await create(name, tracks, isGlobal);
    if (p) close(null);
  };

  return (
    <Modal
      open={!!tracks}
      onClose={() => close(null)}
      title={many ? t.dialogs.addManyToPlaylist(tracks?.length ?? 0) : t.dialogs.addToPlaylist}
    >
      {creating ? (
        <form onSubmit={onCreate} className="flex flex-col gap-3">
          <label htmlFor="new-playlist" className="text-sm text-fg-2">
            {t.dialogs.newPlaylistName}
          </label>
          <input
            id="new-playlist"
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.dialogs.namePlaceholder}
            className="w-full h-12 rounded-2xl border border-line-strong bg-surface-1 px-4 text-[15px] text-fg placeholder:text-fg-3 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all"
          />

          <div className="flex flex-col gap-1.5 pt-0.5">
            <label className="text-xs font-semibold text-fg-2">Playlist Visibility</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-2 border border-line">
              <button
                type="button"
                onClick={() => setIsGlobal(true)}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all select-none",
                  isGlobal
                    ? "bg-accent text-accent-ink shadow-sm"
                    : "text-fg-2 hover:text-fg hover:bg-surface-3/50"
                )}
              >
                <GlobeIcon size={16} weight={isGlobal ? "bold" : "regular"} />
                <span>Public (Global)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsGlobal(false)}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all select-none",
                  !isGlobal
                    ? "bg-accent text-accent-ink shadow-sm"
                    : "text-fg-2 hover:text-fg hover:bg-surface-3/50"
                )}
              >
                <LockSimpleIcon size={16} weight={!isGlobal ? "bold" : "regular"} />
                <span>Private</span>
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            {playlists.length > 0 && (
              <button type="button" onClick={() => setCreating(false)} className="h-11 rounded-full px-5 text-sm font-medium text-fg-2 hover:text-fg">
                {t.common.back}
              </button>
            )}
            <button
              type="submit"
              disabled={!name.trim()}
              className="h-11 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.97] disabled:opacity-40"
            >
              {t.dialogs.createAndAdd}
            </button>
          </div>
        </form>
      ) : (
        <div className="-mx-1 flex max-h-[55dvh] flex-col overflow-y-auto scroll-area">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-3"
          >
            <span className="grid size-11 place-items-center rounded-[10px] bg-accent-soft text-accent-text">
              <PlusIcon size={20} />
            </span>
            <span className="font-medium">{t.nav.newPlaylist}</span>
          </button>
          {playlists.map((p) => {
            // Done only when it already has every track being added.
            const has = !!tracks && tracks.every((x) => p.tracks.some((t) => t.id === x.id));
            return (
              <button
                key={p.id}
                type="button"
                disabled={has}
                onClick={() => {
                  if (!tracks) return;
                  void add(p.id, many ? tracks : tracks[0]);
                  close(null);
                }}
                className={cn("flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-3", has && "opacity-60")}
              >
                <Artwork src={p.tracks[0]?.thumb} className="size-11 rounded-[10px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block text-sm text-fg-2">{t.common.tracks(p.tracks.length)}</span>
                </span>
                {has && <CheckIcon size={18} className="text-accent-text" />}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export function NamePlaylistDialog({
  open,
  initial = "",
  title,
  action,
  onSubmit,
  onClose,
  allowGlobalToggle = true,
  initialGlobal = true,
}: {
  open: boolean;
  initial?: string;
  title: string;
  action: string;
  onSubmit: (name: string, isGlobal?: boolean) => void;
  onClose: () => void;
  allowGlobalToggle?: boolean;
  initialGlobal?: boolean;
}) {
  const [name, setName] = useState(initial);
  const [isGlobal, setIsGlobal] = useState(initialGlobal);
  const t = useT();

  useEffect(() => {
    if (open) {
      setName(initial);
      setIsGlobal(initialGlobal);
    }
  }, [open, initial, initialGlobal]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name.trim(), isGlobal);
        }}
        className="flex flex-col gap-3.5"
      >
        <div>
          <label htmlFor="playlist-name" className="text-sm font-medium text-fg-2 block mb-1.5">
            {t.dialogs.name}
          </label>
          <input
            id="playlist-name"
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.dialogs.namePlaceholder}
            className="w-full h-12 rounded-2xl border border-line-strong bg-surface-1 px-4 text-[15px] text-fg placeholder:text-fg-3 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all"
          />
        </div>

        {/* Public (Global) vs Private Toggle */}
        {allowGlobalToggle && (
          <div className="flex flex-col gap-1.5 pt-0.5">
            <label className="text-xs font-semibold text-fg-2">Playlist Visibility</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-2 border border-line">
              <button
                type="button"
                onClick={() => setIsGlobal(true)}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all select-none",
                  isGlobal
                    ? "bg-accent text-accent-ink shadow-sm"
                    : "text-fg-2 hover:text-fg hover:bg-surface-3/50"
                )}
              >
                <GlobeIcon size={16} weight={isGlobal ? "bold" : "regular"} />
                <span>Public (Global)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsGlobal(false)}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all select-none",
                  !isGlobal
                    ? "bg-accent text-accent-ink shadow-sm"
                    : "text-fg-2 hover:text-fg hover:bg-surface-3/50"
                )}
              >
                <LockSimpleIcon size={16} weight={!isGlobal ? "bold" : "regular"} />
                <span>Private</span>
              </button>
            </div>
            <p className="text-[11px] text-fg-3 px-1 mt-0.5">
              {isGlobal
                ? "🌐 Synced to Supabase Community — accessible from any device or listener."
                : "🔒 Private playlist — stored locally on your device only."}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-11 rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.97] disabled:opacity-40 shadow-sm"
          >
            {action}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const SHORTCUTS: [string | null, keyof Messages["dialogs"]["shortcuts"]][] = [
  [null, "playPause"], // the Space key, named in each language
  ["← →", "seek"],
  ["Shift + ← →", "skip"],
  ["↑ ↓", "volume"],
  ["M", "mute"],
  ["L", "favorite"],
  ["S", "shuffle"],
  ["R", "repeat"],
  // ["V", "video"],
  // ["F", "theater"],
  ["Q", "queue"],
  ["/", "search"],
  ["?", "help"],
];

export function ShortcutsDialog() {
  const open = useUi((s) => s.shortcutsOpen);
  const setOpen = useUi((s) => s.setShortcutsOpen);
  const t = useT();
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={t.dialogs.shortcutsTitle}>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-sm">
        {SHORTCUTS.map(([keys, what]) => (
          <div key={what} className="contents">
            <dt className="flex justify-end">
              <kbd className="kbd">{keys ?? t.dialogs.space}</kbd>
            </dt>
            <dd className="text-fg-2">{t.dialogs.shortcuts[what]}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
