import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const engine = process.argv[2];
assert(['chromium', 'webkit'].includes(engine));
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const normal = await load(`benchmark/parallel99-normal-journey/${engine}/390/P99-NORMAL-APP.json`);
const original = await load(`benchmark/parallel94-native-p88-browser/${engine}/390/P91-LIFECYCLE.json`);
for (const receipt of [normal, original]) {
  assert.equal(receipt.engine, engine);
  assert.equal(receipt.familyAlpha, 'HOLD');
  assert.equal(receipt.releaseAuthorized, false);
}
assert.equal(normal.stage, 'final-success');
assert.deepEqual(normal.errors, []);
assert.equal(normal.explicitReviewCount, 2);
assert.equal(normal.reviewedPrivateItems, 2);
assert.equal(normal.attested2DOriginals, 2);
for (const key of ['syntheticAuth', 'normalBuilderSaved', 'v3Restore', 'ownerSwapNoDisclosure', 'threeDDenied']) {
  assert.equal(normal[key], true, key);
}
for (const key of ['uninterruptedSourceExportRestore', 'ownerRecovery', 'originalPhotoByteTamperRefused']) {
  assert.equal(original[key], true, key);
}
assert.equal(original.writeRetries, 0);
