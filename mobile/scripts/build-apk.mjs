// Builds the release APK and copies it to release/Musike-Setup-<version>-Android.apk at the repository root,
// next to the desktop downloads.
// Needs JDK 17+ (JAVA_HOME) and the Android SDK (ANDROID_HOME or android/local.properties).
// Signed when android/keystore.properties or the MUSIKE_KEYSTORE* variables are set; unsigned otherwise.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const android = join(root, "android");
const win = process.platform === "win32";

const task = "assembleRelease --console=plain";
const gradle = win
  ? // Batch files only run through a shell, as one command line with the path quoted.
    spawnSync(`"${join(android, "gradlew.bat")}" ${task}`, { cwd: android, stdio: "inherit", shell: true })
  : // Through sh, so it runs even when the executable bit was lost (files committed from Windows).
    spawnSync("sh", [join(android, "gradlew"), ...task.split(" ")], { cwd: android, stdio: "inherit" });
if (gradle.status !== 0) process.exit(gradle.status ?? 1);

const outputs = join(android, "app", "build", "outputs", "apk", "release");
const signed = join(outputs, "app-release.apk");
const apk = existsSync(signed) ? signed : join(outputs, "app-release-unsigned.apk");
const target = join(root, "..", "release", `Musike-Setup-${version}-Android${apk === signed ? "" : "-unsigned"}.apk`);
mkdirSync(dirname(target), { recursive: true });
copyFileSync(apk, target);
console.log(`\n${target}`);
