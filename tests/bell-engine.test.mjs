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
