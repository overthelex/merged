import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0b0f17',
          soft: '#1a1f2b',
        },
        accent: {
          DEFAULT: '#00d488',
          soft: '#b7f5dc',
        },
        paper: '#f7f6f1',
      },
    },
  },
  plugins: [],
};

export default config;
