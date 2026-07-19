# DEPLOY-6.0.2.md — deploying v6.0.2 to the alpha repo

(v6.0.2 supersedes the never-deployed 6.0.1: same content plus the Firefox
sign-in fix and SETUP.md. If a DEPLOY-6.0.1.md ever made it into the repo,
delete it too.)

**No build needed. No terminal needed. No Firebase console needed.**
This is a files-only deploy: delete one file, upload the rest, verify.

## Why this exists

The zip you received from the 6.0.2 session is the complete, correct site —
but a zip can only show you what *should exist*. It can't show you what
should be *deleted*. If you just upload the zip's contents over the repo,
one dead file will survive on GitHub. This document is the deletion list.

## Step 1 — DELETE from the repo (do this first)

| File | Why |
|---|---|
| `script.js` | The retired 17,297-line generated monolith. Nothing loads it since the ES-modules conversion (6.0.0) — it just duplicates every function in `src/js/` at a stale version. The 6.0.0 session documented it as deleted but never actually deleted it. |

That is the **only** deletion. On GitHub's website: open `script.js` in the
repo → the trash-can icon (top right of the file view) → commit the removal.

**Nothing else gets deleted.** In particular, keep:
- `old.html` (production: the iOS-9 iPad wall clocks)
- `build/build-js.mjs` (deliberate tombstone — fails loudly if the old
  workflow is run by muscle memory)
- `build/analyze-deps.mjs` and `build/convert-esm-pass[123].mjs` (the
  one-time conversion tools, kept for archaeology)

## Step 2 — Upload the 6.0.2 files

Upload everything from the zip, preserving the folder layout. Changed since
the last state of the repo (v5.79.1):

- `index.html` — now 6.0.2 (title, banner, and end-comment all match)
- `src/js/` — the whole folder, 29 files: `main.js`, `state.js`, and
  modules `00` through `25` plus `99-init-and-listeners.js`
- `service-worker.js` — 1.7.1 (also fixes a bug: its internal
  CACHE_VERSION constant had been left at 1.6.0)
- `bell-engine.js` — 1.3.3
- `firebase-config.js` — 1.0.2
- `clock.html` — 1.6.2
- `tailwind.css` — byte-identical to what you have, pushed for hygiene
- `build/` — whole folder (verifiers, retired builder, conversion tools)
- Docs: `CHANGELOG.md`, `README.md`, `HANDOFF.md`, `ROLLOUT.md`,
  `build/README-BUILD.md`, `SETUP.md` (NEW — the guide other schools follow
  to stand up their own instance), and this file

Not changed (fine to skip or re-upload — identical either way):
`old.html`, `dashboard-config.html`, `styles.css`, `firestore.rules`,
`manifest.json`, `CNAME`, `ellisBell.mp3`, icons, everything in `signage/`,
`tests/`.

## Step 3 — Expected final repo tree (root level)

After steps 1–2, the repo root should contain exactly:

```
CHANGELOG.md          bell-engine.js        icon-192.png      old.html
CNAME                 build/                icon-512.png      service-worker.js
DEPLOY-6.0.2.md       clock.html            index.html        signage/
HANDOFF.md            dashboard-config.html manifest.json     src/
README.md             ellisBell.mp3         SETUP.md          styles.css
ROLLOUT.md            firebase-config.js    firestore.rules   tailwind.css
tests/
```

If you see anything at root that is NOT in this list — most importantly
`script.js` — delete it.

`src/js/` should contain exactly 29 files:
`main.js`, `state.js`, `00-header.js`, `01-firebase-imports.js`,
`02-dom-elements.js`, `03-memory-management.js`, `04-app-state-and-bells.js`,
`05-preferences-cloud-sync.js`, `06-warning-effects.js`, `07-kiosk-mode.js`,
`08-theme-and-display.js`, `09-picture-in-picture.js`, `10-clock-engine.js`,
`11-quick-bell-broadcast.js`, `12-quick-bell-queue.js`,
`13-schedule-resolution-and-ringing.js`, `14-render-schedule-list.js`,
`15-firebase-init.js`, `16-schedule-management.js`, `17-share-codes.js`,
`18-bell-crud-and-modals.js`, `19-visual-cues-and-files.js`,
`20-schedule-calendar.js`, `21-emergency-shift.js`, `22-audit-log.js`,
`23-clock-drift.js`, `24-notifications.js`, `25-status-view.js`,
`99-init-and-listeners.js`

## Step 4 — Smoke test (after push, wait ~1 min for GitHub Pages)

1. Hard-refresh the app (Cmd+Shift+R). Header and browser tab both say
   **6.0.2**.
2. Visit `https://<your-site>/script.js` directly. Expect a **404** — this
   is your proof the deletion took.
3. Tap the footer version line → status modal. Expect: the App line reads
   **"App (src/js modules)" 6.0.2** (not "script.js"), bell-engine 1.3.3,
   service-worker.js **1.7.1** (this confirms the CACHE_VERSION bug fix).
4. **Firefox test** (the 6.0.2 headline): in Firefox — try both default
   settings and Enhanced Tracking Protection set to Strict — click Sign In.
   The Google popup opens immediately, you pick the account, the popup
   closes, and you're signed in. No "missing initial state" error.
5. Set a quick bell 1 minute out → it rings.
6. Open a bell edit modal, close it. Toggle a theme. Schedule list renders.
7. DevTools → Console: no red errors on load.
8. DevTools → Application → Service Workers: new worker activated; Cache
   Storage shows `ellis-web-bell-v8` containing `src/js/` entries.
9. DevTools → Network → check "Offline" → reload → app still loads.

If anything fails, nothing here touched data or Firebase — reverting is
just re-uploading the previous files (your prior zip).

## Note on the school (production) repo

Do **not** ship 6.0.2 to the school repo yet. Let it soak on alpha through
at least one full day of your own use (per ROLLOUT.md). When you do ship it
there, this same document applies — including the `script.js` deletion,
which the school repo will also need.
