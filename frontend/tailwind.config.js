/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e6e8f0',
          100: '#b3b8d1',
          200: '#8088b2',
          300: '#4d5893',
          400: '#1a2874',
          500: '#0f1a5c', // Main navy
          600: '#0d1549',
          700: '#0a1036',
          800: '#080b23',
          900: '#050610',
        },
        electric: {
          50: '#e6f4ff',
          100: '#b3d9ff',
          200: '#80beff',
          300: '#4da3ff',
          400: '#1a88ff',
          500: '#0066ff', // Main electric blue
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

