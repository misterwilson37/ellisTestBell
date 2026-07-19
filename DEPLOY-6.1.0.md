# DEPLOY-6.1.0.md — deploying v6.1.0 to the alpha repo

**No build needed. No terminal needed. No Firebase console needed.**
A small files-only delta on top of the 6.0.2 you deployed on 2026-07-18.

## Step 1 — DELETE from the repo

| File | Why |
|---|---|
| `DEPLOY-6.0.2.md` | Superseded by this file. (One deploy doc per pending release — the old one describes a deploy you already finished.) |

Nothing else. (`script.js` is already gone since your 6.0.2 deploy.)

## Step 2 — ADD to the repo (new files)

| File | What |
|---|---|
| `tone.min.js` | Tone.js 14.8.49 — the exact minified build the app used to pull from cdnjs, now served from your own domain and cached for offline |
| `tone.min.js.LICENSE.txt` | Its MIT license notice (ships alongside; the first line of tone.min.js points at it) |

## Step 3 — REPLACE in the repo

- `index.html` (6.1.0) — the Tone `<script>` tag now points at the local file
- `service-worker.js` (1.8.0) — cache name now derives from the version;
  `tone.min.js` added to the cached assets
- `build/` folder — new `verify-sw.mjs`, hardened `verify-esm.mjs`,
  updated `package.json` (new `check:sw` and `check:all` scripts),
  updated `README-BUILD.md`
- Docs: `CHANGELOG.md`, `HANDOFF.md`, `ROLLOUT.md`, and this file

Everything else is unchanged from your 6.0.2 deploy.

## Step 4 — Smoke test (after push + hard-refresh)

1. Header and tab say **6.1.0**; footer status modal shows
   service-worker.js **1.8.0**.
2. DevTools → Network → reload: `tone.min.js` loads from **your domain**,
   and nothing loads from cdnjs.cloudflare.com anymore.
3. Set a quick bell 1 minute out → it **rings** (that sound is now coming
   from the self-hosted engine).
4. DevTools → Application → Cache Storage: one cache named
   **`ellis-web-bell-1.8.0`** (the old `ellis-web-bell-v8` auto-deleted),
   containing `tone.min.js`.
5. The new trick — honest offline: DevTools → Network → set "Offline" →
   reload. The app loads **and a quick bell still rings** with zero
   network. (Before 6.1.0, offline reloads lost the sound engine.)

In Firefox, the Network tab lives in the same Tools → Browser Tools →
Web Developer Tools panel; the Offline checkbox is in the Network tab's
throttling dropdown (says "No Throttling" by default).

## Note on the school repo

Same policy as before: soak on alpha first. When you eventually ship the
6.x line to the school repo, ship the CURRENT alpha state (this includes
6.0.0–6.1.0 in one go) using the cumulative file list in ROLLOUT.md —
including deleting `script.js` there, which the school repo still has.
