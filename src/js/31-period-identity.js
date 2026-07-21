// ===== 31-period-identity.js (NEW in 6.6.0 — DESIGN-CALENDAR-V2.md Layer 2, slice 1) =====
// One-click, idempotent backfill giving every SHARED-schedule period a
// stable periodId, and stamping parentPeriodId onto shared relative bells
// whose parentPeriodName matches EXACTLY ONE period in their schedule.
// After this runs once, renaming a period no longer orphans its relative
// bells (engine 1.5.0 resolves identity first, name as fallback).
//
// SCOPE, deliberately (see design doc Layer 2):
// - Shared schedules only. Personal schedules are OWNER-ONLY writable by
//   rule; migrating personal anchors is the NEXT slice (client-side, with
//   the ambiguity review modal the design calls for). Their name-keyed
//   anchors keep working meanwhile.
// - Ambiguous names (two periods sharing a name in one schedule) are
//   SKIPPED and counted, never guessed — the review modal's job later.
// - Never regenerates an existing periodId, never removes a name. Purely
//   additive; old clients ignore the new fields and round-trip them by
//   spread (audit ANSWERED — design doc).
//
// Module pattern: 29/30 self-contained style. Runs from the Admin Zone;
// firestore.rules (admin-write on schedules) is the security boundary.

import { safeLog } from './03-memory-management.js';
import { doc, writeBatch } from './01-firebase-imports.js';
import { flattenPeriodsToLegacyBells } from './14-render-schedule-list.js';
import { generatePeriodId } from './05-preferences-cloud-sync.js';
import { logScheduleEdit } from './22-audit-log.js';
import { state } from './state.js';

const runBtn = document.getElementById('period-identity-run-btn');
const statusEl = document.getElementById('period-identity-status');

function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('hidden', !msg);
    statusEl.classList.toggle('text-red-600', !!isError);
    statusEl.classList.toggle('text-blue-600', !isError);
}

async function runBackfill() {
    if (!state.db || !state.allSchedules.length) {
        setStatus('No shared schedules loaded yet.', true);
        return;
    }
    runBtn.disabled = true;
    setStatus('Scanning…');
    try {
        let periodsStamped = 0;
        let anchorsStamped = 0;
        let ambiguousSkipped = 0;
        const touched = []; // [{schedule, periods}]

        for (const schedule of state.allSchedules) {
            const src = schedule.periods || [];
            if (!src.length) continue;
            let changed = false;

            // Pass 1: every period gets an id (existing ids untouched)
            const periods = src.map((p) => {
                if (p && !p.periodId) {
                    changed = true;
                    periodsStamped++;
                    return { ...p, periodId: generatePeriodId() };
                }
                return p;
            });

            // Pass 2: stamp parentPeriodId on shared relative bells whose
            // parentPeriodName matches exactly one period here
            const byName = new Map();
            for (const p of periods) {
                if (!p || !p.name) continue;
                byName.set(p.name, byName.has(p.name) ? 'AMBIGUOUS' : p);
            }
            const stamped = periods.map((p) => {
                if (!p || !Array.isArray(p.bells)) return p;
                let touchedBells = false;
                const bells = p.bells.map((b) => {
                    const rel = b && b.relative;
                    if (!rel || !rel.parentPeriodName || rel.parentPeriodId) return b;
                    const target = byName.get(rel.parentPeriodName);
                    if (!target) return b; // orphan today, orphan tomorrow — not ours to guess
                    if (target === 'AMBIGUOUS') { ambiguousSkipped++; return b; }
                    touchedBells = true;
                    anchorsStamped++;
                    // V6.8.0: shared anchors live in their own schedule — home
                    // base is that schedule by definition
                    return { ...b, relative: { ...rel, parentPeriodId: target.periodId,
                                               baseScheduleId: schedule.id } };
                });
                return touchedBells ? { ...p, bells } : p;
            });
            if (stamped.some((p, i) => p !== periods[i])) changed = true;

            if (changed) touched.push({ schedule, periods: stamped });
        }

        if (!touched.length) {
            setStatus('Nothing to do — every period already has an id'
                + (ambiguousSkipped ? ' (' + ambiguousSkipped + ' ambiguous anchor(s) left for the review tool).' : '.'));
            return;
        }

        const batch = writeBatch(state.db);
        for (const { schedule, periods } of touched) {
            const ref = doc(state.db, 'artifacts', state.appId, 'public', 'data', 'schedules', schedule.id);
            batch.update(ref, { periods, bells: flattenPeriodsToLegacyBells(periods) });
        }
        await batch.commit();
        for (const { schedule } of touched) {
            logScheduleEdit(schedule.id, 'period-identity-backfill', {
                periodsStamped, anchorsStamped, ambiguousSkipped,
            });
        }
        safeLog.log('Period identity backfill:', periodsStamped, 'periods,',
            anchorsStamped, 'anchors,', ambiguousSkipped, 'ambiguous skipped.');
        setStatus('Done: stamped ' + periodsStamped + ' period id(s) and '
            + anchorsStamped + ' anchor(s) across ' + touched.length + ' schedule(s)'
            + (ambiguousSkipped ? '; ' + ambiguousSkipped + ' ambiguous anchor(s) skipped (duplicate period names — the review tool in a later release handles those).' : '.')
            + ' Safe to run again any time.');
    } catch (e) {
        setStatus('Error: ' + (e && e.message), true);
    } finally {
        runBtn.disabled = false;
    }
}

if (runBtn) runBtn.addEventListener('click', runBackfill);

// ===== module exports (6.6.0) =====
// (none — self-wiring side-effect module, 28/29 pattern)
export {};
