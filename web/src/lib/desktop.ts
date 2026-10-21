/** Bridge exposed by the Electron preload script when Musike runs as the desktop app. */
interface DesktopBridge {
  platform: string;
  setTheme: (theme: "dark" | "light") => void;
  /** Missing in desktop builds older than 1.2. */
  setLanguage?: (lang: string) => void;
}

export const desktop = (window as Window & { musikeDesktop?: DesktopBridge }).musikeDesktop;

if (desktop) {
  document.documentElement.dataset.desktop = "true";
  // Match the native window buttons to the theme picked before this script ran.
  desktop.setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
}
