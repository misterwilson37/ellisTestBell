// ===== 29-admin-dashboard.js (NEW in 6.4.0 — Layer 1 dashboard) =====
// "Who's Online" panel in the Admin Zone: live view of presence docs
// (see 28-presence.js). Listener is LAZY — attached when the modal
// opens, detached when it closes — so the app carries no standing
// collection listener. Reads are admin-gated by firestore.rules; the
// button lives in the already-admin-gated Admin Zone, but the RULE is
// the security boundary, the button is just furniture.
//
// The modal markup in index.html uses the 6.2.0 data-modal chrome
// (first new modal built on it — if it looks unstyled, 26-modal-chrome
// didn't run).

import { escapeHtml } from './00-header.js';
import { collection, onSnapshot, orderBy, query } from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { state } from './state.js';

const openBtn = document.getElementById('presence-dashboard-open-btn');
const modal = document.getElementById('presence-dashboard-modal');
const closeBtn = document.getElementById('presence-dashboard-close');
const summaryEl = document.getElementById('presence-dashboard-summary');
const tbody = document.getElementById('presence-dashboard-table-body');

let unsubscribe = null;

const ACTIVE_MS = 10 * 60 * 1000;

function relTime(ms) {
    if (ms < 60 * 1000) return 'just now';
    const m = Math.floor(ms / 60000);
    if (m < 60) return m + ' min ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' hr ago';
    return Math.floor(h / 24) + ' d ago';
}

function render(docs) {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let activeNow = 0;
    let seenToday = 0;
    const rows = [];
    for (const d of docs) {
        const seen = d.lastSeen && d.lastSeen.toDate ? d.lastSeen.toDate().getTime() : 0;
        const age = now - seen;
        const isActive = seen && age < ACTIVE_MS;
        if (isActive) activeNow++;
        if (seen >= todayStart.getTime()) seenToday++;
        rows.push(
            '<tr class="' + (isActive ? '' : 'opacity-50') + '">'
            + '<td class="py-2 pr-4 whitespace-nowrap">'
            + (isActive ? '<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>'
                        : '<span class="inline-block w-2 h-2 rounded-full bg-gray-300 mr-2"></span>')
            + escapeHtml(d.displayName || '(unknown)') + '</td>'
            + '<td class="py-2 pr-4">' + escapeHtml(d.scheduleLabel || '—') + '</td>'
            + '<td class="py-2 pr-4 whitespace-nowrap font-mono text-xs">' + escapeHtml(d.appVersion || '?') + '</td>'
            + '<td class="py-2 pr-4 whitespace-nowrap text-gray-500">' + (seen ? relTime(age) : 'never') + '</td>'
            + '</tr>'
        );
    }
    summaryEl.textContent = activeNow + ' active now · ' + seenToday
        + ' seen today · ' + docs.length + ' total ever reported';
    tbody.innerHTML = rows.join('')
        || '<tr><td colspan="4" class="py-6 text-center text-gray-500">'
         + 'No presence reports yet. Only clients on 6.4.0+ report; '
         + 'the census begins when they sign in.</td></tr>';
}

function open() {
    modal.classList.remove('hidden');
    const col = collection(state.db, 'artifacts', state.appId, 'public', 'data', 'presence');
    unsubscribe = onSnapshot(query(col, orderBy('lastSeen', 'desc')), (snap) => {
        render(snap.docs.map((s) => s.data()));
    }, (err) => {
        summaryEl.textContent = 'Could not load presence (admin access required).';
        safeLog.log('presence dashboard listener error:', err && err.message);
    });
}

function close() {
    modal.classList.add('hidden');
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}

if (openBtn) openBtn.addEventListener('click', open);
if (closeBtn) closeBtn.addEventListener('click', close);
