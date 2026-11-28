import assert from 'node:assert/strict';
import test from 'node:test';
import {planWearHistoryRestore, serializeWearHistory} from '../public/outfit-wear-portability.mjs';

const owner = 'synthetic-owner';
const event = (index) => ({
  id: 'event-' + index, name: 'Work', day: '2026-11-27', at: 1795737600000 - index,
  slots: {top: 'removed-garment-' + index, bottom: 'pants'}
});
const row = (events) => ({id: 'outfit-wear-history-v1', owner, events});

test('fresh restores and repeated imports retain every event, including missing garments', () => {
  for (const size of [0, 1, 25, 50, 100]) {
    const saved = row(Array.from({length: size}, (_, i) => event(i)));
    const section = serializeWearHistory(owner, saved);
    assert.deepEqual(planWearHistoryRestore(owner, section), saved);
    assert.deepEqual(planWearHistoryRestore(owner, section, saved), saved);
    assert.notEqual(section.events, saved.events);
  }
});

test('same-owner recovery retains distinct source and destination events', () => {
  const imported = serializeWearHistory(owner, row([event(0), event(2)]));
  const existing = row([event(1), event(3)]);
  assert.deepEqual(planWearHistoryRestore(owner, imported, existing),
    row([event(0), event(1), event(2), event(3)]));
});

test('rejects foreign owners, unsupported versions, conflicts, malformed and oversized ledgers', () => {
  const section = serializeWearHistory(owner, row([event(0)]));
  assert.throws(() => planWearHistoryRestore('other', section), /foreign/);
  assert.throws(() => planWearHistoryRestore(owner, {...section, version: 2}), /Unsupported/);
  assert.throws(() => planWearHistoryRestore(owner, section, row([{...event(0), name: 'Changed'}])), /Conflicting/);
  assert.throws(() => planWearHistoryRestore(owner, section, row([{...event(0), id: 'another'}])), /Conflicting/);
  assert.throws(() => serializeWearHistory(owner, row([event(0), event(0)])), /Duplicate/);
  assert.throws(() => serializeWearHistory(owner, row([{...event(0), day: '2026-02-30'}])), /Invalid/);
  assert.throws(() => serializeWearHistory(owner, row([{...event(0), slots: {wrong: 'g'}}])), /slots/);
  assert.throws(() => planWearHistoryRestore(owner, section, row(Array.from({length: 100}, (_, i) => event(i + 1)))), /100 events/);
});
