/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#1B365D',
          700: '#16294a',
        },
        clinical: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        emerald: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
        },
        crimson: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        amber: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        purple: {
          DEFAULT: '#7C3AED',
          light: '#F5F3FF',
        },
        canvas: '#F8FAFC',
        ink: {
          DEFAULT: '#0F172A',
          2: '#475569',
          3: '#94A3B8',
        },
        hair: '#E2E8F0',
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          navy: '#1B365D',
          slate: '#2B6CB0',
          accent: '#059669',
        }
      }
    },
  },
  plugins: [],
};
