import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Icon } from '../ui/primitives.js';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, dur?: number) => showToast(msg, 'success', dur), [showToast]);
  const error = useCallback((msg: string, dur?: number) => showToast(msg, 'error', dur), [showToast]);
  const info = useCallback((msg: string, dur?: number) => showToast(msg, 'info', dur), [showToast]);
  const warning = useCallback((msg: string, dur?: number) => showToast(msg, 'warning', dur), [showToast]);

  const value = useMemo(
    () => ({ showToast, removeToast, success, error, info, warning }),
    [showToast, removeToast, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Render Viewport */}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const styleByType: Record<ToastType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
            success: {
              bg: 'bg-emerald-50',
              border: 'border-emerald-200',
              text: 'text-emerald-800',
              icon: <Icon.Check size={18} className="text-success shrink-0 mt-0.5" />,
            },
            error: {
              bg: 'bg-rose-50',
              border: 'border-rose-200',
              text: 'text-rose-800',
              icon: <Icon.Alert size={18} className="text-critical shrink-0 mt-0.5" />,
            },
            warning: {
              bg: 'bg-amber-50',
              border: 'border-amber-200',
              text: 'text-amber-800',
              icon: <Icon.Alert size={18} className="text-warning shrink-0 mt-0.5" />,
            },
            info: {
              bg: 'bg-primary-50',
              border: 'border-primary-100',
              text: 'text-primary-800',
              icon: <Icon.Shield size={18} className="text-primary-600 shrink-0 mt-0.5" />,
            },
          };

          const style = styleByType[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg backdrop-blur-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${style.bg} ${style.border}`}
            >
              {style.icon}
              <div className="flex-1 text-xs sm:text-sm font-medium leading-tight">
                <span className={style.text}>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label="Dismiss notification"
              >
                <Icon.X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default useToast;
