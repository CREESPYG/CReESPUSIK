import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const androidDir = path.join(rootDir, "android");
const builtApk = path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
const publicDownloads = path.join(rootDir, "public", "downloads");
const distDownloads = path.join(rootDir, "dist", "downloads");
const targetName = "CReEPUSIK-v1.6.5.apk";

console.log("==> 1. Syncing web assets with Capacitor Android...");
execSync("npx cap sync android", { cwd: rootDir, stdio: "inherit" });

console.log("==> 2. Compiling and assembling APK using Gradle...");
const env = {
  ...process.env,
  JAVA_HOME: "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11.10-hotspot",
  ANDROID_HOME: "C:\\Users\\aarif\\AppData\\Local\\Android\\Sdk",
};

execSync(".\\gradlew.bat assembleRelease --no-daemon --console=plain", {
  cwd: androidDir,
  env,
  stdio: "inherit",
});

if (!fs.existsSync(builtApk)) {
  throw new Error(`Build failed: ${builtApk} not found!`);
}

console.log("==> 3. Signing APK with v1, v2, and v3 schemes via apksigner...");
const apksignerBat = "C:\\Users\\aarif\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\apksigner.bat";
const keystorePath = path.join(androidDir, "app", "release.keystore");

execSync(
  `"${apksignerBat}" sign --ks "${keystorePath}" --ks-pass pass:creepusik123 --ks-key-alias creepusik --key-pass pass:creepusik123 --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "${builtApk}"`,
  { stdio: "inherit" }
);

console.log("==> 4. Verifying APK signature...");
execSync(`"${apksignerBat}" verify --verbose "${builtApk}"`, { stdio: "inherit" });

console.log("==> 5. Copying APK to distribution directories...");
fs.mkdirSync(publicDownloads, { recursive: true });
fs.mkdirSync(distDownloads, { recursive: true });

fs.copyFileSync(builtApk, path.join(publicDownloads, targetName));
fs.copyFileSync(builtApk, path.join(distDownloads, targetName));

console.log(`\nSUCCESS: Generated official signed APK at:`);
console.log(` - public/downloads/${targetName}`);
console.log(` - dist/downloads/${targetName}`);
