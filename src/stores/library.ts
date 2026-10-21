import { create } from "zustand";
import { getT } from "../i18n";
import { api } from "../lib/api";
import { fetchGlobalPublicPlaylists, subscribeToGlobalPlaylists, publishPlaylistToGlobal, removePlaylistFromGlobal } from "../lib/publicPlaylists";
import type { Library, Playlist, Track } from "../lib/types";
import { toast } from "./ui";

interface LibraryState extends Library {
  status: "idle" | "loading" | "ready" | "error";
  globalPlaylists: Playlist[];
  load: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (t: Track) => Promise<void>;
  addFavorites: (tracks: Track[]) => Promise<void>;
  recordPlay: (t: Track) => void;
  createPlaylist: (name: string, tracks?: Track[], makeGlobal?: boolean) => Promise<Playlist | null>;
  publishToGlobal: (id: string) => Promise<boolean>;
  removeFromGlobal: (id: string) => Promise<boolean>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (id: string, t: Track | Track[]) => Promise<void>;
  removeFromPlaylist: (id: string, trackId: string) => Promise<void>;
}

const replacePlaylist = (list: Playlist[], p: Playlist) => list.map((x) => (x.id === p.id ? p : x));

export const useLibrary = create<LibraryState>((set, get) => ({
  favorites: [],
  playlists: [],
  globalPlaylists: [],
  history: [],
  status: "idle",

  load: async () => {
    set({ status: "loading" });
    try {
      const [lib, globalList] = await Promise.all([
        api.library().catch(() => ({ favorites: [], playlists: [], history: [] })),
        fetchGlobalPublicPlaylists().catch(() => []),
      ]);

      const localIds = new Set((lib.playlists || []).map((p) => p.id));
      const combined = [
        ...(lib.playlists || []),
        ...globalList.filter((g) => !localIds.has(g.id)),
      ];

      set({
        favorites: lib.favorites || [],
        playlists: combined,
        globalPlaylists: globalList,
        history: lib.history || [],
        status: "ready",
      });

      // Real-time synchronization for global community playlists from Supabase
      subscribeToGlobalPlaylists((freshGlobal) => {
        const curPlaylists = get().playlists;
        const curLocal = curPlaylists.filter((p) => !freshGlobal.some((g) => g.id === p.id));
        set({
          globalPlaylists: freshGlobal,
          playlists: [...curLocal, ...freshGlobal],
        });
      });
    } catch {
      set({ status: "error" });
    }
  },

  isFavorite: (id) => get().favorites.some((t) => t.id === id),

  toggleFavorite: async (track) => {
    const prev = get().favorites;
    const on = !prev.some((t) => t.id === track.id);
    set({ favorites: on ? [track, ...prev] : prev.filter((t) => t.id !== track.id) });
    try {
      const { favorites } = on ? await api.addFavorite(track) : await api.removeFavorite(track.id);
      set({ favorites });
      toast(on ? getT().toasts.addedFavorite : getT().toasts.removedFavorite);
    } catch (e) {
      set({ favorites: prev });
      toast((e as Error).message, "error");
    }
  },

  addFavorites: async (tracks) => {
    const prev = get().favorites;
    const fresh = tracks.filter((t) => !prev.some((f) => f.id === t.id));
    if (!fresh.length) return toast(getT().toasts.allAlreadyFavorites);
    set({ favorites: [...fresh, ...prev] });
    try {
      const { favorites } = await api.addFavorites(fresh);
      set({ favorites });
      toast(fresh.length === 1 ? getT().toasts.addedFavorite : getT().toasts.addedFavorites(fresh.length));
    } catch (e) {
      set({ favorites: prev });
      toast((e as Error).message, "error");
    }
  },

  recordPlay: (track) => {
    set((s) => ({ history: [track, ...s.history.filter((t) => t.id !== track.id)].slice(0, 60) }));
    api.pushHistory(track).catch(() => {});
  },

  createPlaylist: async (name, tracks = [], makeGlobal = false) => {
    try {
      const p = await api.createPlaylist(name, tracks);
      let globalList = get().globalPlaylists;
      if (makeGlobal) {
        const res = await publishPlaylistToGlobal(p);
        if (res.success) {
          globalList = [p, ...globalList.filter((x) => x.id !== p.id)];
          toast(getT().toasts.playlistCreated(p.name) + " — Synced to Global Community!");
        } else {
          toast(getT().toasts.playlistCreated(p.name));
        }
      } else {
        toast(getT().toasts.playlistCreated(p.name));
      }
      set((s) => ({
        playlists: [p, ...s.playlists],
        globalPlaylists: globalList,
      }));
      return p;
    } catch (e) {
      toast((e as Error).message, "error");
      return null;
    }
  },

  publishToGlobal: async (id: string) => {
    const pl = get().playlists.find((p) => p.id === id);
    if (!pl) return false;
    const res = await publishPlaylistToGlobal(pl);
    if (res.success) {
      set((s) => ({
        globalPlaylists: [pl, ...s.globalPlaylists.filter((x) => x.id !== id)],
      }));
      toast(`"${pl.name}" synced to Global (Community)!`);
      return true;
    } else {
      toast("Sync failed: " + (res.error || "Unknown error"), "error");
      return false;
    }
  },

  removeFromGlobal: async (id: string) => {
    const res = await removePlaylistFromGlobal(id);
    if (res.success) {
      set((s) => ({
        globalPlaylists: s.globalPlaylists.filter((x) => x.id !== id),
      }));
      toast("Removed from Global Community");
      return true;
    } else {
      toast("Failed to remove from community", "error");
      return false;
    }
  },

  renamePlaylist: async (id, name) => {
    try {
      const p = await api.renamePlaylist(id, name);
      const isGlob = get().globalPlaylists.some((g) => g.id === id);
      const nextPlaylists = replacePlaylist(get().playlists, p);
      const nextGlobal = isGlob ? replacePlaylist(get().globalPlaylists, p) : get().globalPlaylists;
      set({ playlists: nextPlaylists, globalPlaylists: nextGlobal });
      if (isGlob) {
        void publishPlaylistToGlobal(p);
      }
    } catch (e) {
      toast((e as Error).message, "error");
    }
  },

  deletePlaylist: async (id) => {
    const prev = get().playlists;
    const isGlob = get().globalPlaylists.some((g) => g.id === id);
    set({
      playlists: prev.filter((p) => p.id !== id),
      globalPlaylists: get().globalPlaylists.filter((p) => p.id !== id),
    });
    try {
      await api.deletePlaylist(id);
      if (isGlob) {
        void removePlaylistFromGlobal(id);
      }
      toast(getT().toasts.playlistDeleted);
    } catch (e) {
      set({ playlists: prev });
      toast((e as Error).message, "error");
    }
  },

  addToPlaylist: async (id, tracks) => {
    try {
      const before = get().playlists.find((p) => p.id === id)?.tracks.length ?? 0;
      const p = await api.addToPlaylist(id, tracks);
      const isGlob = get().globalPlaylists.some((g) => g.id === id);
      const nextPlaylists = replacePlaylist(get().playlists, p);
      const nextGlobal = isGlob ? replacePlaylist(get().globalPlaylists, p) : get().globalPlaylists;
      set({ playlists: nextPlaylists, globalPlaylists: nextGlobal });
      if (isGlob) {
        void publishPlaylistToGlobal(p);
      }
      const added = p.tracks.length - before;
      const t = getT();
      if (!Array.isArray(tracks) || added === 1) toast(t.toasts.addedTo(p.name));
      else toast(added ? t.toasts.addedManyTo(added, p.name) : t.toasts.allAlreadyIn(p.name));
    } catch (e) {
      toast((e as Error).message, "error");
    }
  },

  removeFromPlaylist: async (id, trackId) => {
    const prev = get().playlists;
    set({
      playlists: prev.map((p) => (p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p)),
    });
    try {
      const p = await api.removeFromPlaylist(id, trackId);
      const isGlob = get().globalPlaylists.some((g) => g.id === id);
      const nextPlaylists = replacePlaylist(get().playlists, p);
      const nextGlobal = isGlob ? replacePlaylist(get().globalPlaylists, p) : get().globalPlaylists;
      set({ playlists: nextPlaylists, globalPlaylists: nextGlobal });
      if (isGlob) {
        void publishPlaylistToGlobal(p);
      }
    } catch (e) {
      set({ playlists: prev });
      toast((e as Error).message, "error");
    }
  },
}));
