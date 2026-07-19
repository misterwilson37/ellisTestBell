// ===== 27-school-branding.js (NEW in 6.3.0, schoolification pass) =====
// Applies window.SCHOOL_CONFIG (see /school-config.js) at startup.
// Follows 26-modal-chrome's safety pattern: TEXT/ATTRIBUTE writes only,
// never creates/moves/removes elements. With the stock config, every
// write is byte-identical to the static HTML (verified by the 6.3.0
// jsdom harness), so this module is a no-op for Ellis and a one-file
// rebrand for everyone else. All values are optional; missing config
// (or a deleted school-config.js) falls back to Ellis defaults.
//
// The static index.html KEEPS the literal "Ellis Web Bell <version>"
// text in the <title>/<h1> — the owner's three-places version
// convention greps the source, and this module's rewrite reproduces
// the version from APP_VERSION (00-header) so the two never drift.

import { APP_VERSION } from './00-header.js';

const cfg = window.SCHOOL_CONFIG || {};

export const APP_NAME = cfg.appName || 'Ellis Web Bell';

// Tab title + page banner (version appended per the versioning convention)
document.title = APP_NAME + ' ' + APP_VERSION;
const banner = document.getElementById('app-banner-title');
if (banner) banner.textContent = APP_NAME + ' ' + APP_VERSION;

// Sign-in welcome heading
const welcome = document.getElementById('welcome-heading');
if (welcome) welcome.textContent = cfg.welcomeHeading || ('Welcome to the ' + APP_NAME + '!');

// Theme-settings title preview
const preview = document.getElementById('branding-preview-title');
if (preview) preview.textContent = APP_NAME;

// Browser toolbar tint
const meta = document.querySelector('meta[name="theme-color"]');
if (meta && cfg.themeColor) meta.setAttribute('content', cfg.themeColor);

// Sound dropdown labels for the default bell file. The FILE stays
// ellisBell.mp3 (precache + saved preferences depend on the name);
// only what the dropdowns call it is configurable. Any " (Default)"
// suffix in the original label is preserved.
const soundLabel = cfg.defaultSoundLabel || 'Ellis Bell';
for (const opt of document.querySelectorAll('option[value="ellisBell.mp3"]')) {
    const suffix = /\(Default\)/.test(opt.textContent) ? ' (Default)' : '';
    opt.textContent = soundLabel + suffix;
}
