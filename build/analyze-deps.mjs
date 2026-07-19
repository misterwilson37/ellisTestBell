#!/usr/bin/env node
/**
 * Ellis Web Bell — src/js dependency analyzer (6.0.0 modularization tool)
 *
 * Parses every chunk in src/js/ (espree + eslint-scope, both shipped inside
 * ESLint — no new dependencies) and reports, per chunk:
 *   - top-level declarations (the chunk's potential exports)
 *   - unresolved identifiers that resolve to OTHER chunks (its imports)
 *   - unresolved identifiers that resolve nowhere (bugs or missing globals)
 *   - CROSS-CHUNK WRITES: assignments/updates to a variable declared in a
 *     different chunk. Illegal under ES modules (imported bindings are
 *     read-only) — each one needs a setter or state-object conversion.
 *
 *   node analyze-deps.mjs            human-readable report
 *   node analyze-deps.mjs --json     machine-readable (consumed by convert)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';
import globalsPkg from 'globals';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src', 'js');

const BROWSER_GLOBALS = new Set([
  ...Object.keys(globalsPkg.browser),
  'Tone', 'globalThis', 'undefined',
]);

const files = readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();

const chunks = new Map(); // file -> { ast, scope, declared:Set, code }

for (const file of files) {
  const code = readFileSync(join(srcDir, file), 'utf8');
  const ast = espree.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    loc: true,
    range: true,
  });
  const scopeManager = eslintScope.analyze(ast, {
    ecmaVersion: 2023,
    sourceType: 'module',
  });
  const moduleScope = scopeManager.globalScope.childScopes[0]; // module scope
  const declared = new Map(); // name -> kind
  for (const v of moduleScope.variables) {
    const kind =
      v.defs[0]?.type === 'FunctionName' ? 'function' :
      v.defs[0]?.type === 'ClassName' ? 'class' :
      v.defs[0]?.parent?.kind ?? v.defs[0]?.type ?? 'unknown';
    declared.set(v.name, kind);
  }
  chunks.set(file, { ast, scopeManager, moduleScope, declared, code });
}

// Global symbol table: name -> declaring file (detect duplicates)
const symbolTable = new Map();
const duplicates = [];
for (const [file, c] of chunks) {
  for (const name of c.declared.keys()) {
    if (symbolTable.has(name)) duplicates.push({ name, a: symbolTable.get(name), b: file });
    else symbolTable.set(name, file);
  }
}

// Per chunk: unresolved refs -> classify; and cross-chunk writes
const report = {};
for (const [file, c] of chunks) {
  const importsFrom = new Map(); // otherFile -> Set(names)
  const unknown = new Set();
  const crossWrites = []; // { name, ownerFile, line, opText }

  // eslint-scope surfaces unresolved refs on the global "through" list
  const throughRefs = c.scopeManager.globalScope.through;
  for (const ref of throughRefs) {
    const name = ref.identifier.name;
    if (c.declared.has(name)) continue; // shouldn't happen, safety
    const owner = symbolTable.get(name);
    if (owner && owner !== file) {
      if (!importsFrom.has(owner)) importsFrom.set(owner, new Set());
      importsFrom.get(owner).add(name);
      if (ref.isWrite()) {
        crossWrites.push({
          name,
          ownerFile: owner,
          line: ref.identifier.loc.start.line,
          kind: chunks.get(owner).declared.get(name),
        });
      }
    } else if (!owner && !BROWSER_GLOBALS.has(name)) {
      unknown.add(name);
    }
  }

  report[file] = {
    declared: Object.fromEntries(c.declared),
    imports: Object.fromEntries(
      [...importsFrom].map(([f, names]) => [f, [...names].sort()])
    ),
    crossWrites,
    unknown: [...unknown].sort(),
  };
}

// Compute each chunk's export list = union of names other chunks import from it
const exportsOf = new Map(files.map(f => [f, new Set()]));
for (const [file, r] of Object.entries(report)) {
  for (const [owner, names] of Object.entries(r.imports)) {
    for (const n of names) exportsOf.get(owner).add(n);
  }
}
for (const f of files) report[f].exports = [...exportsOf.get(f)].sort();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ report, duplicates }, null, 2));
  process.exit(0);
}

// Human-readable summary
let totalCrossWrites = 0;
const writeTargets = new Map(); // "owner:name" -> [writer files]
console.log('=== Ellis Web Bell chunk dependency report ===\n');
for (const f of files) {
  const r = report[f];
  const nImp = Object.values(r.imports).reduce((s, a) => s + a.length, 0);
  console.log(
    `${f}: declares ${Object.keys(r.declared).length}, ` +
    `exports ${r.exports.length}, imports ${nImp} names from ` +
    `${Object.keys(r.imports).length} chunks` +
    (r.crossWrites.length ? `, CROSS-WRITES ${r.crossWrites.length}` : '') +
    (r.unknown.length ? `, UNKNOWN ${r.unknown.join(',')}` : '')
  );
  for (const w of r.crossWrites) {
    totalCrossWrites++;
    const key = `${w.ownerFile}:${w.name}`;
    if (!writeTargets.has(key)) writeTargets.set(key, []);
    writeTargets.get(key).push(`${f}:${w.line}`);
  }
}
console.log(`\n=== Cross-chunk written variables (need setter/state conversion): ${writeTargets.size} vars, ${totalCrossWrites} write sites ===`);
for (const [key, sites] of [...writeTargets].sort()) {
  console.log(`  ${key}  <-  ${sites.join(', ')}`);
}
if (duplicates.length) {
  console.log('\n=== DUPLICATE top-level names across chunks ===');
  for (const d of duplicates) console.log(`  ${d.name}: ${d.a} AND ${d.b}`);
}
