#!/usr/bin/env node
/**
 * Ellis Web Bell 6.0.0 converter — PASS 3: console.log -> safeLog.log
 *
 * Rewrites every `console.log(...)` call to `safeLog.log(...)` in src/js/,
 * EXCEPT inside safeLog's own definition (03-memory-management.js declarator).
 * console.warn / console.error are left alone (safeLog forwards them
 * unchanged, so migrating them would be churn without effect).
 *
 * Adds `import { safeLog } from './03-memory-management.js';` to any module
 * that now uses safeLog but doesn't already bind it.
 *
 * AST-located (espree): strings and comments are untouched by construction.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as espree from 'espree';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src', 'js');
const SAFELOG_HOME = '03-memory-management.js';

const files = readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
let total = 0;

for (const f of files) {
  let code = readFileSync(join(srcDir, f), 'utf8');
  const ast = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true });

  // find safeLog's own declarator range in its home module (skip zone)
  let skip = null;
  if (f === SAFELOG_HOME) {
    (function find(node) {
      if (!node || typeof node.type !== 'string' || skip) return;
      if (node.type === 'VariableDeclarator' && node.id?.name === 'safeLog') { skip = node.range; return; }
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && find(c));
        else if (v && typeof v.type === 'string') find(v);
      }
    })(ast);
    if (!skip) throw new Error('safeLog declarator not found in ' + SAFELOG_HOME);
  }

  // collect console.log member expressions
  const hits = [];
  (function walk(node) {
    if (!node || typeof node.type !== 'string') return;
    if (
      node.type === 'MemberExpression' && !node.computed &&
      node.object?.type === 'Identifier' && node.object.name === 'console' &&
      node.property?.type === 'Identifier' && node.property.name === 'log'
    ) {
      if (!(skip && node.range[0] >= skip[0] && node.range[1] <= skip[1])) hits.push(node.range);
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c));
      else if (v && typeof v.type === 'string') walk(v);
    }
  })(ast);

  if (hits.length === 0) continue;

  hits.sort((a, b) => b[0] - a[0]);
  for (const [s, e] of hits) code = code.slice(0, s) + 'safeLog.log' + code.slice(e);

  // ensure safeLog is bound in this module
  if (f !== SAFELOG_HOME) {
    const binds = new RegExp(String.raw`\bsafeLog\b`).test(
      // check existing import lines only
      code.split('\n').filter(l => l.trimStart().startsWith('import') || l.includes("from './")).join('\n')
    ) && code.includes(`from './${SAFELOG_HOME}'`) && /import\s*\{[^}]*\bsafeLog\b[^}]*\}/s.test(code);
    if (!binds) {
      const line = `import { safeLog } from './${SAFELOG_HOME}';\n`;
      // insert after the generated import header if present, else at top
      const marker = '// ===== module imports';
      if (code.includes(marker)) {
        const nl = code.indexOf('\n', code.indexOf(marker));
        code = code.slice(0, nl + 1) + line + code.slice(nl + 1);
      } else {
        code = line + code;
      }
    }
  }

  writeFileSync(join(srcDir, f), code);
  console.log(`  ${f}: ${hits.length} console.log -> safeLog.log`);
  total += hits.length;
}
console.log(`pass 3 complete: ${total} calls migrated`);
