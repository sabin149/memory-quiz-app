/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require("nativewind/preset")],
 darkMode: 'class', // Enable dark mode with 'dark' class
  theme: {
    extend: {
      colors: {
        'primary': '#4B5EAA',
        'secondary': '#FF6F61',
        'accent': '#FFD166',
        'background': '#F5F5F5',
        'dark-bg': '#1A202C',
        'dark-text': '#E2E8F0',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
    },
  },
  plugins: [],
};