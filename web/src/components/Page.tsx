import { ArrowLeftIcon, ChatCircleDotsIcon, GearSixIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { useT } from "../i18n";
import { cn } from "../lib/format";
import { needsAttention, useSystem } from "../stores/system";
import { useUi } from "../stores/ui";
import { useRoomStore } from "../stores/roomStore";
import { LogoMark } from "./Brand";
import { IconButton } from "./IconButton";

/** Sticky page header. On phones it carries the brand mark, chat toggle, and settings entry. */
export function PageHeader({
  title,
  actions,
  mobileOnly,
  className,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  /** Pages with their own large hero title only need the compact bar on phones. */
  mobileOnly?: boolean;
  className?: string;
}) {
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const toggleSideChat = useUi((s) => s.toggleSideChat);
  const room = useRoomStore((s) => s.roomApi);
  const inRoom = !!room?.inRoom;
  const attention = useSystem((s) => needsAttention(s.info));
  const t = useT();

  return (
    <header
      className={cn(
        "safe-top sticky top-0 z-10 bg-bg/80 backdrop-blur-xl md:bg-surface-1/80 border-b md:border-b-0 border-line/40",
        // Only hide on desktop if explicitly requested and not in room
        mobileOnly && !inRoom && "md:hidden",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4 md:h-16 md:px-6">
        <LogoMark className="size-7 shrink-0 text-accent-text md:hidden" />
        {title && <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>}
        {!title && <span className="flex-1" />}
        {actions}

        {/* Global Chat Toggle Button on Top Bar */}
        <button
          type="button"
          onClick={() => toggleSideChat()}
          aria-label="Toggle Live Room Chat"
          title={inRoom ? `Room Chat: ${room?.room?.name || "Active Room"} (${room?.chat.length || 0} msgs)` : "Live Room Chat"}
          className={cn(
            "relative flex items-center justify-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold transition-all border shrink-0",
            inRoom
              ? "bg-[var(--accent-soft)] border-accent/40 text-[var(--accent-text)] hover:brightness-105 active:scale-95 shadow-xs"
              : "bg-surface-2 hover:bg-surface-3 border-line text-fg-2 hover:text-fg"
          )}
        >
          <ChatCircleDotsIcon size={18} weight={inRoom ? "fill" : "regular"} />
          <span className="hidden sm:inline">Chat</span>
          {inRoom && (
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-accent" />
            </span>
          )}
        </button>

        <IconButton
          label={attention ? t.nav.settingsUpdate : t.nav.settings}
          onClick={() => setSettingsOpen(true)}
          className="-mr-2 md:hidden"
        >
          <GearSixIcon size={22} />
          {attention && <span className="absolute top-2 right-2 size-2 rounded-full bg-accent ring-2 ring-bg" />}
        </IconButton>
      </div>
    </header>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-end justify-between gap-4 px-4 md:px-6">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Back in history when there is somewhere to go back to (in the app), else to `fallback`. */
export function BackButton({ fallback, label }: { fallback: string; label?: string }) {
  const navigate = useNavigate();
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate(fallback))}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-fg-2 hover:bg-surface-3 hover:text-fg"
    >
      <ArrowLeftIcon size={16} /> {label ?? t.common.back}
    </button>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-[18px] bg-surface-3 text-fg-2">{icon}</span>
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      <p className="max-w-[40ch] text-sm text-fg-2">{body}</p>
      {action}
    </div>
  );
}
