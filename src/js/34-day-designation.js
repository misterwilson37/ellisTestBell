// ===== 34-day-designation.js (NEW in 6.10.0 — design Layer 4, Verb A + I2) =====
// The fast DAY-OF designation modal: "this scope of people runs schedule X
// on date D." Writes v2 entries into config/schedule_calendar (covered by
// the existing config/{configId} rules — no rules change):
//   { days: { 'YYYY-MM-DD': { entries: [{scope:[uids], verb:'base',
//     scheduleId}] } } }
// Flat, dumb, explicit dates and ids (I3 — a future ES5 wall-clock reader
// walks this with zero cleverness). Clients resolve their OWN designation
// via engine 1.7.0 (module 20, revived).
//
// THE LAYER 3 INVARIANT, NOW IN ACTION for the first time: the people
// picker below filters the roster by tag or name, the admin EYEBALLS the
// filtered list and checks names, and the EXPLICIT checked uid list is
// what's stored in scope. Nothing ever resolves a tag at ring time.
//
// Verb B (transformation recipes on period edges) is the next slice; the
// entry shape already carries `verb` so recipes drop in additively.
//
// Module pattern: 29/30 self-contained; roster loaded once per modal open.

import { escapeHtml, toLocalDateString } from './00-header.js';
import { collection, doc, getDoc, getDocs, setDoc } from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { state } from './state.js';

const openBtn = document.getElementById('designation-open-btn');
const modal = document.getElementById('designation-modal');
const closeBtn = document.getElementById('designation-close');
const dateInput = document.getElementById('designation-date');
const entriesEl = document.getElementById('designation-entries');
const schedSelect = document.getElementById('designation-schedule');
const filterInput = document.getElementById('designation-filter');
const peopleEl = document.getElementById('designation-people');
const addBtn = document.getElementById('designation-add');
const statusEl = document.getElementById('designation-status');

let calDoc = null;   // working copy of the whole config doc
let roster = [];     // [{uid, displayName, tags}]

function calRef() {
    return doc(state.db, 'artifacts', state.appId, 'public', 'data', 'config', 'schedule_calendar');
}
function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('hidden', !msg);
    statusEl.classList.toggle('text-red-600', !!isError);
    statusEl.classList.toggle('text-blue-600', !isError);
}
function nameOf(uid) {
    const r = roster.find((x) => x.uid === uid);
    return r ? r.displayName : uid.slice(0, 8) + '…';
}

async function open() {
    modal.classList.remove('hidden');
    setStatus('');
    dateInput.value = toLocalDateString(new Date());
    schedSelect.innerHTML = state.allSchedules.map((s) =>
        '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>').join('');
    filterInput.value = '';
    entriesEl.innerHTML = '<p class="text-sm text-gray-500">Loading…</p>';
    peopleEl.innerHTML = '';
    try {
        const [calSnap, rosterSnap] = await Promise.all([
            getDoc(calRef()),
            getDocs(collection(state.db, 'artifacts', state.appId, 'public', 'data', 'roster')),
        ]);
        calDoc = calSnap.exists() ? calSnap.data() : {};
        roster = rosterSnap.docs.map((d) => ({ uid: d.id, ...d.data() }))
            .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    } catch (e) {
        setStatus('Error loading: ' + (e && e.message), true);
        calDoc = calDoc || {};
    }
    renderEntries();
    renderPeople();
}

function entriesFor(dateStr) {
    return (calDoc && calDoc.days && calDoc.days[dateStr]
        && Array.isArray(calDoc.days[dateStr].entries))
        ? calDoc.days[dateStr].entries : [];
}

function renderEntries() {
    const dateStr = dateInput.value;
    const entries = entriesFor(dateStr);
    entriesEl.innerHTML = entries.length
        ? entries.map((e, i) => {
            const sched = state.allSchedules.find((s) => s.id === e.scheduleId);
            const who = (e.scope || []).map(nameOf).join(', ');
            return '<div class="flex items-center justify-between gap-3 border-b py-2">'
                + '<span class="text-sm"><span class="font-medium">'
                + escapeHtml(sched ? sched.name : e.scheduleId) + '</span>'
                + ' — ' + escapeHtml(who || '(nobody)') + '</span>'
                + '<button type="button" data-entry-del="' + i + '" class="text-red-600 text-xs hover:underline">Remove</button>'
                + '</div>';
        }).join('')
        : '<p class="text-sm text-gray-500">No designations for this date yet.</p>';
}

function renderPeople() {
    const q = (filterInput.value || '').trim().toLowerCase();
    const keepChecked = new Set(Array.from(
        peopleEl.querySelectorAll('input:checked')).map((cb) => cb.dataset.uid));
    const shown = roster.filter((r) => {
        if (!q) return true;
        if ((r.displayName || '').toLowerCase().includes(q)) return true;
        return (r.tags || []).some((t) => t.toLowerCase().includes(q));
    });
    peopleEl.innerHTML = shown.length
        ? shown.map((r, i) =>
            '<div class="flex items-center">'
            + '<input type="checkbox" id="desig-p-' + i + '" data-uid="' + r.uid + '"'
            + (keepChecked.has(r.uid) ? ' checked' : '')
            + ' class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">'
            + '<label for="desig-p-' + i + '" class="ml-2 block text-sm text-gray-900">'
            + escapeHtml(r.displayName || r.uid)
            + ((r.tags || []).length ? ' <span class="text-xs text-gray-500">('
                + escapeHtml(r.tags.join(', ')) + ')</span>' : '')
            + '</label></div>').join('')
        : '<p class="text-sm text-gray-500">No roster matches. (Roster & Tags in the Admin Zone manages the list; the filter matches names and tags.)</p>';
}

async function addEntry() {
    const dateStr = dateInput.value;
    const scheduleId = schedSelect.value;
    const scope = Array.from(peopleEl.querySelectorAll('input:checked'))
        .map((cb) => cb.dataset.uid);
    if (!dateStr || !scheduleId) { setStatus('Date and schedule are required.', true); return; }
    if (!scope.length) { setStatus('Check at least one person — designations are explicit lists, never tags.', true); return; }
    addBtn.disabled = true;
    try {
        calDoc = calDoc || {};
        calDoc.days = calDoc.days || {};
        calDoc.days[dateStr] = calDoc.days[dateStr] || {};
        const entries = Array.isArray(calDoc.days[dateStr].entries)
            ? calDoc.days[dateStr].entries : [];
        // V6.11.0: per-person last-write-wins. The resolver is first-hit,
        // so a stale earlier entry would keep winning after a re-designation
        // ("change my mind" silently broke). Strip each newly-designated uid
        // from every existing BASE entry first, drop any entry whose scope
        // empties, THEN append. Transform entries are untouched — a person
        // can be base-designated AND carry a transform the same day.
        const scopeSet = new Set(scope);
        const deduped = [];
        for (const e of entries) {
            if (e && e.verb === 'base' && Array.isArray(e.scope)) {
                const kept = e.scope.filter((u) => !scopeSet.has(u));
                if (kept.length === 0) continue;        // whole entry emptied
                if (kept.length !== e.scope.length) { deduped.push({ ...e, scope: kept }); continue; }
            }
            deduped.push(e);
        }
        deduped.push({ scope, verb: 'base', scheduleId });
        calDoc.days[dateStr].entries = deduped;
        await setDoc(calRef(), { days: calDoc.days }, { merge: true });
        safeLog.log('[Designation] ' + dateStr + ': ' + scope.length + ' user(s) -> ' + scheduleId);
        setStatus('Saved — ' + scope.length + ' person/people designated. Their apps follow at day change (or now, unless they chose manually today — then they see the banner).');
        peopleEl.querySelectorAll('input:checked').forEach((cb) => { cb.checked = false; });
        renderEntries();
    } catch (e) {
        setStatus('Error saving: ' + (e && e.message), true);
    } finally {
        addBtn.disabled = false;
    }
}

async function removeEntry(index) {
    const dateStr = dateInput.value;
    const entries = entriesFor(dateStr).slice();
    if (index < 0 || index >= entries.length) return;
    entries.splice(index, 1);
    try {
        calDoc.days[dateStr].entries = entries;
        await setDoc(calRef(), { days: calDoc.days }, { merge: true });
        setStatus('Removed.');
        renderEntries();
    } catch (e) {
        setStatus('Error removing: ' + (e && e.message), true);
    }
}

if (openBtn) openBtn.addEventListener('click', open);
if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
if (addBtn) addBtn.addEventListener('click', addEntry);
if (dateInput) dateInput.addEventListener('change', renderEntries);
if (filterInput) filterInput.addEventListener('input', renderPeople);
if (entriesEl) entriesEl.addEventListener('click', (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.dataset.entryDel !== undefined) {
        removeEntry(Number(t.dataset.entryDel));
    }
});

// ===== module exports (6.10.0) =====
// (none — self-wiring side-effect module, 28/29 pattern)
export {};
