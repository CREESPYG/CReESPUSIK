import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import type { LibraryStorage } from "./library.js";

/** The library as data/library.json, replaced atomically (write a temp file, then rename over). */
export function fileStorage(dir = config.dataDir): LibraryStorage {
  const file = path.join(dir, "library.json");
  return {
    read: async () => (existsSync(file) ? readFile(file, "utf8") : null),
    write: async (json) => {
      await mkdir(dir, { recursive: true });
      const tmp = `${file}.tmp`;
      await writeFile(tmp, json, "utf8");
      await rename(tmp, file);
    },
  };
}
