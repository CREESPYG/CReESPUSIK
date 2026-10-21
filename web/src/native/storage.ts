import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import type { LibraryStorage } from "../../../server/src/library";

const FILE = "library.json";
const TMP = "library.tmp.json";
const where = { directory: Directory.Data, encoding: Encoding.UTF8 } as const;

async function readText(path: string): Promise<string | null> {
  try {
    const { data } = await Filesystem.readFile({ path, ...where });
    return typeof data === "string" ? data : await data.text();
  } catch {
    return null;
  }
}

/**
 * The library in the app's private storage. Each save goes to a temp file first and then replaces the real one,
 * so a crash mid-write can't leave a half-written library; if it happens between the two steps, the temp file
 * is the newest complete copy.
 */
export const nativeStorage: LibraryStorage = {
  read: async () => (await readText(FILE)) ?? (await readText(TMP)),
  write: async (json) => {
    await Filesystem.writeFile({ path: TMP, data: json, ...where });
    await Filesystem.deleteFile({ path: FILE, directory: Directory.Data }).catch(() => {});
    await Filesystem.rename({ from: TMP, to: FILE, directory: Directory.Data, toDirectory: Directory.Data });
  },
};
