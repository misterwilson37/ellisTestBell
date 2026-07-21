// ===== 32-personal-anchor-migration.js (NEW in 6.7.0 — Layer 2, slice 2) =====
// Migrates the user's OWN personal-schedule reminder-bell anchors from
// name-keyed to identity-keyed (parentPeriodId), completing what the 6.6.0
// shared backfill could not touch: personal_schedules are OWNER-ONLY
// writable by rule, so this runs client-side, per user, on their own doc.
//
// Behavior (design doc Layer 2 migration, adapted to the name->id slice):
// - UNAMBIGUOUS (the anchor's parentPeriodName matches exactly one
//   id-bearing period in the merged view): stamped SILENTLY, once. Never
//   destructive — the name stays as the engine's fallback.
// - AMBIGUOUS (duplicate period names in the merged view): NEVER guessed.
//   An amber banner (clock-drift pattern) offers a review modal where the
//   user picks the intended period per bell; unchosen bells stay
//   name-keyed. Banner is dismissible per session.
// - NO id-bearing candidates (shared backfill not run yet, or purely
//   name-orphaned): nothing happens; we check again later.
//
// Mechanics: 28-presence-style gentle interval. Each check is pure local
// classification against state (no reads); a Firestore write happens ONLY
// when there is something to stamp, at most once per personal schedule per
// session (attempted set), via read-modify-write of the user's own doc
// (executeEditPersonalBell pattern). Failures log and never disturb the app.
//
// The merged view (state.calculatedPeriodsList) is the candidate source —
// it is exactly what the engine resolves anchors against, it preserves
// periodId (14 spreads the period), and it excludes nothing we need; we
// exclude only the synthetic "Orphaned Bells" pseudo-period.

import { escapeHtml, formatTime12Hour } from './00-header.js';
import { doc, getDoc, updateDoc } from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { state } from './state.js';

const CHECK_MS = 30 * 1000;

const banner = document.getElementById('anchor-review-banner');
const bannerText = document.getElementById('anchor-review-text');
const bannerOpenBtn = document.getElementById('anchor-review-open');
const bannerDismissBtn = document.getElementById('anchor-review-dismiss');
const modal = document.getElementById('anchor-review-modal');
const modalList = document.getElementById('anchor-review-list');
const modalStatus = document.getElementById('anchor-review-status');
const modalApplyBtn = document.getElementById('anchor-review-apply');
const modalCloseBtn = document.getElementById('anchor-review-close');

const autoStampAttempted = new Set(); // personal schedule ids, this session
let bannerDismissed = false;
let currentAmbiguous = []; // [{bell, candidates:[period]}] for the open modal

function mergedCandidates() {
    return (state.calculatedPeriodsList || [])
        .filter((p) => p && p.periodId && p.name !== 'Orphaned Bells');
}

// Classify the user's personal relative bells against the merged view.
function classify() {
    const byName = new Map();
    for (const p of mergedCandidates()) {
        if (!byName.has(p.name)) byName.set(p.name, []);
        byName.get(p.name).push(p);
    }
    const unambiguous = []; // [{bellId, periodId}]
    const ambiguous = [];   // [{bell, candidates}]
    for (const period of (state.personalBellsPeriods || [])) {
        for (const bell of (period.bells || [])) {
            const rel = bell && bell.relative;
            if (!rel || !rel.parentPeriodName || rel.parentPeriodId) continue;
            const candidates = byName.get(rel.parentPeriodName) || [];
            if (candidates.length === 1) {
                unambiguous.push({ bellId: bell.bellId, periodId: candidates[0].periodId,
                    // V6.8.0: merged-view shared periods belong to the active base
                    baseScheduleId: candidates[0].origin !== 'personal'
                        ? (state.activeBaseScheduleId || null) : null });
            } else if (candidates.length > 1) {
                ambiguous.push({ bell, candidates });
            }
            // zero candidates: backfill not run / orphan — leave for later
        }
    }
    return { unambiguous, ambiguous };
}

// Read-modify-write the user's own personal doc, stamping the given
// bellId -> parentPeriodId pairs. Never touches anything else.
async function stampPersonalAnchors(pairs, label) {
    if (!pairs.length || !state.userId || !state.activePersonalScheduleId) return 0;
    const map = new Map(pairs.map((p) => [p.bellId, p]));
    const ref = doc(state.db, 'artifacts', state.appId, 'users', state.userId,
        'personal_schedules', state.activePersonalScheduleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return 0;
    let stamped = 0;
    const periods = (snap.data().periods || []).map((p) => {
        if (!p || !Array.isArray(p.bells)) return p;
        let touched = false;
        const bells = p.bells.map((b) => {
            const rel = b && b.relative;
            if (!rel || rel.parentPeriodId || !map.has(b.bellId)) return b;
            touched = true;
            stamped++;
            const pick = map.get(b.bellId);
            return { ...b, relative: { ...rel, parentPeriodId: pick.periodId,
                ...(pick.baseScheduleId ? { baseScheduleId: pick.baseScheduleId } : {}) } };
        });
        return touched ? { ...p, bells } : p;
    });
    if (!stamped) return 0;
    await updateDoc(ref, { periods });
    safeLog.log('Anchor migration (' + label + '): stamped ' + stamped
        + ' reminder bell(s) on personal schedule ' + state.activePersonalScheduleId + '.');
    return stamped;
}

function showBanner(count) {
    if (!banner || bannerDismissed) return;
    bannerText.textContent = count + ' reminder bell' + (count === 1 ? '' : 's')
        + ' anchor' + (count === 1 ? 's' : '') + ' to a duplicated period name and need'
        + (count === 1 ? 's' : '') + ' a quick review.';
    banner.classList.remove('hidden');
}

function hideBanner() {
    if (banner) banner.classList.add('hidden');
}

async function beat() {
    if (!state.userId || !state.db || !state.activePersonalScheduleId) return;
    if (document.hidden) return;
    if (!(state.calculatedPeriodsList || []).length) return; // not resolved yet
    const { unambiguous, ambiguous } = classify();

    if (unambiguous.length && !autoStampAttempted.has(state.activePersonalScheduleId)) {
        autoStampAttempted.add(state.activePersonalScheduleId); // once per session even on failure
        try {
            await stampPersonalAnchors(unambiguous, 'silent');
        } catch (e) {
            // Telemetry-grade: log, never disturb; retry next session.
            safeLog.log('anchor migration silent stamp failed:', e && e.message);
        }
    }

    if (ambiguous.length) showBanner(ambiguous.length);
    else hideBanner();
}

// --- review modal ---

function openReview() {
    currentAmbiguous = classify().ambiguous;
    if (!currentAmbiguous.length) { hideBanner(); return; }
    modalStatus.classList.add('hidden');
    modalList.innerHTML = currentAmbiguous.map((item, i) => {
        const rel = item.bell.relative;
        const offs = rel.offsetSeconds || 0;
        const dir = offs < 0 ? 'before' : 'after';
        const edge = rel.parentAnchorType === 'period_start' ? 'the start' : 'the end';
        const options = item.candidates.map((p, j) => {
            const first = (p.bells || []).find((b) => b && b.time);
            const last = (p.bells || []).slice().reverse().find((b) => b && b.time);
            const span = first && last
                ? ' (' + formatTime12Hour(first.time, false) + '–' + formatTime12Hour(last.time, false) + ')'
                : '';
            const origin = p.origin === 'personal' ? ' [personal period]' : '';
            return '<option value="' + j + '">' + escapeHtml(p.name) + escapeHtml(span + origin) + '</option>';
        }).join('');
        return '<div class="mb-4">'
            + '<p class="text-sm font-medium text-gray-700 mb-1">'
            + escapeHtml(item.bell.name) + ' <span class="text-gray-500 text-xs">('
            + Math.abs(Math.round(offs / 60)) + ' min ' + dir + ' ' + edge + ' of "'
            + escapeHtml(rel.parentPeriodName) + '")</span></p>'
            + '<select data-ambiguous-index="' + i + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm">'
            + '<option value="">Decide later (keep name-based)</option>'
            + options + '</select></div>';
    }).join('');
    modal.classList.remove('hidden');
}

async function applyReview() {
    const pairs = [];
    for (const sel of modalList.querySelectorAll('select[data-ambiguous-index]')) {
        if (sel.value === '') continue;
        const item = currentAmbiguous[Number(sel.dataset.ambiguousIndex)];
        const chosen = item && item.candidates[Number(sel.value)];
        if (chosen) pairs.push({ bellId: item.bell.bellId, periodId: chosen.periodId,
            baseScheduleId: chosen.origin !== 'personal' ? (state.activeBaseScheduleId || null) : null }); // V6.8.0
    }
    if (!pairs.length) { closeReview(); return; }
    modalApplyBtn.disabled = true;
    modalStatus.textContent = 'Saving…';
    modalStatus.classList.remove('hidden');
    try {
        const n = await stampPersonalAnchors(pairs, 'review');
        modalStatus.textContent = 'Anchored ' + n + ' reminder bell' + (n === 1 ? '' : 's') + '.';
        setTimeout(() => { closeReview(); beat(); }, 800);
    } catch (e) {
        modalStatus.textContent = 'Error: ' + (e && e.message);
    } finally {
        modalApplyBtn.disabled = false;
    }
}

function closeReview() {
    modal.classList.add('hidden');
    currentAmbiguous = [];
}

setInterval(beat, CHECK_MS);
document.addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });

if (bannerOpenBtn) bannerOpenBtn.addEventListener('click', openReview);
if (bannerDismissBtn) bannerDismissBtn.addEventListener('click', () => {
    bannerDismissed = true;
    hideBanner();
});
if (modalApplyBtn) modalApplyBtn.addEventListener('click', applyReview);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReview);

// ===== module exports (6.7.0) =====
// (none — self-wiring side-effect module, 28/29 pattern)
export {};
