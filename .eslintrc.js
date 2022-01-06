module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 6,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'react-app',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    chrome: 'readonly',
  },
  env: {
    es2021: true,
    node: true,
  },
};
