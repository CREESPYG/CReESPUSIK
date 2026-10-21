import type { CapacitorConfig } from "@capacitor/cli";

// Built against a Musike server (MUSIKE_SERVER_URL=https://musike.example.com): the app then loads that instance.
// Without it, the backend runs inside the app (see web/src/native).
const serverUrl = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.MUSIKE_SERVER_URL;

const config: CapacitorConfig = {
  appId: "app.musike.android",
  appName: "CReEPUSIK",
  // The web app built in Android mode: same UI, backend running on the phone (see web/src/native).
  webDir: "../web/dist-native",
  backgroundColor: "#0B0C0F",
  android: {
    // Music keeps loading while the screen is off or another app is in front.
    allowMixedContent: false,
  },
  ios: {
    // The status bar area is padded by the app itself, like on Android.
    contentInset: "never",
    scrollEnabled: true,
    backgroundColor: "#0B0C0F",
  },
  ...(serverUrl ? { server: { url: serverUrl, cleartext: false } } : {}),
  plugins: {
    Keyboard: {
      // iOS: the web view shrinks with the keyboard, so the search box and its results stay in view. (Android already
      // makes room through SystemBars; its resizeOnFullScreen workaround would shrink the page a second time.)
      resize: "native",
    },
    SystemBars: {
      // The app already pads itself with env(safe-area-inset-*), like on an iPhone.
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
      style: "DARK",
    },
  },
};

export default config;
