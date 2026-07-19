/**
 * Ellis Web Bell — Signage Schedule Utilities
 * Version: 1.0.0 (app release v5.76.0)
 *
 * The SINGLE home for schedule logic shared by the three TV signage pages
 * (dashboard.html, dashright.html, dashclock.html). Before this file, each
 * page carried its own copy of getScheduleStatus + time helpers — a comment
 * claimed they were "bit-for-bit identical," and they had ALREADY diverged
 * cosmetically by the time they were centralized. Do not re-inline.
 *
 * What this adds beyond the old copies:
 *  - RELATIVE BELLS are resolved (via the shared engine) instead of read as
 *    raw stale `time` fields — previously, moving an anchor bell in the main
 *    app silently left TVs showing the old period boundaries.
 *  - EMERGENCY SHIFTS (temporaryShift on the schedule doc) are applied to
 *    static bells, and relative bells ripple from the shifted anchors —
 *    matching the main app, clock.html, and old.html exactly.
 *  - Both are computed at READ time and memoized on (local date + shift
 *    seconds), so a shift self-expires at midnight with no new snapshot and
 *    no cleanup — the first tick after midnight recomputes.
 *
 * LOAD ORDER (in each page's <head>, after firebase-config.js):
 *     <script src="../bell-engine.js"></script>
 *     <script src="schedule-utils.js"></script>
 *
 * Usage pattern in the pages:
 *     schedules[id] = SignageScheduleUtils.makeScheduleRecord(doc.data());
 *     const status = SignageScheduleUtils.getScheduleStatus(schedules[id]);
 *
 * Node-testable (tests/schedule-utils.test.mjs): requires bell-engine.js to
 * have been loaded first, same as in the browser.
 */
(function (global) {
    'use strict';

    function engine() {
        if (!global.BellEngine) {
            throw new Error('bell-engine.js must load before schedule-utils.js');
        }
        return global.BellEngine;
    }

    /**
     * Wrap a schedule doc's data for signage use. Keeps RAW periods (with the
     * historical isEnabled filter) plus the shift metadata; effective periods
     * are computed lazily by getEffectivePeriods.
     */
    function makeScheduleRecord(docData) {
        return {
            name: docData.name,
            rawPeriods: (docData.periods || []).filter(p => p.isEnabled !== false),
            temporaryShift: docData.temporaryShift || null,
            _effKey: null,
            _effPeriods: null
        };
    }

    function computeEffectivePeriods(rawPeriods, shiftSeconds) {
        const E = engine();
        // 1. Copy, shifting STATIC bells only (relative bells ripple in step 2).
        const periods = rawPeriods.map(p => ({
            ...p,
            bells: (p.bells || []).map(b => {
                const copy = { ...b };
                if (shiftSeconds && copy.time && !copy.relative) {
                    copy.time = E.shiftTimeString(copy.time, shiftSeconds);
                }
                return copy;
            })
        }));
        // 2. Resolve relative bells from the (shifted) anchors. bellMap keyed
        //    on raw bellId, exactly like the main app's resolveAllBellTimes.
        const bellMap = new Map();
        periods.forEach(p => p.bells.forEach(b => {
            if (b.bellId !== undefined && b.bellId !== null) bellMap.set(b.bellId, b);
        }));
        periods.forEach(p => {
            p.bells = p.bells.map(b => {
                if (!b.relative) return b;
                const r = E.calculateRelativeBellTime(b, bellMap, periods, new Set(), []);
                // Corrupt/orphan results carry a fallbackTime (same policy as
                // clock.html); a null fallback means the bell is undisplayable.
                const time = (r && typeof r === 'object') ? (r.fallbackTime || null) : r;
                return time ? { ...b, time: time } : null;
            }).filter(Boolean);
        });
        return periods;
    }

    /**
     * The periods a TV should DISPLAY right now: relative bells resolved,
     * today's shift applied. Memoized per record on (local date | shift
     * seconds) — recomputes automatically at midnight and on shift changes;
     * a fresh record from a new snapshot starts with an empty cache.
     */
    function getEffectivePeriods(record) {
        const E = engine();
        const now = new Date();
        const shiftSeconds = E.getActiveScheduleShiftSeconds(record.temporaryShift, now);
        const key = E.toLocalDateString(now) + '|' + shiftSeconds;
        if (record._effKey !== key) {
            record._effKey = key;
            record._effPeriods = computeEffectivePeriods(record.rawPeriods || [], shiftSeconds);
        }
        return record._effPeriods;
    }

    // --- Canonical copies of the previously-triplicated display helpers ---
    // (Behavior preserved from dashclock.html v1.0.0; getScheduleStatus now
    //  runs on EFFECTIVE periods instead of raw ones.)

    function getScheduleStatus(record) {
        const periods = getEffectivePeriods(record);
        const now = new Date();
        const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        for (const period of periods) {
            const bells = period.bells || [];
            if (bells.length === 0) continue;
            const times = bells.map(b => timeToSeconds(b.time)).sort((a, b) => a - b);
            const start = times[0];
            const end = times[times.length - 1];
            if (nowSeconds >= start && nowSeconds < end) {
                const endsAt = formatTime12Hour(end);
                return { period: period.name, countdown: `ends at ${endsAt}`, active: true };
            }
        }

        let nextPeriod = null;
        let nextStart = Infinity;
        for (const period of periods) {
            const bells = period.bells || [];
            if (bells.length === 0) continue;
            const times = bells.map(b => timeToSeconds(b.time)).sort((a, b) => a - b);
            const start = times[0];
            if (start > nowSeconds && start < nextStart) {
                nextStart = start;
                nextPeriod = period;
            }
        }

        if (nextPeriod) {
            const countdown = nextStart - nowSeconds;
            return { period: nextPeriod.name, countdown: `starts in ${formatCountdown(countdown)}`, active: false };
        }
        return { period: 'Day Complete', countdown: '', active: false };
    }

    function timeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(Number);
        return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
    }

    function formatTime12Hour(seconds) {
        let hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return `${hours}:${String(mins).padStart(2, '0')} ${ampm}`;
    }

    function formatCountdown(seconds) {
        if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}:${String(mins).padStart(2, '0')}`;
        } else {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${String(secs).padStart(2, '0')}`;
        }
    }

    const SignageScheduleUtils = {
        makeScheduleRecord,
        getEffectivePeriods,
        getScheduleStatus,
        timeToSeconds,
        formatTime12Hour,
        formatCountdown
    };

    global.SignageScheduleUtils = SignageScheduleUtils;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SignageScheduleUtils;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
