// ===== 37-overlap-warning.js (NEW 6.16.0; resolver added 6.17.0) =====
// The "you're cutting into 4th" heads-up AND its fix. After each recalc, if an
// admin is editing a SHARED schedule and a period's last bell runs past the
// next period's first bell, a bold red banner names the overrun and offers
// "Fix…". The resolver previews the exact bell-time changes before anything is
// written, then hands the moves to module 18 (via an event) which applies them
// through the normal save path. Read-until-you-Apply: detection and preview
// never touch a bell; only Apply writes, and only static bells move (relatives
// re-derive). The spread math lives in the engine (planOverlapResolution),
// pure and tested.

import { escapeHtml } from './00-header.js';
import { state } from './state.js';

const banner = document.getElementById('overlap-warning-banner');
const textEl = document.getElementById('overlap-warning-text');
const fixBtn = document.getElementById('overlap-warning-fix');
const dismissBtn = document.getElementById('overlap-warning-dismiss');

const modal = document.getElementById('overlap-resolver-modal');
const summaryEl = document.getElementById('overlap-resolver-summary');
const absorbWrap = document.getElementById('overlap-resolver-absorb');
const previewEl = document.getElementById('overlap-resolver-preview');
const applyBtn = document.getElementById('overlap-resolver-apply');
const cancelBtn = document.getElementById('overlap-resolver-cancel');

let dismissedSignature = null;
let currentOverlaps = [];   // from the engine detector, this render
let currentOverrun = null;  // the one being resolved

function hide() { if (banner) banner.classList.add('hidden'); }
function fmt(t) {
    return window.BellEngine && window.BellEngine.formatTime12Hour
        ? window.BellEngine.formatTime12Hour(t, true) : t;
}
// Only editing a SHARED schedule (admin, not on a personal overlay) can be fixed.
function canFix() {
    return document.body.classList.contains('admin-mode')
        && !state.activePersonalScheduleId && !!state.scheduleRef;
}

function refreshOverlapWarning() {
    if (!banner || !textEl) return;
    if (!document.body.classList.contains('admin-mode')) { hide(); return; }
    const engine = window.BellEngine;
    if (!engine || !engine.detectPeriodOverlaps) { hide(); return; }

    currentOverlaps = engine.detectPeriodOverlaps(state.calculatedPeriodsList || []);
    if (!currentOverlaps.length) { dismissedSignature = null; hide(); return; }

    const signature = currentOverlaps.map((o) => o.name + '>' + o.nextName + '@' + o.overlapSeconds).join('|');
    if (signature === dismissedSignature) { hide(); return; }

    const one = currentOverlaps[0];
    const mins = Math.round(one.overlapSeconds / 60);
    let msg = '<strong>Schedule overlap:</strong> ' + escapeHtml(one.name) + ' ends '
        + escapeHtml(fmt(one.endsAt)) + ', but ' + escapeHtml(one.nextName) + ' begins '
        + escapeHtml(fmt(one.startsAt)) + ' — <strong>' + mins + ' min</strong> over.';
    if (currentOverlaps.length > 1) msg += ' (+' + (currentOverlaps.length - 1) + ' more)';
    textEl.innerHTML = msg;
    banner.dataset.signature = signature;
    if (fixBtn) fixBtn.classList.toggle('hidden', !canFix());
    banner.classList.remove('hidden');
}

// ---- resolver modal ----
function chosenStrategy() {
    const r = document.querySelector('input[name="overlap-strategy"]:checked');
    return r ? r.value : 'shrink';
}
function checkedAbsorb() {
    return Array.from(absorbWrap ? absorbWrap.querySelectorAll('input:checked') : [])
        .map((cb) => cb.dataset.period);
}

// periods that come AFTER the overrun's next period start (candidates to absorb)
function followingPeriodNames() {
    const engine = window.BellEngine;
    const overlaps = engine.detectPeriodOverlaps(state.calculatedPeriodsList || []);
    const o = overlaps[0];
    if (!o) return [];
    const spans = (state.calculatedPeriodsList || [])
        .filter((p) => p && p.isEnabled !== false && Array.isArray(p.bells) && p.bells.length)
        .map((p) => ({ name: p.name, start: Math.min.apply(null, p.bells.filter((b) => b.time).map((b) => window.BellEngine.timeToSeconds(b.time))) }))
        .sort((a, b) => a.start - b.start);
    const qi = spans.findIndex((s) => s.name === o.nextName);
    return qi < 0 ? [] : spans.slice(qi).map((s) => s.name);
}

function renderPreview() {
    if (!previewEl || !currentOverrun) return;
    const protectBox = document.getElementById('overlap-resolver-protect');
    const protectGaps = protectBox ? protectBox.checked : true;
    const plan = window.BellEngine.planOverlapResolution(
        state.calculatedPeriodsList || [], currentOverrun.name,
        chosenStrategy(), checkedAbsorb(), protectGaps);
    const spreadOnly = document.getElementById('overlap-resolver-spread-fields');
    if (spreadOnly) spreadOnly.classList.toggle('hidden', chosenStrategy() !== 'spread');
    // v6.18.1: "protect passing periods" applies to Shrink AND Spread (Push
    // preserves every gap inherently, so it's irrelevant there).
    const protectRow = document.getElementById('overlap-resolver-protect-row');
    if (protectRow) protectRow.classList.toggle('hidden', chosenStrategy() === 'push');

    let html = '';
    if (plan.warning) html += '<p class="text-amber-700 text-sm mb-2">⚠ ' + escapeHtml(plan.warning) + '</p>';
    if (!plan.moves.length) {
        html += '<p class="text-sm text-gray-500">No changes to preview.</p>';
    } else {
        const dayEnd = plan.dayEndDeltaSeconds;
        html += '<p class="text-sm text-gray-600 mb-1">' + plan.moves.length + ' bell(s) will move'
            + (dayEnd === 0 ? '; the day still ends at the same time.'
                : '; the day will end ' + Math.abs(Math.round(dayEnd / 60)) + ' min '
                  + (dayEnd > 0 ? 'later.' : 'earlier.')) + '</p>';
        html += '<ul class="text-sm space-y-1 max-h-40 overflow-y-auto">'
            + plan.moves.map((m) => '<li>' + escapeHtml(fmt(m.from)) + ' → <strong>'
                + escapeHtml(fmt(m.to)) + '</strong></li>').join('') + '</ul>';
    }
    previewEl.innerHTML = html;
    if (applyBtn) applyBtn.disabled = !plan.moves.length;
    return plan;
}

function openResolver() {
    if (!modal || !canFix() || !currentOverlaps.length) return;
    currentOverrun = currentOverlaps[0];
    if (summaryEl) {
        summaryEl.innerHTML = '<strong>' + escapeHtml(currentOverrun.name) + '</strong> ends '
            + escapeHtml(fmt(currentOverrun.endsAt)) + ', but <strong>' + escapeHtml(currentOverrun.nextName)
            + '</strong> begins ' + escapeHtml(fmt(currentOverrun.startsAt)) + '. How should we fix it?';
    }
    const shrinkLabel = document.getElementById('overlap-strategy-shrink-label');
    if (shrinkLabel) shrinkLabel.textContent = 'Shrink ' + currentOverrun.nextName + ' (it starts later; day ends on time)';
    const shrinkRadio = document.querySelector('input[name="overlap-strategy"][value="shrink"]');
    if (shrinkRadio) shrinkRadio.checked = true;
    if (absorbWrap) {
        absorbWrap.innerHTML = followingPeriodNames().map((n) =>
            '<label class="flex items-center gap-2 text-sm"><input type="checkbox" data-period="'
            + escapeHtml(n) + '"> ' + escapeHtml(n) + '</label>').join('');
    }
    renderPreview();
    modal.classList.remove('hidden');
}

function applyFix() {
    const plan = renderPreview();
    if (!plan || !plan.moves.length) return;
    // V6.17.1: "Push later" moves DISMISSAL for the whole building. Speed bump.
    if (chosenStrategy() === 'push') {
        const ok = window.confirm(
            "\u26A0\uFE0F  Hold up.\n\n"
            + "This pushes DISMISSAL later for the ENTIRE BUILDING. Are you truly "
            + "ready to face the repercussions?\n\n"
            + "Think of the children! The parents! The bus drivers! The car-rider "
            + "line! The \u2014 dare I say it \u2014 TEACHERS!\n\n"
            + "Proceed and change the end of the day?");
        if (!ok) return;
    }
    document.dispatchEvent(new CustomEvent('ellis-apply-overlap-fix', { detail: { moves: plan.moves } }));
    if (modal) modal.classList.add('hidden');
}

if (fixBtn) fixBtn.addEventListener('click', openResolver);
if (dismissBtn) dismissBtn.addEventListener('click', () => {
    dismissedSignature = banner ? (banner.dataset.signature || null) : null;
    hide();
});
if (cancelBtn) cancelBtn.addEventListener('click', () => { if (modal) modal.classList.add('hidden'); });
if (applyBtn) applyBtn.addEventListener('click', applyFix);
if (modal) modal.addEventListener('change', (e) => {
    const t = e.target;
    if (t && (t.name === 'overlap-strategy' || t.id === 'overlap-resolver-protect'
              || (t instanceof HTMLElement && t.dataset.period))) renderPreview();
});

// ===== module exports (6.16.0) =====
export { refreshOverlapWarning };
