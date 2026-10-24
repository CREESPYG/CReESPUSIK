import { Capacitor, registerPlugin } from "@capacitor/core";

/** Native room-message notifications (Android WebView has no Notification API). */
export interface MusikeNotifyPlugin {
  show(options: { title: string; body?: string; tag?: string; autoClose?: number }): Promise<void>;
}

export const MusikeNotify = registerPlugin<MusikeNotifyPlugin>("MusikeNotify");

export const isNative = (): boolean =>
  typeof window !== "undefined" && Capacitor.isNativePlatform();
