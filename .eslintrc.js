module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: ['vue', 'prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'vue/multi-word-component-names': 'off',
    'no-console': 'off'
  },
  ignorePatterns: ['dist/**', 'embedded/dist/**', 'node_modules/**']
};
