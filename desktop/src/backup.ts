import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const BACKUPS_KEPT = 5;

/**
 * First launch of a new version: keep a dated copy of the library from before the update,
 * so nothing the user saved can be lost to one. Returns the backup's path, if one was made.
 * Never throws: a failed backup must not keep the app from opening (it retries on the next launch).
 */
export function backupLibraryOnUpdate(userData: string, version: string, now = new Date()): string | null {
  const versionFile = path.join(userData, "version.json");
  let previous: string | undefined;
  try {
    previous = (JSON.parse(readFileSync(versionFile, "utf8")) as { version?: string }).version;
  } catch {
    // first launch, or a version from before this file existed
  }
  if (previous === version) return null;

  try {
    let made: string | null = null;
    const library = path.join(userData, "data", "library.json");
    if (existsSync(library)) {
      const dir = path.join(userData, "backups");
      mkdirSync(dir, { recursive: true });
      // Sortable by name: library-2026-10-15_14-05-00-before-1.2.0.json
      const stamp = now.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "-");
      made = path.join(dir, `library-${stamp}-before-${version}.json`);
      copyFileSync(library, made);
      const dated = readdirSync(dir)
        .filter((f) => /^library-\d{4}-\d\d-\d\d_/.test(f))
        .sort()
        .reverse();
      for (const old of dated.slice(BACKUPS_KEPT)) rmSync(path.join(dir, old), { force: true });
    }
    writeFileSync(versionFile, JSON.stringify({ version }));
    return made;
  } catch (err) {
    console.error("Backup da biblioteca falhou:", err);
    return null;
  }
}
