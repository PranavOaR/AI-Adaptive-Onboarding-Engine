/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'surface-0': '#0A0A0A',
        'surface-1': '#111111',
        'surface-2': '#161616',
        'surface-3': '#1C1C1C',
        'border': '#1A1A1A',
        'border-subtle': '#141414',
        'accent': '#3B82F6',
        'accent-hover': '#2563EB',
        'text-primary': '#FAFAFA',
        'text-body': '#D4D4D4',
        'text-muted': '#888888',
        'text-dim': '#555555',
        'success': '#22C55E',
        'warning': '#EAB308',
        'error': '#EF4444',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '10px',
      },
    },
  },
  plugins: [],
}
