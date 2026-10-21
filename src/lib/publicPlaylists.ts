import { supabase, SUPABASE_URL, SUPABASE_KEY } from "./supabase";
import type { Playlist, Track } from "./types";

export interface GlobalPlaylistRow {
  id: string;
  owner_uid?: string;
  title: string;
  description?: string;
  cover_art?: string | null;
  track_count?: number;
  tracks?: any[];
  author?: string;
  play_count?: number;
  created_at?: string;
  updated_at?: string;
}

export function convertGlobalPlaylistToMusike(p: GlobalPlaylistRow): Playlist {
  const rawTracks = Array.isArray(p.tracks) ? p.tracks : [];
  const tracks: Track[] = rawTracks.map((t: any) => {
    const rawId = String(t.videoId || t.id || "");
    const cleanId = rawId.startsWith("custom-") ? rawId.replace("custom-", "") : rawId;
    const thumb =
      t.thumb ||
      t.artwork ||
      t.coverUrl ||
      (cleanId ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg` : "");

    return {
      id: cleanId,
      title: t.title || "Unknown Title",
      artist: t.artist || "Unknown Artist",
      album: t.album || "",
      duration: Number(t.duration) || 0,
      thumb,
      art: thumb,
      kind: "song",
    };
  });

  return {
    id: p.id,
    name: p.title || "Untitled Playlist",
    tracks,
    createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
    updatedAt: p.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
  };
}

/** Fetch all 34+ global public playlists from Supabase */
export async function fetchGlobalPublicPlaylists(): Promise<Playlist[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/public_playlists?select=*&order=updated_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      console.warn("[publicPlaylists] REST fetch failed with status:", res.status);
      return [];
    }

    const data: GlobalPlaylistRow[] = await res.json();
    return data.map(convertGlobalPlaylistToMusike);
  } catch (err) {
    console.error("[publicPlaylists] fetchGlobalPublicPlaylists error:", err);
    return [];
  }
}

/** Realtime subscription to public_playlists table in Supabase */
export function subscribeToGlobalPlaylists(onUpdate: (playlists: Playlist[]) => void): () => void {
  try {
    const channel = supabase.channel("library_public_playlists_changes");
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "public_playlists" },
        async () => {
          const fresh = await fetchGlobalPublicPlaylists();
          onUpdate(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("[publicPlaylists] realtime subscription error:", err);
    return () => {};
  }
}

/** Get or generate a persistent owner UID for Supabase RLS */
export function getOwnerUid(): string {
  try {
    let uid = localStorage.getItem("musike:owner_uid");
    if (!uid) {
      uid =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("musike:owner_uid", uid);
    }
    return uid;
  } catch {
    return "anonymous-user";
  }
}

/** Publish or sync a local playlist to the Global (Community) Supabase table */
export async function publishPlaylistToGlobal(
  playlist: Playlist,
  author?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const owner_uid = getOwnerUid();
    const formattedTracks = (playlist.tracks || []).map((t) => {
      const vid = t.id || "";
      const thumb =
        t.art ||
        t.thumb ||
        (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : "");
      return {
        id: vid,
        videoId: vid,
        title: t.title || "Untitled Track",
        artist: t.artist || "Unknown Artist",
        album: t.album || "",
        duration: t.duration || 0,
        thumb,
        artwork: thumb,
        coverUrl: thumb,
        source: "custom",
        custom: true,
      };
    });

    const coverArt =
      playlist.tracks[0]?.art ||
      playlist.tracks[0]?.thumb ||
      (playlist.tracks[0]?.id
        ? `https://i.ytimg.com/vi/${playlist.tracks[0].id}/hqdefault.jpg`
        : null);

    const payload = {
      id: playlist.id,
      owner_uid,
      title: playlist.name,
      tracks: formattedTracks,
      author: author || "Community Listener",
      track_count: playlist.tracks.length,
      cover_art: coverArt,
      updated_at: new Date().toISOString(),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/public_playlists`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[publicPlaylists] publish failed:", res.status, errText);
      return { success: false, error: errText || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[publicPlaylists] publish error:", err);
    return { success: false, error: err?.message || "Failed to publish" };
  }
}

/** Remove a playlist from the Global (Community) Supabase table */
export async function removePlaylistFromGlobal(
  playlistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/public_playlists?id=eq.${encodeURIComponent(playlistId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to remove" };
  }
}
