import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg:       'oklch(98.6% 0.005 80)',
        surface:  'oklch(99.6% 0.003 80)',
        ink:      'oklch(20% 0.015 270)',
        'ink-2':  'oklch(36% 0.012 270)',
        'ink-3':  'oklch(52% 0.010 270)',
        line:     'oklch(90% 0.005 270)',
        accent:   'oklch(58% 0.20 255)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui'],
        mono: ['Geist Mono', 'ui-monospace'],
      },
      borderRadius: {
        DEFAULT: '14px',
        lg: '22px',
        xl: '28px',
      },
    },
  },
  plugins: [],
} satisfies Config;
