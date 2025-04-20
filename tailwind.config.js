const { config } = require('@internxt/css-config')

module.exports = {
  ...config,
  content: [...config.content, './src/**'],
}
