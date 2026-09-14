import type { AriaRole, ReactNode, CSSProperties } from "react";

/* ---------- Icons (thin, medical-grade line set) ---------- */
type IconProps = { className?: string; size?: number; style?: CSSProperties };
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
  Loader: ({ size, className, style }: IconProps) => (
    <svg {...base(size)} className={`animate-spin ${className || ''}`} style={style}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};

/* ---------- Pills / chips ---------- */
export function Pill({
  children,
  tone = "slate",
  className = "",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "crimson" | "amber" | "purple" | "navy";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    emerald: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
    crimson: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
    amber: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
    purple: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
    navy: "bg-[#1B365D] text-white border-[#1B365D]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  style,
  id,
  role,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  role?: AriaRole;
  hover?: boolean;
}) {
  return (
    <div
      id={id}
      role={role}
      className={`rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] transition-all ${
        hover ? 'hover:border-[#BFDBFE] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]' : ''
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function VitalPill({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "amber" | "emerald" | "crimson";
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
    <div className={`flex flex-col rounded-xl border px-3 py-2 ${tones[tone]}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
        {label}
      </span>
      <span className={`tabular text-sm font-semibold ${valTone[tone]}`}>{value}</span>
    </div>
  );
}
