# DEPLOY-6.3.0.md — deploying v6.3.0 to the alpha repo (CUMULATIVE)

**Covers BOTH undeployed releases: 6.2.0 (modal chrome) + 6.3.0
(schoolification).** No build, no terminal, no Firebase console. Both
releases are structural/additive — **the app should look and behave
EXACTLY as your deployed 6.1.0 does.** That sameness is the test.

## Step 1 — DELETE from the repo

| File | Why |
|---|---|
| `DEPLOY-6.1.0.md` | Superseded by this file. |

## Step 2 — REPLACE these files

| File | Now at |
|---|---|
| `index.html` | 6.3.0 — modal chrome via data attrs; loads school-config.js; 3 new ids |
| `src/js/main.js` | imports the two new modules |
| `src/js/00-header.js` | APP_VERSION 6.3.0 |
| `src/js/24-notifications.js` | notification title from config |
| `service-worker.js` | 1.10.0 — caches the three new js files, busts old caches |
| `old.html` | 1.7.1 — PROJECT_ID pointer comment for other schools |
| `SETUP.md` | Step 8 rewritten around school-config.js |
| `CHANGELOG.md`, `ROLLOUT.md`, `HANDOFF.md` | docs current |

## Step 3 — ADD these files

| File | What |
|---|---|
| `school-config.js` | NEW — one-place school branding (root, next to firebase-config.js) |
| `src/js/26-modal-chrome.js` | NEW — expands modal chrome at startup (6.2.0) |
| `src/js/27-school-branding.js` | NEW — applies school-config at startup (6.3.0) |
| `build/transform-modals.mjs` | one-time 6.2.0 conversion tool (archaeology) |
| `DEPLOY-6.3.0.md` | this file |

**`tailwind.css` is still byte-identical to 6.1.0 — no re-upload.**

## Step 4 — Smoke test

Hard-refresh. Header and `<title>` say **6.3.0**; footer status modal
reports **service-worker 1.10.0**.

### Branding spot-check (~30 seconds, covers 6.3.0)

- [ ] Tab title + big banner read "Ellis Web Bell 6.3.0" (config applied)
- [ ] Sign-out → welcome screen still says "Welcome to the Ellis Web Bell!"
- [ ] Any sound dropdown still lists "Ellis Bell"
- [ ] Trigger a desktop notification — title says "Ellis Web Bell"

### Modal priority pass (~2 minutes, covers 6.2.0's one failure mode)

If the chrome module didn't run, a modal opens as unstyled text at the
top-left of a dark overlay with no white card. Check:

- [ ] **Add Bell** — centered white card
- [ ] **Delete Schedule** confirm — small card, gray/red buttons styled
- [ ] **Warning Settings** — the scrolling one: card starts near the top
- [ ] **Custom Text Visual** and **Upload Visual** — still stack above
      whatever opened them
- [ ] **Quick Bell Queue** — bespoke p-6 panel, unchanged
- [ ] **Share Schedule** — footer buttons styled

### Full modal sweep (doubles as the still-outstanding 6.1.0 click-through)

Add Period · Import Preview · Edit Bell · Bulk Edit · Change Sound ·
Confirm Linked Edit · Confirm Delete Bell · Rename Shared Schedule ·
Confirm Delete Audio · Rename Audio · Rename Visual · Nearby Bell ·
Internal Conflict (warning + confirm) · External Conflict · Create
Personal Schedule · Create Standalone Schedule · Confirm Delete Personal ·
Edit History · Status · Confirm Restore · Rename Personal Schedule ·
Enter Share Code · Manage Following · Relative Bell · Add Bell Type ·
Add Static Bell · Orphan Handling · Confirm Delete Visual · Edit Period
Details · New Period · User Confirmation · User Message · Upload Audio ·
Multi-Add Relative Bell · Custom Quick Bell Manager · Passing Period
Visual · Visual BG Color

Open each, confirm backdrop + white card + styled buttons, close. No
need to exercise features — neither release changed behavior.
