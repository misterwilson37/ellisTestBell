# ROLLOUT.md

## ✅ v5.79.0 batch: DEPLOYED 2026-07. The checklist below did its job.

## ✅ v5.79.1 delta: DEPLOYED 2026-07 (alpha repo).

## LATEST — v6.3.0 (CUMULATIVE: 6.2.0 modal chrome + 6.3.0 schoolification — deploy this next)

DEPLOY-6.3.0.md is the single source; it covers BOTH releases and has you
delete DEPLOY-6.1.0.md. The 6.2.0 section below is folded in, kept for the
record.

### was: v6.2.0 Stage 6b modal chrome

DEPLOY-6.2.0.md (which also has you delete DEPLOY-6.1.0.md from the repo).

- [ ] Replace: `index.html` (6.2.0), `src/js/main.js`, `src/js/00-header.js`,
      `service-worker.js` (1.9.0)
- [ ] ADD: `src/js/26-modal-chrome.js`, `build/transform-modals.mjs`
- [ ] Docs: `CHANGELOG.md`, `HANDOFF.md`, `DEPLOY-6.2.0.md`, this file
- [ ] tailwind.css UNCHANGED (byte-identical) — no re-upload needed
- [ ] Smoke: header/title say 6.2.0; footer status modal: service-worker
      1.9.0; then the modal click-through in DEPLOY-6.2.0.md
      (every modal must look EXACTLY as before — dark backdrop, white card)

## ✅ Deployed to alpha 2026-07 — v6.1.0 Stage 6a housekeeping
Small files-only delta on top of the deployed 6.0.2. Step-by-step in
DEPLOY-6.1.0.md (which also has you delete DEPLOY-6.0.2.md from the repo).
- [ ] ADD `tone.min.js` + `tone.min.js.LICENSE.txt` (self-hosted Tone 14.8.49)
- [ ] Replace: `index.html` (6.1.0 — script tag now local),
      `service-worker.js` (1.8.0, cache name now derived from version)
- [ ] Replace `build/` folder (new verify-sw.mjs, hardened verify-esm.mjs,
      new npm scripts) and docs: `CHANGELOG.md`, `HANDOFF.md`,
      `DEPLOY-6.1.0.md`, `build/README-BUILD.md`, this file
- [ ] DELETE `DEPLOY-6.0.2.md` from the repo (superseded)
- [ ] Verify after push + hard-refresh:
      - header/title say 6.1.0; footer status modal: service-worker 1.8.0
      - DevTools Network: `tone.min.js` loads from YOUR domain (not cdnjs)
      - a quick bell rings (proves self-hosted Tone actually drives audio)
      - Application > Cache Storage: cache named `ellis-web-bell-1.8.0`;
        old `ellis-web-bell-v8` gone; `tone.min.js` inside
      - offline check: DevTools offline mode + reload -> app loads AND a
        quick bell still rings (the new honest-offline guarantee)

## ✅ Deployed to alpha 2026-07-18 — v6.0.2 (Firefox sign-in fix)
Owner confirmed on alpha: Firefox sign-in works, bell rang, smoke tests
passed. Not yet shipped to the school repo — soak per policy below.
Original checklist follows for reference.

(This release was briefly mislabeled 7.0.0 by a confused session; the
modularization is 6.0.0; 6.0.1 was the correction pass and 6.0.2 adds the
Firefox sign-in fix. Nothing labeled
7.0.0 was ever pushed anywhere.)
Biggest structural change since the v5.72 split, but the deploy is still
just files: **no build, no Firebase console, no rules change, no data
change.** Full step-by-step in DEPLOY-6.0.2.md.
- [ ] DELETE `script.js` from the repo (retired; index.html no longer
      references it — this is the only deletion)
- [ ] Replace: `index.html` (6.0.2), `service-worker.js` (1.7.1, cache v8),
      the whole `src/js/` folder (29 modules incl. new `state.js`, `main.js`),
      `bell-engine.js` (1.3.3) `firebase-config.js` (1.0.2) `clock.html`
      (1.6.2) — comment-only z-bumps except the SW, which also fixes its
      stale CACHE_VERSION constant —
      `tailwind.css` (byte-identical; push for hygiene)
- [ ] Replace `build/` folder (new verifier + retired builder) and docs:
      `CHANGELOG.md`, `README.md`, `HANDOFF.md`, `DEPLOY-6.0.2.md`, `SETUP.md`
      (new: guide for other schools), this file
- [ ] Verify after push + hard-refresh:
      - header/title say 6.0.2; footer version tap lists files; the App line
        reads "App (src/js modules)" and service-worker.js reads 1.7.1
      - FIREFOX (default settings AND with Enhanced Tracking Protection set
        to Strict): click Sign In -> Google popup opens -> account picked ->
        popup closes, signed in. No "missing initial state" error
      - DevTools Network tab shows src/js/*.js modules loading (200s)
      - DevTools Console: no red errors on load
      - a bell rings (set a quick bell 1 min out); schedule list renders;
        open/close a bell edit modal; toggle a theme
      - Application > Service Workers: new SW activates; cache storage shows
        ellis-web-bell-v8 with src/js entries
      - offline check: DevTools offline mode + reload -> app still loads
      - https://<site>/script.js returns 404 (proof the deletion took)
- [ ] School repo: do NOT ship 6.0.2 there until it has soaked on alpha
      through at least one full school day of your own use

## ✅ Prior delta (v5.79.1) — kept for reference
Replace these files in the repo, push, hard-refresh. No build, no Firebase
console, no rules change:
- [ ] `index.html`  (v5.79.1 — version now consistent in all three places)
- [ ] `script.js`   (App v5.79.1 — notifications fix + status/versions modal)
- [ ] `bell-engine.js` (v1.3.1 — version export only)
- [ ] `src/js/` folder (source for the above; keeps repo in sync with build)
- [ ] Docs: `CHANGELOG.md`, `HANDOFF.md`, `README.md`, this file
- [ ] Verify: hard-refresh -> header and title both say 5.79.1; footer shows
      HTML | App | CSS; tapping it lists every file's version; notifications
      toggle reflects reality (On / Off / blocked); dashboard link opens;
      shift row fits; "Add Bell" names your base schedule.

---

# Original checklist — one-time deployment for the v5.70–v5.79 batch

You're deploying four releases at once (security hardening, self-hosted
Tailwind, the script.js split + shared engine, and the day-type calendar).
Everything is backward-compatible: nothing here changes Firestore data
shapes, and the calendar feature is dormant until you create its config doc
via the new admin UI. Work through this top to bottom.

## 1. Repo changes

- [ ] Add a `.gitignore` at the repo root containing:

        build/node_modules/

- [ ] The batch folder (and ellis-bell-v5.79.0-complete.zip) is now the
      COMPLETE site — every file, correct directory layout, including the
      previously-"keep your copy" files (firebase-config.js, ellisBell.mp3,
      icons, CNAME, dashboard-config.html, old.html). You can replace the
      repo contents wholesale with it.
  - ONE exception: the five PNG crests/logo in your live `signage/` folder
    (accomodore, callidus, princeps, vevaios, school_logo) were never
    uploaded to Claude and are NOT in the batch. Keep those exactly where
    they are — the signage pages and the service worker expect them at
    `signage/*.png`.
  - Sanity check after copying: `index.html`, `bell-engine.js`, and
    `tailwind.css` sit side by side in the repo root; `signage/` contains
    four HTML/JS files from the batch plus your five PNGs.
- [ ] Confirm `bell-engine.js` and `tailwind.css` sit in the SAME directory
      as `index.html` (both are loaded root-relative; the app fails loudly
      at load if either 404s — that's intentional).

## 2. Firebase console (one time)

- [ ] Firestore → Rules → replace with the contents of `firestore.rules` →
      Publish. Before publishing, use the Rules Playground to confirm:
  - unauthenticated GET of
    `artifacts/{appId}/users/{anyUid}/personal_schedules/{anyId}` is ALLOWED
    (the old-iPad clocks depend on this)
  - unauthenticated GET of `artifacts/{appId}/users/{anyUid}/following/x`
    is DENIED (this is the tightening)
  - authenticated CREATE of a share code with `ownerId` ≠ your uid is DENIED
  - non-admin authenticated CREATE into any schedule's `edit_log`
    subcollection is DENIED; any authenticated UPDATE/DELETE of an
    `edit_log` entry is DENIED (append-only, even for admins)
- [ ] Confirm your admin uid doc still exists at
      `artifacts/{appId}/public/data/admins/{yourUid}`.
- [ ] (The day-type calendar feature is PARKED — no schedule_calendar doc
      exists or is needed. Ignore references to it in older notes.)

## 3. Push it

**NO BUILD IS REQUIRED TO DEPLOY. Do not open a terminal.** The zip ships
`script.js` and `tailwind.css` PRE-BUILT and verified — the build workflow
in build/README-BUILD.md is only for when you EDIT the app later.

- [ ] Commit and push the repo (GitHub Desktop / web upload / however you
      normally do it).

### Later, before your FIRST future edit (one time, needs Node.js 18+)
- [ ] `cd build && npm install`
- [ ] `npm run build && npm run check:js && npm test && npm run lint` —
      all green confirms your machine can rebuild what you're about to edit.
      From then on, build/README-BUILD.md is the editing workflow.

## 4. Post-deploy smoke test (~10 minutes, do it before a school day)

Main app (your machine first):
- [ ] Hard-refresh (Ctrl/Cmd+Shift+R). Console shows no errors; the
      service worker logs version 1.5.0.
- [ ] Page is fully styled. (If it's unstyled, tailwind.css didn't deploy —
      see the warning banner inside that file.)
- [ ] Schedule loads; countdown runs; ring a quick bell (sound + visual).
- [ ] Rename a period, then rename it back (exercises escaping + admin write).
- [ ] Edit a relative bell and confirm its time resolves correctly.
- [ ] Open Picture-in-Picture; confirm it's styled.
- [ ] Turn OFF wifi, reload: app shell loads styled from cache. Turn wifi back on.

Emergency Schedule Shift (new):
- [ ] Admin Zone -> "Emergency Schedule Shift". Pick one schedule, apply
      +10 minutes. Your own display should re-render with every static bell
      10 minutes later, and relative bells (including personal bells anchored
      to shared ones) shifted with them. (Save failing = your uid isn't in
      the admins collection.)
- [ ] Open a bell's EDIT modal while shifted: it must show the ORIGINAL
      (unshifted) time — that's the data-safety guarantee.
- [ ] A second signed-in browser on the same schedule updates within a
      moment of applying/clearing.
- [ ] Click "Clear All" and confirm times snap back everywhere.
- [ ] Note for real use: shifts expire by themselves at midnight; nobody
      has to remember to clear them.

Notification backup ring (new):
- [ ] Click "🔕 Notifications: Off" in the bell-list controls row, allow the
      browser prompt — a proof-of-life notification appears and the button
      flips to "🔔 Notifications: On".
- [ ] Switch to another tab, ring a quick bell from a second browser (or
      wait for a scheduled one): a system notification appears. With the
      tab visible: no notification (by design — audio + visuals cover it).

Status view (new):
- [ ] Tap the version number in the footer. The status modal lists app
      version 5.79.0, service worker 1.6.0, your sign-in, active schedule,
      shift state, and clock drift. "Copy Report" puts it on the clipboard.

Clock drift warning (new):
- [ ] Normal case: no banner appears (your clock is fine), but the console
      logs a `[Drift] Device clock offset ~Ns` line within ~10 seconds of
      load — that's the measurement working.
- [ ] To see the banner itself (optional): set the device clock manually
      2-3 minutes off, reload, and an amber banner appears at the top
      naming the offset and pointing at Date & Time settings. Dismiss it,
      fix the clock, reload — gone.

Edit audit log (new):
- [ ] Make a small shared-schedule edit (rename a period's bell, or apply
      and clear a test shift). Admin Zone -> "View Edit History" -> pick that
      schedule: your edits appear at the top with your name and timestamps.
- [ ] Older edits predate the log — an empty history for an untouched
      schedule is expected, not a bug.

Displays:
- [ ] Open clock.html (v1.6.0): grid populates, relative bells show correct
      times. Apply a test shift from the main app and wait up to 2 minutes —
      the clock should pick it up without a reload (it now refreshes
      schedule data every 2 minutes; previously it NEVER saw mid-day edits).
- [ ] old.html (iPad clocks): loads and renders; it now auto-refreshes every
      5 minutes and applies shifts. During a real emergency shift, expect up
      to a 5-minute lag on the iPads (or press their Refresh button).
- [ ] Signage TVs (dashboard/dashright/dashclock, upgraded in v5.76.0):
      each page loads with its version stamp visible (v1.6.0 / v1.1.0 /
      v1.1.0 — a stale stamp means the TV cached the old page). Periods and
      countdowns render. If any shared schedule uses relative bells, spot-
      check one period boundary against the main app — TVs used to show
      stale times for these and now must match.
- [ ] While a test emergency shift is active, the signage TVs reflect the
      shifted times within a second or two (they have live listeners — no
      2-minute lag like clock.html).

If anything looks wrong, the fastest rollback is `git revert` of the deploy
commit — every client's network-first service worker picks up the reverted
files on next load.

## 5. After rollout

- [ ] Announce to faculty: nothing changes in their daily workflow. When the
      office announces a schedule shift, it now happens automatically on
      their displays — admins push it from the Admin Zone.
- [ ] Delete this checklist's completed items or keep the file as a record.
- [ ] Day-to-day workflow from here on: `build/README-BUILD.md` (the Two
      Build Rules).
