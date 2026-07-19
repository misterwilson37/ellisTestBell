# DESIGN-CALENDAR-V2.md — Calendar v2 / Shift v2 / Dashboard architecture

Status: DESIGN COMPLETE, GO AT OWNER'S PACE — agreed 2026-07-19 (round
4, "Whitechapel"). Briefly deferred to summer 2027 over a one-steering-
wheel concern, then UN-deferred the same night once verified in code:
all channels read the same live Firestore docs; Building Bells writes
ordinary period times old clients already render; relative bells resolve
live (parentBellId through the pure engine); and save paths round-trip
objects by spread, so additive fields survive old editors. NO dual
maintenance. Sole remaining gate before Building Bells: the 5.79.x
save-path audit below (expected result: zero changes needed). Owner may
start any evening; nothing here is season-blocked. This document is the spec §7's Stage 27
pointed at; it MERGES the formerly separate "Emergency shift v2" and
"admin broadcast/dashboard" roadmap items, because the design conversation
showed they are one system. Read HANDOFF.md first.

## 0. Hard invariants (from the owner, non-negotiable)

- **I0 — Shared Firestore.** The alpha/beta/school deployments all sit on
  ONE Firestore project. Every schema change in this effort is ADDITIVE:
  new collections, new docs, new optional fields. Never change the meaning
  of an existing field. A 5.79.x client at school must run untouched with
  all v2 data present. (Channel topology itself: see Open Questions.)
  COROLLARY (owner Q, 2026-07-19): additive data propagates to every
  channel instantly but is INVISIBLE to clients without v2 code — no
  dual-system maintenance. The one failure mode to verify before ANY v2
  field lands on a doc old clients edit: an old client whose save path
  does a full-document overwrite will silently STRIP unknown optional
  fields. Prefer separate docs (building_bells is one); audit 5.79.x
  save paths before adding anchor fields to schedule docs.
- **I1 — The building wins, every time.** No enforcement subsystem. A
  teacher CAN deviate from their designation; deviation is made VISIBLE
  (client banner + admin dashboard), never blocked. Social correction is
  the mechanism.
- **I2 — 30-second phone workflow.** On-the-fly transformations ("shift
  everything after lunch +5, called over the intercom") must be doable by
  the owner on a phone in under 30 seconds. Prefill/planning UIs may be
  desktop-grade; day-of tools may not.
- **I3 — Wall clocks matter most.** clock.html and old.html are the
  surfaces nobody touches, so they need automatic follow-along the most.
  Anything a wall clock must resolve has to be world-readable over REST
  and simple enough for ES5. This constrains data shapes from day one
  even though these surfaces ship last.
- **I4 — Quick bells stay the chaos valve.** Genuinely messy special days
  are allowed to be raw. Losing personalization on an alternate-base day
  is acceptable; the design aims for graceful transfer, not perfection.

## 1. The school's actual shape (why v1 died, what v2 must fit)

Three grades × two lunches = 6 core schedules (6thA/B, 7thA/B, 8thA/B) +
Related Arts A/B = 8 admin-built shared schedules running simultaneously.
Day structure: 4×66-min core + 2×44-min related arts, splitting the
building cleanly in half, plus a building-wide Flex at day end. Only SIX
bells play on the intercom: start of day, end of 3rd, start of 4th, end
of 6th, start of flex, end of day — everything else is per-classroom.
Monitors run 6th/7th/8th without lunch distinction; teachers run
personal (duped-but-anchored) schedules in-room. CDC: two teachers run
~9 unique from-scratch schedules each for ~20 high-needs students; some
bells tie into school schedules, many are whole-cloth. No floaters at
Ellis; other schools may have grade-split teachers.

Cadence: almost every day is identical. Variations: pep rallies /
special events (known ~2 weeks out, NOT at year start; typical shape =
"shorten everything after lunch so flex runs long"), and rare same-day
emergencies (+5 min called over the intercom). Testing weeks use an A/B
afternoon rotation where every day still differs a little. The feeder
high school runs a 5-day rotation (rotation support is aspirational, for
others).

V1's fatal flaw: ONE school-wide "today is Schedule B" — wrong model for
8 simultaneous schedules. V2 resolves designations per SCOPE (explicit
teacher lists), never globally.

## 2. Architecture: four layers + one shared concept

Build order is dependency order. Each layer ships alone and is useful
alone.

### Shared concept — Building Bells (new, small, do first)

The 6 intercom bells become first-class named entities:
`config/building_bells` (additive doc). Admin schedules gain OPTIONAL
per-bell anchor fields pointing at a building bell. Editing a building
bell (drift fix: 9:30 -> 9:30:30) moves every anchored bell in every
schedule — replacing today's fuzzy "shift all bells near 9:30?" modal
for the one case where building-wide really is right. The fuzzy modal
stays for unanchored legacy bells (I0: old behavior untouched).

### Layer 1 — Admin dashboard (presence + telemetry) — SHIPPED 6.4.0
(App surface only; clock.html reporting still open, below. ALSO
backported as a write-only block to the base channel — script.js
5.69.5 + SW 1.3.0, delivered 2026-07-19 — so pre-6.x faculty appear in
the census. Base-channel clients report; only 6.4.0+ reads.)

Who is signed in, which schedule they're running, which app version,
which surface. New collection `presence/{uid}` (additive), heartbeat
write on schedule change + every N minutes while open, fields:
{ lastSeen, activeScheduleId, activeScheduleName, appVersion, surface }.
Admin-readable only. Dashboard view in the Admin Zone with tag filters
(once Layer 3 exists) and a "not on designation" highlight (once Layer 4
exists). Limitation: old.html is unauthenticated and cannot write
presence — wall clocks appear via clock.html only (see Open Questions).
This layer is also rollout telemetry for the 6.x line itself.

### Layer 2 — Identity anchors (derivation hardening)

Upgrade personal-schedule anchors from TIME-keyed to IDENTITY-keyed:
{ baseScheduleId, periodId, edge: start|end, offsetSeconds } as NEW
optional fields alongside the existing time-based anchor data (I0 —
old fields keep working; old clients ignore new ones). Periods already
have start/end times in the data model, so period identity is the
anchor. Consequences:
- Transformations (Layer 4) resolve through period edges, so personal
  relative bells SURVIVE any transformation of their base for free.
- Alternate-base days: transfer anchors where a matching periodId
  exists on the new base, drop gracefully (with a client notice) where
  it doesn't (I4).
- Migration: one-time assisted upgrade — match existing time-keyed
  anchors to period edges by time, review-modal for ambiguities. Never
  destructive; unmatched anchors stay time-keyed.
- Scoped shifts finally work "at that small a scale": shifting a 6th
  grade period edge no longer drags 8th grade along by wall-clock
  coincidence.

### Layer 3 — Tags + roster

Users carry multiple tags (grade, subject, CDC, plus CAPABILITY tags —
e.g. `may-break-anchors`, granted narrowly per the owner's ineptitude
concerns). Self-serve tag selection in settings AND an admin roster UI
that can set anyone's tags (for the three teachers who never would).
CRITICAL UX DECISION (owner): tags are a FILTER for pickers, not a
runtime targeting mechanism. Any designation UI = filter by tag ->
eyeball the resulting list -> check/uncheck names -> the EXPLICIT
checked uid list is what's stored. No runtime tag resolution, no
priority rules, and the aspirational-related-arts teacher gets caught
by eyeball. CDC (all three grades in one room) needs no special rule
as a result.

### Layer 4 — The calendar (two verbs) + day-of tools

`config/schedule_calendar` (doc path RESERVED since v5.73.0; new
schema, additive). Per date, a list of entries; each entry =
{ scope: [uids] (picker-built per Layer 3), verb }:
- **Verb A — alternate base**: scope's designated schedule is X today
  (testing mornings; genuinely different structure).
- **Verb B — transformation recipe**: scope's normal base, transformed.
  Recipe archetypes to ship first, matching real Ellis usage: uniform
  shift of a time range ("+5 after 12:00"), and "shorten periods after
  lunch to extend flex." Recipes operate on period edges (Layer 2), so
  overlays survive.
Client behavior: auto-follow designation at day change (v1's
MANUAL_SCHEDULE_CHOICE_KEY machinery gets its purpose); deviation
allowed + bannered (I1). Resolver: extend the pure
resolveCalendarSchedule in bell-engine (tests exist) — pure, ES5-
portable shape (I3).
Two UIs, per owner: a PREFILL calendar grid (plan weeks ahead, edit any
cell — "plan ahead when we can, support whatever chaos the world
throws") with prefill GENERATORS (repeat-weekly; rotation cycles with
BOTH slip-forward and calendar-locked modes — unresolved preference,
support both, it's for another school); and a separate fast DAY-OF
modal satisfying I2.

### Wall-clock follow-along (ships last, constrains first)

The per-date resolved designation for the schedules a clock displays
must be readable unauthenticated over REST (rules carve-out like
personal_schedules) and computable in ES5. Keep the calendar doc's
resolved form flat and dumb: explicit dates, explicit schedule ids,
precomputed transformation results where feasible.

## 3. Sequencing

1. Building Bells (small; immediately fixes drift-correction workflow)
2. Layer 1 dashboard (independent; telemetry for everything after)
3. Layer 2 identity anchors + migration (the long pole; everything
   below stands on it)
4. Layer 3 tags + roster
5. Layer 4 calendar (verbs, prefill grid, day-of modal)
6. clock.html / old.html follow-along

## 4. Open questions (ask before the relevant layer starts)

- ~~Old-client save-path audit~~ **ANSWERED 2026-07-19** on the real
  base-channel file (ellisTestBell, script.js 5.69.4): field-level
  updateDoc + spread-rebuilt objects on every save path (30 sites, zero
  whole-doc overwrites). Unknown per-bell fields SURVIVE old-client
  saves. Belt-and-suspenders still applies: owner does admin schedule
  edits from alpha.
- **Channel topology**: owner is pushing 6.3.0 to a "beta channel" so
  v2 work takes over alpha. Map channels -> repos -> domains in
  HANDOFF §2 next session (alpha/beta/school all on the one Firestore
  per I0 — confirmed).
- ~~clock.html auth status~~ ANSWERED 2026-07-19: clock.html DOES load
  firebase-auth-compat and signs in, so TVs/grids CAN report presence.
  Adding it = small clock.html edit (surface: 'clock'); deferred from
  the 6.4.0 pass by choice, not necessity.
- Presence heartbeat interval vs. Firestore write costs at ~50 users.
- Recipe archetype list beyond the first two (gather during Layer 4).
- Whether alternate-base transfer notices should list dropped personal
  bells or just count them.
