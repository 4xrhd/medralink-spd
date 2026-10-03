import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn.js';

/* ==========================================================================
   Healthcare presentation components (theme-token based)
   ========================================================================== */

/** Reveal-on-scroll hook using IntersectionObserver (no extra dependency). */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, inView]);
  return { ref, inView };
}

/** Wrapper that fades its children up when scrolled into view. */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(inView ? 'animate-fade-up' : 'opacity-0', className)}
      style={inView ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** Decorative animated heartbeat (ECG) line. */
export function EcgLine({
  className = '',
  strokeClassName = 'stroke-primary-500',
}: {
  className?: string;
  strokeClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 80"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none', className)}
    >
      <path
        d="M0 40 H170 L185 40 L195 18 L208 64 L222 6 L236 72 L248 40 H330 L340 40 L348 28 L356 52 L364 40 H600"
        className={cn('animate-ecg-draw', strokeClassName)}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1200, strokeDashoffset: 1200 }}
      />
    </svg>
  );
}

type ChipTone = 'primary' | 'care' | 'success' | 'warning' | 'critical' | 'audit';

const chipTones: Record<ChipTone, string> = {
  primary: 'bg-primary-50 text-primary-700 ring-primary-100',
  care: 'bg-sky-50 text-sky-700 ring-sky-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  critical: 'bg-rose-50 text-rose-700 ring-rose-100',
  audit: 'bg-violet-50 text-violet-700 ring-violet-100',
};

/** Rounded tinted square holding a medical icon. */
export function IconChip({
  children,
  tone = 'primary',
  size = 'md',
  className = '',
}: {
  children: ReactNode;
  tone?: ChipTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { sm: 'h-9 w-9 rounded-lg', md: 'h-12 w-12 rounded-xl', lg: 'h-14 w-14 rounded-2xl' };
  return (
    <div className={cn('grid shrink-0 place-items-center ring-1', chipTones[tone], sizes[size], className)}>
      {children}
    </div>
  );
}

/** Section header: plain eyebrow text (not a badge), title and subtitle. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className = '',
  invert = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn(align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}>
      {eyebrow && (
        <p
          className={cn(
            'text-sm font-semibold tracking-wide',
            invert ? 'text-primary-200' : 'text-primary-600'
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl',
          invert ? 'text-white' : 'text-ink-900'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-3 text-base leading-relaxed sm:text-lg', invert ? 'text-primary-100' : 'text-ink-600')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Feature card with icon chip, title and description. */
export function FeatureCard({
  icon,
  title,
  description,
  tone = 'primary',
  className = '',
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group h-full rounded-2xl border border-hair bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover',
        className
      )}
    >
      <IconChip tone={tone} className="transition-transform duration-200 group-hover:scale-105">
        {icon}
      </IconChip>
      <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{description}</p>
    </div>
  );
}

/** Numbered care-journey step. */
export function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative h-full rounded-2xl border border-hair bg-surface p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-600 font-display text-sm font-bold text-white">
          {step}
        </span>
        <IconChip size="sm">{icon}</IconChip>
      </div>
      <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{description}</p>
    </div>
  );
}
