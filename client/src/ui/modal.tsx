import React, { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "../utils/cn.js";
import { Icon } from "./primitives.js";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Shown left of the title. */
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
  /** Blocks Escape and the close button, e.g. while a request is running. */
  dismissible?: boolean;
  /** Element to focus when the dialog opens; defaults to the first focusable element. */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * Accessible dialog shell: labelled, closes on Escape, keeps Tab inside the dialog and
 * returns focus to whatever opened it.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  dismissible = true,
  initialFocusRef,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (initialFocusRef?.current ?? focusables()[0] ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [isOpen, dismissible, onClose, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "w-full rounded-2xl border border-hair bg-white p-6 shadow-elevated outline-none",
          size === "sm" ? "max-w-md" : "max-w-lg"
        )}
      >
        <div className="flex items-start gap-3.5">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-lg font-semibold text-ink-900">
              {title}
            </h2>
            {description && (
              <div id={descId} className="mt-1.5 text-sm leading-relaxed text-ink-600">
                {description}
              </div>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-600 transition-colors hover:bg-slate-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              <Icon.X size={16} />
            </button>
          )}
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-hair pt-4">{footer}</div>}
      </div>
    </div>
  );
}
