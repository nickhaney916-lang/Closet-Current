import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adaptPublisherFeed, validatePublisherBatch } from '../scripts/maintenance/publisher-feed.mjs';
import { feeds, publisherExport } from '../scripts/maintenance/publisher-fixtures.mjs';
import { activeTrends, openStore, rollback, tick } from '../scripts/maintenance/store.mjs';
import { week } from '../scripts/maintenance/trends.mjs';

const now = Date.now() - 2 * week;
const bodies = () => feeds.map(feed => JSON.stringify(publisherExport(feed, now)));
const check = (change, pattern) => {
  const input = bodies();
  const document = JSON.parse(input[0]);
  change(document);
  input[0] = JSON.stringify(document);
  assert.throws(() => validatePublisherBatch(feeds, input, now), pattern);
};

test('publisher exports retain attribution and map to exact wardrobe slot/type pairs', () => {
  const candidate = validatePublisherBatch(feeds, bodies(), now);
  assert.deepEqual(candidate.sources.map(({ publication, license }) => [publication, license]),
    feeds.map(({ publication, license }) => [publication, license]));
  assert.deepEqual(candidate.directions.map(({ slot, type }) => [slot, type]),
    [['top', 'T-shirt'], ['bottom', 'Jeans'], ['shoes', 'Sneakers']]);
  assert.deepEqual(validatePublisherBatch(feeds, bodies(), now), candidate);
});

test('malformed, oversized, incomplete, unattributed, stale and duplicate exports fail closed', () => {
  assert.throws(() => adaptPublisherFeed(feeds[0], '{'), SyntaxError);
  assert.throws(() => adaptPublisherFeed(feeds[0], ' '.repeat(128 * 1024 + 1)), /body/);
  assert.throws(() => validatePublisherBatch(feeds, bodies().slice(0, 1), now), /incomplete/);
  check(data => { data.format = 'fashion-directions/v2'; }, /envelope/);
  check(data => { data.rights.credit = ''; }, /envelope/);
  check(data => { data.rights.license = 'unknown'; }, /envelope/);
  check(data => { data.entries[0].looks[0].category = 'unknown'; }, /category/);
  check(data => { data.entries[0].canonical_url = 'https://other.example/article'; }, /article/);
  check(data => { data.entries[0].published = new Date(now - 9 * week).toISOString(); }, /article/);
  check(data => { data.entries.push(data.entries[0]); }, /article/);
  check(data => { data.entries[0].looks.push(data.entries[0].looks[0]); }, /duplicate/);
});

test('rate limits, outage and invalid batches preserve the last good catalog before recovery and rollback', async () => {
  const db = openStore(':memory:');
  const load = (feed, time) => adaptPublisherFeed(feed, JSON.stringify(publisherExport(feed, time)));
  const run = (time, provider = feed => load(feed, time), pause = () => {}) =>
    tick(db, feeds, { clock: () => time, load: provider, pause });
  try {
    assert.equal((await run(now)).result, 'activated');
    const first = activeTrends(db);
    assert.equal((await run(now)).result, 'not-due');
    const waits = [];
    const hour = 3600000;
    let attempts = 0;
    assert.equal((await run(now + week, feed => {
      if (feed === feeds[1]) {
        throw Error(++attempts === 1 ? '429' : '503');
      }
      return load(feed, now + week);
    }, ms => waits.push(ms))).result, 'source-unavailable');
    assert.deepEqual(waits, [500, 1000]);
    assert.deepEqual(activeTrends(db), first);
    assert.equal((await run(now + week + hour, feed => ({
      ...load(feed, now + week + hour), articles: []
    }))).result, 'candidate-rejected');
    assert.deepEqual(activeTrends(db), first);
    const recovered = await run(now + week + 2 * hour);
    assert.equal(recovered.result, 'activated');
    assert.notEqual(recovered.version, first.version);
    assert.equal((await rollback(db, now + week + 2 * hour)).version, first.version);
    assert.deepEqual(activeTrends(db), first);
  } finally {
    db.close();
  }
});
