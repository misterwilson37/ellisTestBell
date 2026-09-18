// ===== 35-schedule-grid.js (NEW in 6.13.0 — design Layer 4, prefill grid) =====
// "The grid plans the weeks." A desktop-grade multi-week calendar view of the
// designations + transforms already authored in config/schedule_calendar
// (same doc the day-of modal writes). Two jobs:
//   1. SEE the plan — a 6-week grid, navigable, each cell summarizing that
//      date's base designation(s) and transform(s).
//   2. EDIT any cell — clicking a date opens the existing day-of modal
//      (module 34) preset to that date, so ALL authoring (base + the Verb B
//      recipe builder) is reused, not reimplemented. The grid hides while the
//      editor is open and reshows + refreshes when it closes (event-wired, so
//      module 34 never has to import this one — no cycle).
//   3. REPEAT WEEKLY — copy one date's whole plan onto every same-weekday date
//      through an end date. Routes each copied entry through the engine's
//      mergeCalendarEntry so the base-dedup / transform-append rule is
//      identical to the modal's.
//
// I2 does NOT constrain this surface (the fast phone path is module 34); the
// grid is deliberately desktop-grade. Rotation-cycle generators (slip-forward
// and calendar-locked) are the documented NEXT slice — see HANDOFF §7.
//
// Read-on-open (getDoc), like module 34 — a planning tool needs a snapshot,
// not a live listener. Every write re-reads.

import { escapeHtml, toLocalDateString } from './00-header.js';
import { doc, getDoc, setDoc } from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { describeRecipe } from './20-schedule-calendar.js';
import { openDesignationModal } from './34-day-designation.js';
import { state } from './state.js';

const WEEKS = 6;
const PAGE_DAYS = 28; // prev/next step (4 weeks — 2 weeks of continuity in a 6-week window)

const openBtn = document.getElementById('grid-open-btn');
const modal = document.getElementById('grid-modal');
const closeBtn = document.getElementById('grid-close');
const titleEl = document.getElementById('grid-title');
const prevBtn = document.getElementById('grid-prev');
const nextBtn = document.getElementById('grid-next');
const todayBtn = document.getElementById('grid-today');
const bodyEl = document.getElementById('grid-body');
const repeatSource = document.getElementById('grid-repeat-source');
const repeatEnd = document.getElementById('grid-repeat-end');
const repeatApply = document.getElementById('grid-repeat-apply');
const statusEl = document.getElementById('grid-status');

let calDoc = null;      // snapshot of config/schedule_calendar
let gridStart = null;   // Date: the Monday anchoring the top-left cell
let gridOpen = false;   // true while our modal is the active surface

function calRef() {
    return doc(state.db, 'artifacts', state.appId, 'public', 'data', 'config', 'schedule_calendar');
}
function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('hidden', !msg);
    statusEl.classList.toggle('text-red-600', !!isError);
    statusEl.classList.toggle('text-blue-600', !isError);
}

// ---- pure-ish local date helpers (local time, never UTC) ----
function parseYMD(s) {
    const parts = String(s || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}
function addDays(date, n) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
}
function mondayOf(date) {
    const d = new Date(date.getTime());
    const offset = (d.getDay() + 6) % 7; // 0=Sun..6=Sat -> days since Monday
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return d;
}

function entriesFor(dateStr) {
    return (calDoc && calDoc.days && calDoc.days[dateStr]
        && Array.isArray(calDoc.days[dateStr].entries))
        ? calDoc.days[dateStr].entries : [];
}

function schedName(id) {
    const s = (state.allSchedules || []).find((x) => x.id === id);
    return s ? s.name : id;
}

function cellSummaryHtml(entries) {
    if (!entries.length) return '<span class="text-gray-300 text-xs">—</span>';
    const bits = entries.map((e) => {
        if (e && e.verb === 'transform') {
            const txt = describeRecipe(e.recipe) || 'transform';
            return '<span class="block text-xs text-amber-700 truncate" title="'
                + escapeHtml(txt) + '">⚡ ' + escapeHtml(txt) + '</span>';
        }
        return '<span class="block text-xs text-blue-700 truncate" title="'
            + escapeHtml(schedName(e.scheduleId)) + '">▸ ' + escapeHtml(schedName(e.scheduleId)) + '</span>';
    });
    return bits.join('');
}

function render() {
    if (!bodyEl || !gridStart) return;
    const todayStr = toLocalDateString(new Date());
    const first = gridStart;
    const last = addDays(gridStart, WEEKS * 7 - 1);
    if (titleEl) {
        const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        titleEl.textContent = fmt(first) + ' – ' + fmt(last);
    }
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = '<div class="grid grid-cols-7 gap-1">';
    html += dayNames.map((n) =>
        '<div class="text-center text-xs font-medium text-gray-500 py-1">' + n + '</div>').join('');
    for (let i = 0; i < WEEKS * 7; i++) {
        const d = addDays(gridStart, i);
        const ds = toLocalDateString(d);
        const isToday = ds === todayStr;
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const cls = 'text-left border rounded-lg p-1 h-20 overflow-hidden cursor-pointer '
            + 'hover:border-blue-500 hover:bg-blue-50 '
            + (isToday ? 'border-blue-500 bg-blue-50 ' : 'border-gray-200 ')
            + (isWeekend ? 'bg-gray-50 ' : '');
        html += '<button type="button" data-grid-date="' + ds + '" class="' + cls + '">'
            + '<span class="block text-xs ' + (isToday ? 'font-bold text-blue-700' : 'text-gray-600') + '">'
            + d.getDate() + '</span>'
            + cellSummaryHtml(entriesFor(ds))
            + '</button>';
    }
    html += '</div>';
    bodyEl.innerHTML = html;
}

async function reload() {
    try {
        const snap = await getDoc(calRef());
        calDoc = snap.exists() ? snap.data() : {};
    } catch (e) {
        setStatus('Error loading calendar: ' + (e && e.message), true);
        calDoc = calDoc || {};
    }
    render();
}

async function open() {
    modal.classList.remove('hidden');
    gridOpen = true;
    setStatus('');
    gridStart = mondayOf(new Date());
    if (repeatSource) repeatSource.value = toLocalDateString(new Date());
    if (repeatEnd) repeatEnd.value = toLocalDateString(addDays(new Date(), 56));
    bodyEl.innerHTML = '<p class="text-sm text-gray-500">Loading…</p>';
    await reload();
}

function close() {
    modal.classList.add('hidden');
    gridOpen = false;
}

// Repeat weekly: copy the source date's whole plan onto every same-weekday
// date AFTER it through the end date (inclusive). Each entry is merged with
// the engine rule, so re-designating the same people on a target date that
// already has a plan does the right last-write-wins thing.
async function applyRepeat() {
    const srcStr = repeatSource ? repeatSource.value : '';
    const endStr = repeatEnd ? repeatEnd.value : '';
    const src = parseYMD(srcStr);
    const end = parseYMD(endStr);
    if (!src || !end) { setStatus('Pick a valid source date and end date.', true); return; }
    if (end < src) { setStatus('End date must be on or after the source date.', true); return; }
    const srcEntries = entriesFor(srcStr);
    if (!srcEntries.length) { setStatus('That source date has no plan to copy yet.', true); return; }

    repeatApply.disabled = true;
    try {
        calDoc = calDoc || {};
        calDoc.days = calDoc.days || {};
        let count = 0;
        for (let d = addDays(src, 7); d <= end; d = addDays(d, 7)) {
            const ds = toLocalDateString(d);
            calDoc.days[ds] = calDoc.days[ds] || {};
            let entries = Array.isArray(calDoc.days[ds].entries) ? calDoc.days[ds].entries : [];
            for (let i = 0; i < srcEntries.length; i++) {
                const clone = JSON.parse(JSON.stringify(srcEntries[i]));
                entries = window.BellEngine.mergeCalendarEntry(entries, clone);
            }
            calDoc.days[ds].entries = entries;
            count++;
        }
        if (!count) { setStatus('No matching weekdays before the end date — nothing to copy.', true); return; }
        await setDoc(calRef(), { days: calDoc.days }, { merge: true });
        document.dispatchEvent(new CustomEvent('ellis-calendar-changed'));
        safeLog.log('[Grid] Repeat weekly from ' + srcStr + ' to ' + count + ' date(s) through ' + endStr + '.');
        setStatus('Copied ' + srcEntries.length + ' entry/entries to ' + count + ' date(s).');
        render();
    } catch (e) {
        setStatus('Error copying: ' + (e && e.message), true);
    } finally {
        repeatApply.disabled = false;
    }
}

if (openBtn) openBtn.addEventListener('click', open);
if (closeBtn) closeBtn.addEventListener('click', close);
if (prevBtn) prevBtn.addEventListener('click', () => { gridStart = addDays(gridStart, -PAGE_DAYS); render(); });
if (nextBtn) nextBtn.addEventListener('click', () => { gridStart = addDays(gridStart, PAGE_DAYS); render(); });
if (todayBtn) todayBtn.addEventListener('click', () => { gridStart = mondayOf(new Date()); render(); });
if (repeatApply) repeatApply.addEventListener('click', applyRepeat);

// Cell click -> edit that date in the day-of modal. Hide the grid while the
// editor is up; reshow + refresh when it closes.
if (bodyEl) bodyEl.addEventListener('click', (e) => {
    const t = e.target instanceof HTMLElement ? e.target.closest('[data-grid-date]') : null;
    if (!t) return;
    const ds = t.getAttribute('data-grid-date');
    if (!ds) return;
    modal.classList.add('hidden'); // keep gridOpen true so we know to come back
    openDesignationModal(ds);
});

// Module 34 fires these; we never import 34's internals back (no cycle).
document.addEventListener('ellis-designation-closed', () => {
    if (!gridOpen) return;         // the day-of modal was opened on its own, not from the grid
    modal.classList.remove('hidden');
    reload();                      // pick up anything saved while editing
});
document.addEventListener('ellis-calendar-changed', () => {
    if (gridOpen) reload();
});

// ===== module exports (6.13.0) =====
// (none — self-wiring side-effect module, 28/29/34 pattern)
export {};
