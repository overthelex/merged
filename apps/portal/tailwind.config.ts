import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

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
          muted: '#2d3547',
        },
        accent: {
          DEFAULT: '#00d488',
          soft: '#b7f5dc',
          dim: '#009f65',
        },
        paper: {
          DEFAULT: '#f7f6f1',
          dim: '#eeecea',
        },
        surface: {
          DEFAULT: '#ffffff',
          dim: '#f4f3ee',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem', letterSpacing: '0.1em' }],
      },
      borderColor: {
        DEFAULT: 'rgba(11,15,23,0.08)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(11,15,23,0.06), 0 1px 2px -1px rgba(11,15,23,0.06)',
        'card-md': '0 4px 12px 0 rgba(11,15,23,0.08), 0 1px 4px -1px rgba(11,15,23,0.06)',
        'card-lg': '0 8px 24px 0 rgba(11,15,23,0.10), 0 2px 8px -2px rgba(11,15,23,0.08)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [typography],
};

export default config;
