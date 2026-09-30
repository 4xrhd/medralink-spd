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
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'elevated': '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      colors: {
        navy: {
          DEFAULT: '#1B365D',
          hover: '#152a48',
          700: '#16294a',
        },
        clinical: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        emerald: {
          DEFAULT: '#059669',
          hover: '#047857',
          light: '#ECFDF5',
        },
        crimson: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
          light: '#FEF2F2',
        },
        amber: {
          DEFAULT: '#D97706',
          hover: '#B45309',
          light: '#FEF3C7',
        },
        purple: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
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
