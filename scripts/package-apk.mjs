import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, ".apk_staging");
const stagingExtracted = path.join(stagingDir, "extracted");
const stagingAssetsPublic = path.join(stagingExtracted, "assets", "public");
const distDir = path.join(rootDir, "dist");
const downloadsDir = path.join(rootDir, "public", "downloads");
const distDownloadsDir = path.join(distDir, "downloads");

const jarExe = `C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11.10-hotspot\\bin\\jar.exe`;
const keytoolExe = `C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11.10-hotspot\\bin\\keytool.exe`;
const zipalignExe = `C:\\Users\\aarif\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\zipalign.exe`;
const apksignerBat = `C:\\Users\\aarif\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\apksigner.bat`;

// 1. Ensure staging exists or extract from base APK
if (!fs.existsSync(stagingExtracted)) {
  fs.mkdirSync(stagingExtracted, { recursive: true });
  const baseApk = path.join(downloadsDir, "CReEPUSIK-v1.6.5.apk");
  if (!fs.existsSync(baseApk)) {
    throw new Error("Base APK not found in downloads!");
  }
  console.log("Extracting native Android shell from base APK...");
  execSync(`"${jarExe}" -xf "${baseApk}"`, { cwd: stagingExtracted, stdio: "inherit" });
}

// 2. Remove old assets/public and replace with fresh dist
if (fs.existsSync(stagingAssetsPublic)) {
  fs.rmSync(stagingAssetsPublic, { recursive: true, force: true });
}
fs.mkdirSync(stagingAssetsPublic, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    // Skip downloads folder to avoid recursive nesting of APK inside APK
    if (entry.isDirectory() && entry.name === "downloads") {
      continue;
    }
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(distDir, stagingAssetsPublic);
console.log("Updated assets/public with latest web production build.");

// 3. Remove old signatures from META-INF
const metaInf = path.join(stagingExtracted, "META-INF");
if (fs.existsSync(metaInf)) {
  for (const f of fs.readdirSync(metaInf)) {
    if (f.endsWith(".SF") || f.endsWith(".RSA") || f.endsWith(".DSA") || f === "MANIFEST.MF") {
      fs.unlinkSync(path.join(metaInf, f));
      console.log(`Removed old signature file: ${f}`);
    }
  }
}

// 4. Create unaligned APK with jar
const unalignedApk = path.join(stagingDir, "unaligned.apk");
if (fs.existsSync(unalignedApk)) fs.unlinkSync(unalignedApk);
console.log("Packaging unaligned APK with jar...");
execSync(`"${jarExe}" -c -f "${unalignedApk}" -M -C "${stagingExtracted}" .`, { stdio: "inherit" });

// 5. Zipalign
const alignedApk = path.join(stagingDir, "aligned.apk");
if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
console.log("Aligning APK with zipalign...");
execSync(`"${zipalignExe}" -p -f 4 "${unalignedApk}" "${alignedApk}"`, { stdio: "inherit" });

// 6. Ensure keystore exists
const keystorePath = path.join(stagingDir, "release.keystore");
if (!fs.existsSync(keystorePath)) {
  console.log("Generating release keystore...");
  execSync(
    `"${keytoolExe}" -genkeypair -v -keystore "${keystorePath}" -alias creepusik -keyalg RSA -keysize 2048 -validity 10000 -storepass creepusik123 -keypass creepusik123 -dname "CN=CReEPUSIK, OU=Mobile, O=CReEPUSIK, L=City, ST=State, C=US"`,
    { stdio: "inherit" }
  );
}

// 7. Sign with apksigner
fs.mkdirSync(downloadsDir, { recursive: true });
const targetApk = path.join(downloadsDir, "CReEPUSIK-v1.6.5.apk");
if (fs.existsSync(targetApk)) fs.unlinkSync(targetApk);
fs.copyFileSync(alignedApk, targetApk);

console.log("Signing APK with apksigner (v1, v2, v3)...");
execSync(
  `"${apksignerBat}" sign --ks "${keystorePath}" --ks-pass pass:creepusik123 --ks-key-alias creepusik --key-pass pass:creepusik123 --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "${targetApk}"`,
  { stdio: "inherit" }
);

// 8. Verify signature
console.log("Verifying APK signature...");
execSync(`"${apksignerBat}" verify --verbose "${targetApk}"`, { stdio: "inherit" });

// 9. Copy to dist/downloads
fs.mkdirSync(distDownloadsDir, { recursive: true });
const distTargetApk = path.join(distDownloadsDir, "CReEPUSIK-v1.6.5.apk");
fs.copyFileSync(targetApk, distTargetApk);

// 10. Clean staging directory
try {
  fs.rmSync(stagingDir, { recursive: true, force: true });
} catch {}

console.log("Successfully built, signed, and verified CReEPUSIK-v1.6.5.apk!");
