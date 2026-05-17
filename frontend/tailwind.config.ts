import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg:              'var(--bg)',
        surface:         'var(--surface)',
        'surface-2':     'var(--surface-2)',
        ink:             'var(--ink)',
        'ink-2':         'var(--ink-2)',
        'ink-3':         'var(--ink-3)',
        'ink-4':         'var(--ink-4)',
        line:            'var(--line)',
        'line-2':        'var(--line-2)',
        accent:          'var(--accent)',
        'accent-2':      'var(--accent-2)',
        'accent-soft':   'var(--accent-soft)',
        'status-draft':     'var(--status-draft)',
        'status-applied':   'var(--status-applied)',
        'status-interview': 'var(--status-interview)',
        'status-offer':     'var(--status-offer)',
        'status-rejected':  'var(--status-rejected)',
        good: 'var(--good)',
        warn: 'var(--warn)',
        bad:  'var(--bad)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui'],
        mono: ['Geist Mono', 'ui-monospace'],
      },
      borderRadius: {
        xs:      '4px',
        sm:      '6px',
        DEFAULT: '10px',
        md:      '10px',
        lg:      '14px',
        xl:      '20px',
        full:    '9999px',
      },
      boxShadow: {
        xs:      'var(--shadow-xs)',
        sm:      'var(--shadow-sm)',
        md:      'var(--shadow-md)',
        lg:      'var(--shadow-lg)',
        popover: 'var(--shadow-popover)',
      },
    },
  },
  plugins: [],
} satisfies Config;
