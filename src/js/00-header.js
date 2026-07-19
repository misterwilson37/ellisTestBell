// ╔══════════════════════════════════════════════════════════════════════╗
// ║  ELLIS WEB BELL 6.1.0 — NATIVE ES MODULES                              ║
// ║                                                                        ║
// ║  As of 6.0.0 the files in src/js/ ARE production: index.html loads    ║
// ║  src/js/main.js directly and the browser resolves the import graph.   ║
// ║  There is no generated script.js and no JS build step. Edit a module,  ║
// ║  run the verification battery (build/README-BUILD.md), commit, push.  ║
// ║                                                                        ║
// ║  Shared mutable state lives in src/js/state.js (see its header).      ║
// ║  Import/export blocks marked "6.0.0" were machine-generated during    ║
// ║  the conversion; maintain them by hand from here on (lint enforces).  ║
// ╚══════════════════════════════════════════════════════════════════════╝
const APP_VERSION = "6.3.0"
// Release history lives in CHANGELOG.md — add new version notes there, not here.
// (Extracted 2026-07: ~280 lines of V3–V5.69 notes moved out of this file.)

// ============================================================
// v5.72.0: SHARED BELL ENGINE
// The pure time/schedule math (formatting, time<->seconds, bell lookup,
// relative-bell resolution) lives in bell-engine.js, which index.html loads
// via a plain <script> tag BEFORE this module (same pattern as
// firebase-config.js). clock.html shares the SAME file — do not re-inline
// any of these functions here or there.
// Tests: `node --test tests/bell-engine.test.mjs` after any engine change.
// ============================================================
const {
    escapeHtml,
    getBellId,
    formatTime12Hour,
    timeToSeconds,
    secondsToTime,
    getDateForBellTime,
    toLocalDateString,
    shiftTimeString
} = window.BellEngine;

// (escapeHtml moved to bell-engine.js in v5.72.0)


// ===== module exports (6.0.0) =====
export {
    APP_VERSION,
    escapeHtml,
    formatTime12Hour,
    getBellId,
    getDateForBellTime,
    secondsToTime,
    shiftTimeString,
    timeToSeconds,
    toLocalDateString,
};
