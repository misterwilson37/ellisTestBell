# Ellis Web Bell — Changelog

Release history for the main app (src/js / index.html; script.js before 6.0.0). Sibling surfaces (clock.html, old.html, dashboard-config.html, service-worker.js) carry their own version notes in their file headers.

## clock.html v1.8.0 — the clock plays each bell's OWN sound
(Companion to app 6.25.1. Sibling surface; the app version is unchanged at
6.25.1. SW CACHE_VERSION 1.38.0 so clocks pick it up.)

- **FIX: `playBellSound()` took no argument** and played `config.sound` for
  every bell it rang, so a bell the teacher had deliberately set to
  "Silent / None" still rang on the clock. It now takes the bell's own sound and
  honours `[SILENT]`. Owner's reasoning: if someone has chosen sounds per bell
  on the website, the clock should play what they chose — silence included.
- **`config.sound` is now the FALLBACK**, used for any bell with no sound of its
  own, which is every bell on a never-customised schedule. The setup screen's
  label changed to say so. Existing setups sound exactly as they did.
- **Non-URL sounds fall back rather than failing**, mirroring `old.html`'s
  long-standing guard: the app stores a sound as either a full download URL or a
  Storage path, and `new Audio(path)` cannot resolve a bare path. On a signage
  clock a failed load is indistinguishable from a broken bell, so it falls back.
- **NO new control.** The owner asked for a per-schedule-line silent toggle
  defaulting to silent; the per-column 🔔 checkbox already does exactly that and
  already defaults to OFF. Inverting it would flip the meaning of `a1`…`a9`,
  which are baked into every saved clock URL, silently turning audio ON for
  anyone holding an old link.

**Verification:** 7 checks against the extracted real function — `[SILENT]`
plays nothing, a bell's own URL plays that URL, absent/empty/non-URL sounds fall
back, and a clock with no fallback configured plays nothing instead of throwing.
§5 battery green (74/74, 41 modules).

## V6.25.1 — A bell set to "Silent / None" rang the DEFAULT bell
(Owner: "I have a scheduled bell that's supposed to be silent. It's ringing the
default bell every time (which is very confusing)." Patch bump: pure bug fix.)

**Root cause, one line, no ambiguity.** The sound dropdowns have offered
"Silent / None" since 5.32/5.33 — module 19 injects `<option value="[SILENT]">`
into the Default Sounds optgroup of EVERY sound select, schedule bells included.
`playBell()` never had a case for it. So `[SILENT]` was truthy, skipped the
empty-soundName guard, and fell through to Case 3, which treats any
unrecognised soundName as a Firebase Storage path. `ref(state.storage,
'[SILENT]')` then `getBytes()` fails, the catch fires, and that handler's
"fall back to default" rings `ellisBell.mp3`. A bell explicitly marked silent
therefore rang the default bell — the loudest possible wrong answer, and worse
than either intended outcome.

- **FIX:** `playBell()` returns early on `[SILENT]`, before the synth cases.
- **The empty-soundName fallback is deliberately UNCHANGED.** An empty sound
  still rings the default. That asymmetry is intentional: empty means a field
  was never set, and a bell that goes quiet because of a blank field is a silent
  failure. `[SILENT]` is an explicit choice and is now honoured as one.
- **CORROBORATION:** `old.html`, the ES5 legacy surface, has handled `[SILENT]`
  correctly this whole time (`if (url === '[SILENT]') return;`). So the feature
  was real and the modular app is what lacks it — either it never made the 6.0.0
  modularization or it was dropped in it. Worth remembering when a feature
  "works on the old page but not the app".
- **NOT fixed, flagged on the roadmap:** `clock.html` ignores per-bell sounds
  entirely — it plays one configured `config.sound` for every bell — so a silent
  bell still rings on any clock column with audio enabled. That is a different
  shape of problem (its audio model, not a missing case) and needs the owner's
  call before changing.
- A system notification is still sent for a silent bell (`maybeNotifyBell` is
  untouched). That seems right — silent means no AUDIO, not invisible — but it
  is a judgement call, so it is recorded here rather than assumed.

**Verification:** §5 battery green (74/74, 41 modules). Plus a throwaway harness
that evaluates the REAL `playBell` source against stubs: 7 checks — `[SILENT]`
plays nothing, never reaches Firebase Storage, and never falls back; while the
default bell, the built-in synths, the empty-sound fallback and the
genuinely-broken-URL fallback all still behave exactly as before.
One file changed. SW CACHE_VERSION 1.37.1.

## V6.25.0 — Named queue steps; skip bells by name instead of blind
(Owner, on the countdown line: "it feels more helpful for it to say 'hamburger
time! (queue 1/2)'." And on skipping: "it got confusing to know which bells were
being cancelled, when all you're saying is 'skip' or 'unskip' bell." Minor bump.)

- **NEW: each queue step can carry a LABEL.** The countdown line now reads
  `Hamburger time! (Queue 1/2)` rather than a bare `Queue (1/2)`. That line is
  the same wide row that normally reads "until <bell name>!", so there is room.
  The label is OPTIONAL and empty falls back to the old bare form, so an
  existing saved queue is unchanged until it is edited. Labels ride inside the
  `steps` array, which module 15 stores whole, so no new field to whitelist.
- **NEW: the bell modal — skip/unskip the next five bells BY NAME.** Each row
  shows the bell's name and time with its own Skip/Unskip button. A skipped bell
  STAYS in the list, struck through, because otherwise there is nothing left to
  press Unskip on. The modal stays open as you toggle, so fixing a mis-skip does
  not mean reopening it.
- **REPLACES both old buttons rather than adding a third.** "Skip Bell" hit
  whichever bell was next and "Unskip" restored whichever was earliest, and
  neither NAMED the bell until after the fact — precisely the wrong behaviour
  during a schedule change. The single button now opens the modal, and its label
  changes to "Skip / Unskip Bells…" while anything is skipped. The owner's
  constraint was no more chaos on the main screen, so button count went 2 -> 1.
- **NOT a PiP problem.** Document Picture-in-Picture runs in a separate window,
  so opening this modal does not disturb a popped-out countdown.
- `skipNextBell()` now delegates to a new `skipBell(bell)`, so the blind path and
  the pick-from-a-list path share one implementation and cannot drift. Same
  occurrence key, so skips still self-clear overnight.
- **BUGFIX guarded on the way:** `updateMainPageSkipButtons()` opened with
  `if (!skipBtn || !unskipBtn) return;`. Removing the unskip button would have
  made that bail out every time, silently hiding the skip button forever. It now
  guards on the skip button alone.

**Verification:** §5 battery green (74/74, 41 modules). Plus a throwaway jsdom
harness: 28 checks, including the exact countdown string, the unlabelled-step
fallback, skipping the SECOND listed bell and asserting its neighbours are
untouched, the struck-through-but-still-listed state, and the guard bug above.
**NO CSS rebuild** — `line-through`, `max-h-80` and `last:border-b-0` are all
absent from the built tailwind.css, so those three are done with inline styles.
SW CACHE_VERSION 1.37.0.

## V6.24.0 — Save a queue as a Quick Bell
(Owner: "My class always starts with 15 minutes of typing... immediately after
is 2.5 minutes of an image of Beethoven... I have the 15 minutes saved as a
quick bell and the beethoven saved as a quickbell, but I don't have BOTH."
Minor bump: a new feature. Builds directly on 6.23.0.)

- **NEW: "Save as a Quick Bell" in the Quick Bell Queue modal.** Name the queue,
  press Save, and it becomes one of the four Quick Bell buttons. Pressing that
  button runs the whole sequence — each step with its own duration, sound and
  graphic. The owner's real case: a delayed start now costs one click instead of
  two, with no chance of forgetting the second half.
- **A saved queue is an ORDINARY custom quick bell carrying a `steps` array.**
  No parallel "saved queues" list. It lives in the same four slots, uses the
  same icon/colour controls in Manage Quick Bells, the same broadcast tick, the
  same backup/restore, the same Firestore document. Absent or empty `steps`
  means an ordinary one-shot bell, so every existing quick bell is untouched.
- **BUGFIX (pre-existing, found on the way): `alwaysBroadcast` did not survive a
  reload.** The Firestore snapshot handler in module 15 rebuilds each quick bell
  field by field from a WHITELIST, and `alwaysBroadcast` was never added when
  V5.65.0 introduced it. The setting is read when rendering the button and when
  launching, so ticking "broadcasts to all devices" worked until the next
  refresh and then silently reverted to off. Now carried through — along with
  `steps` and `queueRepeatTimes`. **The whitelist is commented as such now:** any
  new quick-bell field must be added THERE as well as at its write site, or it
  vanishes on reload.
- **Deliberate limits, both recorded in module 12's header:**
  (a) the button icon defaults to the FIRST step's graphic and the tooltip
  duration is the WHOLE run's total — then it is editable in the ordinary
  manager, so there is no second icon picker in the queue modal;
  (b) **"until a bell rings" repeat mode is NOT saved.** It targets a bellId from
  today's resolved schedule, which means nothing tomorrow. A saved queue always
  repeats by numeric count; the modal says so under the Save field.
- **The button icon is a DIAGONAL SPLIT of the queue's steps** — half a
  hamburger, half a Beethoven — rather than whichever graphic happened to be
  first. Bands are axis-aligned rects inside a clipPath rotated -45deg about the
  centre; the square's diagonal is 100*sqrt(2), so a band of `DIAG/n` tiles it
  exactly for any n, and at n=2 it is precisely half and half. A divider stroke
  between bands keeps two dark graphics reading as two. Steps without an image
  (the default "Q", custom text) fill their band with the bell's colours and the
  step number — never a broken `<image>`.
  **Capped at 3 bands** however many steps: past three, 44px of button divided
  diagonally is confetti, and the step-count badge already says how many there
  are. The icon is stored as a `[QUEUE_SPLIT]` SENTINEL, not baked in at save
  time, so editing a step's graphic later updates the button automatically.
- **Queue buttons are visually distinct:** a small step-count badge in the corner,
  and the hover label reads "2 steps / 17m 30s" rather than a bare duration,
  because the button runs a sequence and one time would understate it.
- Launch reads the steps from `state.customQuickBells`, NOT from a `data-*`
  attribute — steps are objects, and round 9's lesson about rebuilding state
  from rendered DOM applies here too.

**Verification:** §5 battery green (74/74, 41 modules). Plus a throwaway jsdom
harness driving the real modules against the real DOM: 25 checks, including the
owner's exact routine saved and relaunched, the 4-slot cap, the no-name refusal,
and a round trip through module 15's actual mapper source proving `steps`,
`queueRepeatTimes` and `alwaysBroadcast` now survive a reload while a plain bell
still loads with `steps: null`. **NO CSS rebuild** (the badge is positioned with
inline styles precisely to avoid one). NO rules change — `steps` is an additive
field on an existing user-owned document. SW CACHE_VERSION 1.36.0.

## V6.23.0 — Quick Bell Queue: a graphic per timer, not per queue
(Owner: "I'd like to be able to add a queue of bells to the quickbells menu. So
one bell with a graphic followed by another bell with a different graphic. Each
with its own sound." Minor bump: a new feature.)

**Most of this already existed.** The Quick Bell Queue (V5.55.0) has always run
a sequence of timers with a DIFFERENT SOUND PER STEP. The missing half was the
picture: one `queue-visual-select` at the bottom of the modal set a single
graphic for the entire run, stashed in `state.queueVisual`. So a queue could
say three different things and show one. "2 minutes to announcements" ->
"line up" -> "go" was impossible as one queue.

- **NEW: every timer row has its own "Graphic" dropdown**, beside its own
  "Sound". A queue entry is now a complete little bell:
  `{durationSeconds, sound, visual}`. Same option set the queue-level control
  offered — Default "Q", Shared Visuals, My Visuals — and deliberately still no
  "Upload..." entry: upload lives in the visual library, a queue row picks from
  what is already there.
- **The graphic is "before"-mode**, matching the rest of the app: a row's
  picture is on screen WHILE that row counts down, and swaps the instant that
  row rings and the next one starts. `advanceQueue()` increments `queueIndex`
  before starting the next timer, so `queueIndex` always names the running
  entry and `getQueueVisualHtml()` just reads it.
- **Module 10 needed NO change.** Its visual key was already
  `queue:<index>:<repeat>`, so the clock engine re-renders the cue on every
  advance; it only ever asked `getQueueVisualHtml()` what to draw. This is why
  the feature came in at five files — the queue's plumbing was right, it just
  had one variable where it needed an array field.
- **REMOVED: the queue-level "Visual Cue" control** (`#queue-visual-select` in
  index.html, and the `queueVisualSelect` const + export in module 02). Keeping
  it alongside per-row dropdowns would be two controls setting the same thing.
  `state.queueVisual` SURVIVES but is now write-never: it is read only as a
  fallback by `getQueueVisualHtml()` for an entry with no `visual` of its own.
- **Row layout rebuilt** from one wrapping line into three labelled lines
  (Length / Sound / Graphic) plus a header line carrying "Timer N" and the
  delete button. The label column is one identical `w-16` on all three lines and
  the trailing control is one identical `w-8 h-8 flex-shrink-0` on all three —
  the preview button, the graphic thumbnail, and a same-size spacer on the
  Length line — so every field begins and ends on the same two vertical rules.
- **NEW: a 32x32 live thumbnail** of each row's chosen graphic, at the end of
  the Graphic line. Five rows of identical-looking dropdown labels are hard to
  proofread before you hit Start; five little pictures are not.
- `renumberQueueTimerRows()` now finds the label via `.queue-timer-label`
  instead of `querySelector('span')`. The row contains several spans now (the
  h/m/s units) and the first one is no longer guaranteed to be the label.

**Verification:** §5 battery green (74/74, 41 modules, check:esm/lint/css/sw all
OK). Plus a throwaway jsdom harness (round-4 method, not shipped) that drove the
real module against the real index.html DOM: 24 checks, including a three-step
queue with three different graphics asserting three DIFFERENT rendered visuals,
the no-visual backward-compatibility fallback, and the label/trailing-control
alignment. **NO CSS rebuild needed** — every Tailwind class used was verified
present in the built tailwind.css. NO rules change, NO new module.
SW CACHE_VERSION 1.35.0.

## V6.22.0 — The edit modal edits the BASE schedule (shift-rebase data bug)
(RECONSTRUCTED in round 10 from the HANDOFF header, module 16's inline notes and
module 14's `pristine` comments. Round 9 shipped this code but never wrote the
entry, while module 16 tells its reader "see CHANGELOG V6.22.0 before changing
any of it" — a dangling pointer. If round 9's own account survives anywhere,
prefer it over this summary.)

- **FIX (data corruption): saving any shared bell during an emergency shift
  permanently rebased it for everyone.** The edit modal rebuilt its bell from
  the rendered row's `data-*` attributes, and module 14 renders CALCULATED times
  — shift and Verb B transforms already folded in. The shared save path writes
  into `currentSchedule.periods`, the PRISTINE document. So a rename, a sound
  change, an anchor change — any shared save while a shift was active — wrote
  the *adjusted* time into the base, silently, for all ~50 users. 6.20.4 made it
  MORE reachable by instructing admins to tick the confirm and save again.
  Fixed via `findStoredSharedBell()` (populate the modal from the STORED bell)
  and `resolveAllBellTimes({pristine: true})` (proximity check in base space).
- **FIX: the time field is locked for derived bells**, and `updatePeriodsOnEdit`
  now PRESERVES `relative`. It replaces rather than merges, and shared relative
  bells do reach the static editor, so saving one flattened it to a fixed bell.
- **Three fixes the owner reported from the wild:** the roster bulk-template
  button overlapping its panel; the untagged nudge naming people structurally
  absent from the roster list it opens; and that nudge's "4 people / 3 names"
  count mismatch.
- **LESSON (recorded in HANDOFF §9):** §4.6's "localSchedulePeriods stays
  pristine" was true of the VARIABLE and false of the SCREEN. Anything rebuilt
  from rendered DOM is in display space, not storage space.

**Known NOT done:** the same bug exists on the school channel (5.79.x —
`temporaryShift` landed in v5.74), where the owner is the only admin and so
exactly the person who can trigger it. Building (5.69.5) predates the shift and
is unaffected. SW 1.34.0, 74/74, 41 modules, no rules change, no CSS rebuild.

## V6.21.0 — Duplicate a schedule; two affordance/contrast fixes
(Owner: "I do not see a method of duplicating a schedule as an admin." Plus two
follow-ups from the 6.20.4 deploy screenshots. Minor bump: a new feature.)

- **NEW: Duplicate Selected Schedule** (Admin Zone, beside Rename). Deep-copies
  the selected SHARED schedule's periods into a new one, prompts for a name
  (defaults to "<name> (copy)"), logs a `duplicate-schedule` audit entry, and
  switches to the new schedule. Previously the only route was export-to-JSON and
  re-import. Six near-identical schedules run simultaneously here, differing
  mainly by lunch wave, so this is the common case.
  **DESIGN DECISION — identities regenerated, anchors preserved.** Every
  `bellId` and `periodId` in the copy is NEW. `bellId` is the key a teacher's
  personal overrides, mutes and skips are stored under, so reusing the source's
  ids would make one teacher's nickname or muted bell on "Lunch A" silently
  reappear on "Lunch B" — a cross-schedule bleed that would be brutal to
  diagnose. Relative bells' `parentBellId` values are remapped to the copy's new
  ids so chains survive. `buildingBellId` anchors ARE kept (an anchor means
  "this bell IS that intercom moment," which the copy genuinely shares).
  `temporaryShift` is NOT copied — an emergency shift is a fact about one
  schedule on one day, never an inherited property. No rules change: the new doc
  goes to `public/data/schedules` under the existing admin-write rule.
- **FIX: "Rename Schedule" was greyed out for admins on shared schedules.**
  `handleRenamePersonalSchedule()` bailed whenever `activePersonalScheduleId`
  was null — i.e. on every shared schedule — leaving an admin looking at a
  greyed button on a schedule they are entitled to rename, with no explanation.
  The button is labelled plainly "Rename Schedule", so it now renames whatever
  is selected: on a shared schedule it routes to
  `openRenameSharedScheduleModal()`, which has handled both types since V5.45.1
  and re-checks admin-mode itself. Same routing the inline pencil has used since
  v5.68.0. No new authority — this button simply stops being the odd one out.
- **FIX: banner text unreadable in dark mode.** `#untagged-nudge-banner`
  (6.15.0) and `#designation-banner` (6.10.0) were built with literal
  light-palette Tailwind (`bg-blue-100`/`text-blue-900`,
  `bg-amber-100`/`text-amber-900`) rather than the `--theme-*` variables the app
  themes through, so in dark mode the background darkened and the near-black
  text did not. The owner's nudge banner was illegible; the designation banner
  was equally broken and simply had not fired yet.
  `#overlap-warning-banner` (`bg-red-600`/`text-white`) is legible in both and
  is left alone — noted in the CSS so the next reader knows it was checked.
  Fixed in **styles.css** (hand-written, so no CSS rebuild) with
  `:root[data-theme="dark"]` overrides; light mode is byte-identical to before.
- **service-worker.js 1.33.0** (no new modules; cache bump). NO rules change,
  NO tailwind rebuild (`disabled:opacity-50` / `disabled:cursor-not-allowed`
  were already compiled), `bell-engine.js` and `old.html` untouched. 74/74.

## V6.20.4 — Admin CAN edit bell times (the four-round OPEN BUG, closed)
(Owner confirmed the diagnosis live: ticking the checkbox made the time save
immediately. Root cause was client-side and eight months old, not backend.)

- **THE BUG.** `handleEditBellSubmit` (module 16) gated the ENTIRE shared-bell
  save path on `wantsToOverrideForAll = isAdmin && overrideCheckbox.checked`.
  Unticked, it took the personal-override path — and a personal override object
  has fields for nickname, sound and visual and **no field for time**. An
  admin's new time was therefore discarded, the modal closed, and
  `closeEditBellModal()` cleared `editBellStatus` on the way out, so even the
  "Customization saved." line was never readable. Silence, no error, no change.
- **WHY ALL THREE CHANNELS.** The gate landed in **V5.66.2**, which was a
  *sound* fix ("Admins see 'Override for all users' checkbox to optionally push
  to shared bell") but placed the flag at the top of the whole save path. 5.66.2
  predates 5.69.2, 6.11.0 and 6.20.x, so every channel carried it. The
  cross-version repro was evidence of an OLD CLIENT BUG, not a backend one.
- **WHY IT GOT WORSE IN 6.11.0.** The lock-note redesign added
  "🔓 Admin: saving a new time changes this bell for every user of this
  schedule" directly under an input whose value was being thrown away. The UI
  began promising exactly what the code refused to do.
- **FIX (module 16):** a time change that would land on a path that cannot
  store it now REFUSES the save — modal stays open, typed time preserved,
  status line names the confirm, focus moves to it. No auto-escalation: pushing
  a bell to ~50 people stays a deliberate act. Comparison runs through
  `normalizeTimeString` on both sides, so a browser returning `11:30` instead of
  `11:30:00` from `type="time" step="1"` cannot make an unchanged time look
  changed and block personal-only saves.
- **FIX (module 16):** both save paths now call `showUserMessage`, since
  `editBellStatus` dies with the modal. Personal: "Saved for you only — this
  bell is unchanged for everyone else." Shared: "Saved for everyone on this
  schedule." A save and a no-op no longer look identical.
- **FIX (index.html):** the confirm is relabelled from "Override shared **sound**
  for all users" to "Change this bell for **everyone** on this schedule", with a
  sub-line stating that name/sound/visual stay personal when unticked and that
  times require the box. The label now describes the whole modal, which is what
  the control has actually governed since 5.66.2.
- **REMOVED (index.html + module 16):** the `edit-bell-visual-override-checkbox`
  ("Override shared visual for all users"). It was shown to admins but its
  `.checked` was never read by any code — a dead control beside a live one.
- **REMOVED (module 99):** a V4.95 listener that set
  `editBellSoundInput.disabled = !checkbox.checked`. V5.66.2 made personal sound
  overrides available to everyone, so this silently revoked sound editing from
  any admin who ticked the box and then unticked it. The confirm decides WHO a
  change reaches, never WHETHER a field is editable.
- **FIX (module 16): false watchdog.** The 6.20.3 watchdog fired
  `[Watchdog] ... (base=true, personal=false)` on EVERY shared-schedule
  selection — twice per admin toggle, since `toggleAdminMode` re-enters
  `setActiveSchedule`. The shared branch attaches no personal listener and so
  never set `isPersonalScheduleLoaded`. Harmless (the latch short-circuits on
  `activePersonalScheduleId`) but it was crying wolf in the one log a future
  debugger reads. The flag is now set explicitly in the shared branch.
- **FIX (module 16): real `onSnapshot` error callbacks** on the three listeners
  that had none (standalone-personal, linked-base, linked-personal). §7 asked
  for these. Each logs and then fails open, so an erroring listener can never
  again wedge the latch in silence.
- **tests/bell-engine.test.mjs RESTORED to 64 tests** (was 41 on GitHub). The
  rounds 8–11 tests never reached the repo because the deploy manifest omits
  `tests/`. 74/74 across both suites. See HANDOFF §9.
- **service-worker.js 1.32.0** (no new modules; cache bump). NO rules change,
  NO CSS rebuild (all classes used were already compiled), `bell-engine.js` and
  `old.html` untouched.

## V6.20.3 — Fail-open the schedule load latch (silent editor freeze)
(Owner: "none of them are allowing me to change bell times" — on alpha 6.20.0,
beta 6.11.0 AND 5.69.2, with NO console error. The one console line was
`Delaying calculation: base and personal schedules have not both loaded`.)

- **Root cause candidate identified.** recalculateAndRenderAll() bails out early
  whenever state.activePersonalScheduleId is set and either isBaseScheduleLoaded
  or isPersonalScheduleLoaded is still false. Both flags are only set inside
  their onSnapshot success callbacks (module 16), and NEITHER listener has an
  error callback — so a listener that never reports leaves the latch stuck
  permanently. Result: nothing re-renders, bell edits appear impossible, and
  NOTHING is logged as an error. That matches the report exactly, including why
  it reproduces on 5.69.2 (the guard dates to v4.32, long predating round 7).
- **Watchdog (module 16 setActiveSchedule, state.loadLatchWatchdogId)**: 6s after
  a schedule switch, if either flag is still false, force BOTH true, log which
  one failed, and recalculate. Rendering a possibly-incomplete schedule is far
  better than a dead editor. Fail-open by design.
- **Guard message now names the missing listener** (BASE / PERSONAL + the
  personal id) instead of an unactionable one-liner.
- **Carries 6.20.2** (nested periods are not collisions — lunch inside 4th;
  overlap hook try/catch-guarded) **and 6.20.1** (update popup removed).
- **Versions**: app 6.20.3; engine 1.16.0; service-worker 1.31.0. old.html
  UNCHANGED. No rules change, no new module. 74/74.
- **STILL UNKNOWN**: WHY a listener fails to report. The watchdog makes the app
  usable and self-reporting; the `[Watchdog]` console line will name the culprit.

## V6.20.2 — Nested periods are not collisions (false lunch overlap) + hard guard
(Owner report: the overlap banner cried wolf on the exact edit they were making —
"4th Period ends 12:08 PM, but Lunch A begins 11:36 AM". Root cause: lunch waves
run INSIDE 4th period, and that is true of EVERY lunch; the detector treated
containment as a collision. Nesting is legitimate schedule structure.)

- **bell-engine 1.16.0 — detectPeriodOverlaps ignores NESTED spans.** If either
  period is fully contained in the other (lunch inside 4th, advisory inside a
  block), it is skipped. Only PARTIAL overruns are reported. +1 regression test
  covering lunch-inside-4th, lunch moved earlier (the edit that triggered it),
  and a genuine partial overrun still firing. 74/74.
- **module 18 — the overlap hook is now wrapped in try/catch.** It is a cosmetic
  warning bolted to the tail of the sacred render path; it must never be able to
  take rendering or bell EDITING down with it. Never remove that guard.
- **Carries 6.20.1** (never deployed): the "New version available!" popup is
  removed in favour of a silent one-time reload on controllerchange.
- **Versions**: app 6.20.2; engine 1.16.0; service-worker 1.30.0. old.html
  UNCHANGED. No rules change, no new module.
- **NOT fixed here — admin cannot edit bell times.** Reported across alpha
  (6.20.0), beta (6.11.0) and 5.69.2. 5.69.2 predates every change in this
  round, so a shared backend cause (rules / data / admin record) is far more
  likely than app code. Admin DETECTION is confirmed working (the untagged-teacher
  nudge and the Fix... button only render for a confirmed admin). Next step is the
  browser console error on a failed save, not more code changes.

# Ellis Web Bell — Changelog

Release history for the main app (src/js / index.html; script.js before 6.0.0). Sibling surfaces (clock.html, old.html, dashboard-config.html, service-worker.js) carry their own version notes in their file headers.

## V6.20.1 — Kill the "New version available!" popup (silent auto-update)
(The PWA update toast — fixed once in 6.15.0 for hard-refresh — was still
firing on a normal post-deploy BOOT, which is pure noise on an unattended
clock. Owner reported it a second time, on a clock display. Removed.)

- **module 99**: dropped the updatefound → "New version available! Refresh to
  update." toast entirely. The service worker already skipWaiting()s +
  clients.claim()s, so a new version takes control on its own; now the page
  simply RELOADS ONCE, silently, on `controllerchange`. Guards: only when
  wasControlledAtLoad (a genuine update — never a first install or a hard
  refresh, which already has fresh code) AND no modal/editor is open (so an
  admin mid-edit is never interrupted; they get the update on their next load).
- **Net effect**: clocks self-update seamlessly after a deploy — no dialog, no
  one tapping OK. Interactive users get a brief one-time reload (or the deferred
  update next load if they're mid-edit).
- **Rollout note**: clients still on 6.20.0 show the old popup ONE last time as
  they pick up 6.20.1 (they're running the old code at that instant); hard-
  refreshing a clock once on deploy avoids even that.
- **Versions**: app 6.20.1; service-worker 1.29.0 (cache bump); bell-engine
  unchanged (1.15.0); old.html unchanged. 73/73 tests. No rules change.

## V6.20.0 — Wall-clock feed (reader half): the clocks follow the calendar
(Phase 2 / the payoff. First change to old.html all round — the ES5 legacy
hallway-clock/TV page — kept minimal and fail-open. md5 re-recorded:
b8dd5f5a4c8fed0765c982a9ccc43204 → e56f1e4c50c597cfe9e5618e0b53c732.)

- **old.html now reads config/clock_feeds** (the public doc the 6.19.0
  publisher writes). New ES5 fetchClockFeeds() caches the feed map via the
  existing parseFields REST parser; loadPublicSchedule, for its pinned public
  schedule, prefers feeds[thisScheduleId] when its date === today, rendering
  those already-transformed periods instead of the base. Everything downstream
  — relative-bell resolution, the emergency shift, rendering — is unchanged;
  the clock never does recipe math. Fail-OPEN: any error/404/absence just shows
  the base schedule.
- **Emergency shift on top of the feed**: feed periods (un-shifted) get
  applyShiftToScheduleData with the base doc's temporaryShift, so a same-day
  shift AND a transform compose correctly (recipe-then-shift, matching the app).
- **Reaches running TVs automatically**: the feed is fetched right before each
  load at both call sites (dropdown pick + the existing 5-minute auto-refresh),
  so a clock that's been on since morning picks up a midday pep-rally change
  within the refresh cycle — same path the emergency shift already rides.
- **BUGFIX (pre-existing, found while here)**: the 5-minute refresh's public
  branch stored the schedule as `data: fields` WITHOUT applying the emergency
  shift (the initial load applied it) — so shifts were silently dropped on
  refresh. Now mirrors the boot path (applyShiftToScheduleData(fields)).
- **No firestore.rules change** (config already public-read). No new module.
- **Versions**: app 6.20.0 (index triple); service-worker 1.28.0 (cache bump);
  bell-engine UNCHANGED (1.15.0). 73/73 tests; old.html main script syntax-
  checked; ES5 verified (no const/let/arrow/template literals).
- Deploying old.html: it's a standalone page the TVs load directly — cache-bust
  it (e.g. append ?v=620) so the dumb clients pick up the new file.

## V6.19.0 — Wall-clock feed (publisher half)
(Phase 1 of getting the hallway TVs/clocks to follow the calendar. This half
is the authenticated PUBLISHER + opt-in UI; the old.html READER is 6.20.0. No
rules change — config is already public-read.)

- **The clocks are dumb by design** (old.html: unauthenticated ES5, can't do
  recipe math), so an authenticated ADMIN precomputes and publishes the answer.
  When a transform is active for today and opted into clocks, the app applies
  it with the existing engine and writes the flat, resolved periods to the
  public **config/clock_feeds** doc, keyed by schedule id, dated. config/{id}
  is already `allow read: if true` + admin-write, so NO firestore.rules change.
- **"Show on clocks" picker (module 34)**: authoring a transform now offers a
  checklist of shared schedules whose hallway clocks should reflect it —
  EXPLICIT, per owner (no tag/uid inference, consistent with Layer 3). Stored
  as clockScheduleIds on the transform entry; leave unchecked to change only
  people's apps.
- **Publisher (module 20 publishClockFeeds)**: runs on every calendar/schedule/
  day trigger (via refreshActiveTransforms); admin-only (writes fail for others
  by rule, so it no-ops). Composes all of today's clock-targeting recipes per
  schedule onto that schedule's base periods. Resets a schedule's feed to base
  if its transform was removed earlier the same day (so a cancelled change
  stops showing before midnight); stale (old-dated) feeds are ignored by the
  reader.
- **Verifiable in the Firestore console** without touching old.html: publish a
  reclaim-FLEX transform ticked for the 7th-grade clock, then look at
  config/clock_feeds — feeds.<7th-id> should hold the transformed periods dated
  today.
- **Versions**: app 6.19.0 (index triple); service-worker 1.27.0 (cache bump);
  bell-engine UNCHANGED (1.15.0). 73/73 tests. No rules change, no new module.
- **NEXT (6.20.0)**: the small ES5 change so old.html reads config/clock_feeds
  and renders today's feed when present — the reader half. First touch of
  old.html all round; md5 re-recorded then.

## V6.18.1 — Shrink protects passing periods too
(Follow-up to owner feedback: "Shrink" was the one resolver strategy that
consumed the passing period. Fixed.)

- **engine 1.15.0**: planOverlapResolution 'shrink' now honors protectGaps
  (default TRUE). Instead of butting the next period's start right against the
  overrun's end (zero passing period), it leaves a passing period — reusing
  that period's own outgoing gap (passing periods are ~uniform), or the
  smallest positive gap in the schedule as a fallback. Only the next period's
  start moves, so dismissal is unchanged either way; uncheck the box to butt
  them together. Passing periods remain a MEASURED quantity (next.start −
  this.end), never a stored field.
- **UI (module 37 + index.html)**: the "Protect in-between times" checkbox
  moved out of the spread-only box and now governs BOTH Shrink and Spread
  (hidden for Push, which preserves every gap inherently).
- **Versions**: app 6.18.1; service-worker 1.26.0 (cache bump); bell-engine
  1.15.0. 73/73 tests. No rules change, no new modules.

## V6.18.0 — "Reclaim a period" (the FLEX magic trick)
(The "guest speaker won't stop talking — kill FLEX and give the day back"
tool. A per-day Verb B transformation recipe: ephemeral, non-destructive,
reversible by deleting the calendar entry, and NEVER a saved schedule or a
dropdown entry.)

- **bell-engine.js 1.14.0 — applyRecipeToPeriods gains the 'reclaim'
  archetype** ({ type:'reclaim', periodName }). Removes the named period for
  the day and redistributes the time it occupied — **[previous period's end →
  reclaimed period's end]**, which is the reclaimed duration PLUS the incoming
  passing period — evenly across every surviving period, with **dismissal
  pinned**. Sacrifices the INCOMING passing period, PRESERVES the OUTGOING one
  (so the two periods that become adjacent still get a passing period). Because
  freed = incoming gap + reclaimed length is handed back as extra duration and
  the day-end is fixed, each remaining class comes out a little longer — the
  net-positive the owner wanted. Pure, tested (last-period and mid-period
  cases: FLEX 22 min + 4-min passing = 26 freed; day ends the same). Static
  bells only; relatives re-derive.
- **Recipe builder (module 34)**: a third recipe type, "Remove a period & give
  its time to the rest of the day," with a period-name field (datalist of
  known period names). Authored in the day-of modal and flows through the grid
  like any transform. describeRecipe (module 20) labels it.
- **Rides the existing Verb B pipeline** — resolveCalendarTransforms already
  carries any transform recipe; module 14 applies it pre-merge at
  resolveAllBellTimes. No new wiring, no rules change, no new module.
- **Versions**: app 6.18.0 (index triple); service-worker 1.25.0 (cache bump);
  bell-engine 1.14.0. 73/73 tests.
- **Known v1 edge (documented, HANDOFF §7)**: a relative bell anchored INTO
  the reclaimed period orphans to its fallback for that day. Folding such
  anchors onto a surviving neighbor is a future refinement.

## V6.17.1 — Resolver tweaks (protect passing periods; demote "push")
(Amends the never-deployed 6.17.0 per owner feedback. Deploy THIS, not 6.17.0.)

- **"Protect in-between times" checkbox on Spread, DEFAULT ON.** Passing
  periods are the minimum kids need to get around (and use the bathroom) —
  non-negotiable. When on (default), the overlap comes out of the CHECKED
  periods' own length; every passing gap stays intact and dismissal is pinned.
  Uncheck to revert to the old gap-tightening behavior. engine 1.13.0 adds the
  protectGaps flag to planOverlapResolution (default true).
- **"Push everything later" demoted to the THIRD option** (it changes
  dismissal for the whole building — realistically never used) and gated
  behind a deliberately dramatic confirm ("…Think of the children! The
  parents! The bus drivers! … the TEACHERS!") before it moves the end of day.
- **Order now**: Shrink (default) · Spread (protect-gaps default) · Push (with
  confirm).
- **Versions**: app 6.17.1; service-worker 1.24.0 (cache bump); bell-engine
  1.13.0. 71/71 tests. No rules change, no new modules.

## V6.17.0 — Collision resolver + bolder overlap banner
(The "fix it" half of 6.16.0's detector — the feature the owner dreamed up —
plus making the warning loud now that it's actionable.)

- **Bolder banner (module 37 + index.html)**: the overlap warning went from a
  thin pale strip to a bold red bar with a white **Fix…** button. Only shown
  to an admin editing a SHARED schedule (a personal-overlay user can't
  accidentally rewrite the shared base). Dismiss still hides it until the
  overrun set changes.
- **Resolver modal (module 37)** with PREVIEW-before-apply — you always see
  the exact bell-time changes before anything is written. Three strategies:
  - **Shrink the next period** — its start moves to the overrun's end; it's
    shorter; the day ends on time. (One bell; simplest.)
  - **Push later** — the next period and everything after shift later by the
    overlap; nothing shortens; the day ends later.
  - **Spread across periods I choose** — checkboxes of the following periods;
    the overlap is split evenly and the gaps after the checked periods tighten
    so each period keeps its length and the day still ends on time. Warns if a
    gap can't absorb its share.
- **bell-engine.js 1.12.0 — planOverlapResolution(periods, overrunName,
  strategy, absorbNames)** (pure, tested, all three strategies): returns the
  bell moves + day-end delta + any warning. Moves ONLY static bells; relative
  bells are never touched and re-derive downstream.
- **Apply path (module 18)**: on Apply, module 37 hands the moves to module 18
  via an event (no import cycle); module 18 rewrites the named static bells in
  state.localSchedulePeriods and writes `periods` — the source of truth,
  exactly as the delete-period path does (no new save path invented) — logs a
  'resolve-overlap' audit entry, and the shared listener recalcs, which clears
  the banner if resolved.
- **Versions**: app 6.17.0 (index triple); service-worker 1.23.0 (cache bump,
  no new modules); bell-engine 1.12.0. 70/70 tests. No firestore.rules change.
- **Note**: "spread" v1 tightens the GAPS between the checked periods (each
  keeps its own length). If the owner wants the periods THEMSELVES to shorten
  (lose instructional minutes), that's a labeled refinement — the preview
  makes the current behavior explicit before applying.

## V6.16.0 — Period overrun detection (the "you're cutting into 4th" warning)
(First, SAFE half of the collision resolver the owner dreamed up. Detection
is read-only; the destructive shrink/spread auto-fix is a deliberately
separate later slice — it moves bells on the sacred live-edit path, so the
detector earns real-world trust first.)

- **bell-engine.js 1.11.0 — detectPeriodOverlaps(periods)** (pure, tested):
  flags any period whose LAST bell runs past the NEXT period's FIRST bell.
  Only periods with a real extent (≥2 distinct times) count — single-bell
  markers and relative-only stubs are skipped — and back-to-back boundaries
  (end == next start) are NOT flagged, so ordinary passing-period gaps never
  trip it. Returns the offending pairs with times + overlap seconds.
- **NEW module 37-overlap-warning.js** — after each recalc, if admin-mode is
  on, runs the detector on state.calculatedPeriodsList (the very periods
  being displayed) and shows a dismissible RED banner: "⚠ 3rd Period ends
  10:44 AM, but 4th Period begins 10:38 AM — a 6-minute overlap." Strictly
  read-only; never moves a bell. Dismiss hides it until the overrun SET
  changes (fix-and-rebreak still re-warns; an unchanged warning stays hidden).
  Hooked via one additive line at the tail of recalculateAndRenderAll
  (module 18) — display only, cannot affect editing or ringing.
- **BUGFIX — engine VERSION constant drift**: BellEngine.VERSION had silently
  stuck at '1.8.0' since the 1.9.0/1.10.0 header bumps never updated the
  constant (a str-replace that missed, and nothing in the battery verifies
  it — the status modal has been under-reporting). Corrected to 1.11.0.
- **Versions**: app 6.16.0 (index triple); service-worker 1.22.0 (NEW module
  → CORE_ASSETS now 41, cache bump); bell-engine 1.11.0. 69/69 tests. No
  firestore.rules change.
- **DEFERRED (next slice, documented)**: the interactive resolver — shrink
  the next period, spread the overflow across periods you pick (checkboxes),
  cancel, or allow-anyway. It rewrites bells on the live schedule, so it gets
  its own careful release once the detector is proven on real schedules.

## V6.15.0 — Untagged-teacher nudge + hard-refresh update-toast bugfix
(Two things: the operational glue that pairs with the home schedule, and a
fix for a long-standing annoyance the owner flagged.)

- **Untagged nudge (NEW module 36-untagged-nudge.js)** — an admin can't
  preload every teacher; people trickle onto the roster over the first
  weeks. On admin sign-in, a one-time cross-reference of presence ∩ roster
  finds anyone who has SIGNED IN (a non-clock presence report) but has NO
  TAG yet, and shows a dismissible blue banner ("N people have signed in
  but have no tags yet …"). Its Review button opens the existing Roster &
  Tags modal — no authoring duplicated. Admin-only (gated on the
  server-confirmed admin flag; the check only runs on an
  `ellis-admin-confirmed` event module 15 fires for real admins). Reads
  only; never resolves a tag into a target (Layer 3 invariant intact).
  Flow: Ms. Johnson signs in → admin is nudged → tag her + set her home
  schedule (or re-run the 6.14.0 template) → module 20's home listener
  lands her on the right schedule.
- **BUGFIX — spurious "New version available!" on hard refresh (module
  99).** The PWA update toast checked `navigator.serviceWorker.controller`
  LIVE at the new worker's `statechange`. Because the SW uses
  skipWaiting + clients.claim, a hard refresh (which loads uncontrolled
  and pulls the latest from the network) would have the freshly-installed
  worker race to claim the page, flipping `controller` truthy, so the
  toast fired even though the user already had the newest code. Fix:
  capture `wasControlledAtLoad` ONCE, up front, before any new worker can
  claim, and gate the toast on that. Hard refresh → uncontrolled at load →
  no toast (you have latest). Normal reload served from the old cache →
  controlled at load → toast stays useful ("you're on the old version,
  refresh"). First-ever install is uncontrolled too, so it stays silent.
  skipWaiting/claim untouched, so the wall-clock TVs still auto-update.
- **State**: new server-confirmed `state.isAdmin` (distinct from the
  manual admin-mode toggle), set in module 15's auth handler.
- **Versions**: app 6.15.0 (index triple); service-worker 1.21.0 (NEW
  module → CORE_ASSETS now 40, cache bump); bell-engine UNCHANGED (1.10.0).
  68/68 tests. No firestore.rules change (presence + roster reads already
  admin/authed).

## V6.14.0 — Home Schedule (invariant-safe per-teacher default)
(A teacher's "normal day" schedule, so 6th-grade teachers land on the
6th-grade schedule without picking it each morning — and the CDC teacher,
who carries all three grade tags, is set to one schedule explicitly, once.
Opt-in and backward-compatible: teachers with no home set behave exactly
as before. Honors the Layer 3 invariant — explicit per-uid defaults, never
runtime tag resolution.)

- **roster/{uid}.defaultScheduleId** (new optional field) — a teacher's
  home shared schedule. Admin-set. No rules change (roster is already
  self-readable / admin-writable; the field is additive).
- **Resolution (module 20, restructured)**: order is now (1) scoped
  calendar designation → mandate, auto-follow + I1 banner on deviation;
  (2) school-wide exception/weekday default → mandate (rare at Ellis);
  (3) HOME schedule → SILENT auto-load, no banner. Home is a convenience,
  not a building mandate: it never overrides a same-day manual pick and
  NEVER yanks a personal-schedule user off their overlay. Steps 1+2
  reproduce the old resolution exactly; step 3 is the new per-teacher
  layer, reachable even with no calendar doc. A live listener on the
  user's own roster doc means an admin setting a default takes effect at
  once.
- **bell-engine.js 1.10.0** — resolveScopedDesignation extracted (the
  scoped-mandate half of resolveCalendarSchedule) so module 20 can tell a
  bannered mandate from the silent home default. resolveCalendarSchedule
  behavior unchanged (now calls the extraction). +1 test (68/68).
- **Roster UI (module 33)**: each person gets a Home schedule picker;
  a bulk template panel sets the home default for everyone matching a
  tag/name filter (with a count + confirm to eyeball first) — the
  "6th → 6th-grade schedule" one-click, re-runnable as new people are
  tagged.
- **Select all shown / Clear (module 34)** in the designation people
  picker — quality-of-life for designating a whole filtered group.
- **Versions**: app 6.14.0 (index triple); service-worker 1.20.0 (cache
  bump — no new modules, CORE_ASSETS unchanged); bell-engine 1.10.0.
  No firestore.rules change.
- **Deferred (documented)**: alerting the admin when a signed-in teacher
  has no tag/home yet (the "Ms. Johnson finally logged in" nudge) is the
  next slice — it pairs with this and rides on presence + roster.

## V6.13.0 — The Prefill Grid (Layer 4 "plan the weeks" — view + edit + repeat-weekly)
(First of Layer 4's two planning UIs. The day-of modal covers I2 chaos;
the grid covers "plan ahead when we can." New module 35. Rotation-cycle
generators — slip-forward / calendar-locked — are the documented NEXT
slice; deliberately out of scope here as they're aspirational/for other
schools per the design doc.)

- **New module 35-schedule-grid.js** — a desktop-grade "Plan Ahead"
  calendar modal. A navigable 6-week grid (← Today →, paging 4 weeks)
  reads config/schedule_calendar (getDoc snapshot, like module 34) and
  summarizes each date's base designation(s) (▸ schedule name) and
  transform(s) (⚡ via the shared describeRecipe). Clicking any day opens
  the existing day-of modal (module 34) PRESET to that date — all
  authoring (base + the Verb B recipe builder) is reused, not
  reimplemented. The grid hides while the editor is up and reshows +
  refreshes when it closes, wired by DOM CustomEvents so module 34 never
  imports the grid (no cycle).
- **Repeat-weekly generator** — copy one date's whole plan onto every
  same-weekday date through a chosen end date. Each copied entry routes
  through the engine's mergeCalendarEntry, so re-designating the same
  people on a target date that already has a plan does the correct
  last-write-wins thing (and transforms compose).
- **bell-engine.js 1.9.0** — mergeCalendarEntry extracted: the base-dedup
  / transform-append rule that was inline (and untested) in module 34
  since 6.11.0 now lives in one pure, tested place, shared by the modal
  and the grid's copy-forward. Behavior identical; module 34 rewired to
  call it. +1 test (67/67).
- **Module 34** — open() now accepts an optional preset date; exports
  openDesignationModal(dateStr) for the grid; emits ellis-calendar-changed
  on save/remove and ellis-designation-closed on close. Day-of behavior
  unchanged (preset defaults to today).
- **Versions**: app 6.13.0 (index triple); service-worker 1.19.0 (NEW
  module → CORE_ASSETS now 39 modules, cache bump); bell-engine 1.9.0.
  No firestore.rules change (config/schedule_calendar already covered).

## V6.12.0 — Verb B wired (Layer 4 transformation recipes go live)
(The engine functions that shipped dormant in 6.11.0 now have callers —
same wake-the-resolver step 6.10.0 did for Verb A. No engine change, no
rules change, no new modules. Mostly UI.)

- **Resolution path (state.js + module 20 + module 14)**: the day's
  transformation recipes for THIS user resolve into a new
  `state.activeCalendarTransforms` and apply to COPIES of the base
  periods in `resolveAllBellTimes`, before the shared/personal merge —
  the same pristine-copy discipline as the emergency shift, so
  `localSchedulePeriods` is never mutated (edit modals stay honest).
  Recipes compose in resolution order; the emergency shift, if any,
  still rides on top (recipe = planned structure, shift = day-of blanket
  nudge). Relative bells — shared AND personal — re-derive from the moved
  parents downstream, so Layer 2 overlays survive a transform for free.
  Module 20 refreshes the recipe set on every calendar/schedule/day
  trigger, INDEPENDENT of base designation (Verb B needs no Verb A), and
  only re-renders when the set actually changes.
- **I1 banner (module 20)**: the amber designation banner now surfaces
  active transforms too — "Today's bells are adjusted: …", or appended to
  a base-deviation notice. Follow is hidden in transform-only mode (there
  is no base to follow). `describeRecipe` is exported so the modal's entry
  list and the banner share one summary string and can't drift.
- **Recipe builder (module 34 + index.html)**: the day-of Designation
  modal gains a mode toggle — "Designate a base schedule" (Verb A, as
  before) vs "Apply a transformation" (Verb B). The transform builder
  authors both archetypes: SHIFT (minutes earlier/later, optional
  from/until bounds) and SHORTEN (shorten periods after a time by N
  minutes each, optionally naming a period to extend — a datalist
  suggests period names across all admin schedules). Same Layer 3 people
  picker (explicit checked uids stored, never tags). Transforms COMPOSE:
  no dedup on save — a person can carry several, and be base-designated
  too; Remove takes one back.
- **Wall-clock precompute NOT in scope**: app clients resolve recipes at
  runtime (module 14). Precomputing resolved times into the calendar doc
  for the ES5 REST wall clocks remains the last Layer 4 slice
  (follow-along), still unstarted.
- **+1 test (66/66)**: a pipeline test folds resolveCalendarTransforms
  output through sequential applyRecipeToPeriods exactly as module 14
  does — pins compose-in-order and the no-op-preserves-base-reference
  contract the wiring leans on.
- **Versions**: app 6.12.0 (index triple bumped); service-worker 1.18.0
  (cache bump only — no new modules, CORE_ASSETS unchanged); bell-engine
  UNCHANGED at 1.8.0. No firestore.rules change.

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
