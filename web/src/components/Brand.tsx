import { cn } from "../lib/format";

/** The CReEPUSIK mark: modern geometric soundwave glyph embracing the C monogram. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer C crest */}
      <path
        d="M 33 11 C 30 8.5 25.5 7 20.5 7 C 11.4 7 4 14.6 4 24 C 4 33.4 11.4 41 20.5 41 C 25.5 41 30 39.5 33 37"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Dynamic Soundwave Frequencies */}
      <rect x="17.5" y="16" width="4" height="16" rx="2" fill="currentColor" />
      <rect x="25.5" y="11" width="4" height="26" rx="2" fill="currentColor" />
      <rect x="33.5" y="18" width="4" height="12" rx="2" fill="currentColor" />
      <rect x="41.5" y="21" width="3.5" height="6" rx="1.75" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-7 text-accent-text shrink-0" />
      <span className="text-[17px] font-black tracking-tight text-fg">
        <span className="text-accent-text">CReEP</span>USIK
      </span>
    </span>
  );
}

/** The mark in motion: marks the track that is playing. */
export function Equalizer({ live, className }: { live: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex h-3.5 items-end gap-[2px]", live && "eq-live", className)}>
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent-text" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent-text" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent-text" />
    </span>
  );
}