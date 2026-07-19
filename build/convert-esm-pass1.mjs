#!/usr/bin/env node
/**
 * Ellis Web Bell 6.0.0 converter — PASS 1: state extraction
 *
 * Moves every cross-chunk-written module variable into src/js/state.js
 * (export const state = {...}) and rewrites all references — reads and
 * writes, in every chunk — from `foo` to `state.foo`.
 *
 * Safety properties:
 *  - References are located by eslint-scope resolution, never regex, so
 *    shadowed locals, strings, and comments are untouched by construction.
 *  - Object shorthand ({foo} / ({foo} = x)) is expanded to foo: state.foo.
 *  - Hard assertions: number of removed declarators must equal the target
 *    list; every edit is range-based and applied in descending order.
 *  - Aborts (leaving files untouched) on any unexpected shape.
 *
 * Run from build/:  node convert-esm-pass1.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src', 'js');

// ---------- 1. identify targets (same logic as analyze-deps) ----------
const files = readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
const parsed = new Map();
for (const f of files) {
  const code = readFileSync(join(srcDir, f), 'utf8');
  const ast = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true });
  const sm = eslintScope.analyze(ast, { ecmaVersion: 2023, sourceType: 'module' });
  parsed.set(f, { code, ast, sm, moduleScope: sm.globalScope.childScopes[0] });
}
const symbolTable = new Map();
for (const [f, p] of parsed) for (const v of p.moduleScope.variables) {
  if (symbolTable.has(v.name)) throw new Error(`duplicate symbol ${v.name}`);
  symbolTable.set(v.name, f);
}
const moved = new Map(); // name -> ownerFile
for (const [f, p] of parsed) {
  for (const ref of p.sm.globalScope.through) {
    const name = ref.identifier.name;
    const owner = symbolTable.get(name);
    if (owner && owner !== f && ref.isWrite()) moved.set(name, owner);
  }
}
console.log(`targets: ${moved.size} variables`);
if (moved.size !== 103) throw new Error(`expected 103 targets, found ${moved.size}`);

// ---------- 2. build parent maps (for shorthand detection) ----------
function buildParents(ast) {
  const parents = new Map();
  (function walk(node, parent) {
    if (!node || typeof node.type !== 'string') return;
    parents.set(node, parent);
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const val = node[key];
      if (Array.isArray(val)) val.forEach(c => c && typeof c.type === 'string' && walk(c, node));
      else if (val && typeof val.type === 'string') walk(val, node);
    }
  })(ast, null);
  return parents;
}

// ---------- 3. per owner: extract declarators for state.js ----------
const stateEntries = []; // { name, initText, owner }
const removalEdits = new Map(); // file -> [{start,end,text}]
function addEdit(file, start, end, text) {
  if (!removalEdits.has(file)) removalEdits.set(file, []);
  removalEdits.get(file).push({ start, end, text });
}

const removedDeclRanges = new Map(); // file -> [ [s,e] ] to skip refs inside
let removedDeclarators = 0;

for (const f of files) {
  const { code, ast } = parsed.get(f);
  for (const node of ast.body) {
    if (node.type !== 'VariableDeclaration') continue;
    const movedDecls = node.declarations.filter(d => d.id.type === 'Identifier' && moved.get(d.id.name) === f);
    if (movedDecls.length === 0) continue;
    for (const d of movedDecls) {
      if (d.id.type !== 'Identifier') throw new Error(`non-identifier declarator in ${f}`);
      const initText = d.init ? code.slice(d.init.range[0], d.init.range[1]) : 'undefined';
      stateEntries.push({ name: d.id.name, initText, owner: f });
      removedDeclarators++;
    }
    if (movedDecls.length === node.declarations.length) {
      // remove whole statement, including trailing newline if line becomes empty
      let end = node.range[1];
      if (code[end] === '\n') end++;
      addEdit(f, node.range[0], end, '');
      (removedDeclRanges.get(f) ?? removedDeclRanges.set(f, []).get(f)).push([node.range[0], node.range[1]]);
    } else {
      // mixed statement: remove individual declarators + separating comma
      for (const d of movedDecls) {
        const idx = node.declarations.indexOf(d);
        let start = d.range[0], end = d.range[1];
        if (idx > 0) start = node.declarations[idx - 1].range[1]; // eat preceding comma
        else end = node.declarations[1].range[0]; // eat following comma
        addEdit(f, start, end, '');
        (removedDeclRanges.get(f) ?? removedDeclRanges.set(f, []).get(f)).push([d.range[0], d.range[1]]);
      }
    }
  }
}
if (removedDeclarators !== moved.size) throw new Error(`removed ${removedDeclarators} declarators, expected ${moved.size}`);

// ---------- 4. rewrite references in every chunk ----------
let totalRefEdits = 0;
for (const f of files) {
  const { code, ast, sm, moduleScope } = parsed.get(f);
  const parents = buildParents(ast);
  const skipRanges = removedDeclRanges.get(f) ?? [];
  const inSkip = (r) => skipRanges.some(([s, e]) => r[0] >= s && r[1] <= e);

  const idNodes = new Set();
  // foreign references (unresolved in this chunk)
  for (const ref of sm.globalScope.through) {
    if (moved.has(ref.identifier.name)) idNodes.add(ref.identifier);
  }
  // owner-internal references
  for (const v of moduleScope.variables) {
    if (moved.get(v.name) === f) {
      for (const ref of v.references) idNodes.add(ref.identifier);
      // exclude the declarator id itself
      for (const def of v.defs) idNodes.delete(def.name);
    }
  }
  for (const id of idNodes) {
    if (inSkip(id.range)) continue;
    const parent = parents.get(id);
    let start = id.range[0], end = id.range[1], text = `state.${id.name}`;
    if (parent && parent.type === 'Property' && parent.shorthand && parent.value === id) {
      text = `${id.name}: state.${id.name}`;
    } else if (parent && parent.type === 'Property' && parent.key === id && !parent.computed && parent.value !== id) {
      throw new Error(`ref surfaced as non-shorthand property key in ${f}:${id.loc.start.line} — investigate`);
    } else if (parent && (parent.type === 'ImportSpecifier' || parent.type === 'ExportSpecifier')) {
      throw new Error(`moved name in import/export specifier ${f}:${id.loc.start.line}`);
    } else if (parent && parent.type === 'MemberExpression' && parent.property === id && !parent.computed) {
      continue; // property access like obj.foo — not a variable reference (shouldn't appear via scope refs, safety)
    }
    addEdit(f, start, end, text);
    totalRefEdits++;
  }
}
console.log(`reference edits: ${totalRefEdits}`);

// ---------- 5. apply edits ----------
for (const [f, edits] of removalEdits) {
  edits.sort((a, b) => b.start - a.start);
  // assert no overlaps
  for (let i = 1; i < edits.length; i++) {
    if (edits[i].end > edits[i - 1].start) throw new Error(`overlapping edits in ${f}`);
  }
  let code = parsed.get(f).code;
  for (const e of edits) code = code.slice(0, e.start) + e.text + code.slice(e.end);
  writeFileSync(join(srcDir, f), code);
}

// ---------- 6. emit state.js ----------
const byOwner = new Map();
for (const e of stateEntries) {
  if (!byOwner.has(e.owner)) byOwner.set(e.owner, []);
  byOwner.get(e.owner).push(e);
}
let out = `// ============================================================
// v6.0.0: SHARED MUTABLE STATE
// Every variable in this object is WRITTEN by more than one module.
// ES module import bindings are read-only, so cross-module writes must
// go through a shared object — this one. Read/write as state.foo.
// Variables written by only their own module still live in that module
// and are exported as live bindings (read-only to importers).
// Grouped by the chunk that originally declared each variable.
// ============================================================
export const state = {
`;
for (const [owner, entries] of byOwner) {
  out += `\n    // ---- originally declared in ${owner} ----\n`;
  for (const e of entries) {
    const init = e.initText.split('\n').map((l, i) => (i === 0 ? l : '    ' + l)).join('\n');
    out += `    ${e.name}: ${init},\n`;
  }
}
out += `};\n`;
writeFileSync(join(srcDir, 'state.js'), out);
console.log(`state.js written: ${stateEntries.length} entries`);
console.log('PASS 1 COMPLETE');
