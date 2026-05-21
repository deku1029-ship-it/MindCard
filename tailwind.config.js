/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bmw: {
          blue: '#1c69d4',
          focus: '#0653b6',
          black: '#262626',
          gray: '#757575',
          silver: '#bbbbbb',
        },
        primary: '#1c69d4',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        bold: '700',
        black: '900',
      },
      borderRadius: {
        'none': '0',
        DEFAULT: '0',
      },
      spacing: {
        'base': '8px',
      },
      lineHeight: {
        'tight-bmw': '1.15',
        'heading-bmw': '1.30',
      }
    },
  },
  plugins: [],
}

