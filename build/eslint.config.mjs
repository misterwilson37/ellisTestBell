/**
 * Lint: no-undef only, now applied PER MODULE.
 *
 * In the script.js era this single rule caught 14 latent ReferenceErrors
 * (v5.72.0 refactor). In the 6.0.0 module era it is strictly stronger:
 * every chunk is checked in isolation, so a missing import is an error
 * even if some other chunk declares the name. Run after ANY src/js change:
 *
 *     cd build && npm run lint
 *
 * (The npm script runs eslint from the repo root — ESLint 9.14+ silently
 * ignores files outside its base path, so keep it that way.)
 */
import globals from 'globals';

export default [
  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, Tone: 'readonly' },
    },
    rules: { 'no-undef': 'error' },
  },
  {
    files: ['bell-engine.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: { 'no-undef': 'error' },
  },
];
