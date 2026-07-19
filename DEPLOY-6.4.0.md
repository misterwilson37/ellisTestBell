# DEPLOY-6.4.0.md — deploying v6.4.0 to the alpha repo (CUMULATIVE)

**Covers all three undeployed releases: 6.2.0 (modal chrome), 6.3.0
(schoolification), 6.4.0 (usage dashboard).** No build, no terminal.
**ONE console step this time: publishing the updated firestore.rules
(Step 4).** Everything except the new dashboard should look and behave
exactly like your deployed 6.1.0.

## Step 1 — DELETE from the repo

| File | Why |
|---|---|
| `DEPLOY-6.1.0.md` | Superseded by this file. |

## Step 2 — REPLACE these files

| File | Now at |
|---|---|
| `index.html` | 6.4.0 — data-attr modal chrome; school-config load; Who's Online button + modal |
| `src/js/main.js` | imports the four new modules |
| `src/js/00-header.js` | APP_VERSION 6.4.0 |
| `src/js/24-notifications.js` | notification title from config (6.3.0) |
| `service-worker.js` | 1.11.0 |
| `old.html` | 1.7.1 — PROJECT_ID pointer comment |
| `firestore.rules` | + presence block (repo copy; console publish in Step 4) |
| `tailwind.css` | grew ~300 bytes for the dashboard modal (first change since 6.1.0) |
| `SETUP.md`, `CHANGELOG.md`, `ROLLOUT.md`, `HANDOFF.md`, `DESIGN-CALENDAR-V2.md` | docs current |

## Step 3 — ADD these files

| File | What |
|---|---|
| `school-config.js` | one-place branding (root) |
| `src/js/26-modal-chrome.js` | modal chrome expander (6.2.0) |
| `src/js/27-school-branding.js` | branding applier (6.3.0) |
| `src/js/28-presence.js` | presence heartbeat (6.4.0) |
| `src/js/29-admin-dashboard.js` | Who's Online panel (6.4.0) |
| `build/transform-modals.mjs` | one-time 6.2.0 tool (archaeology) |
| `DEPLOY-6.4.0.md` | this file |

## Step 4 — Publish the Firestore rules (console, one time)

Firebase console → Firestore Database → Rules → paste the ENTIRE
contents of the repo's updated `firestore.rules` → **Publish**.

This is ADDITIVE and safe for the live school: the only change is a new
`presence/{uid}` block (users write their own doc; admins read). No
pre-6.4.0 client touches that path; every existing rule is untouched.
Without this publish, the dashboard shows a permission error and
heartbeats silently fail — the app otherwise works fine.

## Step 5 — Smoke test

Hard-refresh. Header/title say **6.4.0**; status modal reports
**service-worker 1.11.0**.

### Dashboard (~1 minute, covers 6.4.0)

- [ ] Admin Zone shows "Who's Online" → **View Usage Dashboard**
- [ ] Modal opens styled (white card — it's built on the 6.2.0 chrome,
      so this doubles as a chrome check)
- [ ] Within a minute of page load, YOUR row appears: name, current
      schedule label, `6.4.0`, green dot
- [ ] Change schedules in the dropdown → your row updates within ~30s
- [ ] Close, reopen — still live (listener re-attaches)

### Branding spot-check (30s, covers 6.3.0)

- [ ] Banner reads "Ellis Web Bell 6.4.0"; sound dropdowns say "Ellis
      Bell"; welcome screen unchanged after sign-out

### Modal priority pass (~2 min, covers 6.2.0)

Failure signature: unstyled text at top-left of a dark overlay, no
white card. Check: Add Bell · a delete confirm · Warning Settings
(scrolling) · Custom Text Visual + Upload Visual (stacking) · Quick
Bell Queue (bespoke p-6) · Share Schedule.

### Full modal sweep (doubles as the outstanding 6.1.0 click-through)

Add Period · Import Preview · Edit Bell · Bulk Edit · Change Sound ·
Confirm Linked Edit · Confirm Delete Bell · Rename Shared Schedule ·
Confirm Delete Audio · Rename Audio · Rename Visual · Nearby Bell ·
Internal Conflict (warning + confirm) · External Conflict · Create
Personal Schedule · Create Standalone Schedule · Confirm Delete
Personal · Edit History · Status · Confirm Restore · Rename Personal
Schedule · Enter Share Code · Manage Following · Relative Bell · Add
Bell Type · Add Static Bell · Orphan Handling · Confirm Delete Visual ·
Edit Period Details · New Period · User Confirmation · User Message ·
Upload Audio · Multi-Add Relative Bell · Custom Quick Bell Manager ·
Passing Period Visual · Visual BG Color

## The census caveat (worth restating)

Only 6.4.0+ clients report presence. Faculty on the school domain
(5.79.x) are invisible to the dashboard until the 6.x batch ships
there. **If you want a day-one census, the school repo needs the 6.x
batch before the first bell of the year.**
