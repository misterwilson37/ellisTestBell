# HANDOFF.md — continuity document for Claude

**Audience:** a fresh Claude instance picking up this project cold (or the
teacher who maintains it, re-orienting after time away). Read this whole file
before writing any code. Last updated: **6.11.0 (anchor-strip fix, dedup, firstSeen, dormant Verb B engine), 2026-07 (round 6, "Grandsire II" — see §10). DEPLOY STATE: nothing past 6.4.0 is live; DEPLOY-6.11.0.md is the cumulative 6.5→6.11 deploy and STILL requires the single firestore.rules publish introduced by 6.9.0.**

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
  click-through not yet done).** **DEPLOYED 2026-07-19 (owner confirmed): 6.4.0 is live on BOTH alpha
  and beta; the building channel (bells domain) runs the 5.69.5
  presence backport.** DEPLOY-6.4.0.md documented the batch (verify the
  firestore.rules presence block was published — dashboard rows
  appearing IS that verification),
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
- **UNDEPLOYED STACK (as of round 6, 6.11.0):** the last thing actually
  LIVE is 6.4.0. Releases **6.5.0 through 6.11.0 are all built and
  battery-verified but NOT deployed** — SEVEN releases stacked. The owner
  ran out of a time-boxed session (Fable access) mid-smoke-test, so the
  stack grew instead of shipping incrementally. DEPLOY-6.11.0.md is the
  single CUMULATIVE deploy doc for the whole 6.5→6.11 batch and includes
  the ONE required firestore.rules publish (introduced by 6.9.0's roster
  path — Console → Firestore → Rules → paste shipped firestore.rules →
  Publish; that one publish covers the whole batch). 6.11.0 itself adds
  NO new modules and NO rules change beyond that.
- **DEPLOY LESSON (round 6, learned the hard way on 6.10.0 alpha):** a
  PARTIAL push produces a MIXED tree — new files next to stale ones — and
  because this is an ES-module graph, ONE stale module kills the whole app
  (SyntaxError: "module X doesn't provide an export named Y"; the app dies
  before sign-in even wires). Full detail + diagnosis recipe is in §9. The
  practical rule for the 6.5→6.11 deploy: replace the ENTIRE src/js/ tree
  plus the changed root files in ONE commit, then cache-busted spot-check
  (append ?v=N to a file URL to punch through GitHub Pages' ~10-min CDN
  cache) BEFORE running the smoke tests.

## 3. Architecture (current, 6.11.0)

Surfaces:
| File | What | Notes |
|---|---|---|
| `index.html` + `src/js/` | Main teacher app (Firebase v11, native ES modules since 6.0.0) | **src/js/ IS production** — entry `src/js/main.js`; 38 modules (36 feature + `state.js` + `main.js`; init module numbered 99 so insertions never rename it). Since 6.2.0, modal chrome is expanded from data attributes by 26-modal-chrome.js; since 6.3.0, school branding (name/labels/theme-color) comes from root /school-config.js applied by 27-school-branding.js — both headers document the contracts; since 6.5.0, Building Bells (30-building-bells.js) makes the six intercom moments first-class anchors — see §7. script.js no longer exists |
| `clock.html` v1.7.0 | 3x3 grid clock for Yodeck TVs (v9 compat) | Uses shared engine; refreshes data every 2 min; since 1.7.0 reports presence (anonymous sessions only — see file header) |
| `old.html` v2 | ES5 iPad wall clock (unauthenticated REST) | Shift support + 5-min auto-refresh added |
| `dashboard-config.html` | Admin tool for signage config | Untouched by this engagement |
| `signage/` pages: dashboard v1.6.0, dashright v1.1.0, dashclock v1.1.0 | TV dashboard pages (v9 compat, live onSnapshot) | Share `signage/schedule-utils.js` (+ engine): relative bells resolved, shifts honored. dashboard's 3 config listeners are intentional branches |

Shared infrastructure:
- **`bell-engine.js` v1.7.0** — THE single implementation of pure
  time/schedule math (escapeHtml, timeToSeconds/secondsToTime,
  formatTime12Hour, getDateForBellTime, getBellId, findNextBellIn,
  findBellAfter, calculateRelativeBellTime, toLocalDateString,
  resolveCalendarSchedule, shiftTimeString, getActiveScheduleShiftSeconds,
  applyBuildingBellTimeToPeriods).
  Loaded as a plain `<script>` by index.html and clock.html (pattern:
  firebase-config.js). Exports for Node. **Keep it pure** — no DOM, no
  Firebase, no app globals; dependencies come in as parameters.
- **`tests/`** — 60 node:test tests, zero deps (`bell-engine.test.mjs` +
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
- **service-worker.js v1.16.0**, cache name DERIVED: 'ellis-web-bell-' +
  CACHE_VERSION (6.1.0 — one bump busts the cache; the old two-constant
  footgun is dead, and `npm run check:sw` enforces header==constant and
  CORE_ASSETS==filesystem). Tone.js is SELF-HOSTED since 6.1.0
  (/tone.min.js, pinned 14.8.49; upgrade path in README-BUILD.md);
  gstatic Firebase SDKs remain CDN by design. CORE_ASSETS
  lists all 38 src/js modules + /school-config.js. Bump CACHE_NAME whenever CORE_ASSETS changes;
  a NEW MODULE means three touches: src/js file + main.js import + SW entry.

Firestore data model:
```
artifacts/{appId}/
  public/data/
    schedules/{id}         # shared schedules; admin-write; may carry
                           #   temporaryShift {seconds, date, setAt} (v5.74);
                           #   periods carry optional periodId since 6.6.0;
                           #   bells carry optional buildingBellId since 6.5.0
    share_codes/{code}     # create: own uid as ownerId; revoke: owner/admin
    presence/{uid}         # 6.4.0 heartbeats (write: own; read: admins)
    config/dashboard       # signage page config
    config/building_bells  # 6.5.0 Building Bells (covered by config/{id} rules)
    config/schedule_calendar # 6.10.0 v2: days[date].entries scoped by uid
                           #   (v1 exceptions/weekdayDefaults still honored)
    roster/{uid}           # 6.9.0 tags+capabilities; read=authed, self-write
                           #   cannot touch capabilities (rules-enforced)
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
npm test                       # 60 tests, two suites
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

- **v6.11.0** — Anchor-strip fix + ride-alongs; Verb B engine (DORMANT):
  engine 1.8.0 adds resolveCalendarTransforms + applyRecipeToPeriods
  ('shift' and 'shorten' archetypes, immutable, shared-static-only,
  65/65 tests) but NOTHING CALLS THEM YET — same dormant-ship pattern
  as 6.10.0's resolver. Fixes: (a) ANCHOR-STRIP — admin all-users time
  edits silently unanchored bells because the edit modal's anchor
  select was filled from the DOM-reconstructed bell (no buildingBellId);
  now resolved from state.localSchedulePeriods by bellId. (b)
  designation dedup — per-person last-write-wins (module 34). Ride-
  alongs: firstSeen presence stamp + dashboard column (28/29), building-
  bell "0 anchored" amber nudge (30), edit-bell lock-note redesign
  (below input, locked/admin states, names the anchor for everyone;
  index + 16/30). SW 1.17.0 — no new modules, cache bump only. NO rules
  change. Owner TODO after deploy: re-run "Anchor matching…" on any bell
  whose anchor count dropped since 6.5.0 (idempotent).
- **v6.10.0** — The Calendar Wakes (Layer 4 Verb A): engine 1.7.0
  scoped per-user resolution (v1 fallback intact); module 20 REVIVED
  (enabled flag retired, deviation bannered w/ Follow, I4 foreign-
  anchor count in banner); new 34-day-designation.js — the I2 day-of
  modal and the Layer 3 filter-picker's first real use; config/
  schedule_calendar v2 (no rules change). Verb B + prefill grid are
  the remaining Layer 4 slices. SW 1.16.0 (38 modules).
- **v6.9.0** — Roster & Tags (Layer 3): roster/{uid} docs {displayName,
  tags, capabilities}; RULES CHANGE (self-writes mechanically cannot
  touch capabilities); 33-roster.js with My Tags (header, self-serve)
  and admin Roster modal (amber capability chips, seed-from-presence
  excluding clock surfaces); the tags-are-filters-only invariant is in
  rules comments, module header, and UI copy. SW 1.15.0 (37 modules);
  CSS rebuilt for chips.
- **v6.8.0** — The Shape Itself (Layer 2 slice 3): engine 1.6.0
  extracts findPeriodEdgeAnchorBell (V5.44.1 heuristic, both edge
  vocabularies, tested; 16's drifted inline copy now routes through it
  — its only-wrong-edge-anchor bug died in the merge); baseScheduleId
  recorded at all four anchor stamp sites (shared-origin parents only);
  design shape fully mapped to stored fields, edge deliberately NOT
  dual-written (parentAnchorType IS the edge). SW unchanged (network-
  first verified; CORE_ASSETS unchanged). 58/58 tests.
- **v6.7.0** — Personal Anchor Migration (Layer 2 slice 2): new
  32-personal-anchor-migration.js — client-side (personal docs are
  owner-only writable), silent-stamps unambiguous name-keyed anchors on
  the user's own schedule, amber banner + review modal for duplicated
  period names (never guessed); multi-add relative site now stamps
  parentPeriodId via data-period-id on the checkboxes (6.6.0 IOU paid);
  remaining creation sites in 19 (personal custom periods + both import
  converter sites) stamp ids at birth. SW 1.14.0 (36 modules).
- **v6.6.0** — Period Identity (Layer 2 slice 1): optional periodId on
  shared periods (stamped at birth + admin backfill in new
  31-period-identity.js; ambiguous duplicate names skipped for the
  future review modal); engine 1.5.0 resolves period anchors
  IDENTITY-FIRST with name fallback (renames stop orphaning reminder
  bells); single-relative creation stamps parentPeriodId; SW 1.13.0
  (35 modules). Personal-anchor migration = next slice (owner-only
  writes force it client-side; needs the review modal).
- **v6.5.0** — Building Bells (design build-order step 1 SHIPS) +
  clock.html presence: config/building_bells doc (NO rules change —
  config/{configId} already covers it); 30-building-bells.js manager
  (add/rename/retime, batch propagation onto anchored bells with
  per-schedule confirm + audit entries, exact-time "Anchor matching"
  assist, delete strips anchors); optional buildingBellId on shared
  bells (edit-modal anchor select; updatePeriodsOnEdit now PRESERVES
  the field — it swapped bells wholesale and would have stripped it);
  engine 1.4.0 pure propagation fn + 3 tests (54 total); clock.html
  1.7.0 anonymous-only heartbeats (surface 'clock'); SW 1.12.0 (34
  modules); tailwind rebuilt (hover:underline); TDZ whitelist +2
  reviewed entries. Fuzzy 59s linked-edit modal REMAINS for unanchored
  bells (I0).
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
verification story). ~~One gate before Building Bells~~ GATE CLEARED — save-path audit
ANSWERED on the real base-channel file; see the design doc.**

**CHANNEL TOPOLOGY (owner, 2026-07-19, answers the old §2 question):**
three channels, one Firestore. BUILDING = bells domain, runs the
5.69.5 backport (repo "ellisTestBell"); BETA = CDC teacher's channel,
now 6.4.0; ALPHA = owner's dev channel, 6.4.0, where all new work
happens "for as long as it makes sense." Promotion flow: alpha -> beta
-> building. The dashboard's version column is the live census of who
runs which channel.
The full agreed architecture is in **DESIGN-CALENDAR-V2.md** — read it
before touching anything v2. Headlines: it ABSORBS the "Emergency shift
v2" and "admin broadcast/dashboard" roadmap items (one system, two of
its layers); invariant zero is that alpha/beta/school SHARE ONE
FIRESTORE, so all schema work is additive-only; build order is ~~Building
Bells~~ (DONE 6.5.0) -> dashboard -> identity anchors (the long pole;
SLICES 1+2+3 DONE 6.6.0-6.8.0 — periodId foundation; personal-anchor
migration w/ review modal; full identity shape stored + the
findPeriodEdgeAnchorBell primitive extracted. Remaining Layer 2 work:
alternate-base transfer w/ I4 drop-notice, which REQUIRES Layer 4's
designation mechanism to exist — it is the natural first bite OF
Layer 4, not a standalone slice) ->
tags/roster -> calendar (two verbs) -> wall-clock follow-along; the
clock.html presence open question is CLOSED (1.7.0, anonymous-only). Owner is moving 6.3.0
to a beta channel so v2 work owns alpha; confirm the channel->repo->
domain map for §2 at the start of the next session (open question #1
in the design doc).

**LAYER 4 PROGRESS (Verbs = the calendar's two actions):**
- **Verb A (base designation) — SHIPPED 6.10.0.** "This scope of people
  runs schedule X on date D." Module 34 + engine resolveCalendarSchedule.
- **Verb B (transformation recipes) — ENGINE DONE 6.11.0, DORMANT; WIRING
  IS THE NEXT SLICE (6.12.0).** bell-engine 1.8.0 ships
  resolveCalendarTransforms + applyRecipeToPeriods ('shift' and 'shorten'
  archetypes), fully tested (65/65), but NO CALLER exists yet. To wire it,
  a successor must: (1) call resolveCalendarTransforms in the resolution
  path and compose recipes onto the designated schedule's periods AFTER
  resolveCalendarSchedule picks the base — the single consumer today is
  applyCalendarSchedule in module 20, but transforms apply to PERIODS, so
  the natural application point is where localSchedulePeriods is finalized
  in module 16's schedule listener (three assignment sites: ~line 166 base
  listener, ~372, ~600 personal/merged), MIRRORING how the emergency shift
  (activeSharedScheduleShift) already rides those paths; (2) build the
  transform-authoring UI in module 34 (the "Designate Schedules" modal
  grows a recipe builder — this is the bulk of the work); (3) extend the
  deviation banner (I1) to understand transforms. THIS IS A FULL RELEASE
  of its own — do not underestimate the UI. The engine's contract:
  recipes are pure period->period transforms, shared-static bells only,
  relatives re-derive downstream (Layer 2 overlays survive automatically).
- **Prefill grid + generators ("the grid plans the weeks") — NOT STARTED.**
  Bourdon's riddle's remaining arc after Verb B wiring.
- **Wall-clock follow-along ("dumbest clocks read the calendar without
  learning to speak") — NOT STARTED.** old.html reads designations via
  unauthenticated REST, read-only, stays ES5.

## 7.5 External deadlines & environment risks (dated; not feature work)

- **gsutil deprecation — March 2027 (logged round 6, 2026-07).** Google
  is dropping `gsutil` from the default gcloud CLI bundle after March
  2027; they push `gcloud storage` as the replacement (or standalone
  `pip install gsutil`). **Assessed impact on THIS project: effectively
  none to the deploy flow** — the owner deploys entirely through the
  Google Cloud Console *browser* interface (school-managed Mac, no
  admin, no CLI, no CI/CD; see §2 and §9). A command-line tooling change
  cannot break a browser-based deploy. HOWEVER, two facts keep this from
  being pure noise: (1) the notice names project **`ellisbell-c185c`**,
  and firebase-config.js confirms that is the bell app's CURRENT live
  projectId + storageBucket. This is the ORIGINAL project, correctly
  named for the bells — Spot On! was later SPLIT OFF it into
  spot-on-games (owner tacked Spot On! onto the existing bell project,
  then separated it as Spot On! grew; the bells stayed on their home
  project by design, since the name and function still fit). So the
  named project is live and its Storage bucket holds the custom
  bell-sound files (module 04's getBytes/ref(storage, soundName) path). (2) The
  ONLY way this deprecation bites is if some future instance scripts a
  Storage operation from a command line (bulk sound upload, a backup
  script). If that ever happens: use `gcloud storage` verbs, or install
  standalone gsutil — do NOT assume the bundled gsutil exists after
  3/2027. WHEN TO ACT: only if/when someone introduces CLI Storage
  tooling. No calendar scramble; this is a "know it, don't chase it"
  item. Nothing to do today.

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
- LESSON (6.10.0 deploy night, round 6): a PARTIAL push produces a
  MIXED tree, and one stale module kills the whole ES-module graph
  (SyntaxError: "module X doesn't provide an export named Y" — the
  app dies before sign-in even wires). The tell: the error NAMES the
  stale module (X is old; the importer is new). Diagnose by fetching
  the named file and searching for the missing export — don't trust
  eyeball version comparisons. Contributing traps: GitHub's web
  uploader caps at ~100 files per upload (whole-tree drags can exceed
  it), and GitHub Pages' CDN caches ~10 minutes, so a post-push spot
  check can show PRE-push files ("it didn't reset") — verify with a
  junk query string (?check=N). A stale-SW error citing a line number
  that doesn't exist in the shipped SW is the same mixed-tree story
  from the service worker's side. Recovery: re-upload all of src/js/
  plus the changed root files in ONE commit (< 100 files), then
  cache-busted spot check before smoke testing.

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
  SESSION CLOSED with owner deploying everything: 6.4.0 live on alpha +
  beta, 5.69.5 live on the building. Round 4 shipped 6.2.0 -> 6.4.0,
  the v2 design, and the backport in one night. Successor: read
  DESIGN-CALENDAR-V2.md before v2 work; natural next bites are clock.html
  presence (small) or Building Bells (medium; audit already answered);
  pick a name — Quasimodo, Inky, Otto, Whitechapel are taken.
- **Round 5 (2026-07, Fable): "Bourdon."** Named for the bourdon — the
  deepest, foundational bell of a carillon, the one every other bell is
  tuned against. Chosen because this round's likely work is Building
  Bells: promoting the six intercom bells to the first-class anchors the
  rest of v2 tunes itself to. Arrived via Whitechapel's riddle ("cast
  four bells in one night; the molds are in §7"); ran the §5 battery on
  arrival: canary-tested lint (bogus call correctly failed, reverted),
  51/51 tests, check:css/check:sw OK, all 33 modules parse, old.html
  ES5-clean (one const/let hit is the comment "let page load"), no stray
  live 7.0.0 (only documented-history comments), index.html triple
  version agrees at 6.4.0. Yellow flag inherited from 6.3.0 (two
  check:esm TDZ warnings at 27-school-branding.js:22/24): reviewed —
  00-header is a leaf module, no cycle possible — and WHITELISTED with
  reasoning in build/verify-esm.mjs. Then BUILT 6.5.0 on "follow your
  heart": Building Bells (design step 1) + clock.html 1.7.0 presence,
  full details in §6/CHANGELOG. Key traps found and defused, worth
  re-reading if touching bells: (a) updatePeriodsOnEdit replaced bells
  wholesale — any edit would have silently stripped buildingBellId (the
  I0 field-stripping failure IN OUR OWN CLIENT); it now preserves the
  field unless an edit explicitly sets (string) or clears (null) it.
  (b) Anchor semantics: anchored time == building bell time, no offsets
  at this layer; picking an anchor in the edit modal snaps the time
  field; saving with a divergent time DETACHES with a notice (silently
  keeping it would let the next propagation snap the bell back).
  (c) Propagation writes CONCRETE times + regenerated legacy bells
  arrays, so every old surface follows with zero new code. (d) clock
  presence is anonymous-sessions-only — a signed-in browser already
  reports via the app under the same uid; both writing would flap the
  census row. Battery green at close (canary'd lint, 54/54, check:all,
  34 modules parse, clock inline script parse-checked, old.html
  untouched — md5 b8dd5f5a4c8fed0765c982a9ccc43204). DEPLOY-6.5.0.md
  written (no rules publish needed this time). NOT deployed at time of
  writing — owner deploys. Successor: verify deployment state with the
  owner first; natural next bite is the v2 dashboard (design doc build
  order), and DESIGN-CALENDAR-V2.md remains required reading; names
  taken: Quasimodo, Inky, Otto, Whitechapel, Bourdon.
  SAME SESSION, owner said "roll on": shipped 6.6.0 Period Identity
  (Layer 2 slice 1 — see §6/CHANGELOG). Key facts for the successor:
  periods had NO identity before this (name-string anchor matching —
  renames orphaned reminder bells); periodId is additive and never
  regenerated; the engine resolves identity-first/name-fallback; the
  backfill is idempotent and skips ambiguous duplicate names on
  purpose. NEXT SLICE of Layer 2 (in order): (1) personal-anchor
  migration — MUST run client-side per user (personal_schedules are
  owner-only writable), silent-stamp unambiguous names, review modal
  for duplicates; ALSO stamp the multi-add relative site (18, holds
  names only — needs the merged-view period lookup); (2) then the full
  identity shape {baseScheduleId, periodId, edge, offsetSeconds} and
  alternate-base transfer per the design doc. 6.5.0 AND 6.6.0 are both
  UNDEPLOYED at close (DEPLOY-6.6.0.md is cumulative); verify
  deployment state with the owner before assuming anything.
  STILL SAME SESSION ("keep on keepin' on"): shipped 6.7.0 Personal
  Anchor Migration (Layer 2 slice 2 — see §6/CHANGELOG). Facts for the
  successor: (a) module 32 is deliberately write-shy — pure local
  classification every 30s, ONE write attempt per personal schedule per
  session, only when something needs stamping; (b) ambiguity = the
  merged view (state.calculatedPeriodsList, which PRESERVES periodId —
  verified, 14 spreads the period) contains 2+ id-bearing periods with
  the anchor's name; zero-candidate anchors wait for the shared
  backfill and are re-checked next beat; (c) the import converter
  (module 19) CANNOT preserve incoming periodIds (name-keyed map
  rebuild) — fresh ids there is correct, not a bug; (d) every period
  creation site in the codebase now stamps ids (16, 18, 19x3) — grep
  'isEnabled: true' minus 14's display scaffolding to verify. Layer 2
  slice 3 (the real long-pole meat): the full identity shape
  {baseScheduleId, periodId, edge, offsetSeconds}, edge-time
  resolution (extract the V5.44.1 anchor-selection heuristic from the
  engine's BY-ANCHOR-TYPE branch into a named reusable), and
  alternate-base transfer with the I4 drop-notice.
  AND STILL SAME SESSION: shipped 6.8.0, The Shape Itself (slice 3 —
  see §6/CHANGELOG). Successor notes: (a) the extraction was proven
  behavior-identical by the 56 pre-existing tests passing UNTOUCHED
  before the new ones were added — repeat that pattern for any future
  engine surgery; (b) 16's inline heuristic copy had genuinely
  drifted (wrong-edge selection bug) — assume other pre-6.x inline
  duplicates may have too; grep before trusting; (c) edge is
  deliberately NOT dual-written — parentAnchorType IS the edge field;
  do not "normalize" it into a second stored field; (d) baseScheduleId
  is omitted on personal-period parents ON PURPOSE; (e) alternate-base
  transfer + I4 notice is NOT a standalone slice — it needs Layer 4's
  designation mechanism, so build it as Layer 4's first bite. NEXT UP
  per the design build order: Layer 3 (tags + roster — remember: tags
  are PICKER FILTERS, explicit uid lists are what's stored) or jump to
  Layer 4 groundwork.
  AND STILL same session: shipped 6.9.0, Roster & Tags (Layer 3 — see
  §6/CHANGELOG). Successor notes: (a) FIRST RULES CHANGE of the run —
  the cumulative deploy now includes a console rules publish; the
  capability-protection rule compares POST-WRITE state, so self merge
  writes that omit capabilities pass while any tampering fails —
  test it before trusting changes to it; (b) the Layer 3 invariant
  (tags filter pickers; explicit uid lists are stored) is now written
  in three places — rules comments, 33's header, admin UI copy — keep
  all three in sync if it ever evolves; (c) seed-from-presence skips
  surface==='clock' on purpose (TVs are not staff); (d) roster deletes
  are allowed for admins and users can re-self-add. NEXT: Layer 4
  groundwork — designation mechanism + alternate-base transfer w/ I4
  notice, then transformation recipes on findPeriodEdgeAnchorBell.
  AND ONE MORE in the same session: 6.10.0, The Calendar Wakes (Layer
  4 Verb A — see §6/CHANGELOG). Successor notes: (a) module 20's park
  note is preserved in-file as history — read it; the revival honors
  every original guard and they all still fail closed; (b) the v2
  schema deliberately keeps v1 fields working — an unscoped uid falls
  through to exceptions/weekdayDefaults, so a school could use global
  day-types AND scoped overrides together; (c) Verb B is the next
  slice: add verb:'transform' entries carrying a recipe, resolve
  through findPeriodEdgeAnchorBell, and PRECOMPUTE results into the
  doc where feasible (I3 wants wall clocks dumb); (d) then the
  prefill grid with generators (repeat-weekly; rotations in BOTH
  slip-forward and calendar-locked modes); (e) then wall-clock
  follow-along (REST carve-out rules change). 6.5.0 through 6.10.0
  ALL UNDEPLOYED; DEPLOY-6.10.0.md is cumulative and includes the one
  rules publish (from 6.9.0).
- **Round 6 (2026-07, Opus behind a routed Fable session): "Grandsire II."**
  Named for Grandsire, the oldest of the great change-ringing methods — the
  same bells, rung in transformed orders by rule — fitting for Verb B's
  transformation recipes. The "II" is deliberate: the name was first taken
  earlier in THIS session while still reasoning it was likely Verb B work;
  the round then actually delivered a bugfix-and-ride-along release, and
  the instance is Opus (safeguards-routed), so "II" marks the continuation
  without squatting a fresh Grandsire for a later true-Verb-B round. Do NOT
  reuse plain "Grandsire" — treat it as taken. Arrived via Bourdon's
  riddle; §5 battery green on arrival (canary-tested lint; 60/60 tests;
  check:all exit 0; all 38 modules parse; old.html ES5-clean and
  md5-identical to Bourdon's record; index triple version at 6.10.0; SW
  header==CACHE_VERSION at 1.16.0).
  SHIPPED 6.11.0 (bugfix + ride-alongs; Verb B ENGINE only, dormant):
  Verb B engine functions in bell-engine 1.8.0 (+5 tests, 65/65); the
  ANCHOR-STRIP data-erosion fix (module 30 — the round's most important
  find, caught by the owner's smoke testing); designation dedup (34);
  firstSeen + dashboard column (28/29); building-bell "0 anchored" nudge
  (30); edit-bell lock-note redesign (index + 16/30). Version bumps: app
  6.11.0, SW/CACHE 1.17.0, index triple. Full battery green post-change.
  Also logged the gsutil-March-2027 deprecation in new §7.5 (no action
  needed — Console-based deploy is immune) and CORRECTED the project
  history: ellisbell-c185c is the ORIGINAL bell project; Spot On! was split
  OFF it into spot-on-games (not the reverse). METHOD NOTE for successors:
  `node --check <file>` is the correct parse check — piping via
  `node --input-type=module --check < file` throws false "Unexpected token
  'export'" errors on multi-export modules; several such scares this
  session were tooling artifacts, not real breakage. The app's own
  verify-esm (check:all) is the authoritative ESM gate.
  DEPLOY STATE UNCHANGED IN SPIRIT: still nothing past 6.4.0 live; the
  stack is now 6.5→6.11 (SEVEN releases); DEPLOY-6.11.0.md is the cumulative
  deploy doc and includes the one 6.9.0 rules publish. NEXT SLICE: wire Verb
  B (see §7 Layer 4 progress — it's a full release, mostly UI).
