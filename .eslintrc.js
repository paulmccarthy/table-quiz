module.exports = {
  extends: ['airbnb-base'],
  env: {
    node: true,
    mocha: true,
  },
  rules: {
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
  },
};
