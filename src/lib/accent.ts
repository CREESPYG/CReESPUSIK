/**
 * Builds the accent colour variables for any colour the user picks.
 * The pick fills buttons as-is; the text versions are lightened (dark theme) or darkened (light theme)
 * until they read well on the theme's surfaces (WCAG AA, 4.5:1).
 */

type Rgb = [number, number, number];

const DARK_SURFACE: Rgb = [0x18, 0x1a, 0x20]; // --surface-2, dark theme
const LIGHT_SURFACE: Rgb = [0xf2, 0xf3, 0xf6]; // --surface-2, light theme
const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

export const DEFAULT_ACCENT = "#c3ec52";

export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

const toRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const toHex = (c: Rgb) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => a[i]! + (b[i]! - a[i]!) * t) as Rgb;

/** Moves `color` toward `target` just enough to reach `ratio` against `surface`. */
function readable(color: Rgb, target: Rgb, surface: Rgb, ratio = 4.5): Rgb {
  for (let t = 0; t <= 1; t += 0.04) {
    const c = mix(color, target, t);
    if (contrast(c, surface) >= ratio) return c;
  }
  return target;
}

/** Black or white, whichever reads better on `hex` (the check mark on a swatch, text on accent buttons). */
export function inkFor(hex: string): string {
  const base = toRgb(hex);
  return contrast(base, BLACK) >= contrast(base, WHITE) ? "#0b0c0f" : "#ffffff";
}

/** CSS that overrides the theme's accent variables. Selectors outrank styles.css whatever the load order. */
export function accentCss(hex: string): string {
  const base = toRgb(hex);
  const ink = inkFor(hex);
  const darkText = readable(base, WHITE, DARK_SURFACE);
  const lightText = readable(base, BLACK, LIGHT_SURFACE);
  const rgb = (c: Rgb) => c.map(Math.round).join(" ");
  return (
    `html:root,html[data-theme="dark"]{--accent:${hex};--accent-ink:${ink};--accent-text:${toHex(darkText)};--accent-soft:rgb(${rgb(base)} / 0.13)}` +
    `html[data-theme="light"]{--accent:${hex};--accent-ink:${ink};--accent-text:${toHex(lightText)};--accent-soft:rgb(${rgb(lightText)} / 0.12)}`
  );
}
