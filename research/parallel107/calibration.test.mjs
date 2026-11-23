import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { evaluate, fittingHandoff, identifyOriginal } from './calibration.mjs';
import { example, licensedPath, licensedSHA256, syntheticJpeg } from './fixtures.mjs';

const photo = await syntheticJpeg();
const original = await identifyOriginal(photo);
const run = (input, image = original, lease = null, kind = 'synthetic') =>
  fittingHandoff(JSON.stringify(input), image, lease, kind);

function blocked(result, reason) {
  assert.equal(result.evidence.status, 'NOT_VERIFIED');
  assert.ok(result.evidence.reasons.includes(reason), result.evidence.reasons.join(', '));
  assert.equal(result.consumer3DAdmitted, false);
  assert.equal(result.originalPhoto2DFallbackRequired, true);
}

test('owner-measured mock produces only bounded mock ruler intervals and original hash handoff', () => {
  assert.deepEqual(original, {
    sha256: createHash('sha256').update(photo).digest('hex'), width: 400, height: 300, orientation: 1
  });
  const result = run(example(original));
  assert.equal(result.evidence.status, 'SYNTHETIC_REFERENCE_CHECK_PASSED');
  assert.ok(Math.abs(result.evidence.manualMeasurementClaimsMm[0].mm - 304.8) < 1e-10);
  assert.deepEqual(result.evidence.localReferenceIntervalsMmPerPixel, Array(2).fill({ min: 199 / 104, max: 201 / 96 }));
  assert.deepEqual(result.fitGateInput, { originalPhotoSHA256: original.sha256 });
  assert.equal(result.evidence.sides.back, 'unknown');
  assert.equal(result.consumer3DAdmitted, false);
  assert.equal(result.originalPhoto2DFallbackRequired, true);
});

test('licensed real photograph with no physical scale remains insufficient', async () => {
  const jpeg = await readFile(licensedPath);
  const real = await identifyOriginal(jpeg);
  assert.equal(real.sha256, licensedSHA256);
  const input = example(real);
  input.references = [];
  input.measurements = [];
  blocked(run(input, real, null, 'public'), 'two-measured-reference-spans-required');
  assert.equal(createHash('sha256').update(jpeg).digest('hex'), licensedSHA256);
});

const invalid = [
  ['ambiguous card', 'two-measured-reference-spans-required', input => { input.references[0].distance.provenance = 'looks-like-card'; }],
  ['conflicting rulers', 'inconsistent-reference-spans', input => { input.references[1].distance.value = 450; }],
  ['duplicate ruler', 'duplicate-reference-spans', input => { input.references[1] = { ...input.references[0], start: input.references[0].end, end: input.references[0].start }; }],
  ['off-frame ruler', 'two-measured-reference-spans-required', input => { input.references[0].start[0] = -1; }],
  ['coincident points', 'two-measured-reference-spans-required', input => { input.references[0].start = input.references[0].end; }],
  ['short span', 'two-measured-reference-spans-required', input => { input.references[0].end[0] = 52; }],
  ['oblique photo', 'review-required-overhead', input => { input.review.overhead = false; }],
  ['skew or nonplanar placement', 'review-required-coplanar', input => { input.review.coplanar = false; }],
  ['cropped garment', 'review-required-completeEdges', input => { input.review.completeEdges = false; }],
  ['multiple garments', 'review-required-singleGarment', input => { input.review.singleGarment = false; }],
  ['unsupported garment', 'unsupported-garment', input => { input.garmentType = 'shoes'; }],
  ['zero size', 'missing-invalid-or-duplicate-manual-measurements', input => { input.measurements[0].value = 0; }],
  ['negative size', 'missing-invalid-or-duplicate-manual-measurements', input => { input.measurements[0].value = -1; }],
  ['huge size', 'missing-invalid-or-duplicate-manual-measurements', input => { input.measurements[0].value = 1e20; }],
  ['unbounded uncertainty', 'missing-invalid-or-duplicate-manual-measurements', input => { input.measurements[0].uncertainty = 3; }],
  ['digest forgery', 'original-missing-or-changed', input => { input.original = { ...original, sha256: 'b'.repeat(64) }; }],
  ['dimension forgery', 'original-missing-or-changed', input => { input.original = { ...original, width: 900 }; }],
  ['synthetic landmark promotion', 'invalid-record', input => { input.evidenceClass = 'synthetic'; }],
  ['fabricated reverse', 'invalid-record', input => { input.observedOriginalReverse = true; }]
];
for (const [name, reason, change] of invalid) {
  test(name, () => {
    const input = example(original);
    change(input);
    blocked(run(input), reason);
  });
}

test('current owner, session, revision and expiry must match trusted context', () => {
  const lease = { ownerId: 'owner-a', sessionId: 'session-a', revision: 'rev-1', expiresAt: Date.now() + 60_000 };
  const input = { ...example(original), lease };
  for (const mismatch of [
    null, { ...lease, ownerId: 'owner-b' }, { ...lease, sessionId: 'session-b' },
    { ...lease, revision: 'rev-2' }, { ...lease, expiresAt: lease.expiresAt + 10 }
  ]) blocked(run(input, original, mismatch), 'owner-session-revision-lease-mismatch');
  const expired = { ...lease, expiresAt: 10 };
  blocked(run({ ...input, lease: expired }, original, expired), 'owner-session-revision-lease-mismatch');
  assert.equal(run(input, original, lease).evidence.status, 'SYNTHETIC_REFERENCE_CHECK_PASSED');
});

test('presented coordinates and owner claims cannot attest a real measurement', () => {
  const result = run(example(original), original, null, 'public');
  blocked(result, 'independent-photo-calibration-not-attested');
  assert.deepEqual(result.evidence.localReferenceIntervalsMmPerPixel, []);
});

test('missing, changed and malformed original evidence fails closed', async () => {
  blocked(run(example(original), null), 'original-missing-or-changed');
  blocked(run(example(original), await identifyOriginal(await syntheticJpeg(6))), 'original-missing-or-changed');
  assert.deepEqual(evaluate('{', original).reasons, ['invalid-json']);
  assert.deepEqual(evaluate('null', original).reasons, ['invalid-record']);
  await assert.rejects(identifyOriginal(photo.subarray(0, -2)), /complete JPEG/);
});

for (const orientation of [2, 3, 4, 5, 6, 7, 8]) {
  test(`EXIF ${orientation} preserves raw dimensions and blocks pixel calibration`, async () => {
    const image = await identifyOriginal(await syntheticJpeg(orientation));
    assert.equal(image.orientation, orientation);
    assert.equal(image.width, 400);
    assert.equal(image.height, 300);
    blocked(run(example(image), image), [2, 4, 5, 7].includes(orientation)
      ? 'mirrored-exif' : 'rotated-exif-reference-disabled');
  });
}
