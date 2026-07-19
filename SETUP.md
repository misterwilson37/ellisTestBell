# SETUP.md — Running Ellis Web Bell at your school

This guide takes you from zero to a working, real-time synchronized bell
system for your school. No servers to run, no build tools, no command line:
the whole stack is **static files on GitHub Pages + a free-tier Firebase
project**. Expect the first-time setup to take about an hour.

**What you get:** a teacher-facing web app (countdown to next bell, multiple
simultaneous schedules, personal + shared schedules, quick bells, share
codes, themes, Picture-in-Picture mini-clock, offline support), plus
optional companion pages: a TV wall clock, hallway signage dashboards, and
an ES5 page that runs on ancient iPads/Kindle Fires as classroom clocks.

---

## What you need

1. A **GitHub** account (free) — hosts the site via GitHub Pages.
2. A **Google/Firebase** account — hosts the data. The Firestore database
   and Authentication used here fit comfortably in the free (Spark) tier at
   school scale. **Exception:** the custom-sound and image-upload features
   use Cloud Storage, which (as of mid-2026) requires the Blaze
   pay-as-you-go plan on new projects. Actual cost at school scale is
   typically $0/month (usage stays inside the no-cost quotas), but it needs
   a card on file. If you skip Storage, everything else works — you just
   live with the built-in bell sound.
3. Optionally, a custom domain. Not required — `yourname.github.io/repo`
   works fine.

---

## Step 1 — Get the code onto GitHub Pages

1. Create a new GitHub repository and upload this project's files,
   preserving the folder structure (`src/js/`, `signage/`, `build/`,
   `tests/`).
2. If you are NOT using a custom domain, **delete the `CNAME` file** — it
   pins the site to Ellis's domain and will break your Pages deploy.
   (This is the only Ellis-specific file that must be *removed*.)
3. Repo → Settings → Pages → deploy from the main branch, root folder.
4. Wait a minute, then load the Pages URL. The app will appear but sign-in
   won't work yet — that's expected until Firebase is wired up.

> **No build step.** What's in the repo is what ships. The `build/` folder
> is optional developer tooling (verifiers and tests); you never need to
> run it to deploy.

## Step 2 — Create the Firebase project

At [console.firebase.google.com](https://console.firebase.google.com):

1. **Add project** (any name; you can decline Analytics).
2. **Authentication → Get started →** enable two sign-in methods:
   - **Google** (teachers' full accounts)
   - **Anonymous** (display surfaces and view-only use)
3. **Firestore Database → Create database** → production mode → pick a
   region near you.
4. *(Optional, for custom sounds/images)* **Storage → Get started.**
5. Project settings (gear icon) → **Your apps → Add app → Web** (`</>`).
   Register it (no hosting needed). Firebase shows you a `firebaseConfig`
   object — keep this tab open for Step 3.

## Step 3 — Point the code at YOUR Firebase

1. Open `firebase-config.js` in your repo and replace the values inside
   `window.firebaseConfig = { ... }` with the ones from Step 2.5. This is
   the **only** place the config lives; every page reads it from here.
2. **If you'll use the old-iPad clock (`old.html`):** it can't share that
   file (it's built for ancient browsers and reads Firestore over REST).
   Open `old.html`, find `var PROJECT_ID = '...'` near the bottom, and set
   it to your Firebase project ID.

> Note: the `appId` string in the config (looks like `1:1234…:web:abcd…`)
> is also used verbatim as a database path segment (`artifacts/{appId}/…`).
> You'll type it once more in Step 6 — copy-paste it exactly.

## Step 4 — Install the security rules

Firebase console → Firestore Database → **Rules** tab → replace the
contents with the full text of this repo's `firestore.rules` → Publish.

**Read the comments in that file before "improving" it.** In particular,
`personal_schedules` is world-readable **on purpose** — the iPad clock page
and the share-code feature read schedules without signing in. "Fixing" that
rule breaks both. The flip side is a privacy rule for your rollout:

> **Tell staff: schedule and bell names are public data.** Never put
> student names or anything sensitive in a schedule name, period name, or
> bell name.

## Step 5 — Storage rules (only if you enabled Storage)

Firebase console → Storage → Rules → a working baseline:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.firebase.sign_in_provider != "anonymous";
    }
  }
}
```

This lets anyone play the sounds (display surfaces are often anonymous)
while restricting uploads to Google-signed-in users. Tighten to taste —
the app writes to the bucket root (sound files) and `visuals/…` (images).

## Step 6 — Make yourself admin

Admin status is just a document's existence. The first one must be created
by hand (the app can't do it — only admins may write admin docs, and there
are none yet):

1. Open your deployed app, click **Sign in with Google**, sign in.
2. Firebase console → Authentication → Users → copy your **User UID**.
3. Firestore Database → **Start collection** and build this exact path:
   - Collection `artifacts` → Document = *your appId string from Step 3*
   - Sub-collection `public` → Document `data`
   - Sub-collection `admins` → Document ID = *your UID*
   - Give it any field (e.g. `role` = `"admin"`) — presence is what counts.
4. Reload the app: admin controls (shared schedules, emergency shift,
   audit log, dashboard config) appear.

Add future admins the same way, or from inside the app once you're admin.

## Step 7 — Authorize your domain

Firebase console → Authentication → Settings → **Authorized domains** →
add your Pages domain (`yourname.github.io` or your custom domain).
Without this, Google sign-in is refused.

## Step 8 — Make it yours (branding checklist)

All optional; the app runs fine without any of it.

**Start with `school-config.js`** — one file, four values, heavily
commented. It controls the app name everywhere it appears in the main app
(tab title, page banner, sign-in welcome, theme preview, notifications),
what the sound dropdowns call the default bell, and the browser toolbar
tint. The version number is appended to the title/banner automatically.

What still lives outside that file:

| What | Where |
|---|---|
| App name & colors for the INSTALLED app | `manifest.json` (`name`, `short_name`, `theme_color`) — static JSON, browsers read it directly |
| Default bell sound | Replace `ellisBell.mp3` and KEEP THE FILENAME (it's baked into the offline cache and saved user preferences). `school-config.js` controls its display name. |
| App icons | `icon-192.png`, `icon-512.png` |
| clock.html's sound label | one `"Ellis Bell (Default)"` dropdown option |
| Legacy iOS 9 page | `old.html` — set `PROJECT_ID` near the top of its script to your `projectId` from `firebase-config.js` (a comment there points the way) |
| Signage branding | `signage/*.png` are Ellis's house crests + logo — swap for your own, or skip the `signage/` pages entirely |

## Step 9 — Smoke test

1. Load the site. Header shows the app name and version.
2. Sign in with Google → works, and admin controls show (Step 6).
3. Create a personal schedule, add a bell 2 minutes out → countdown shows
   it → at zero, it rings (click anywhere once first if audio was blocked —
   browsers require one interaction before sound).
4. Open the site on a second device signed in anonymously → the shared
   schedule an admin publishes appears there without a refresh.
5. Tap the version number in the footer → the status modal lists every
   file's version — your proof, forever after, of what's deployed.

## The surfaces, and which you can ignore

| File(s) | What | Skip it? |
|---|---|---|
| `index.html` + `src/js/` + `service-worker.js` | The main app | No — this is the product |
| `clock.html` | Full-screen 3×3 grid clock for TVs (Yodeck etc.) | Yes, if unused |
| `old.html` | ES5 wall clock for iOS-9-era iPads / Kindle Fires | Yes, if unused |
| `signage/` + `dashboard-config.html` | Hallway dashboard pages + their admin tool | Yes, if unused |
| `build/`, `tests/` | Developer tooling (verification, tests) | Runtime never uses them |
| `HANDOFF.md`, `ROLLOUT.md`, `CHANGELOG.md`, `DEPLOY-*.md` | Maintainer docs of the original project | Read `CHANGELOG.md` for history; the rest documents Ellis's own workflow |

## Ongoing maintenance

- **Deploys are just file uploads** to the repo. No build, ever. (Only
  exception: if you *edit the code* and use never-before-seen Tailwind CSS
  classes, see `build/README-BUILD.md`.)
- Every file carries its version in a header comment; `x.y.z` bumps on
  every change (z=fix, y=feature, x=major). The footer's status modal reads
  these live — it's how you verify a deploy actually took.
- Firestore data model, engineering conventions, and hard-earned lessons
  live in `HANDOFF.md` if you (or your AI assistant) ever extend the code.
