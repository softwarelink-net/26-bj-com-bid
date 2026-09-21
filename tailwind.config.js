/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          navy: '#1e3a8a',
          deep: '#0c1a3a',
          sky: '#0369a1',
          teal: '#0d9488',
          mint: '#14b8a6',
          frost: '#e0f2fe',
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
