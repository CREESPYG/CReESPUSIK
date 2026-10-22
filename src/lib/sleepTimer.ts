/**
 * Sleep timer: stops the music automatically after a countdown. The controls
 * live in the Now Playing sheet and only appear while music is actually
 * playing (the app/APK scenario). When the timer ends, the player pauses —
 * whatever engine owns playback (native, HTML element, or YT fallback) gets
 * the same pause command the transport bar produces.
 */

import { create } from "zustand";

interface SleepState {
  endsAt: number | null;
  totalMs: number | null;
  /** Fires once when the countdown reaches zero; the transport pause hook. */
  onEnd: (() => void) | null;
  start: (minutes: number, onEnd?: () => void) => void;
  cancel: () => void;
}

let ticker: ReturnType<typeof setInterval> | null = null;

function closeTimer() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

export const useSleepTimer = create<SleepState>((set, get) => ({
  endsAt: null,
  totalMs: null,
  onEnd: null,

  start: (minutes, onEnd) => {
    const ms = Math.max(1, minutes) * 60_000;
    closeTimer();
    set({ endsAt: Date.now() + ms, totalMs: ms, onEnd: onEnd ?? get().onEnd });
    // 1 s cadence; browsers may throttle this heavily in the background, which only means the
    // final pause lands up to a minute late while the screen is off.
    ticker = setInterval(() => {
      const endsAt = get().endsAt;
      if (endsAt == null) {
        closeTimer();
        return;
      }
      if (Date.now() >= endsAt) {
        closeTimer();
        const cb = get().onEnd;
        set({ endsAt: null, totalMs: null, onEnd: null });
        if (cb) cb();
      }
    }, 1000);
  },

  cancel: () => {
    closeTimer();
    set({ endsAt: null, totalMs: null, onEnd: null });
  },
}));

/** Remaining batches formatted as "12:34", null when the timer is off. */
export function sleepRemaining(endsAt: number | null): string | null {
  if (endsAt == null) return null;
  const rest = Math.max(0, endsAt - Date.now());
  const m = Math.floor(rest / 60_000);
  const s = Math.floor((rest % 60_000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
