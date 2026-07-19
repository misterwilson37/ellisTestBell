/**
 * Unit tests for signage/schedule-utils.js — the shared logic behind all
 * three TV signage pages. Run with the engine tests:
 *     cd build && npm test
 * Requires bell-engine.js loaded first (same contract as the browser).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('../bell-engine.js');              // sets globalThis.BellEngine
const U = require('../signage/schedule-utils.js');
const E = globalThis.BellEngine;

const todayStr = E.toLocalDateString(new Date());

function record(docData) { return U.makeScheduleRecord(docData); }

test('makeScheduleRecord: keeps the historical isEnabled filter', () => {
    const r = record({ name: 'S', periods: [
        { name: 'On', bells: [] },
        { name: 'Off', isEnabled: false, bells: [] },
    ]});
    assert.deepEqual(r.rawPeriods.map(p => p.name), ['On']);
});

test('effective periods: static bells pass through untouched with no shift', () => {
    const r = record({ name: 'S', periods: [
        { name: 'P1', bells: [{ bellId: 1, name: 'Start', time: '08:00:00' }] },
    ]});
    assert.equal(U.getEffectivePeriods(r)[0].bells[0].time, '08:00:00');
});

test("effective periods: today's shift moves static bells; yesterday's does not", () => {
    const periods = [{ name: 'P1', bells: [{ bellId: 1, name: 'Start', time: '08:00:00' }] }];
    const shifted = record({ name: 'S', periods,
        temporaryShift: { seconds: 600, date: todayStr } });
    assert.equal(U.getEffectivePeriods(shifted)[0].bells[0].time, '08:10:00');
    const expired = record({ name: 'S', periods,
        temporaryShift: { seconds: 600, date: '2020-01-01' } });
    assert.equal(U.getEffectivePeriods(expired)[0].bells[0].time, '08:00:00');
});

test('effective periods: relative bells resolve, and ripple from shifted anchors', () => {
    const r = record({ name: 'S',
        temporaryShift: { seconds: 600, date: todayStr },
        periods: [{ name: 'P1', bells: [
            { bellId: 1, name: 'Start', time: '08:00:00' },
            { bellId: 2, name: 'Warning', relative: { parentBellId: 1, offsetSeconds: -120 } },
        ]}]});
    const bells = U.getEffectivePeriods(r)[0].bells;
    assert.equal(bells.find(b => b.bellId === 1).time, '08:10:00'); // shifted anchor
    assert.equal(bells.find(b => b.bellId === 2).time, '08:08:00'); // rippled
});

test('effective periods: previously TVs showed STALE times for relative bells — now resolved', () => {
    // A relative bell whose stored .time predates an anchor move: old pages
    // displayed 09:00:00 raw; the utils must resolve 08:05:00 from the anchor.
    const r = record({ name: 'S', periods: [{ name: 'P1', bells: [
        { bellId: 1, name: 'Anchor', time: '08:00:00' },
        { bellId: 2, name: 'Rel', time: '09:00:00', relative: { parentBellId: 1, offsetSeconds: 300 } },
    ]}]});
    assert.equal(U.getEffectivePeriods(r)[0].bells.find(b => b.bellId === 2).time, '08:05:00');
});

test('effective periods: corrupt relative bells keep their engine fallback instead of vanishing', () => {
    const r = record({ name: 'S', periods: [{ name: 'P1', bells: [
        { bellId: 1, name: 'A', relative: { parentBellId: 2, offsetSeconds: 60 } },
        { bellId: 2, name: 'B', relative: { parentBellId: 1, offsetSeconds: 60 } },
    ]}]});
    const bells = U.getEffectivePeriods(r)[0].bells;
    assert.equal(bells.length, 2);
    assert.ok(bells.every(b => b.time === '00:00:01'));
});

test('memoization: same date+shift returns the cached array; shift change recomputes', () => {
    const r = record({ name: 'S', periods: [
        { name: 'P1', bells: [{ bellId: 1, name: 'Start', time: '08:00:00' }] },
    ]});
    const first = U.getEffectivePeriods(r);
    assert.equal(U.getEffectivePeriods(r), first); // identity: cache hit
    r.temporaryShift = { seconds: 300, date: todayStr };
    const second = U.getEffectivePeriods(r);
    assert.notEqual(second, first);
    assert.equal(second[0].bells[0].time, '08:05:00');
});

test('getScheduleStatus: Day Complete on an empty schedule', () => {
    const s = U.getScheduleStatus(record({ name: 'S', periods: [] }));
    assert.deepEqual(s, { period: 'Day Complete', countdown: '', active: false });
});

test('getScheduleStatus: active period detected from effective times', () => {
    // A period spanning the whole day guarantees "now" falls inside it.
    const s = U.getScheduleStatus(record({ name: 'S', periods: [
        { name: 'AllDay', bells: [
            { bellId: 1, name: 'Open', time: '00:00:01' },
            { bellId: 2, name: 'Close', time: '23:59:59' },
        ]},
    ]}));
    assert.equal(s.period, 'AllDay');
    assert.equal(s.active, true);
    assert.match(s.countdown, /^ends at /);
});

test('formatters: preserved behavior from the old page copies', () => {
    assert.equal(U.formatTime12Hour(13 * 3600 + 5 * 60), '1:05 pm');
    assert.equal(U.formatCountdown(4000), '1:06');   // >= 1h -> h:mm
    assert.equal(U.formatCountdown(125), '2:05');    // < 1h  -> m:ss
});
