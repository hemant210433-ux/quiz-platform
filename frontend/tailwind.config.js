/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d5d9e2', 300: '#b0b8c8', 400: '#8592a8',
          500: '#66738d', 600: '#515c74', 700: '#434b5f', 800: '#2b3140', 900: '#1b1f2a', 950: '#11141b',
        },
        brand: {
          50: '#eef6f4', 100: '#d5ebe5', 200: '#acd6cb', 300: '#7bbbab', 400: '#4f9d8b',
          500: '#348271', 600: '#28695b', 700: '#22554b', 800: '#1e453e', 900: '#1b3a35',
        },
        amberish: { 100: '#fdf0d5', 500: '#d4900b', 700: '#8a5a06' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,20,27,.04), 0 1px 3px rgba(17,20,27,.06)',
        lift: '0 8px 30px rgba(17,20,27,.08)',
      },
    },
  },
  plugins: [],
};
