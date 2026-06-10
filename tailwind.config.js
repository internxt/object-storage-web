const { default: config } = require('@internxt/css-config');

module.exports = {
  ...config,
  content: [...config.content, './src/**'],
  theme: {
    ...config.theme,
    extend: {
      ...config.theme?.extend,
      fontFamily: {
        ...config.theme?.extend?.fontFamily,
        sans: ['Instrument Sans', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        'loading-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'loading-bar': 'loading-bar 1s ease-in-out infinite',
      },
      colors: {
        'badge-active-bg': '#ceffdd',
        'badge-active-text': '#144623',
        'badge-inactive-bg': '#ffdddd',
        'badge-inactive-text': '#4f1010',
      },
    },
  },
};
