import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "../lib/format";

interface Props {
  value: number;
  max: number;
  label: string;
  /** Called continuously while dragging when `live`, otherwise once on release. */
  onChange: (v: number) => void;
  live?: boolean;
  buffered?: number;
  step?: number;
  valueText?: (v: number) => string;
  /** Show the thumb at rest (touch layouts), not only on hover. */
  showThumb?: boolean;
  onScrub?: (v: number | null) => void;
  className?: string;
}

export function Slider({
  value,
  max,
  label,
  onChange,
  live,
  buffered,
  step,
  valueText,
  showThumb,
  onScrub,
  className,
}: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;
  const pct = max > 0 ? Math.min(100, Math.max(0, (shown / max) * 100)) : 0;
  const bufPct = max > 0 && buffered ? Math.min(100, (buffered / max) * 100) : 0;

  const valueAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * max;
  };

  const update = (v: number | null) => {
    setDrag(v);
    onScrub?.(v);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (max <= 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const v = valueAt(e.clientX);
    update(v);
    if (live) onChange(v);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    const v = valueAt(e.clientX);
    update(v);
    if (live) onChange(v);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    onChange(valueAt(e.clientX));
    update(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = step ?? max / 20;
    const map: Record<string, number> = {
      ArrowRight: value + s,
      ArrowUp: value + s,
      ArrowLeft: value - s,
      ArrowDown: value - s,
      Home: 0,
      End: max,
    };
    if (e.key in map) {
      e.preventDefault();
      e.stopPropagation();
      onChange(Math.min(max, Math.max(0, map[e.key])));
    }
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={valueText?.(shown)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => update(null)}
      onKeyDown={onKeyDown}
      className={cn("group relative flex h-5 cursor-pointer touch-none items-center select-none", className)}
    >
      <div ref={track} className="relative h-1 w-full overflow-hidden rounded-full bg-surface-4 transition-[height] duration-200 group-hover:h-1.5">
        <div className="absolute inset-y-0 left-0 bg-fg-3/40" style={{ width: `${bufPct}%` }} />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-colors",
            drag !== null ? "bg-accent" : "bg-fg group-hover:bg-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg shadow-[0_1px_4px_rgb(0_0_0/0.4)] transition-opacity",
          showThumb || drag !== null ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
