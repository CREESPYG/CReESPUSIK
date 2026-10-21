/**
 * Messages the server sends to people (errors, update progress), in every language the app speaks.
 * They are kept as keys and translated when sent, so each device gets its own language.
 */

export type Lang = "en" | "hi";
type Params = Record<string, string | number>;

const en = {
  invalidVideoId: "Invalid video ID.",
  emptyQuery: "Type something to search.",
  searchFailed: "Search is unavailable right now ({detail}). Try again in a moment.",
  missingTitle: "Give the song's title.",
  notBackup: "This file isn't a CReEPUSIK backup.",
  newerBackup: "This backup was made by a newer CReEPUSIK. Update the app to import it.",
  idMismatch: "The ID doesn't match.",
  tracksRequired: "Send a list of tracks.",
  invalidGenre: "Invalid genre.",
  invalidOffset: "Invalid position.",
  invalidArtist: "Invalid artist.",
  routeNotFound: "Route not found.",
  noFreePort: "No free port between {from} and {to}.",
  invalidTrack: "Invalid track.",
  playlistNotFound: "Playlist not found.",
  playlistNameRequired: "Give the playlist a name.",
  genresUnavailable: "Couldn't load the genres right now. Try again.",
  genreUnavailable: "Couldn't open this genre right now. Try again.",
  genreEmpty: "Nothing found for this genre.",
  artistUnavailable: "Couldn't open this artist right now. Try again.",
  artistNotFound: "Artist not found.",
  albumUnavailable: "Couldn't open this album right now. Try again.",
  albumNotFound: "Album not found.",
  invalidAlbum: "Invalid album.",
  ytdlpMissing: "yt-dlp wasn't found on this computer. Open Settings in CReEPUSIK to install it.",
  ytdlpTimeout: "yt-dlp took too long to answer.",
  ytdlpCantRun: "Couldn't run yt-dlp ({error}). Open Settings in CReEPUSIK.",
  botCheck: "YouTube is asking this connection to prove it's not a bot. If you're on a VPN, turn it off and try again.",
  videoUnavailable: "This video isn't available on YouTube.",
  ageRestricted: "Age-restricted video. It needs cookies from a signed-in account.",
  ytdlpFailed: "yt-dlp failed.",
  ytdlpOutdated: "{detail} YouTube may have changed: update yt-dlp in Settings.",
  noAudio: "No audio format available for this video.",
  noSdVideo: "This video has no combined SD version. Use HD.",
  streamRefused: "YouTube refused the stream (HTTP {status}). Try updating yt-dlp in Settings.",
  noWinget: "yt-dlp wasn't found and winget isn't available. Install it manually: https://github.com/yt-dlp/yt-dlp",
  installingYtdlp: "Installing yt-dlp",
  updatingYtdlp: "Updating yt-dlp",
  directUpdateFailed: "Direct update failed, trying winget",
  downloadingTools: "Downloading yt-dlp and Deno from GitHub",
  alreadyLatest: "Already on the latest version ({version})",
  ytdlpReady: "yt-dlp {version} is ready to use",
  updateFailed: "Couldn't update yt-dlp.",
  toolMissing: "{tool} wasn't found on this computer.",
  downloadFailed: "Downloading {tool} failed (HTTP {status}).",
  ffmpegPackage: "Unexpected FFmpeg package.",
};

export type MsgKey = keyof typeof en;

const hi: Record<MsgKey, string> = {
  invalidVideoId: "अमान्य वीडियो आईडी।",
  emptyQuery: "खोजने के लिए कुछ लिखें।",
  searchFailed: "खोज अभी अनुपलब्ध है ({detail})। कुछ देर बाद पुनः प्रयास करें।",
  missingTitle: "गाने का शीर्षक दें।",
  notBackup: "यह CReEPUSIK बैकअप फ़ाइल नहीं है।",
  newerBackup: "यह बैकअप CReEPUSIK के नए संस्करण द्वारा बनाया गया है।",
  idMismatch: "आईडी मेल नहीं खाती।",
  tracksRequired: "ट्रैक्स की सूची भेजें।",
  invalidGenre: "अमान्य शैली।",
  invalidOffset: "अमान्य स्थिति।",
  invalidArtist: "अमान्य कलाकार।",
  routeNotFound: "रूट नहीं मिला।",
  noFreePort: "{from} और {to} के बीच कोई पोर्ट खाली नहीं है।",
  invalidTrack: "अमान्य ट्रैक।",
  playlistNotFound: "प्लेलिस्ट नहीं मिली।",
  playlistNameRequired: "प्लेलिस्ट को नाम दें।",
  genresUnavailable: "शैलियां अभी लोड नहीं हो सकीं। पुनः प्रयास करें।",
  genreUnavailable: "यह शैली अभी नहीं खुल सकी। पुनः प्रयास करें।",
  genreEmpty: "इस शैली के लिए कुछ नहीं मिला।",
  artistUnavailable: "यह कलाकार अभी नहीं खुल सका। पुनः प्रयास करें।",
  artistNotFound: "कलाकार नहीं मिला।",
  albumUnavailable: "यह एल्बम अभी नहीं खुल सका। पुनः प्रयास करें।",
  albumNotFound: "एल्बम नहीं मिला।",
  invalidAlbum: "अमान्य एल्बम।",
  ytdlpMissing: "yt-dlp नहीं मिला। इसे इंस्टॉल करने के लिए CReEPUSIK में सेटिंग्स खोलें।",
  ytdlpTimeout: "yt-dlp ने उत्तर देने में बहुत लंबा समय लिया।",
  ytdlpCantRun: "yt-dlp नहीं चल सका ({error})। CReEPUSIK सेटिंग्स देखें।",
  botCheck: "YouTube सत्यापन मांग रहा है। यदि आप VPN पर हैं, तो इसे बंद करके पुनः प्रयास करें।",
  videoUnavailable: "यह वीडियो YouTube पर उपलब्ध नहीं है।",
  ageRestricted: "आयु-प्रतिबंधित वीडियो।",
  ytdlpFailed: "yt-dlp विफल रहा।",
  ytdlpOutdated: "{detail} YouTube बदल गया हो सकता है: सेटिंग्स में yt-dlp अपडेट करें।",
  noAudio: "इस वीडियो के लिए कोई ऑडियो प्रारूप उपलब्ध नहीं है।",
  noSdVideo: "इस वीडियो का SD संस्करण उपलब्ध नहीं है। HD का उपयोग करें।",
  streamRefused: "YouTube ने स्ट्रीम अस्वीकार कर दी (HTTP {status})।",
  noWinget: "winget उपलब्ध नहीं है। yt-dlp मैन्युअल रूप से इंस्टॉल करें।",
  installingYtdlp: "yt-dlp इंस्टॉल हो रहा है...",
  updatingYtdlp: "yt-dlp अपडेट हो रहा है...",
  directUpdateFailed: "प्रत्यक्ष अपडेट विफल रहा, winget का प्रयास किया जा रहा है",
  downloadingTools: "GitHub से उपकरण डाउनलोड हो रहे हैं...",
  alreadyLatest: "पहले से ही नवीनतम संस्करण पर है ({version})",
  ytdlpReady: "yt-dlp {version} उपयोग के लिए तैयार है",
  updateFailed: "yt-dlp अपडेट नहीं हो सका।",
  toolMissing: "{tool} इस कंप्यूटर पर नहीं मिला।",
  downloadFailed: "{tool} डाउनलोड विफल रहा (HTTP {status})।",
  ffmpegPackage: "अप्रत्याशित FFmpeg पैकेज।",
};

const CATALOG: Record<Lang, Record<MsgKey, string>> = { en, hi };

export interface Msg {
  key: MsgKey;
  params?: Params;
}

export type Text = Msg | string;

export const msg = (key: MsgKey, params?: Params): Msg => ({ key, params });

export function tr(lang: Lang, text: Text): string {
  if (typeof text === "string") return text;
  const entry = CATALOG[lang] || CATALOG.en;
  return entry[text.key]?.replace(/\{(\w+)\}/g, (all, name: string) => String(text.params?.[name] ?? all)) ?? text.key;
}

export const isLang = (v: unknown): v is Lang => v === "en" || v === "hi";

export function langOf(req: { headers: Record<string, string | string[] | undefined> }): Lang {
  const asked = req.headers["x-musike-lang"];
  return isLang(asked) ? asked : "en";
}

export const youtubeLang = (lang: Lang) => (lang === "hi" ? "hi" : "en");