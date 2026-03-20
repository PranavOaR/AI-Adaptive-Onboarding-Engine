/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'surface-0': '#111318',
        'surface-1': '#1A1D25',
        'surface-2': '#22252E',
        'surface-3': '#2A2D36',
        'border': '#2E313A',
        'border-subtle': '#23262E',
        'accent': '#818CF8',
        'accent-hover': '#6366F1',
        'text-primary': '#F9FAFB',
        'text-body': '#D1D5DB',
        'text-muted': '#9CA3AF',
        'text-dim': '#6B7280',
        'success': '#34D399',
        'warning': '#FBBF24',
        'error': '#F87171',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}
