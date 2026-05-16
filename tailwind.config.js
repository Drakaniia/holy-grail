/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Sans', 'sans-serif'],
      },
      colors: {
        accent: {
          50: '#fff7ed',
          100: '#ffeed5',
          200: '#ffd9b3',
          300: '#ffc080',
          400: '#ffa54d',
          500: '#ff8c1a',
          600: '#ff7a00',
          700: '#cc6100',
          800: '#994900',
          900: '#663100',
        },
      },
    },
  },
  plugins: [],
}
