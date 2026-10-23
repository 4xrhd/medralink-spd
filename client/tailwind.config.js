/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const primary = {
  50: v('primary-50'),
  100: v('primary-100'),
  200: v('primary-200'),
  500: v('primary-500'),
  600: v('primary-600'),
  700: v('primary-700'),
  800: v('primary-800'),
  900: v('primary-900'),
  DEFAULT: v('primary-600'),
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Public Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Public Sans', 'ui-sans-serif', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.015em' }], // 11px
        'xs': ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0' }], // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.006em' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em' }], // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.017em' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.022em' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }], // 36px
        '5xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }], // 48px
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.032em' }], // 60px
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '12px',
        '2xl': '14px',
        '3xl': '20px',
      },
      boxShadow: {
        // Paper on a desk: a hairline edge, almost no blur. Only floating menus get real depth.
        'subtle': '0 1px 0 0 rgb(20 33 28 / 0.04)',
        'card': '0 1px 0 0 rgb(20 33 28 / 0.05)',
        'card-hover': '0 1px 0 0 rgb(20 33 28 / 0.05), 0 0 0 1px rgb(11 93 70 / 0.25)',
        'elevated': '0 16px 32px -12px rgb(20 33 28 / 0.22), 0 2px 6px -2px rgb(20 33 28 / 0.08)',
      },
      colors: {
        // Healthcare theme
        primary,
        care: { 500: v('care-500'), DEFAULT: v('care-500') },
        ink: { 900: v('ink-900'), 600: v('ink-600'), 400: v('ink-400'), DEFAULT: v('ink-900'), 2: v('ink-600'), 3: v('ink-400') },
        canvas: v('canvas'),
        surface: v('surface'),
        hair: { DEFAULT: v('hair'), strong: v('hair-strong') },
        critical: { DEFAULT: v('critical') },
        warning: { DEFAULT: v('warning') },
        success: { DEFAULT: v('success') },
        audit: { DEFAULT: v('audit') },

        // Legacy aliases (mapped to the healthcare palette)
        navy: { DEFAULT: v('primary-700'), hover: v('primary-800'), 700: v('primary-800') },
        clinical: { DEFAULT: v('primary-600'), hover: v('primary-700'), light: v('primary-50') },
        brand: { ...primary, navy: v('primary-700'), slate: v('primary-600'), accent: v('success') },
        // Stock Tailwind greys, greens and reds retuned to the record palette so older
        // utility classes (bg-slate-50, text-rose-800, ...) stay on-brand
        slate: { 50: '#F4F7F5', 100: '#E9EFEC', 200: '#DAE3DE', 300: '#C4D1CA', 400: '#8FA39A', 500: '#62746D', 600: '#4D5F58', 700: '#40524B', 800: '#2A3B34', 900: '#14211C' },
        emerald: { DEFAULT: '#157340', 50: '#ECF5F0', 100: '#D6EBE0', 200: '#ADD4C0', 300: '#82BD9F', 400: '#4FA07A', 500: '#1F8463', 600: '#117053', 700: '#0B5D46', 800: '#084B38', 900: '#06382A' },
        rose: { 50: '#FBEDEC', 100: '#F6D9D7', 200: '#ECB6B2', 300: '#E08C86', 400: '#CF5F57', 500: '#C0433B', 600: '#B02621', 700: '#94201C', 800: '#7A1B17', 900: '#5E1512', 950: '#3B0D0B' },
        crimson: { DEFAULT: '#B02621', hover: '#8F1E1A', light: '#FBEDEC' },
        amber: { DEFAULT: '#D97706', hover: '#B45309', light: '#FEF3C7' },
        purple: { DEFAULT: '#7C3AED', hover: '#6D28D9', light: '#F5F3FF' },
      },
      keyframes: {
        'ecg-draw': {
          from: { strokeDashoffset: '1200' },
          to: { strokeDashoffset: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'ecg-draw': 'ecg-draw 2.6s ease-out forwards',
        'fade-up': 'fade-up 0.6s ease-out both',
        'float-soft': 'float-soft 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
