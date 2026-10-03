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
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Figtree', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(11 43 51 / 0.04)',
        'card': '0 1px 3px 0 rgb(13 148 136 / 0.06), 0 1px 2px -1px rgb(11 43 51 / 0.04)',
        'card-hover': '0 12px 28px -8px rgb(13 148 136 / 0.22), 0 4px 8px -4px rgb(11 43 51 / 0.06)',
        'elevated': '0 20px 40px -12px rgb(13 148 136 / 0.25), 0 8px 16px -8px rgb(11 43 51 / 0.08)',
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
        emerald: { DEFAULT: '#059669', hover: '#047857', light: '#ECFDF5' },
        crimson: { DEFAULT: '#E11D48', hover: '#BE123C', light: '#FFF1F2' },
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
