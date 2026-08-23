import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hoopjot: {
          orange: '#ff7a00',
          purple: '#5634d6',
          blue: '#1769e0',
          ink: '#17144f',
          bg: '#fffaf5',
          surface: '#ffffff',
          muted: '#696b7a',
          success: '#25a66a',
          warning: '#e0a11b',
          danger: '#d84b4b',
          line: '#e8dfd5'
        }
      },
      borderRadius: {
        card: '1.25rem',
        control: '999px'
      },
      boxShadow: {
        card: '0 18px 44px rgb(23 20 79 / 0.10)',
        control: '0 8px 18px rgb(23 20 79 / 0.14)'
      }
    }
  },
  plugins: []
} satisfies Config;
