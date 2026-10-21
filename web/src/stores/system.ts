import { create } from "zustand";
import { api, type Channel, type SystemInfo } from "../lib/api";
import { toast, useUi } from "./ui";

interface SystemState {
  info: SystemInfo | null;
  status: "idle" | "loading" | "ready" | "error";
  load: () => Promise<void>;
  update: (channel: Channel) => Promise<void>;
}

let polling: ReturnType<typeof setTimeout> | null = null;

export const openSettings = () => useUi.getState().setSettingsOpen(true);

export const useSystem = create<SystemState>((set, get) => {
  /** Polls while an update runs, then announces the result once. */
  const watch = () => {
    if (polling) return;
    const tick = async () => {
      polling = null;
      try {
        const info = await api.system();
        set({ info, status: "ready" });
        const job = info.job;
        if (job?.status === "running") {
          polling = setTimeout(tick, 1000);
          return;
        }
        if (job?.status === "done") toast(job.message);
        if (job?.status === "error") toast(job.message, "error");
      } catch {
        polling = setTimeout(tick, 2000);
      }
    };
    polling = setTimeout(tick, 800);
  };

  return {
    info: null,
    status: "idle",

    load: async () => {
      set({ status: get().info ? "ready" : "loading" });
      try {
        const info = await api.system();
        set({ info, status: "ready" });
        if (info.job?.status === "running") watch();
      } catch {
        set({ status: "error" });
      }
    },

    update: async (channel) => {
      try {
        const job = await api.updateYtdlp(channel);
        set((s) => ({ info: s.info ? { ...s.info, job } : s.info }));
        watch();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    },
  };
});

/** Something needs the user's attention: missing tools or a newer yt-dlp. */
export const needsAttention = (info: SystemInfo | null) =>
  !!info && (!info.ytdlp.path || !info.deno || info.ytdlp.updateAvailable);
