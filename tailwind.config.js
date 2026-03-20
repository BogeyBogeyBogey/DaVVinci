/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vv: {
          green: '#2D6A4F',
          lime: '#95D5B2',
          gold: '#F4A261',
          dark: '#1B1B1B',
          cream: '#FAF3E0',
          coral: '#E76F51',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
