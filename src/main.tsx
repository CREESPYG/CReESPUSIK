import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { desktop } from "./lib/desktop";
import "./styles.css";
import "./tv/tv.css";
import { installTvMode } from "./tv/tvMode";
import { initNativeBridge } from "./lib/androidBridge";

// The desktop app ships its files locally; a service worker would only risk serving an old version after updates.
if (!desktop && typeof window !== "undefined" && "serviceWorker" in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // When a new SW is waiting, force it to activate immediately
      updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // Check for updates when user returns to or focuses the tab
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      });
      window.addEventListener("focus", () => {
        registration.update().catch(() => {});
      });

      // Periodic update check every 15 minutes if online
      setInterval(() => {
        if (navigator.onLine) {
          registration.update().catch(() => {});
        }
      }, 15 * 60 * 1000);
    },
  });

  // When a new service worker takes control (clients claimed), reload to ensure running assets match latest deploy
  let refreshing = false;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Auto-recover if Vite chunk preloading encounters an updated deployment bundle
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    window.location.reload();
  });
}

// Android TV: spatial D-pad navigation + 10-foot styling (no-op elsewhere).
installTvMode();

// Native Android: back button minimization and background keep-alive hooks
initNativeBridge();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
