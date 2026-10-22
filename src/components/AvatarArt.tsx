import React from "react";
import { AVATARS, type AvatarMeta } from "../lib/room";

export { AVATARS as AVATAR_METAS, type AvatarMeta };

export function getAvatarMeta(id: number): AvatarMeta | undefined {
  return AVATARS[id];
}

/**
 * Real Vector Character Avatar Arts for CReEPUSIK.
 * High-definition, fully offline SVG character portraits with modern music & streetwear vibes.
 */
export function AvatarArt({
  id,
  className = "size-full",
  size,
  style,
}: {
  id?: number | null;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const safeId = typeof id === "number" && Number.isInteger(id) && id >= 0 && id < 16 ? id : -1;
  const dimensionStyle = size ? { width: size, height: size, ...style } : style;

  switch (safeId) {
    case 0:
      // Boy 0: Cyber Neo — Techwear, futuristic cyan visor, glowing accent
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Cyber Neo">
          <defs>
            <linearGradient id="av0-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="av0-visor" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="av0-hair" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av0-bg)" />
          {/* Cyber grid lines */}
          <circle cx="50" cy="50" r="46" fill="none" stroke="#38bdf8" strokeWidth="0.75" strokeOpacity="0.3" strokeDasharray="3 3" />
          {/* Jacket / shoulders */}
          <path d="M16 100 C18 78 32 72 50 72 C68 72 82 78 84 100 Z" fill="#09090b" />
          <path d="M38 74 L50 94 L62 74 Z" fill="#18181b" />
          <path d="M47 80 L50 96 L53 80 Z" fill="#06b6d4" />
          {/* Glowing jacket piping */}
          <path d="M26 95 C30 84 38 80 48 80" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M74 95 C70 84 62 80 52 80" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
          {/* Neck */}
          <rect x="43" y="60" width="14" height="16" rx="4" fill="#e0a96d" />
          <path d="M43 68 C47 72 53 72 57 68 Z" fill="#c68642" opacity="0.4" />
          {/* Head base */}
          <ellipse cx="50" cy="48" rx="19" ry="22" fill="#f5caa0" />
          {/* Ears */}
          <circle cx="31" cy="49" r="4.5" fill="#e0a96d" />
          <circle cx="69" cy="49" r="4.5" fill="#e0a96d" />
          {/* Cyber earpiece */}
          <rect x="29" y="46" width="3" height="7" rx="1.5" fill="#06b6d4" />
          <rect x="68" y="46" width="3" height="7" rx="1.5" fill="#06b6d4" />
          {/* Hair back & side fade */}
          <path d="M31 43 C31 28 42 20 50 20 C58 20 69 28 69 43 C69 43 65 30 50 28 C35 30 31 43 31 43 Z" fill="url(#av0-hair)" />
          {/* High quiff hair */}
          <path d="M32 34 C35 18 48 14 58 17 C68 20 68 28 67 36 C63 30 54 26 44 28 C38 29 34 32 32 34 Z" fill="#0f172a" />
          <path d="M38 24 C44 18 52 16 60 19 C56 22 48 22 42 26 Z" fill="#38bdf8" />
          {/* Visor glowing strap & lens */}
          <rect x="28" y="40" width="44" height="13" rx="4" fill="url(#av0-visor)" />
          <rect x="31" y="42" width="38" height="9" rx="2.5" fill="#083344" />
          <line x1="33" y1="46" x2="67" y2="46" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="63" cy="46" r="1.5" fill="#67e8f9" />
          {/* Nose & Mouth */}
          <path d="M49 57 L51 57" stroke="#c68642" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M46 62 Q50 64 54 62" fill="none" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 1:
      // Boy 1: Audio DJ — Snapback cap, red over-ear studio headphones, golden skin
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Audio DJ">
          <defs>
            <linearGradient id="av1-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="av1-hp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av1-bg)" />
          {/* Sound waves backdrop */}
          <path d="M12 50 Q20 44 28 50 T44 50" fill="none" stroke="#fde68a" strokeWidth="1" strokeOpacity="0.4" />
          <path d="M56 50 Q64 44 72 50 T88 50" fill="none" stroke="#fde68a" strokeWidth="1" strokeOpacity="0.4" />
          {/* Streetwear hoodie */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#18181b" />
          <path d="M41 74 C44 86 46 95 46 100" fill="none" stroke="#e4e4e7" strokeWidth="1.5" />
          <path d="M59 74 C56 86 54 95 54 100" fill="none" stroke="#e4e4e7" strokeWidth="1.5" />
          {/* Neck */}
          <rect x="43" y="60" width="14" height="16" rx="4" fill="#a16207" />
          <ellipse cx="50" cy="49" rx="19" ry="21" fill="#ca8a04" />
          {/* Facial features */}
          <ellipse cx="42" cy="48" rx="2.2" ry="2.5" fill="#18181b" />
          <ellipse cx="58" cy="48" rx="2.2" ry="2.5" fill="#18181b" />
          <circle cx="43" cy="47" r="0.8" fill="#ffffff" />
          <circle cx="59" cy="47" r="0.8" fill="#ffffff" />
          {/* Confident brows */}
          <path d="M38 43 L46 44" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
          <path d="M54 44 L62 43" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
          {/* Nose & Smile */}
          <path d="M48 53 Q50 55 52 53" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M44 60 Q50 65 56 60" fill="none" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
          {/* Backward snapback cap */}
          <path d="M30 38 C31 22 42 16 50 16 C58 16 69 22 70 38 Z" fill="#dc2626" />
          <ellipse cx="50" cy="38" rx="20" ry="5" fill="#991b1b" />
          {/* Snapback backward tab */}
          <rect x="44" y="34" width="12" height="4" rx="2" fill="#18181b" />
          <circle cx="48" cy="36" r="0.8" fill="#ffffff" />
          <circle cx="52" cy="36" r="0.8" fill="#ffffff" />
          {/* DJ Headphones over neck/ears */}
          <path d="M26 36 C24 24 36 12 50 12 C64 12 76 24 74 36" fill="none" stroke="#27272a" strokeWidth="4" strokeLinecap="round" />
          <rect x="23" y="38" width="9" height="18" rx="4.5" fill="url(#av1-hp)" />
          <rect x="68" y="38" width="9" height="18" rx="4.5" fill="url(#av1-hp)" />
          <rect x="25" y="41" width="5" height="12" rx="2.5" fill="#18181b" />
          <rect x="70" y="41" width="5" height="12" rx="2.5" fill="#18181b" />
        </svg>
      );

    case 2:
      // Boy 2: Lofi Chill — Fluffy messy brown hair, sage chunky turtleneck, round gold wireframes
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Lofi Chill">
          <defs>
            <linearGradient id="av2-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="50%" stopColor="#831843" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av2-bg)" />
          {/* Chunky knit sweater */}
          <path d="M16 100 C18 78 30 70 50 70 C70 70 82 78 84 100 Z" fill="#047857" />
          {/* Knitted turtleneck collar */}
          <ellipse cx="50" cy="71" rx="16" ry="6" fill="#065f46" stroke="#059669" strokeWidth="1" />
          <ellipse cx="50" cy="67" rx="14" ry="5" fill="#047857" />
          {/* Head base */}
          <ellipse cx="50" cy="47" rx="18" ry="21" fill="#fde68a" />
          {/* Ears */}
          <circle cx="32" cy="48" r="4" fill="#fcd34d" />
          <circle cx="68" cy="48" r="4" fill="#fcd34d" />
          {/* Fluffy messy wavy hair */}
          <path d="M28 42 C26 28 36 15 50 15 C64 15 74 28 72 42 C70 33 64 25 50 25 C36 25 30 33 28 42 Z" fill="#451a03" />
          {/* Messy bangs falling on forehead */}
          <path d="M28 35 C34 22 45 20 54 22 C64 24 72 32 72 38 C68 33 60 30 52 33 C46 35 41 38 36 37 C32 37 29 36 28 35 Z" fill="#78350f" />
          <path d="M38 32 C42 26 48 24 55 26 C48 28 44 32 40 37 Z" fill="#92400e" />
          {/* Round wireframe glasses */}
          <circle cx="42" cy="48" r="7" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="58" cy="48" r="7" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="49" y1="48" x2="51" y2="48" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Chill eyes inside glasses */}
          <path d="M39 49 Q42 51 45 49" fill="none" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M55 49 Q58 51 61 49" fill="none" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
          {/* Soft blush & smile */}
          <circle cx="36" cy="54" r="3" fill="#f43f5e" opacity="0.25" />
          <circle cx="64" cy="54" r="3" fill="#f43f5e" opacity="0.25" />
          <path d="M47 58 Q50 61 53 58" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 3:
      // Boy 3: Synthwave Retro — Mirrored shades, 80s outrun jacket, dark pompadour
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Synthwave">
          <defs>
            <linearGradient id="av3-bg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="50%" stopColor="#701a75" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="av3-shades" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av3-bg)" />
          {/* Grid sun lines */}
          <line x1="20" y1="65" x2="80" y2="65" stroke="#f472b6" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="16" y1="75" x2="84" y2="75" stroke="#f472b6" strokeWidth="0.75" strokeOpacity="0.3" />
          {/* Teal & purple retro windbreaker */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#0e7490" />
          <path d="M35 73 L50 100 L65 73 Z" fill="#a21caf" />
          <path d="M46 76 L50 100 L54 76 Z" fill="#facc15" />
          {/* Neck */}
          <rect x="43" y="60" width="14" height="16" rx="4" fill="#d97706" />
          <ellipse cx="50" cy="48" rx="18" ry="21" fill="#f59e0b" />
          {/* High volume retro pompadour */}
          <path d="M30 38 C28 20 40 10 54 11 C68 12 72 24 70 38 C66 28 58 20 46 22 C36 24 32 30 30 38 Z" fill="#18181b" />
          <path d="M38 18 C46 14 56 14 62 18 C56 19 48 21 42 26 Z" fill="#3f3f46" />
          {/* Mirrored neon shades */}
          <polygon points="30,42 48,42 46,54 34,54" fill="url(#av3-shades)" />
          <polygon points="52,42 70,42 66,54 54,54" fill="url(#av3-shades)" />
          <line x1="48" y1="44" x2="52" y2="44" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="33" y1="46" x2="45" y2="46" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
          <line x1="55" y1="46" x2="67" y2="46" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
          {/* Mouth */}
          <path d="M46 62 Q50 64 54 62" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 4:
      // Boy 4: Urban Fade — Razor skin fade, deep rich melanin tone, silver diamond stud & link chain
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Urban Fade">
          <defs>
            <linearGradient id="av4-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="50%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av4-bg)" />
          {/* Sleek black tee with silver chain */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#09090b" />
          <path d="M38 72 C42 84 58 84 62 72" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          {/* Neck */}
          <rect x="42" y="58" width="16" height="18" rx="4" fill="#713f12" />
          {/* Head */}
          <ellipse cx="50" cy="47" rx="19" ry="22" fill="#854d0e" />
          {/* Crisp Buzzcut fade with hairline */}
          <path d="M31 42 C31 24 40 18 50 18 C60 18 69 24 69 42 C67 30 60 25 50 25 C40 25 33 30 31 42 Z" fill="#18181b" />
          <path d="M34 32 L40 27 L60 27 L66 32" stroke="#18181b" strokeWidth="3" fill="none" />
          {/* Shaved razor line in fade */}
          <line x1="33" y1="36" x2="38" y2="33" stroke="#854d0e" strokeWidth="1.5" />
          {/* Ears with silver stud */}
          <circle cx="31" cy="49" r="4.5" fill="#713f12" />
          <circle cx="69" cy="49" r="4.5" fill="#713f12" />
          <circle cx="32" cy="51" r="1.5" fill="#ffffff" />
          {/* Expressive dark eyes & sharp brows */}
          <path d="M38 42 L47 41" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M53 41 L62 42" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="42.5" cy="47" rx="2.5" ry="3" fill="#18181b" />
          <ellipse cx="57.5" cy="47" rx="2.5" ry="3" fill="#18181b" />
          <circle cx="43.5" cy="46" r="1" fill="#ffffff" />
          <circle cx="58.5" cy="46" r="1" fill="#ffffff" />
          {/* Nose & Beard contour */}
          <path d="M47 54 Q50 56 53 54" fill="none" stroke="#582d09" strokeWidth="2" strokeLinecap="round" />
          <path d="M45 61 Q50 64 55 61" fill="none" stroke="#3b1d06" strokeWidth="2" strokeLinecap="round" />
          <path d="M39 52 C41 65 59 65 61 52" fill="none" stroke="#18181b" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="1 1" />
        </svg>
      );

    case 5:
      // Boy 5: Scholar / Classic — Side-part groomed hair, midnight navy, tortoiseshell round frames, collared suit
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Scholar">
          <defs>
            <linearGradient id="av5-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av5-bg)" />
          {/* Suit & tie */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#1e293b" />
          <polygon points="44,72 50,88 56,72" fill="#ffffff" />
          <polygon points="48,76 52,76 53,96 50,100 47,96" fill="#991b1b" />
          {/* Neck */}
          <rect x="43" y="60" width="14" height="16" rx="4" fill="#fed7aa" />
          <ellipse cx="50" cy="47" rx="18" ry="21" fill="#ffedd5" />
          {/* Polished side-part dark hair */}
          <path d="M29 38 C28 22 40 14 50 14 C62 14 71 22 71 38 C68 26 58 20 44 20 C36 20 30 28 29 38 Z" fill="#1c1917" />
          <path d="M32 28 C42 16 54 18 68 26 C60 22 48 20 38 24 Z" fill="#44403c" />
          {/* Round bronze spectacles */}
          <circle cx="42" cy="47" r="6.5" fill="none" stroke="#b45309" strokeWidth="1.75" />
          <circle cx="58" cy="47" r="6.5" fill="none" stroke="#b45309" strokeWidth="1.75" />
          <line x1="48.5" y1="47" x2="51.5" y2="47" stroke="#b45309" strokeWidth="1.75" />
          {/* Eyes behind glass */}
          <circle cx="42" cy="47" r="2.2" fill="#1c1917" />
          <circle cx="58" cy="47" r="2.2" fill="#1c1917" />
          <circle cx="43" cy="46" r="0.8" fill="#ffffff" />
          <circle cx="59" cy="46" r="0.8" fill="#ffffff" />
          {/* Brows */}
          <path d="M37 39 Q42 38 46 40" fill="none" stroke="#292524" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M54 40 Q58 38 63 39" fill="none" stroke="#292524" strokeWidth="1.8" strokeLinecap="round" />
          {/* Smile */}
          <path d="M46 59 Q50 62 54 59" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 6:
      // Boy 6: Skater Beanie — Folded mustard beanie, messy brown fringe, bandage on nose, hoop earring
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Skater Beanie">
          <defs>
            <linearGradient id="av6-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9a3412" />
              <stop offset="60%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av6-bg)" />
          {/* Plaid / skater flannel */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#991b1b" />
          <path d="M38 72 L50 100 L62 72 Z" fill="#27272a" />
          {/* Neck */}
          <rect x="43" y="60" width="14" height="16" rx="4" fill="#e0a96d" />
          <ellipse cx="50" cy="49" rx="18" ry="21" fill="#fcd34d" />
          {/* Ears with hoop */}
          <circle cx="32" cy="51" r="4" fill="#e0a96d" />
          <circle cx="68" cy="51" r="4" fill="#e0a96d" />
          <circle cx="32" cy="53" r="2.5" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          {/* Eyes */}
          <ellipse cx="42" cy="50" rx="2.2" ry="2.5" fill="#18181b" />
          <ellipse cx="58" cy="50" rx="2.2" ry="2.5" fill="#18181b" />
          <circle cx="43" cy="49" r="0.8" fill="#ffffff" />
          <circle cx="59" cy="49" r="0.8" fill="#ffffff" />
          {/* Bandage on nose bridge */}
          <rect x="46" y="52" width="8" height="3.5" rx="1" fill="#fed7aa" stroke="#f59e0b" strokeWidth="0.5" transform="rotate(-5 50 54)" />
          {/* Grin */}
          <path d="M44 61 Q50 66 56 61" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          {/* Messy fringe under beanie */}
          <path d="M31 38 C36 34 42 38 48 35 C54 38 61 34 68 39 C62 34 54 32 46 33 C38 34 34 36 31 38 Z" fill="#451a03" />
          {/* Folded mustard fisherman beanie */}
          <path d="M28 32 C28 16 38 12 50 12 C62 12 72 16 72 32 Z" fill="#ca8a04" />
          <rect x="26" y="28" width="48" height="8" rx="4" fill="#eab308" stroke="#a16207" strokeWidth="0.75" />
        </svg>
      );

    case 7:
      // Boy 7: Tech Starlight — Anime frost silver spikes, cosmic background, cyan earpiece, high-collar techwear
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Tech Starlight">
          <defs>
            <linearGradient id="av7-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="av7-silver" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av7-bg)" />
          {/* Starlight sparkles */}
          <polygon points="24,24 25,21 26,24 29,25 26,26 25,29 24,26 21,25" fill="#a5b4fc" opacity="0.8" />
          <polygon points="76,30 77,28 78,30 80,31 78,32 77,34 76,32 74,31" fill="#67e8f9" opacity="0.8" />
          {/* High collar white/black tech suit */}
          <path d="M16 100 C18 78 30 70 50 70 C70 70 82 78 84 100 Z" fill="#0f172a" />
          <path d="M34 70 L50 90 L66 70 Z" fill="#f8fafc" />
          <circle cx="50" cy="84" r="2" fill="#38bdf8" />
          {/* Head & neck */}
          <rect x="43" y="58" width="14" height="16" rx="4" fill="#fed7aa" />
          <ellipse cx="50" cy="46" rx="18" ry="21" fill="#ffedd5" />
          {/* Futuristic earpiece */}
          <circle cx="31" cy="47" r="3.5" fill="#0284c7" />
          <circle cx="31" cy="47" r="1.5" fill="#38bdf8" />
          {/* Piercing silver/lavender eyes */}
          <ellipse cx="42" cy="45" rx="2.5" ry="3" fill="#4338ca" />
          <ellipse cx="58" cy="45" rx="2.5" ry="3" fill="#4338ca" />
          <circle cx="43" cy="44" r="1" fill="#67e8f9" />
          <circle cx="59" cy="44" r="1" fill="#67e8f9" />
          {/* Refined brows */}
          <path d="M38 40 L46 40" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <path d="M54 40 L62 40" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <path d="M47 57 Q50 59 53 57" fill="none" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
          {/* Frost silver dynamic spiky anime hair */}
          <path d="M30 38 C28 24 35 14 50 12 C65 14 72 24 70 38 C64 26 55 19 46 20 C38 21 34 28 30 38 Z" fill="url(#av7-silver)" />
          {/* Front anime spikes */}
          <polygon points="36,24 43,14 46,26" fill="url(#av7-silver)" />
          <polygon points="46,22 53,10 56,24" fill="url(#av7-silver)" />
          <polygon points="56,22 64,16 63,28" fill="url(#av7-silver)" />
          <polygon points="30,32 36,22 40,32" fill="url(#av7-silver)" />
        </svg>
      );

    case 8:
      // Girl 8: Cyber Pop — Twin space buns, bubblegum pink hair, cyber star sticker, neon magenta aura
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Cyber Pop">
          <defs>
            <linearGradient id="av8-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#831843" />
              <stop offset="50%" stopColor="#be185d" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            <linearGradient id="av8-hair" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av8-bg)" />
          {/* Space buns on top */}
          <circle cx="28" cy="22" r="10" fill="url(#av8-hair)" />
          <circle cx="72" cy="22" r="10" fill="url(#av8-hair)" />
          <circle cx="28" cy="22" r="8" fill="#db2777" />
          <circle cx="72" cy="22" r="8" fill="#db2777" />
          {/* Neon hair ties */}
          <rect x="25" y="27" width="6" height="3" rx="1.5" fill="#22d3ee" />
          <rect x="69" y="27" width="6" height="3" rx="1.5" fill="#22d3ee" />
          {/* Holographic pastel jacket */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#c084fc" />
          <path d="M38 72 L50 96 L62 72 Z" fill="#fdf4ff" />
          <path d="M46 78 L50 98 L54 78 Z" fill="#22d3ee" />
          {/* Neck */}
          <rect x="44" y="60" width="12" height="15" rx="4" fill="#fbcfe8" />
          <ellipse cx="50" cy="48" rx="17" ry="20" fill="#fdf2f8" />
          {/* Flowing side bangs */}
          <path d="M31 36 C30 22 40 18 50 18 C60 18 70 22 69 36 C66 30 58 26 50 26 C42 26 34 30 31 36 Z" fill="url(#av8-hair)" />
          <path d="M32 34 C33 46 30 54 28 58 C32 54 36 46 36 36 Z" fill="url(#av8-hair)" />
          <path d="M68 34 C67 46 70 54 72 58 C68 54 64 46 64 36 Z" fill="url(#av8-hair)" />
          {/* Big anime eyes with shine */}
          <ellipse cx="42" cy="47" rx="3.2" ry="4" fill="#831843" />
          <ellipse cx="58" cy="47" rx="3.2" ry="4" fill="#831843" />
          <circle cx="43" cy="45" r="1.5" fill="#ffffff" />
          <circle cx="59" cy="45" r="1.5" fill="#ffffff" />
          <circle cx="41" cy="49" r="0.8" fill="#f472b6" />
          <circle cx="57" cy="49" r="0.8" fill="#f472b6" />
          {/* Delicate brows & lashes */}
          <path d="M38 41 Q42 39 46 41" fill="none" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M54 41 Q58 39 62 41" fill="none" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" />
          {/* Star sticker under eye */}
          <polygon points="63,53 63.8,51.5 65.5,51.5 64,50.2 64.6,48.5 63,49.5 61.4,48.5 62,50.2 60.5,51.5 62.2,51.5" fill="#06b6d4" />
          {/* Soft pink blush & glossy lips */}
          <circle cx="36" cy="52" r="3.5" fill="#f472b6" opacity="0.35" />
          <path d="M47 58 Q50 61 53 58" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 9:
      // Girl 9: Acoustic Indie — Long wavy chestnut locks, cozy slouchy green beanie, knit scarf
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Acoustic Indie">
          <defs>
            <linearGradient id="av9-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#701a75" />
              <stop offset="50%" stopColor="#a21caf" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="av9-hair" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5c2b09" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av9-bg)" />
          {/* Long wavy hair behind shoulders */}
          <path d="M22 45 C18 65 24 85 28 100 L72 100 C76 85 82 65 78 45 Z" fill="url(#av9-hair)" />
          {/* Denim jacket & oversized knit scarf */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#1e3a8a" />
          {/* Burnt orange scarf */}
          <ellipse cx="50" cy="74" rx="18" ry="8" fill="#ea580c" />
          <ellipse cx="50" cy="68" rx="15" ry="6" fill="#c2410c" />
          {/* Neck & Face */}
          <rect x="44" y="58" width="12" height="14" rx="4" fill="#fcd34d" />
          <ellipse cx="50" cy="46" rx="16" ry="19" fill="#fef08a" />
          {/* Flowing front hair framing face */}
          <path d="M30 40 C32 58 35 68 38 74 C34 70 30 58 30 40 Z" fill="url(#av9-hair)" />
          <path d="M70 40 C68 58 65 68 62 74 C66 70 70 58 70 40 Z" fill="url(#av9-hair)" />
          {/* Gentle warm hazel eyes */}
          <ellipse cx="43" cy="46" rx="2.5" ry="3" fill="#451a03" />
          <ellipse cx="57" cy="46" rx="2.5" ry="3" fill="#451a03" />
          <circle cx="44" cy="45" r="1" fill="#ffffff" />
          <circle cx="58" cy="45" r="1" fill="#ffffff" />
          {/* Soft brows */}
          <path d="M39 40 Q43 39 47 41" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M53 41 Q57 39 61 40" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          {/* Warm smile */}
          <path d="M47 55 Q50 58 53 55" fill="none" stroke="#b45309" strokeWidth="1.75" strokeLinecap="round" />
          {/* Slouchy olive green beanie */}
          <path d="M28 32 C28 14 40 10 54 10 C68 10 74 18 72 32 Z" fill="#15803d" />
          <rect x="27" y="27" width="46" height="8" rx="4" fill="#166534" />
          {/* Small daisy flower on beanie */}
          <circle cx="64" cy="28" r="2.5" fill="#fef08a" />
          <circle cx="64" cy="28" r="1" fill="#ea580c" />
        </svg>
      );

    case 10:
      // Girl 10: Chic Noir — Sharp French bob, trendy cat-eye shades, crimson red lip, gold pendant
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Chic Bob">
          <defs>
            <linearGradient id="av10-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c0519" />
              <stop offset="50%" stopColor="#881337" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av10-bg)" />
          {/* Sleek black turtleneck */}
          <path d="M16 100 C18 78 30 70 50 70 C70 70 82 78 84 100 Z" fill="#09090b" />
          <ellipse cx="50" cy="71" rx="14" ry="5" fill="#18181b" />
          {/* Gold coin pendant */}
          <path d="M47 71 L50 82 L53 71" fill="none" stroke="#fbbf24" strokeWidth="1" />
          <circle cx="50" cy="83" r="2" fill="#fbbf24" />
          {/* Neck */}
          <rect x="44" y="58" width="12" height="15" rx="4" fill="#fed7aa" />
          <ellipse cx="50" cy="46" rx="16" ry="19" fill="#ffedd5" />
          {/* Sharp sleek French bob haircut */}
          <path d="M26 38 C26 18 36 12 50 12 C64 12 74 18 74 38 C74 52 70 60 67 64 C64 54 64 42 64 36 C64 26 56 22 50 22 C44 22 36 26 36 36 C36 42 36 54 33 64 C30 60 26 52 26 38 Z" fill="#09090b" />
          {/* Blunt bangs */}
          <path d="M34 26 C42 22 58 22 66 26 C64 32 58 33 50 33 C42 33 36 32 34 26 Z" fill="#18181b" />
          {/* Trendy cat-eye sunglasses */}
          <polygon points="30,42 48,44 45,52 34,50" fill="#09090b" />
          <polygon points="52,44 70,42 66,50 55,52" fill="#09090b" />
          <line x1="48" y1="44" x2="52" y2="44" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="33" y1="44" x2="44" y2="45" stroke="#475569" strokeWidth="0.75" />
          <line x1="56" y1="45" x2="67" y2="44" stroke="#475569" strokeWidth="0.75" />
          {/* Classic crimson red lipstick */}
          <path d="M46 58 Q50 61 54 58" fill="none" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" />
          {/* Gold pearl earring */}
          <circle cx="33" cy="52" r="1.5" fill="#fef08a" />
          <circle cx="67" cy="52" r="1.5" fill="#fef08a" />
        </svg>
      );

    case 11:
      // Girl 11: RGB Gamer Girl — Cat-ear gaming headset, half mint half pastel lavender hair, oversized graphic hoodie
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="RGB Gamer">
          <defs>
            <linearGradient id="av11-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="60%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av11-bg)" />
          {/* Black anime hoodie */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#18181b" />
          <path d="M44 78 Q50 82 56 78" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
          {/* Neck */}
          <rect x="44" y="60" width="12" height="15" rx="4" fill="#fed7aa" />
          <ellipse cx="50" cy="48" rx="16" ry="19" fill="#fff1f2" />
          {/* Split-dye hair: left half pastel mint (#5eead4), right half pastel lavender (#c084fc) */}
          <path d="M28 36 C28 20 38 18 50 18 L50 40 C42 40 34 44 28 56 Z" fill="#2dd4bf" />
          <path d="M50 18 C62 18 72 20 72 36 C66 44 58 40 50 40 Z" fill="#c084fc" />
          {/* Playful anime eyes: wink on right! */}
          <ellipse cx="43" cy="47" rx="3" ry="3.5" fill="#18181b" />
          <circle cx="44" cy="46" r="1.2" fill="#ffffff" />
          {/* Wink on right eye */}
          <path d="M54 48 Q58 44 62 48" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
          {/* Cute open smile & blush */}
          <circle cx="37" cy="52" r="3" fill="#f43f5e" opacity="0.3" />
          <circle cx="63" cy="52" r="3" fill="#f43f5e" opacity="0.3" />
          <path d="M47 57 Q50 61 53 57" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
          {/* Cat-ear RGB gaming headset */}
          <path d="M25 36 C24 22 36 12 50 12 C64 12 76 22 75 36" fill="none" stroke="#f4f4f5" strokeWidth="3.5" strokeLinecap="round" />
          {/* Glowing Cat Ears on band */}
          <polygon points="32,18 36,6 44,14" fill="#f4f4f5" stroke="#ec4899" strokeWidth="1" />
          <polygon points="35,16 37,9 41,14" fill="#ec4899" />
          <polygon points="68,18 64,6 56,14" fill="#f4f4f5" stroke="#22d3ee" strokeWidth="1" />
          <polygon points="65,16 63,9 59,14" fill="#22d3ee" />
          {/* Earcups */}
          <rect x="22" y="38" width="8" height="16" rx="4" fill="#f4f4f5" />
          <rect x="70" y="38" width="8" height="16" rx="4" fill="#f4f4f5" />
          <circle cx="26" cy="46" r="2" fill="#ec4899" />
          <circle cx="74" cy="46" r="2" fill="#22d3ee" />
        </svg>
      );

    case 12:
      // Girl 12: Solar Queen — Afro puffs with golden hair rings, golden hoop earrings, radiant melanin glow
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Solar Queen">
          <defs>
            <linearGradient id="av12-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av12-bg)" />
          {/* Voluminous double high afro puffs */}
          <circle cx="26" cy="26" r="14" fill="#18181b" />
          <circle cx="74" cy="26" r="14" fill="#18181b" />
          {/* Gold cuffs in afro puffs */}
          <rect x="24" y="24" width="5" height="3" rx="1.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
          <rect x="72" y="24" width="5" height="3" rx="1.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
          {/* Radiant off-shoulder mustard top */}
          <path d="M16 100 C18 78 30 74 50 74 C70 74 82 78 84 100 Z" fill="#b45309" />
          <path d="M26 80 C36 76 64 76 74 80" stroke="#fde047" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
          {/* Neck & Shoulders */}
          <rect x="42" y="58" width="16" height="18" rx="4" fill="#713f12" />
          <ellipse cx="50" cy="47" rx="18" ry="21" fill="#854d0e" />
          {/* Sleek edge styling on forehead */}
          <path d="M32 36 C34 26 42 22 50 22 C58 22 66 26 68 36 C64 30 58 26 50 27 C42 26 36 30 32 36 Z" fill="#18181b" />
          <path d="M38 30 Q42 34 44 30" fill="none" stroke="#18181b" strokeWidth="1.5" />
          <path d="M62 30 Q58 34 56 30" fill="none" stroke="#18181b" strokeWidth="1.5" />
          {/* Big gleaming gold hoop earrings */}
          <circle cx="30" cy="50" r="6" fill="none" stroke="#fbbf24" strokeWidth="1.75" />
          <circle cx="70" cy="50" r="6" fill="none" stroke="#fbbf24" strokeWidth="1.75" />
          {/* Radiant almond eyes with golden eyeliner */}
          <ellipse cx="42" cy="46" rx="2.8" ry="3.2" fill="#18181b" />
          <ellipse cx="58" cy="46" rx="2.8" ry="3.2" fill="#18181b" />
          <circle cx="43" cy="45" r="1.2" fill="#ffffff" />
          <circle cx="59" cy="45" r="1.2" fill="#ffffff" />
          <path d="M38 42 L46 42" stroke="#fde047" strokeWidth="1" strokeLinecap="round" />
          <path d="M54 42 L62 42" stroke="#fde047" strokeWidth="1" strokeLinecap="round" />
          {/* Full warm lips & smile */}
          <path d="M45 58 Q50 63 55 58" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 13:
      // Girl 13: Star Dreamer — Pastel varsity jacket, lavender-silver locks, star hair clips, dreamy eyes
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Star Dreamer">
          <defs>
            <linearGradient id="av13-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="50%" stopColor="#3730a3" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="av13-hair" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="50%" stopColor="#c7d2fe" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av13-bg)" />
          {/* Background sparkles */}
          <circle cx="22" cy="30" r="1.5" fill="#fef08a" />
          <circle cx="78" cy="24" r="1.5" fill="#fef08a" />
          {/* Baby blue varsity jacket with music patch */}
          <path d="M16 100 C18 78 30 72 50 72 C70 72 82 78 84 100 Z" fill="#38bdf8" />
          <path d="M36 72 L50 96 L64 72 Z" fill="#ffffff" />
          <circle cx="34" cy="84" r="2.5" fill="#fbbf24" />
          {/* Neck */}
          <rect x="44" y="60" width="12" height="14" rx="4" fill="#fde68a" />
          <ellipse cx="50" cy="47" rx="16" ry="19" fill="#fef9c3" />
          {/* Flowing layered lavender-silver hair */}
          <path d="M26 40 C24 22 36 14 50 14 C64 14 76 22 74 40 C72 56 68 70 65 80 C62 65 64 45 64 36 C64 26 56 22 50 22 C44 22 36 26 36 36 C36 45 38 65 35 80 C32 70 28 56 26 40 Z" fill="url(#av13-hair)" />
          {/* Soft fringe bangs */}
          <path d="M36 26 C42 32 58 32 64 26 C60 33 54 34 50 34 C46 34 40 33 36 26 Z" fill="#c7d2fe" />
          {/* Golden star hair clips */}
          <polygon points="32,28 33,26 34,28 36,29 34,30 33,32 32,30 30,29" fill="#fbbf24" />
          <polygon points="68,28 69,26 70,28 72,29 70,30 69,32 68,30 66,29" fill="#fbbf24" />
          {/* Dreamy sparkling purple eyes */}
          <ellipse cx="43" cy="46" rx="3" ry="3.8" fill="#4338ca" />
          <ellipse cx="57" cy="46" rx="3" ry="3.8" fill="#4338ca" />
          <circle cx="44" cy="44" r="1.3" fill="#ffffff" />
          <circle cx="58" cy="44" r="1.3" fill="#ffffff" />
          <polygon points="42,47 43,46.5 44,47 43.5,48" fill="#e0e7ff" />
          <polygon points="56,47 57,46.5 58,47 57.5,48" fill="#e0e7ff" />
          {/* Blush & smile */}
          <circle cx="37" cy="51" r="3" fill="#f43f5e" opacity="0.25" />
          <circle cx="63" cy="51" r="3" fill="#f43f5e" opacity="0.25" />
          <path d="M47 56 Q50 59 53 56" fill="none" stroke="#db2777" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );

    case 14:
      // Girl 14: Lofi Scholar — Cozy oversized cable-knit, messy high bun, round wireframes, warm mocha tones
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Lofi Scholar">
          <defs>
            <linearGradient id="av14-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="50%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av14-bg)" />
          {/* Messy top bun with loose curly strands */}
          <circle cx="50" cy="16" r="11" fill="#451a03" />
          <circle cx="48" cy="15" r="9" fill="#582d09" />
          {/* Chunky oversized mustard cable-knit sweater */}
          <path d="M16 100 C18 78 30 70 50 70 C70 70 82 78 84 100 Z" fill="#ca8a04" />
          <ellipse cx="50" cy="71" rx="14" ry="5" fill="#a16207" />
          {/* Neck */}
          <rect x="44" y="58" width="12" height="14" rx="4" fill="#fde68a" />
          <ellipse cx="50" cy="46" rx="16" ry="19" fill="#fef3c7" />
          {/* Messy auburn hair falling around ears */}
          <path d="M28 36 C28 20 38 16 50 16 C62 16 72 20 72 36 C68 32 60 28 50 28 C40 28 32 32 28 36 Z" fill="#451a03" />
          <path d="M30 36 C32 46 30 52 28 56 C32 50 35 44 35 36 Z" fill="#582d09" />
          <path d="M70 36 C68 46 70 52 72 56 C68 50 65 44 65 36 Z" fill="#582d09" />
          {/* Big round aesthetic wireframe glasses */}
          <circle cx="42" cy="47" r="6.5" fill="none" stroke="#eab308" strokeWidth="1.6" />
          <circle cx="58" cy="47" r="6.5" fill="none" stroke="#eab308" strokeWidth="1.6" />
          <line x1="48.5" y1="47" x2="51.5" y2="47" stroke="#eab308" strokeWidth="1.6" />
          {/* Intelligent warm brown eyes */}
          <circle cx="42" cy="47" r="2.2" fill="#292524" />
          <circle cx="58" cy="47" r="2.2" fill="#292524" />
          <circle cx="43" cy="46" r="0.8" fill="#ffffff" />
          <circle cx="59" cy="46" r="0.8" fill="#ffffff" />
          {/* Soft warm smile */}
          <path d="M47 56 Q50 59 53 56" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 15:
      // Girl 15: Electro Punk — Distressed black leather biker jacket, pink dip-dyed shag cut, lightning bolt earring
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Electro Punk">
          <defs>
            <linearGradient id="av15-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c0519" />
              <stop offset="50%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="av15-hair" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="60%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av15-bg)" />
          {/* Leather biker jacket with silver zipper & lapels */}
          <path d="M16 100 C18 78 30 70 50 70 C70 70 82 78 84 100 Z" fill="#09090b" />
          <polygon points="34,70 50,96 42,100 24,78" fill="#18181b" />
          <polygon points="66,70 50,96 58,100 76,78" fill="#18181b" />
          <line x1="47" y1="74" x2="52" y2="98" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="1 1" />
          {/* Silver studs on lapel */}
          <circle cx="28" cy="80" r="1" fill="#e2e8f0" />
          <circle cx="72" cy="80" r="1" fill="#e2e8f0" />
          {/* Neck with black choker */}
          <rect x="44" y="58" width="12" height="14" rx="4" fill="#fde68a" />
          <rect x="44" y="64" width="12" height="2.5" fill="#09090b" />
          <ellipse cx="50" cy="46" rx="16" ry="19" fill="#fef08a" />
          {/* Edgy wolf/shag cut with hot pink dip-dyed ends */}
          <path d="M26 38 C26 20 36 14 50 14 C64 14 74 20 74 38 C70 30 60 24 50 24 C40 24 30 30 26 38 Z" fill="url(#av15-hair)" />
          {/* Spiky shag layers */}
          <polygon points="28,34 22,46 31,42" fill="url(#av15-hair)" />
          <polygon points="72,34 78,46 69,42" fill="url(#av15-hair)" />
          <polygon points="36,24 40,32 44,24" fill="#18181b" />
          <polygon points="56,24 60,32 64,24" fill="#18181b" />
          {/* Silver lightning bolt earring */}
          <polygon points="28,48 29.5,52 28,52.5 30,56 29,53 30.5,52.5" fill="#e2e8f0" />
          {/* Piercing focused rocker eyes with smoky eyeliner */}
          <path d="M37 45 Q42 43 47 45" stroke="#09090b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M53 45 Q58 43 63 45" stroke="#09090b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="42" cy="47" rx="2.5" ry="3" fill="#09090b" />
          <ellipse cx="58" cy="47" rx="2.5" ry="3" fill="#09090b" />
          <circle cx="43" cy="46" r="1" fill="#f43f5e" />
          <circle cx="59" cy="46" r="1" fill="#f43f5e" />
          {/* Tiny subtle lip ring */}
          <circle cx="48" cy="60" r="0.8" fill="#e2e8f0" />
          <path d="M46 58 L54 58" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    default:
      // Sleek fallback/placeholder avatar: neutral stylish listener with headphones and sound waves
      return (
        <svg viewBox="0 0 100 100" className={className} style={dimensionStyle} aria-label="Music Listener">
          <defs>
            <linearGradient id="av-fallback-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="50" fill="url(#av-fallback-bg)" />
          {/* Sound waves backdrop */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent, #38bdf8)" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 3" />
          {/* Silhouette body */}
          <path d="M22 100 C24 82 34 76 50 76 C66 76 76 82 78 100 Z" fill="#334155" />
          {/* Head & neck */}
          <rect x="45" y="62" width="10" height="14" rx="3" fill="#475569" />
          <ellipse cx="50" cy="50" rx="16" ry="19" fill="#64748b" />
          {/* Modern minimal headphones */}
          <path d="M30 46 C28 32 38 22 50 22 C62 22 72 32 70 46" fill="none" stroke="var(--accent, #38bdf8)" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="27" y="44" width="7" height="14" rx="3.5" fill="var(--accent, #38bdf8)" />
          <rect x="66" y="44" width="7" height="14" rx="3.5" fill="var(--accent, #38bdf8)" />
        </svg>
      );
  }
}
