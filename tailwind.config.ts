import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hoopnote: {
          orange: '#ff7a00',
          purple: '#5634d6',
          blue: '#1769e0',
          ink: '#17144f',
          bg: '#fffaf5',
          muted: '#6f7180'
        }
      }
    }
  },
  plugins: []
} satisfies Config;

