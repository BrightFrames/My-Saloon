/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glowup: {
          brand: '#CA9A86',
          dark: '#5C433B',
          gray: '#838383',
          bg: '#FAFAFA'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif']
      }
    },
  },
  plugins: [],
}

