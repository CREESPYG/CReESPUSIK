import { CheckIcon, SparkleIcon, UserIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/format";
import { AVATARS, saveAvatar, savedAvatar, saveNickname, savedNickname } from "../lib/room";
import { toast } from "../stores/ui";
import { AvatarArt } from "./AvatarArt";
import { Modal } from "./Modal";

export function ProfileSetupDialog({
  onUpdateNickname,
  onUpdateAvatar,
}: {
  onUpdateNickname?: (name: string) => boolean | void;
  onUpdateAvatar?: (avatarId: number) => boolean | void;
}) {
  const [open, setOpen] = useState(() => !savedNickname());
  const [name, setName] = useState(() => savedNickname());
  const [selectedAvatar, setSelectedAvatar] = useState<number>(() => {
    const existing = savedAvatar();
    return existing >= 0 ? existing : 0;
  });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 300);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  // If already set up, keep dialog closed
  if (!open) return null;

  const handleSave = () => {
    const clean = name.trim().slice(0, 24);
    if (!clean) {
      setError("Please enter a name to continue");
      inputRef.current?.focus();
      return;
    }

    const generic = ["guest", "listener", "user", "anonymous", "host", "a member"];
    if (generic.includes(clean.toLowerCase())) {
      setError("Please choose a unique name — generic names are not allowed");
      inputRef.current?.focus();
      return;
    }

    if (selectedAvatar < 0 || selectedAvatar >= AVATARS.length) {
      setError("Please pick an avatar art");
      return;
    }

    // Persist locally
    saveNickname(clean);
    saveAvatar(selectedAvatar);

    // Sync with room state if available
    try {
      onUpdateNickname?.(clean);
      onUpdateAvatar?.(selectedAvatar);
    } catch {
      /* noop */
    }

    setOpen(false);
    toast(`Welcome to CReEPUSIK, ${clean}! 🎵`);
  };

  const currentAvatarMeta = AVATARS[selectedAvatar] || AVATARS[0];

  return (
    <Modal
      open={open}
      onClose={() => {}}
      title="Welcome to CReEPUSIK"
      dismissible={false}
      center
    >
      <div className="flex flex-col gap-3.5 -mt-1">
        {/* Intro Banner */}
        <div className="rounded-2xl border border-line bg-surface-2/70 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-accent-text ring-1 ring-accent/30">
              <SparkleIcon size={12} weight="fill" />
              One-Time Setup
            </span>
            <span className="text-xs text-fg-3">Set up your listener profile</span>
          </div>
          <p className="text-xs text-fg-2 leading-relaxed">
            Choose your display name and real character art avatar. This identity will represent you across live listening rooms, synchronized chat, and community playlists.
          </p>
        </div>

        {/* Display Name Input with Preview */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-13 rounded-2xl overflow-hidden shadow-md ring-2 shrink-0 bg-surface-2 transition-all duration-300",
              selectedAvatar >= 0 ? "ring-accent shadow-accent/20 scale-102" : "ring-line"
            )}
          >
            <AvatarArt id={selectedAvatar} className="size-full" />
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-3 mb-1">
              Your Display Name
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={name}
                maxLength={24}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                placeholder="Enter your name (e.g. Alex, CyberBeat)..."
                className={cn(
                  "w-full h-11 px-3.5 pl-9 rounded-xl bg-surface-2 border text-sm text-fg placeholder:text-fg-3 focus:outline-none transition-all",
                  error
                    ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
                    : "border-line focus:border-accent focus:ring-1 focus:ring-accent"
                )}
                autoFocus
              />
              <UserIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-1.5 animate-in fade-in">
            {error}
          </p>
        )}

        {/* Avatar Selection Grid */}
        <div className="space-y-3 pt-1">
          {/* Boys */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                Boys Character Arts
              </p>
              <span className="text-[10px] text-fg-3 font-mono">8 Avatars</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATARS.slice(0, 8).map((av, i) => (
                <button
                  key={`boy-${i}`}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(i);
                    if (error) setError(null);
                  }}
                  title={`${av.name} • ${av.tag}`}
                  className={cn(
                    "group relative aspect-square rounded-2xl p-1 border transition-all overflow-hidden flex flex-col items-center justify-center",
                    selectedAvatar === i
                      ? "border-accent ring-2 ring-accent/60 bg-[var(--accent-soft)] shadow-md scale-105"
                      : "border-line bg-surface-2 hover:bg-surface-3 hover:scale-102"
                  )}
                >
                  <AvatarArt id={i} className="size-full rounded-xl" />
                  {selectedAvatar === i && (
                    <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-accent text-accent-ink grid place-items-center shadow-xs">
                      <CheckIcon size={9} weight="bold" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Girls */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                Girls Character Arts
              </p>
              <span className="text-[10px] text-fg-3 font-mono">8 Avatars</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATARS.slice(8).map((av, i) => (
                <button
                  key={`girl-${i}`}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(i + 8);
                    if (error) setError(null);
                  }}
                  title={`${av.name} • ${av.tag}`}
                  className={cn(
                    "group relative aspect-square rounded-2xl p-1 border transition-all overflow-hidden flex flex-col items-center justify-center",
                    selectedAvatar === i + 8
                      ? "border-accent ring-2 ring-accent/60 bg-[var(--accent-soft)] shadow-md scale-105"
                      : "border-line bg-surface-2 hover:bg-surface-3 hover:scale-102"
                  )}
                >
                  <AvatarArt id={i + 8} className="size-full rounded-xl" />
                  {selectedAvatar === i + 8 && (
                    <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-accent text-accent-ink grid place-items-center shadow-xs">
                      <CheckIcon size={9} weight="bold" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Character Info Badge */}
          {currentAvatarMeta && (
            <div className="p-2.5 rounded-xl bg-surface-2 border border-line flex items-center justify-between text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-fg">{currentAvatarMeta.name}</span>
                <span className="text-fg-3">• {currentAvatarMeta.tag}</span>
              </div>
              <span className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
                Selected
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={name.trim().length === 0}
          className={cn(
            "mt-1 w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md",
            name.trim().length > 0
              ? "bg-accent text-accent-ink hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              : "bg-surface-2 text-fg-3 cursor-not-allowed border border-line"
          )}
        >
          <CheckIcon size={16} weight="bold" /> Start Listening
        </button>
      </div>
    </Modal>
  );
}
