// Stands in for server/src/config.ts in the Android build: only the YouTube Music settings matter on a phone.
import { Capacitor } from "@capacitor/core";
import { makeFetch, nativeFetch, type Transport } from "../http";

/** The phone's region ("pt-BR" → "BR"), so search results and genres match where the user is. */
function region(): string {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const r = tag?.split("-")[1];
    if (r && /^[A-Z]{2}$/i.test(r)) return r.toUpperCase();
  }
  return "US";
}

// Development only: a desktop browser running this build can't use native HTTP, so a test harness may provide
// a stand-in transport (a local proxy that does the same job).
const devTransport = (globalThis as { __musikeTransport?: Transport }).__musikeTransport;

export const config = {
  lang: "en",
  location: region(),
  fetch: Capacitor.isNativePlatform() ? nativeFetch : devTransport ? makeFetch(devTransport) : undefined,
};
