import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { documentFor, feeds } from '../scripts/maintenance/test-data.mjs';
import { activeTrends, health, openStore, rollback, tick } from '../scripts/maintenance/store.mjs';
import { digest, week } from '../scripts/maintenance/trends.mjs';
import { validateRecognitionCandidate } from '../scripts/maintenance/recognition-contract.mjs';

function database(t) {
  const dir = mkdtempSync(join(tmpdir(), 'closet-trends-'));
  const path = join(dir, 'trends.sqlite');
  const db = openStore(path);
  t.after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });
  return { db, path };
}

const now = Date.now() - 3 * week;
const source = clock => ({ clock: () => clock, load: feed => documentFor(feed, clock), pause: async () => {} });

test('weekly activation is idempotent, versioned and reversible', async t => {
  const { db } = database(t);
  const first = await tick(db, feeds, source(now));
  assert.equal(first.result, 'activated');
  assert.deepEqual(await tick(db, feeds, source(now)), { result: 'not-due' });
  const second = await tick(db, feeds, source(now + week));
  assert.equal(second.result, 'activated');
  assert.notEqual(first.version, second.version);
  assert.equal(health(db, now + week).status, 'healthy');
  assert.equal((await rollback(db, now + week)).version, first.version);
  assert.equal(activeTrends(db).version, first.version);
  assert.equal((await tick(db, feeds, source(now + week))).result, 'not-due');
});

test('independent connection excludes concurrent tick while readers see last committed version', async t => {
  const { db, path } = database(t);
  const first = await tick(db, feeds, source(now));
  const peer = openStore(path);
  t.after(() => peer.close());
  const { promise, resolve } = Promise.withResolvers();
  const pending = tick(db, feeds, { ...source(now + week), load: async feed => {
    await promise;
    return documentFor(feed, now + week);
  } });
  assert.equal(activeTrends(peer).version, first.version);
  assert.deepEqual(await tick(peer, feeds, source(now + week)), { result: 'busy' });
  resolve();
  assert.equal((await pending).result, 'activated');
});

test('bounded acquisition retries back off and keep current version on source failure', async t => {
  const { db } = database(t);
  const first = await tick(db, feeds, source(now));
  const pauses = [];
  let attempts = 0;
  const failed = await tick(db, feeds, {
    clock: () => now + week,
    load: async () => { attempts++; throw Error('sensitive diagnostics'); },
    pause: async ms => { pauses.push(ms); }
  });
  assert.equal(failed.result, 'source-unavailable');
  assert.equal(attempts, 6);
  assert.deepEqual(pauses, [500, 1000]);
  assert.equal(health(db, now + week).status, 'degraded');
  assert.doesNotMatch(JSON.stringify(health(db)), /sensitive/);
  assert.equal(activeTrends(db).version, first.version);
  assert.equal((await tick(db, feeds, source(now + week + 3600000))).result, 'activated');
});

test('wrong licensing, incompatible taxonomy, stale date and related publishers fail closed', async t => {
  for (const mutation of [
    docs => { docs[0].license = 'unknown'; },
    docs => { docs[0].articles[0].directions[0].type = 'Jeans'; },
    docs => { docs[0].articles[0].published_at = new Date(now - 9 * week).toISOString(); },
    docs => { docs[0].articles[0].url = 'https://other.example/article'; },
    docs => { docs[0].articles[0].directions[1] = docs[0].articles[0].directions[0]; }
  ]) {
    const { db } = database(t);
    const docs = feeds.map(feed => documentFor(feed, now));
    mutation(docs);
    assert.equal((await tick(db, feeds, { ...source(now), load: feed => docs[feeds.indexOf(feed)] })).result, 'candidate-rejected');
    assert.equal(activeTrends(db), null);
  }
  const { db } = database(t);
  const related = [feeds[0], { ...feeds[1], publisherGroup: feeds[0].publisherGroup }];
  assert.equal((await tick(db, related, source(now))).result, 'policy-rejected');
});

test('stale acquisition cannot activate and corruption falls back to last known good', async t => {
  const { db } = database(t);
  const first = await tick(db, feeds, source(now));
  let calls = 0;
  const expired = await tick(db, feeds, { ...source(now + week), clock: () => now + week + 61000 * calls++ });
  assert.equal(expired.result, 'expired-run');
  const next = await tick(db, feeds, source(now + week + 3600000));
  db.prepare('UPDATE versions SET payload = ? WHERE id = ?').run('{}', next.version);
  assert.equal(activeTrends(db).version, first.version);
  assert.equal(health(db, now + week).status, 'degraded');
  assert.equal((await rollback(db, now + week)).version, first.version);
});

test('an interrupted process cannot publish its staged candidate', async t => {
  const { db, path } = database(t);
  const first = await tick(db, feeds, source(now));
  const entry = `
    import { tick, openStore } from './scripts/maintenance/store.mjs';
    import { feeds, documentFor } from './scripts/maintenance/test-data.mjs';
    const now = ${now + week};
    await tick(openStore(process.argv[1]), feeds, {
      clock: () => now, load: feed => documentFor(feed, now), beforeActivation: () => process.exit(42)
    });
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', entry, path]);
  const [code] = await once(child, 'exit');
  assert.equal(code, 42);
  assert.equal(activeTrends(db).version, first.version);
  assert.equal(db.prepare('SELECT COUNT(*) as count FROM versions').get().count, 1);
  assert.equal((await tick(db, feeds, source(now + week))).result, 'activated');
});

test('loopback CLI exposes the active catalog, and only the active catalog', async t => {
  const { db, path } = database(t);
  const child = spawn(process.execPath, ['scripts/maintenance/job.mjs', 'serve', path, '0']);
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  const [line] = await once(child.stdout, 'data');
  const origin = 'http://127.0.0.1:' + JSON.parse(line).port;
  assert.equal((await fetch(origin + '/maintenance/trends')).status, 404);
  const { version } = await tick(db, feeds, source(now));
  const response = await fetch(origin + '/maintenance/trends');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { version, data: activeTrends(db).data });
  assert.equal((await fetch(origin + '/maintenance/trends', { method: 'POST' })).status, 404);
  assert.equal((await fetch(origin + '/status')).status, 404);
});

test('recognition release gate binds artifact, fixture, browser evidence and major approval', () => {
  const artifact = Buffer.from('synthetic rules');
  const fixtureSha = digest('fixture');
  const expected = { category: 'Tops', type: 'T-shirt', color: 'Black' };
  const benchmark = { schema_version: 1, cases: [{ id: '01', origin: 'synthetic', original_sha256: fixtureSha, expected }] };
  const manifest = {
    schema_version: 1, kind: 'rules', version: '2.0.0', change: 'major',
    sha256: digest(artifact), benchmark_sha256: digest(JSON.stringify(benchmark))
  };
  const receipt = (hash) => ({
    artifact_sha256: hash, benchmark_sha256: manifest.benchmark_sha256, initialized: true,
    results: { '01': { ...expected, original_sha256: fixtureSha, requires_owner_confirmation: true, saved_without_confirmation: false } }
  });
  const input = {
    manifest, artifact, benchmark, baselineRelease: { version: '1.0.0', sha256: digest('old') },
    baseline: { chromium: receipt(digest('old')), webkit: receipt(digest('old')) },
    candidate: { chromium: receipt(manifest.sha256), webkit: receipt(manifest.sha256) }
  };
  assert.throws(() => validateRecognitionCandidate(input), /manifest/);
  assert.throws(() => validateRecognitionCandidate({ ...input, manifest: { ...manifest, change: 'compatible' } }), /approval/);
  input.approvedMajorDigest = manifest.sha256;
  assert.equal(validateRecognitionCandidate(input).validated, true);
  input.candidate.webkit.results['01'].type = 'Sweater';
  assert.throws(() => validateRecognitionCandidate(input), /regression/);
  input.candidate.webkit.results['01'].type = expected.type;
  input.candidate.webkit.results['01'].saved_without_confirmation = true;
  assert.throws(() => validateRecognitionCandidate(input), /regression/);
  assert.throws(() => validateRecognitionCandidate({ ...input, artifact: Buffer.from('different') }), /manifest/);
});
