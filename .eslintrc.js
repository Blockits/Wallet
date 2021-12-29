module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'react-app',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    chrome: "readonly"
  },
  env: {
    es2021: true,
    node: true
  }
}
