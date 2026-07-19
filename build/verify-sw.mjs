#!/usr/bin/env node
/**
 * Ellis Web Bell — service-worker asset verifier (added 6.1.0)
 *
 * Guards the "new module forgotten in CORE_ASSETS" and "CORE_ASSETS lists a
 * deleted file" footguns (both bit us: script.js lingered after 6.0.0; the
 * CACHE_VERSION constant went stale in the same pass).
 *
 * Checks:
 *   1. every path in CORE_ASSETS exists on disk (relative to repo root)
 *   2. every src/js/*.js module appears in CORE_ASSETS
 *   3. CACHE_VERSION matches the "Version:" line in the SW header comment
 *   4. CACHE_NAME is derived from CACHE_VERSION (not a hardcoded literal)
 *
 * Exit 0 = clean.   cd build && node verify-sw.mjs   (or npm run check:sw)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const sw = readFileSync(join(root, 'service-worker.js'), 'utf8');
const errors = [];

// --- extract CORE_ASSETS ---
const assetsMatch = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);
if (!assetsMatch) {
  console.error('verify-sw: could not find CORE_ASSETS array');
  process.exit(1);
}
const assets = [...assetsMatch[1]
  .replace(/\/\/[^\n]*/g, '')        // strip line comments (apostrophes in
  .replace(/\/\*[\s\S]*?\*\//g, '')  // prose would read as string delims)
  .matchAll(/'([^']+)'/g)].map(m => m[1]);

// 1. every listed asset exists
for (const a of assets) {
  if (!existsSync(join(root, a.replace(/^\//, '')))) {
    errors.push(`CORE_ASSETS lists '${a}' but it does not exist on disk`);
  }
}

// 2. every module is listed
const modules = readdirSync(join(root, 'src', 'js')).filter(f => f.endsWith('.js'));
for (const f of modules) {
  if (!assets.includes(`/src/js/${f}`)) {
    errors.push(`src/js/${f} exists but is MISSING from CORE_ASSETS (offline loads will miss it)`);
  }
}

// 3. CACHE_VERSION matches the header "Version:" line
const headerVer = (sw.match(/^\s*\*\s*Version:\s*([\d.]+)/m) || [])[1];
const constVer = (sw.match(/const CACHE_VERSION = '([\d.]+)'/) || [])[1];
if (!headerVer || !constVer) {
  errors.push('could not read header Version and/or CACHE_VERSION constant');
} else if (headerVer !== constVer) {
  errors.push(`header says Version: ${headerVer} but CACHE_VERSION is '${constVer}' — bump them together`);
}

// 4. CACHE_NAME derived, not hardcoded
if (!/const CACHE_NAME = '[^']*' \+ CACHE_VERSION;/.test(sw)) {
  errors.push("CACHE_NAME must be derived ('prefix-' + CACHE_VERSION), not a hardcoded literal");
}

console.log(`verify-sw: ${assets.length} CORE_ASSETS entries, ${modules.length} modules, CACHE_VERSION ${constVer || '?'}`);
if (errors.length) {
  console.error(`\n${errors.length} ERRORS:`);
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}
console.log('OK: assets exist, all modules cached, version constants agree.');
