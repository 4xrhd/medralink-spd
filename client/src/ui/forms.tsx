import React, { forwardRef, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn.js";
import { Icon, fieldClasses } from "./primitives.js";

/* Select and Textarea share the Input field styling (fieldClasses) so every form control matches. */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  selectSize?: "sm" | "md";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error = false, selectSize = "md", disabled = false, children, ...props }, ref) => (
    <select
      ref={ref}
      disabled={disabled}
      aria-invalid={error || undefined}
      className={cn(
        fieldClasses(error, disabled),
        selectSize === "sm" ? "h-8 [@media(pointer:coarse)]:h-10 rounded-md px-2.5 text-[0.8125rem]" : "h-10 rounded-md px-3 text-sm",
        "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, disabled = false, ...props }, ref) => (
    <textarea
      ref={ref}
      disabled={disabled}
      aria-invalid={error || undefined}
      className={cn(fieldClasses(error, disabled), "min-h-[80px] resize-y rounded-md p-3 text-sm leading-relaxed", className)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

/* Inline message for a form or page. Errors are announced immediately; other tones politely. */
export type AlertTone = "error" | "success" | "warning" | "info";

const ALERT_TONES: Record<AlertTone, { box: string; icon: ReactNode }> = {
  error: { box: "border-rose-200 bg-rose-50 text-rose-800", icon: <Icon.Alert size={16} className="shrink-0 text-rose-600" /> },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: <Icon.Check size={16} className="shrink-0 text-success" /> },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-950", icon: <Icon.Alert size={16} className="shrink-0 text-warning" /> },
  info: { box: "border-primary-200 bg-primary-50 text-primary-900", icon: <Icon.Shield size={16} className="shrink-0 text-primary-700" /> },
};

export interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Alert({ tone = "error", children, className, id }: AlertProps) {
  const style = ALERT_TONES[tone];
  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-lg border px-3.5 py-3 text-sm font-medium", style.box, className)}
    >
      {style.icon}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* On/off toggle. The visible label and description are linked for screen readers. */
export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id: string;
}

export function Switch({ checked, onChange, label, description, disabled = false, id }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-hair bg-canvas p-3.5">
      <div className="min-w-0">
        <span id={`${id}-label`} className="block text-sm font-semibold text-ink-900">
          {label}
        </span>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-xs leading-relaxed text-ink-600">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-primary-700" : "bg-slate-300"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
