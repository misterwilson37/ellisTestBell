/** Ellis Web Bell — Tailwind build config (v5.71.0)
 *
 * Replaces the Play CDN (cdn.tailwindcss.com) + the inline tailwind.config
 * that lived in index.html. The fontFamily extension below is that config,
 * moved here verbatim.
 *
 * REBUILD WORKFLOW: any time you add a Tailwind class that has never been
 * used before (in index.html OR in a template string in any src/js/ module), rerun:
 *
 *     npx tailwindcss -c tailwind.config.js -i tailwind.input.css -o tailwind.css --minify
 *
 * and commit the regenerated tailwind.css. If a new element mysteriously has
 * no styling, a missing rebuild is the first thing to check.
 *
 * The content scanner tokenizes whole files, so class names in JS string
 * literals (including ternaries and VISUAL_CONFIG values) are picked up.
 * What it can NOT see is a class assembled from pieces at runtime, e.g.
 * `bg-${color}-500`. Don't write those for Tailwind classes — or add the
 * finished names to the safelist below. (The warning-* animation classes are
 * defined in styles.css, not Tailwind, so they're unaffected.)
 */
const path = require('path');

module.exports = {
  // Resolved against THIS FILE's location, not the working directory.
  // (Tailwind v3 resolves relative content globs from the CWD — running the
  // CLI from anywhere other than build/ silently produced an EMPTY stylesheet
  // with zero utility classes. Absolute paths make that impossible.)
  content: [
    path.resolve(__dirname, '../index.html'),
    // v6.0.0: script.js retired — the modules in src/js/ ARE production.
    path.resolve(__dirname, '../src/js') + '/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use Century Gothic, with Urbanist and Questrial as web-safe fallbacks
        sans: ['Century Gothic', 'Urbanist', 'Questrial', 'sans-serif'],
      },
    },
  },
  safelist: [],
}
