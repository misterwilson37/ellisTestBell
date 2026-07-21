# Ellis Web Bell — Changelog

Release history for the main app (src/js / index.html; script.js before 6.0.0). Sibling surfaces (clock.html, old.html, dashboard-config.html, service-worker.js) carry their own version notes in their file headers.

## V6.11.0 — Anchor-strip fix, dedup, firstSeen; Verb B engine (dormant)
(Bugfix + ride-along release. Verb B's ENGINE lands and is fully tested
but nothing calls it yet — same pattern as 6.10.0 shipping
resolveCalendarSchedule before its UI. Wiring is 6.12.0.)

- **bell-engine.js 1.8.0**: Layer 4 VERB B pure functions —
  resolveCalendarTransforms(cal, date, uid) collects verb:'transform'
  recipes scoped to a uid (they compose in entry order), and
  applyRecipeToPeriods(periods, recipe) applies one recipe immutably.
  Two archetypes: 'shift' (move static bells in a time range) and
  'shorten' (compress periods after a pivot to extend a named/id'd
  target, cascading, 60s floor). ONLY shared static bells move;
  relatives re-derive downstream (Layer 2 overlays survive). +5 tests
  — 65/65. NOT WIRED: no caller yet, so no behavior change ships.
- **ANCHOR-STRIP BUGFIX (module 30, the important one)**: the edit-bell
  anchor select was populated from the DOM-reconstructed bell object
  (99-init), which never carried buildingBellId — so it always showed
  "Not anchored", and the save path read that as an explicit unanchor.
  Any admin all-users time edit of an anchored bell SILENTLY STRIPPED
  its anchor (I0 field-stripping, reintroduced upstream of 6.5.0's
  fix). Now populate resolves the true anchor from state.localSchedule-
  Periods by bellId. Owner should re-run "Anchor matching…" on any bell
  whose count dropped since 6.5.0 (idempotent, safe on all six).
- **Designation dedup (module 34)**: saving a designation now strips
  each uid from existing base entries first (dropping emptied entries)
  before appending — per-person last-write-wins. Fixes "change my mind"
  silently losing to a stale earlier entry. Transform entries untouched.
- **firstSeen (module 28 + 29)**: presence writer stamps firstSeen once
  (session-guarded single getDoc; existing users get theirs on next
  sign-in, so for them it reads "since 6.11.0" — only brand-new users
  get a true first-login date). Dashboard gains a "First seen" column.
  TVs stay lastSeen-only (clock.html untouched).
- **Building-bell "0 anchored" nudge (module 30)**: zero-anchor rows now
  show an amber "0 anchored — use Anchor matching… →" instead of the
  quiet "no anchored bells yet", teaching the flow at the point of need.
- **Lock-note redesign (index + module 16/30)**: the edit-bell time note
  moved BELOW the input (was between label and input, shoving the field
  out of alignment with Bell Name). Two states: 🔒 locked (non-admin)
  and 🔓 amber "saving changes this for every user" (admin). When the
  bell is anchored, the note names the building bell — for everyone,
  not just admins.
- **service-worker.js 1.17.0**: no new modules; cache bump to ship the
  edited files. **NO rules change** (6.9.0's roster publish already
  covers everything).

## V6.10.0 — The Calendar Wakes: Layer 4 Verb A ships
(The v5.73.0 parked calendar is REVIVED — its park note demanded a
per-teacher assignment model, and Layers 2–3 built exactly that.)

- **bell-engine.js 1.7.0**: resolveCalendarSchedule(cal, date, uid) —
  v2 per-date SCOPED entries ({scope:[uids], verb:'base', scheduleId}),
  first scope hit wins, resolved PER USER; the v1 shape
  (exceptions/weekdayDefaults) remains the unscoped fallback and
  uid-less callers behave exactly as before. Flat/dumb/ES5 (I3).
  +2 tests — 60/60.
- **Module 20 REVIVED** (park note preserved as history in the file):
  the `enabled` flag is retired — presence of calendar data IS the
  enablement; every guard still fails closed. Manual choice today
  still wins, but deviation is now BANNERED (I1): amber, "Today you
  are designated to X", Follow (clears the manual choice, switches),
  dismiss-per-session. I4: the banner counts personal reminder bells
  whose recorded home base (6.8.0) differs from the designation.
- **NEW `src/js/34-day-designation.js`** + "Designate Schedules"
  (Admin Zone): the I2 day-of modal, and THE LAYER 3 FILTER-PICKER'S
  FIRST REAL USE — filter roster by tag or name, eyeball, check
  people; the explicit checked uid list is what's stored in scope.
  Entries listed per date with remove. Writes config/schedule_calendar
  (reserved since 5.73.0; covered by config rules — NO rules change).
- Verb B (transformation recipes on findPeriodEdgeAnchorBell) is the
  next slice; the entry shape already carries `verb` so recipes drop
  in additively. Prefill grid + generators follow.
- **service-worker.js 1.16.0** (38 modules); CSS rebuilt (31,001 B).

## V6.9.0 — Roster & Tags: design Layer 3 ships
(**FIRST RULES CHANGE of the 6.5–6.9 run — publish firestore.rules!**)

- **NEW Firestore path** `public/data/roster/{uid}`: { displayName,
  tags, capabilities }. Rules: read = any signed-in user; admins write
  anything; a user may write their OWN doc only if the capabilities
  field is absent-and-stays-absent or completely unchanged
  (request.resource.data is post-write state, so self-serve merge
  writes pass; self-granting 'may-break-anchors' is mechanically
  impossible, not just discouraged).
- **THE LAYER 3 INVARIANT** (owner decision, now carved into rules
  comments, module header, and admin UI copy): tags are PICKER
  FILTERS, never runtime targeting. Designation UIs (Layer 4) filter
  by tag, the admin eyeballs the list, and the EXPLICIT checked uid
  list is what's stored. CDC needs no special rule as a result.
- **NEW `src/js/33-roster.js`** + two surfaces: "My Tags" (header
  button; self-serve chips with one-click suggestions — 6th/7th/8th,
  subjects, CDC, Office; capabilities shown read-only) and
  "Roster & Tags" (Admin Zone modal; everyone's tags + amber
  capability chips, Enter-to-add, remove users, and "Seed from
  presence" which bootstraps rows for every human the usage dashboard
  has seen — clock surfaces excluded).
- **service-worker.js 1.15.0**: module 33 cached (37 modules).
- **tailwind.css rebuilt** (30,969 bytes) for the chip classes.

## V6.8.0 — The Shape Itself: Layer 2 slice 3
(The design's identity-anchor shape {baseScheduleId, periodId, edge,
offsetSeconds} is now fully realized in stored data, and the period-edge
primitive Layer 4 will stand on is extracted and tested.)

- **bell-engine.js 1.6.0 — `findPeriodEdgeAnchorBell(period, edge)`**:
  the V5.44.1 anchor-selection heuristic (shared static first/last,
  else anchorRole, else legacy "Period Start"/"Period End" names)
  extracted from calculateRelativeBellTime's inline block into a named,
  exported, tested primitive. Accepts both edge vocabularies ('start'/
  'end' per the design; 'period_start'/'period_end' as stored).
  Resolution behavior IDENTICAL — all 56 pre-existing tests passed
  untouched before the 2 new ones (58 total). This is the "period edge"
  every Layer 4 transformation recipe will operate on.
- **Module 16's duplicated inline copy** of the heuristic (edit-modal
  anchor prefill) now routes through the primitive — and that copy had
  DRIFTED: with only a wrong-edge anchorRole bell present it selected
  that bell for the opposite edge; the primitive correctly returns
  null and the select is left blank (matching resolution behavior).
  One implementation, one behavior, forever.
- **`baseScheduleId` recorded on anchors** at all four stamp sites
  (single relative, multi-add relative, shared backfill, personal
  migration — both silent and review paths): shared-origin parents
  record their home base; personal-period parents deliberately omit it
  (they travel with their owner). Additive as always. The full design
  shape maps onto stored data as: baseScheduleId ↔
  relative.baseScheduleId, periodId ↔ relative.parentPeriodId, edge ↔
  relative.parentAnchorType (deliberately NOT dual-written — the
  verbose stored vocabulary IS the edge field; duplicating it would
  invite drift), offsetSeconds ↔ relative.offsetSeconds.
- **service-worker.js unchanged (1.14.0)**: fetch strategy is
  network-first (verified), and the convention bumps CACHE_VERSION only
  when CORE_ASSETS changes — no new module this release.
- No rules changes; no CSS changes.

## V6.7.0 — Personal Anchor Migration: Layer 2 slice 2
(The user's own reminder bells go identity-keyed; every period-creation
site in the codebase now stamps ids at birth.)

- **NEW `src/js/32-personal-anchor-migration.js`**: personal_schedules
  are OWNER-ONLY writable, so this runs client-side on the user's own
  doc (the reason the 6.6.0 backfill couldn't touch them). Gentle 30s
  local classification (28-presence pattern, no reads); a write happens
  only when there's something to stamp, at most once per personal
  schedule per session, via read-modify-write of the user's doc.
- **Unambiguous anchors** (name matches exactly one id-bearing period
  in the merged view) are stamped SILENTLY; the name stays as the
  engine's fallback — never destructive.
- **Ambiguous anchors** (duplicated period names) are NEVER guessed: an
  amber banner (clock-drift pattern, dismissible per session) opens a
  review modal — per bell, pick the intended period (shown with its
  time span and personal/shared origin) or "Decide later (keep
  name-based)". This is the design doc's migration review modal.
- **Multi-add relative bells now identity-stamped** (the 6.6.0 IOU):
  the period checkboxes carry `data-period-id` from the merged
  calculatedPeriodsList (which preserves periodId), and the save loop
  stamps `parentPeriodId` when present.
- **Remaining creation sites stamped** (module 19): personal custom
  periods and both schedule-import converter sites now get periodId at
  birth. The import converter rebuilds periods from a name-keyed map,
  so incoming ids can't survive it by construction — fresh ids +
  name-fallback + later re-stamping is the correct behavior there.
- **service-worker.js 1.14.0**: module 32 cached (36 modules).
- No rules changes; no CSS changes; no engine changes (1.5.0's
  identity-first resolution already does the work).

## V6.6.0 — Period Identity: Layer 2's foundation ships (slice 1)
(Identity anchors begin. Periods finally have stable ids; renames stop
breaking reminder bells.)

- **THE PROBLEM:** periods were `{name, isEnabled, bells}` — no identity.
  Period-anchored relative bells resolved by NAME string match, so
  renaming "4th Period" orphaned every reminder bell hanging off it.
- **NEW optional `periodId`** on shared-schedule periods (additive; old
  clients ignore it and round-trip it by spread — audit answered).
  Stamped at period birth (both creation sites) via new
  `generatePeriodId()` in module 05 (`period_` + random8, bell-id shape).
- **bell-engine.js 1.5.0**: period-anchored resolution is IDENTITY
  FIRST — `relative.parentPeriodId` wins when a matching period exists;
  historical name match remains the fallback (old data keeps working).
  +2 tests (rename survival; fallback) — suite 56/56.
- **NEW `src/js/31-period-identity.js`** + "Assign Period IDs" in the
  Admin Zone: idempotent one-click backfill — every shared period gets
  an id; shared relative bells whose parentPeriodName matches EXACTLY
  ONE period get parentPeriodId stamped; ambiguous names (duplicates)
  are counted and SKIPPED, never guessed. One writeBatch + regenerated
  legacy bells arrays + per-schedule `period-identity-backfill` audit
  entries. Safe to run any time.
- **Single relative-bell creation** now stamps `parentPeriodId` when the
  anchor period has one. The multi-add relative site only holds period
  NAMES (merged personal view) — stamping there arrives with the
  personal-anchor migration slice (which also brings the ambiguity
  review modal; personal schedules are owner-only writable, so their
  migration must run client-side per user).
- **service-worker.js 1.13.0**: module 31 cached (35 modules).
- No rules changes; no CSS changes.

## V6.5.0 — Building Bells: design build-order step 1 ships
(The six intercom moments become first-class anchors; plus clock.html
presence, closing the design doc's deferred open question.)

- **NEW `src/js/30-building-bells.js`** + "Manage Building Bells" in the
  Admin Zone: define the intercom bells (name + time) in a new
  `config/building_bells` doc — **no firestore.rules change**, the
  existing `config/{configId}` block already grants read-everyone /
  write-admin (world-readable also future-proofs wall-clock
  follow-along per design I3). Editing a building bell's time shows a
  per-schedule "this will move N anchored bells" confirmation, then ONE
  writeBatch updates the config doc plus every affected schedule's
  `periods` AND regenerated legacy `bells` arrays — old clients render
  the ordinary times and follow along with zero new code (design: 
  "Building Bells writes ordinary period times old clients already
  render"). Per-schedule audit entries: `building-bell-propagate`,
  `building-bell-anchor`, `building-bell-unanchor`.
- **Anchoring is explicit, eyeball-then-confirm** (the design doc's
  tags philosophy): an "Anchor matching…" assist checkbox-lists
  exact-time unanchored bells across all shared schedules; nothing
  anchors without confirm. Deleting a building bell strips its anchors
  (times stay put) so no dangling ids linger.
- **Edit-bell modal (admin + shared):** new "Anchor to building bell"
  select. Picking an anchor snaps the time field to the building bell's
  time (an anchor MEANS "this bell rings at that moment"); saving with
  a different time detaches the anchor with a visible notice. The fuzzy
  59-second linked-edit modal REMAINS for unanchored legacy bells (I0:
  old behavior untouched).
- **BUG PREVENTED — `updatePeriodsOnEdit` field preservation:** it
  replaced bells wholesale (preserving only anchorRole), so every
  ordinary edit would have silently stripped `buildingBellId` — the I0
  field-stripping failure mode in our own client. It now preserves the
  field unless an edit explicitly sets (string) or clears (null) it;
  personal-bell callers pass through untouched.
- **bell-engine.js 1.4.0**: new pure `applyBuildingBellTimeToPeriods`
  (never mutates; reference-equal return on no-op; refuses to write a
  time onto relative bells). +3 tests — suite now 54/54.
- **clock.html 1.7.0**: presence heartbeat every 5 min, `surface:
  'clock'`, ANONYMOUS sessions only (a signed-in browser already
  reports via the app under the same uid; both surfaces writing would
  flap its census row).
- **service-worker.js 1.12.0**: module 30 in CORE_ASSETS (34 modules).
- **tailwind.css rebuilt** (30,876 bytes): module 30 introduced
  `hover:underline`. Ships pre-built, no build needed on deploy.
- **build/verify-esm.mjs**: the two 6.3.0-era TDZ warnings
  (27-school-branding APP_VERSION) reviewed — 00-header is a leaf
  module, no cycle possible — and whitelisted with reasoning.

## V6.4.0 — Usage dashboard (presence): design Layer 1 ships
(First built piece of DESIGN-CALENDAR-V2.md; additive schema per its I0.)

- **NEW `src/js/28-presence.js`**: self-starting heartbeat. Writes
  `artifacts/{appId}/public/data/presence/{uid}` — lastSeen, appVersion,
  schedule label + ids, displayName — when the visible schedule changes
  or every 5 min while the tab is visible (~12 writes/hr/user; hidden
  tabs pause, with a catch-up write on return). Failures log and never
  disturb the app. Departure = staleness; no goodbye write.
- **NEW `src/js/29-admin-dashboard.js`** + "Who's Online" in the Admin
  Zone: live table (name · running · version · last seen · active dot),
  summary counts (active now / seen today / total ever). Listener is
  lazy — attached on modal open, detached on close.
- The dashboard modal is the FIRST new modal authored on the 6.2.0
  data-modal chrome (jsdom-verified it assembles correctly).
- **firestore.rules**: additive presence block — write own doc only,
  read admins-only (reuses the isAdmin helper). MUST be published to the
  console for 6.4.0 to function; safe for live 5.79.x clients (no old
  code touches the path).
- **service-worker.js -> 1.11.0** (caches both modules).
- Census truth-in-advertising: only 6.4.0+ clients report. The school
  repo (5.79.x) reports nothing until the 6.x batch ships there —
  ideally before the first day of school, so day one = full census.
- clock.html presence (TVs/grids; it does authenticate) deliberately
  deferred — see the design doc's open questions.

## V6.3.0 — Schoolification pass: one-file branding
(Additive; zero visible change for Ellis — jsdom-verified no-op.)

- **NEW `/school-config.js`** (plain script, firebase-config.js pattern):
  appName, welcomeHeading, defaultSoundLabel, themeColor. Every value
  optional with Ellis defaults; heavily commented, including everything
  that deliberately STAYS manual (manifest.json is static JSON; replace
  ellisBell.mp3 but keep the filename — it's in the SW precache and saved
  preferences).
- **NEW `src/js/27-school-branding.js`** applies it at startup: tab
  title + banner (APP_VERSION appended, so the three-places version
  convention still greps the static HTML), welcome heading, theme
  preview, meta theme-color, all 8 default-sound dropdown labels, and
  exports APP_NAME (now used by desktop notifications). Text/attribute
  writes only — same safety pattern as 26.
- index.html: three branding targets got ids; loads school-config.js
  before the app module.
- **service-worker.js -> 1.10.0**: caches both new files.
- **old.html -> 1.7.1**: comment at PROJECT_ID pointing other schools at
  firebase-config.js's projectId (the page itself stays SDK-free REST).
- SETUP.md Step 8 rewritten around the one file.
- Verification: jsdom harness ran school-config.js + the branding module
  against index.html — title/h1/welcome/preview/meta + 8 labels all
  byte-equal to the static HTML with stock config. tailwind.css still
  byte-identical to 6.1.0.

## V6.2.0 — Stage 6b: template-generated modal chrome
(Structural, zero visual/behavioral change — proven, see below.)

- **index.html shrinks by ~7.2KB of repeated class strings.** The 45 modal
  backdrop wrappers, 42 standard white panels, and 66 standard buttons
  (40 gray cancel / 19 blue primary / 7 red danger) now carry data
  attributes (`data-modal`, `data-modal-panel`, `data-btn`) instead of
  repeated literal Tailwind chrome.
- **NEW `src/js/26-modal-chrome.js`** expands those attributes at startup —
  CLASS ADDITION ONLY (no elements created/moved/removed, so every
  getElementById reference and listener stays valid). Variants:
  `data-modal-align="start"`, `data-modal-z="<literal z class>"` or
  `"none"`. All deviations (three p-6 panels, buttons with text-sm /
  disabled: / hidden / w-full extras) were deliberately left bespoke.
- **Restyling all modals is now a one-place edit** (schoolification hook).
- **service-worker.js -> 1.9.0**: 26-modal-chrome.js added to CORE_ASSETS;
  cache bump busts 6.1.0 caches.
- **Verification**: transform done by `build/transform-modals.mjs` (kept
  for archaeology) with assertions — inline scripts byte-identical, id
  inventory identical, exact expected counts. tailwind.css rebuild came
  out BYTE-IDENTICAL to 6.1.0 (no class lost moving to JS strings). A
  jsdom harness executed the real module against the transformed DOM and
  compared class SETS on 1,629 elements vs pre-transform: zero
  differences.
- Pre-existing quirk preserved on purpose: bare `z-60`/`z-70` on three
  modals generate no CSS in stock Tailwind (they stack by DOM order);
  documented in the module header, not silently "fixed."

## V6.1.0 — Stage 6a housekeeping: self-hosted Tone.js + verifier hardening
(Shipped together with 6.0.2 on alpha; structural, no feature changes.)

- **Tone.js 14.8.49 self-hosted** as `/tone.min.js` (+ its MIT license file)
  — same minified UMD build as the cdnjs URL, sourced from the npm `tone`
  package. Last CDN runtime dependency removed; the SW caches it, so the
  bell sound engine now loads fully offline.
- **service-worker.js -> 1.8.0**: CACHE_NAME is now DERIVED from
  CACHE_VERSION — one bump busts the cache; the hardcoded-name footgun is
  gone. `/tone.min.js` added to CORE_ASSETS.
- **New verifier `npm run check:sw`** (build/verify-sw.mjs): CORE_ASSETS
  entries all exist on disk, every src/js module is cached, header version
  == CACHE_VERSION, CACHE_NAME is derived. Canary-tested.
- **verify-esm hardened**: unused import specifiers are now ERRORS (scan
  proved the 6.0.0 generator left zero; this keeps hand-maintained imports
  at that standard), and the TDZ audit gained an in-script reviewed-safe
  whitelist — the long-standing 02:state warning was reviewed (state.js
  imports nothing; no cycle possible) and whitelisted. Battery is now
  fully clean, zero warnings.
- **`npm run check:all`** runs the entire battery in one command.
- Module 02 split REVIEWED and re-parked: the file is 370 uniform DOM
  consts + export list, not a functional grab-bag; splitting would churn
  every module's imports for cosmetic gain, and Stage 6b (modal
  templating) will reshape it anyway. Do 6b first.

## V6.0.2 — Firefox sign-in fix (the popup must open from the click)
Google sign-in failed in Firefox since launch with the auth handler's
"missing initial state" error. Contrary to that message's usual diagnosis,
the codebase has NO `signInWithRedirect` anywhere — the cause was
`signInWithGoogle()` awaiting `startAudio()` (a Tone.js AudioContext
resume) and potentially `initFirebase()` **before** `signInWithPopup`. By
the time the popup opened, Firefox no longer treated it as user-initiated,
and under storage partitioning the degraded flow died in the auth handler.

- `signInWithGoogle()` (module 19) rewritten: click -> provider -> popup
  with **zero awaits in between** (the pattern proven on Tentacalendar's
  store.js v0.15.0, same stack). `startAudio()` is still *called* inside
  the click gesture — audio unlock needs that — but is no longer awaited
  before the popup. Cold-boot fallback (auth missing) now re-inits and asks
  for a second click instead of opening a popup outside the gesture.
- clock.html and dashboard-config.html audited: both already open the popup
  synchronously from the click. No change needed.
- Acceptance test (Firefox, default settings AND with Enhanced Tracking
  Protection set to Strict): click Sign In -> Google popup opens -> pick
  account -> popup closes, app signed in. No "missing initial state."

## V6.0.1 — Version correction + monolith removal (housekeeping)
The stage-2 modularization release was mislabeled **7.0.0** by a confused
session; the owner's numbering puts it at **6.0.0** (7.x is reserved for a
future major). Neither number was ever deployed, so no client saw 7.0.0.

- Every 7.0.0 reference corrected to 6.0.0 across code comments, module
  markers, HTML version spots, and docs. Current app version is 6.0.1.
- **`script.js` DELETED.** The 17,297-line generated monolith (pre-6.0.0
  concatenation output) was left in the tree when the conversion session was
  interrupted. Nothing referenced it; it duplicated every function in
  `src/js/`. Must also be deleted from the GitHub repo — see ROLLOUT.md.
- Status modal: `'script.js (App)'` label -> `'App (src/js modules)'`.
- service-worker.js -> 1.7.1: **bug fix** — `CACHE_VERSION` (what the status
  modal reports) was left at '1.6.0' when the header went to 1.7.0; the two
  must now be bumped together. CACHE_NAME stays v8 (CORE_ASSETS unchanged).
- Comment-only z-bumps for the corrected app references: bell-engine 1.3.3,
  firebase-config 1.0.2, clock.html 1.6.2.

## V6.0.0 — Native ES modules (stage-2 modularization; owner-approved major)
The app's JavaScript is now real ES modules served directly from `src/js/`:
index.html loads `src/js/main.js` and the browser resolves the import graph.
**script.js is retired** — there is no generated JS file and no JS build
step; what you edit is what ships, and DevTools errors point at real files.

- 27 feature modules + new `src/js/state.js` + new `src/js/main.js` (29 total).
- `state.js`: the 103 variables that were assigned from more than one chunk
  now live on one exported `state` object (ES module imports are read-only
  bindings, so cross-module writes must go through a shared object). 1,543
  references rewritten `foo` -> `state.foo`, located by scope analysis, never
  regex. Everything else stays in its module, exported as live bindings.
  (`state.localSchedulePeriods` is the §4.6 pristine copy — relocated,
  semantics unchanged.)
- Import/export blocks were machine-generated from the resolved reference
  graph during conversion (tools kept in `build/`); they're maintained by
  hand from here on, enforced by the new battery.
- 239 raw `console.log` calls migrated to `safeLog.log` (debug logging now
  gated by PRODUCTION_MODE in 03-memory-management.js). warn/error untouched.
- New verification: `npm run check:esm` (import/export linker, read-only
  import enforcement, TDZ audit) replaces `check:js`; lint is now per-module
  no-undef, which catches any missing import. `build:js`/`check:js` retired
  (build-js.mjs is a tombstone). Tailwind content scan repointed at
  `src/js/**/*.js` — the rebuilt tailwind.css came out byte-identical,
  proving no class strings were touched by the conversion.
- index.html -> 6.0.0 (all three places); service-worker 1.7.0 (CORE_ASSETS:
  script.js out, all 29 modules in; CACHE_NAME v7 -> v8). bell-engine.js is
  UNCHANGED and still a plain script shared with clock.html. No Firestore,
  rules, or data-shape changes. Sibling surfaces untouched.
- Also fixed: `npm run lint` had become a silent no-op under ESLint >= 9.14
  (targets outside the config's base path are ignored with exit 0); it now
  runs from the repo root and was canary-tested to prove it fails on a real
  no-undef.

## V5.79.1 — Post-launch bug-fix pass (per-file versions from here on)
FROM THIS RELEASE FORWARD, files version independently — only files that
were actually edited get bumps. This pass: index.html -> 5.79.1 (its own
version now, in all THREE required places: <title>, the visible <h1>, and
the final comment line — a maintenance comment in <head> documents the
rule); script.js/App -> 5.79.1; bell-engine.js -> 1.3.1 (VERSION export
only). Everything else untouched and unbumped. Semver semantics per the
owner: z = fix/clarification, y = new feature, x = major shift with the
owner's sign-off.

Fixes:
- Version display was inconsistent (title tag 5.79.0, visible header
  5.69.2, final comment 5.69.2) — all three now match and must always.
- Dashboard link in the header pointed at the repo root; the page lives at
  signage/dashboard.html.
- Notifications toggle could read "Off" after the user granted permission.
  Root causes fixed: Safari's legacy callback-form requestPermission()
  returns undefined, so awaiting it read a real grant as a denial (now
  shimmed for both forms, with live Notification.permission as the source
  of truth); and permission granted at the browser level was invisible to
  the label (it now re-derives from live state on every refresh, on tab
  refocus, and on permission-change events where supported, with an
  explicit third "blocked" state).
- Emergency shift row: Clear All overflowed the card (row now wraps;
  button labels no longer break mid-word).
- "Create New Schedule" was wearing modal styling (own shadowed card with
  max-height) inside the Admin Zone card — restyled to match its sibling
  forms.
- "Add Bell to This Schedule" now names its target inline — the SHARED
  base schedule it will edit — updating live with the active schedule and
  reading "no shared schedule selected" when none is.
- Footer now shows HTML | App | CSS versions at a glance; tapping the line
  opens the status modal, which gains a File Versions section listing
  EVERY file in the deployment (local ones read live, sibling surfaces
  fetched and parsed — a stale-cached TV shows up here as a mismatch).
  Copy Report includes both sections.

## V5.79.0 — Status / health view
- Tap the version number in the footer (now dotted-underlined) to open the
  App Status modal: app version, service worker version (via the
  GET_VERSION message channel that's been in service-worker.js since v1.0),
  online/signed-in/admin state, active schedule and any emergency shift,
  device clock drift from v5.77.0's monitor, notification state, and bell
  counts — plus a Copy Report button. The support script becomes: "open the
  app, tap the version number, read me the screen." Read-only by design.

## V5.78.0 — Web notification backup ring
- Opt-in, per-device toggle ("🔕/🔔 Notifications") in the bell-list
  controls row. When enabled and the tab is HIDDEN, every ring also fires a
  system notification — the backup channel for throttled background tabs
  and silent audio failures. One hook inside ringBell() covers every ring
  path (scheduled, missed-bell recovery, queue timers, quick bells), and
  because callers check mutes before ringBell, notifications automatically
  respect mutes.
- Deliberate deviations from the original sketch, documented in the chunk
  header: per-device localStorage instead of cloud-synced preferences
  (Notification permission is inherently per-browser — a synced ON that
  follows you to a device that never granted permission is a toggle that
  lies), and hidden-tab-only firing (a visible tab already has audio +
  visuals; the OS popup would be noise). The toggle turns itself off if
  permission gets revoked at the browser level, and enabling fires a
  proof-of-life notification so teachers see what to expect.

## V5.77.0 — Device clock drift warning
- Bells ring on each device's LOCAL clock, so a Chromebook running four
  minutes slow rings four minutes late and the teacher blames the app. The
  app now measures each device's offset against Firestore server time
  (NTP-style midpoint estimate over a server-timestamp round trip, written
  to the user's own diagnostics doc — covered by existing rules, no rules
  change) on load and hourly, and shows a dismissible amber banner when the
  offset exceeds 45 seconds, telling the teacher exactly what to fix
  (system Settings -> Date & Time).
- Deliberate decisions, documented in the chunk header: WARN ONLY, never
  auto-correct bell times (correcting would fight the OS clock and any
  later fix of it); dismissal lasts the session, so a still-wrong clock
  re-warns on tomorrow's page load; every measurement failure is silent —
  a diagnostics feature must not generate its own support noise (15s
  timeout guards the round trip).
- The estimation math lives in bell-engine.js v1.3.0
  (estimateClockDriftMs) with unit tests covering both drift directions
  and invalid input (51 tests total).
- The latest measurement is kept in lastClockDriftMs/lastClockDriftAt for
  the Stage 5 status view.
- src/js/ housekeeping: the init/listeners chunk is now numbered 99 so
  future chunk insertions never rename it again; new chunk is
  23-clock-drift.js (25 chunks).

## V5.76.0 — Signage pages: shared engine, relative bells, shifts (full depth)
- NEW signage/schedule-utils.js — the single home for the logic behind all
  three TV pages (dashboard v1.6.0, dashright v1.1.0, dashclock v1.1.0),
  which each carried their own copy of getScheduleStatus + time helpers. A
  comment claimed the copies were "bit-for-bit identical"; verification
  showed dashright's had already drifted (cosmetically, this time — but the
  same rot pattern that bit clock.html semantically in v5.72).
- FIXED: the signage pages never resolved RELATIVE bells — they displayed
  the raw stored `time` field, so moving an anchor bell in the main app
  silently left every TV showing the old period boundaries. Effective
  periods are now resolved through the shared engine, corrupt/orphan bells
  keep their engine fallback times, and a unit test pins the exact
  stale-time scenario.
- NEW: the TVs now honor emergency shifts. Effective periods (shift +
  resolution) are computed at read time and memoized on (local date + shift
  seconds), so a shift appears on the next 1-second tick after the snapshot
  arrives and self-expires at the first tick past midnight — no refresh
  mechanism needed, since these pages already had live onSnapshot listeners.
- All three pages now load ../bell-engine.js + schedule-utils.js after
  firebase-config.js (load order matters and is commented in each head).
- tests/schedule-utils.test.mjs: 10 new tests (49 total across both suites);
  `npm test` now runs both.
- service-worker v1.6.0 / cache v7: schedule-utils.js precached.
- dashboard.html's three configRef.onSnapshot listeners were inspected and
  left alone — they're mutually exclusive branches (setup mode / shared
  config / URL params), not a bug.

## V5.75.0 — Edit audit log (shared schedules)
- Every meaningful admin change to a shared schedule now also writes an
  append-only entry to that schedule's edit_log subcollection: server
  timestamp, who (uid + display name), action, and details (before/after
  where the call site has both — enough to build one-click undo later).
  Sixteen mutation sites instrumented: bell add/edit/delete, linked edits,
  period delete, multi-add period/bell, schedule create/rename/delete,
  import (replace and merge), sound reassignment, bulk edit, and emergency
  shift apply/clear. Logging is fire-and-forget — a log failure can never
  block or fail the edit itself.
- New Admin Zone -> "View Edit History": last 50 entries for any shared
  schedule, all rendered fields escaped.
- firestore.rules: edit_log is append-only BY RULE — create requires admin
  (matching who can edit schedules), update/delete denied to everyone
  including admins; read requires sign-in so any teacher can answer "who
  moved 4th period?" themselves.
- Auth listener now records the signed-in display name for log attribution.
- Batch operations (multi-add, conflict resolution, sound reassignment,
  import-merge) write ONE summary entry to the active schedule rather than
  one per touched schedule — documented trade-off, per-target logging is a
  future refinement. Schedule DELETIONS log under the deleted doc's ghost
  subcollection (Firestore keeps it), so they're also echoed to console.
- Imports extended (serverTimestamp, query, orderBy, limit); src/js/ now has
  24 chunks: new 22-audit-log.js; init/listeners is 23.
- The lint step caught a scope bug in this very feature's first draft
  (undefined `time` at the delete-bell site) before it shipped — the
  guardrails guard their own author.

## V5.74.0 — Emergency schedule shift; day-type calendar parked
- NEW: Admin Zone -> "Emergency Schedule Shift (today only)". Pick a base
  schedule (or all shared schedules) and a +/- minute offset; one field
  (temporaryShift { seconds, date, setAt }) is written to the schedule
  doc(s). Every client's listener picks it up live; resolveAllBellTimes
  shifts the shared STATIC bells on its merged copies, so every relative
  bell anchored to them — shared or personal, on any teacher's device —
  ripples automatically. Teachers' pinned personal static times don't move.
  The stored schedule is never modified, edit modals never see shifted
  times, and the shift self-expires at the midnight recalculation because
  it's stamped with today's local date.
- PARKED: the v5.73.0 day-type calendar auto-switching. The school runs six
  schedules simultaneously across 50 teachers, so one school-wide "today is
  Schedule B" designation is the wrong model. The admin UI was removed
  before ever shipping and the auto-switch is hard-gated behind an enabled
  flag nothing can set. The pure resolver + tests stay; the revival design
  (teacher groups by grade/role -> per-group day-type mapping) is sketched
  in src/js/20-schedule-calendar.js's header.
- clock.html v1.6.0: applies shifts via the shared engine, and now refreshes
  its schedule data every 2 minutes — previously schedules loaded exactly
  once per page load, so TVs and classroom grids never saw ANY mid-day
  schedule change without a manual reload.
- old.html v2: ES5 shift support at every schedule parse point, plus a
  5-minute auto-refresh through the existing Refresh handler — the iPad
  wall clocks now track mid-day changes too.
- bell-engine.js v1.2.0: shiftTimeString + getActiveScheduleShiftSeconds
  (date-stamped, self-expiring); 4 new unit tests (39 total), including one
  pinning the static-anchor -> relative-bell ripple.
- src/js/ now has 23 chunks: new 21-emergency-shift.js; init/listeners is 22.
- KNOWN GAP: the signage/ pages (dashboard.html, dashclock.html,
  dashright.html) are not in this repo snapshot and do NOT yet apply shifts.
  If they display bell times, they need the same ~10-line engine check
  clock.html got. Flagged in ROLLOUT.md.

## V5.73.0 — Day-type schedule calendar (auto-switching)
- NEW: Admin Zone -> "Set Which Schedule Runs Which Day". Admins set a
  weekday default schedule (Sun-Sat) plus date exceptions (assemblies,
  testing days; an exception of "none" suppresses the weekday default for
  holidays). Stored at public/data/config/schedule_calendar — already
  admin-write/public-read under the existing rules, no rules change.
- Every client auto-switches to the day's designated shared schedule at app
  load, at midnight (rides the existing day-change detection in updateClock),
  and live when the calendar or schedule list changes. A teacher's manual
  dropdown pick wins for the rest of that day on that device, and the app
  never auto-switches anyone OFF a personal schedule. All five rules are
  documented at the top of src/js/20-schedule-calendar.js; resolution logic
  is pure, lives in bell-engine.js v1.1.0 (resolveCalendarSchedule +
  toLocalDateString — local-timezone on purpose; toISOString would resolve
  tomorrow's schedule every evening), and has 5 new unit tests (35 total).
- FIXED (build tooling): running the Tailwind CLI from any directory other
  than build/ silently produced an EMPTY stylesheet (Tailwind v3 resolves
  content globs from the CWD, not the config). Content paths are now
  absolute via path.resolve(__dirname), and `npm run build:css` self-checks
  the output (size + sentinel classes) and fails loudly instead of shipping
  an unstyled app.
- NEW: ROLLOUT.md — the one-time deployment checklist for the whole
  v5.70-v5.73 batch (repo files, Firebase rules steps with playground
  checks, build setup, and a 10-minute smoke test).
- src/js/ now has 22 chunks: new 20-schedule-calendar.js; init/listeners
  renamed to 21.

## V5.72.0 — Shared bell engine, script.js split, six latent bugs fixed
- NEW: bell-engine.js — the single home for the pure time/schedule math
  (escapeHtml, timeToSeconds/secondsToTime, formatTime12Hour,
  getDateForBellTime, getBellId, findNextBellIn, findBellAfter,
  calculateRelativeBellTime). Loaded via plain <script> tag by BOTH
  index.html and clock.html (same pattern as firebase-config.js). Covered by
  30 unit tests in tests/bell-engine.test.mjs (`cd build && npm test`).
- FIXED (clock.html v1.5.0): its local copy of calculateRelativeBellTime had
  silently DIVERGED from the main app — it was missing the V5.44.1
  anchor-selection logic (shared static bells for linked periods vs anchorRole
  bells for standalone periods), so TVs could anchor relative bells to the
  wrong bell. It now delegates to the shared engine; corrupt/orphan bells show
  their fallback time instead of being silently dropped from TVs.
- SPLIT: script.js is now GENERATED — the concatenation of 21 readable chunks
  in src/js/ (built by build/build-js.mjs; `npm run build:js`). The build is a
  pure concatenation verified byte-identical at split time, aborts on syntax
  errors without touching script.js, and `npm run check:js` detects direct
  edits to the generated file. See build/README-BUILD.md.
- REMOVED: the v4.05 IIFE that wrapped 15,000 lines (added back then to fight
  ReferenceErrors; in an ES module it provided no isolation and blocked the
  split). Verified safe before removal: zero name collisions between the 241
  IIFE-scoped and 531 module-scoped declarations. Unwrapping also FIXED a
  latent bug class: pre-IIFE code (e.g. unskipBell) that called IIFE-scoped
  functions (showUserMessage, updateClock, updatePipWindow) threw
  ReferenceErrors whenever those paths ran.
- FIXED six more pre-existing latent ReferenceErrors found by lint
  (`npm run lint`, new): closeAllConflictModals referenced a nonexistent
  linkedEditModal (now confirmLinkedEditModal); executeAddPersonalBell
  reset a long-deleted form, logging a bogus error on every successful add;
  converting a relative bell to static crashed on an undefined
  calculatedTime (now resolved from the anchor + offset); the multi-period
  visual preview change handler called a nonexistent handleVisualSelectChange
  (now updatePeriodVisualPreview); the bulk-edit custom-text path called a
  nonexistent openCustomTextModal (now follows the standard
  currentVisualSelectTarget + modal pattern).
- service-worker v1.5.0 / cache v6: /bell-engine.js added to CORE_ASSETS.
- DOCS: build/README-BUILD.md rewritten around The Two Build Rules; warning
  banners added to the tops of script.js and tailwind.css; README updated.

## V5.71.0 — Self-hosted compiled Tailwind (replaces Play CDN)
- index.html now loads a static, self-hosted /tailwind.css (~30KB minified)
  instead of the cdn.tailwindcss.com runtime JIT (~380KB script that
  recompiled styles in the browser on every page load, and took the whole UI
  down with it whenever the CDN hiccuped). The inline tailwind.config
  (fontFamily) moved to build/tailwind.config.js.
- New build/ folder: tailwind.config.js, input css, package.json, and
  README-BUILD.md documenting the one rule that matters — if you use a
  Tailwind class that has never appeared in index.html or script.js before,
  run `npm run build` in build/ and commit the regenerated tailwind.css.
- Coverage was verified by extracting all 442 class tokens used across
  index.html and script.js and checking each against the compiled output.
  Only z-60/z-70 were absent — and those aren't in Tailwind's default scale,
  so the Play CDN never generated them either (four modals were stacking by
  DOM-order luck). styles.css v2.6 now gives those modals explicit z-indexes.
- service-worker v1.4.0 / cache v5: /tailwind.css joined CORE_ASSETS;
  cdn.tailwindcss.com removed from EXTERNAL_ASSETS and the opaque allowlist.
- PiP pop-out styling is unaffected: it copies document.styleSheets
  generically, and the same-origin compiled sheet copies cleanly (its
  cssRules are readable, unlike a cross-origin sheet).

## V5.70.0 — Security & offline hardening (audit pass)
- SECURITY: Added a real escapeHtml() utility (escapes & < > " ') and applied it
  to every user-controlled string interpolated into innerHTML: period names,
  bell names, schedule names, custom icon text, uploaded file names/nicknames/
  owners, sound URLs, and the delete-audio confirmation list. The previous
  escaping only handled double quotes, so a bell or period named with an HTML
  tag would execute script in every faculty member's browser via schedule sync.
  data-* attributes written through escapeHtml round-trip correctly when read
  back via .dataset (the parser decodes entities), so mute/skip/edit lookups
  keyed on raw names still match. ringBell()'s highlight querySelector now
  escapes for CSS-selector context instead of HTML context.
- SECURITY: Tightened firestore.rules (see firestore.rules comments): user data
  is now owner-only except personal_schedules (which old.html reads via
  unauthenticated REST and share-code following requires); share codes can only
  be created with your own uid as ownerId and only revoked by their owner or an
  admin (previously any authenticated user could delete anyone's code).
- OFFLINE: service-worker v1.3.0 — external CDN assets (Tailwind, Tone.js,
  fonts) are now actually precached (the EXTERNAL_ASSETS list existed but was
  never used), opaque CDN responses are runtime-cached from an allowlist, and
  ellisBell.mp3 joined CORE_ASSETS. Cache bumped to v4.
- CLEANUP: ~280 lines of in-file release notes moved from the top of script.js
  to this CHANGELOG.md. manifest.json theme_color updated to Carolina Blue
  #4B9CD3 (was still indigo #1d4ed8, out of sync with index.html since 5.69.1).

## V5.69.4 — PiP broadcast toggle fix
- Removed the broadcast toggle from the Picture-in-Picture popup. The toggle
  was being deep-cloned into the PiP from the main page's #quickBellControls,
  but the cloned button's inline onclick="toggleBroadcastMode()" referenced a
  function that doesn't exist in the PiP window's scope — silently no-op. Also
  created a duplicate-ID conflict with the main-page toggle.
- Broadcast sync still works as expected via the main-page toggle. The PiP is
  meant for at-a-glance bell display, not configuration.
## V5.69.1 — Carolina Blue palette — foundation pass (Tier 2 of audit, part 1 of ~3)
- Light/dark theme objects now use Carolina Blue hues instead of
  Tailwind blue-600/blue-400:
    Light accent: #38759E (Carolina Deep, WCAG AA-compliant on white at 4.99:1)
    Dark accent:  #8FC3E8 (Carolina Sky, excellent contrast on dark at 9.41:1)
    Bold accent:  #4B9CD3 (canonical Carolina Blue, used for large surfaces)
- Added --theme-accent-bold custom property for buttons/headers/backgrounds
  where contrast requirements are relaxed (large text / non-text UI).
  Existing --theme-accent remains the text-safe variant.
- Visual cue default background: 18 instances of #4338CA (indigo) replaced
  with #4B9CD3 (Carolina). Audited in context; all were "default bg color
  for custom-text visual cues" — not semantic, just a leftover default.
NOTE: This is the *foundation* of Tier 2. Tailwind class replacements
(blue-500 → theme-accent-bold, etc.) and the other files (clock.html,
dashboard.html, old.html, manifest.json) come in 5.70.0 and 5.71.0.
## V5.68.0 — Inline rename button for discoverability
- Added a pencil-icon button next to the schedule title in the main view.
  The admin-rename capability already existed (in the Admin Zone since v4.91),
  but was undiscoverable. The new inline button dispatches to the existing
  handlers: openRenameSharedScheduleModal() for admins (handles both shared
  and personal schedules), handleRenamePersonalSchedule() for authenticated
  non-admins with a personal schedule selected.
- The inline button mirrors the enabled state of the existing two rename
  buttons — no new permission logic, just a more findable entry point.
- Hidden in kiosk mode via the existing .kiosk-hide class.
## V5.67.0 — Audit pass — versioning cleanup + shared config + dead code removal
- REMOVED: CLOCK_VERSION and DASHBOARD_VERSION constants (stale cross-references).
  Each sibling file (clock.html, dashboard.html, dashboard-config.html) now
  tracks and displays its own version. index.html footer updated to match.
- REMOVED: Inline firebaseConfig declaration. Now read from window.firebaseConfig
  (defined in shared firebase-config.js). Consumers: index.html loads it before
  script.js; clock/dashboard/dashboard-config load it before their init logic.
- REMOVED: Dead functions — checkQueueUntilBell (never called outside definition),
  findPeriodAnchorBell (same), plus already-commented-out flattenPeriodsToBells
  and handleRelativeTimeChange blocks.
## V5.66.3 — Time Format Fixes & Theme Improvements
- FIX: Schedules with HH:MM times (without seconds) now work correctly
  - Root cause: setHours() with undefined seconds created Invalid Date, breaking countdown
  - Fixed in: updateClock(), isSafeToCleanup(), getDateForBellTime()
- NEW: Auto-migration normalizes HH:MM -> HH:MM:SS on schedule load (admins fix shared, users fix personal)
- Fixed bell item hover in dark mode (white-on-white issue)
- Added --theme-bg-hover and --theme-border-light CSS variables
## V5.66.2 — Theme & Bell Editing Fixes
- Fixed dark mode: visual cue container now uses theme variable
- Fixed light mode contrast: darker secondary text colors for readability
- Fixed shared bell sound editing:
  - ALL users can now change sound (creates personal override, only affects their room)
  - Sound dropdown enabled by default for everyone
  - Admins see "Override for all users" checkbox to optionally push to shared bell
  - Non-admins don't see checkbox (their changes are always personal)
- Added CSS variables for visual background, button colors
## V5.66.1 — Broadcast Toggle Fix
- Added onclick fallback to broadcast toggle button
- Added pointer-events-none to SVG to prevent click interception
## V5.66.0 — Theme & Display Settings
- Added Theme & Display panel in Visual Manager section
- Light/Dark theme presets with one-click toggle
- Custom color pickers for: background, card, text, secondary text, accent, countdown
- Toggle to hide visual cue graphic
- Live preview panel showing how changes will look
- Theme persists to localStorage and syncs to cloud
- CSS variables applied to entire page for seamless theming
## V5.65.3 — Remove broadcast popup messages
- Removed "Broadcast sent" and "synced from another device" modals (too intrusive)
- Console logging remains for debugging if needed
## V5.65.2 — Broadcast Fix - Use correct user variable
- Fixed: Changed currentUser (undefined) to userId (correct variable)
- Added detailed console logging for debugging
- Added user-visible messages when broadcast sends/receives
- Increased stale broadcast threshold from 5s to 10s
## V5.65.1 — Broadcast Toggle Fix
- Fixed broadcast toggle button not responding to clicks (DOM timing issue)
- Removed disabled attribute from HTML, button now works for all users
## V5.65.0 — Quick Bell Broadcast Feature
- Added broadcast toggle button next to sound dropdown (syncs quick bells across all logged-in devices)
- Added "Always broadcast" checkbox to custom quick bells
- Broadcast-enabled custom bells show a signal icon in the corner
- Cancel syncs across devices when broadcast is enabled
- Uses Firestore real-time listener for instant sync
## V5.64.3 — PiP Kiosk Mode Fixes
- Fixed visual cue icon not loading in kiosk mode
- Fixed countdown centering issue when window is small (now stays left-aligned)
## V5.64.0 — Enhanced PiP Kiosk Mode + Text Wrapping Fix
- Enhanced PiP kiosk mode with responsive scaling (icon fills height, countdown scales with viewport)
- Kiosk mode now has dark background, properly hides quick bells and action buttons
- Fixed text wrapping issue in full pop-out where "are" would drop to second line
- Fixed warning settings modal scrolling on smaller screens
## V5.63.3 — Share code feature fixes
- Fixed: populateScheduleSelector() -> renderScheduleSelector() (function didn't exist)
- Fixed: Unfollow now switches to another schedule if viewing the unfollowed one
## V5.63.2 — Fixed custom quick bell visual and sound upload
- Visual upload: Set currentVisualSelectTarget when opening upload from custom bell manager
- Visual upload: Added custom bell manager dropdowns to updateVisualDropdowns()
- Visual upload: Upload completion now properly updates hidden inputs for custom bells
- Sound upload: Added handler for [UPLOAD] selection in custom bell sound dropdown
- Sound upload: Added custom bell sound selects to addNewAudioOption() and updateSoundDropdowns()
## V5.63.1 — Bug fixes
- Users can generate 6-character share codes for their personal schedules
- Colleagues can enter share codes to "follow" schedules (read-only access)
- Following schedules appear in schedule selector under "📥 Following" group
- Followers can duplicate shared schedules to their own account
- Share codes can be revoked by the owner
- Updated Firestore rules: personal schedules readable by all authenticated users
- Updated Storage rules: user sounds/visuals readable by all authenticated users
## V5.62.0 — Memory Management System
- Added automatic memory purge during safe windows (when no bells approaching)
- Audio players now auto-dispose after playback
- Tracks and cleans up Tone.Player instances to prevent accumulation
- Clears unused audio buffer cache periodically
- Added PRODUCTION_MODE flag to reduce console logging
- Safe memory window = 60s before next bell (no cleanup during critical times)
## V5.61.2 — Dashboard v1.2.2 - added Launch TV View button
- Added CLOCK_VERSION and DASHBOARD_VERSION constants (dynamically displayed in footer)
## V5.61.0 — Clock Display v1.1.7 + Dashboard link
## V5.60.0 — Clock Display page initial release
## V5.59.1 — Fixed Simplified View wiping schedule
- Removed renderCombinedList() call from toggleSimplifiedView()
- CSS handles all visibility changes, no re-render needed
## V5.59.0 — Simplified View Mode + Bulk Edit Select All
- Added Simplified View toggle button in Active Schedule section
- Simplified View hides all edit/add/delete buttons in schedule display
- Keeps Collapse/Expand/Mute/Unmute and Quick Bells visible
- Preference saved in localStorage (per-machine)
- Added master checkbox to select/deselect all bells in Bulk Edit mode
- Added period-level checkboxes to select/deselect all bells in a period
- Checkboxes show indeterminate state when partially selected
## V5.58.9 — Fixed relative bell detection to use correct property structure
- Relative bells use bell.relative object, not bell.relativeToAnchor
- Two anchor types: parentBellId (direct) or parentPeriodName+parentAnchorType (period anchor)
- Period anchor references (parentPeriodName) check if target period has matching anchor bell
- Properly copies bell.relative object instead of wrong properties
## V5.58.8 — Properly detect and exclude orphaned relative bells
- Relative bells whose anchors aren't in the import are now detected and excluded
- First pass collects all bellIds present in the import
- Bells with relativeToAnchor pointing to missing anchors are skipped
- Empty periods (all bells orphaned) are excluded from import
- Period and bell counts now reflect actual importable content
- Orphaned relative bells shown prominently in "Will Not Be Imported" section
- Console logs which bells/periods are being skipped for debugging
## V5.58.7 — Fixed syntax error (extra closing brace in showImportPreviewModal)
## V5.58.6 — Import improvements
- Added rename input to import preview modal (pre-filled with original name)
- Added warning banner for linked schedules (based on shared schedule)
- Better handling of empty periods (shows clear message instead of importing nothing)
- Added reconstructPeriodsFromLegacyBells to recover periods from older backup formats
- Added logging to debug import issues
- Shows warning when no periods/bells found in backup
## V5.58.5 — Import and dropdown fixes
- Fixed import error with undefined field values (Firestore doesn't accept undefined)
- Now properly copies relative bell properties (relativeToAnchor, relativeDirection, relativeOffset, anchorRole)
- Handles bells without static time (relative bells)
- Fixed sound dropdown overflow in multiple modals (added min-w-0)
## V5.58.4 — Smart Import Preview for Admin
- Detects personal schedule backups when importing as admin
- Shows preview modal with analysis of what can/will be imported
- Identifies sounds not in shared storage (replaces with default)
- Identifies visual cues not in shared storage (removes them)
- Shows what personal-only data will NOT be imported (quick bells, overrides, etc.)
- Checkboxes let admin choose what to include
- Admin exports now include exportedAt and exportedAs metadata
## V5.58.3 — Admin period creation improvements
- Pre-check the currently active schedule when opening period modal
- Added visual cue picker to period creation (applies to both Period Start and Period End bells)
- Improved error messages: now shows specific schedule names for conflicts
- "Period already exists" now lists which schedules were skipped
- Time conflicts now show the specific bell name, period name, and time
- Button text changed to "Add Period to Schedule(s)..."
## V5.58.2 — Period modal UX fixes
- Fixed sound dropdown overflow (added min-w-0 to prevent horizontal scrolling)
- Modal now closes on successful period creation
- Success message shown via showUserMessage() toast instead of modal status
## V5.58.1 — Null safety fixes for period modal
- Added guard clauses to prevent errors if modal elements don't exist
- Used optional chaining throughout period modal functions
- Prevents potential blocking issues from null element access
## V5.58.0 — Admin Period Creation
- Added "Add Period to Schedules" button in admin zone (purple, next to Add Bell)
- New modal allows creating periods with Period Start and Period End bells
- Can add period to multiple schedules at once via checkboxes
- Validates that end time is after start time
- Checks for time conflicts (within 59s) before adding
- Skips schedules where period name already exists
- Each bell gets unique bellId (no shared IDs across schedules)
## V5.57.2 — Bell proximity threshold and error messages
- Changed bell proximity threshold from 60 to 59 seconds (was blocking bells 60s apart)
- Enhanced error messages to include the period name of the blocking bell
- Error now shows: bell name, period name, and time (e.g., "Period Start" in "1st Period" at 8:00 AM)
## V5.57.1 — Fix personal period bells not editable
- BUG FIX: Personal period anchor bells (fluke bells) were showing "Only admin can change" message
- Root cause: handleEditBellClick had no else clause for custom bells, so time input stayed locked
- Added else clause to properly enable time editing for all custom bells (type !== 'shared')
- Users now have full control over their personal period anchor bells
## V5.54.6 — UX improvements
- Sound overrides now display nickname if available, instead of raw filename
- Fixed sound dropdown overflow in relative bell modal (added min-w-0)
## V5.54.5 — Bug fix - relative bells anchored to relative "Period Start" bells orphan
- Now clones entire quickBellControls from main page instead of recreating
- Copies main page stylesheets (Tailwind) for consistent styling
- Custom quick bells work by cloning already-rendered buttons
- Click handlers delegate to main page buttons for reliable behavior
## V5.47.0 — Picture-in-Picture Pop-Out Mode
- Added Document PiP support for always-on-top floating timer window
- Pop-out button appears on hover over the visual cue (top-right corner)
- Button is in a wrapper div so it doesn't get wiped when visual updates
## V5.46.5 — Fix Individual Edit Bell + Backup/Restore for bellOverrides
- BUG FIX: Non-admin Edit Bell was checking hidden checkbox for sound save - now checks if sound changed
- BUG FIX: Edit Bell modal now shows the CURRENT sound (including overrides) not originalSound
- BUG FIX: Added recalculateAndRenderAll() after non-admin shared bell save for immediate UI update
- Backup now includes bellOverrides (shared bell customizations)
- Restore now restores bellOverrides and shows count in confirmation
## V5.46.4 — Fix Shared Bell Sound Overrides to Sync Across Devices
- Sound overrides for shared bells now save to Firestore (bellOverrides) instead of localStorage
- Firestore overrides now take priority over localStorage during rendering
- This ensures changes to shared bell sounds sync across all your devices
## V5.46.3 — Fix ESC Key Handler Reference Error
- Fixed reference to deleted 'renamePeriodModal' that was causing JavaScript errors
- Changed to correct 'edit-period-details-modal' with proper form reset
## V5.46.2 — Three Important Fixes
- Fixed "Duplicate as Another Personal Schedule" to copy ALL data (periods, bellOverrides, passingPeriodVisual, isStandalone)
- Restore from backup now allows editing the schedule name (pre-filled with backup's name)
- Added global ESC key handler to close any open modal without saving
## V5.46.1 — Fix Shared Bell Visual Overrides Persistence
- Added personalBellOverrides variable to store shared bell customizations
- Load bellOverrides from Firestore when personal schedule loads
- Apply visual overrides, sound overrides, and nicknames to shared bells during rendering
- Visual overrides for shared bells now persist across page refreshes
## V5.46.0 — Bulk Edit for Audio and Visual Cues
- Added "Bulk Edit" button to schedule list controls (visible when personal schedule is active)
- Click to enter selection mode, checkboxes appear next to each bell
- Select bells, click button again to open bulk edit modal
- Change audio and/or visual cue for all selected bells at once
- Custom bells: Updated directly in Firestore periods
- Shared bells: Sound overrides saved to localStorage, visual overrides saved to bellOverrides
- Sky blue themed UI to distinguish from other edit modes
## V5.45.4 — Remove inconsistent "Override:" prefix from sound display
- The sound name alone is sufficient information
- Removes confusing inconsistency where some overridden bells showed it and others didn't
## V5.45.3 — Fix background color picker preview for [DEFAULT] SVGs
- getVisualHtmlWithBg now properly handles [DEFAULT] SVGs and empty values
- "New" preview now updates in real-time when changing the color
## V5.45.2 — Custom background colors for default SVGs (pedestrian, lunch, numbers)
- [BG:#hexcolor] prefix now works with [DEFAULT] SVGs, not just images
- Uses raw SVG content to avoid nested backgrounds
- Both full-size and icon previews support custom backgrounds
## V5.45.1 — Fix period visual override backup/restore
- Fixed key format: uses hyphen (-) not colon (:)
- Fixed ID: uses activePersonalScheduleId, not baseScheduleId
- Restore now remaps keys to current schedule ID (so backups work across schedules)
- Also checks baseScheduleId for linked schedule compatibility
## V5.45.0 — Comprehensive personal schedule backup/restore
- Backup now saves: periods (v4 structure), period visual overrides, custom quick bells
- Backup includes references to custom audio/visual files (URLs)
- Restore supports both v1 (legacy bells) and v2 (full) formats
- Restore prompts to optionally restore quick bells
- Backup filename now includes date
## V5.44.11 — Consistent icon/text sizing across all quick bell previews
- Modal previews, manager previews, and actual buttons now all use SVG text
- SVG text scales proportionally to container, ensuring consistent appearance
- Font sizes: 80/45 for full preview, 70/50 for button preview (short/long text)
## V5.44.10 — Fix custom text/color modal for quick bells
- Created setupCustomTextModalPreviews() helper function for consistent preview behavior
- Live preview now updates in real-time when editing custom text/colors for quick bells
- Icon preview shape is now a rounded square (matching button) instead of a circle
- Fixed hours field not loading from Firestore for custom quick bells
## V5.44.0 — Custom Standalone Schedules - create blank schedules unlinked from shared bells
- New "Create Custom Standalone Schedule" button and modal
- Standalone schedules have baseScheduleId: null, isStandalone: true
- Schedule selector now shows three groups: Personal, Standalone, Shared
- Standalone badge displays when viewing a standalone schedule
- Anchor dropdowns now show bells from ALL periods (for cross-period relative bells)
