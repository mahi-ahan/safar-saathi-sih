/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF6EC', paper: '#F3ECDC',
        green: { deep: '#1F3D2B', DEFAULT: '#2F5233', soft: '#3E6B47', darkFooter: '#122B1E' },
        gold: { DEFAULT: '#C89B3C', light: '#E4C878', dim: '#9C7A2E' },
        indigo: { DEFAULT: '#1B3A6B', light: '#2E5490' },
        soil: '#6B4226', brick: '#B23A2E',
        night: { bg: '#0F1A12', card: '#17241A', line: '#25352A' }
      },
      fontFamily: {
        display: ['"Noto Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
        body: ['"Noto Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' }
    }
  },
  plugins: []
}