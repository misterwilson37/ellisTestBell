# HANDOFF.md — continuity document for Claude

**Audience:** a fresh Claude instance picking up this project cold (or the
teacher who maintains it, re-orienting after time away). Read this whole file
before writing any code. Last updated: **6.25.1 (SILENT BELLS RANG THE DEFAULT
BELL. The sound dropdowns have offered "Silent / None" since 5.32/5.33 (module
19 injects `[SILENT]` into every Default Sounds optgroup) but playBell() had NO
CASE for it, so `[SILENT]` fell through to the custom-sound path, was looked up
as a Firebase Storage path, 404'd, and the catch's "revert to default" rang
ellisBell.mp3. One-line fix: early return in playBell. The EMPTY-soundName
fallback to default is deliberately UNCHANGED — empty means never set, [SILENT]
means chosen. NOTE FOR SUCCESSORS: old.html has handled [SILENT] correctly all
along, so when a feature "works on the old page but not the app", suspect the
6.0.0 modularization dropped it. ALSO SHIPPED, same round: clock.html v1.8.0 — it
took no sound argument and played config.sound for EVERY bell, so silent bells
rang there too. Now honours bell.sound and [SILENT], with config.sound as the
fallback; non-URL sounds fall back (old.html's guard). NO new control: the
per-column bell checkbox already gives per-line all-or-nothing audio and already
defaults OFF, and inverting it would flip the meaning of a1..a9 in every saved
clock URL. ROADMAP §5b is now a SETTLED SPEC (temp bells: today-only local
overlay like skips, midpoint time, all fields editable) — a build ticket, not a
design question. SW 1.38.0, 74/74, 41 modules; two files changed
(src/js/05-preferences-cloud-sync.js and clock.html).)
DEPLOY STATE: through **6.22.0 IS LIVE** on alpha (owner-confirmed round 10 — he
downloaded the repo from GitHub, and on a Pages site the repo IS the deployment).
OUTSTANDING, built + battery-green, NOT pushed: **6.23.0, 6.24.0, 6.25.0, 6.25.1
and clock.html v1.8.0** — ONE push covers all of them.
THIS LINE IS STALE BY CONSTRUCTION: it is written before the owner's final push
of the session. ASK HIM, do not trust it. It has been wrong twice.
// prev: **6.25.0 (NAMED QUEUE STEPS + THE BELL
MODAL. (1) A queue step can carry a LABEL, so the countdown line reads
"Hamburger time! (Queue 1/2)" instead of "Queue (1/2)" — that line is the same
wide row that normally reads "until <bell name>!". Optional; empty falls back to
the bare form. (2) Skipping a bell is no longer blind: one button opens a modal
listing the NEXT FIVE BELLS BY NAME AND TIME, each with its own Skip/Unskip.
Skipped bells stay listed, struck through, or there is nothing to unskip.
REPLACED both old buttons rather than adding a third (owner: no more chaos on
the main screen). skipNextBell() now delegates to a new skipBell(bell). GUARDED
EN ROUTE: updateMainPageSkipButtons() opened with `if (!skipBtn || !unskipBtn)
return;`, which would have hidden the skip button forever once the unskip button
was removed. NOT YET BUILT and on the roadmap as §5b: "add a temp bell" between
rows of that modal — split off deliberately; it needs the storage question
settled first (today-only local overlay, NOT a write into personalBells). SW
1.37.0, 74/74, 41 modules, NO rules change, NO CSS rebuild. Round 10, "Plain
Bob" — see §10.)
// prev: **6.24.0 (SAVE A QUEUE AS A QUICK BELL.
The owner's class opens with 15 min of typing under a hamburger icon, then 2.5
min of Beethoven; both halves were saved as SEPARATE quick bells and he had no
way to fire the pair. Now the queue modal has "Save as a Quick Bell": a saved
queue is an ORDINARY custom quick bell carrying a `steps` array, living in the
same 4 slots with the same icon/broadcast/backup machinery — no parallel list.
FOUND AND FIXED EN ROUTE: module 15's snapshot handler rebuilds each quick bell
from a WHITELIST, and `alwaysBroadcast` was never added when V5.65.0 introduced
it — the broadcast tick silently reverted on every reload. That whitelist is now
commented as a whitelist. The button icon is a DIAGONAL SPLIT of the steps (clipPath bands rotated -45,
capped at 3, stored as a [QUEUE_SPLIT] sentinel so it tracks step edits); "until a bell rings" repeat is NOT saved, since it
targets today's bellId. SW 1.36.0, 74/74, 41 modules, NO rules change, NO CSS
rebuild. Round 10, "Plain Bob" — see §10.) DEPLOY STATE (CORRECTED BY THE OWNER, round 10):
through **6.22.0 IS LIVE** on alpha. The pre-round-10 header claimed 6.21.0 and
6.22.0 were built-but-undeployed; they were not — he downloaded this repo from
GitHub, and on a Pages site the repo IS the deployment. Round 9 pushed and never
updated the header. ONLY 6.23.0 + 6.24.0 are outstanding; ONE push covers both.
SUCCESSORS: this header's deploy state is written BEFORE the owner's final push
of the session, so it is stale by construction. ASK HIM, do not trust it.
// prev: **6.23.0 (QUICK BELL QUEUE — A GRAPHIC
PER TIMER. The owner asked for "a queue of bells... one bell with a graphic
followed by another bell with a different graphic, each with its own sound."
Most of it already existed: the V5.55.0 queue has always varied SOUND per step.
Only the picture was queue-wide — one `queue-visual-select` feeding
state.queueVisual. Now each timer row owns a "Graphic" dropdown and a queue
entry is {durationSeconds, sound, visual}; the queue-level control is REMOVED
(two controls for one thing). Module 10 needed NO change — its visual key was
already `queue:<index>:<repeat>`. Five files. Row relaid out into labelled
Length/Sound/Graphic lines on one w-16 label column and one w-8 h-8 trailing
column; added a 32x32 live thumbnail per row. SW 1.35.0, 74/74, 41 modules, NO
rules change, NO CSS rebuild (classes verified present). ALSO: reconstructed the
MISSING V6.22.0 CHANGELOG entry — round 9 shipped the code and never wrote it,
while module 16 points readers at it. ALSO: new ROADMAP.md — §7 below is still
the full record, but it was unreadable as a planning doc; ROADMAP.md is the
one-page index. Round 10, "Plain Bob" — see §10.) DEPLOY STATE: through 6.20.4
LIVE on alpha (owner confirmed); 6.21.0, 6.22.0 AND 6.23.0 built +
battery-green, NOT deployed — ONE push covers all three.
// prev: **6.22.0 (THE EDIT MODAL EDITS THE BASE
SCHEDULE — the §7 loose thread was a live data-corruption bug, not a curiosity.
The modal rebuilt its bell from the rendered row's data-* attributes, which carry
SHIFTED/TRANSFORMED times, while the shared save path writes the PRISTINE
document: any shared-bell save during an emergency shift (a rename, a sound, an
anchor) permanently rebased that bell for everyone. 6.20.4 made it MORE reachable
by telling admins to tick the confirm and save again. Fixed via
findStoredSharedBell + resolveAllBellTimes({pristine:true}); proximity check
rebased to match; updatePeriodsOnEdit now preserves `relative` (it replaces
rather than merges, and shared relative bells DO reach the static editor, so
saving one flattened it to a fixed bell); time field locked for derived bells.
Plus three things the owner reported from the wild: the roster bulk-template
button overlapping its panel, the untagged nudge naming people who are
structurally absent from the roster list it opens, and its "4 people / 3 names"
count. SW 1.34.0, 74/74, 41 modules, NO rules change, NO CSS rebuild.)
DEPLOY STATE: through 6.20.4 LIVE on alpha (owner confirmed); 6.21.0 and 6.22.0
built + battery-green, NOT yet deployed — ONE push covers both. Round 9,
"Gudgeon" — see §10.
**BACKPORT DOWNGRADED (owner, 2026-08):** he is the ONLY admin on every channel,
the 6.20.4 bug only ever bit administrative edits, and he now knows the confirm
must be ticked. Faculty were never blocked. So the school/building backport is NO
LONGER top priority. BUT see §7 — the 6.22.0 shift-rebase bug DOES exist on the
school channel (5.79.x has temporaryShift since v5.74) and he is exactly the
person who can trigger it. Building (5.69.5) predates the shift and is unaffected.
// prev: **6.21.0 (DUPLICATE SCHEDULE ships —
admin-only deep copy of the selected shared schedule, with REGENERATED bellIds
and periodIds so a teacher's personal overrides/mutes cannot bleed between a
schedule and its copy; buildingBellId anchors preserved, temporaryShift not
copied. Plus two affordance fixes from deploy screenshots: the plainly-labelled
"Rename Schedule" button now renames shared schedules for admins instead of
sitting greyed, and the untagged-nudge + designation banners are readable in
dark mode (they used literal light-palette Tailwind instead of --theme-*; fixed
in hand-written styles.css so no CSS rebuild). SW 1.33.0, 74/74, 41 modules, NO
rules change.) DEPLOY STATE: through 6.20.4 LIVE on alpha (owner deployed and
confirmed 6.20.4 — the bell-time fix is verified in the wild); 6.21.0 built +
battery-green, NOT yet deployed. Round 8, "Sally" — see §10.
**BIGGEST OPEN ITEM IS NOT IN THIS REPO:** the 6.20.4 bell-time fix has NOT
reached the school (5.79.x line) or building (5.69.5) channels, and school
resumes shortly for ~50 faculty. Both predate V5.66.2 and so carry the identical
silent time-drop. See §7. // prev: **6.20.4 (THE OPEN BUG IS CLOSED —
"admin cannot edit bell times" was NOT backend. `handleEditBellSubmit` gated the
whole shared-bell save path on the "Override shared SOUND for all users"
checkbox, and the personal-override path it fell through to has no `time` field,
so the new time was discarded in silence. The gate dates to V5.66.2, which is
why it reproduced identically on 5.69.2, 6.11.0 and 6.20.x — the cross-version
repro was evidence of an OLD CLIENT BUG, not a shared backend one. Owner
confirmed live: ticking the box saved the time immediately. Also relabelled the
confirm to describe the whole modal, deleted a dead visual-override checkbox and
a V4.95 listener that revoked sound editing, silenced the 6.20.3 watchdog's
false alarm on shared schedules, added real onSnapshot error callbacks, and
RESTORED tests/bell-engine.test.mjs from 41 to 64 tests. SW 1.32.0. 74/74, 41
modules. NO rules change, NO CSS rebuild, bell-engine.js and old.html
untouched.) DEPLOY STATE: through 6.20.0 LIVE; 6.20.1 → 6.20.4 built +
battery-green, NOT yet deployed. Round 8, "Sally" — see §10. PRE-6.20.4 HEADER
FOLLOWS FOR CONTEXT. //** prev: **6.20.3 (FAIL-OPEN WATCHDOG on the
schedule load latch — the likely cause of the reported "cannot edit bell times"
freeze: recalculateAndRenderAll() returns early forever if either load flag never
gets set, with NO error. Watchdog force-renders after 6s and names the failing
listener. Carries 6.20.2 + 6.20.1.) OPEN: why a listener fails to report — the
[Watchdog] console line will say. // prev: 6.20.2 (nested periods are no longer
reported as overlaps — lunch waves live INSIDE 4th period, which broke the
detector with a false alarm; engine 1.16.0. Overlap hook now try/catch-guarded so
it can never break the editor. Carries the undeployed 6.20.1 popup removal.)
OPEN BUG: admin cannot edit bell times — reproduces on 5.69.2 too, so likely
BACKEND, not app code; see §7 OPEN BUG. // prev: 6.20.1 (killed the "New version
available!" PWA popup — it still nagged unattended clocks on post-deploy boot;
module 99 now silently reloads once on controllerchange, guarded to genuine
updates and skipped while a modal is open. SW 1.29.0. Owner's 2nd report of
this toast — see §9). DEPLOY STATE: through 6.20.0 LIVE; 6.20.1 built +
battery-green (73/73), NOT yet deployed (main-app files only; old.html
unchanged). PRE-6.20.1 header follows for context. // 6.20.0 (WALL-CLOCK FEED, reader half —
old.html now reads config/clock_feeds and renders today's published transformed
periods for its pinned schedule; the hallway clocks follow the calendar. First
old.html change all round; md5 now e56f1e4c50c597cfe9e5618e0b53c732. Also fixed
a pre-existing shift-drop on the 5-min refresh), 2026-07 (round 7, "Stedman" —
see §10). DEPLOY STATE: 6.16.0 is LIVE. 6.17.1 → 6.20.0 are built +
battery-verified (73/73, 41 modules; old.html script syntax-checked) but NOT
yet deployed — ONE whole-tree push (incl. old.html) covers all; files-only, NO
rules change, NO new module.**

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
- **DEPLOY STATE (as of round 7, 6.20.1):** **6.5.0 → 6.20.0 are all LIVE**
  (owner confirmed 6.20.0). **6.20.1 is built + battery-green (73/73) but NOT
  yet deployed** — main-app files only (index.html 6.20.1, service-worker.js
  1.29.0, whole src/js/); bell-engine, tailwind.css, and old.html all UNCHANGED.
  No rules change, no new module. It removes the update popup (see §9). Deploy
  docs are now ONE rolling DEPLOY.md (§8). CONFIRM deploy state with the owner
  at the top of the next round — the handoff records belief, not ground truth.
- **DEPLOY LESSON (round 6, still current):** a PARTIAL push produces a
  MIXED tree — new files next to stale ones — and because this is an ES-
  module graph, ONE stale module kills the whole app (SyntaxError:
  "module X doesn't provide an export named Y"; the app dies before
  sign-in even wires). Full detail + diagnosis recipe is in §9. The
  practical rule (unchanged for 6.12.0): replace the ENTIRE src/js/ tree
  plus the changed root files in ONE commit, then cache-busted spot-check
  (append ?v=N to a file URL to punch through GitHub Pages' ~10-min CDN
  cache) BEFORE running the smoke tests.

## 3. Architecture (current, 6.11.0)

Surfaces:
| File | What | Notes |
|---|---|---|
| `index.html` + `src/js/` | Main teacher app (Firebase v11, native ES modules since 6.0.0) | **src/js/ IS production** — entry `src/js/main.js`; 41 modules (39 feature + `state.js` + `main.js`; init module numbered 99 so insertions never rename it). Since 6.2.0, modal chrome is expanded from data attributes by 26-modal-chrome.js; since 6.3.0, school branding (name/labels/theme-color) comes from root /school-config.js applied by 27-school-branding.js — both headers document the contracts; since 6.5.0, Building Bells (30-building-bells.js) makes the six intercom moments first-class anchors — see §7. script.js no longer exists |
| `clock.html` v1.7.0 | 3x3 grid clock for Yodeck TVs (v9 compat) | Uses shared engine; refreshes data every 2 min; since 1.7.0 reports presence (anonymous sessions only — see file header) |
| `old.html` v2 | ES5 iPad wall clock (unauthenticated REST) | Shift support + 5-min auto-refresh added |
| `dashboard-config.html` | Admin tool for signage config | Untouched by this engagement |
| `signage/` pages: dashboard v1.6.0, dashright v1.1.0, dashclock v1.1.0 | TV dashboard pages (v9 compat, live onSnapshot) | Share `signage/schedule-utils.js` (+ engine): relative bells resolved, shifts honored. dashboard's 3 config listeners are intentional branches |

Shared infrastructure:
- **`bell-engine.js` v1.16.0** — THE single implementation of pure
  time/schedule math (escapeHtml, timeToSeconds/secondsToTime,
  formatTime12Hour, getDateForBellTime, getBellId, findNextBellIn,
  findBellAfter, calculateRelativeBellTime, toLocalDateString,
  resolveCalendarSchedule, resolveScopedDesignation (1.10.0), detectPeriodOverlaps (1.11.0),
  planOverlapResolution (1.12.0),
  shiftTimeString, getActiveScheduleShiftSeconds,
  applyBuildingBellTimeToPeriods, findPeriodEdgeAnchorBell (1.6.0),
  resolveCalendarTransforms + applyRecipeToPeriods (1.8.0, Verb B),
  mergeCalendarEntry (1.9.0, calendar entry dedup/append rule)).
  Loaded as a plain `<script>` by index.html and clock.html (pattern:
  firebase-config.js). Exports for Node. **Keep it pure** — no DOM, no
  Firebase, no app globals; dependencies come in as parameters.
- **`tests/`** — 68 node:test tests, zero deps (`bell-engine.test.mjs` +
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
- **service-worker.js v1.31.0**, cache name DERIVED: 'ellis-web-bell-' +
  CACHE_VERSION (6.1.0 — one bump busts the cache; the old two-constant
  footgun is dead, and `npm run check:sw` enforces header==constant and
  CORE_ASSETS==filesystem). Tone.js is SELF-HOSTED since 6.1.0
  (/tone.min.js, pinned 14.8.49; upgrade path in README-BUILD.md);
  gstatic Firebase SDKs remain CDN by design. CORE_ASSETS
  lists all 41 src/js modules + /school-config.js. Bump CACHE_NAME whenever CORE_ASSETS changes;
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
    config/clock_feeds     # 6.19.0 public wall-clock feed (admin-write,
                           #   public-read via existing config rule): map
                           #   scheduleId -> { date, periods } of RESOLVED
                           #   transformed periods for dumb clocks. old.html
                           #   reader lands 6.20.0.
    roster/{uid}           # 6.9.0 tags+capabilities; read=authed, self-write
                           #   cannot touch capabilities (rules-enforced).
                           #   6.14.0: optional defaultScheduleId = the user's
                           #   HOME schedule (admin-set; explicit per-uid, NOT
                           #   tag-resolved). No rules change (additive field).
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
npm test                       # 68 tests, two suites
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

- **v6.20.1** — Killed the "New version available!" PWA popup (module 99). It
  still fired on a normal post-deploy boot (my 6.15.0 fix only suppressed the
  hard-refresh case) — pure noise on an unattended clock. Now: no toast; the
  page silently reloads ONCE on controllerchange, guarded by wasControlledAtLoad
  (genuine updates only) and skipped if a [data-modal] is open. skipWaiting+
  claim already auto-activate, so clocks self-update seamlessly. SW 1.29.0. No
  rules change.
- **v6.20.0** — Wall-clock feed (reader half): the clocks follow the calendar.
  old.html (first change all round; md5 → e56f1e4c…) reads config/clock_feeds
  via new ES5 fetchClockFeeds() (parseFields); loadPublicSchedule prefers
  feeds[itsScheduleId] when date === today, applying the emergency shift on top,
  fail-open to base. Fetched before each load at the dropdown + 5-min refresh.
  Also fixed a pre-existing shift-drop on the refresh path. SW 1.28.0. No rules
  change, no new module. Wall-clock arc COMPLETE.
- **v6.19.0** — Wall-clock feed (publisher half). module 20 publishClockFeeds
  (admin-only) composes today's clock-targeted transform recipes per schedule
  onto its base periods and writes flat resolved periods to public
  config/clock_feeds (KEY: config is already public-read — NO rules change).
  module 34 "Show on clocks" checklist → clockScheduleIds on the transform
  entry (explicit; option A). Stale feeds expire by date; same-day removal
  resets to base. Verifiable in console. old.html reader = 6.20.0. SW 1.27.0.
  73/73. No rules change, no new module.
- **v6.18.1** — Resolver "Shrink" now protects passing periods by default too
  (engine 1.15.0): instead of butting the next period against the overrun's
  end (0 gap), it leaves a passing period sized from that period's own outgoing
  gap (or the smallest positive gap). The "Protect in-between times" checkbox
  moved out of spread-only and governs Shrink + Spread (hidden for Push).
  Reinforced with owner: passing periods are MEASURED space (next.start −
  this.end), never a stored field. SW 1.26.0. 73/73.
- **v6.18.0** — "Reclaim a period" Verb B recipe. engine 1.14.0 'reclaim'
  archetype in applyRecipeToPeriods: removes periodName for the day, frees
  [prev.end → reclaimed.end] (reclaimed length + incoming passing period),
  redistributes evenly across survivors with dismissal PINNED (each class
  grows), preserves the outgoing passing gap. Static bells only; relatives
  re-derive (anchored-into-reclaimed → orphan fallback, documented). Recipe
  builder (34) gets a 3rd type + period-name field; describeRecipe (20)
  labels it. Rides the existing Verb B pipeline — no new wiring, no new
  module, no rules change. SW 1.25.0. 73/73. Per-day, non-destructive, never
  a dropdown entry (owner emphatic).
- **v6.17.1** — Resolver tweaks (owner feedback on unshipped 6.17.0). Spread
  now PROTECTS passing periods by default: engine 1.13.0 adds protectGaps
  (default true) — overlap comes out of the CHECKED periods' own length (move
  their end bell in), gaps preserved, dismissal pinned; uncheck for the old
  gap-tighten. "Push later" demoted to the 3rd option + a dramatic
  dismissal-change window.confirm. SW 1.24.0. 71/71. Supersedes 6.17.0
  (deploy 6.17.1).
- **v6.17.0** — Collision resolver + bolder overlap banner. engine 1.12.0
  planOverlapResolution (pure, tested): 'shrink' (next period starts later),
  'push' (shift everything after later), 'spread' (rigid per-period shift
  tightening gaps after checked periods, day-end fixed) — returns bell moves
  for STATIC bells only (relatives re-derive). Module 37 banner is now bold +
  red with a Fix… button (admin + SHARED schedule only) opening a
  PREVIEW-before-apply resolver modal. On Apply, module 37 dispatches
  ellis-apply-overlap-fix; module 18 rewrites the named static bells in
  localSchedulePeriods and writes `periods` (source of truth, same as the
  delete-period path — no new save path), logs 'resolve-overlap', and the
  shared listener recalcs → detector re-runs → banner clears. SW 1.23.0 (no
  new module). 70/70. No rules change. NOTE: 'spread' v1 tightens gaps
  (periods keep length); "shorten the periods themselves" is a labeled
  future mode. Preview makes current behavior explicit.
- **v6.16.0** — Period overrun detection (safe first half of the collision
  resolver). engine 1.11.0 detectPeriodOverlaps (pure, tested): flags a
  period whose last bell passes the next period's first bell; skips
  single-bell markers / relative stubs / back-to-back boundaries so passing
  gaps don't false-positive. NEW read-only module 37-overlap-warning.js:
  after each recalc (one additive line at the tail of recalculateAndRenderAll
  in module 18), if admin-mode, runs the detector on
  state.calculatedPeriodsList and shows a dismissible RED banner with the
  specifics. NEVER moves a bell. Also FIXED BellEngine.VERSION, which had
  drifted (stuck at '1.8.0' since the 1.9.0/1.10.0 header bumps missed the
  constant — nothing in the battery checks it; see §9). SW 1.22.0 (41
  modules). 69/69. No rules change. DEFERRED: the destructive resolver
  (shrink/spread/allow) — see §7.
- **v6.15.0** — Untagged-teacher nudge + hard-refresh toast bugfix. NEW
  module 36-untagged-nudge.js: admin-only, one-time presence∩roster read on
  an `ellis-admin-confirmed` event (module 15 fires it; state.isAdmin is
  the new server-confirmed flag), surfaces a dismissible blue banner for
  signed-in non-clock staff with no tags; Review opens the roster modal
  (via roster-open-btn.click(), no import). Reads only — Layer 3 invariant
  intact. BUGFIX (module 99): the PWA "new version available" toast fired
  on hard refresh because it read navigator.serviceWorker.controller LIVE
  at the new worker's statechange, and skipWaiting+claim raced to make it
  truthy even on an uncontrolled (hard-refresh) load. Now gated on
  wasControlledAtLoad captured up front — hard refresh = uncontrolled =
  silent (you have latest); normal reload from old cache = controlled =
  toast still useful; first install = silent. skipWaiting/claim untouched
  (TVs still auto-update). SW 1.21.0 (40 modules). engine unchanged. No
  rules change. 68/68.
- **v6.14.0** — Home Schedule (per-teacher standing default, invariant-
  safe): roster/{uid}.defaultScheduleId (additive, admin-set, explicit
  per-uid — NO runtime tag resolution, so the Layer 3 invariant holds and
  the CDC teacher's three grade tags never compete). Module 20 restructured
  into applyMandate (scoped designation / school-wide default — bannered)
  vs applyHomeSchedule (silent, never over a same-day manual pick or a
  personal schedule); reachable even with no calendar doc; a live listener
  on the user's own roster doc re-resolves on admin change. engine 1.10.0
  splits resolveScopedDesignation out of resolveCalendarSchedule (behavior
  identical) so module 20 can tell mandate from home. Roster UI (33) gains
  a per-person Home picker + a bulk template (filter → schedule → set for
  all matching, count+confirm). Designation picker (34) gains select-all/
  clear. SW 1.20.0 (cache bump, no new module). +1 test (68/68). No rules
  change. NEXT: untagged/un-homed teacher nudge on admin sign-in (rides
  presence+roster; pairs with this).
- **v6.13.0** — The Prefill Grid (Layer 4 "plan the weeks"): NEW module
  35-schedule-grid.js — a desktop-grade multi-week calendar (getDoc
  snapshot like 34) that summarizes each date's base/transform entries,
  opens the day-of modal (34) PRESET to any clicked date (reusing all
  authoring; grid hides then reshows+refreshes via CustomEvents so 34
  never imports 35 — no cycle), and repeats a day's plan onto every
  same-weekday date through an end date. engine 1.9.0 extracts
  mergeCalendarEntry (the base-dedup/transform-append rule, formerly
  inline+untested in 34) into one pure tested place shared by the modal
  and the grid copy-forward; module 34 rewired to call it (+ preset date,
  + openDesignationModal export, + calendar-changed/closed events).
  SW 1.19.0 (39 modules — NEW module in CORE_ASSETS). +1 test (67/67).
  No rules change. NEXT: rotation-cycle generators (see §7).
- **v6.12.0** — Verb B WIRED (Layer 4 transformation recipes go live):
  no engine change (1.8.0 functions were already there), no rules change,
  no new modules. state.activeCalendarTransforms (new) mirrors
  activeSharedScheduleShift; module 20 resolves the day's recipes per-user
  on every calendar/schedule/day trigger (independent of base
  designation) and re-renders only on change; module 14 folds them onto
  base-period COPIES pre-merge (localSchedulePeriods stays pristine, §4.6;
  shift rides on top; relatives + personal overlays re-derive downstream);
  I1 banner surfaces active transforms (Follow hidden in transform-only
  mode); describeRecipe exported so module 34's entry list and the banner
  share one label string. Module 34's designation modal grows a mode
  toggle (base vs transform) + recipe builder for both archetypes (shift:
  mins ± with optional from/until; shorten: after/perPeriod/extend-by-name
  with a period-name datalist). Transforms COMPOSE — no dedup on save.
  +1 pipeline test (66/66). SW 1.18.0 (cache bump only). Wall-clock
  precompute (ES5 REST follow-along) remains the last unstarted slice.
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

> **START WITH ROADMAP.md (new in 6.23.0).** This section is the full record —
> priorities, closed bugs, and the reasoning trails behind both — and it is too
> long to plan from. ROADMAP.md is the one-page index of what is actually left.
> Keep them in sync; when they disagree, THIS section wins and ROADMAP.md gets
> fixed.

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
- **Verb B (transformation recipes) — WIRED 6.12.0.** The engine's
  resolveCalendarTransforms + applyRecipeToPeriods (1.8.0) now have
  callers: module 20 resolves the day's recipes per-user into
  state.activeCalendarTransforms on every calendar/schedule/day trigger;
  module 14's resolveAllBellTimes folds them onto base-period COPIES
  before the merge (mirroring the emergency shift — localSchedulePeriods
  stays pristine, §4.6; relatives + Layer 2 overlays re-derive
  downstream); module 34's designation modal grew a mode toggle + a
  recipe builder for both archetypes; the I1 banner surfaces active
  transforms. Composes cleanly (66/66). Two things a successor should
  know: (a) transforms are INDEPENDENT of Verb A — a teacher on their
  normal base can be transformed, so resolution runs before the
  base-switch guards; (b) the recipe UI stores by period NAME for the
  extend target (extendPeriodName), never a schedule-specific periodId —
  that is deliberate (one recipe fits every schedule with a like-named
  period). NOT DONE: wall-clock precompute (below) — app clients resolve
  at runtime; the ES5 REST clocks still can't.
- **Prefill grid — SHIPPED 6.13.0 (view + edit + repeat-weekly).** Module
  35-schedule-grid.js: navigable 6-week calendar, click any cell to edit
  it via module 34 (preset date), repeat-weekly copy-forward through the
  engine's mergeCalendarEntry. Desktop-grade (I2 is satisfied by the
  day-of modal). What's LEFT of the grid slice: the ROTATION-CYCLE
  generator — a repeating sequence of schedules across days, in BOTH
  modes: slip-forward (the cycle advances only on days that "count," so a
  holiday doesn't consume a rotation slot) and calendar-locked (cycle
  position pinned to the date regardless of skips). The design flags this
  as ASPIRATIONAL / for-other-schools (Ellis doesn't rotate; the feeder
  high school does), so it was deliberately deferred out of 6.13.0 to keep
  that release bounded. When built: it's another generator in module 35's
  repeat panel (source = a set of schedules + a start date + a mode + an
  end date), writing verb:'base' entries per date via mergeCalendarEntry.
  Skip-day math (which dates "count" for slip-forward) is the only genuinely
  new logic — make it a pure, TESTED engine helper (school days come from
  the calendar's own designations/exceptions, or a simple weekday mask).
- **"Reclaim a period" — SHIPPED 6.18.0.** engine 1.14.0 'reclaim' archetype
  in applyRecipeToPeriods + a recipe-builder option in module 34, riding the
  existing Verb B pipeline (per-day, non-destructive, never a dropdown entry).
  Freed span = [previous period's END → reclaimed period's END] (sacrifices
  incoming passing period, preserves outgoing), redistributed evenly across
  survivors with dismissal pinned → each class grows. Tested (last + mid
  period). REFINEMENTS still open: (a) a relative bell anchored INTO the
  reclaimed period orphans to fallback for the day — fold it onto a surviving
  neighbor instead (needs anchor re-homing, fiddly); (b) optional
  absorb-checkboxes to pick WHICH survivors get the time (v1 spreads across
  ALL). Neither blocks use; owner told about (a) in the deploy doc.
- **DOWNGRADED 2026-08 (owner call, round 9): BACKPORT THE BELL-TIME FIX.**
  The owner is the ONLY admin on every channel, the V5.66.2 bug only ever bit
  ADMINISTRATIVE edits, and he now knows to tick the confirm. Faculty consume
  bells; they never hit the path. So this is no longer urgent — do NOT re-promote
  it to top priority without new evidence. It stays listed because the school
  channel will eventually be pushed, and because the 6.22.0 shift-rebase bug
  (above) rides the same channel and is the one with teeth.
  Those channels are PRE-modularization (`script.js` monolith, no src/js/), so
  it is a port, not a copy: find `handleEditBellSubmit`, locate
  `wantsToOverrideForAll`, and add the same "refuse rather than silently drop a
  time change" guard. The relabelled checkbox matters just as much as the guard —
  without it the refusal message names a control the user cannot find.
  Confirm with the owner FIRST which repo is which (§2 has been wrong about
  channel topology before) and get a fresh zip of the target.
- **OPEN (evidence-backed, bounded — round 8's recommendation):** two sweeps
  earned by what 6.20.4/6.21.0 actually turned up, worth doing before any §7
  roadmap work. (a) AFFORDANCE SWEEP: for every interactive control, does its
  enabled state match who can really use it, and does its label match what
  saving actually does? The edit-bell modal alone yielded four defects of this
  kind, and the rename button a fifth — that is a pattern, not coincidence.
  (b) DARK-MODE CONTRAST SWEEP of everything added since ~6.9.0: three banners,
  two were unreadable. Newer surfaces were built with literal Tailwind colours
  while the app themes through `--theme-*` variables. Both sweeps are finite and
  mechanically checkable. A COLD full-codebase audit is NOT recommended — 41
  modules of theoretical findings has poor signal; every good find this round
  came from a real user symptom.
- **CLOSED 2026-08 (6.20.4, round 8): ADMIN CANNOT EDIT BELL TIMES.**
  **It was client-side, and eight months old.** `handleEditBellSubmit` (module
  16) computed
  `wantsToOverrideForAll = isAdmin && editBellOverrideCheckbox?.checked` and
  used it to gate the ENTIRE shared-bell save path. Unticked, control fell to
  the personal-override branch, whose override object has `nickname`,
  `visualCue`, `visualMode`, `sound` — and **no `time`**. The typed time was
  discarded; `closeEditBellModal()` then cleared `editBellStatus`, so even the
  "saved" line was unreadable. Modal shuts, nothing changes, console clean.
  The gate arrived in **V5.66.2**, a *sound* fix that placed a sound-scoped flag
  at the top of the whole save path. 5.66.2 predates 5.69.2, 6.11.0 and 6.20.x,
  which is the entire explanation for the all-channels repro.
  **METHOD LESSON — READ THIS ONE.** Four rounds reasoned: "it reproduces on a
  version that predates all our changes, therefore the cause is shared
  infrastructure (rules / admins doc / appId / document shape)." That inference
  is wrong whenever a client bug is simply OLDER than the versions being
  compared. "Predates our changes" narrows to *code we did not write this round*
  — which includes old client code. Before reaching for the backend, date the
  suspect line: `git log`/CHANGELOG the feature and ask whether the oldest
  failing channel already had it. Here CHANGELOG.md named 5.66.2 outright.
  Corollary: the 6.20.3 latch theory was a plausible lead that happened to be
  wrong. The guard short-circuits on `state.activePersonalScheduleId`, so on a
  shared schedule it cannot block anything — and the original
  `Delaying calculation:` line was ordinary load-order noise on a personal
  overlay (personal listener wins the race, base lands a moment later), not a
  freeze. A benign log line was promoted to a smoking gun.
  **Fixed in 6.20.4:** time changes that would land on a storage-incapable path
  now refuse the save (modal stays open, time preserved, confirm named and
  focused) rather than being dropped; no auto-escalation, because a shared write
  reaches ~50 people and must stay deliberate. The comparison normalizes both
  sides via `normalizeTimeString` — the owner is on Safari, and a browser
  returning `11:30` from `type="time" step="1"` would otherwise make every
  unchanged time look changed and block personal-only saves outright. Both save
  paths now `showUserMessage` (personal vs. everyone), because `editBellStatus`
  dies with the modal. Confirm relabelled to describe the whole modal. Dead
  `edit-bell-visual-override-checkbox` deleted (shown to admins, never read).
  V4.95 sound-disable listener deleted (it revoked sound editing from any admin
  who ticked then unticked). See CHANGELOG V6.20.4.
  **ANSWERED AND FIXED (6.22.0, round 9): the invariant was NOT holding.** It
  can, and it did — the modal rebuilds its bell from the rendered row's `data-*`
  attributes, and module 14 renders CALCULATED times (shift + Verb B transforms
  folded into merged copies). The shared save path writes into
  `currentSchedule.periods`, the PRISTINE document. So a shared-bell save of ANY
  kind during a shift wrote the adjusted time into the base, permanently rebasing
  the bell for every user, silently. Round 8 was right that it "would affect what
  gets WRITTEN back," and right to flag it as cheap to settle.
  §4.6 was true of the VARIABLE and false of the SCREEN — see the new §9 lesson.
  Fixed by `findStoredSharedBell()` + populating the modal from the stored bell;
  `resolveAllBellTimes({pristine:true})` for a base-space proximity check; the
  time input locked for stored-relative bells; and `updatePeriodsOnEdit`
  preserving `relative` (see CHANGELOG V6.22.0 before changing any of it).
  **NOT DONE, and the reason matters:** the same bug exists on the SCHOOL channel
  (5.79.x — `temporaryShift` landed in v5.74), and the owner is the only admin,
  i.e. exactly the person who can trigger it. Building (5.69.5) predates the
  shift entirely and is unaffected. If the school channel is ever pushed, port
  this before the 6.20.4 confirm fix — a swallowed edit is an annoyance, a
  rebased bell is wrong data for ~50 people.
- **HISTORICAL (kept for the reasoning trail; superseded by the entry above):**
  Reported 2026-08 on ALL THREE channels: alpha 6.20.0, beta 6.11.0, AND 5.69.2.
  **5.69.2 predates every change in round 7**, so a shared BACKEND cause is far
  more likely than app code: firestore.rules, the admins/{uid} record, the appId,
  or the schedule document itself (e.g. size/shape). RULED OUT so far: admin
  DETECTION works — the untagged-teacher nudge and the overlap "Fix..." button
  only render for a server-confirmed admin, and the owner sees both; and
  firestore.rules still reads `allow write: if isAdmin(appId)` on
  public/data/schedules/{scheduleId} with isAdmin() = exists(admins/{uid}).
  LEAD (2026-08, strongest yet): the owner's console showed NO errors, only
  `Delaying calculation: base and personal schedules have not both loaded`
  (18-bell-crud-and-modals.js). That guard (v4.32, so it predates round 7 and
  exists in 5.69.2 too — explains the all-versions repro) returns early whenever
  activePersonalScheduleId is set and isBaseScheduleLoaded/isPersonalScheduleLoaded
  is false. Both flags are set ONLY inside onSnapshot SUCCESS callbacks in
  16-schedule-management.js (lines ~369 base, ~439 personal) and NEITHER listener
  passes an error callback => a failing/never-firing listener freezes rendering
  silently and bell edits look impossible. 6.20.3 adds a 6s fail-open watchdog +
  a guard message naming the missing listener. NEXT: get the `[Watchdog]` line
  from the owner to learn WHICH listener fails, then fix the real cause (suspects:
  a stale activePersonalScheduleId pointing at a deleted personal schedule, or the
  personal onSnapshot erroring silently — consider adding real error callbacks to
  both onSnapshot calls, which is the proper follow-up fix).
  ALSO RULED OUT 2026-08 (owner supplied current firestore.rules; do not re-check
  these): (a) RULES PERMIT IT — public/data/schedules/{scheduleId} has
  `allow write: if isAdmin(appId)` and isAdmin resolves TRUE for the owner (the
  client read the same admins/{uid} doc to enable admin mode, and the untagged
  nudge + overlap "Fix..." button both render, which are admin-gated); (b) the
  EDIT AUDIT LOG cannot block a save — edit_log denies update/delete to everyone,
  which looked like a trap, but 22-audit-log.js logScheduleEdit() uses addDoc()
  (always a fresh random id = create), fire-and-forget with its own .catch(), and
  is never awaited; (c) NOT version-specific (5.69.2 fails too).
  => Remaining suspects are CLIENT-SIDE JS or the SCHEDULE DATA itself. Note the
  test run surfaced the engine's own "circular dependency detected for bell" data
  guard — if a real bell in their schedule has a circular relative-anchor, the
  engine skips it; worth checking whether their live data trips that, and whether
  the edit modal's save handler throws before reaching updateDoc.
  DO NOT start editing code. Per the owner's own rule (§9 bug-report discipline),
  get a diagnostic FIRST: (1) the browser console error text when a save fails
  (a `permission-denied` points at rules/appId; a TypeError points at client
  code); (2) whether the edit modal opens at all vs. the save silently failing;
  (3) the size of the schedule doc (Firestore hard-caps documents at 1 MiB —
  worth checking, since edit_log/periods have grown all year).
  NOTE: the false lunch-overlap alarm (fixed in 6.20.2) appeared on the very edit
  the owner was attempting, so confirm whether editing works once 6.20.2 is up —
  they may be linked, but do not ASSUME it.
- **Period collision resolver — SHIPPED 6.17.0/6.17.1 (detection 6.16.0 +
  engine 1.12.0 planOverlapResolution + module 37 preview-before-apply modal
  (shrink/push/spread), write via module 18's existing periods-only save. What
  could still be REFINED (not required): 'spread' currently tightens the GAPS
  between checked periods (each keeps its length); a second mode that shortens
  the PERIODS themselves (moving only their end-side bells — fiddly in the
  name-derived model, and undefined for single-bell periods) is possible if
  the owner wants it — they were told, and the preview makes the current
  behavior explicit. Do it as an engine 'spread-shorten' strategy + a UI
  toggle; test hard.
- **Wall-clock follow-along — COMPLETE (publisher 6.19.0 + reader 6.20.0).**
  config/{id} was already public-read (firestore.rules), so NO rules change;
  feed lives at config/clock_feeds { feeds: { <scheduleId>: {date, periods} } }.
  6.19.0: module 20 publishClockFeeds() (admin-only) composes today's clock-
  targeted transform recipes per schedule and writes flat resolved periods;
  module 34 "Show on clocks" checklist stores clockScheduleIds on the transform
  entry (explicit). 6.20.0: old.html fetchClockFeeds() (ES5, via parseFields)
  caches the feed; loadPublicSchedule prefers feeds[itsScheduleId] when date ===
  localDateStr(today), applying the emergency shift on top; fail-open to base;
  fetched before each load at the dropdown + 5-min-refresh call sites. md5 now
  e56f1e4c50c597cfe9e5618e0b53c732 (was b8dd5f5a…). POSSIBLE FUTURE work (not
  needed): base-designation-for-clocks (write the designated base's periods to
  the feed — same mechanism); a clock could also read the feed at BOOT (today
  it uses cached bells at boot and corrects on the 5-min refresh — fine for a
  standing TV, but a fresh boot shows base until the first refresh).

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

DEPLOY DOC (owner request, post-6.20.0): there is now ONE rolling `DEPLOY.md`
(kept OUTSIDE the zip), REWRITTEN each release to describe only the current
release + current live state. Do NOT create per-release DEPLOY-6.x.md files
anymore (the old pile was collapsed into DEPLOY.md). It carries the standing
file-by-file "what actually needs uploading" table, so each release just fills
in what changed + a concrete smoke test.

## 9. Working with this user

- **AN INVARIANT ABOUT A VARIABLE IS NOT AN INVARIANT ABOUT A SCREEN (round 9).**
  §4.6 promised that "edit modals never see (or save back) shifted times," and
  the code backing that promise was correct: `state.localSchedulePeriods` really
  does stay pristine. The modal reached the same numbers anyway, by a second
  route nobody had drawn — module 14 renders CALCULATED times into `data-*`
  attributes, and the modal rebuilds its bell from the DOM. Four rounds of
  documentation asserted safety that the data flow did not provide.
  Generalise: when an invariant is phrased as "X stays clean," ask what ELSE
  carries X's values. Rendered attributes, cached copies, event payloads and
  audit records are all places a value can arrive from. **Grep for the consumers,
  not the guarded variable.** The cheap check is to ask, of any value about to be
  WRITTEN: which coordinate space is this in, and is it the same space as the
  destination? Here the modal read display-space and wrote storage-space.
- **THE OWNER'S SCREENSHOTS KEEP OUT-EARNING THE BATTERY (round 9 confirms
  round 8).** Three of this round's six fixes came from one screenshot and two
  sentences of description: a wrapped button, a banner that named someone the
  list could not show, and a count that disagreed with its own examples. The
  battery is blind to all three — they are not syntax, not linkage, not tests.
  A fourth (`bg-amber-50` is not in the compiled CSS, so a new banner would have
  been transparent in dark mode) was caught only by checking the compiled output
  rather than assuming a Tailwind class exists. **Before shipping any new class,
  grep tailwind.css for it.** `verify-css` checks sentinels, not your new class.
- **PRESENCE ≠ ROSTER (round 9; useful whenever Layer 3 comes up).** Signing in
  writes `presence/{uid}`; it does NOT create `roster/{uid}`. Anything that
  counts one and displays the other will disagree, and the admin sees a name they
  cannot act on. "Seed from presence" is the bridge, and until 6.22.0 nothing
  said so at the moment of confusion.

- **TESTS DRIFT OUT OF THE REPO — CHECK THE COUNT EVERY ROUND (round 8).**
  Arriving from a GitHub download, `npm test` reported a green **51/51**; the
  owner's handoff zip had **74/74**. `tests/bell-engine.test.mjs` on GitHub was
  stuck at 41 engine tests while the zip had 64. Cause is structural, not
  carelessness: DEPLOY.md's upload manifest correctly omits `tests/` (runtime
  never loads it), so tests written during a session reach the zip and never the
  repo. Consequence: five engine functions from rounds 8–11
  (`planOverlapResolution`, `detectPeriodOverlaps`, `resolveCalendarTransforms`,
  `mergeCalendarEntry`, `applyRecipeToPeriods`) had ZERO coverage in the repo,
  and the whole collision resolver sat behind a green checkmark that meant
  nothing. 6.20.4 restores the file and adds `tests/` to the upload list on any
  release that touches it. **On arrival, always: (a) confirm which artifact you
  were given — repo download or handoff zip; (b) if a zip is available, diff it
  against the repo before editing; (c) sanity-check the test count against the
  number this file claims.** A battery you cannot trust is worse than none,
  because it licenses exactly the blind refactoring §4.4 depends on it for.

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
- **old.html IS NOW TOUCHED (6.20.0), md5 e56f1e4c50c597cfe9e5618e0b53c732.**
  It stayed byte-identical (b8dd5f5a…) the whole round until the wall-clock
  reader. It's ES5 (iOS 9): NO const/let/arrow/template-literals/spread — use
  var/function/string-concat. It has a generic REST parser (parseFields/
  parseFieldValue), localDateStr (YYYY-MM-DD), and applyShiftToScheduleData
  (emergency shift on static bells); it pins to a public schedule id in
  localStorage; the 5-min auto-refresh (setInterval → refreshScheduleBtn.onclick)
  is how a running TV picks up changes. Syntax-check by extracting the single
  <script> block and node --check-ing it. NO automated md5 assertion — the lock
  is doc discipline; RE-RECORD the md5 (header + §7 + §10) whenever it changes.
- **REFRESH DROPPED THE EMERGENCY SHIFT (fixed 6.20.0):** old.html's initial
  fetchPublicSchedules stored `data: applyShiftToScheduleData(fields)` but the
  5-min refresh's public branch stored `data: fields` (raw), so a shift set
  before a refresh vanished on the next refresh. Now both apply the shift.
- **ENGINE VERSION CONSTANT DRIFT (found + fixed 6.16.0):** the header
  comment `* Version: X` and the runtime constant `BellEngine.VERSION` are
  bumped SEPARATELY, and NOTHING in the battery verifies the constant. Twice
  (1.9.0, 1.10.0) a str-replace bumped the header but missed the constant, so
  the status modal under-reported the engine as 1.8.0 for two releases. When
  bumping the engine: change BOTH, and grep the CONSTANT (VERSION: '1.X.Y')
  to confirm it took — not just the header. Cheap future guard: have
  verify-esm assert the constant matches the header comment.
- **SW UPDATE-UX — TOAST REMOVED 6.20.1 (owner disliked it TWICE).** History:
  6.15.0 fixed a false hard-refresh toast by gating on wasControlledAtLoad; but
  that STILL showed the toast on a normal post-deploy boot (controlled load,
  new SW installs) — correct-in-theory, but pure noise on an unattended clock,
  which the owner reported (with a screenshot of a clock). Resolution: DELETE
  the toast; rely on skipWaiting+clients.claim (already in the SW) to activate
  the new version, and silently window.location.reload() ONCE on
  `controllerchange`, guarded by (a) wasControlledAtLoad (never first-install /
  hard-refresh) and (b) no open [data-modal] (never interrupt an admin edit).
  LESSON: this app is fundamentally a DISPLAY — prefer silent self-update over
  any "click to update" UX. Do NOT reintroduce an update popup.
- **(historical) SW UPDATE-TOAST GOTCHA (6.15.0, superseded by 6.20.1):** the "New version available!"
  toast (module 99) must NOT read navigator.serviceWorker.controller LIVE
  at the new worker's statechange — this SW uses skipWaiting + clients.claim,
  so a freshly-installed worker races to claim the page and flips
  controller truthy even on a HARD refresh (uncontrolled load), firing the
  toast when the user already has the latest. Capture
  `wasControlledAtLoad = !!navigator.serviceWorker.controller` ONCE at
  registration time and gate on that instead. If you ever revisit the SW
  lifecycle: skipWaiting/claim is deliberate so the wall-clock TVs (which
  never close a tab) auto-update — don't remove it to "fix" update UX.

## 10. Session log (Claude instances, per the owner's naming convention)

Each Claude instance names itself once it has learned the project, records
the reasoning here, and never reuses a predecessor's name. (Names used on
the owner's OTHER projects — e.g. Tentacalendar's Inky and Otto — are also
off-limits.) Rounds 1–2 predate this log and went unnamed.


- **Round 10 (2026-09): "Plain Bob."** Named for the first change-ringing method
  every ringer learns — the one where bells ring in a CHANGING sequence rather
  than straight down the scale. Fitting for the round that made each bell in a
  queue differ from the last. (Grandsire and Stedman, also methods, were already
  taken by rounds 6 and 7.)
  Arrived cold to a zip; §5 battery green on arrival and matching the handoff
  exactly (6.22.0, SW 1.34.0, 74/74, 41 modules) — the handoff's belief was
  ground truth this time.
  Shipped **6.23.0** (per-timer graphics in the Quick Bell Queue) and **6.24.0**
  (save a queue as a Quick Bell). KEY FINDING for the first: most of the feature
  already existed — the V5.55.0 queue always varied SOUND per step; only the
  picture was queue-wide. Module 10 needed no change at all because its visual
  key was already `queue:<index>:<repeat>`. Worth internalising: before building
  what the owner asks for, check how much of it the codebase already does. He
  described this as "could be clunky to add" and it was five files.
  KEY FINDING for the second: module 15's quick-bell snapshot handler is a
  WHITELIST mapper, so `alwaysBroadcast` had been silently dropped on every
  reload since V5.65.0. Fixed, and the whitelist is now labelled as one. Suspect
  the same pattern anywhere else a Firestore doc is rebuilt field-by-field.
  ALSO: reconstructed the **missing V6.22.0 CHANGELOG entry** — round 9 shipped
  the code but never wrote it, while module 16 tells its reader to "see CHANGELOG
  V6.22.0 before changing any of it." If round 9's own account ever surfaces,
  prefer it.
  Also shipped **6.25.0** (per-step queue labels; the skip/unskip bell modal),
  **6.25.1** (a bell set to "Silent / None" rang the DEFAULT bell — playBell had
  no case for `[SILENT]`, so it was looked up as a Storage path, 404'd, and the
  catch's fallback rang ellisBell.mp3), and **clock.html v1.8.0** (same bug on
  that surface, different shape: playBellSound took no argument at all).
  SEVEN releases this round: 6.23.0, 6.24.0, 6.25.0, 6.25.1, clock v1.8.0, plus
  the reconstructed 6.22.0 changelog entry and ROADMAP.md itself.
  PATTERN WORTH CARRYING: three of the five bugs found this round were the same
  shape — a feature that exists at one layer and is missing a case at another
  (`alwaysBroadcast` absent from module 15's whitelist mapper; `[SILENT]` absent
  from playBell; per-bell sound absent from clock.html). `old.html` handled
  `[SILENT]` correctly the whole time, which is the tell: when something works on
  the old page but not the app, suspect the 6.0.0 modularization dropped it.
  OPEN BUG found this round and NOT fixed — see ROADMAP.md §3b: a stale
  `quickBellEndTime` pins a quick bell's icon to the display until reload,
  because module 10's Priority 3 gate tests `millisToQuickBell < Infinity`
  without checking the time is still in the FUTURE. The queue's teardown was
  read in full and is clean; the queue is the trigger, not the cause. A console
  diagnostic for the owner to run at the moment it recurs is in §3b — get that
  before fixing, and do not fix blind.
  ALSO: created **ROADMAP.md** at the owner's suggestion. A roadmap existed (§7)
  but was unreadable as a planning doc — priorities interleaved with closed bugs
  and reasoning trails across a 1,568-line file. ROADMAP.md is the one-page
  index; §7 stays the source of truth for WHY. Keep them in sync.
  METHOD NOTE, reusable: the round-4 jsdom harness still works and is cheap.
  Recipe for a fresh container — `npm i --no-save jsdom`, load index.html into
  JSDOM, `dom.window.eval(bell-engine.js)` first (module 00 reads
  `window.BellEngine` at eval time), and register a tiny loader hook mapping
  `https://` specifiers to a stub module that exports every Firebase name found
  across `src/js`. Force `process.exit()` at the end or jsdom's timers hang the
  run. 49 assertions across the two features, including a round trip through
  module 15's ACTUAL mapper source rather than a copy of it.
  Successor: names taken are Quasimodo, Whitechapel, Bourdon, Grandsire II,
  Stedman, Sally, Gudgeon, Plain Bob (+ Inky and Otto on Tentacalendar). FOUR
  releases are now built and undeployed — confirm deploy state before anything
  else, and read ROADMAP.md before §7.
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
  now READ config/clock_feeds; md5 e56f1e4c50c597cfe9e5618e0b53c732, was b8dd5f5a4c8fed0765c982a9ccc43204 until 6.20.0). DEPLOY-6.5.0.md
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
- **Round 7 (2026-07, Opus behind a routed Fable session): "Stedman."**
  Named for Fabian Stedman — the founder of change-ringing theory — and
  his eponymous method, one of the most elegant ways of ringing the
  changes. Fitting: round 6 ("Grandsire II") cast the Verb B method's
  rules but left them dormant; THIS round set the bells actually ringing
  in transformed order — Verb B is wired and live-capable. Arrived cold
  via the zip + loose HANDOFF; ran the §5 battery on arrival — all green
  (canary-tested lint failed-then-reverted; 65/65 tests; check:all exit 0;
  38 modules parse; old.html ES5-clean and md5-identical to Bourdon's
  record e56f1e4c50c597cfe9e5618e0b53c732 (was b8dd5f5a4c8fed0765c982a9ccc43204 pre-6.20.0); index triple at 6.11.0; SW
  1.17.0). FIRST FINDING, from the owner not the code: the inherited
  handoff said "nothing past 6.4.0 is live" — WRONG; the owner had
  deployed the whole 6.5→6.11 stack and confirmed 6.11.0 live (Building
  Bells screenshot: anchors survived the anchor-strip fix, lock-note reads
  right with admin on/off). §2 corrected; the "handoff deploy-state is the
  previous session's belief, not truth — confirm with the owner" lesson
  earned again. Then, on "wire verb B, friend," SHIPPED 6.12.0: the
  three-part wiring §7 specified (resolution path modules 20→14 mirroring
  the emergency shift; recipe-builder UI in module 34; I1 banner extended)
  — details in §6/§7/CHANGELOG. Key facts for the successor: (a) chose
  module 14's resolveAllBellTimes as the application point over §7's
  "module 16 sites" suggestion — 16 is where the shift is STORED, but 14
  is where it's APPLIED to merged copies, and that's the invariant that
  keeps localSchedulePeriods pristine (§4.6); recipes fold onto base
  COPIES pre-merge for the same reason. (b) transforms are independent of
  Verb A — refreshActiveTransforms runs before the base-switch guards, so
  a teacher on their normal base still gets transformed. (c) extend target
  stored by NAME not periodId, on purpose (one recipe fits every schedule
  with a like-named period). (d) describeRecipe is exported from 20 and
  reused in 34 so the banner and the entry list can't drift. (e) engine
  UNTOUCHED (1.8.0) — this was pure glue + UI; the +1 test is a pipeline
  test that folds recipes exactly as module 14 does. 6.12.0 is a
  files-only single deploy on live 6.11.0 (DEPLOY-6.12.0.md), NO rules
  change. Battery green post-change (66/66). NEXT SLICE (§7 Layer 4): the
  prefill calendar GRID with generators (desktop-grade; the day-of modal
  already covers I2), then the long pole — WALL-CLOCK FOLLOW-ALONG, which
  needs precomputed resolved times in the calendar doc (I3) + a REST rules
  carve-out so ES5 old.html can read designations AND transforms without
  doing recipe math. Names taken: Quasimodo, Inky, Otto, Whitechapel,
  Bourdon, Grandsire (+"Grandsire II"), Stedman.
  SAME SESSION, owner deployed 6.12.0 ("6.12 is live, Stedman — please
  continue!") and said continue: SHIPPED 6.13.0, The Prefill Grid (Layer 4
  "plan the weeks", first of its two planning UIs). New module 35 —
  a navigable 6-week calendar that reads config/schedule_calendar, opens
  the day-of modal (34) preset to any clicked date, and repeats a day's
  plan weekly. Deliberately reused 34's authoring instead of
  reimplementing it — grid hides while 34 is up and reshows via
  CustomEvents (ellis-designation-closed / ellis-calendar-changed) so 34
  never imports 35 (cycle-free). Also EXTRACTED the base-dedup/
  transform-append rule from 34 into engine 1.9.0's mergeCalendarEntry —
  pure, tested (67/67), shared by the modal and the grid copy-forward
  (the 6.8.0 "extract-and-prove" pattern again; module 34 rewired to call
  it, behavior identical). SCOPE CALL: deferred the rotation-cycle
  generator (slip-forward / calendar-locked) — the design itself flags it
  aspirational/for-other-schools (Ellis doesn't rotate), so shipping the
  grid + repeat-weekly as a bounded, useful-alone release was the right
  cut; rotation is documented as the next grid bite in §7. 6.13.0 is
  built + battery-verified (67/67, 39 modules, check:all exit 0,
  canary'd lint on the 39-module tree, old.html untouched) but NOT yet
  deployed at time of writing — DEPLOY-6.13.0.md is files-only, NO rules
  change, but adds one NEW module (verify it uploads). Successor: confirm
  6.13.0 deploy state with the owner first; then either the rotation
  generator (finishes the grid) or the wall-clock follow-along long pole.
  STILL SAME SESSION (owner: brainstormed a batch of ideas, approved the
  "invariant-safe" path, "make that CDC teacher's life as simple as
  possible!", "continue"): first gave a FEASIBILITY read (see below), then
  SHIPPED 6.14.0, Home Schedule. The owner's ideas and how they landed:
  (a) TEMPLATE / tag-assign / "Ms. Johnson automagically" → built as a
  per-teacher HOME schedule (roster.defaultScheduleId), set explicitly
  per-uid, in bulk via a filter→schedule→"set for all matching" template.
  This is the invariant-safe reading the owner approved: tags filter the
  picker, an explicit per-person default is stored, nothing resolves a tag
  at ring time — so CDC (3 grade tags) is set to one schedule directly.
  (b) "people like me" linking a custom copy to the base → EXPLAINED it's
  already the model (personal schedule carries baseScheduleId; relative
  bells anchored to base period edges survive base edits + Verb B
  transforms for free — verified in the 6.12.0 wiring). The gap is
  alternate-BASE transfer (switch a personal user to a different base and
  carry the overlay) — still the unbuilt Layer 2 last slice. applyHomeSchedule
  deliberately NEVER yanks a personal-schedule user, protecting exactly
  this case. (c) stretch-into-4th collision resolver with spread-across-
  checkboxes → feasible on the existing period-edge math (the shorten
  recipe already cascades), but it's a new recipe archetype + a live
  collision modal = its own release; deferred. (d) untagged-teacher nudge
  → the natural next slice, rides presence+roster; deferred as its own
  bite (pairs with 6.14.0). METHOD: module 20's resolution was
  RESTRUCTURED (mandate vs home) — the risky bit — so I preserved the
  scoped/exception/weekday behavior exactly (applyMandate reproduces the
  old path; engine split proven by tests) and made home purely additive
  and silent. 6.13.0 + 6.14.0 both built + battery green (68/68) but
  UNDEPLOYED at close. Successor: confirm what's live; then the untagged
  nudge, the rotation generator, or the alternate-base/wall-clock long pole.
  STILL SAME SESSION (owner: "Let's do untagged teachers," then next turn
  "6.14 is live" + reported a bug): confirmed 6.13.0 + 6.14.0 LIVE, then
  SHIPPED 6.15.0 = untagged-teacher nudge (module 36) PLUS a bugfix the
  owner flagged — the "new version available" toast firing on every hard
  refresh. Diagnosed precisely (controller read LIVE at statechange races
  skipWaiting/claim on an uncontrolled hard-refresh load) and fixed by
  capturing wasControlledAtLoad up front (see the new §9 gotcha); kept
  skipWaiting/claim so the TVs still auto-update. Bundled feature+fix into
  one y-release since the nudge was already done in-tree; told the owner
  they could split if they wanted a fix-only hotfix. Process note: a
  malformed `grep … | head file` (grep reading stdin) HUNG a bash call into
  the timeout — after a timeout, CHECK tree state before re-running bumps
  (the sed edits had already landed; only the trailing grep hung). 6.15.0
  battery-green (68/68, 40 modules), UNDEPLOYED at close. Backlog unchanged:
  rotation-cycle generator, stretch/spread collision resolver, alternate-
  base transfer + wall-clock follow-along. Names taken: Quasimodo, Inky,
  Otto, Whitechapel, Bourdon, Grandsire (+"Grandsire II"), Stedman.
  STILL SAME SESSION (owner: "6.15 is live, not notifying me now" [toast fix
  confirmed], "continue with the plan"): SHIPPED 6.16.0, period overrun
  DETECTION — the safe first half of the collision resolver the owner
  dreamed up. Investigated the period model first (name-derived groupings,
  no explicit boundaries — see §3) and made a deliberate SCOPE CALL:
  overlap detection is a heuristic and the interactive fix is destructive
  multi-bell surgery on the sacred live-edit path, so I shipped a READ-ONLY
  detector (engine 1.11.0 detectPeriodOverlaps + module 37 red banner) and
  DEFERRED the shrink/spread/allow resolver until the owner confirms the
  warning reads their real schedules without false positives. Told the owner
  exactly that and asked them to report any cry-wolf. Also caught + fixed a
  latent bug while in the engine: BellEngine.VERSION had been stuck at
  '1.8.0' for two releases (header bumps missed the constant; battery
  doesn't check it) — now 1.11.0, logged as a §9 gotcha with a suggested
  guard. 6.16.0 battery-green (69/69, 41 modules), UNDEPLOYED at close.
  Backlog now: the collision RESOLVER (the fix half — §7), rotation
  generator, alternate-base transfer + wall-clock long pole.
  STILL SAME SESSION (owner: "warning works, it's awfully subtle though...
  what's left and what do you recommend?" → I laid out the roadmap and
  recommended the resolver; owner: "make it bolder and do the collision
  resolver. Go team!"): SHIPPED 6.17.0 = the collision RESOLVER + bolder
  banner. Investigated the write path FIRST (periods is the source of truth,
  reader falls back to legacy bells only if periods empty — so a periods-only
  write like the delete-period path is safe) and the bell shape (static =
  no .relative; relatives carry {parentBellId, offsetSeconds} and MUST NOT be
  moved). Engine 1.12.0 planOverlapResolution does the math purely (3
  strategies, static-only), module 37 previews before applying, module 18
  writes via an event (no 18↔37 cycle). The whole thing is gated to admin +
  SHARED schedule and every apply is preview-first, so the destructive part
  is guarded three ways (preview, static-only, periods-only proven write).
  SCOPE NOTE: 'spread' v1 tightens gaps (periods keep length) rather than
  shortening the periods themselves — told the owner, offered the refinement,
  preview shows the truth. 6.17.0 battery-green (70/70, 41 modules),
  UNDEPLOYED at close. Backlog now: 'spread-shorten' refinement (optional),
  rotation generator (low pri), alternate-base transfer + wall-clock long
  pole. Names taken: Quasimodo, Inky, Otto, Whitechapel, Bourdon, Grandsire
  (+"Grandsire II"), Stedman.
  STILL SAME SESSION: owner reviewed 6.17.0 (not yet deployed) and asked for
  two tweaks + floated a new idea. Shipped 6.17.1: (1) "Protect in-between
  times" checkbox, DEFAULT ON, on Spread — passing periods are a hard floor
  (bathroom math), so the overlap now comes out of the periods' own length by
  default (engine 1.13.0 protectGaps); (2) demoted "Push later" to 3rd + a
  playful dismissal-change confirm. Then a LONG, valuable design conversation
  about a NEW feature the owner dreamed up — "Reclaim a period" (kill FLEX for
  the day, redistribute its time, dismissal pinned). Nailed the spec together;
  the KEY correction the owner made (twice — I got the bracket wrong both
  times): the freed span is [PREVIOUS period end → RECLAIMED period end], which
  sacrifices the INCOMING passing period and PRESERVES the OUTGOING one (so
  adjacent classes keep a passing period). Full spec now in §7. It's a per-day
  Verb B recipe (ephemeral, never a dropdown entry — owner was emphatic about
  not cluttering the 7×+TCAP+concessions selector). NOT YET BUILT — that's the
  next build. 6.17.1 battery-green (71/71, 41 modules), UNDEPLOYED at close
  (supersedes 6.17.0).
  STILL SAME SESSION (owner: "Hop to it!"): BUILT 6.18.0, "Reclaim a period"
  — the feature designed the previous turn. engine 1.14.0 'reclaim' archetype
  (added to applyRecipeToPeriods so it rides the Verb B pipeline wired in
  6.12.0 — no new plumbing). The math is the owner's magic trick: remove FLEX,
  free [prev.end → reclaimed.end] (26 min for FLEX = 22 + the 4-min incoming
  passing period), spread evenly across survivors, dismissal PINNED → every
  class grows. Verified with 2 tests (FLEX-as-last, and a mid-period case
  proving the OUTGOING passing gap is preserved). Recipe-builder UI in module
  34 (3rd type + period-name datalist); describeRecipe in 20. Owner emphatic
  this NEVER becomes a dropdown entry — one-day calendar transform,
  delete-to-undo, base pristine. Documented the one v1 edge (relatives
  anchored INTO the reclaimed period orphan-fallback for the day). 6.18.0
  battery-green (73/73, 41 modules), UNDEPLOYED at close (one push covers
  6.17.1 + 6.18.0). Backlog: reclaim refinements (re-home orphaned anchors;
  absorb-checkboxes), rotation generator (low pri), alternate-base transfer +
  wall-clock long pole. Names taken: Quasimodo, Inky, Otto, Whitechapel,
  Bourdon, Grandsire (+"Grandsire II"), Stedman.
  STILL SAME SESSION: owner noticed "Shrink" (the resolver's default strategy)
  didn't protect passing periods like Spread does — it butted the next period
  against the overrun's end. Shipped 6.18.1: engine 1.15.0 'shrink' honors
  protectGaps (default true), leaving a passing period sized from the next
  period's own outgoing gap (fallback: smallest positive gap). Moved the
  "Protect in-between times" checkbox out of spread-only so it governs Shrink +
  Spread (hidden for Push). Good exchange confirming the mental model: passing
  periods are NOT stored — they're measured space between bells (next.start −
  this.end); "protecting" them is arithmetic, same as the whole name-derived
  period model. 6.18.1 battery-green (73/73, 41 modules), UNDEPLOYED (one push
  covers 6.17.1 + 6.18.0 + 6.18.1).
  STILL SAME SESSION (owner picked option A — explicit clock targeting — and
  said "whatever scope makes sense"): BUILT 6.19.0, the wall-clock feed
  PUBLISHER (split the arc: publisher now, old.html reader = 6.20.0, so the
  feed can be verified in the console before touching the md5-locked clock).
  BIG SIMPLIFICATION found mid-build: config/{id} is ALREADY public-read in
  the rules, so the feared rules carve-out isn't needed — the feed lives at
  config/clock_feeds (told the owner; I'd previously said this arc touches
  rules, it doesn't). Also confirmed old.html already pins to a public
  schedule id and already resolves periods/relatives/shift in ES5 — so the
  reader just needs to feed it TRANSFORMED periods, not teach it recipe math.
  publishClockFeeds is admin-only (write rules), composes per-schedule,
  self-expires stale feeds by date, resets same-day removals to base. "Show on
  clocks" picker in module 34 stores clockScheduleIds (explicit). 6.19.0
  battery-green (73/73, 41 modules), old.html still byte-identical (untouched;
  its turn is 6.20.0), UNDEPLOYED (one push covers 6.17.1 → 6.19.0). NEXT:
  6.20.0 old.html reader (see §7) — the payoff, and the first old.html change
  all round.
  STILL SAME SESSION (owner: "push 6.19 and 6.20 at once... if you're confident,
  go — and do the handoff too"): BUILT 6.20.0, the wall-clock READER — the
  payoff. First touch of old.html all round (md5 b8dd5f5a… → e56f1e4c50c597cfe
  9e5618e0b53c732). Was honest with the owner mid-turn that I'd delivered
  nothing since 6.19.0 and was low on rope; they said go if confident, so I did
  ONE careful complete pass (no more recon): added ES5 fetchClockFeeds()
  (reuses parseFields), a feed-override in loadPublicSchedule (prefer
  feeds[scheduleId] when date === localDateStr(today), copy periods, apply the
  emergency shift on top, fail-open to base), and wrapped both loadPublicSchedule
  call sites (dropdown + 5-min refresh) so feeds are fetched first — race-free.
  Boot uses cached bells and corrects on the refresh (fine for a standing TV).
  Verified: extracted the single <script> block + node --check (SYNTAX OK), ES5
  scan clean, main-app battery 73/73. Also fixed a pre-existing bug found in
  passing: the 5-min refresh stored schedules WITHOUT the emergency shift (boot
  applied it) — shifts were dropped on refresh; now both apply it. NO rules
  change (config already public). The whole wall-clock arc is COMPLETE. 6.20.0
  battery-green, UNDEPLOYED (one push, incl. old.html, covers 6.17.1 → 6.20.0;
  cache-bust old.html on the TVs). Names taken: Quasimodo, Inky, Otto,
  Whitechapel, Bourdon, Grandsire (+"Grandsire II"), Stedman.
  POST-DEPLOY (owner deployed 6.17.1→6.20.0 in one push): (1) collapsed the
  19-file DEPLOY-6.x.md pile into ONE rolling DEPLOY.md (§8) with the file-by-
  file upload table. (2) Owner screenshot: the "New version available!" popup
  on a CLOCK, on boot → shipped 6.20.1: REMOVED the toast, replaced with a
  silent guarded auto-reload on controllerchange (§9 — the toast's 3rd
  appearance and its retirement; lesson: this app is a DISPLAY, never nag).
  6.20.1 battery-green (73/73), main-app-files-only (old.html untouched),
  UNDEPLOYED at close. Reached the natural resting point; remaining backlog
  (§7) is all optional.
- **Round 8 (2026-08, Opus behind a routed Fable session): "Sally."** Named for
  the woolly grip on a bell rope — the part you actually grab. Fitting for a
  round that was one long bug hunt: the job was working out which rope was
  attached to anything. (Quasimodo, Whitechapel, Bourdon, Grandsire/Grandsire
  II, Stedman, Inky and Otto are taken.)
  Arrived on a GitHub download WITHOUT the .md files and with a stale `tests/`
  (51 vs 74) — see the new §9 lesson; the owner supplied the docs and then the
  full handoff zip mid-round, and the zip's code proved byte-identical to the
  repo, so the edits were on the right base.
  **CLOSED THE §7 OPEN BUG** that rounds 5–7 chased into the backend: admin bell
  time edits were being swallowed by the V5.66.2 sound-checkbox gate, not by
  rules, the admins doc, the appId, document size, or the 6.20.3 load latch.
  Diagnosis came from the owner's repro plus CHANGELOG archaeology, and was
  CONFIRMED BY HIM BEFORE ANY CODE WAS WRITTEN (§9 bug-report discipline: the
  test was "tick the box and save" — thirty seconds, and it would have killed
  the theory just as fast as it confirmed it). Shipped 6.20.4 with four
  neighbouring defects found on the way: the dead visual-override checkbox, the
  V4.95 listener that revoked sound editing, the watchdog's false alarm on every
  shared-schedule selection, and three `onSnapshot` calls with no error handler.
  Also restored the CHANGELOG's 4-line header (lost in an earlier round; §4.7
  refers to it) and the missing 23 engine tests.
  **Then shipped 6.21.0** at the owner's request after he deployed 6.20.4 and
  confirmed the bell-time fix live: Duplicate Selected Schedule (the bellId
  regeneration decision is documented in the function header AND in CHANGELOG
  V6.21.0 — read it before changing how duplication works), plus the greyed
  rename button and the dark-mode banner contrast, both spotted by the owner in
  post-deploy screenshots. Note the pattern in those two: BOTH were things a
  user could SEE were wrong that no verifier could catch. The battery is blind
  to contrast and to whether a disabled button ought to be disabled. Screenshots
  from the owner are worth more than another lint pass; ask for them.
  **Successor:** the one loose thread is the emergency-shift question in §7 —
  cheap to settle, worth settling. Beyond that §7's backlog is optional, and the
  owner's stated priority order (cost, student outcomes, stability) has not
  changed. If you find yourself concluding "this must be backend because it
  predates our changes," re-read the METHOD LESSON in §7 first.
- **Round 9 (2026-08): "Gudgeon."** Named for the pins a bell pivots on —
  invisible in every photograph of a bell, catastrophic when worn. Apt for a
  round that opened by checking an invariant nobody could see. (Quasimodo,
  Whitechapel, Bourdon, Grandsire/Grandsire II, Stedman, Sally, Inky and Otto are
  taken.)
  Arrived on a GitHub download WITH the .md files and a CORRECT 74-test suite —
  round 8's `tests/` restoration reached the repo, so §9's drift check passed for
  the first time. Full battery green on arrival, lint canary verified.
  **SETTLED THE §7 LOOSE THREAD, and it was not loose — it was load-bearing.**
  The emergency-shift question was a live data-corruption bug: shared-bell saves
  during a shift or transform rebased the stored bell for everyone. Shipped
  6.22.0 with that fix, a sibling `relative`-stripping fix in the same save path,
  and three defects the owner reported from the wild (overlapping bulk-template
  button; the untagged nudge naming people absent from the roster list its own
  Review button opens; its "4 people / 3 names" count).
  **The owner downgraded the backport** on good reasoning — he is the sole admin
  and the 6.20.4 bug only bit admin edits. Recorded in §7, along with the fact
  that the 6.22.0 bug is the one that actually reaches the school channel.
  **Successor:** round 8's two recommended sweeps are still unstarted and are
  still the right next move — (a) affordance (does each control's enabled state
  and label match what saving does), (b) dark-mode contrast of everything since
  ~6.9.0. Round 9 fixed one instance of each while chasing other things, which is
  evidence for doing them systematically rather than against it. Before touching
  the modal's time handling, read CHANGELOG V6.22.0 and the header of
  `handleEditBellClick`; both exist to stop the fix being undone by someone who
  thinks the rendered time is the real one.
