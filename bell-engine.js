/**
 * Ellis Web Bell — Shared Bell Engine
 * Version: 1.3.3
 *
 * v1.3.3 (2026-07, app 6.0.1): comment-only — version-number correction:
 * the modularization release was mislabeled 7.0.0; it is 6.0.0. No code change.
 * v1.3.2 (2026-07, app 6.0.0): comment-only — load-order note updated to
 * reference src/js/main.js (script.js retired). No code change.
 * (1.0.0: extracted from script.js v5.71.0 in app release v5.72.0;
 *  1.1.0: added toLocalDateString + resolveCalendarSchedule for the
 *  day-type calendar feature [feature parked in v5.74.0, resolver kept];
 *  1.2.0: added shiftTimeString + getActiveScheduleShiftSeconds for the
 *  emergency schedule shift, app release v5.74.0;
 *  1.3.0: added estimateClockDriftMs for the device clock-drift warning,
 *  app release v5.77.0)
 *
 * The SINGLE implementation of the pure time/schedule math used by every
 * surface. Before this file existed, clock.html carried its own diverged copy
 * of calculateRelativeBellTime that was missing the V5.44.1 anchor-selection
 * logic — TVs could pick the wrong anchor bell for linked periods. Do not
 * re-inline any of these functions into a consuming file.
 *
 * Loaded as a plain (non-module) script, same pattern as firebase-config.js,
 * so it works in the module-based main app AND the compat/classic surfaces:
 *   index.html:  <script src="bell-engine.js"></script>  (before src/js/main.js)
 *   clock.html:  <script src="bell-engine.js"></script>  (before its logic)
 * It also exports for Node so tests/bell-engine.test.mjs can run against it.
 *
 * RULES FOR EDITING (see also build/README-BUILD.md):
 * 1. Everything in here must stay PURE: no DOM, no Firebase, no reads of app
 *    globals. Dependencies come in as parameters (see previousBells /
 *    isBellSkipped). That's what makes this file testable and shareable.
 * 2. After changing this file, run the tests:  node --test tests/
 * 3. getBellId's quote-only replace is INTENTIONAL (it builds identity
 *    strings, not HTML). "Fixing" it to escapeHtml would silently change
 *    stored bell IDs and break saved mutes/skips.
 */
(function (global) {
    'use strict';

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const timeToSeconds = (time) => { // MODIFIED in 4.18: Changed to const arrow function
        try {
            const [h, m, s] = time.split(':').map(Number);
            return (h * 3600) + (m * 60) + (s || 0); // Handle "HH:MM" or "HH:MM:SS"
        } catch (e) {
            return NaN;
        }
    };

    const secondsToTime = (totalSeconds) => { // MODIFIED in 4.18: Changed to const arrow function
        // Ensure time wraps around 24 hours (86400 seconds)
        totalSeconds = (totalSeconds % 86400 + 86400) % 86400;

        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');

        return `${h}:${m}:${s}`;
    };

    function formatTime12Hour(timeString, omitSecondsIfZero = false) {
    if (!timeString) return "--:--";

    try {
        const parts = timeString.split(':');
        if (parts.length < 2) return timeString; // Not a valid time

        let [hours, minutes, seconds] = parts;
        hours = parseInt(hours, 10);

        const ampm = hours >= 12 ? 'PM' : 'AM';
    
        hours = hours % 12;
        hours = hours ? hours : 12; // '0' (midnight) should be '12'

        // 'hours' is now a number (1-12), so no leading zero.
    
        // NEW: v3.22 - Logic to omit seconds
        if (omitSecondsIfZero && seconds && parseInt(seconds, 10) === 0) {
            seconds = null; // Don't display
        }

        if (seconds) {
            return `${hours}:${minutes}:${seconds} ${ampm}`;
        } else {
            return `${hours}:${minutes} ${ampm}`;
        }
    } catch (e) {
        console.error("Error formatting time:", e);
        return timeString; // Fallback to original
    }
    }

    function getDateForBellTime(timeString, referenceDate) {
        // V5.66.3: Handle both "HH:MM" and "HH:MM:SS" formats
        const timeParts = timeString.split(':').map(Number);
        const h = timeParts[0] || 0;
        const m = timeParts[1] || 0;
        const s = timeParts[2] || 0;
        const bellDate = new Date(referenceDate);
        bellDate.setHours(h, m, s, 0); // Set time, clear milliseconds
        return bellDate;
    }

    function getBellId(bell) {
    if (!bell) return null;

    // CRITICAL FIX 5.17: Always prefer the database bell.bellId if it exists
    if (bell.bellId) {
        return String(bell.bellId);
    }

    // Fallback for legacy or quick bells
    if (!bell.type || !bell.time || !bell.name) return null;
    const safeName = bell.name.replace(/"/g, '&quot;');
    return `${bell.type}-${bell.time}-${safeName}`;
    }

    function findNextBellIn(allBells, currentTimeHHMMSS, isBellSkipped) {
        // MODIFIED: v5.47.9 - Skip over temporarily skipped bells
        // v5.72.0: parameterized — caller supplies the merged bell list and the
        // isBellSkipped predicate (the main app's predicate reads its skip state;
        // display surfaces can pass () => false).
        if (allBells.length === 0) return null;
    
        // Filter to upcoming bells that aren't skipped
        let upcomingBells = allBells.filter(bell => 
            bell.time > currentTimeHHMMSS && !isBellSkipped(bell)
        );
    
        let nextBell;
        if (upcomingBells.length > 0) {
            upcomingBells.sort((a, b) => a.time.localeCompare(b.time));
            nextBell = upcomingBells[0];
        } else {
            // No upcoming bells today - find first bell (for tomorrow display)
            // Don't filter by skipped here since skips are day-specific
            allBells.sort((a, b) => a.time.localeCompare(b.time));
            nextBell = allBells[0];
        }
        return nextBell;
    }

    function findBellAfter(currentBell, allBells, isBellSkipped) {
        if (!currentBell || allBells.length === 0) return null;
        // Ensure list is sorted
        const sortedBells = [...allBells].sort((a, b) => a.time.localeCompare(b.time));
    
        const currentIndex = sortedBells.findIndex(b => b.time === currentBell.time && b.name === currentBell.name);
    
        if (currentIndex === -1) return null; // Bell not found
    
        // V5.47.9: Find next bell that isn't skipped
        for (let i = currentIndex + 1; i < sortedBells.length; i++) {
            if (!isBellSkipped(sortedBells[i])) {
                return sortedBells[i];
            }
        }
        return null; // No unskipped bells after this one
    }

    function calculateRelativeBellTime(bell, bellMap, allPeriods, visited = new Set(), previousBells = []) {
        // 1. If the bell already has a static time, it's an anchor.
        if (bell.time && !bell.relative) {
            return bell.time;
        }

        // 2. If it's a relative bell (BY ID - the "old" way)
        if (bell.relative && bell.relative.parentBellId) {
            // 2a. Check for circular dependencies
            if (visited.has(bell.bellId)) {
                // MODIFIED V4.67: Make error log more explicit about the DATA being the problem.
                console.error(`Circular dependency detected for bell "${bell.name}" (ID: ${bell.bellId}). This is a DATA error in your database, not a code bug. One of this bell's parents refers back to it, creating an infinite loop. The bell will be skipped.`);
                // MODIFIED V4.70: Implement user's "Broken Bell" idea.
                // Instead of returning null, return a "corrupt" object.
                return { ...bell, isCorrupt: true, fallbackTime: "00:00:01" };
            }
            visited.add(bell.bellId);

            // 2b. Find the parent bell
            const parentBell = bellMap.get(bell.relative.parentBellId);
            if (!parentBell) {
                console.warn(`Could not find parent bell (ID: ${bell.relative.parentBellId}) for bell "${bell.name}". It may be orphaned.`);
            
                // NEW in 4.32: Find last known time to prevent defaulting to 00:00:00
                const oldBellState = previousBells.find(b => b.bellId === bell.bellId);
                const fallbackTime = oldBellState?.time || "00:00:00"; // Use old time or default
            
                return { ...bell, isOrphan: true, fallbackTime: fallbackTime };
            }

            // 2c. Recursively find the parent's time
            // CRITICAL V4.65 FIX: Must pass the 'allPeriods' array to match the function definition, preventing circular dependency.
            const parentTime = calculateRelativeBellTime(parentBell, bellMap, allPeriods, new Set(visited), previousBells);
        
            // --- NEW V4.72 FIX: Propagate error objects up ---
            // If the parentTime calculation failed (e.g., circular, orphan),
            // return that error object immediately.
            if (parentTime && typeof parentTime === 'object') {
                return parentTime; // This is the isCorrupt or isOrphan object
            }
            // --- END V4.72 FIX ---

            if (!parentTime) {
                console.warn(`Could not calculate time for parent of "${bell.name}".`);
                return null; // Parent calculation failed
            }
        
            // 2d. Calculate this bell's time
            const parentSeconds = timeToSeconds(parentTime);
            const myTimeSeconds = parentSeconds + bell.relative.offsetSeconds;
            const myTime = secondsToTime(myTimeSeconds);
        
            return myTime;
    
        // --- NEW in 4.47: Handle relative bells (BY ANCHOR TYPE) ---
        } else if (bell.relative && bell.relative.parentPeriodName) {
            const { parentPeriodName, parentAnchorType, offsetSeconds } = bell.relative;

            // 2a. Check for circular dependencies
            if (visited.has(bell.bellId)) {
                console.error(`Circular dependency detected for bell "${bell.name}" (ID: ${bell.bellId}).`);
                // MODIFIED V4.73: Return a "corrupt" object instead of null.
                // This was the bug. This block (for 'BY ANCHOR') was returning
                // null, while the 'BY ID' block correctly returned an object.
                return { ...bell, isCorrupt: true, fallbackTime: "00:00:01" };
            }
            visited.add(bell.bellId);

            // 2b. Find the parent *period*
            const parentPeriod = allPeriods.find(p => p.name === parentPeriodName);
        
            if (!parentPeriod || !parentPeriod.bells || parentPeriod.bells.length === 0) {
                console.warn(`Could not find parent period "${parentPeriodName}" for bell "${bell.name}". It may be orphaned.`);
                return { ...bell, isOrphan: true, fallbackTime: "00:00:00" };
            }
        
            // 2c. Find the anchor bell (start or end) within that period.
            // Note: We MUST recursively find the time for these, as they could also be relative.
            let anchorBell;
            
            // --- MODIFIED V5.44.1: Use anchorRole for fluke periods, shared bells for linked periods ---
            // Determine if this is a shared/linked period or a custom/fluke period
            const sharedStaticBells = parentPeriod.bells.filter(b => 
                !b.relative && b._originType === 'shared'
            );
        
            if (sharedStaticBells.length > 0) {
                // LINKED PERIOD: Use first/last shared static bell as anchor
                if (parentAnchorType === 'period_start') {
                    anchorBell = sharedStaticBells[0];
                } else {
                    anchorBell = sharedStaticBells[sharedStaticBells.length - 1];
                }
            } else {
                // FLUKE/STANDALONE PERIOD: Find bells with explicit anchorRole
                const targetRole = parentAnchorType === 'period_start' ? 'start' : 'end';
                anchorBell = parentPeriod.bells.find(b => b.anchorRole === targetRole);
            
                // Legacy fallback: look for "Period Start" / "Period End" names
                if (!anchorBell) {
                    const targetName = parentAnchorType === 'period_start' ? 'Period Start' : 'Period End';
                    anchorBell = parentPeriod.bells.find(b => b.name === targetName && !b.relative);
                }
            }
        
            if (!anchorBell) {
                console.warn(`No anchor bell found in period "${parentPeriodName}" for bell "${bell.name}". It may be orphaned.`);
                return { ...bell, isOrphan: true, fallbackTime: "00:00:00" };
            }
            // --- END V5.44.1 FIX ---

            // 2d. Recursively find the anchor bell's time
            const anchorTime = calculateRelativeBellTime(anchorBell, bellMap, allPeriods, new Set(visited), previousBells);
        
            // --- NEW V4.72 FIX: Propagate error objects up ---
            if (anchorTime && typeof anchorTime === 'object') {
                return anchorTime; // This is the isCorrupt or isOrphan object
            }
            // --- END V4.72 FIX ---
        
            if (!anchorTime) {
                console.warn(`Could not calculate time for parent anchor of "${bell.name}".`);
                return null; // Parent calculation failed
            }

            // 2e. Calculate this bell's time
            const anchorSeconds = timeToSeconds(anchorTime);
            const myTimeSeconds = anchorSeconds + offsetSeconds;
            const myTime = secondsToTime(myTimeSeconds);
        
            return myTime;
        }

        // 3. Bell is invalid (no time and no relative prop)

        console.warn(`Invalid bell object: "${bell.name}" has no time or relative data.`);
        return null;
    }
    /**
     * v1.1.0: Local-timezone YYYY-MM-DD string for a Date. Never use
     * toISOString() for this — it converts to UTC, which shifts the date for
     * every evening hour in US timezones (a 10 PM Tuesday would resolve
     * Wednesday's schedule).
     */
    function toLocalDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * v1.1.0: Resolve which shared-schedule id the school calendar designates
     * for a given date. Pure — the caller supplies the calendar document.
     *
     * calendar shape (Firestore doc public/data/config/schedule_calendar):
     *   {
     *     weekdayDefaults: { "0".."6": scheduleId | "" },   // Sun..Sat
     *     exceptions:      { "YYYY-MM-DD": scheduleId | "" }
     *   }
     *
     * Rules: a date exception beats the weekday default; an explicitly empty
     * value ("") means "no designation that day" and suppresses the weekday
     * default (e.g. a holiday). Returns a scheduleId string or null.
     */
    function resolveCalendarSchedule(calendar, date) {
        if (!calendar || !date) return null;
        const dateStr = toLocalDateString(date);
        if (calendar.exceptions &&
            Object.prototype.hasOwnProperty.call(calendar.exceptions, dateStr)) {
            return calendar.exceptions[dateStr] || null;
        }
        const wd = String(date.getDay());
        if (calendar.weekdayDefaults &&
            Object.prototype.hasOwnProperty.call(calendar.weekdayDefaults, wd)) {
            return calendar.weekdayDefaults[wd] || null;
        }
        return null;
    }

    /**
     * v1.2.0: Shift an HH:MM(:SS) time string by a number of seconds
     * (negative allowed; wraps around midnight like secondsToTime).
     */
    function shiftTimeString(timeStr, offsetSeconds) {
        return secondsToTime(timeToSeconds(timeStr) + offsetSeconds);
    }

    /**
     * v1.2.0: How many seconds a schedule's emergency shift applies TODAY.
     * temporaryShift shape (field on a shared-schedule doc):
     *   { seconds: 600, date: "YYYY-MM-DD", setAt: iso }
     * The shift only applies on its stamped LOCAL date, so it self-expires at
     * midnight without anyone clearing it. Returns 0 for null/expired/invalid.
     */
    function getActiveScheduleShiftSeconds(temporaryShift, date) {
        if (!temporaryShift || !temporaryShift.seconds || !date) return 0;
        if (temporaryShift.date !== toLocalDateString(date)) return 0;
        const s = Number(temporaryShift.seconds);
        return Number.isFinite(s) ? Math.trunc(s) : 0;
    }

    /**
     * v1.3.0: Estimate this device's clock drift from a server-timestamp
     * round trip. The server stamped the document at some unknown moment
     * between localBeforeMs (just before the write was sent) and
     * localAfterMs (when the write was acknowledged); the midpoint is the
     * standard NTP-style estimate, giving an uncertainty of half the round
     * trip — fine for a ~45-second warning threshold.
     *
     * Positive result = the server is AHEAD = this device's clock is SLOW
     * (bells would ring late). Returns null for invalid input.
     */
    function estimateClockDriftMs(localBeforeMs, localAfterMs, serverMs) {
        if (!Number.isFinite(localBeforeMs) || !Number.isFinite(localAfterMs) ||
            !Number.isFinite(serverMs) || localAfterMs < localBeforeMs) return null;
        return serverMs - (localBeforeMs + localAfterMs) / 2;
    }

    const BellEngine = {
        VERSION: '1.3.3', // v1.3.1: exported so the status modal can report it
        escapeHtml,
        getBellId,
        formatTime12Hour,
        timeToSeconds,
        secondsToTime,
        getDateForBellTime,
        findNextBellIn,
        findBellAfter,
        calculateRelativeBellTime,
        toLocalDateString,
        resolveCalendarSchedule,
        shiftTimeString,
        getActiveScheduleShiftSeconds,
        estimateClockDriftMs
    };

    global.BellEngine = BellEngine;

    // Node (unit tests)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BellEngine;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
