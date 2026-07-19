#!/usr/bin/env node
/**
 * transform-modals.mjs — ONE-TIME tool for Stage 6b (v6.2.0).
 *
 * Rewrites index.html modal chrome from repeated literal Tailwind class
 * strings to data-attributes expanded at runtime by src/js/26-modal-chrome.js.
 * Kept for archaeology alongside the convert-esm-pass*.mjs tools.
 *
 * What it touches (ATTRIBUTES ONLY — never element structure, ids, or text):
 *   1. Modal backdrop wrappers:
 *        class="fixed inset-0 bg-black bg-opacity-60 flex items-center
 *               justify-center z-50 hidden"
 *      -> data-modal class="hidden"   (+ data-modal-z="<literal>" when the
 *         z class isn't z-50; data-modal-z="none" when there was no z class;
 *         data-modal-align="start" for the items-start variant; any other
 *         classes are preserved verbatim in class="")
 *   2. Panels: class="bg-white p-8 rounded-lg shadow-xl w-full <rest>"
 *      -> data-modal-panel class="<rest>"  (class attr dropped if empty)
 *   3. Buttons, EXACT full-attribute matches only:
 *        gray cancel  -> data-btn="cancel"
 *        blue primary -> data-btn="primary"
 *        red danger   -> data-btn="danger"
 *
 * Safety assertions (any failure = no file written, exit 1):
 *   - expected transform counts match observed exactly
 *   - inline <script> bodies are byte-identical before/after
 *   - the id="" inventory is identical before/after
 *   - zero backdrop literals remain afterward
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, '../index.html');
const EXPECT = { wrappers: 45, panels: 42, cancel: 40, primary: 19, danger: 7 };

const before = readFileSync(FILE, 'utf8');
const scripts = (s) => createHash('sha256')
  .update([...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\u0000'))
  .digest('hex');
const ids = (s) => [...s.matchAll(/id="([^"]+)"/g)].map(m => m[1]).sort().join('\n');
const scriptsBefore = scripts(before);
const idsBefore = ids(before);

let out = before;
const counts = { wrappers: 0, panels: 0, cancel: 0, primary: 0, danger: 0 };
const unmatchedPanels = [];

// ---- 1. Backdrop wrappers -------------------------------------------------
// Match the class attribute; require the canonical backdrop prefix, then
// parse the remainder token-by-token so nothing is silently dropped.
out = out.replace(
  /class="fixed inset-0 bg-black bg-opacity-60 flex items-(center|start) justify-center([^"]*)"/g,
  (whole, align, rest) => {
    counts.wrappers++;
    const tokens = rest.trim().split(/\s+/).filter(Boolean);
    let z = null;
    const keep = [];
    let hidden = false;
    for (const t of tokens) {
      if (/^z-(\[\d+\]|\d+)$/.test(t)) { if (z) throw new Error('two z classes: ' + whole); z = t; }
      else if (t === 'hidden') hidden = true;
      else keep.push(t);
    }
    if (!hidden) throw new Error('wrapper without hidden: ' + whole);
    const attrs = ['data-modal'];
    if (align === 'start') attrs.push('data-modal-align="start"');
    if (z === null) attrs.push('data-modal-z="none"');
    else if (z !== 'z-50') attrs.push(`data-modal-z="${z}"`);
    const cls = ['hidden', ...keep].join(' ');
    return `${attrs.join(' ')} class="${cls}"`;
  }
);

// ---- 2. Panels ------------------------------------------------------------
out = out.replace(
  /class="bg-white p-8 rounded-lg shadow-xl w-full([^"]*)"/g,
  (whole, rest) => {
    counts.panels++;
    const cls = rest.trim();
    return cls ? `data-modal-panel class="${cls}"` : 'data-modal-panel';
  }
);

// ---- 3. Buttons (exact attribute matches only) ----------------------------
const BTN = [
  ['cancel', 'class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"'],
  ['primary', 'class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"'],
  ['danger', 'class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"'],
];
for (const [kind, literal] of BTN) {
  out = out.split(literal).join(`data-btn="${kind}"`);
  counts[kind] = (before.split(literal).length - 1);
}

// ---- report unmatched panels (wrappers whose panel didn't match) ---------
const lines = out.split('\n');
lines.forEach((ln, i) => {
  if (ln.includes('data-modal ') || /data-modal($| )/.test(ln.trim().split('class=')[0] ?? '')) {
    if (!ln.includes('data-modal')) return;
    const window2 = lines.slice(i, i + 3).join('\n');
    if (ln.includes('data-modal') && !ln.includes('data-modal-panel')
        && !window2.includes('data-modal-panel')) {
      const id = (ln.match(/id="([^"]+)"/) || [])[1];
      if (id) unmatchedPanels.push(`${id} (line ${i + 1})`);
    }
  }
});

// ---- assertions -----------------------------------------------------------
const errs = [];
for (const k of Object.keys(EXPECT)) {
  if (counts[k] !== EXPECT[k]) errs.push(`${k}: expected ${EXPECT[k]}, got ${counts[k]}`);
}
if (scripts(out) !== scriptsBefore) errs.push('inline <script> bodies changed');
if (ids(out) !== idsBefore) errs.push('id inventory changed');
if (out.includes('fixed inset-0 bg-black bg-opacity-60')) errs.push('backdrop literal survived');
if (errs.length) {
  console.error('TRANSFORM ABORTED — nothing written:');
  for (const e of errs) console.error('  - ' + e);
  process.exit(1);
}

writeFileSync(FILE, out);
const delta = before.length - out.length;
console.log(`OK: ${counts.wrappers} wrappers, ${counts.panels} panels, ` +
  `${counts.cancel + counts.primary + counts.danger} buttons ` +
  `(${counts.cancel}/${counts.primary}/${counts.danger} cancel/primary/danger); ` +
  `${delta} bytes removed; scripts + ids verified unchanged.`);
if (unmatchedPanels.length) {
  console.log('Panels left bespoke (review by hand):');
  for (const p of unmatchedPanels) console.log('  - ' + p);
}
