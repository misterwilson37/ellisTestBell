# Ellis Web Bell

A real-time, synchronized school bell schedule and timer system. Built for a school running three rotating schedules; used daily by ~50 faculty. Hosted on GitHub Pages (see CNAME), backed by Firebase (Auth, Firestore, Storage).

## Surfaces

| File | What it is | Firebase SDK | Notes |
|---|---|---|---|
| `index.html` + `src/js/` | The main teacher-facing app: countdown, schedule editing, quick bells, queues, themes, PiP, broadcast, share codes | v11 modular (ES modules) | Native ES modules since 6.0.0 — src/js/ IS production, entry point `src/js/main.js` |
| `clock.html` | Multi-schedule grid clock (up to 3x3) for Yodeck TV kiosks | v9 compat | Relative-bell math comes from the shared `bell-engine.js` as of v1.5.0 (its old local copy had silently diverged) |
| `old.html` | Legacy self-contained clock for old iPads / Kindle Fires (iOS 9-era browsers) | None — raw Firestore REST API, **unauthenticated** | ES5 only, no modules. This is why `personal_schedules` must stay publicly readable in firestore.rules |
| `dashboard-config.html` | Admin tool for the signage dashboard config | v9 compat | Intentionally not cached by the service worker |
| `signage/` (not in this repo snapshot) | dashboard.html, dashclock.html, dashright.html + crest PNGs for TVs | — | Referenced by service-worker CORE_ASSETS |

## ⚠️ The Build Rule (the one people forget)

As of **6.0.0** the app is native ES modules: `index.html` loads
`src/js/main.js` and the browser resolves the import graph. **`src/js/ IS
production — there is no `script.js` and no JS build step.** Edit a module,
run the verification battery (`cd build && npm run check:esm && npm run lint
&& npm test`), commit, push.

One file remains **generated** — never edit it directly:

1. **`tailwind.css`** is compiled from the Tailwind classes found in
   `index.html` + `src/js/*.js`. Using a never-before-used class requires
   `cd build && npm run build:css` or the new element renders unstyled.

Full workflow, symptoms, and gotchas: **`build/README-BUILD.md`**. Project continuity (roadmap, invariants, session-handoff context): **`HANDOFF.md`**.
After touching `bell-engine.js`, run `cd build && npm test`.

## Shared infrastructure

- `bell-engine.js` — the SINGLE implementation of the pure time/schedule math (formatting, time↔seconds, next-bell lookup, relative-bell resolution), shared by the main app AND clock.html via a plain `<script>` tag. Hand-edited, covered by `tests/bell-engine.test.mjs`. Keep it pure: no DOM, no Firebase, no app globals.
- `src/js/` — the 29 production ES modules (27 feature modules + `state.js` shared mutable state + `main.js` entry point). The filenames say what lives where; `build/README-BUILD.md` has the ownership map. Adding a module = also add it to `service-worker.js` CORE_ASSETS + `src/js/main.js`.
- `tests/` — unit tests for the engine. Run with `cd build && npm test` (or `node --test tests/bell-engine.test.mjs`). No packages needed.
- `firebase-config.js` — the ONLY place the Firebase config lives. Every surface loads it before its own logic.
- `firestore.rules` — security rules. Read the comments before changing; `old.html`'s unauthenticated REST reads and the share-code feature both depend on specific carve-outs.
- `service-worker.js` — offline caching for the main app, clock, and signage. Bump `CACHE_NAME` whenever `CORE_ASSETS` changes.
- `tailwind.css` — COMPILED file, do not hand-edit. Regenerate via `build/` (see `build/README-BUILD.md`) whenever a never-before-used Tailwind class is added to index.html or any src/js/ module.
- `styles.css` — non-Tailwind styles: warning animations, admin/kiosk/simplified mode visibility, modal z-index map.
- `CHANGELOG.md` — release history for the main app. Add new version notes there, not in module headers.

## Data model (Firestore)

```
artifacts/{appId}/
  public/data/
    schedules/{scheduleId}      # shared schedules (admin-writable)
    share_codes/{code}          # 6-char codes -> { ownerId, scheduleId, ... }
    config/{configId}           # signage/dashboard config (admin-writable)
    admins/{uid}                # presence of doc = admin
  users/{uid}/
    personal_schedules/{id}     # publicly READABLE (old.html + following)
    following/{...}             # owner-only
    quick_bell_broadcast/...    # owner-only
```

`config/schedule_calendar` was reserved for the (parked) day-type calendar. Shared schedule docs may carry a `temporaryShift {seconds, date, setAt}` field — the v5.74.0 emergency shift, self-expiring by date. Admin status = a doc with your uid exists in `admins/`. The in-app "Toggle Admin" button only changes what the UI shows; Firestore rules are the actual enforcement.

## Security invariants (do not regress)

1. Any user-controlled string interpolated into an `innerHTML` template goes through `escapeHtml()` (from `bell-engine.js`, destructured in `src/js/00-header.js` and imported from there). This includes bell/period/schedule names, custom icon text, and uploaded file names/nicknames. `data-*` attributes written through `escapeHtml` read back as the raw value via `.dataset`, so lookups still match.
2. `getBellId()` (in `bell-engine.js`) builds identity strings, not HTML — its quote-replace is intentional and must not be "fixed" to escapeHtml (it would change stored bell IDs). A unit test pins this behavior.
3. Shared-schedule and config writes are admin-gated in firestore.rules, not in the client.

## Cleanup roadmap (agreed order)

1. ~~Changelog extraction, escapeHtml, service-worker offline fix, rules tightening~~ (done, v5.70.0)
2. ~~Self-host a compiled Tailwind CSS~~ (done, v5.71.0 — see `build/README-BUILD.md` for the rebuild workflow; Tone.js self-hosting still open)
3. ~~Split script.js; extract shared `bell-engine.js` + unit tests~~ (done, v5.72.0 — script.js is now built from 21 chunks in `src/js/`; the engine is shared with clock.html and covered by 30 tests; the 15,000-line v4.05 IIFE is gone; six latent ReferenceErrors found by lint were fixed)
4. ~~Stage-2 modularization~~ (done, **6.0.0** — src/js/ converted to 29 native ES modules; script.js retired, no JS build step; 103 cross-module-written variables moved to `src/js/state.js`; 239 raw `console.log` calls migrated to `safeLog`; per-module lint + `npm run check:esm` linker/TDZ verification replace the old drift check)
5. Day-type calendar — PARKED (v5.74.0). One global schedule/day is the wrong model for a school running six schedules at once; the revival needs teacher groups (grade/role) with per-group day-type mapping. Design sketch in `src/js/20-schedule-calendar.js`; the pure resolver + tests are kept.
6. ~~Emergency schedule shift~~ (done, v5.74.0 — admin shifts a base schedule ±minutes for today only; ripples through all relative bells everywhere; self-expires at midnight; all three display surfaces apply it)
7. ~~Edit audit log~~ (done, v5.75.0 — append-only by rule; admin viewer; 16 instrumented sites)
8. ~~Signage pages full-depth fix~~ (done, v5.76.0 — shared schedule-utils.js; relative bells finally resolve on TVs; shifts honored; 10 tests)
9. ~~Clock drift warning~~ (done, v5.77.0 — hourly NTP-style measurement; dismissible banner over 45s; warn-only by design)
10. ~~Notification backup ring~~ (done, v5.78.0 — opt-in, per-device, hidden-tab-only, one hook covers all ring paths)
11. ~~Status/health view~~ (done, v5.79.0 — tap the footer version number; Copy Report for support)
12. Remaining: housekeeping (Tone.js self-host, modal templating, CACHE_NAME automation); per-teacher/group calendar last
