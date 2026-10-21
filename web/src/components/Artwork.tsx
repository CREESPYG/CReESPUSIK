import { MusicNotesIcon } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { cn } from "../lib/format";

interface Props {
  src?: string;
  /** Used when `src` fails, e.g. hq720 thumbnails that do not exist for older videos. */
  fallback?: string;
  alt?: string;
  className?: string;
  iconSize?: number;
}

export function Artwork(props: Props) {
  // Keyed by source so a new image starts from a clean loading state, without a reset effect
  // (an effect could run after a cached image already fired onLoad and leave it stuck invisible).
  return <ArtworkImage key={`${props.src ?? ""}|${props.fallback ?? ""}`} {...props} />;
}

function ArtworkImage({ src, fallback, alt = "", className, iconSize = 20 }: Props) {
  const [current, setCurrent] = useState(src || fallback);
  const [state, setState] = useState<"loading" | "ok" | "error">(src || fallback ? "loading" : "error");

  // Images served from cache can be complete before React attaches onLoad.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setState("ok");
  }, []);

  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-surface-3", className)}>
      {state !== "error" && current && (
        <img
          ref={imgRef}
          src={current}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          onLoad={() => setState("ok")}
          onError={() => {
            if (fallback && current !== fallback) setCurrent(fallback);
            else setState("error");
          }}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300 ease-out-expo",
            state === "ok" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {state === "loading" && <div className="skeleton absolute inset-0" />}
      {state === "error" && (
        <div className="absolute inset-0 grid place-items-center text-fg-3">
          <MusicNotesIcon size={iconSize} />
        </div>
      )}
    </div>
  );
}
