import { useEffect } from "react";
import { PageHeader } from "../components/Page";
import { ReleaseSection } from "../components/ReleaseSection";
import { SparkleIcon, RocketLaunchIcon } from "@phosphor-icons/react";

export default function Releases() {
  useEffect(() => {
    document.title = "App Releases & Download APK - CReEPUSIK";
  }, []);

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-12">
      <PageHeader title="Releases & Downloads" />

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface-2 via-surface-1 to-bg p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 size-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-text mb-3">
            <SparkleIcon size={16} weight="fill" />
            <span>Mobile Distribution Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
            Get CReEPUSIK for Android
          </h1>
          <p className="mt-2 text-sm text-fg-2 max-w-xl leading-relaxed">
            Experience ad-free audio streaming, real-time synchronized listening rooms, zero-lag permission controls, offline caching, and native background lock screen playback directly on your mobile device.
          </p>
        </div>

        {/* Release Section Component */}
        <ReleaseSection />

        {/* Changelog for v1.6.7 */}
        <div className="rounded-2xl border border-line bg-surface-1/50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <RocketLaunchIcon size={20} className="text-accent-text" />
            <h2 className="text-base font-semibold text-fg">What's New in Version 1.6.5</h2>
          </div>

          <ul className="space-y-2.5 text-xs text-fg-2">
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-1.5 rounded-full bg-accent shrink-0" />
              <div>
                <strong className="text-fg">Zero-Lag Realtime Room Control & Dual-Channel Sync:</strong> Reconfigured Supabase Realtime engine (100 events/second rate, 2.5s heartbeat ping) with dual-channel broadcasting for instant host & guest permission updates with zero lag.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-1.5 rounded-full bg-accent shrink-0" />
              <div>
                <strong className="text-fg">Active Room Live Indicators:</strong> Dynamic pulsating live indicators on the Desktop Navigation Rail, Mobile Bottom Tab Bar, and an interactive broadcast banner on the Home dashboard when rooms are active.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-1.5 rounded-full bg-accent shrink-0" />
              <div>
                <strong className="text-fg">Continuous Track Radio Streaming:</strong> Fixed "Start Radio From This Track" queue continuity to seamlessly pull related tracks and keep the music flowing without pause drops.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 size-1.5 rounded-full bg-accent shrink-0" />
              <div>
                <strong className="text-fg">Dedicated In-APK Settings Update Hub:</strong> The Android APK settings menu now cleanly displays the latest version changelog and direct GitHub repository link to check for new updates without redundant download prompts.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
