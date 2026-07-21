/**
 * Ellis Web Bell — Shared Bell Engine
 * Version: 1.8.0
 *
 * v1.8.0 (2026-07, app 6.11.0): Layer 4 VERB B (transformation recipes).
 * Two new pure functions:
 *   resolveCalendarTransforms(calendar, date, uid) — collect the v2
 *     verb:'transform' entries scoped to this uid for this date, in entry
 *     order (a user can be in several; they compose). Flat, dumb, ES5-
 *     portable (I3), mirroring resolveCalendarSchedule.
 *   applyRecipeToPeriods(periods, recipe) — apply ONE recipe to a periods
 *     array, immutably, touching ONLY shared-side STATIC bells (string
 *     time, no relative) — relative bells re-derive downstream, which is
 *     exactly how personal overlays survive (Layer 2). Recipe archetypes:
 *       { type:'shift', offsetSeconds, from?, until? } — every static
 *         bell whose ORIGINAL time falls in [from, until] (inclusive;
 *         missing bound = open) moves by offsetSeconds.
 *       { type:'shorten', after, perPeriodSeconds, extendPeriodId?,
 *         extendPeriodName? } — "shorten everything after lunch so flex
 *         runs long": periods whose ORIGINAL start edge (per
 *         findPeriodEdgeAnchorBell) is >= `after` and before the extend
 *         target each lose perPeriodSeconds (clamped so no period drops
 *         below 60s), cascading earlier; the extend target's START moves
 *         earlier by the total reclaimed, its END stays put; interior
 *         static bells ride their period's start delta. Extend target
 *         resolves IDENTITY-FIRST (extendPeriodId) with name fallback
 *         (extendPeriodName) — one recipe fits every schedule that has
 *         a like-named period; schedules without one simply compress.
 *
 * v1.7.0 (2026-07, app 6.10.0): resolveCalendarSchedule extended for the
 * Layer 4 v2 schema — per-date SCOPED entries ({scope:[uids], verb:'base',
 * scheduleId}) resolved per user, first scope hit wins. The v1 shape
 * (exceptions / weekdayDefaults) remains the fallback and still works
 * untouched without a uid (I0). Flat, dumb, ES5-portable (I3).
 *
 * v1.6.0 (2026-07, app 6.8.0): the V5.44.1 period-edge anchor-selection
 * heuristic (shared static first/last, else anchorRole, else legacy
 * "Period Start"/"Period End" names) is EXTRACTED into the named, exported
 * findPeriodEdgeAnchorBell(period, edge) — the reusable "period edge"
 * primitive that Layer 4 transformation recipes will operate on. Accepts
 * edge as 'start'/'end' (design vocabulary) or 'period_start'/'period_end'
 * (stored vocabulary). calculateRelativeBellTime now calls it; behavior
 * identical.
 *
 * v1.5.0 (2026-07, app 6.6.0): period-anchored relative bells resolve by
 * parentPeriodId FIRST (falling back to the historical parentPeriodName
 * string match) — Layer 2 "identity anchors" foundation: renamed periods
 * no longer orphan their relative bells once ids are stamped.
 *
 * v1.4.0 (2026-07, app 6.5.0): added applyBuildingBellTimeToPeriods for
 * the Building Bells feature (DESIGN-CALENDAR-V2.md shared concept):
 * pure propagation of a building bell's new time onto anchored bells.
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

    /**
     * v1.6.0 (app 6.8.0): THE period-edge primitive. Given a period and an
     * edge ('start'|'end', or the stored 'period_start'|'period_end'),
     * return the bell that DEFINES that edge, or null:
     *   1. LINKED period (has shared static bells): first/last shared
     *      static bell (V5.44.1 rule).
     *   2. FLUKE/standalone period: the bell with anchorRole 'start'/'end'.
     *   3. Legacy fallback: a non-relative bell literally named
     *      "Period Start"/"Period End".
     * Pure and defensive; never throws on junk shapes.
     */
    function findPeriodEdgeAnchorBell(period, edge) {
        if (!period || !Array.isArray(period.bells)) return null;
        const wantStart = edge === 'start' || edge === 'period_start';
        const sharedStaticBells = period.bells.filter(b =>
            b && !b.relative && b._originType === 'shared'
        );
        if (sharedStaticBells.length > 0) {
            return wantStart ? sharedStaticBells[0]
                             : sharedStaticBells[sharedStaticBells.length - 1];
        }
        const targetRole = wantStart ? 'start' : 'end';
        let anchorBell = period.bells.find(b => b && b.anchorRole === targetRole);
        if (!anchorBell) {
            const targetName = wantStart ? 'Period Start' : 'Period End';
            anchorBell = period.bells.find(b => b && b.name === targetName && !b.relative);
        }
        return anchorBell || null;
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

            // 2b. Find the parent *period*.
            // v1.5.0 (Layer 2): IDENTITY FIRST — if the anchor carries a
            // parentPeriodId and a period with that id exists, it wins;
            // otherwise fall back to the historical name match (old data,
            // old clients, and unstamped periods keep working — I0).
            const parentPeriod = (bell.relative.parentPeriodId
                    && allPeriods.find(p => p.periodId === bell.relative.parentPeriodId))
                || allPeriods.find(p => p.name === parentPeriodName);
        
            if (!parentPeriod || !parentPeriod.bells || parentPeriod.bells.length === 0) {
                console.warn(`Could not find parent period "${parentPeriodName}" for bell "${bell.name}". It may be orphaned.`);
                return { ...bell, isOrphan: true, fallbackTime: "00:00:00" };
            }
        
            // 2c. Find the anchor bell (start or end) within that period.
            // v1.6.0: heuristic extracted to findPeriodEdgeAnchorBell above —
            // one implementation for resolution here, the edit-modal prefill
            // (module 16), and future Layer 4 recipes. Behavior unchanged.
            const anchorBell = findPeriodEdgeAnchorBell(parentPeriod, parentAnchorType);

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
    function resolveCalendarSchedule(calendar, date, uid) {
        if (!calendar || !date) return null;
        const dateStr = toLocalDateString(date);
        // v1.7.0 (Layer 4, v2 schema): per-date scoped entries win when the
        // caller identifies itself. Scopes are EXPLICIT uid lists (Layer 3
        // invariant: tags filter pickers; uids are what is stored/resolved).
        if (uid && calendar.days &&
            Object.prototype.hasOwnProperty.call(calendar.days, dateStr)) {
            const entries = calendar.days[dateStr] && calendar.days[dateStr].entries;
            if (Array.isArray(entries)) {
                for (let i = 0; i < entries.length; i++) {
                    const e = entries[i];
                    if (e && e.verb === 'base' && Array.isArray(e.scope)
                            && e.scope.indexOf(uid) !== -1 && e.scheduleId) {
                        return e.scheduleId;
                    }
                }
            }
        }
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

    /**
     * v1.4.0 (app 6.5.0, Building Bells): Given a schedule's periods array,
     * return a new periods array in which every STATIC bell carrying the
     * given buildingBellId anchor has its time replaced with newTime.
     *
     * Pure and defensive: the input is never mutated; untouched periods and
     * bells are returned by reference (cheap no-op detection for callers);
     * bells without a string `time` (relative bells) are never touched even
     * if they somehow carry the anchor — writing a time onto a relative
     * bell would corrupt it. Returns { periods, changed } where `changed`
     * is the number of bells actually rewritten, so callers can skip
     * no-op Firestore writes entirely (changed === 0 → same reference back).
     */
    function applyBuildingBellTimeToPeriods(periods, buildingBellId, newTime) {
        if (!Array.isArray(periods) || !buildingBellId || typeof newTime !== 'string') {
            return { periods: periods, changed: 0 };
        }
        let changed = 0;
        const out = periods.map(function (period) {
            const bells = period && Array.isArray(period.bells) ? period.bells : null;
            if (!bells) return period;
            let touched = false;
            const newBells = bells.map(function (bell) {
                if (bell && bell.buildingBellId === buildingBellId
                        && typeof bell.time === 'string' && bell.time !== newTime) {
                    touched = true;
                    changed++;
                    return Object.assign({}, bell, { time: newTime });
                }
                return bell;
            });
            return touched ? Object.assign({}, period, { bells: newBells }) : period;
        });
        return { periods: changed ? out : periods, changed: changed };
    }

    /**
     * v1.8.0 (app 6.11.0, Layer 4 Verb B): collect the transformation
     * recipes that apply to `uid` on `date` from the v2 calendar schema.
     * Returns an array of recipe objects (possibly empty), in entry order —
     * a user may sit in several transform scopes and the recipes COMPOSE
     * (callers apply them sequentially via applyRecipeToPeriods).
     * Pure and defensive; mirrors resolveCalendarSchedule's v2 walk.
     */
    function resolveCalendarTransforms(calendar, date, uid) {
        const out = [];
        if (!calendar || !date || !uid || !calendar.days) return out;
        const dateStr = toLocalDateString(date);
        if (!Object.prototype.hasOwnProperty.call(calendar.days, dateStr)) return out;
        const entries = calendar.days[dateStr] && calendar.days[dateStr].entries;
        if (!Array.isArray(entries)) return out;
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            if (e && e.verb === 'transform' && Array.isArray(e.scope)
                    && e.scope.indexOf(uid) !== -1
                    && e.recipe && typeof e.recipe === 'object') {
                out.push(e.recipe);
            }
        }
        return out;
    }

    /**
     * v1.8.0 (app 6.11.0, Layer 4 Verb B): apply ONE transformation recipe
     * to a periods array. Contract matches applyBuildingBellTimeToPeriods:
     * pure and defensive; the input is NEVER mutated; untouched periods and
     * bells come back by reference; returns { periods, changed } where
     * `changed` counts bells actually rewritten (0 → same array reference
     * back, so callers can skip work).
     *
     * ONLY static bells move (typeof time === 'string' && !relative) — the
     * same rule as the emergency shift and Building Bells propagation.
     * Relative bells, shared and personal, re-derive from the moved parents
     * downstream; that ripple is the whole point (Layer 2 overlays survive).
     *
     * Recipe shapes are documented in the file header. All range tests run
     * against ORIGINAL times, before any movement.
     */
    function applyRecipeToPeriods(periods, recipe) {
        if (!Array.isArray(periods) || !recipe || typeof recipe !== 'object') {
            return { periods: periods, changed: 0 };
        }

        // A bell a recipe may move: STATIC (string time, not relative) and
        // shared-side. On PRISTINE shared-schedule docs (module 34 precompute;
        // module 14 applies recipes pre-merge) bells carry no _originType —
        // untagged is shared by definition there. On merged views the
        // 'custom' tag excludes personal pinned bells, same as the shift.
        function recipeEligible(bell) {
            return !!bell && typeof bell.time === 'string' && !bell.relative
                && (bell._originType === undefined || bell._originType === 'shared');
        }

        // ---- archetype 1: uniform shift of a time range --------------------
        if (recipe.type === 'shift') {
            const offset = Number(recipe.offsetSeconds);
            if (!Number.isFinite(offset) || Math.trunc(offset) === 0) {
                return { periods: periods, changed: 0 };
            }
            const fromS = (typeof recipe.from === 'string' && recipe.from)
                ? timeToSeconds(recipe.from) : null;
            const untilS = (typeof recipe.until === 'string' && recipe.until)
                ? timeToSeconds(recipe.until) : null;
            let changed = 0;
            const out = periods.map(function (period) {
                const bells = period && Array.isArray(period.bells) ? period.bells : null;
                if (!bells) return period;
                let touched = false;
                const newBells = bells.map(function (bell) {
                    if (!recipeEligible(bell)) return bell;
                    const t = timeToSeconds(bell.time);
                    if (fromS !== null && t < fromS) return bell;
                    if (untilS !== null && t > untilS) return bell;
                    touched = true;
                    changed++;
                    return Object.assign({}, bell, {
                        time: shiftTimeString(bell.time, Math.trunc(offset))
                    });
                });
                return touched ? Object.assign({}, period, { bells: newBells }) : period;
            });
            return { periods: changed ? out : periods, changed: changed };
        }

        // ---- archetype 2: shorten periods after a pivot to extend one -----
        if (recipe.type === 'shorten') {
            const per = Math.trunc(Number(recipe.perPeriodSeconds));
            if (!Number.isFinite(per) || per <= 0 || typeof recipe.after !== 'string' || !recipe.after) {
                return { periods: periods, changed: 0 };
            }
            const afterS = timeToSeconds(recipe.after);

            // Survey: original start/end edge bells per period. Prefer the
            // Layer 2 primitive; when it can't name an eligible bell (its
            // first rule keys on the merge-time _originType tag, absent on
            // pristine docs, and pristine bells may lack anchorRole too),
            // fall back to the first/last ELIGIBLE static bell by time —
            // which is exactly what rule 1 computes on merged data anyway.
            // Periods with no eligible static bells at all (e.g. fully
            // personal periods in a merged view) are left untouched.
            const info = periods.map(function (period) {
                const bells = period && Array.isArray(period.bells) ? period.bells : [];
                const statics = bells.filter(recipeEligible)
                    .slice().sort(function (a, b) {
                        return timeToSeconds(a.time) - timeToSeconds(b.time);
                    });
                let startBell = findPeriodEdgeAnchorBell(period, 'start');
                if (!recipeEligible(startBell)) startBell = statics[0] || null;
                let endBell = findPeriodEdgeAnchorBell(period, 'end');
                if (!recipeEligible(endBell)) endBell = statics[statics.length - 1] || null;
                return {
                    period: period,
                    startBell: startBell,
                    endBell: endBell,
                    startS: startBell ? timeToSeconds(startBell.time) : null,
                    endS: endBell ? timeToSeconds(endBell.time) : null
                };
            });

            // Extend target: identity-first, name fallback (one recipe fits
            // every schedule that has a like-named period).
            let target = null;
            if (recipe.extendPeriodId) {
                target = info.find(function (x) {
                    return x.period && x.period.periodId === recipe.extendPeriodId;
                }) || null;
            }
            if (!target && typeof recipe.extendPeriodName === 'string' && recipe.extendPeriodName) {
                target = info.find(function (x) {
                    return x.period && x.period.name === recipe.extendPeriodName;
                }) || null;
            }
            const targetStartS = (target && target.startS !== null) ? target.startS : null;

            // Affected set: original start >= pivot, and (if a target with a
            // known start exists) strictly before the target's start. Sorted
            // by original start so the cascade accumulates in day order.
            const affected = info.filter(function (x) {
                if (x.startS === null) return false;
                if (x === target) return false;
                if (x.startS < afterS) return false;
                if (targetStartS !== null && x.startS >= targetStartS) return false;
                return true;
            }).sort(function (a, b) { return a.startS - b.startS; });

            // Per-period deltas: start rides the running total; end rides the
            // running total PLUS this period's own (clamped) reduction. Every
            // period keeps at least 60 seconds.
            const deltas = new Map(); // period object -> {startDelta, endDelta, endBell}
            let acc = 0;
            for (let i = 0; i < affected.length; i++) {
                const x = affected[i];
                let cut = per;
                if (x.endS !== null) {
                    const duration = x.endS - x.startS;
                    if (duration - cut < 60) cut = Math.max(0, duration - 60);
                }
                deltas.set(x.period, { startDelta: -acc, endDelta: -(acc + cut), endBell: x.endBell });
                acc += cut;
            }
            if (target && acc > 0) {
                deltas.set(target.period, { startDelta: -acc, endDelta: 0, endBell: target.endBell });
            }
            if (deltas.size === 0 || acc === 0) return { periods: periods, changed: 0 };

            let changed = 0;
            const out = periods.map(function (period) {
                const d = deltas.get(period);
                const bells = period && Array.isArray(period.bells) ? period.bells : null;
                if (!d || !bells) return period;
                let touched = false;
                const newBells = bells.map(function (bell) {
                    if (!recipeEligible(bell)) return bell;
                    // The end-edge bell takes the end delta; every other
                    // eligible bell (start edge + interior statics) rides
                    // the START delta — interior bells keep their distance
                    // from the period's opening, which is what a warning
                    // bell means. endDelta of 0 (extend target) = no move.
                    let delta;
                    if (bell === d.endBell) delta = d.endDelta;
                    else delta = d.startDelta;
                    if (!delta) return bell;
                    touched = true;
                    changed++;
                    return Object.assign({}, bell, {
                        time: shiftTimeString(bell.time, delta)
                    });
                });
                return touched ? Object.assign({}, period, { bells: newBells }) : period;
            });
            return { periods: changed ? out : periods, changed: changed };
        }

        // Unknown recipe type: fail closed, change nothing.
        return { periods: periods, changed: 0 };
    }

    const BellEngine = {
        VERSION: '1.8.0', // v1.3.1: exported so the status modal can report it
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
        estimateClockDriftMs,
        applyBuildingBellTimeToPeriods,
        findPeriodEdgeAnchorBell,
        resolveCalendarTransforms,
        applyRecipeToPeriods
    };

    global.BellEngine = BellEngine;

    // Node (unit tests)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BellEngine;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
