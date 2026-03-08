const js = require('@eslint/js');
const importX = require('eslint-plugin-import-x');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    plugins: {
      'import-x': importX,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
    rules: {
      // Import rules (from airbnb-base)
      'import-x/no-unresolved': ['error', { commonjs: true }],
      'import-x/named': 'error',
      'import-x/extensions': ['error', 'ignorePackages', { js: 'never' }],
      'import-x/no-duplicates': 'error',
      'import-x/order': ['error', { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'] }],

      // Best practices (from airbnb-base)
      'no-param-reassign': ['error', { props: false }],
      'no-underscore-dangle': 'off',
      'consistent-return': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'no-shadow': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'ForInStatement', message: 'for..in iterates over the entire prototype chain. Use Object.keys() instead.' },
        { selector: 'LabeledStatement', message: 'Labels are a form of GOTO; don\'t use them.' },
        { selector: 'WithStatement', message: '`with` is disallowed in strict mode.' },
      ],
      'no-await-in-loop': 'error',
      'no-return-await': 'error',
      'prefer-const': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'prefer-template': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-else-return': 'error',
      'object-shorthand': 'error',
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      camelcase: ['error', { properties: 'never' }],
    },
  },
  {
    ignores: ['node_modules/', 'coverage/', '.nyc_output/'],
  },
];
