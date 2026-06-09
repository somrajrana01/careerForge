/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        forge: {
          ink: '#1f2937',
          teal: '#0f766e',
          mint: '#ccfbf1',
          amber: '#f59e0b',
          line: '#e5e7eb',
          paper: '#ffffff',
          wash: '#f7f8fa'
        }
      }
    },
  },
  plugins: [],
};
