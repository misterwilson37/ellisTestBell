#!/usr/bin/env node
/**
 * RETIRED in 6.0.0 — script.js no longer exists.
 *
 * The app is native ES modules: index.html loads src/js/main.js and the
 * browser resolves the import graph. There is no JS build step.
 *
 * What replaced this tool:
 *   node verify-esm.mjs     linker + read-only-import + TDZ checks
 *   npm run lint            per-module no-undef (catches missing imports)
 *   npm test                engine + schedule-utils suites
 *
 * This file exists only so that muscle-memory invocations of the old
 * workflow fail loudly with an explanation instead of silently.
 */
console.error('build-js.mjs is RETIRED (6.0.0): src/js/ IS production; there is no script.js.');
console.error('Run instead:  node verify-esm.mjs && npm run lint && npm test');
process.exit(1);
