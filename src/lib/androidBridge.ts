import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function initNativeBridge() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;

  // Back button handling on Android:
  // Closes open dialogs/menus first, then navigates back in browser history, then sends the app to background
  // (App.minimizeApp()) so background music continues uninterrupted!
  void CapApp.addListener("backButton", () => {
    const dialogs = [...document.querySelectorAll<HTMLElement>("[data-escape-closes], [role='dialog'], dialog[open]")];
    const openOverlay = dialogs.find((el) => el.getClientRects().length > 0);
    if (openOverlay) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      return;
    }
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      window.history.back();
    } else {
      void CapApp.minimizeApp();
    }
  });
}
