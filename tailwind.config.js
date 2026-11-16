/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bihar: {
          saffron: '#f97316',
          green: '#15803d',
          gold: '#eab308',
          blue: '#1d4ed8',
          indigo: '#4338ca'
        }
      }
    },
  },
  plugins: [],
}
