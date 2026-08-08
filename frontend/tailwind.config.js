/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#0D0D1A',
        cardDark: '#1A1A2E',
        cardHeader: '#16162A',
        borderDark: '#2D2D4D',
      }
    },
  },
  plugins: [],
}
