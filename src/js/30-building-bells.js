// ===== 30-building-bells.js (NEW in 6.5.0 — DESIGN-CALENDAR-V2.md shared concept) =====
// The six intercom bells (start of day, end of 3rd, start of 4th, end of
// 6th, start of flex, end of day) become first-class named entities in
// config/building_bells. Admin shared-schedule bells may carry an OPTIONAL
// buildingBellId anchor; editing a building bell's time here propagates the
// new time onto every anchored bell in every shared schedule in ONE batch —
// replacing the fuzzy 59-second "shift nearby bells?" guessing
// (showLinkedEditModal) for the one case where building-wide really is
// right. The fuzzy modal remains for unanchored legacy bells (I0: old
// behavior untouched).
//
// ADDITIVE BY DESIGN (I0, one shared Firestore across channels):
// - config/building_bells is a NEW doc under the existing config/{configId}
//   rules (read: everyone, write: admins) — NO firestore.rules change.
//   World-readable also future-proofs wall-clock follow-along (I3).
// - buildingBellId is a NEW optional field on shared bells. The 5.79.x
//   save-path audit (design doc, ANSWERED) showed old clients round-trip
//   bell objects by spread, so the field survives their saves. Old clients
//   render the ordinary time fields this module writes — they never need
//   to understand the anchor.
// - Propagation writes CONCRETE times (plus regenerated legacy bells
//   arrays), so every surface — 5.69.5 building clients, old.html iPads,
//   signage — follows along with zero new code (the design doc's
//   "Building Bells writes ordinary period times old clients already
//   render").
//
// Module pattern: self-contained like 29-admin-dashboard — own
// getElementById, lazy Firestore reads (getDoc on open; no standing
// listener), rule is the security boundary, buttons are furniture.
// Exports for 16-schedule-management (edit-bell modal anchor select) are
// hoisted function declarations called only inside handlers, so the
// 16 -> 30 -> 14 import cycle is TDZ-safe (same shape as 14<->16).
//
// Anchoring is deliberately eyeball-then-confirm (the tags philosophy from
// the design doc): the "Anchor matching bells" assist lists exact-time
// matches with checkboxes; nothing is anchored without explicit confirm.

import {
    applyBuildingBellTimeToPeriods, escapeHtml, formatTime12Hour,
} from './00-header.js';
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { flattenPeriodsToLegacyBells } from './14-render-schedule-list.js';
import { logScheduleEdit } from './22-audit-log.js';
import { state } from './state.js';

// --- DOM (all new in 6.5.0; exists before module eval per 26's contract) ---
const openBtn = document.getElementById('building-bells-open-btn');
const modal = document.getElementById('building-bells-modal');
const closeBtn = document.getElementById('building-bells-close');
const listEl = document.getElementById('building-bells-list');
const summaryEl = document.getElementById('building-bells-summary');
const statusEl = document.getElementById('building-bells-status');
const formTitle = document.getElementById('bb-form-title');
const nameInput = document.getElementById('bb-name-input');
const timeInput = document.getElementById('bb-time-input');
const saveBtn = document.getElementById('bb-save-btn');
const cancelEditBtn = document.getElementById('bb-cancel-edit-btn');
const confirmSection = document.getElementById('bb-confirm-section');
const confirmText = document.getElementById('bb-confirm-text');
const confirmApplyBtn = document.getElementById('bb-confirm-apply-btn');
const confirmCancelBtn = document.getElementById('bb-confirm-cancel-btn');
const matchSection = document.getElementById('bb-match-section');
const matchTitle = document.getElementById('bb-match-title');
const matchList = document.getElementById('bb-match-list');
const matchApplyBtn = document.getElementById('bb-match-apply-btn');
const matchCancelBtn = document.getElementById('bb-match-cancel-btn');
const anchorContainer = document.getElementById('edit-bell-anchor-container');
const anchorSelect = document.getElementById('edit-bell-anchor-select');

// --- module state ---
let bells = [];              // [{id, name, time}] — local copy of the config doc
let editingId = null;        // building bell id being edited in the form, or null (= adding)
let pendingTimeEdit = null;  // { bell:{id,name,time(new)}, oldTime, perSchedule:[{schedule, result}] }
let pendingMatch = null;     // { bellId }
let loaded = false;

function configRef() {
    return doc(state.db, 'artifacts', state.appId, 'public', 'data', 'config', 'building_bells');
}

function newId() {
    return 'bb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('hidden', !msg);
    statusEl.classList.toggle('text-red-600', !!isError);
    statusEl.classList.toggle('text-blue-600', !isError);
}

async function loadBells() {
    try {
        const snap = await getDoc(configRef());
        bells = (snap.exists() && Array.isArray(snap.data().bells)) ? snap.data().bells : [];
        loaded = true;
    } catch (e) {
        safeLog.log('building_bells load failed:', e && e.message);
        bells = [];
    }
    return bells;
}

async function saveBellsDoc() {
    await setDoc(configRef(), {
        bells,
        updatedAt: serverTimestamp(),
        updatedBy: state.currentUserDisplayName || 'Anonymous',
    }, { merge: true });
}

// Count anchored bells for a building bell across all shared schedules.
function anchoredCount(bbId) {
    let n = 0, schedules = 0;
    for (const s of state.allSchedules) {
        const c = (s.periods || []).reduce((acc, p) =>
            acc + (p.bells || []).filter(b => b && b.buildingBellId === bbId).length, 0);
        if (c > 0) { n += c; schedules++; }
    }
    return { n, schedules };
}

// Exact-time, not-yet-anchored shared bells (the matching assist's candidates).
function findExactTimeMatches(bbId, time) {
    const out = [];
    for (const s of state.allSchedules) {
        for (const p of (s.periods || [])) {
            for (const b of (p.bells || [])) {
                if (b && typeof b.time === 'string' && b.time === time
                        && b.buildingBellId !== bbId) {
                    out.push({ schedule: s, bell: b, periodName: p.name || '' });
                }
            }
        }
    }
    return out;
}

function resetForm() {
    editingId = null;
    formTitle.textContent = 'Add a building bell';
    nameInput.value = '';
    timeInput.value = '';
    saveBtn.textContent = 'Add';
    cancelEditBtn.classList.add('hidden');
}

function hideSubSections() {
    confirmSection.classList.add('hidden');
    matchSection.classList.add('hidden');
    pendingTimeEdit = null;
    pendingMatch = null;
}

function render() {
    if (!bells.length) {
        listEl.innerHTML = '<p class="text-sm text-gray-500 mb-4">No building bells defined yet. '
            + 'Add the intercom moments below (e.g. "Start of Day", "End of 3rd").</p>';
        summaryEl.textContent = '';
        return;
    }
    const rows = bells.map((bb) => {
        const { n, schedules } = anchoredCount(bb.id);
        const anchorInfo = n
            ? n + ' anchored bell' + (n === 1 ? '' : 's') + ' across ' + schedules
                + ' schedule' + (schedules === 1 ? '' : 's')
            // V6.11.0: zero-anchor rows nudge toward the matching assist —
            // editing this bell's time would move nothing until it's anchored.
            : '<span class="text-amber-600">0 anchored — use “Anchor matching…” →</span>';
        return '<tr class="border-b">'
            + '<td class="py-2 pr-4 font-medium">' + escapeHtml(bb.name) + '</td>'
            + '<td class="py-2 pr-4 whitespace-nowrap font-mono text-xs">'
            + escapeHtml(formatTime12Hour(bb.time, true)) + '</td>'
            + '<td class="py-2 pr-4 text-xs text-gray-500">' + anchorInfo + '</td>'
            + '<td class="py-2 whitespace-nowrap text-sm">'
            + '<button type="button" data-bb-edit="' + bb.id + '" class="text-blue-600 hover:underline mr-3">Edit</button>'
            + '<button type="button" data-bb-match="' + bb.id + '" class="text-blue-600 hover:underline mr-3">Anchor matching…</button>'
            + '<button type="button" data-bb-delete="' + bb.id + '" class="text-red-600 hover:underline">Delete</button>'
            + '</td></tr>';
    });
    listEl.innerHTML = '<table class="w-full text-left text-sm"><thead>'
        + '<tr class="border-b text-gray-600"><th class="py-2 pr-4">Bell</th>'
        + '<th class="py-2 pr-4">Time</th><th class="py-2 pr-4">Anchors</th><th class="py-2"></th></tr>'
        + '</thead><tbody>' + rows.join('') + '</tbody></table>';
    summaryEl.textContent = bells.length + ' building bell' + (bells.length === 1 ? '' : 's')
        + ' · editing a time moves every anchored bell in every schedule';
}

// --- open / close ---

async function open() {
    modal.classList.remove('hidden');
    setStatus('');
    hideSubSections();
    resetForm();
    listEl.innerHTML = '<p class="text-sm text-gray-500">Loading…</p>';
    await loadBells();
    render();
}

function close() {
    modal.classList.add('hidden');
    hideSubSections();
}

// --- add / edit form ---

function startEdit(bbId) {
    const bb = bells.find(b => b.id === bbId);
    if (!bb) return;
    hideSubSections();
    editingId = bbId;
    formTitle.textContent = 'Edit "' + bb.name + '"';
    nameInput.value = bb.name;
    timeInput.value = bb.time;
    saveBtn.textContent = 'Save';
    cancelEditBtn.classList.remove('hidden');
}

async function handleSave() {
    const name = nameInput.value.trim();
    let time = timeInput.value;
    if (time && time.length === 5) time += ':00'; // input type=time may omit seconds
    if (!name || !time) { setStatus('Name and time are both required.', true); return; }

    try {
        if (!editingId) {
            bells.push({ id: newId(), name, time });
            await saveBellsDoc();
            setStatus('Added "' + name + '". Use "Anchor matching…" to attach schedule bells at that time.');
            resetForm();
            render();
            return;
        }

        const bb = bells.find(b => b.id === editingId);
        if (!bb) { resetForm(); return; }
        const oldTime = bb.time;

        if (time === oldTime) {
            // Rename only — no propagation question
            bb.name = name;
            await saveBellsDoc();
            setStatus('Saved.');
            resetForm();
            render();
            return;
        }

        // Time changed: compute per-schedule propagation via the pure engine fn
        const perSchedule = [];
        let total = 0;
        for (const s of state.allSchedules) {
            const result = applyBuildingBellTimeToPeriods(s.periods || [], bb.id, time);
            if (result.changed > 0) { perSchedule.push({ schedule: s, result }); total += result.changed; }
        }

        if (total === 0) {
            // Nothing anchored — just save the new time
            bb.name = name; bb.time = time;
            await saveBellsDoc();
            setStatus('Saved. No bells are anchored to "' + name + '" yet, so no schedules changed.');
            resetForm();
            render();
            return;
        }

        // Ask before moving other people's bells (eyeball-then-confirm)
        pendingTimeEdit = { bell: { id: bb.id, name, time }, oldTime, perSchedule };
        confirmText.innerHTML = 'Moving <span class="font-medium">' + escapeHtml(name)
            + '</span> from ' + escapeHtml(formatTime12Hour(oldTime, true))
            + ' to <span class="font-medium">' + escapeHtml(formatTime12Hour(time, true))
            + '</span> will update <span class="font-medium">' + total + ' anchored bell'
            + (total === 1 ? '' : 's') + '</span>:<br>'
            + pendingTimeEdit.perSchedule.map(({ schedule, result }) =>
                '&bull; ' + escapeHtml(schedule.name) + ' — ' + result.changed
                + ' bell' + (result.changed === 1 ? '' : 's')).join('<br>');
        confirmSection.classList.remove('hidden');
    } catch (e) {
        setStatus('Error: ' + (e && e.message), true);
    }
}

async function applyPendingTimeEdit() {
    if (!pendingTimeEdit) return;
    const { bell, oldTime, perSchedule } = pendingTimeEdit;
    confirmApplyBtn.disabled = true;
    try {
        const bb = bells.find(b => b.id === bell.id);
        if (!bb) throw new Error('Building bell vanished mid-edit.');
        bb.name = bell.name;
        bb.time = bell.time;

        const batch = writeBatch(state.db);
        batch.set(configRef(), {
            bells,
            updatedAt: serverTimestamp(),
            updatedBy: state.currentUserDisplayName || 'Anonymous',
        }, { merge: true });
        for (const { schedule, result } of perSchedule) {
            const ref = doc(state.db, 'artifacts', state.appId, 'public', 'data', 'schedules', schedule.id);
            batch.update(ref, {
                periods: result.periods,
                bells: flattenPeriodsToLegacyBells(result.periods),
            });
        }
        await batch.commit();
        for (const { schedule, result } of perSchedule) {
            logScheduleEdit(schedule.id, 'building-bell-propagate', {
                buildingBell: bell.name, from: oldTime, to: bell.time, bellsMoved: result.changed,
            });
        }
        safeLog.log('Building bell "' + bell.name + '" moved ' + oldTime + ' -> ' + bell.time
            + ' across ' + perSchedule.length + ' schedule(s).');
        setStatus('Done — "' + bell.name + '" and all anchored bells now ring at '
            + formatTime12Hour(bell.time, true) + '.');
        hideSubSections();
        resetForm();
        render();
    } catch (e) {
        setStatus('Error applying change: ' + (e && e.message), true);
    } finally {
        confirmApplyBtn.disabled = false;
    }
}

// --- matching assist ---

function startMatch(bbId) {
    const bb = bells.find(b => b.id === bbId);
    if (!bb) return;
    hideSubSections();
    const candidates = findExactTimeMatches(bbId, bb.time);
    matchTitle.textContent = 'Anchor bells at ' + formatTime12Hour(bb.time, true)
        + ' to "' + bb.name + '"';
    if (!candidates.length) {
        matchList.innerHTML = '<p class="text-sm text-gray-500">No unanchored shared bells sit at exactly '
            + escapeHtml(formatTime12Hour(bb.time, true)) + '. (Bells anchor by exact time match; '
            + 'edit an individual bell to attach it manually.)';
        matchApplyBtn.classList.add('hidden');
    } else {
        matchList.innerHTML = candidates.map((c, i) =>
            '<div class="flex items-center">'
            + '<input type="checkbox" checked id="bb-match-' + i + '" data-schedule-id="' + c.schedule.id
            + '" data-bell-id="' + escapeHtml(c.bell.bellId) + '"'
            + ' class="bb-match-check h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">'
            + '<label for="bb-match-' + i + '" class="ml-2 block text-sm text-gray-900">'
            + '<span class="font-medium">' + escapeHtml(c.schedule.name) + ':</span> '
            + escapeHtml(c.bell.name)
            + (c.periodName ? ' <span class="text-gray-500">(' + escapeHtml(c.periodName) + ')</span>' : '')
            + '</label></div>').join('');
        matchApplyBtn.classList.remove('hidden');
    }
    pendingMatch = { bellId: bbId };
    matchSection.classList.remove('hidden');
}

async function applyPendingMatch() {
    if (!pendingMatch) return;
    const bb = bells.find(b => b.id === pendingMatch.bellId);
    if (!bb) return;
    const checks = Array.from(document.querySelectorAll('.bb-match-check:checked'))
        .map(cb => ({ scheduleId: cb.dataset.scheduleId, bellId: cb.dataset.bellId }));
    if (!checks.length) { hideSubSections(); return; }
    matchApplyBtn.disabled = true;
    try {
        const bySchedule = new Map();
        for (const c of checks) {
            if (!bySchedule.has(c.scheduleId)) bySchedule.set(c.scheduleId, new Set());
            bySchedule.get(c.scheduleId).add(c.bellId);
        }
        const batch = writeBatch(state.db);
        let anchored = 0;
        for (const [scheduleId, bellIds] of bySchedule) {
            const schedule = state.allSchedules.find(s => s.id === scheduleId);
            if (!schedule || !schedule.periods) continue;
            const periods = schedule.periods.map(p => ({
                ...p,
                bells: (p.bells || []).map(b => {
                    if (b && bellIds.has(b.bellId)) { anchored++; return { ...b, buildingBellId: bb.id }; }
                    return b;
                }),
            }));
            const ref = doc(state.db, 'artifacts', state.appId, 'public', 'data', 'schedules', scheduleId);
            batch.update(ref, { periods, bells: flattenPeriodsToLegacyBells(periods) });
        }
        await batch.commit();
        for (const [scheduleId, bellIds] of bySchedule) {
            logScheduleEdit(scheduleId, 'building-bell-anchor', {
                buildingBell: bb.name, bellsAnchored: bellIds.size,
            });
        }
        setStatus('Anchored ' + anchored + ' bell' + (anchored === 1 ? '' : 's') + ' to "' + bb.name + '".');
        hideSubSections();
        render();
    } catch (e) {
        setStatus('Error anchoring: ' + (e && e.message), true);
    } finally {
        matchApplyBtn.disabled = false;
    }
}

// --- delete (also strips anchors so no dangling ids linger) ---

async function handleDelete(bbId) {
    const bb = bells.find(b => b.id === bbId);
    if (!bb) return;
    const { n } = anchoredCount(bbId);
    const ok = window.confirm('Delete building bell "' + bb.name + '"?'
        + (n ? '\n\n' + n + ' anchored bell(s) will be detached (their times stay as they are).' : ''));
    if (!ok) return;
    try {
        bells = bells.filter(b => b.id !== bbId);
        const batch = writeBatch(state.db);
        batch.set(configRef(), {
            bells,
            updatedAt: serverTimestamp(),
            updatedBy: state.currentUserDisplayName || 'Anonymous',
        }, { merge: true });
        const touched = [];
        for (const s of state.allSchedules) {
            let hit = false;
            const periods = (s.periods || []).map(p => ({
                ...p,
                bells: (p.bells || []).map(b => {
                    if (b && b.buildingBellId === bbId) {
                        hit = true;
                        const clean = { ...b };
                        delete clean.buildingBellId;
                        return clean;
                    }
                    return b;
                }),
            }));
            if (hit) {
                const ref = doc(state.db, 'artifacts', state.appId, 'public', 'data', 'schedules', s.id);
                batch.update(ref, { periods, bells: flattenPeriodsToLegacyBells(periods) });
                touched.push(s.id);
            }
        }
        await batch.commit();
        for (const id of touched) {
            logScheduleEdit(id, 'building-bell-unanchor', { buildingBell: bb.name, reason: 'deleted' });
        }
        setStatus('Deleted "' + bb.name + '".');
        hideSubSections();
        resetForm();
        render();
    } catch (e) {
        setStatus('Error deleting: ' + (e && e.message), true);
    }
}

// --- edit-bell modal anchor select (called from 16-schedule-management) ---

// Fills + shows the anchor select for a shared bell being edited by an admin.
// Async fill is fire-and-forget by design: the modal opens instantly and the
// options appear when the (cached-after-first-open, one-doc) read returns.
// V6.11.0 FIX: the bell object arriving here is RECONSTRUCTED from list DOM
// data attributes (99-init), which never carried buildingBellId — so the
// select always showed "Not anchored", and the save path then read that as
// an EXPLICIT unanchor: any admin all-users edit of an anchored bell
// silently stripped its anchor (the I0 field-stripping class, reintroduced
// upstream of the 6.5.0 updatePeriodsOnEdit fix). The select is the save
// path's source of truth, so it must be filled from the PRISTINE schedule
// state by bellId, not from the DOM round-trip.
async function populateEditBellAnchorSelect(bell) {
    if (!anchorContainer || !anchorSelect) return;
    anchorContainer.classList.remove('hidden');
    anchorSelect.innerHTML = '<option value="">(loading…)</option>';
    if (!loaded) await loadBells();
    let current = bell && bell.buildingBellId ? bell.buildingBellId : '';
    if (bell && bell.bellId) {
        for (const p of (state.localSchedulePeriods || [])) {
            const real = (p.bells || []).find(b => b && b.bellId === bell.bellId);
            if (real) { current = real.buildingBellId || ''; break; }
        }
    }
    anchorSelect.innerHTML = '<option value="">Not anchored</option>' + bells.map(bb =>
        '<option value="' + bb.id + '"' + (bb.id === current ? ' selected' : '') + '>'
        + escapeHtml(bb.name) + ' (' + escapeHtml(formatTime12Hour(bb.time, true)) + ')</option>').join('');
    if (current && !bells.some(bb => bb.id === current)) {
        // Anchor points at a deleted building bell — surface it rather than hide it
        anchorSelect.innerHTML += '<option value="" selected>(previous anchor no longer exists)</option>';
    }
    // V6.11.0: drive the anchor-name note beneath the time input (admin view).
    const bb = current ? bells.find(b => b.id === current) : null;
    setAnchorNote(bb ? bb.name : null);
}

// V6.11.0: the anchor-name note span under the time input. Shared across the
// admin (populate) and non-admin (16-schedule-management) open paths so the
// name shows for everyone, even though only admins see the select itself.
function setAnchorNote(anchorName) {
    const span = document.getElementById('edit-time-note-anchor');
    if (!span) return;
    if (anchorName) {
        span.textContent = ' · Anchored to “' + anchorName + '” — editing that building bell moves this one automatically.';
        span.classList.remove('hidden');
    } else {
        span.textContent = '';
        span.classList.add('hidden');
    }
}

// V6.11.0: resolve a shared bell's anchor NAME from pristine state, for the
// non-admin note (which has no select to populate). Returns null if unanchored
// or the building bell isn't loaded yet.
async function anchorNameForBell(bell) {
    if (!bell || !bell.bellId) return null;
    let id = bell.buildingBellId || '';
    for (const p of (state.localSchedulePeriods || [])) {
        const real = (p.bells || []).find(b => b && b.bellId === bell.bellId);
        if (real) { id = real.buildingBellId || ''; break; }
    }
    if (!id) return null;
    if (!loaded) { try { await loadBells(); } catch (e) { return null; } }
    const bb = bells.find(b => b.id === id);
    return bb ? bb.name : null;
}

function hideEditBellAnchorSelect() {
    if (anchorContainer) anchorContainer.classList.add('hidden');
}

// Resolution for the save path in 16. Returns:
//   { present: false }                      — select hidden; leave anchors alone
//   { present: true, id: null }             — explicitly unanchored
//   { present: true, id }                   — anchored (time matches)
//   { present: true, id: null, mismatchName } — selection detached: times differ
function resolveEditBellAnchorForSave(newTime) {
    if (!anchorContainer || anchorContainer.classList.contains('hidden') || !anchorSelect) {
        return { present: false };
    }
    const id = anchorSelect.value || null;
    if (!id) return { present: true, id: null };
    const bb = bells.find(b => b.id === id);
    if (!bb) return { present: true, id: null };
    let t = newTime || '';
    if (t.length === 5) t += ':00';
    if (bb.time !== t) return { present: true, id: null, mismatchName: bb.name };
    return { present: true, id };
}

// Convenience: picking an anchor snaps the time input to the building bell's
// time (the anchor MEANS "this bell rings at that moment"). The admin can
// still retype a different time afterwards — the save path then detaches
// with a notice instead of silently keeping a lie.
if (anchorSelect) {
    anchorSelect.addEventListener('change', () => {
        const bb = bells.find(b => b.id === anchorSelect.value);
        const timeField = document.getElementById('edit-bell-time');
        if (bb && timeField) timeField.value = bb.time;
    });
}

// --- wiring (29-pattern: module wires itself; Admin Zone gates the button,
// firestore.rules gates the writes) ---
if (openBtn) openBtn.addEventListener('click', open);
if (closeBtn) closeBtn.addEventListener('click', close);
if (saveBtn) saveBtn.addEventListener('click', handleSave);
if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => { resetForm(); hideSubSections(); });
if (confirmApplyBtn) confirmApplyBtn.addEventListener('click', applyPendingTimeEdit);
if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', hideSubSections);
if (matchApplyBtn) matchApplyBtn.addEventListener('click', applyPendingMatch);
if (matchCancelBtn) matchCancelBtn.addEventListener('click', hideSubSections);
if (listEl) listEl.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.bbEdit) startEdit(t.dataset.bbEdit);
    else if (t.dataset.bbMatch) startMatch(t.dataset.bbMatch);
    else if (t.dataset.bbDelete) handleDelete(t.dataset.bbDelete);
});

// ===== module exports (6.5.0) =====
export {
    anchorNameForBell,
    hideEditBellAnchorSelect,
    populateEditBellAnchorSelect,
    resolveEditBellAnchorForSave,
    setAnchorNote,
};
