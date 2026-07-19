# Build & verification workflow — READ THIS BEFORE EDITING

> **Deploying, not editing? You don't need this file at all.** The repo (and
> every release zip) ships everything ready to serve — `src/js/` IS the
> production JavaScript and `tailwind.css` is pre-compiled. Pushing to GitHub
> Pages requires no build, no terminal, no npm. Everything below applies only
> when you want to CHANGE the app.

## The 6.0.0 world in one paragraph

As of 6.0.0 the main app is **native ES modules**: `index.html` loads
`src/js/main.js` with `<script type="module">` and the browser resolves the
import graph. There is **no `script.js` and no JS build step** — the old
"generated file" (and its `build:js` / `check:js` ceremony) is retired.
Exactly one generated file remains: `tailwind.css`.

## Editing JavaScript (src/js/)

Edit the module that owns your feature (map at the bottom), then run the
battery (below). Rules that keep the module graph healthy:

- **Cross-module imports/exports are maintained by hand.** Use a new name
  from another module → add it to that module's `export { ... }` block and
  your module's import block. `npm run lint` (per-module no-undef) fails on
  any name you forgot to import; `npm run check:esm` fails on any import the
  other module doesn't actually export.
- **Shared mutable state lives in `src/js/state.js`** (`state.foo`). If a
  variable needs to be *assigned* from more than one module, it must live
  there — ES module imports are read-only bindings, and `check:esm` errors on
  any write to an imported name. Variables written only by their own module
  stay in that module and are exported as live (read-only to others) bindings.
- **Adding a new module?** Three places: create it in `src/js/`, import it in
  `src/js/main.js` (position = execution order), and add it to `CORE_ASSETS`
  in `service-worker.js` + bump `CACHE_NAME` (or offline loads will miss it).
- **Logging:** use `safeLog.log(...)` (import from `03-memory-management.js`),
  not raw `console.log` — debug logs are gated by `PRODUCTION_MODE` there.
  `console.warn`/`console.error` are fine as-is.

## RULE — tailwind.css is generated. New class? Rebuild.

Any time you use a Tailwind class that has **never appeared before** in
`index.html` or any `src/js/` module:

    cd build && npm run build:css

- Symptom of forgetting: the new element renders completely unstyled while
  everything else looks fine.
- You do NOT need a CSS rebuild for: JS logic changes, `styles.css` changes,
  theme color changes (CSS variables), or reusing classes that already appear
  somewhere in index.html/src/js.
- The scanner reads whole files, so class names in JS string literals
  (ternaries, `VISUAL_CONFIG`, `classList.add('...')`) are found automatically.
  It cannot see a class assembled from pieces at runtime, e.g. `bg-${c}-500`.
  Don't write those for Tailwind classes — or add the finished class names to
  the `safelist` in `tailwind.config.js`. (The `warning-*` animation classes
  live in `styles.css`, not Tailwind — unaffected.)

## After any change to bell-engine.js: run the tests

`bell-engine.js` is the shared time/schedule math used by BOTH the main app
and clock.html (the TVs). It is hand-edited, loaded as a plain `<script>`
(NOT an ES module — clock.html needs it that way), and it is the
highest-consequence code in the repo, so:

    cd build && npm test        # engine + schedule-utils suites, no packages needed

Keep the engine pure — no DOM, no Firebase, no app globals. Dependencies come
in as parameters (`previousBells`, `isBellSkipped`). That purity is what makes
it testable and shareable; see the header comment in the file.

## The verification battery (run before every push)

    cd build
    npm run check:all   # 6.1.0: the whole battery in one command, or piecewise:

    npm run check:esm   # linker: every import resolves & is exported;
                        #   no writes to imported bindings; TDZ audit
                        #   (reviewed-safe cases whitelisted in-script);
                        #   UNUSED imports are ERRORS since 6.1.0
    npm run check:sw    # 6.1.0: service-worker CORE_ASSETS vs filesystem;
                        #   every module cached; version constants agree;
                        #   CACHE_NAME derived from CACHE_VERSION
    npm run lint        # per-module no-undef — catches any missing import
    npm test            # bell-engine + schedule-utils unit tests
    npm run check:css   # tailwind.css non-empty + sentinel classes
    npm run build:css   # only if you added a never-before-used Tailwind class

A clean battery prints ZERO warnings. If check:esm warns about a TDZ case
you have reviewed and confirmed safe, add it to TDZ_WHITELIST inside
verify-esm.mjs with a comment saying WHY it is safe.

Tone.js is self-hosted since 6.1.0 (`/tone.min.js`, from the npm `tone`
package's minified UMD build, version pinned at 14.8.49). To upgrade it:
`npm pack tone@<version>`, copy `package/build/Tone.js` over `tone.min.js`,
ship the license file, test a bell ring, bump SW CACHE_VERSION.

## Map: which src/js/ module owns what

state (shared mutable state — every cross-module-written variable) ·
main (entry point; import order = old concatenation order) ·
00 header/version + engine bindings · 01 firebase imports (re-exported) ·
02 DOM element consts · 03 memory management + safeLog ·
04 app state, mute/skip · 05 preferences cloud sync ·
06 countdown warning effects · 07 kiosk mode · 08 theme & display ·
09 picture-in-picture · 10 clock loop & countdown · 11 quick bell broadcast ·
12 quick bell queue · 13 schedule resolution & ringing · 14 schedule list
rendering · 15 firebase init & auth · 16 schedule management (largest) ·
17 share codes · 18 bell CRUD & modals · 19 visual cues & file managers ·
20 day-type schedule calendar (PARKED — see its header) · 21 emergency
schedule shift · 22 edit audit log · 23 clock drift warning ·
24 notification backup ring · 25 status/health view ·
99 init() & event listeners (numbered 99 so future insertions never rename it)

Historical note: before 6.0.0 these were "chunks" concatenated into a
generated script.js by `build-js.mjs` (now a tombstone that exits 1 and
points here). The conversion tooling (`convert-esm-pass[123].mjs`,
`analyze-deps.mjs`) is kept for archaeology; it should never need to run
again.
