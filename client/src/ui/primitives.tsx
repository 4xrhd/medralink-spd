import React, {
  type AriaRole,
  type ReactNode,
  type CSSProperties,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from "react";
import { cn } from "../utils/cn.js";

/* ==========================================================================
   1. Icons (Medical-grade unified line set)
   ========================================================================== */
export type IconProps = { className?: string; size?: number; style?: CSSProperties };

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const Icon = {
  Cross: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
    </svg>
  ),
  Search: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Bell: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  Shield: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Lock: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  Pulse: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M2 12h4l2-6 4 12 2-6h8" />
    </svg>
  ),
  Stethoscope: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M4 3v6a5 5 0 0 0 10 0V3" />
      <path d="M4 3H2m2 0h2M14 3h-2m2 0h2" />
      <path d="M9 14v2a5 5 0 0 0 10 0v-1" />
      <circle cx="19" cy="13" r="2" />
    </svg>
  ),
  File: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M14 3v5h5" />
      <path d="M19 8v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h8z" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  ),
  User: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  Pill: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" />
      <path d="M8.5 8.5 15.5 15.5" />
    </svg>
  ),
  Alert: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12 3 2 20h20z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  ),
  Arrow: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Chevron: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Plus: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Copy: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  Check: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  ),
  Download: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </svg>
  ),
  Clock: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Trash: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  ),
  Flask: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M9 3h6M10 3v6l-5 9a1 1 0 0 0 1 1.5h12A1 1 0 0 0 19 18l-5-9V3" />
      <path d="M7.5 14h9" />
    </svg>
  ),
  LogOut: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Menu: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  ),
  X: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Calendar: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Activity: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  CheckCircle: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  ExternalLink: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Settings: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Sliders: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  Loader: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={cn("animate-spin", className)} style={style}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  Info: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  HeartPulse: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6a5 5 0 1 1 7.5 6.6z" />
      <path d="M3.5 12h4l1.5-3 3 6 1.5-3h7" />
    </svg>
  ),
  Hospital: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />
      <path d="M2 21h20M12 8v6M9 11h6M10 21v-3h4v3" />
    </svg>
  ),
  Capsule: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  ),
  Ambulance: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M3 17V7a1 1 0 0 1 1-1h10v11M14 10h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
      <path d="M8.5 9v4M6.5 11h4" />
    </svg>
  ),
  ClipboardHeart: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M12 17s-3.5-2-3.5-4.3a1.8 1.8 0 0 1 3.5-.6 1.8 1.8 0 0 1 3.5.6C15.5 15 12 17 12 17z" />
    </svg>
  ),
  Microscope: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2zM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
    </svg>
  ),
  ShieldPlus: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z" />
      <path d="M12 8.5v6M9 11.5h6" />
    </svg>
  ),
  Phone: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
  Mail: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  ),
  IdCard: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={className} style={style}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M5 16a3 3 0 0 1 6 0M14 10h5M14 14h3" />
    </svg>
  ),
};

/* ==========================================================================
   2. Buttons
   ========================================================================== */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "clinical" | "secondary" | "outline" | "destructive" | "ghost" | "soft";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants: Record<string, string> = {
      primary:
        "bg-primary-600 hover:bg-primary-700 text-white border border-transparent shadow-sm shadow-primary-600/20 focus-visible:ring-primary-600",
      clinical:
        "bg-primary-700 hover:bg-primary-800 text-white border border-transparent shadow-sm focus-visible:ring-primary-700",
      secondary:
        "bg-white hover:bg-primary-50 text-ink-900 border border-hair-strong hover:border-primary-200 shadow-subtle focus-visible:ring-primary-600",
      outline:
        "bg-transparent hover:bg-primary-50 text-primary-700 border border-primary-200 focus-visible:ring-primary-600",
      destructive:
        "bg-critical hover:bg-critical/90 text-white border border-transparent shadow-sm focus-visible:ring-critical",
      ghost:
        "bg-transparent hover:bg-primary-50 text-ink-600 hover:text-ink-900 border border-transparent focus-visible:ring-primary-600",
      soft:
        "bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-100 focus-visible:ring-primary-600",
    };

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
      md: "h-10 px-4 text-sm gap-2 rounded-xl",
      lg: "h-12 px-5 text-base gap-2.5 rounded-xl font-semibold",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Icon.Loader size={size === "sm" ? 14 : 16} className="text-current" />
        ) : (
          icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {!isLoading && icon && iconPosition === "right" && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

/* ==========================================================================
   3. Badges / Status Chips
   ========================================================================== */
export type BadgeTone = "slate" | "blue" | "emerald" | "crimson" | "amber" | "purple" | "navy";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  children,
  tone = "slate",
  size = "md",
  dot = false,
  pulse = false,
  className = "",
}: BadgeProps) {
  const tones: Record<BadgeTone, { bg: string; dotBg: string }> = {
    slate: { bg: "bg-slate-100 text-slate-700 border-slate-200", dotBg: "bg-slate-500" },
    blue: { bg: "bg-primary-50 text-primary-700 border-primary-100", dotBg: "bg-primary-600" },
    emerald: { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", dotBg: "bg-success" },
    crimson: { bg: "bg-rose-50 text-rose-800 border-rose-200", dotBg: "bg-critical" },
    amber: { bg: "bg-amber-50 text-amber-800 border-amber-200", dotBg: "bg-warning" },
    purple: { bg: "bg-violet-50 text-violet-700 border-violet-200", dotBg: "bg-audit" },
    navy: { bg: "bg-primary-700 text-white border-primary-700", dotBg: "bg-white" },
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  const current = tones[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border leading-none transition-colors",
        current.bg,
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            current.dotBg,
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}

// Backward-compatible alias
export const Pill = Badge;

/* ==========================================================================
   4. Surface / Card Containers
   ========================================================================== */
export interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  role?: AriaRole;
  hover?: boolean;
  variant?: "default" | "flat" | "elevated" | "subtle";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  style,
  id,
  role,
  hover = false,
  variant = "default",
  padding = "none",
}: CardProps) {
  const variants = {
    default: "border border-hair bg-surface shadow-card",
    flat: "border border-hair bg-surface",
    elevated: "border border-hair bg-surface shadow-elevated",
    subtle: "border border-hair bg-primary-50/40",
  };

  const paddings = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      id={id}
      role={role}
      className={cn(
        "rounded-2xl transition-all duration-200",
        variants[variant],
        paddings[padding],
        hover && "hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   5. Form Inputs & FormField
   ========================================================================== */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  inputSize?: "sm" | "md";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error = false,
      leftIcon,
      rightElement,
      inputSize = "md",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-9 text-xs px-3 rounded-lg",
      md: "h-11 text-sm px-3.5 rounded-xl",
    };

    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3.5 text-[#94A3B8] pointer-events-none shrink-0 flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full border bg-white text-[#0F172A] outline-none transition-all duration-150 placeholder:text-[#94A3B8]",
            sizeClasses[inputSize],
            leftIcon && "pl-10",
            rightElement && "pr-10",
            error
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#FEF2F2]"
              : "border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#EFF6FF]",
            disabled && "bg-slate-50 text-slate-400 cursor-not-allowed",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center shrink-0">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-slate-700 select-none"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-[#DC2626] font-medium flex items-center gap-1 mt-1">
          <Icon.Alert size={12} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-[#64748B] mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   6. Metric / Telemetry KPI Card
   ========================================================================== */
export interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  iconTone?: "blue" | "emerald" | "navy" | "purple" | "amber";
  status?: { label: string; tone?: "emerald" | "amber" | "blue" };
  className?: string;
  hover?: boolean;
}

export function MetricCard({
  title,
  value,
  subtext,
  icon,
  iconTone = "blue",
  status,
  className = "",
  hover = true,
}: MetricCardProps) {
  const iconTones = {
    blue: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    emerald: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
    navy: "bg-[#EEF2F7] text-[#1B365D] border-[#CBD5E1]",
    purple: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
    amber: "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]",
  };

  return (
    <Card hover={hover} className={cn("p-5 flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between gap-2">
        {icon && (
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl border",
              iconTones[iconTone]
            )}
          >
            {icon}
          </div>
        )}
        {status && (
          <Badge tone={status.tone || "emerald"} size="sm" dot>
            {status.label}
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="tabular font-display text-3xl font-bold tracking-tight text-[#0F172A]">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium text-[#475569]">{title}</p>
        {subtext && <p className="mt-1 text-[11px] text-[#94A3B8]">{subtext}</p>}
      </div>
    </Card>
  );
}

/* ==========================================================================
   7. Typographic Section Header
   ========================================================================== */
export interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  badge,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-6",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-bold text-[#0F172A]">{title}</h2>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-[#475569]">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   8. Friendly Clinical Empty State
   ========================================================================== */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[#CBD5E1] bg-slate-50/50 p-8 sm:p-12 text-center",
        className
      )}
    >
      <div className="mx-auto mb-3.5 grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#64748B] shadow-subtle border border-[#E2E8F0]">
        {icon || <Icon.Search size={22} />}
      </div>
      <h3 className="font-display text-sm font-bold text-[#0F172A]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm mx-auto text-xs text-[#64748B] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   9. Vitals Pill (Clinical Vital Parameter Display)
   ========================================================================== */
export function VitalPill({
  label,
  value,
  tone = "slate",
  className = "",
}: {
  label: string;
  value: string;
  tone?: "slate" | "amber" | "emerald" | "crimson";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 bg-slate-50",
    amber: "border-[#FDE68A] bg-[#FEF3C7]",
    emerald: "border-[#A7F3D0] bg-[#ECFDF5]",
    crimson: "border-[#FECACA] bg-[#FEF2F2]",
  };
  const valTone: Record<string, string> = {
    slate: "text-[#0F172A]",
    amber: "text-[#B45309]",
    emerald: "text-[#059669]",
    crimson: "text-[#DC2626]",
  };
  return (
    <div className={cn("flex flex-col rounded-xl border px-3 py-2", tones[tone], className)}>
      <span className="text-[11px] font-medium text-[#64748B]">
        {label}
      </span>
      <span className={cn("tabular text-sm font-semibold mt-0.5", valTone[tone])}>{value}</span>
    </div>
  );
}
