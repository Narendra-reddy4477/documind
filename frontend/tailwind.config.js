/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in':  'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.3s ease',
        'pulse-dot':'pulseDot 1.5s ease-in-out infinite',
        'typing':   'typing 1s steps(3) infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },                           to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform:'translateY(12px)' }, to: { opacity: 1, transform:'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 1 } },
      }
    },
  },
  plugins: [],
}
