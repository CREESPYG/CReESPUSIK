import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MD, useMediaQuery } from "../hooks/useMediaQuery";
import { useT } from "../i18n";
import { IconButton } from "./IconButton";

/**
 * Layering (z-index) used across the app:
 * 10 sticky headers · 20 app chrome · 30 floating video · 40 sheet/drawer · 50 modal/menu · 60 toasts
 */
interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /**
   * false: the dialog can only be closed by completing it — no X button, Escape key or scrim click.
   * Used for required setup flows (e.g. picking a display name before joining rooms).
   */
  dismissible?: boolean;
  /** true: always a centered popup (instead of bottom sheet on small screens). */
  center?: boolean;
}

export function Modal({ open, onClose, title, children, dismissible = true, center = false }: Props) {
  const isMd = useMediaQuery(MD);
  const reduce = useReducedMotion();
  const t = useT();

  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  const from = reduce ? { opacity: 0 } : isMd ? { opacity: 0, scale: 0.96, y: 8 } : { y: "100%" };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={center ? "fixed inset-0 z-50 flex items-center justify-center" : "fixed inset-0 z-50 flex items-end justify-center md:items-center"}>
          <motion.div
            className="absolute inset-0 bg-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-escape-closes={dismissible ? true : undefined}
            initial={from}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={from}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className={
              center
                ? "island relative mx-5 w-full max-w-md rounded-[20px]"
                : "island safe-bottom relative w-full rounded-b-none md:mx-4 md:max-w-md md:rounded-[20px]"
            }
          >
            <div className="island-core p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {dismissible && (
                  <IconButton label={t.common.close} size="sm" onClick={onClose}>
                    <XIcon size={18} />
                  </IconButton>
                )}
              </div>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
