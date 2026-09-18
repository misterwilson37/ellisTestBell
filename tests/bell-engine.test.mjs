/**
 * Unit tests for bell-engine.js — the shared time/schedule math.
 * Run with:  node --test tests/
 * (from the repo root; requires Node 18+, no npm packages needed)
 *
 * These cover the highest-consequence logic in the app: if any of this is
 * wrong, bells ring at the wrong time on 50 teachers' machines. Run them
 * after ANY edit to bell-engine.js.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../bell-engine.js');

const never = () => false;

// ---------- formatTime12Hour ----------
test('formatTime12Hour: basic PM conversion', () => {
    assert.equal(E.formatTime12Hour('13:05:30'), '1:05:30 PM');
});
test('formatTime12Hour: midnight becomes 12 AM', () => {
    assert.equal(E.formatTime12Hour('00:15:00'), '12:15:00 AM');
});
test('formatTime12Hour: noon is 12 PM', () => {
    assert.equal(E.formatTime12Hour('12:00:00'), '12:00:00 PM');
});
test('formatTime12Hour: omitSecondsIfZero drops :00 only', () => {
    assert.equal(E.formatTime12Hour('09:30:00', true), '9:30 AM');
    assert.equal(E.formatTime12Hour('09:30:15', true), '9:30:15 AM');
});
test('formatTime12Hour: HH:MM without seconds', () => {
    assert.equal(E.formatTime12Hour('14:45'), '2:45 PM');
});
test('formatTime12Hour: falsy/garbage input falls back safely', () => {
    assert.equal(E.formatTime12Hour(''), '--:--');
    assert.equal(E.formatTime12Hour(null), '--:--');
    assert.equal(E.formatTime12Hour('bananas'), 'bananas');
});

// ---------- timeToSeconds / secondsToTime ----------
test('timeToSeconds: HH:MM:SS and HH:MM', () => {
    assert.equal(E.timeToSeconds('01:02:03'), 3723);
    assert.equal(E.timeToSeconds('01:02'), 3720); // missing seconds -> 0
});
test('secondsToTime: pads and wraps around 24h', () => {
    assert.equal(E.secondsToTime(3723), '01:02:03');
    assert.equal(E.secondsToTime(86400 + 60), '00:01:00'); // wraps past midnight
    assert.equal(E.secondsToTime(-60), '23:59:00');        // negative wraps back
});
test('round trip', () => {
    for (const t of ['00:00:00', '07:44:01', '23:59:59']) {
        assert.equal(E.secondsToTime(E.timeToSeconds(t)), t);
    }
});

// ---------- getDateForBellTime ----------
test('getDateForBellTime: HH:MM (no seconds) does not create Invalid Date (V5.66.3 regression)', () => {
    const ref = new Date(2026, 6, 16, 10, 0, 0);
    const d = E.getDateForBellTime('08:15', ref);
    assert.equal(d.getHours(), 8);
    assert.equal(d.getMinutes(), 15);
    assert.equal(d.getSeconds(), 0);
    assert.ok(!Number.isNaN(d.getTime()));
});

// ---------- getBellId ----------
test('getBellId: prefers stored bellId', () => {
    assert.equal(E.getBellId({ bellId: 42, type: 'shared', time: '08:00:00', name: 'x' }), '42');
});
test('getBellId: legacy fallback keeps quote-only escaping (identity strings, not HTML)', () => {
    assert.equal(
        E.getBellId({ type: 'shared', time: '08:00:00', name: 'The "Late" Bell' }),
        'shared-08:00:00-The &quot;Late&quot; Bell'
    );
});
test('getBellId: null for incomplete legacy bells', () => {
    assert.equal(E.getBellId({ name: 'no time' }), null);
});

// ---------- findNextBellIn ----------
const day = [
    { time: '08:00:00', name: 'First' },
    { time: '12:00:00', name: 'Lunch' },
    { time: '15:00:00', name: 'Dismissal' },
];
test('findNextBellIn: picks the next upcoming bell', () => {
    assert.equal(E.findNextBellIn([...day], '09:00:00', never).name, 'Lunch');
});
test('findNextBellIn: after last bell, returns first bell (tomorrow display)', () => {
    assert.equal(E.findNextBellIn([...day], '16:00:00', never).name, 'First');
});
test('findNextBellIn: skipped bells are passed over', () => {
    const skipLunch = (b) => b.name === 'Lunch';
    assert.equal(E.findNextBellIn([...day], '09:00:00', skipLunch).name, 'Dismissal');
});
test('findNextBellIn: empty schedule returns null', () => {
    assert.equal(E.findNextBellIn([], '09:00:00', never), null);
});

// ---------- findBellAfter ----------
test('findBellAfter: returns the following unskipped bell', () => {
    assert.equal(E.findBellAfter(day[0], [...day], never).name, 'Lunch');
    const skipLunch = (b) => b.name === 'Lunch';
    assert.equal(E.findBellAfter(day[0], [...day], skipLunch).name, 'Dismissal');
});
test('findBellAfter: last bell of the day returns null', () => {
    assert.equal(E.findBellAfter(day[2], [...day], never), null);
});

// ---------- calculateRelativeBellTime ----------
function mapOf(...bells) {
    const m = new Map();
    for (const b of bells) m.set(b.bellId, b); // keyed raw, matching resolveAllBellTimes
    return m;
}

test('relative: static bell returns its own time', () => {
    const b = { bellId: 1, name: 'Anchor', time: '08:00:00' };
    assert.equal(E.calculateRelativeBellTime(b, mapOf(b), []), '08:00:00');
});

test('relative: by parentBellId with positive and negative offsets', () => {
    const anchor = { bellId: 1, name: 'Anchor', time: '08:00:00' };
    const plus5 = { bellId: 2, name: '+5m', relative: { parentBellId: 1, offsetSeconds: 300 } };
    const minus90 = { bellId: 3, name: '-90s', relative: { parentBellId: 1, offsetSeconds: -90 } };
    const m = mapOf(anchor, plus5, minus90);
    assert.equal(E.calculateRelativeBellTime(plus5, m, []), '08:05:00');
    assert.equal(E.calculateRelativeBellTime(minus90, m, []), '07:58:30');
});

test('relative: chains resolve recursively', () => {
    const a = { bellId: 1, name: 'A', time: '08:00:00' };
    const b = { bellId: 2, name: 'B', relative: { parentBellId: 1, offsetSeconds: 600 } };
    const c = { bellId: 3, name: 'C', relative: { parentBellId: 2, offsetSeconds: 60 } };
    assert.equal(E.calculateRelativeBellTime(c, mapOf(a, b, c), []), '08:11:00');
});

test('relative: circular dependency yields isCorrupt with fallbackTime, not an infinite loop', () => {
    const a = { bellId: 1, name: 'A', relative: { parentBellId: 2, offsetSeconds: 60 } };
    const b = { bellId: 2, name: 'B', relative: { parentBellId: 1, offsetSeconds: 60 } };
    const r = E.calculateRelativeBellTime(a, mapOf(a, b), []);
    assert.equal(typeof r, 'object');
    assert.equal(r.isCorrupt, true);
    assert.equal(r.fallbackTime, '00:00:01');
});

test('relative: orphan (missing parent) falls back to last known time via previousBells', () => {
    const orphan = { bellId: 9, name: 'Orphan', relative: { parentBellId: 999, offsetSeconds: 60 } };
    const r = E.calculateRelativeBellTime(orphan, mapOf(orphan), [], new Set(),
        [{ bellId: 9, time: '10:30:00' }]);
    assert.equal(r.isOrphan, true);
    assert.equal(r.fallbackTime, '10:30:00');
});

test('relative: orphan with no history falls back to 00:00:00', () => {
    const orphan = { bellId: 9, name: 'Orphan', relative: { parentBellId: 999, offsetSeconds: 60 } };
    const r = E.calculateRelativeBellTime(orphan, mapOf(orphan), []);
    assert.equal(r.isOrphan, true);
    assert.equal(r.fallbackTime, '00:00:00');
});

test('relative: period anchor uses shared static bells for LINKED periods (V5.44.1)', () => {
    // Linked period: shared static bells exist -> first/last shared bell is the anchor,
    // even if anchorRole-marked personal bells are also present.
    const s1 = { bellId: 1, name: 'Shared Start', time: '09:00:00', _originType: 'shared' };
    const s2 = { bellId: 2, name: 'Shared End', time: '09:44:00', _originType: 'shared' };
    const roleBell = { bellId: 3, name: 'Personal Start', time: '09:05:00', anchorRole: 'start' };
    const period = { name: '2nd Period', bells: [s1, roleBell, s2] };
    const rel = { bellId: 4, name: '5 before end',
        relative: { parentPeriodName: '2nd Period', parentAnchorType: 'period_end', offsetSeconds: -300 } };
    const r = E.calculateRelativeBellTime(rel, mapOf(s1, s2, roleBell, rel), [period]);
    assert.equal(r, '09:39:00'); // anchored to 09:44 shared end, NOT a role bell
});

test('relative: period anchor uses anchorRole bells for STANDALONE periods (V5.44.1)', () => {
    const start = { bellId: 1, name: 'Period Start', time: '10:00:00', anchorRole: 'start' };
    const end = { bellId: 2, name: 'Period End', time: '10:44:00', anchorRole: 'end' };
    const period = { name: 'Fluke', bells: [start, end] };
    const rel = { bellId: 3, name: '2 after start',
        relative: { parentPeriodName: 'Fluke', parentAnchorType: 'period_start', offsetSeconds: 120 } };
    const r = E.calculateRelativeBellTime(rel, mapOf(start, end, rel), [period]);
    assert.equal(r, '10:02:00');
});

test('relative: missing parent period yields isOrphan', () => {
    const rel = { bellId: 3, name: 'Lost',
        relative: { parentPeriodName: 'Nope', parentAnchorType: 'period_start', offsetSeconds: 0 } };
    const r = E.calculateRelativeBellTime(rel, mapOf(rel), []);
    assert.equal(r.isOrphan, true);
});

// ---------- escapeHtml ----------
test('escapeHtml: escapes all five characters', () => {
    assert.equal(E.escapeHtml(`<img src=x onerror="alert('&')">`),
        '&lt;img src=x onerror=&quot;alert(&#39;&amp;&#39;)&quot;&gt;');
});
test('escapeHtml: null/undefined become empty string', () => {
    assert.equal(E.escapeHtml(null), '');
    assert.equal(E.escapeHtml(undefined), '');
});

// ---------- schedule calendar (v1.1.0) ----------
test('toLocalDateString: local date, not UTC (evening does not roll to tomorrow)', () => {
    const eveningLocal = new Date(2026, 6, 14, 22, 30); // 10:30 PM local, July 14
    assert.equal(E.toLocalDateString(eveningLocal), '2026-07-14');
});
test('calendar: weekday default applies', () => {
    const cal = { weekdayDefaults: { '2': 'schedA' } }; // Tuesday
    assert.equal(E.resolveCalendarSchedule(cal, new Date(2026, 6, 14)), 'schedA'); // Tue Jul 14 2026
});
test('calendar: date exception beats weekday default', () => {
    const cal = { weekdayDefaults: { '2': 'schedA' }, exceptions: { '2026-07-14': 'assembly' } };
    assert.equal(E.resolveCalendarSchedule(cal, new Date(2026, 6, 14)), 'assembly');
});
test('calendar: explicitly empty exception suppresses the weekday default (holiday)', () => {
    const cal = { weekdayDefaults: { '2': 'schedA' }, exceptions: { '2026-07-14': '' } };
    assert.equal(E.resolveCalendarSchedule(cal, new Date(2026, 6, 14)), null);
});
test('calendar: no designation and no calendar both resolve null', () => {
    assert.equal(E.resolveCalendarSchedule({ weekdayDefaults: { '1': 'x' } }, new Date(2026, 6, 14)), null);
    assert.equal(E.resolveCalendarSchedule(null, new Date()), null);
});

// ---------- emergency schedule shift (v1.2.0) ----------
test('shiftTimeString: forward, backward, and midnight wrap', () => {
    assert.equal(E.shiftTimeString('08:00:00', 600), '08:10:00');
    assert.equal(E.shiftTimeString('08:00:00', -600), '07:50:00');
    assert.equal(E.shiftTimeString('23:55:00', 600), '00:05:00');
});
test('getActiveScheduleShiftSeconds: applies only on its stamped local date', () => {
    const today = new Date(2026, 6, 16, 9, 0);
    assert.equal(E.getActiveScheduleShiftSeconds({ seconds: 600, date: '2026-07-16' }, today), 600);
    assert.equal(E.getActiveScheduleShiftSeconds({ seconds: 600, date: '2026-07-15' }, today), 0); // yesterday's shift expired
});
test('getActiveScheduleShiftSeconds: null/invalid/zero are 0', () => {
    assert.equal(E.getActiveScheduleShiftSeconds(null, new Date()), 0);
    assert.equal(E.getActiveScheduleShiftSeconds({ seconds: 0, date: E.toLocalDateString(new Date()) }, new Date()), 0);
    assert.equal(E.getActiveScheduleShiftSeconds({ seconds: 'ten', date: E.toLocalDateString(new Date()) }, new Date()), 0);
});
test('shift ripples through relative bells anchored to a shifted static bell', () => {
    // Simulates what resolveAllBellTimes does: shift the static anchor first,
    // then resolve the relative bell from it.
    const anchor = { bellId: 1, name: 'Period Start', time: E.shiftTimeString('08:00:00', 600) };
    const warn = { bellId: 2, name: '2-min warning', relative: { parentBellId: 1, offsetSeconds: -120 } };
    const m = new Map([[1, anchor], [2, warn]]);
    assert.equal(E.calculateRelativeBellTime(warn, m, []), '08:08:00');
});

// ---------- clock drift estimation (v1.3.0) ----------
test('estimateClockDriftMs: midpoint estimate, both directions', () => {
    // Server stamped 30s ahead of the local midpoint -> device is slow
    assert.equal(E.estimateClockDriftMs(1000, 2000, 1500 + 30000), 30000);
    // Server behind -> device fast (negative drift)
    assert.equal(E.estimateClockDriftMs(1000, 2000, 1500 - 60000), -60000);
    // Perfect sync
    assert.equal(E.estimateClockDriftMs(1000, 3000, 2000), 0);
});
test('estimateClockDriftMs: invalid input returns null', () => {
    assert.equal(E.estimateClockDriftMs(2000, 1000, 1500), null); // after < before
    assert.equal(E.estimateClockDriftMs(NaN, 2000, 1500), null);
    assert.equal(E.estimateClockDriftMs(1000, 2000, undefined), null);
});

// ---------- Building Bells propagation (v1.4.0, app 6.5.0) ----------
test('applyBuildingBellTimeToPeriods: rewrites anchored bells, counts changes, never mutates input', () => {
    const periods = [
        { name: '3rd', bells: [
            { bellId: 'a', name: 'End of 3rd', time: '09:30:00', buildingBellId: 'bb-end3' },
            { bellId: 'b', name: 'Warning', time: '09:28:00' },
        ] },
        { name: '4th', bells: [
            { bellId: 'c', name: 'Start of 4th', time: '09:30:00', buildingBellId: 'bb-end3' },
        ] },
    ];
    const frozen = JSON.stringify(periods);
    const r = E.applyBuildingBellTimeToPeriods(periods, 'bb-end3', '09:30:30');
    assert.equal(r.changed, 2);
    assert.equal(r.periods[0].bells[0].time, '09:30:30');
    assert.equal(r.periods[0].bells[1].time, '09:28:00'); // unanchored untouched
    assert.equal(r.periods[1].bells[0].time, '09:30:30');
    assert.equal(JSON.stringify(periods), frozen); // input pristine
    assert.notEqual(r.periods, periods); // changed -> new array
});
test('applyBuildingBellTimeToPeriods: no matches or already-correct times -> zero changes, same reference', () => {
    const periods = [
        { name: 'Flex', bells: [
            { bellId: 'x', name: 'Start of Flex', time: '14:10:00', buildingBellId: 'bb-flex' },
            { bellId: 'y', name: 'Other', time: '08:00:00', buildingBellId: 'bb-different' },
        ] },
    ];
    const same = E.applyBuildingBellTimeToPeriods(periods, 'bb-flex', '14:10:00');
    assert.equal(same.changed, 0);
    assert.equal(same.periods, periods); // reference equality -> caller skips write
    const none = E.applyBuildingBellTimeToPeriods(periods, 'bb-nonexistent', '15:00:00');
    assert.equal(none.changed, 0);
    assert.equal(none.periods, periods);
});
test('applyBuildingBellTimeToPeriods: never writes a time onto relative bells; tolerates junk shapes', () => {
    const periods = [
        { name: 'P', bells: [
            // A relative bell that (wrongly) carries an anchor: must NOT gain a time
            { bellId: 'r', name: 'Rel', relative: { parentBellId: 'a', offsetSeconds: -60 }, buildingBellId: 'bb-x' },
            { bellId: 's', name: 'Static', time: '10:00:00', buildingBellId: 'bb-x' },
        ] },
        { name: 'Empty (no bells key)' },
    ];
    const r = E.applyBuildingBellTimeToPeriods(periods, 'bb-x', '10:00:30');
    assert.equal(r.changed, 1);
    assert.equal(r.periods[0].bells[0].time, undefined); // relative bell untouched
    assert.equal(r.periods[0].bells[1].time, '10:00:30');
    // Defensive no-ops on bad input
    assert.equal(E.applyBuildingBellTimeToPeriods(null, 'bb-x', '10:00:30').changed, 0);
    assert.equal(E.applyBuildingBellTimeToPeriods(periods, '', '10:00:30').changed, 0);
    assert.equal(E.applyBuildingBellTimeToPeriods(periods, 'bb-x', null).changed, 0);
});

// ---------- Period identity anchors (v1.5.0, app 6.6.0) ----------
test('calculateRelativeBellTime: parentPeriodId wins over name — renamed period keeps its relative bell', () => {
    const periods = [
        { periodId: 'period_abc', name: 'RENAMED 4th', bells: [
            { bellId: 's1', name: 'Start', time: '10:00:00', _originType: 'shared' },
            { bellId: 's2', name: 'End', time: '10:45:00', _originType: 'shared' },
        ] },
    ];
    const warn = { bellId: 'w', name: '2-min warning', relative: {
        parentPeriodId: 'period_abc', parentPeriodName: '4th Period', // stale name
        parentAnchorType: 'period_end', offsetSeconds: -120 } };
    const m = new Map([['s1', periods[0].bells[0]], ['s2', periods[0].bells[1]]]);
    assert.equal(E.calculateRelativeBellTime(warn, m, periods), '10:43:00');
});
test('calculateRelativeBellTime: no id (or unmatched id) falls back to historical name match', () => {
    const periods = [
        { name: '4th Period', bells: [
            { bellId: 's1', name: 'Start', time: '10:00:00', _originType: 'shared' },
        ] },
    ];
    const m = new Map([['s1', periods[0].bells[0]]]);
    const noId = { bellId: 'a', name: 'Warn', relative: {
        parentPeriodName: '4th Period', parentAnchorType: 'period_start', offsetSeconds: 60 } };
    assert.equal(E.calculateRelativeBellTime(noId, m, periods), '10:01:00');
    const staleId = { bellId: 'b', name: 'Warn2', relative: {
        parentPeriodId: 'period_GONE', parentPeriodName: '4th Period',
        parentAnchorType: 'period_start', offsetSeconds: 120 } };
    assert.equal(E.calculateRelativeBellTime(staleId, m, periods), '10:02:00');
});

// ---------- Period edge primitive (v1.6.0, app 6.8.0) ----------
test('findPeriodEdgeAnchorBell: linked period uses first/last shared static bell; accepts both edge vocabularies', () => {
    const period = { name: '4th', bells: [
        { bellId: 'w', name: 'Warn', relative: { parentBellId: 's1', offsetSeconds: -60 } },
        { bellId: 's1', name: 'Start', time: '10:00:00', _originType: 'shared' },
        { bellId: 's2', name: 'End', time: '10:45:00', _originType: 'shared' },
    ] };
    assert.equal(E.findPeriodEdgeAnchorBell(period, 'start').bellId, 's1');
    assert.equal(E.findPeriodEdgeAnchorBell(period, 'period_start').bellId, 's1');
    assert.equal(E.findPeriodEdgeAnchorBell(period, 'end').bellId, 's2');
    assert.equal(E.findPeriodEdgeAnchorBell(period, 'period_end').bellId, 's2');
});
test('findPeriodEdgeAnchorBell: fluke period uses anchorRole; legacy name fallback; null when nothing qualifies', () => {
    const fluke = { name: 'Club', bells: [
        { bellId: 'a', name: 'Club Start', time: '15:00:00', anchorRole: 'start' },
        { bellId: 'b', name: 'Club End', time: '15:30:00', anchorRole: 'end' },
    ] };
    assert.equal(E.findPeriodEdgeAnchorBell(fluke, 'period_start').bellId, 'a');
    assert.equal(E.findPeriodEdgeAnchorBell(fluke, 'end').bellId, 'b');
    const legacy = { name: 'Old', bells: [
        { bellId: 'x', name: 'Period Start', time: '08:00:00' },
        { bellId: 'y', name: 'Period End', time: '08:30:00' },
    ] };
    assert.equal(E.findPeriodEdgeAnchorBell(legacy, 'start').bellId, 'x');
    assert.equal(E.findPeriodEdgeAnchorBell(legacy, 'period_end').bellId, 'y');
    // Nothing qualifies -> null (the "only wrong-edge anchor exists" case:
    // must NOT return the end anchor for a start request)
    const endOnly = { name: 'HalfFluke', bells: [
        { bellId: 'e', name: 'Late End', time: '16:00:00', anchorRole: 'end' },
    ] };
    assert.equal(E.findPeriodEdgeAnchorBell(endOnly, 'start'), null);
    assert.equal(E.findPeriodEdgeAnchorBell(null, 'start'), null);
    assert.equal(E.findPeriodEdgeAnchorBell({ name: 'NoBells' }, 'end'), null);
});

// ---------- Scoped calendar resolution (v1.7.0, app 6.10.0, Layer 4) ----------
test('resolveCalendarSchedule v2: scoped entry wins for a scoped uid; others fall through to v1', () => {
    const cal = {
        days: { '2026-07-20': { entries: [
            { scope: ['u-test1', 'u-test2'], verb: 'base', scheduleId: 'testing-am' },
            { scope: ['u-cdc'], verb: 'base', scheduleId: 'cdc-day' },
        ] } },
        weekdayDefaults: { '1': 'normal-monday' },
    };
    const mon = new Date(2026, 6, 20); // local Monday
    assert.equal(E.resolveCalendarSchedule(cal, mon, 'u-test2'), 'testing-am');
    assert.equal(E.resolveCalendarSchedule(cal, mon, 'u-cdc'), 'cdc-day');
    assert.equal(E.resolveCalendarSchedule(cal, mon, 'u-unscoped'), 'normal-monday');
    assert.equal(E.resolveCalendarSchedule(cal, mon), 'normal-monday'); // v1 callers untouched
    assert.equal(E.resolveCalendarSchedule(cal, new Date(2026, 6, 21), 'u-test1'), null); // other day
});
test('resolveCalendarSchedule v2: junk-tolerant; non-base verbs and malformed entries skipped', () => {
    const cal = { days: { '2026-07-20': { entries: [
        null,
        { scope: 'not-an-array', verb: 'base', scheduleId: 'x' },
        { scope: ['u-a'], verb: 'transform', recipe: 'later' },
        { scope: ['u-a'], verb: 'base', scheduleId: 'right-one' },
    ] } } };
    assert.equal(E.resolveCalendarSchedule(cal, new Date(2026, 6, 20), 'u-a'), 'right-one');
    assert.equal(E.resolveCalendarSchedule(cal, new Date(2026, 6, 20), 'u-b'), null);
});

// ---------- Verb B: transformation recipes (v1.8.0, app 6.11.0, Layer 4) ----------
test('resolveCalendarTransforms: collects scoped transform recipes in entry order; base verbs and other uids skipped', () => {
    const shiftR = { type: 'shift', offsetSeconds: 300, from: '12:00' };
    const shortR = { type: 'shorten', after: '12:00', perPeriodSeconds: 600, extendPeriodName: 'Flex' };
    const cal = { days: { '2026-07-20': { entries: [
        { scope: ['u-a'], verb: 'base', scheduleId: 'x' },
        { scope: ['u-a', 'u-b'], verb: 'transform', recipe: shiftR },
        null,
        { scope: ['u-a'], verb: 'transform' },              // no recipe -> skipped
        { scope: 'junk', verb: 'transform', recipe: shiftR }, // bad scope -> skipped
        { scope: ['u-a'], verb: 'transform', recipe: shortR },
    ] } } };
    const mon = new Date(2026, 6, 20);
    assert.deepEqual(E.resolveCalendarTransforms(cal, mon, 'u-a'), [shiftR, shortR]);
    assert.deepEqual(E.resolveCalendarTransforms(cal, mon, 'u-b'), [shiftR]);
    assert.deepEqual(E.resolveCalendarTransforms(cal, mon, 'u-c'), []);
    assert.deepEqual(E.resolveCalendarTransforms(cal, new Date(2026, 6, 21), 'u-a'), []);
    assert.deepEqual(E.resolveCalendarTransforms(null, mon, 'u-a'), []);
    assert.deepEqual(E.resolveCalendarTransforms(cal, mon), []); // no uid -> nothing
});

test('applyRecipeToPeriods shift: only static bells in range move; out-of-range and relative untouched by reference; input never mutated', () => {
    const periods = [
        { name: 'AM', bells: [
            { bellId: 'a1', name: 'Start', time: '08:00:00' },
            { bellId: 'a2', name: 'End', time: '08:50:00' },
        ] },
        { name: 'PM', bells: [
            { bellId: 'p1', name: 'Start', time: '12:10:00' },
            { bellId: 'pw', name: 'Warn', relative: { parentBellId: 'p2', offsetSeconds: -300 } },
            { bellId: 'p2', name: 'End', time: '13:16:00' },
        ] },
    ];
    const snapshot = JSON.stringify(periods);
    const r = E.applyRecipeToPeriods(periods, { type: 'shift', offsetSeconds: 300, from: '12:00' });
    assert.equal(r.changed, 2);
    assert.equal(JSON.stringify(periods), snapshot);           // input pristine
    assert.equal(r.periods[0], periods[0]);                    // untouched period by reference
    assert.equal(r.periods[1].bells[0].time, '12:15:00');
    assert.equal(r.periods[1].bells[1], periods[1].bells[1]);  // relative bell by reference
    assert.equal(r.periods[1].bells[2].time, '13:21:00');
    // until bound + no-op offset + unknown type all fail closed
    const r2 = E.applyRecipeToPeriods(periods, { type: 'shift', offsetSeconds: -60, from: '08:00', until: '09:00' });
    assert.equal(r2.changed, 2);
    assert.equal(r2.periods[0].bells[0].time, '07:59:00');
    assert.equal(r2.periods[1], periods[1]);
    assert.equal(E.applyRecipeToPeriods(periods, { type: 'shift', offsetSeconds: 0 }).periods, periods);
    assert.equal(E.applyRecipeToPeriods(periods, { type: 'mystery' }).periods, periods);
});

test('applyRecipeToPeriods shift: merged-view custom (personal pinned) static bells never move', () => {
    const periods = [{ name: 'PM', bells: [
        { bellId: 's', name: 'Start', time: '12:10:00', _originType: 'shared' },
        { bellId: 'c', name: 'My pinned', time: '12:30:00', _originType: 'custom' },
    ] }];
    const r = E.applyRecipeToPeriods(periods, { type: 'shift', offsetSeconds: 300, from: '12:00' });
    assert.equal(r.changed, 1);
    assert.equal(r.periods[0].bells[0].time, '12:15:00');
    assert.equal(r.periods[0].bells[1], periods[0].bells[1]);
});

test('applyRecipeToPeriods shorten: cascade compresses affected periods, extend target start moves / end stays, interior bells ride start', () => {
    // Pristine shared doc shapes: no _originType, no anchorRole -> the
    // first/last-static edge fallback must carry the whole survey.
    const periods = [
        { name: 'Lunch', periodId: 'pl', bells: [
            { bellId: 'l1', name: 'Start', time: '11:26:00' },
            { bellId: 'l2', name: 'End', time: '11:56:00' },
        ] },
        { name: '5th', periodId: 'p5', bells: [
            { bellId: 'f1', name: 'Start', time: '12:00:00' },
            { bellId: 'fw', name: 'Warning', time: '12:40:00' },
            { bellId: 'f2', name: 'End', time: '13:06:00' },
        ] },
        { name: '6th', periodId: 'p6', bells: [
            { bellId: 's1', name: 'Start', time: '13:10:00' },
            { bellId: 's2', name: 'End', time: '14:16:00' },
        ] },
        { name: 'Flex', periodId: 'pf', bells: [
            { bellId: 'x1', name: 'Start', time: '14:20:00' },
            { bellId: 'x2', name: 'End', time: '15:00:00' },
        ] },
    ];
    const snapshot = JSON.stringify(periods);
    const r = E.applyRecipeToPeriods(periods, {
        type: 'shorten', after: '12:00', perPeriodSeconds: 600, extendPeriodId: 'pf',
    });
    assert.equal(JSON.stringify(periods), snapshot);
    assert.equal(r.periods[0], periods[0]);                    // Lunch untouched (starts before pivot)
    assert.equal(r.periods[1].bells[0].time, '12:00:00');      // 5th start: acc 0
    assert.equal(r.periods[1].bells[1].time, '12:40:00');      // interior rides start delta (0)
    assert.equal(r.periods[1].bells[2].time, '12:56:00');      // 5th end: -10 min
    assert.equal(r.periods[2].bells[0].time, '13:00:00');      // 6th start: -10
    assert.equal(r.periods[2].bells[1].time, '13:56:00');      // 6th end: -20
    assert.equal(r.periods[3].bells[0].time, '14:00:00');      // Flex start: -20 (total reclaimed)
    assert.equal(r.periods[3].bells[1].time, '15:00:00');      // Flex end STAYS
    // 5th is the FIRST affected period, so its startDelta is 0 — its Start
    // and Warning bells move by 0 and are returned by reference (the engine
    // skips no-op rewrites). Rewritten bells: 5th End, 6th Start, 6th End,
    // Flex Start = 4. (changed counts real rewrites, not affected periods.)
    assert.equal(r.changed, 4);
});

test('applyRecipeToPeriods shorten: name fallback finds the extend target; missing target still compresses; duration clamp holds 60s floor', () => {
    const mk = () => ([
        { name: '5th', bells: [
            { bellId: 'a', name: 'Start', time: '12:00:00' },
            { bellId: 'b', name: 'End', time: '12:07:00' },   // 7 min period
        ] },
        { name: 'Flex', bells: [
            { bellId: 'c', name: 'Start', time: '12:10:00' },
            { bellId: 'd', name: 'End', time: '12:40:00' },
        ] },
    ]);
    // Name fallback + clamp: asking for 10 min from a 7-min period yields 6 (floor 60s)
    const r = E.applyRecipeToPeriods(mk(), {
        type: 'shorten', after: '12:00', perPeriodSeconds: 600,
        extendPeriodId: 'no-such-id', extendPeriodName: 'Flex',
    });
    assert.equal(r.periods[0].bells[1].time, '12:01:00');      // end clamped to 60s duration
    assert.equal(r.periods[1].bells[0].time, '12:04:00');      // Flex start: -6 min actually reclaimed
    assert.equal(r.periods[1].bells[1].time, '12:40:00');
    // No target anywhere: still compresses, nothing extends
    const r2 = E.applyRecipeToPeriods(mk(), {
        type: 'shorten', after: '12:00', perPeriodSeconds: 120, extendPeriodName: 'Nope',
    });
    assert.equal(r2.periods[0].bells[1].time, '12:05:00');
    // No target: BOTH periods are affected and the cut cascades. 5th cuts
    // 120s (acc 0->120), Flex cuts 120s; Flex end delta = -(acc+cut) =
    // -(120+120) = -240s. 12:40 - 4:00 = 12:36. (The 2 min 5th reclaimed
    // rides forward into Flex's end — that IS the cascade.)
    assert.equal(r2.periods[1].bells[1].time, '12:36:00');     // Flex end: -4 min (cascade)
    // Junk recipes fail closed
    assert.equal(E.applyRecipeToPeriods(mk(), { type: 'shorten', after: '12:00', perPeriodSeconds: 0 }).changed, 0);
    assert.equal(E.applyRecipeToPeriods(mk(), { type: 'shorten', perPeriodSeconds: 300 }).changed, 0);
});

// v6.12.0 (Verb B WIRING): the compose pipeline module 14 runs — resolve the
// day's recipes for a uid, then fold them onto the base periods in order.
// This pins the behavior resolveAllBellTimes depends on: recipes COMPOSE, a
// no-op recipe returns the SAME reference (so pristine base survives), and
// the second recipe sees the first recipe's output.
test('Verb B pipeline: resolveCalendarTransforms + sequential applyRecipeToPeriods compose in order; no-op preserves base reference', () => {
    const base = [
        { name: 'AM', bells: [{ bellId: 'a', name: 'Start', time: '08:00:00' }] },
        { name: 'PM', bells: [{ bellId: 'p', name: 'Start', time: '12:00:00' }] },
    ];
    const cal = { days: { '2026-09-14': { entries: [
        { scope: ['u1'], verb: 'transform', recipe: { type: 'shift', offsetSeconds: 300, from: '12:00' } },
        { scope: ['u1'], verb: 'transform', recipe: { type: 'shift', offsetSeconds: 120, from: '12:00' } },
    ] } } };
    const day = new Date(2026, 8, 14);
    const recipes = E.resolveCalendarTransforms(cal, day, 'u1');
    assert.equal(recipes.length, 2);

    // Fold exactly as module 14's resolveAllBellTimes does.
    let periods = base;
    for (let i = 0; i < recipes.length; i++) {
        periods = E.applyRecipeToPeriods(periods, recipes[i]).periods;
    }
    assert.equal(periods[0].bells[0].time, '08:00:00');  // AM untouched (out of range)
    assert.equal(periods[0], base[0]);                   // untouched period by reference
    assert.equal(periods[1].bells[0].time, '12:07:00');  // 12:00 + 5m + 2m composed
    assert.equal(JSON.stringify(base[1].bells[0].time), '"12:00:00"'); // base pristine

    // Empty recipe set (the common case) leaves the base array by reference.
    let none = base;
    E.resolveCalendarTransforms(cal, day, 'nobody').forEach((r) => {
        none = E.applyRecipeToPeriods(none, r).periods;
    });
    assert.equal(none, base);
});

// v6.13.0: mergeCalendarEntry — the base-dedup / transform-append rule.
test('mergeCalendarEntry: base is per-person last-write-wins; transforms append; input never mutated', () => {
    const entries = [
        { scope: ['a', 'b'], verb: 'base', scheduleId: 'x' },
        { scope: ['c'], verb: 'base', scheduleId: 'y' },
        { scope: ['a'], verb: 'transform', recipe: { type: 'shift', offsetSeconds: 300 } },
    ];
    const snap = JSON.stringify(entries);

    // Re-designating 'a' strips a from the {a,b} base (leaving {b}); the
    // transform on 'a' is untouched; the new base is appended.
    const r = E.mergeCalendarEntry(entries, { scope: ['a'], verb: 'base', scheduleId: 'z' });
    assert.equal(JSON.stringify(entries), snap);                 // pristine input
    assert.deepEqual(r, [
        { scope: ['b'], verb: 'base', scheduleId: 'x' },
        { scope: ['c'], verb: 'base', scheduleId: 'y' },
        { scope: ['a'], verb: 'transform', recipe: { type: 'shift', offsetSeconds: 300 } },
        { scope: ['a'], verb: 'base', scheduleId: 'z' },
    ]);

    // A base entry that empties completely is dropped.
    const r2 = E.mergeCalendarEntry(entries, { scope: ['c'], verb: 'base', scheduleId: 'z' });
    assert.equal(r2.some((e) => e.scheduleId === 'y'), false);   // {c}->y emptied, gone
    assert.equal(r2[r2.length - 1].scheduleId, 'z');

    // Transforms only ever append (compose) — no dedup against base or each other.
    const r3 = E.mergeCalendarEntry(entries, { scope: ['a'], verb: 'transform', recipe: { type: 'shorten', after: '12:00', perPeriodSeconds: 600 } });
    assert.equal(r3.length, 4);
    assert.equal(r3[0].scope.length, 2);                         // {a,b} base untouched by a transform add

    // Defensive: null/garbage entry returns a copy; empty base seeds cleanly.
    assert.deepEqual(E.mergeCalendarEntry([], { scope: ['a'], verb: 'base', scheduleId: 'x' }),
        [{ scope: ['a'], verb: 'base', scheduleId: 'x' }]);
    assert.deepEqual(E.mergeCalendarEntry(entries, null), entries);
    assert.notEqual(E.mergeCalendarEntry(entries, null), entries); // copy, not same ref
});

// v6.14.0: resolveScopedDesignation — the mandate half, split out for the
// home-schedule feature. resolveCalendarSchedule must stay behavior-identical.
test('resolveScopedDesignation: scoped uid hit only; exceptions/weekdayDefaults are NOT its job', () => {
    const cal = {
        days: { '2026-09-14': { entries: [
            { scope: ['u-a'], verb: 'base', scheduleId: 'scoped-a' },
            { scope: ['u-b'], verb: 'transform', recipe: { type: 'shift', offsetSeconds: 60 } },
        ] } },
        exceptions: { '2026-09-14': 'exception-sched' },
        weekdayDefaults: { '1': 'monday-sched' },
    };
    const mon = new Date(2026, 8, 14); // a Monday
    // scoped resolver: only sees the scoped base hit, ignores exception/weekday
    assert.equal(E.resolveScopedDesignation(cal, mon, 'u-a'), 'scoped-a');
    assert.equal(E.resolveScopedDesignation(cal, mon, 'u-b'), null); // transform ≠ base
    assert.equal(E.resolveScopedDesignation(cal, mon, 'u-c'), null); // no scope hit
    assert.equal(E.resolveScopedDesignation(cal, mon), null);        // no uid
    // resolveCalendarSchedule unchanged: scoped wins, else exception, else weekday
    assert.equal(E.resolveCalendarSchedule(cal, mon, 'u-a'), 'scoped-a');
    assert.equal(E.resolveCalendarSchedule(cal, mon, 'u-c'), 'exception-sched'); // falls to exception
    assert.equal(E.resolveCalendarSchedule(cal, mon), 'exception-sched');        // no uid -> exception
    const tue = new Date(2026, 8, 15);
    assert.equal(E.resolveCalendarSchedule(cal, tue), null); // no exception that day, no Tue default
});

// v6.16.0: detectPeriodOverlaps — the read-only overrun detector.
test('detectPeriodOverlaps: flags a period whose last bell passes the next period start; ignores gaps, back-to-back, and single-bell markers', () => {
    const P = (name, times) => ({ name, bells: times.map((t, i) => ({ bellId: name + i, time: t })) });
    // 3rd ends 10:44, 4th begins 10:38 -> 6-min (360s) overrun. Announce is a
    // single-bell marker (skipped). 5th is back-to-back with 4th end (not flagged).
    const clean = [
        P('3rd Period', ['10:00:00', '10:34:00']),
        P('4th Period', ['10:38:00', '11:20:00']),
        { name: 'Announcements', bells: [{ bellId: 'a', time: '08:15:00' }] }, // single -> skipped
    ];
    assert.deepEqual(E.detectPeriodOverlaps(clean), []); // 10:34 < 10:38 gap, all good

    const overrun = [
        P('3rd Period', ['10:00:00', '10:44:00']), // stretched past 4th's start
        P('4th Period', ['10:38:00', '11:20:00']),
    ];
    const r = E.detectPeriodOverlaps(overrun);
    assert.equal(r.length, 1);
    assert.equal(r[0].name, '3rd Period');
    assert.equal(r[0].nextName, '4th Period');
    assert.equal(r[0].endsAt, '10:44:00');
    assert.equal(r[0].startsAt, '10:38:00');
    assert.equal(r[0].overlapSeconds, 360);

    // back-to-back (end == next start) is NOT an overrun
    const touching = [P('A', ['09:00:00', '09:50:00']), P('B', ['09:50:00', '10:40:00'])];
    assert.deepEqual(E.detectPeriodOverlaps(touching), []);

    // disabled periods and non-arrays are ignored safely
    assert.deepEqual(E.detectPeriodOverlaps(null), []);
    const withDisabled = [
        P('X', ['08:00:00', '09:30:00']),
        { name: 'Y', isEnabled: false, bells: [{ time: '08:30:00' }, { time: '10:00:00' }] },
    ];
    assert.deepEqual(E.detectPeriodOverlaps(withDisabled), []); // Y skipped, X alone -> no pair
});

// v6.17.0: planOverlapResolution — resolve an overrun three ways, static bells only.
test('planOverlapResolution: shrink / push / spread; never moves relative bells', () => {
    // 3rd 10:00–10:44 overruns 4th (begins 10:38); then 5th 11:24–12:00.
    const periods = [
        { name: '3rd', bells: [{ bellId: 'b3s', time: '10:00:00' }, { bellId: 'b3e', time: '10:44:00' }] },
        { name: '4th', bells: [
            { bellId: 'b4s', time: '10:38:00' },
            { bellId: 'b4rel', time: '10:40:00', relative: { parentBellId: 'b4s', offsetSeconds: 120 } }, // relative: never moved
            { bellId: 'b4e', time: '11:20:00' },
        ] },
        { name: '5th', bells: [{ bellId: 'b5s', time: '11:24:00' }, { bellId: 'b5e', time: '12:00:00' }] },
    ];

    // shrink (protect default ON, v6.18.1): 4th's start moves to 3rd.end PLUS a
    // passing period (reuses 4th's own outgoing gap, 4th->5th = 4 min) = 10:48
    const shrink = E.planOverlapResolution(periods, '3rd', 'shrink');
    assert.equal(shrink.moves.length, 1);
    assert.equal(shrink.moves[0].bellId, 'b4s');
    assert.equal(shrink.moves[0].to, '10:48:00'); // 10:44 + 4-min passing period preserved
    assert.equal(shrink.dayEndDeltaSeconds, 0);
    assert.ok(!shrink.moves.some((m) => m.bellId === 'b4rel')); // relative never moved
    // protect OFF: butt them together at 3rd.end (no passing period)
    const shrinkRaw = E.planOverlapResolution(periods, '3rd', 'shrink', null, false);
    assert.equal(shrinkRaw.moves[0].to, '10:44:00');

    // push: 4th + 5th all shift +6min (360s); day ends 6 min later
    const push = E.planOverlapResolution(periods, '3rd', 'push');
    assert.equal(push.dayEndDeltaSeconds, 360);
    const b5sPush = push.moves.find((m) => m.bellId === 'b5s');
    assert.equal(b5sPush.to, '11:30:00'); // 11:24 + 6
    assert.ok(!push.moves.some((m) => m.bellId === 'b4rel')); // still no relative

    // spread across 4th only: rigid +6 shift of 4th's statics; 5th steps back to net 0 at day-end
    const spread = E.planOverlapResolution(periods, '3rd', 'spread', ['4th']);
    assert.equal(spread.dayEndDeltaSeconds, 0);       // day-end preserved
    const b4s = spread.moves.find((m) => m.bellId === 'b4s');
    assert.equal(b4s.to, '10:44:00');                 // 4th start +6 (clears overlap)
    assert.ok(!spread.moves.some((m) => m.bellId === 'b5s')); // 5th nets 0 -> no move
    assert.ok(!spread.moves.some((m) => m.bellId === 'b4rel'));

    // spread with nothing checked -> guidance, no moves
    assert.equal(E.planOverlapResolution(periods, '3rd', 'spread', []).moves.length, 0);
    // no overlap -> no moves
    const clean = [
        { name: 'A', bells: [{ bellId: 'a', time: '09:00:00' }, { bellId: 'a2', time: '09:50:00' }] },
        { name: 'B', bells: [{ bellId: 'b', time: '10:00:00' }, { bellId: 'b2', time: '10:50:00' }] },
    ];
    assert.deepEqual(E.planOverlapResolution(clean, 'A', 'shrink').moves, []);
});

// v6.17.1: spread now DEFAULTS to protecting passing periods — the overlap
// comes out of the CHECKED periods' own length. Unsetting protectGaps reverts
// to gap-tightening. Case: A overruns B by 10 min; absorb in C (not B).
test('planOverlapResolution spread: protectGaps shortens the checked period and preserves gaps; day-end pinned', () => {
    const P = (name, s, e) => ({ name, bells: [{ bellId: name + 'S', time: s }, { bellId: name + 'E', time: e }] });
    const periods = [
        P('A', '09:00:00', '10:10:00'), // A stretched to 10:10, overruns B (begins 10:00) by 10 min
        P('B', '10:00:00', '10:50:00'),
        P('C', '11:00:00', '11:50:00'), // gap B->C = 10 min (passing period to protect)
    ];
    // protectGaps default (true): shorten C by 10; B shifts right rigidly; gap B->C preserved; day ends 11:50
    const prot = E.planOverlapResolution(periods, 'A', 'spread', ['C']);
    assert.equal(prot.dayEndDeltaSeconds, 0);
    const bS = prot.moves.find((m) => m.bellId === 'BS');
    const bE = prot.moves.find((m) => m.bellId === 'BE');
    const cS = prot.moves.find((m) => m.bellId === 'CS');
    const cE = prot.moves.find((m) => m.bellId === 'CE');
    assert.equal(bS.to, '10:10:00'); assert.equal(bE.to, '11:00:00'); // B shifted +10, same length
    assert.equal(cS.to, '11:10:00');                                   // C start +10
    assert.ok(!cE);                                                    // C end unchanged -> C is 10 min shorter
    // gap B->C after: C.start 11:10 - B.end 11:00 = 10 min, preserved. day-end (C.end) 11:50 unchanged.

    // protectGaps=false: rigid shift, tightens the gap after C (the checked one)
    const tight = E.planOverlapResolution(periods, 'A', 'spread', ['C'], false);
    const cEt = tight.moves.find((m) => m.bellId === 'CE');
    assert.ok(cEt); // C's end DOES move in gap-tighten mode (period keeps length, shifts whole)
});

// v6.18.0: reclaim — remove a period, give its time (incl. the INCOMING
// passing period) back to the survivors, dismissal pinned.
test('applyRecipeToPeriods reclaim: last period (FLEX) — every survivor grows, day ends the same', () => {
    const periods = [
        { name: 'P1', bells: [{ bellId: 'p1s', time: '08:00:00' }, { bellId: 'p1e', time: '09:00:00' }] },
        { name: 'P2', bells: [{ bellId: 'p2s', time: '09:04:00' }, { bellId: 'p2e', time: '10:00:00' }] },
        { name: 'FLEX', bells: [{ bellId: 'fs', time: '10:04:00' }, { bellId: 'fe', time: '10:26:00' }] },
    ];
    // freed = FLEX.end(10:26) - P2.end(10:00) = 26 min (22 FLEX + 4 passing); /2 = 13 each
    const r = E.applyRecipeToPeriods(periods, { type: 'reclaim', periodName: 'FLEX' });
    assert.ok(!r.periods.some((p) => p.name === 'FLEX')); // FLEX gone
    const p1 = r.periods.find((p) => p.name === 'P1');
    const p2 = r.periods.find((p) => p.name === 'P2');
    assert.equal(p1.bells.find((b) => b.bellId === 'p1s').time, '08:00:00'); // unchanged
    assert.equal(p1.bells.find((b) => b.bellId === 'p1e').time, '09:13:00'); // +13
    assert.equal(p2.bells.find((b) => b.bellId === 'p2s').time, '09:17:00'); // +13; P1->P2 gap still 4
    assert.equal(p2.bells.find((b) => b.bellId === 'p2e').time, '10:26:00'); // == original day end (pinned)
    // input untouched
    assert.equal(periods[0].bells[1].time, '09:00:00');
});

test('applyRecipeToPeriods reclaim: middle period preserves the OUTGOING passing period', () => {
    const periods = [
        { name: 'P1', bells: [{ bellId: 'a', time: '08:00:00' }, { bellId: 'b', time: '09:00:00' }] },
        { name: 'P2', bells: [{ bellId: 'c', time: '09:04:00' }, { bellId: 'd', time: '10:00:00' }] },
        { name: 'P3', bells: [{ bellId: 'e', time: '10:04:00' }, { bellId: 'f', time: '11:00:00' }] },
    ];
    // reclaim P2: freed = P2.end(10:00) - P1.end(09:00) = 60 min; survivors P1,P3 -> +30 each
    const r = E.applyRecipeToPeriods(periods, { type: 'reclaim', periodName: 'P2' });
    assert.ok(!r.periods.some((p) => p.name === 'P2'));
    const p1 = r.periods.find((p) => p.name === 'P1');
    const p3 = r.periods.find((p) => p.name === 'P3');
    assert.equal(p1.bells.find((b) => b.bellId === 'b').time, '09:30:00'); // +30
    assert.equal(p3.bells.find((b) => b.bellId === 'e').time, '09:34:00'); // P3 start pulled early; P1->P3 gap = 4 (P2's OUTGOING gap, preserved)
    assert.equal(p3.bells.find((b) => b.bellId === 'f').time, '11:00:00'); // day end pinned
    // no-op if the named period isn't there
    assert.equal(E.applyRecipeToPeriods(periods, { type: 'reclaim', periodName: 'Nope' }).changed, 0);
});

// v6.20.2 REGRESSION: lunch waves live INSIDE 4th period at this school. Nested
// periods are legitimate and must NEVER be reported as overlaps.
test('detectPeriodOverlaps: nested periods (lunch inside 4th) are not collisions', () => {
    const P = (name, s2, e) => ({ name, bells: [{ bellId: name + 'S', time: s2 }, { bellId: name + 'E', time: e }] });
    const nested = [
        P('4th Period', '11:10:00', '12:08:00'),
        P('Lunch A', '11:36:00', '12:01:00'), // fully inside 4th
        P('Lunch B', '12:03:00', '12:07:00'), // also inside 4th
        P('5th Period', '12:12:00', '13:05:00'),
    ];
    assert.deepEqual(E.detectPeriodOverlaps(nested), []); // the reported false positive
    // moving lunch earlier (the edit that triggered the bug) is still fine
    const moved = [
        P('4th Period', '11:10:00', '12:08:00'),
        P('Lunch A', '10:40:00', '11:05:00'), // now BEFORE 4th, no overlap
        P('5th Period', '12:12:00', '13:05:00'),
    ];
    assert.deepEqual(E.detectPeriodOverlaps(moved), []);
    // a genuine PARTIAL overrun is still caught
    const real = [P('A', '09:00:00', '10:10:00'), P('B', '10:00:00', '10:50:00')];
    const r = E.detectPeriodOverlaps(real);
    assert.equal(r.length, 1);
    assert.equal(r[0].overlapSeconds, 600);
});
