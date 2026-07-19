#!/usr/bin/env node
/**
 * Sanity check for the compiled tailwind.css. Catches the failure mode where
 * the Tailwind CLI ran but scanned no content (wrong paths/CWD) and emitted a
 * preflight-only stylesheet with ZERO utility classes — which ships a
 * completely unstyled app. Runs automatically after every `npm run build:css`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'tailwind.css'), 'utf8');
const mustContain = ['.hidden', '.bg-blue-600', '.rounded-lg', '.z-50'];
const missing = mustContain.filter((sel) => !css.includes(sel));

if (css.length < 15000 || missing.length) {
  console.error(`CSS BUILD BAD: ${css.length} bytes; missing: ${missing.join(', ') || 'none'}.`);
  console.error('The scanner probably found no content files. Do not deploy this tailwind.css.');
  process.exit(1);
}
console.log(`tailwind.css OK (${css.length.toLocaleString()} bytes, sentinel classes present).`);
