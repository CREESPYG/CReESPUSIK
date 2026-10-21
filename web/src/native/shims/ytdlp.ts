// Stands in for server/src/ytdlp.ts in the Android build. There is no yt-dlp on a phone: search goes through
// YouTube Music only, and streams are resolved by native/streams.ts.

export async function ytdlpSearch(_query: string): Promise<never> {
  throw new Error("Search is unavailable right now. Try again in a moment.");
}
