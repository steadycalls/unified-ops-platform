/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sitepanda: {
          primary: '#3B82F6',
          secondary: '#10B981',
        },
        du: {
          primary: '#8B5CF6',
          secondary: '#EC4899',
        },
        li: {
          primary: '#F59E0B',
          secondary: '#EF4444',
        },
      },
    },
  },
  plugins: [],
}

