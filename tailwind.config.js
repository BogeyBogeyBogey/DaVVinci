/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vv: {
          navy: '#1B3A5C',
          'navy-deep': '#0F2440',
          'navy-light': '#2A5080',
          yellow: '#FFD600',
          'yellow-soft': '#FFE55C',
          pink: '#FFB6C1',
          kraft: '#C4A76C',
          'kraft-light': '#DCC99B',
          cream: '#FAF3E0',
          white: '#FFFFFF',
          green: '#2D6A4F',
          lime: '#95D5B2',
          coral: '#E76F51',
          gold: '#F4A261',
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
