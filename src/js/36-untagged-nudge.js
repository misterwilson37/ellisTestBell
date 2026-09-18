// ===== 36-untagged-nudge.js (NEW in 6.15.0 — Layer 3 operational glue) =====
// The "Ms. Johnson finally logged in" nudge. An admin can't preload every
// teacher, so people trickle onto the roster over the first weeks. This
// surfaces, for admins only, anyone who has SIGNED IN (a presence report,
// non-clock) but has NO TAG yet — so the admin can tag them (and set a home
// schedule / re-run the template), after which the home listener (module 20)
// lands them on the right schedule automatically.
//
// Detection is a one-time cross-reference on admin sign-in (presence ∩ roster),
// both reads admin-gated by rules. It shows a dismissible amber banner; its
// Review button opens the existing Roster & Tags modal — no authoring is
// duplicated here. Nothing runs for non-admins (the event only fires for
// server-confirmed admins, and we re-check state.isAdmin).
//
// Layer 3 invariant untouched: this only READS tags to find who's missing one;
// it never resolves a tag into a target.

import { collection, getDocs } from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { state } from './state.js';

const banner = document.getElementById('untagged-nudge-banner');
const textEl = document.getElementById('untagged-nudge-text');
const reviewBtn = document.getElementById('untagged-nudge-review');
const dismissBtn = document.getElementById('untagged-nudge-dismiss');

let dismissedThisSession = false;
let checkedThisSession = false;

function hide() { if (banner) banner.classList.add('hidden'); }

async function checkUntagged() {
    if (!banner || !textEl) return;
    if (dismissedThisSession || checkedThisSession) return;
    if (!state.isAdmin || !state.db) return;
    checkedThisSession = true; // one read per session, whatever the outcome
    try {
        const base = ['artifacts', state.appId, 'public', 'data'];
        const [presenceSnap, rosterSnap] = await Promise.all([
            getDocs(collection(state.db, ...base, 'presence')),
            getDocs(collection(state.db, ...base, 'roster')),
        ]);

        // uid -> has at least one tag; plus every uid that has a roster doc at
        // all (v6.22.0 — "no tags" and "not on the roster" are different
        // problems with different fixes, and only one of them is solved inside
        // the roster list).
        const tagged = new Set();
        const onRoster = new Set();
        rosterSnap.docs.forEach((d) => {
            const data = d.data();
            onRoster.add(d.id);
            if (data && Array.isArray(data.tags) && data.tags.length) tagged.add(d.id);
        });

        // People who signed in (surface !== 'clock' — TVs are not staff) and
        // carry no tag. De-duplicate by uid; keep a display name for the copy.
        const seen = new Map(); // uid -> displayName
        presenceSnap.docs.forEach((d) => {
            const p = d.data() || {};
            if (p.surface === 'clock') return;
            if (tagged.has(d.id)) return;
            if (!seen.has(d.id)) seen.set(d.id, p.displayName || '(unknown)');
        });

        if (!seen.size) { hide(); return; }

        const names = Array.from(seen.values());
        const n = seen.size;
        // v6.22.0: the old preview showed 3 names then ", …", so a count of 4
        // read as "you said four, I can see three." Say how many are hidden.
        const preview = names.length > 3
            ? names.slice(0, 3).join(', ') + ' and ' + (names.length - 3) + ' more'
            : names.join(', ');
        // v6.22.0: how many of them have no roster row at all. Those will NOT
        // appear in the Roster & Tags list until "Seed from presence" is
        // pressed, so naming them here without saying so sends the admin
        // looking for someone who cannot be there yet.
        const unrostered = Array.from(seen.keys()).filter((uid) => !onRoster.has(uid)).length;
        let msg = n === 1
            ? '1 person has signed in but has no tag yet (' + preview + ').'
            : n + ' people have signed in but have no tags yet (' + preview + ').';
        if (unrostered) {
            msg += ' ' + unrostered + (unrostered === 1 ? ' is' : ' of them are')
                + ' not on the roster yet — open Review and press "Seed from presence" to add'
                + (unrostered === 1 ? ' them' : ' them all') + '.';
        }
        textEl.textContent = msg;
        banner.classList.remove('hidden');
        safeLog.log('[Untagged] ' + n + ' present staff without tags; ' + unrostered + ' not on roster.');
    } catch (e) {
        // Silent: this is a convenience nudge, never block or alarm.
        safeLog.log('[Untagged] check skipped:', e && e.message);
    }
}

if (reviewBtn) reviewBtn.addEventListener('click', () => {
    hide();
    const openRoster = document.getElementById('roster-open-btn');
    if (openRoster) openRoster.click(); // reuse module 33's roster modal
});
if (dismissBtn) dismissBtn.addEventListener('click', () => {
    dismissedThisSession = true;
    hide();
});

// Fired by module 15 once the server confirms admin status.
document.addEventListener('ellis-admin-confirmed', () => {
    // small delay so the roster/presence writes from this very sign-in settle
    setTimeout(checkUntagged, 4000);
});

// ===== module exports (6.15.0) =====
// (none — self-wiring side-effect module, 28/29/34/35 pattern)
export {};
