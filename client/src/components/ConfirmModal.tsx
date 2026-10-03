import React, { useEffect, useRef } from 'react';
import { Icon } from '../ui/primitives.js';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when opened
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-hair bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
              isDestructive
                ? 'bg-rose-50 border-rose-200 text-critical'
                : 'bg-primary-50 border-primary-100 text-primary-600'
            }`}
          >
            {isDestructive ? <Icon.Alert size={20} /> : <Icon.Shield size={20} />}
          </div>

          <div className="flex-1">
            <h2 id="confirm-modal-title" className="font-display text-base font-bold text-ink-900">
              {title}
            </h2>
            <div id="confirm-modal-desc" className="mt-2 text-xs sm:text-sm text-ink-600 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-primary-50/60 pt-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-hair bg-white px-4 py-2 text-xs font-semibold text-ink-600 shadow-xs hover:bg-slate-50 hover:text-ink-900 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 ${
              isDestructive
                ? 'bg-critical hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-critical'
                : 'bg-primary-700 hover:bg-primary-800 focus-visible:ring-2 focus-visible:ring-primary-600'
            }`}
          >
            {isLoading && <Icon.Loader size={14} className="text-white" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
