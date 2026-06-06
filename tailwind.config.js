/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F3EC',
        'paper-deep': '#EFE7D8',
        ink: '#1B1F3B',
        'ink-soft': '#2A2F52',
        'ink-mute': '#6E6F84',
        solar: '#C8923D',
        'solar-deep': '#A8762A',
        'solar-pale': '#E8D4A8',
        ash: '#D8D2C2'
      },
      fontFamily: {
        serif: ['Fraunces', 'Spectral', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'Geist', '-apple-system', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        almanac: '0.18em',
        editorial: '0.04em'
      }
    }
  },
  plugins: []
}
