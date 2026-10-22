import {
  AndroidLogoIcon,
  ArrowSquareOutIcon,
  CheckCircleIcon,
  DownloadSimpleIcon,
  GitBranchIcon,
  InfoIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "../lib/format";

export interface ReleaseSectionProps {
  className?: string;
  showTitle?: boolean;
}

const GITHUB_REPO_URL = "https://github.com/CREESPYG/CReESPUSIK";
const GITHUB_RELEASE_URL = "https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.6.9";
const GITHUB_APK_RAW_URL =
  "https://github.com/CREESPYG/CReESPUSIK/releases/download/v1.6.9/CReEPUSIK-v1.6.9.apk";
const DIRECT_APK_URL = "/downloads/CReEPUSIK-v1.6.9.apk";

export function ReleaseSection({ className, showTitle = true }: ReleaseSectionProps) {
  const [copied, setCopied] = useState(false);
  const [isApk, setIsApk] = useState(false);

  useEffect(() => {
    // Detect whether running inside the Capacitor Android native shell or WebView
    const isNative =
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      Boolean((window as any).Capacitor?.isPluginAvailable) ||
      Boolean((window as any).musikePlayback) ||
      Boolean((window as any).androidBridge) ||
      /Android.*(wv|Version\/[\d.]+)/i.test(navigator.userAgent);
    setIsApk(isNative);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + DIRECT_APK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If inside the Android APK settings, only show the changes, latest changelog, and git repo link
  if (isApk) {
    return (
      <section className={cn("flex flex-col gap-3", className)}>
        {showTitle && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-text ring-1 ring-accent/30">
                <AndroidLogoIcon size={22} weight="fill" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-fg">App Updates & Changelog</h2>
                <p className="text-xs text-fg-3">Running CReEPUSIK Android App</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-text ring-1 ring-accent/25">
              <span className="size-2 rounded-full bg-accent animate-pulse" />
              v1.6.9 Latest
            </span>
          </div>
        )}

        {/* In-APK Changelog & Updates Card */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2/80 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-3.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-fg">CReEPUSIK for Android</span>
                <span className="rounded-md bg-surface-4 px-2 py-0.5 text-[11px] font-mono font-medium text-accent-text">
                  v1.6.9 (Build 10609)
                </span>
              </div>
              <p className="text-xs text-fg-3">Real-time room synchronization & zero-latency release</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-text bg-accent/10 px-2.5 py-1 rounded-full">
              <ShieldCheckIcon size={14} weight="fill" />
              Latest Installed
            </span>
          </div>

          {/* Latest Changelog List */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-fg">
              <RocketLaunchIcon size={16} className="text-accent-text" />
              <span>What's New in v1.6.9</span>
            </div>

            <ul className="space-y-2 text-xs text-fg-2">
              <li className="flex items-start gap-2 rounded-lg bg-surface-1/60 p-2.5">
                <span className="mt-0.5 size-1.5 rounded-full bg-accent shrink-0" />
                <div>
                  <strong className="text-fg">Native Media3 Engine:</strong> Music now plays on a real ExoPlayer inside the OS — the same architecture Spotify uses. Playback truly continues when the app is minimized, locked, or swiped from recents.
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-surface-1/60 p-2.5">
                <span className="mt-0.5 size-1.5 rounded-full bg-accent shrink-0" />
                <div>
                  <strong className="text-fg">Spotify-Grade Media Controls:</strong> Rich media notifications, lock screen controls, headphone buttons (pause resumes cleanly), and Bluetooth controls via Media3 MediaSession.
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-surface-1/60 p-2.5">
                <span className="mt-0.5 size-1.5 rounded-full bg-accent shrink-0" />
                <div>
                  <strong className="text-fg">Polite Attention Handling:</strong> Music pauses automatically when headphones are unplugged and yields to navigation or calls, resuming when the system allows.
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-surface-1/60 p-2.5">
                <span className="mt-0.5 size-1.5 rounded-full bg-accent shrink-0" />
                <div>
                  <strong className="text-fg">Playback Survives the System:</strong> Track artwork, title, artist, and progress are remembered natively, so the media bar shows the right song even after Android kills the app's UI process.
                </div>
              </li>
            </ul>
          </div>

          {/* Git Repo Link to check latest update */}
          <div className="mt-5 pt-3.5 border-t border-line/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-fg-3">Check releases, commits, and source code:</span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-accent-ink shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitBranchIcon size={16} weight="bold" />
              Check Latest Update on GitHub
              <ArrowSquareOutIcon size={13} />
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Web view: Show full download section, changelog, and install guide
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {showTitle && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent-text ring-1 ring-accent/30">
              <AndroidLogoIcon size={22} weight="fill" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-fg">CReEPUSIK Mobile Release</h2>
              <p className="text-xs text-fg-3">Official Android application package</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-text ring-1 ring-accent/25">
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            v1.6.9 Latest
          </span>
        </div>
      )}

      {/* Main Release Card */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2/70 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-line-hover">
        <div className="absolute -right-8 -top-8 size-36 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-fg">CReEPUSIK for Android</span>
              <span className="rounded-md bg-surface-4 px-2 py-0.5 text-[11px] font-mono font-medium text-fg-2">
                Build 10609
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-3">
              <span className="flex items-center gap-1 text-accent-text">
                <ShieldCheckIcon size={15} weight="fill" />
                Verified Signature (v2 + v3)
              </span>
              <span>•</span>
              <span>Size: ~6.4 MB</span>
              <span>•</span>
              <span>Target: Android 8.0 - 15+</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={DIRECT_APK_URL}
              download="CReEPUSIK-v1.6.9.apk"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-ink shadow-lg shadow-accent/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <DownloadSimpleIcon size={18} weight="bold" />
              Download APK
            </a>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center gap-2 rounded-lg bg-surface-1/50 px-3 py-2 text-fg-2">
            <CheckCircleIcon size={16} weight="fill" className="shrink-0 text-accent-text" />
            <span>Zero-lag real-time room control & sync</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-1/50 px-3 py-2 text-fg-2">
            <CheckCircleIcon size={16} weight="fill" className="shrink-0 text-accent-text" />
            <span>Live room activity indicators across app</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-1/50 px-3 py-2 text-fg-2">
            <CheckCircleIcon size={16} weight="fill" className="shrink-0 text-accent-text" />
            <span>Continuous track radio & instant playback</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-1/50 px-3 py-2 text-fg-2">
            <CheckCircleIcon size={16} weight="fill" className="shrink-0 text-accent-text" />
            <span>Ad-free background playback & lock screen notification</span>
          </div>
        </div>

        {/* Alternative Links */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/40 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-fg-3">
            <span>Mirror source:</span>
            <a
              href={GITHUB_APK_RAW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-fg hover:text-accent-text hover:underline transition-colors"
            >
              GitHub Direct Raw APK
              <ArrowSquareOutIcon size={13} />
            </a>
            <span>•</span>
            <a
              href={GITHUB_RELEASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-fg hover:text-accent-text hover:underline transition-colors"
            >
              GitHub Release Page
              <ArrowSquareOutIcon size={13} />
            </a>
            <span>•</span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-fg hover:text-accent-text hover:underline transition-colors"
            >
              GitHub Repo
              <ArrowSquareOutIcon size={13} />
            </a>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="text-xs text-fg-3 hover:text-fg transition-colors"
          >
            {copied ? "Link Copied!" : "Copy APK Download Link"}
          </button>
        </div>
      </div>

      {/* Quick Installation Guide */}
      <div className="rounded-xl border border-line/60 bg-surface-1/40 p-4 text-xs text-fg-2">
        <div className="flex items-center gap-2 font-medium text-fg mb-2">
          <InfoIcon size={16} className="text-accent-text" />
          <span>How to Install on Android</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-fg-3 leading-relaxed">
          <li>Tap the <strong>Download APK</strong> button above to download the file directly to your phone.</li>
          <li>Open your notification bar or Downloads folder and tap on <code className="rounded bg-surface-3 px-1 py-0.5 text-fg">CReEPUSIK-v1.6.9.apk</code>.</li>
          <li>If prompted, tap <em>Settings</em> and allow <em>"Install unknown apps"</em> for your browser.</li>
          <li>Tap <strong>Install</strong>, then launch CReEPUSIK to start listening!</li>
        </ol>
      </div>
    </section>
  );
}
