import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta de marca: variables CSS (defaults en globals.css, override en runtime con
        // BRAND_PRIMARY_COLOR, ver src/lib/brand.ts). Formato "r g b" para soportar /opacidad.
        brand: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(s => [s, `rgb(var(--brand-${s}) / <alpha-value>)`]),
        ),
        cream: {
          50:  '#fefce8',
          100: '#fef9e7',
          200: '#faf0d7',
          300: '#f5e7c2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
