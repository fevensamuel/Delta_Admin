/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'delta-red': '#C8102E',
        'delta-red-hover': '#A00D24',
        'delta-dark': '#111827',
        'delta-dark-header': '#1A1D20',
        'delta-bg': '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};