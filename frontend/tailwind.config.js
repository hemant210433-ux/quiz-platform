/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mukta', '"Noto Sans Devanagari Variable"', 'system-ui', 'sans-serif'],
        display: ['"Tiro Devanagari Hindi"', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#faf6f1', 100: '#f1eae1', 200: '#e2d8cb', 300: '#c3b6a6', 400: '#9a8c7c',
          500: '#75685c', 600: '#5b4f46', 700: '#443a34', 800: '#2f2724', 900: '#211a1a', 950: '#150f10',
        },
        brand: {
          50: '#fbeef1', 100: '#f6d7de', 200: '#eab0bf', 300: '#d97f96', 400: '#c24e6e',
          500: '#a32a4b', 600: '#8d1a3a', 700: '#800020', 800: '#650019', 900: '#4a0e1c', 950: '#33070f',
        },
        good: {
          50: '#ecf7f0', 100: '#d3eddc', 200: '#a8dbbb', 300: '#76c295', 400: '#48a671',
          500: '#2e8b57', 600: '#25744a', 700: '#1f5c3d', 800: '#1b4a33', 900: '#163b2a',
        },
        blush: { 50: '#fdf5f3', 100: '#f8e8e4', 200: '#f0d3cc' },
        mark: { 100: '#f6ecd2', 200: '#ead9a6', 300: '#d4af5a', 400: '#b9923c', 500: '#9c7a2c' },
        amberish: { 100: '#fdf0d5', 500: '#d4900b', 700: '#8a5a06' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(74,14,28,.05), 0 1px 3px rgba(74,14,28,.07)',
        lift: '0 10px 30px rgba(74,14,28,.12)',
        soft: '0 24px 60px -24px rgba(74,14,28,.35)',
      },
    },
  },
  plugins: [],
};
