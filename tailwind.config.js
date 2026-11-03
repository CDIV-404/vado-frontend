/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#030b16',
        deep: '#061526',
        ink: '#f1f5fc',
        mist: '#aebed2',
        volt: '#1687ff',
        beam: '#38c9ff',
        sky: '#67baff',
        glass: 'rgba(18, 55, 88, 0.38)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(114, 210, 255, 0.4)',
        'glow-lg': '0 0 42px rgba(55, 206, 255, 0.35)',
        'glow-in': 'inset 0 0 12px rgba(116, 207, 255, 0.2)',
        phone: '0 0 60px rgba(22, 135, 255, 0.35), 0 0 120px rgba(22, 135, 255, 0.18)',
      },
    },
  },
};
