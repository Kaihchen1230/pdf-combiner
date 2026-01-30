/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0b',
          800: '#121214',
          700: '#1a1a1d',
          600: '#222226',
          500: '#2a2a2f',
          400: '#3a3a42',
          300: '#52525e',
        },
        accent: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          hover: '#818cf8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI Variable', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

