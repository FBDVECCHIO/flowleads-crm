/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        flowleads: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0b66c3',
          600: '#0050c8',
          700: '#003c96',
          900: '#0a192f',
        }
      }
    },
  },
  plugins: [],
}
