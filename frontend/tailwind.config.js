/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F8FC',
        surface: '#FFFFFF',
        navy: {
          DEFAULT: '#17365D',
          dark: '#0f243e',
          light: '#234a7d',
        },
        aeroblue: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
        },
        tealaccent: {
          DEFAULT: '#008C95',
          dark: '#007077',
          light: '#E6F4F5',
        },
        aerotext: {
          primary: '#1F2937',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        aeroborder: '#E2E8F0',
        status: {
          success: '#15803D',
          warning: '#D97706',
          critical: '#DC2626',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        panel: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
