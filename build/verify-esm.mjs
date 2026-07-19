#!/usr/bin/env node
/**
 * Ellis Web Bell — ES module verifier (replaces check:js from the script.js era)
 *
 * Checks every module in src/js/:
 *   1. parses as an ES module (espree, ecma latest)
 *   2. LINKER: every relative import resolves to a real file that actually
 *      exports every imported name
 *   3. READ-ONLY IMPORTS: no assignment/update targets an imported binding
 *      (would throw TypeError at runtime)
 *   4. TDZ AUDIT: references at module-evaluation time (outside any function)
 *      to imported non-function bindings are listed — if the two modules are
 *      in an import cycle these can throw ReferenceError; review any listed.
 *      Reviewed-safe cases live in TDZ_WHITELIST below.
 *   5. UNUSED IMPORTS (added 6.1.0): any imported specifier with zero
 *      references is an ERROR. The 6.0.0 generator produced exact imports
 *      (verified: zero unused); this check keeps hand-maintained imports at
 *      that standard. If you remove a function's last call site, remove the
 *      import too.
 *
 * Exit 0 = clean.   cd build && node verify-esm.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src', 'js');
const files = readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();

let errors = [];
let warnings = [];

// TDZ audit findings reviewed and deemed safe. Format: 'file:line:name'.
// 02: `window.customQuickBells = state.customQuickBells` (v5.30 console
// debugging hook) runs at eval time, but state.js imports NOTHING, so no
// import cycle with 02 is possible — the binding is always initialized.
const TDZ_WHITELIST = new Set([
  '02-dom-elements.js:573:state',
]);

const mods = new Map();
for (const f of files) {
  const code = readFileSync(join(srcDir, f), 'utf8');
  let ast;
  try {
    ast = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', range: true, loc: true });
  } catch (e) {
    errors.push(`${f}: PARSE ERROR ${e.message}`);
    continue;
  }
  const sm = eslintScope.analyze(ast, { ecmaVersion: 2023, sourceType: 'module' });
  mods.set(f, { code, ast, sm, moduleScope: sm.globalScope.childScopes[0] });
}

// collect exports per module
const exportsOf = new Map();
for (const [f, m] of mods) {
  const names = new Set();
  for (const node of m.ast.body) {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (node.declaration.type === 'VariableDeclaration') {
          for (const d of node.declaration.declarations) if (d.id.type === 'Identifier') names.add(d.id.name);
        } else if (node.declaration.id) names.add(node.declaration.id.name);
      }
      for (const s of node.specifiers ?? []) names.add(s.exported.name);
    }
  }
  exportsOf.set(f, names);
}

// per module: imports, linker check, read-only check, TDZ audit
for (const [f, m] of mods) {
  const importedBindings = new Map(); // localName -> { from, importedName, kindAtSource }
  for (const node of m.ast.body) {
    if (node.type !== 'ImportDeclaration') continue;
    const spec = node.source.value;
    if (spec.startsWith('.')) {
      const target = spec.replace('./', '');
      if (!existsSync(join(srcDir, target))) {
        errors.push(`${f}: import from missing file ${spec}`);
        continue;
      }
      for (const s of node.specifiers) {
        if (s.type === 'ImportSpecifier') {
          if (!exportsOf.get(target)?.has(s.imported.name)) {
            errors.push(`${f}: imports '${s.imported.name}' from ${target}, which does not export it`);
          }
          importedBindings.set(s.local.name, { from: target, importedName: s.imported.name });
        }
      }
    } else {
      // URL imports (firebase) — trust, but record bindings
      for (const s of node.specifiers) if (s.local) importedBindings.set(s.local.name, { from: spec, importedName: s.imported?.name ?? s.local.name });
    }
  }

  // read-only + TDZ via scope references
  for (const v of m.moduleScope.variables) {
    if (!importedBindings.has(v.name)) continue;
    const isImport = v.defs.some(d => d.type === 'ImportBinding');
    if (!isImport) continue;
    for (const ref of v.references) {
      if (ref.isWrite()) {
        errors.push(`${f}:${ref.identifier.loc.start.line}: WRITES imported binding '${v.name}' (runtime TypeError)`);
      }
    }
  }

  // TDZ audit: eval-time references to imported bindings
  // Build set of ranges covered by function bodies
  const fnRanges = [];
  (function walk(node) {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
      fnRanges.push(node.body.range);
    }
    for (const k of Object.keys(node)) {
      const val = node[k];
      if (Array.isArray(val)) val.forEach(c => c && typeof c.type === 'string' && walk(c));
      else if (val && typeof val.type === 'string') walk(val);
    }
  })(m.ast);
  const inFn = (r) => fnRanges.some(([s, e]) => r[0] >= s && r[1] <= e);

  for (const v of m.moduleScope.variables) {
    if (!v.defs.some(d => d.type === 'ImportBinding')) continue;
    const info = importedBindings.get(v.name);
    if (!info || !info.from.endsWith('.js') || info.from.startsWith('http')) continue;
    for (const ref of v.references) {
      if (!inFn(ref.identifier.range)) {
        const key = `${f}:${ref.identifier.loc.start.line}:${v.name}`;
        if (!TDZ_WHITELIST.has(key)) {
          warnings.push(`${f}:${ref.identifier.loc.start.line}: eval-time use of imported '${v.name}' from ${info.from} — verify not in an import cycle with a let/const binding (or add '${key}' to TDZ_WHITELIST after review)`);
        }
      }
    }
  }

  // 5. UNUSED IMPORTS (6.1.0): imported specifiers with zero references.
  // Re-exports (import X ... export { X }) count as uses via references,
  // but guard explicitly against export-specifier-only usage patterns.
  for (const v of m.moduleScope.variables) {
    if (!v.defs.some(d => d.type === 'ImportBinding')) continue;
    if (v.references.length > 0) continue;
    const reExported = m.ast.body.some(n =>
      n.type === 'ExportNamedDeclaration' &&
      (n.specifiers || []).some(sp => sp.local && sp.local.name === v.name));
    if (!reExported) {
      const line = v.defs[0].node.loc.start.line;
      errors.push(`${f}:${line}: UNUSED import '${v.name}' — remove it (imports are hand-maintained since 6.0.0)`);
    }
  }
}

console.log(`verify-esm: ${files.length} modules checked`);
if (warnings.length) {
  console.log(`\n${warnings.length} TDZ-audit warnings (review once, then whitelist if safe):`);
  warnings.forEach(w => console.log('  WARN ' + w));
}
if (errors.length) {
  console.error(`\n${errors.length} ERRORS:`);
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}
console.log('OK: linker resolved, no writes to imports.');
