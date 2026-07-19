/*
 * school-config.js — Ellis Web Bell school branding (NEW in 6.3.0)
 *
 * THE one place another school edits to make the app theirs. Loaded as a
 * plain <script> by index.html BEFORE the app module (same pattern as
 * firebase-config.js). src/js/27-school-branding.js reads this at startup
 * and applies it. Every value is optional — delete a line (or this whole
 * file's contents) and the app falls back to the stock Ellis defaults.
 *
 * What still requires edits elsewhere (all documented in SETUP.md Step 8):
 *   - manifest.json          static JSON; browsers read it directly, JS
 *                            can't inject config into it (name, short_name,
 *                            theme_color for the installed-app chrome)
 *   - icon-192/512.png       app icons
 *   - ellisBell.mp3          REPLACE the file, KEEP the filename — it is
 *                            baked into the service worker's precache list
 *                            and saved user preferences. defaultSoundLabel
 *                            below controls what the dropdowns CALL it.
 *   - clock.html             its one "Ellis Bell (Default)" dropdown label
 *   - signage/               optional pages; branding is largely driven by
 *                            the Firestore dashboard config + crest PNGs
 *   - CNAME                  delete it (SETUP.md Step 2)
 */
window.SCHOOL_CONFIG = {
    // App name. Appears in: the browser tab title and page banner (the
    // version number is appended automatically — don't include it here),
    // the sign-in welcome heading, the theme-settings title preview, and
    // desktop notification titles.
    appName: 'Ellis Web Bell',

    // Sign-in screen heading. null = "Welcome to the <appName>!"
    welcomeHeading: null,

    // What the sound dropdowns call the default bell sound file
    // (ellisBell.mp3 — see the note above about replacing it).
    defaultSoundLabel: 'Ellis Bell',

    // Browser UI accent (the <meta name="theme-color"> tag; Android/Safari
    // toolbar tint). Also set it in manifest.json to match.
    themeColor: '#4B9CD3'
};
