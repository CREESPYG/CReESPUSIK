/**
 * Shared browser-notification helpers for CREESPY.
 *
 * Fixes duplicate/stacked notifications by combining three guards:
 *   1. Deterministic `tag` per event identity → the browser REPLACES a
 *      same-tag notification instead of stacking a new one.
 *   2. A time-window suppression map → identical bursts collapse (in-process).
 *   3. A localStorage claim slot → two tabs of the same room don't both
 *      notify about the same event.
 */

const SLOT_KEY = "creespy.notif.slots.v1";
const recentShown = new Map<string, number>();

interface SlotMap {
  [id: string]: number;
}

function readSlots(): SlotMap {
  try {
    const raw = localStorage.getItem(SLOT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SlotMap) : {};
  } catch {
    return {};
  }
}

function writeSlots(slots: SlotMap) {
  try {
    // Keep map bounded (most recent 40)
    const entries = Object.entries(slots)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40);
    localStorage.setItem(SLOT_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* storage full / disabled — notification still fire, in-tab guards remain */
  }
}

/** Reserve a cross-tab slot; returns false if claimed in the last ttlMs. */
function claimSlot(id: string, ttlMs: number): boolean {
  const now = Date.now();
  const slots = readSlots();
  const last = slots[id];
  if (last && now - last < ttlMs) {
    // Refresh the claim so bursts keep suppressing and the slot self-cleans later
    slots[id] = now;
    writeSlots(slots);
    return false;
  }
  slots[id] = now;
  writeSlots(slots);
  // opportunistically prune old entries
  let pruned = false;
  for (const [k, ts] of Object.entries(slots)) {
    if (now - ts > 10 * 60_000) {
      delete slots[k];
      pruned = true;
    }
  }
  if (pruned) writeSlots(slots);
  return true;
}

export interface NotifyOptions {
  /** Deterministic tag for the browser to group/replace notifications. */
  tag?: string;
  /** Suppress identical notifications within this window (ms). Default 4000. */
  windowMs?: number;
  /** Icon path. */
  icon?: string;
  /** Max seconds before auto-close (0 = OS default). */
  autoCloseMs?: number;
}

/**
 * Show a browser notification with duplicate protection.
 * - Silently no-ops without permission or when the page is visible & focused.
 * - Returns true if a notification was actually shown.
 */
export function notify(title: string, body: string, opts: NotifyOptions = {}): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  // Don't bother the user while they are looking at the app
  if (document.hasFocus() && document.visibilityState === "visible") return false;

  const identity = `${title}|${body}`;
  let hash = 5381;
  for (let i = 0; i < identity.length; i++) {
    hash = ((hash << 5) + hash + identity.charCodeAt(i)) | 0;
  }
  const tag = opts.tag || `creespy-${(hash >>> 0).toString(36)}`;

  try {
    // 1. In-process burst suppression
    const now = Date.now();
    const windowMs = opts.windowMs ?? 4000;
    const lastLocal = recentShown.get(tag);
    if (lastLocal && now - lastLocal < windowMs) return false;
    recentShown.set(tag, now);

    // 2. Cross-tab claim
    const claimed = claimSlot(`n:${tag}`, Math.max(windowMs, 8000));
    if (!claimed) return false;
  } catch {
    /* guard failures never block showing a notification */
  }

  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: opts.icon || "/cover-placeholder.jpg",
    });
    notification.onclick = () => {
      try {
        window.focus();
        notification.close();
      } catch {}
    };
    if (opts.autoCloseMs !== 0) {
      setTimeout(() => {
        try {
          notification.close();
        } catch {}
      }, opts.autoCloseMs ?? 5500);
    }
    return true;
  } catch {
    return false;
  }
}

/** Request browser notification permission (fire & forget). */
export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}
