/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'mc-bg': '#0A0C10',
        'mc-bg2': '#0F1117',
        'mc-card': '#131720',
        'mc-border': '#1E2530',
        'mc-cyan': '#00E5FF',
        'mc-amber': '#FFB300',
        'mc-green': '#00E676',
        'mc-red': '#FF5252',
        'mc-text': '#E8EDF2',
        'mc-text2': '#8896A6',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        body: ['"Outfit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
