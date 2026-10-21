import {
  ArrowsOutSimpleIcon,
  ChatCircleDotsIcon,
  PaperPlaneRightIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { cn } from "../lib/format";
import { paths } from "../lib/routes";
import { useRoomStore } from "../stores/roomStore";
import { useUi } from "../stores/ui";
import { IconButton } from "./IconButton";

function getAvatarStyle(name: string, isMe = false): React.CSSProperties {
  if (isMe) {
    return {
      background: "linear-gradient(135deg, var(--accent) 0%, var(--surface-3) 100%)",
      color: "var(--accent-ink)",
    };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h}, 70%, 55%) 0%, hsl(${(h + 40) % 360}, 75%, 40%) 100%)`,
    color: "#ffffff",
  };
}

export function SideChatDrawer() {
  const room = useRoomStore((s) => s.roomApi);
  const open = useUi((s) => s.sideChatOpen);
  const close = () => useUi.getState().setSideChatOpen(false);
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const [chatDraft, setChatDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const inRoom = !!room?.inRoom;

  useEffect(() => {
    if (open && inRoom && room) {
      room.markChatAsRead();
    }
  }, [open, inRoom, room, room?.chat.length]);

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, room?.chat.length, room?.typingUsers.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!room || !inRoom) return;
    const text = chatDraft.trim();
    if (!text) return;
    room.sendChat(text);
    setChatDraft("");
    room.sendTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with click to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
          />

          {/* Full Chat Section Drawer */}
          <motion.aside
            aria-label="Room Live Chat"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="relative z-50 flex flex-col w-full sm:w-[420px] max-w-full h-full bg-surface-1 border-l border-line shadow-2xl overflow-hidden"
          >
            {/* Chat Top Header */}
            <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-line bg-surface-1/90 backdrop-blur">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid size-8 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                  <ChatCircleDotsIcon size={20} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-fg truncate">
                      {inRoom ? room?.room?.name || "Live Session" : "Live Room Chat"}
                    </h3>
                    {inRoom && <span className="size-2 rounded-full bg-accent animate-pulse" />}
                  </div>
                  <span className="text-[11px] text-fg-3 font-mono">
                    {inRoom ? `${room?.members.length} listening` : "No active session"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {inRoom && (
                  <IconButton
                    label="Open full room view"
                    size="sm"
                    onClick={() => {
                      close();
                      navigate(paths.rooms);
                    }}
                  >
                    <ArrowsOutSimpleIcon size={18} />
                  </IconButton>
                )}
                <IconButton label="Close chat" size="sm" onClick={close}>
                  <XIcon size={18} />
                </IconButton>
              </div>
            </div>

            {/* Content Area */}
            {!inRoom || !room ? (
              /* Empty state: Not in room */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="size-16 rounded-2xl bg-surface-2 border border-line grid place-items-center mb-4 text-fg-3">
                  <ChatCircleDotsIcon size={32} />
                </div>
                <h4 className="text-base font-semibold text-fg">No Active Room</h4>
                <p className="mt-1.5 text-xs text-fg-3 max-w-[240px] leading-relaxed">
                  Join an active room or host your own session to chat with listeners in real time.
                </p>
                <button
                  onClick={() => {
                    close();
                    navigate(paths.rooms);
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-accent text-accent-ink text-xs font-semibold hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                >
                  Explore Rooms
                </button>
              </div>
            ) : (
              /* Full Chat Stream */
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Messages List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {room.chat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-fg-3">
                      <div className="size-12 rounded-full bg-surface-2 grid place-items-center mb-2 text-fg-3/60">
                        <ChatCircleDotsIcon size={24} />
                      </div>
                      <p className="text-sm font-semibold text-fg-2">No messages yet</p>
                      <p className="text-xs text-fg-3 mt-1">Start the conversation with everyone in the room!</p>
                    </div>
                  ) : (
                    room.chat.map((m) => {
                      const isMine = m.userId === room.me;
                      if (m.system) {
                        return (
                          <div key={m.id} className="text-center py-1">
                            <span className="text-[10px] font-medium text-fg-3 px-3 py-1 rounded-full bg-surface-2 border border-line">
                              {m.message}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m.id}
                          className={cn("flex gap-2.5 max-w-[85%]", isMine ? "ml-auto flex-row-reverse" : "")}
                        >
                          {!isMine && (
                            <div
                              style={getAvatarStyle(m.nickname, false)}
                              className="size-7 rounded-full shrink-0 grid place-items-center font-bold text-[10px] shadow-xs"
                            >
                              {m.nickname[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            {!isMine && (
                              <div className="flex items-center gap-2 ml-1">
                                <span className="text-[11px] font-semibold text-fg-2">{m.nickname}</span>
                                <span className="text-[10px] text-fg-3 font-mono">
                                  {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            )}
                            <div
                              className={cn(
                                "px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed break-words",
                                isMine
                                  ? "bg-[var(--accent-soft)] border border-accent/40 text-fg rounded-tr-none shadow-xs font-normal"
                                  : "bg-surface-2 border border-line text-fg rounded-tl-none shadow-xs"
                              )}
                            >
                              {m.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {room.typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-fg-3 px-2 py-1">
                      <span className="size-1.5 rounded-full bg-accent animate-bounce" />
                      <span className="size-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                      <span className="size-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                      <span className="font-medium text-fg-2">
                        {room.typingUsers.join(", ")} {room.typingUsers.length === 1 ? "is" : "are"} typing...
                      </span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Dock */}
                <form
                  onSubmit={handleSend}
                  className="shrink-0 p-3 border-t border-line bg-surface-1/95 backdrop-blur flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatDraft}
                    onChange={(e) => {
                      setChatDraft(e.target.value);
                      room.sendTyping(e.target.value.length > 0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Message room..."
                    className="flex-1 h-10 px-3.5 rounded-full bg-surface-2 border border-line text-xs sm:text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!chatDraft.trim()}
                    className={cn(
                      "size-10 rounded-full grid place-items-center transition-all shrink-0",
                      chatDraft.trim()
                        ? "bg-accent text-accent-ink hover:brightness-110 active:scale-95 shadow-md"
                        : "bg-surface-2 text-fg-3 cursor-not-allowed border border-line"
                    )}
                  >
                    <PaperPlaneRightIcon size={16} weight="fill" />
                  </button>
                </form>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
