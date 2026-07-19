// ===== 28-presence.js (NEW in 6.4.0 — DESIGN-CALENDAR-V2.md Layer 1) =====
// Heartbeat writer: reports who is signed in, on which app version,
// running which schedule. Self-starting side-effect module (pattern of
// 26/27): a 30s local check that WRITES only when the visible schedule
// label changes or HEARTBEAT_MS has elapsed — ~12 writes/hour/user while
// the tab is open and visible, well inside free-tier budgets at ~50
// faculty. Hidden tabs don't write (visibilitychange triggers a catch-up
// write when the tab returns and the last write is stale).
//
// Data: artifacts/{appId}/public/data/presence/{uid}, ADDITIVE — no old
// client reads or writes this path; firestore.rules 6.4.0 adds the
// matching block (write: own uid; read: admins only).
//
// Departure is conveyed by lastSeen going stale, not by any goodbye
// write (no reliable pagehide + Firestore combo; the dashboard styles
// >10 min as idle instead).
//
// clock.html does authenticate and COULD report presence for TVs/grids —
// deliberately deferred; see DESIGN-CALENDAR-V2.md open questions.

import { APP_VERSION } from './00-header.js';
import { doc, serverTimestamp, setDoc } from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { scheduleSelector } from './02-dom-elements.js';
import { state } from './state.js';

const HEARTBEAT_MS = 5 * 60 * 1000;
const CHECK_MS = 30 * 1000;

let lastWriteAt = 0;
let lastLabel = null;

function currentLabel() {
    const opt = scheduleSelector && scheduleSelector.selectedOptions
        && scheduleSelector.selectedOptions[0];
    return opt ? opt.textContent.trim() : null;
}

async function writePresence(reason) {
    if (!state.userId || !state.db) return;
    const label = currentLabel();
    lastWriteAt = Date.now();
    lastLabel = label;
    try {
        const ref = doc(state.db, 'artifacts', state.appId, 'public', 'data', 'presence', state.userId);
        await setDoc(ref, {
            lastSeen: serverTimestamp(),
            appVersion: APP_VERSION,
            surface: 'app',
            scheduleLabel: label,
            baseScheduleId: state.activeBaseScheduleId || null,
            personalScheduleId: state.activePersonalScheduleId || null,
            displayName: state.currentUserDisplayName || 'Anonymous',
        }, { merge: true });
    } catch (e) {
        // Presence is telemetry; never let it disturb the app.
        safeLog.log('presence write failed (' + reason + '):', e && e.message);
    }
}

function beat(reason) {
    if (!state.userId || !state.db) return;
    if (document.hidden) return;
    const label = currentLabel();
    const due = Date.now() - lastWriteAt >= HEARTBEAT_MS;
    if (due || label !== lastLabel) writePresence(reason);
}

setInterval(() => beat('interval'), CHECK_MS);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) beat('visible');
});
