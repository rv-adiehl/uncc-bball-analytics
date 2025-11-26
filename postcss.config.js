// PostCSS configuration for Next.js
// Configuration includes all installed PostCSS plugins
module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-preset-env': {
      stage: 3,
      features: {
        'nesting-rules': true
      }
    },
    autoprefixer: {},
  },
};

