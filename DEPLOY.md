# DEPLOY — Ellis Web Bell (rolling; rewritten each release)

One deploy doc, kept OUTSIDE the zip, describing the current release only.
Full history is in CHANGELOG.md.

**NO BUILD NEEDED.** Everything in this release is already built. You are
uploading files, nothing else. No terminal, no npm, no Firebase console.

---

## Current state

- **LIVE: 6.20.4** (you deployed it; the bell-time fix is confirmed working).
- **Pending: 6.21.0 + 6.22.0** — ONE push covers both.

App 6.22.0 · engine 1.16.0 (UNCHANGED) · service-worker 1.34.0 · old.html UNCHANGED (e56f1e4c…)

---

## UPLOAD THIS RELEASE

| File | Upload? |
|---|---|
| `index.html` | **YES** (6.22.0) |
| `service-worker.js` | **YES** (1.34.0 — the cache bump is what busts stale copies) |
| `src/js/` (whole folder) | **YES** |
| `styles.css` | **YES** (hand-written; dark-mode banner fixes) |
| `CHANGELOG.md`, `HANDOFF.md`, `DEPLOY.md` | **YES** |
| `bell-engine.js` | no — unchanged |
| `tailwind.css` | no — every class used was already compiled (checked) |
| `old.html` | no — unchanged, still `e56f1e4c…` |
| `firestore.rules` | no — **no rules change** |
| `tests/` | no — unchanged this release |
| `README.md`, `SETUP.md`, `ROLLOUT.md` | no — unchanged |

Everything in ONE commit. Push the whole `src/js/` folder even though only five
modules changed: a partial push can leave a stale module importing something a
fresh sibling no longer exports, which kills the whole ES-module graph.

**After pushing:** cache-bust (append `?v=NNN`) and confirm **6.22.0** in the
status modal (tap the footer version) BEFORE smoke-testing. Roll back by
re-pushing the previous tree in one commit.

---

## What's in 6.22.0 — read this one, it changes what gets SAVED

### 1. The big fix: editing a bell during an emergency shift no longer corrupts it

**The bug.** With a shift active (say +15 min), the bell list shows adjusted
times — a bell stored at 8:00 displays as 8:15. That is correct and by design.
But the edit modal was reading the *displayed* time and the save was writing to
the *stored* schedule. So if you opened any shared bell while a shift was
running and saved **anything at all** — a name typo, a different sound, a
building-bell anchor — the bell's stored time was rewritten to 8:15. Permanently.
For everyone on that schedule. No error, no warning. You would only find out
after the shift expired and the bell rang fifteen minutes late every day.

6.20.4 made this easier to hit, not harder: its "tick the box and save again"
message points at exactly the path that writes.

**The fix.** The modal now shows and saves the **stored** (base) time. When
today's clocks disagree, it says so in amber right under the field:

> 📅 Editing the base schedule time. Today this bell rings at 8:15 AM because of
> an active shift or schedule change — that adjustment is not being edited here.

You can still edit during a shift. That was deliberate — a name fix shouldn't
have to wait. What changed is that the number in the box is the number that gets
saved, and the shift still layers on top afterwards exactly as before.

### 2. Relative bells are no longer flattened by an edit

A shared bell whose time is *calculated from another bell* opens in the ordinary
edit box (there's an Edit button on every row). Saving it for everyone used to
replace the stored bell wholesale and throw away the link to its parent, turning
it into a fixed-time bell. Now the link is preserved, and the time field is
locked with a note explaining why.

### 3. "Set for all matching" no longer overlaps its panel

The two fields were refusing to shrink, so the button got squeezed and wrapped
onto three lines. Fixed.

### 4. The roster now tells you about people who've signed in but aren't on it

Signing in and being on the roster are two different things — signing in records
usage, it does not create a roster entry. That's why the banner could name Torres
while the roster list showed nobody by that name. The Roster & Tags modal now
shows an amber box listing anyone in that state, pointing at **Seed from
presence**.

### 5. The nudge banner's count matches its own list

It used to say "4 people" and then show three names and a "…". Now it says "and
1 more", and tells you how many of them aren't on the roster yet.

---

## SMOKE TEST

Do 1 and 2. They're the ones that touch saved data.

**1. The shift fix (the important one).**
   1. Note a shared bell's time — say 1st Period Start at 8:00.
   2. Admin Zone → set an emergency shift of +15 minutes.
   3. The list should now show that bell at 8:15. Good.
   4. Click **Edit** on it. **Expect:** the time field reads **8:00** (not 8:15),
      and an amber line says it rings at 8:15 today.
   5. Change only the NAME. Tick "Change this bell for everyone on this
      schedule." Save.
   6. **Expect:** the name changes; the list still shows **8:15**.
   7. Clear the emergency shift.
   8. **Expect:** the bell is back at **8:00**. Before this release it would have
      been stuck at 8:15 — that's the whole bug.

**2. Editing a time during a shift still works.**
   With the +15 shift still on, edit that bell's time to 8:05, tick the confirm,
   save. Expect the list to show **8:20** (8:05 base + 15). Clear the shift;
   expect **8:05**.

**3. Roster.** Open Admin Zone → Roster & Tags. **Expect:** the "Set for all
   matching" button sits on one line inside its panel. If anyone has signed in
   without a roster row, an amber box names them. Press **Seed from presence**;
   the box disappears and they appear in the list below, ready to tag.

**4. Dark mode.** Switch to the dark theme and re-open Roster & Tags. **Expect:**
   that amber box is readable — warm text on a deep amber background, not dark
   text on a pale one.

**5. Nothing else broke.** Load the page, confirm bells ring, confirm the version
   in the status modal reads 6.22.0.

---

## Also in this push: 6.21.0 (not yet deployed)

Duplicate Selected Schedule (Admin Zone, beside Rename); the Rename button works
for shared schedules instead of sitting greyed; the untagged-nudge and
designation banners are readable in dark mode. The duplicate's bells get **new
internal IDs** on purpose — personal mutes and overrides do not follow the copy.
Full detail in CHANGELOG V6.21.0.

---

## If something goes wrong

- **App blank / console says "does not provide an export named …"** — a partial
  push left a stale module. Re-upload the whole `src/js/` folder in one commit.
  (GitHub's web uploader caps around 100 files; `src/js/` is 41, so it fits.)
- **Still shows the old version** — GitHub Pages caches ~10 minutes. Append
  `?v=2` to the URL to check whether the file itself actually updated.
- **A bell time looks wrong after this release** — check whether an emergency
  shift is active before concluding anything; that is now displayed in the edit
  modal.
