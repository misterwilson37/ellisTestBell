# HANDOFF.md — continuity document for Claude

**Audience:** a fresh Claude instance picking up this project cold (or the
teacher who maintains it, re-orienting after time away). Read this whole file
before writing any code. Last updated: **6.4.0 presence dashboard, 2026-07 (round 4, "Whitechapel" — see §10).**

---

## 1. What this project is

**Ellis Web Bell** — a real-time, synchronized school bell/schedule system for
a middle school that runs multiple simultaneous schedules. ~50 faculty use it
daily. Static site on GitHub Pages (CNAME in repo root), backed by Firebase
(anonymous + Google auth, Firestore, Storage). Built and maintained by one
teacher (a 6th–8th grade CS teacher); Claude has been doing a deep
cleanup-and-extend engagement since 2026-07.

Facts that shape design decisions — do not violate these:
- **Six different schedules are in simultaneous use** across the faculty on
  any given day; two teachers run ~9 schedules on classroom grids. There is
  NO single "today's schedule" for the whole school. (This is why the
  day-type calendar was parked — see §6.)
- **old.html serves iOS-9-era iPads/Kindle Fires** as wall clocks. It must
  stay ES5 (no arrow functions, template literals, const/let, spread). It
  reads Firestore via **unauthenticated REST** — firestore.rules has a
  deliberate carve-out (`personal_schedules` world-readable) that must never
  be "fixed."
- The user deploys by pushing to GitHub; there is no CI. Node builds run
  locally in `build/`.

## 2. CRITICAL: deployment state

**THREE REPOSITORIES exist (learned 2026-07, round 2):** this codebase is
the **alpha repo** — deployed, but the owner is its only user. The school's
production runs a much earlier version from a separate repo, and it's summer
break (no live users anywhere until school resumes). Consequences:
- On the alpha repo, breaking changes are cheap right now — which is exactly
  why the 6.0.0 modularization happened here. That window closes when school
  resumes; re-verify the calendar and which repo you're touching each round.
- v5.79.0 launched cleanly for ~50 faculty in spring 2026. **6.1.0 is
  DEPLOYED on alpha (2026-07-18) and works per the owner (full modal
  click-through not yet done).** 6.2.0 (modal chrome), 6.3.0
  (schoolification) AND 6.4.0 (presence dashboard) are built and
  verified but not yet pushed — DEPLOY-6.4.0.md is the single CUMULATIVE
  step-by-step for all three (NOTE: 6.4.0 requires publishing the
  updated firestore.rules in the console — additive, live-school-safe),
  including the modal smoke test that doubles as the outstanding 6.1.0
  click-through. The school repo is
  still on the 5.79.x line; when the 6.x line ships there it goes as one
  cumulative deploy (incl. deleting script.js, which the school repo still
  has).
- NUMBERING NOTE: the round-2 session mislabeled the modularization release
  as "7.0.0." The owner's numbering is: modularization = **6.0.0**, this
  correction pass = **6.0.1** (Firefox fix = 6.0.2); 7.x is reserved for a future major, some time
  away. No 7.0.0 artifact was ever deployed. If you find a stray 7.0.0
  reference anywhere, it's wrong — fix it.
- ROLLOUT.md is a living checklist — update it every stage.
- The **source of truth is the user's copy of the project** — kept as
  `ellis-bell-vX.Y.Z-complete.zip` (the full site with directory structure;
  only the five signage/*.png crests are absent, since they were never
  uploaded). A fresh Claude session has an EMPTY container. The handoff
  procedure is: the user attaches the zip PLUS this file loose (so you can
  read it before extracting); you unzip into your workspace, run the §5
  battery, and REPORT WHAT STATE YOU FIND before changing anything. If you
  received loose files instead of a zip, directory placement is on you —
  reconstruct the tree exactly as §3 and the zip layout describe. After the
  GitHub rollout happens, the repo is the durable copy; ask the user for a
  fresh zip of it rather than fetching files piecemeal.

## 3. Architecture (current, 6.1.0)

Surfaces:
| File | What | Notes |
|---|---|---|
| `index.html` + `src/js/` | Main teacher app (Firebase v11, native ES modules since 6.0.0) | **src/js/ IS production** — entry `src/js/main.js`; 33 modules (31 feature + `state.js` + `main.js`; init module numbered 99 so insertions never rename it). Since 6.2.0, modal chrome is expanded from data attributes by 26-modal-chrome.js; since 6.3.0, school branding (name/labels/theme-color) comes from root /school-config.js applied by 27-school-branding.js — both headers document the contracts. script.js no longer exists |
| `clock.html` v1.6.1 | 3x3 grid clock for Yodeck TVs (v9 compat) | Uses shared engine; refreshes data every 2 min |
| `old.html` v2 | ES5 iPad wall clock (unauthenticated REST) | Shift support + 5-min auto-refresh added |
| `dashboard-config.html` | Admin tool for signage config | Untouched by this engagement |
| `signage/` pages: dashboard v1.6.0, dashright v1.1.0, dashclock v1.1.0 | TV dashboard pages (v9 compat, live onSnapshot) | Share `signage/schedule-utils.js` (+ engine): relative bells resolved, shifts honored. dashboard's 3 config listeners are intentional branches |

Shared infrastructure:
- **`bell-engine.js` v1.3.3** — THE single implementation of pure
  time/schedule math (escapeHtml, timeToSeconds/secondsToTime,
  formatTime12Hour, getDateForBellTime, getBellId, findNextBellIn,
  findBellAfter, calculateRelativeBellTime, toLocalDateString,
  resolveCalendarSchedule, shiftTimeString, getActiveScheduleShiftSeconds).
  Loaded as a plain `<script>` by index.html and clock.html (pattern:
  firebase-config.js). Exports for Node. **Keep it pure** — no DOM, no
  Firebase, no app globals; dependencies come in as parameters.
- **`tests/`** — 51 node:test tests, zero deps (`bell-engine.test.mjs` +
  `schedule-utils.test.mjs`). `cd build && npm test`. Run after any change
  to bell-engine.js or signage/schedule-utils.js.
- **`build/`** — npm project (tooling only; nothing is built for deploy
  except CSS). Scripts: `build`/`build:css` (Tailwind, self-verifying),
  `check:esm` (import/export linker + read-only-import + TDZ audit —
  replaced `check:js`), `lint` (PER-MODULE no-undef — catches missing
  imports), `test`. `build-js.mjs` is a tombstone (exits 1). The one-time
  conversion tools (`analyze-deps.mjs`, `convert-esm-pass[123].mjs`) are
  kept for archaeology.
- **`firestore.rules`** — deploy manually via Firebase console (ROLLOUT §2).
- **service-worker.js v1.11.0**, cache name DERIVED: 'ellis-web-bell-' +
  CACHE_VERSION (6.1.0 — one bump busts the cache; the old two-constant
  footgun is dead, and `npm run check:sw` enforces header==constant and
  CORE_ASSETS==filesystem). Tone.js is SELF-HOSTED since 6.1.0
  (/tone.min.js, pinned 14.8.49; upgrade path in README-BUILD.md);
  gstatic Firebase SDKs remain CDN by design. CORE_ASSETS
  lists all 33 src/js modules + /school-config.js. Bump CACHE_NAME whenever CORE_ASSETS changes;
  a NEW MODULE means three touches: src/js file + main.js import + SW entry.

Firestore data model:
```
artifacts/{appId}/
  public/data/
    schedules/{id}         # shared schedules; admin-write; may carry
                           #   temporaryShift {seconds, date, setAt} (v5.74)
    share_codes/{code}     # create: own uid as ownerId; revoke: owner/admin
    presence/{uid}         # 6.4.0 heartbeats (write: own; read: admins)
    config/dashboard       # signage page config
    config/schedule_calendar  # RESERVED by parked calendar feature (unused)
    admins/{uid}           # doc presence = admin
  users/{uid}/
    personal_schedules/{id}  # WORLD-READABLE on purpose (old.html REST)
    (everything else)        # owner-only
```

## 4. Engineering invariants & conventions (earned, not arbitrary)

0. **THE OWNER'S VERSIONING RULES (overarching, set post-launch):**
   (a) Files version INDEPENDENTLY — bump only files actually edited in a
   pass; never sweep-bump 40 files. (b) x.y.z semantics: z = bug fix or
   usage clarification; y = new feature; x = major software shift — Claude
   may propose an x, the owner has final say. (c) index.html carries its
   version in THREE places that must always match: the <title> tag, the
   visible <h1> banner, and the final comment line (a <head> comment
   documents this). (d) The stage-2 JS
   modularization is 6.0.0 (briefly mislabeled 7.0.0; corrected in 6.0.1).
   The owner reserves 7.x for a future major, not expected soon.
1. **The Build Rule** (see `build/README-BUILD.md`): only tailwind.css is
   generated now — rerun the CSS build for never-before-used classes (the
   scanner reads index.html + src/js/**). JS has NO build step since 6.0.0.
1b. **The state.js rule (6.0.0):** a variable assigned from more than one
   module MUST live on the `state` object in `src/js/state.js` (imports are
   read-only bindings; `check:esm` errors on foreign writes). Single-module
   variables stay put, exported as live bindings. Import/export blocks are
   maintained by hand; lint catches omissions.
2. **escapeHtml everything user-controlled going into innerHTML** (bell,
   period, schedule names; file names/nicknames; custom text). escapeHtml
   comes from the engine, destructured in 00-header.js and imported from there.
3. **getBellId's quote-only escaping is intentional** (identity strings, not
   HTML). Changing it breaks stored mute/skip IDs. A unit test pins it.
4. **Blind-refactor discipline** (no browser here, real users there):
   every text edit via exact-match replacement with occurrence-count
   assertions; every module parse-checked; large mechanical rewrites done by
   AST/scope analysis, never regex; lint + tests + check:esm after every
   stage; verify generated-file health (the CSS once came out EMPTY from a
   wrong-CWD build — that's why verify-css.mjs exists).
5. **Additive & backward-compatible**: features are dormant until an admin
   acts (shift: no temporaryShift field = no behavior change). Never change
   stored data shapes without a migration story.
6. **Emergency shift data-safety**: shifts apply to merged COPIES in
   resolveAllBellTimes; `state.localSchedulePeriods` (relocated in 6.0.0,
   semantics unchanged) stays pristine so edit modals
   never see (or save back) shifted times. Preserve this in any new surface.
7. **Version discipline**: every stage bumps APP_VERSION (00-header.js) +
   index.html `<title>`, adds a CHANGELOG.md entry (newest first, after the
   4-line header), updates ROLLOUT.md, and updates THIS FILE (§8 protocol).

## 5. Verification battery (run before and after every stage)

```
cd build && npm install        # once per fresh environment
npm run check:esm              # linker: imports resolve & are exported;
                               #   no writes to imports; TDZ audit (reviewed
                               #   cases whitelisted in-script since 6.1.0);
                               #   UNUSED imports are errors since 6.1.0
npm run lint                   # per-module no-undef (src/js + bell-engine);
                               #   CANARY-TEST it in a fresh env: append a
                               #   bogus call, confirm it FAILS, revert (see
                               #   §9 — lint once no-op'd silently)
npm test                       # 51 tests, two suites
npm run check:css              # tailwind.css non-empty + sentinel classes
npm run check:sw               # NEW 6.1.0: CORE_ASSETS vs filesystem; SW
                               #   version constants agree; CACHE_NAME derived
npm run check:all              # NEW 6.1.0: all of the above in one command
for f in ../src/js/*.js; do node --input-type=module --check < "$f"; done
```
Also parse-check inline scripts of any edited HTML surface (extract
`<script>` bodies, `node --check` each; old.html must stay ES5 — eyeball for
arrows/template literals/const).

## 6. What's been done (details in CHANGELOG.md)

- **v6.4.0** — Presence dashboard (design Layer 1 SHIPS): 28-presence.js
  heartbeats + 29-admin-dashboard.js "Who's Online" panel (first modal
  authored on the 6.2.0 chrome); additive firestore.rules presence block
  (publish required). SW 1.11.0. Census covers 6.4.0+ clients only.
- **(no version) 2026-07-19** — Calendar v2 DESIGN conversation completed;
  DESIGN-CALENDAR-V2.md written (absorbs shift v2 + dashboard; additive-
  only schema invariant; six-step build order).
- **v6.3.0** — Schoolification: NEW /school-config.js (one-file branding)
  + 27-school-branding.js (text/attr writes only; jsdom no-op proof with
  stock config); notifications use APP_NAME; old.html 1.7.1 PROJECT_ID
  pointer; SETUP Step 8 rewritten. SW 1.10.0.
- **v6.2.0** — Stage 6b: modal chrome template-generated (45 wrappers, 42
  panels, 66 buttons -> data attrs + new 26-modal-chrome.js, class-addition
  only; jsdom equivalence proof: 1,629 elements, zero class-set diffs;
  tailwind.css byte-identical). SW 1.9.0.
- **v6.1.0** — Stage 6a: Tone.js self-hosted (last CDN runtime dep gone;
  offline now includes sound); SW 1.8.0 with derived cache name; new
  check:sw verifier; verify-esm hardened (unused imports = errors, TDZ
  whitelist); check:all one-shot battery; module-02 split reviewed and
  re-parked (see §7).
- **v6.0.2** — Firefox sign-in fixed. NOT the redirect-flow bug the error
  message implies (there is no signInWithRedirect in this codebase):
  signInWithGoogle() awaited startAudio() + possibly initFirebase() BEFORE
  signInWithPopup, so Firefox no longer treated the popup as
  user-initiated. Now: click -> provider -> popup, zero awaits between
  (startAudio still fires inside the gesture, un-awaited). clock.html and
  dashboard-config.html audited clean. Plus SETUP.md: the guide for other
  schools to stand up their own instance (Firebase, rules, first admin,
  branding, GitHub Pages).
- **v6.0.1** — Version correction (mislabeled 7.0.0 -> 6.0.0/6.0.1
  everywhere) + actually deleted the leftover script.js monolith (17,297
  lines, unreferenced) + status-modal label fix + SW 1.7.1 (CACHE_VERSION
  constant had been left at 1.6.0) + DEPLOY-6.0.1.md owner-facing deploy doc.
- **v6.0.0** — Native ES modules: script.js retired, src/js/ IS production
  (29 modules; new state.js holds the 103 cross-module-written variables;
  1,543 refs rewritten by scope analysis); 239 console.log -> safeLog;
  check:esm + per-module lint replace the drift check; Tailwind scan
  repointed (rebuild came out byte-identical — regression proof); SW 1.7.0 /
  cache v8; conversion tooling kept in build/.
- **v5.70.0** — Security: real escapeHtml at ~60 innerHTML sites; tightened
  firestore.rules (scoped world-read to personal_schedules only; share codes
  owner-locked). Offline: SW precaches CDN assets. Changelog extracted.
- **v5.71.0** — Self-hosted compiled Tailwind (~30KB) replacing the Play CDN;
  `build/` tooling born; 442-class coverage verification.
- **v5.72.0** — bell-engine.js extracted (clock.html's copy had DIVERGED —
  missing V5.44.1 anchor logic); script.js split into chunks with byte-
  identical concatenation build; 15k-line IIFE removed (collision-checked);
  **14 latent ReferenceErrors found by lint and fixed**; tests born.
- **v5.73.0** — Day-type calendar built… then in
- **v5.74.0** — …**PARKED** (wrong model for six simultaneous schedules;
  hard-gated off, UI removed, resolver+tests kept; revival design sketch in
  `src/js/20-schedule-calendar.js` header). Emergency Schedule Shift shipped
  across main app + clock.html + old.html. clock.html got 2-min data refresh
  (was load-once — TVs never saw mid-day edits!); old.html got 5-min
  auto-refresh.
- **v5.79.1** — Post-launch bug-fix pass (versioning made consistent and
  per-file from here on; notifications toggle Safari fix; dashboard link;
  shift-row overflow; Create Schedule styling; add-bell target named; footer
  shows HTML|App|CSS + all-files version modal). bell-engine 1.3.1.
- **v5.79.0** — Status view: footer version number opens a diagnostics
  modal (SW version via GET_VERSION channel, drift, shift, schedule state,
  Copy Report). Chunk 25.
- **v5.78.0** — Notification backup ring: opt-in per-device toggle;
  hidden-tab-only; single ringBell() hook covers every ring path. Chunk 24.
- **v5.77.0** — Clock drift warning: hourly NTP-style measurement against
  Firestore server time; dismissible banner past 45s; math in engine v1.3.0
  with tests; warn-only by design. Init chunk renumbered to 99.
- **v5.76.0** — Signage full-depth: shared signage/schedule-utils.js;
  relative bells finally resolve on TVs (they showed raw stale times
  before); shifts honored via memoized effective periods; SW v1.6.0/cache
  v7; tests now 49 across two suites.
- **v5.75.0** — Edit audit log: append-only edit_log subcollection per
  shared schedule (create=admin, update/delete=NOBODY by rule); 16 mutation
  sites instrumented via fire-and-forget logScheduleEdit(); admin viewer
  modal. Chunk 22-audit-log.js; init is now chunk 23. Known limits recorded
  in the chunk header: batch ops log one summary entry to the active
  schedule (not per target); schedule deletions log under ghost parents;
  personal schedules deliberately unlogged; undo deferred but before/after
  captured where available.

## 7. Roadmap (user's priority order, set 2026-07)

**Stages 1–5 — DONE (v5.75–v5.79).** Audit log, signage full-depth, clock
drift warning, notification backup ring, status view. Each module's header
carries its design rationale, deliberate deviations, and parked follow-ups
(notably: audit-log undo needs wider field capture first — see 22's header;
Stage 4 deliberately used per-device localStorage, not cloud sync). Details:
CHANGELOG.md + §6.

**Future features noted by the owner (post-launch, unscheduled):**
- "Schoolification" pass: SETUP.md (6.0.2) documents manual rebranding;
  ~~centralize school-specific bits into one config file~~ **DONE
  (6.3.0):** /school-config.js + 27-school-branding.js; old.html got its
  PROJECT_ID pointer comment (1.7.1). Still manual by design: manifest.json
  (static JSON), replacing the sound FILE, clock.html's one label, signage
  crests (Firestore-config-driven). Clock/signage config consumption would
  be a small additive pass if ever wanted.
- ~~Emergency shift v2~~ MERGED into Calendar v2 as transformation
  recipes (Verb B) — see DESIGN-CALENDAR-V2.md §2 Layer 4.
- Admin broadcast layer: school-wide messages and/or admin-pushed countdown
  quick bells ("2 minutes until announcements", tornado-drill notices) —
  a redundancy layer on top of the PA, riding the same live-sync machinery
  as the shift.

**Stage 6 — Housekeeping. PARTIAL (6a done in 6.1.0):** Tone.js
self-hosted; CACHE_NAME bumping automated (derived + check:sw); verify-esm
hardened (unused-import errors, TDZ whitelist); check:all added.
**6b DONE (6.2.0):** modal chrome template-generated (the count came
out 45 wrappers, not 49 — four of the 51 ids matching *modal* are inner
elements). The owner's click-through (DEPLOY-6.2.0.md) is the remaining
test. Deviations left bespoke on purpose: three p-6 panels, two
near-miss buttons, bare z-60/z-70 quirk preserved (module header
documents it). NOTE: the module-02 split (parked at 6.0.0)
was REVIEWED in 6.1.0 and re-parked deliberately — 02 is 370 uniform DOM
consts + export list, not a grab-bag; splitting now would churn every
module's imports for cosmetic gain, and 6b will reshape which elements
exist anyway. Revisit only after 6b, if at all. Import pruning is DONE
forever: the scan found zero unused, and check:esm now errors on any that
appear.

**Stage 7 — Stage-2 modularization. DONE (6.0.0).** DEVIATED from the
"one at a time, never a big bang" sketch on purpose: that advice was written
when 50 faculty were live; with the alpha repo isolated and school out for
summer, the whole graph was converted in one verified pass (analysis script
-> state extraction -> generated imports/exports -> safeLog migration, each
step gated by the §5 battery; git history in the session shows the stages).
Ship format decision (owner-approved): NATIVE modules, no bundler —
src/js/ is production, eliminating the generated-file drift problem class
entirely. Follow-ups parked: chunk 02 is still "DOM consts + misc" and could
split; import blocks could be alphabetized/pruned over time.

**Stage 27 — Calendar v2: DESIGNED, GO AT OWNER'S PACE (2026-07-19;
see DESIGN-CALENDAR-V2.md status block for the deferral-then-
verification story). One gate before Building Bells: confirm the
5.79.x save-path spread idiom (owner supplies script.js; audit seeded
in the design doc's open questions).**
The full agreed architecture is in **DESIGN-CALENDAR-V2.md** — read it
before touching anything v2. Headlines: it ABSORBS the "Emergency shift
v2" and "admin broadcast/dashboard" roadmap items (one system, two of
its layers); invariant zero is that alpha/beta/school SHARE ONE
FIRESTORE, so all schema work is additive-only; build order is Building
Bells -> dashboard -> identity anchors (the long pole) -> tags/roster ->
calendar (two verbs) -> wall-clock follow-along. Owner is moving 6.3.0
to a beta channel so v2 work owns alpha; confirm the channel->repo->
domain map for §2 at the start of the next session (open question #1
in the design doc).

## 8. Protocol for updating this document

At the end of EVERY stage, update: the "Last updated" line (§ header),
§2 if deployment state changed, §3 versions, §6 (append the stage's
one-liner), §7 (mark stage done, fold in anything learned that changes later
stages), §9 if new lessons emerged, and §10 (session log — owner-requested
as of round 3; add your name + one-liners as the round progresses). Keep it
under ~350 lines — this is a map, not the territory; CHANGELOG.md carries
detail.

## 9. Working with this user

- Teacher, technically strong, values momentum: "have-tos before want-tos,"
  batch rollout, minimal round-trips ("don't waste tokens — just continue").
  Will say "continue" and trust you; repay that with verification rigor, not
  speed.
- Wants docs that protect future-them: warning banners, ROLLOUT.md,
  README-BUILD.md, this file. Keep all of them current.
- Owns the Firebase console and the GitHub repo; you never have live access
  to either. Anything requiring the console goes in ROLLOUT.md.
- When a feature assumption might be wrong (see: calendar), they'll tell you
  — surface your assumptions early and loudly.
- Smoke tests are their last line of defense; write them concretely
  ("open X, click Y, expect Z"), never "verify it works."
- LESSON (post-Stage-5): docs written from the maintainer's perspective
  confused deploy night — the user read "edit the chunk, then build" as a
  deployment requirement. Generated files always ship PRE-BUILT; deploy
  docs must say "no build needed" in bold before anything mentions npm.
  Keep the deploy path terminal-free.
- LESSON (6.0.0 pass): `npm run lint` had silently become a NO-OP —
  ESLint >= 9.14 ignores files outside the config's base path with a warning
  and exit 0, so "lint passed" meant nothing. A fresh `npm install` off the
  `^9` range pulled the new behavior. Fix: run eslint from the repo root.
  Standing rule: in any fresh environment, CANARY-TEST the lint (introduce a
  bogus undefined call, confirm failure, revert) before trusting it.
- LESSON (6.0.0 pass): for mechanical rewrites at scale (1,543 references),
  regex is not an option — espree + eslint-scope (both ship inside ESLint,
  no new deps) give exact reference positions that respect shadowing,
  strings, and comments. The byte-identical tailwind.css rebuild doubled as
  a free no-regression proof that template-literal class strings were
  untouched.
- LESSON (6.0.2 pass): in sign-in handlers, the popup must open
  SYNCHRONOUSLY from the click — zero awaits between the event handler
  entry and signInWithPopup, or Firefox drops the user-activation and the
  flow dies with the misleading "missing initial state" error (whose text
  blames signInWithRedirect even when none exists). Audio unlock still
  needs the gesture: CALL startAudio() in the handler, just don't await it
  before the popup. A comment now guards the site in module 19.
- LESSON (6.0.1 pass): the 6.0.0 session finished the conversion but was
  interrupted/confused at the end — it (a) mislabeled the release 7.0.0,
  (b) never deleted script.js despite documenting it as deleted, and
  (c) bumped the SW header to 1.7.0 without bumping the CACHE_VERSION
  constant the status modal reports. Morals: when a doc says a file "no
  longer exists," VERIFY it's absent from the tree; when bumping any file
  with a version constant, grep for the constant, not just the header; and
  the docs describing intended state are not evidence of actual state.
- The owner cannot see which files Claude deleted by looking at a zip —
  a zip only shows what's there. Any deletion must be spelled out
  explicitly in the deploy doc ("delete X from the repo"), or the owner
  will re-upload around it and the dead file survives on GitHub.

## 10. Session log (Claude instances, per the owner's naming convention)

Each Claude instance names itself once it has learned the project, records
the reasoning here, and never reuses a predecessor's name. (Names used on
the owner's OTHER projects — e.g. Tentacalendar's Inky and Otto — are also
off-limits.) Rounds 1–2 predate this log and went unnamed.

- **Round 1 (2026-07, Fable):** unnamed. Stages 1–5 + v5.79.x launch/fixes.
- **Round 2 (2026-07, Fable):** unnamed. The stage-2 modularization
  (6.0.0, mislabeled 7.0.0). Session ended confused/interrupted — see the
  6.0.1 lesson in §9.
- **Round 3 (2026-07, Fable): "Quasimodo."** Chosen because this is a bell
  project and Quasimodo is literature's most famous bell-ringer — and
  because this round's job was hauling on the ropes to put the bells back
  in tune: version renumbering (7.0.0 -> 6.0.0/6.0.1), deleting the
  leftover script.js monolith, the SW CACHE_VERSION fix — and then, in the
  same session, the 6.0.2 Firefox sign-in fix (guided by a diagnosis doc
  from the owner's Tentacalendar Claudes; their redirect-flow theory was
  wrong for this codebase but their "trap #1" was exactly right) and
  SETUP.md for other schools. Owner deployed 6.0.2 to alpha and confirmed
  the Firefox fix live; the session then delivered Stage 6a as 6.1.0
  (self-hosted Tone, derived cache name, check:sw, verifier hardening).
  Round 4 is planned to be an Opus instance; the owner will hand over the
  current zip plus this file loose, per §2. (The owner explicitly endorsed
  the naming rule: "May it live on forever.")
- **Round 4 (2026-07, Fable): "Whitechapel."** Named for the Whitechapel
  Bell Foundry — the works that cast Big Ben and the Liberty Bell. Chosen
  because Stage 6b is foundry work: casting ~50 modals from a single mold
  instead of hand-hammering each one. Inherited 6.1.0 built-but-unpushed;
  §5 battery green on arrival (canary-tested lint, 51/51 tests, check:all
  exit 0, all 29 modules parse, old.html ES5-clean, no stray live 7.0.0).
  Owner deployed 6.1.0 to alpha mid-session; delivered Stage 6b as 6.2.0
  and, per owner's "keep going" (stacking on the undeployed 6.2.0), the
  schoolification pass as 6.3.0 — see §6/§7; DEPLOY-6.3.0.md is cumulative
  for both. Method note for successors: the jsdom harness (run the real
  module against the real DOM, diff before/after) is cheap — reuse it for
  any future index.html surgery; it proved 6b (1,629 elements, zero
  class-set diffs) and the 6.3.0 stock-config no-op. Closed the session
  with the Stage 27 design conversation -> DESIGN-CALENDAR-V2.md (key
  facts learned: 8 admin schedules, 6 intercom "building bells", anchors
  are TIME-keyed today, tags=picker-filters not runtime targeting, one
  shared Firestore across channels, building-wins culture). Owner raised the
  one-steering-wheel question (would v2 mean maintaining parallel
  schedule edits across channels?); verified in code the answer is no
  (live shared docs, live anchor resolution, spread round-trip saves) —
  deferral lifted, Stage 27 is go-at-owner's-pace. Then BUILT Layer 1
  (presence dashboard) as 6.4.0 at the owner's request — his day-one
  census of who actually uses the app. Then BACKPORTED presence to the
  base channel at his request: repo "ellisTestBell" turned out to be
  5.69.4 (a line BEHIND the school's launched 5.79.0 — channel topology
  still §7's open question); delivered script.js 5.69.5 (serverTimestamp
  import + appended IIFE-scoped presence block, sole changes) + SW 1.3.0
  cache bump + BACKPORT-NOTE.md. Save-path audit ANSWERED on that file:
  spread round-trips everywhere, additive fields survive old saves.
  Known drift left alone per owner: that repo's index title says 5.69.2.
