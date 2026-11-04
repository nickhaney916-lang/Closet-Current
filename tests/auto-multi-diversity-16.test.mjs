import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {boxIoU, scorePhoto, summarizePhotos, verifySource} from '../research/auto-multi-diversity-16/score.mjs';

const region = (x, family = 'upper') => ({family, box: {x, y: 0, width: 0.3, height: 0.5}});

test('same-class matching reassigns proposals instead of losing a match to input order', () => {
  const expected = [region(0.1), region(0)];
  const score = scorePhoto(expected, {status: 'completed', proposals: [region(0.08), region(0.18)]});
  assert.equal(score.matches.length, 2);
  assert.deepEqual(score.missed, []);
  assert.deepEqual(score.unmatched, []);
});

test('class mismatch, duplicate and unrelated proposals remain false positives', () => {
  const target = region(0);
  const score = scorePhoto([target], {
    status: 'completed', proposals: [target, target, region(0, 'bottom'), region(0.6)],
  });
  assert.deepEqual(score.unmatched.map(({reason}) => reason),
    ['duplicate', 'class-mismatch', 'unmatched-region']);
  assert.equal(summarizePhotos([score]).precision, 0.25);
  assert.equal(summarizePhotos([score]).recall, 1);
  assert.equal(summarizePhotos([score]).maskIoU, null);
});

test('failed inference counts missed garments and discards partial proposals', () => {
  const target = region(0);
  const score = scorePhoto([target], {status: 'failed', proposals: [target]});
  assert.equal(score.discardedPartialProposals, 1);
  assert.deepEqual(summarizePhotos([score]), {
    photos: 1, failedPhotos: 1, expected: 1, proposed: 0, truePositives: 0,
    falsePositives: 0, falseNegatives: 1, precision: null, recall: 0, maskIoU: null,
  });
  assert.throws(() => scorePhoto([target], {proposals: []}), /Missing inference status/);
  assert.throws(() => boxIoU(region(-0.1).box, target.box), /Invalid normalized/);
});

test('source gate rejects changed bytes, resized data and non-JPEG metadata', () => {
  const bytes = Buffer.from('test fixture');
  const row = {id: 'fixture', bytes: bytes.length, width: 20, height: 10,
    sha256: createHash('sha256').update(bytes).digest('hex')};
  const metadata = {format: 'jpeg', width: 20, height: 10};
  verifySource(row, bytes, metadata);
  assert.throws(() => verifySource(row, Buffer.from('best fixture'), metadata), /identity mismatch/);
  assert.throws(() => verifySource(row, bytes, {...metadata, width: 19}), /identity mismatch/);
  assert.throws(() => verifySource(row, bytes, {...metadata, format: 'png'}), /identity mismatch/);
});
