const { config } = require('@internxt/css-config');

module.exports = {
  ...config,
  content: [...config.content, './src/**'],
  theme: {
    ...config.theme,
    extend: {
      ...config.theme?.extend,
      fontFamily: {
        ...config.theme?.extend?.fontFamily,
        sans: ['Roboto', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
};
