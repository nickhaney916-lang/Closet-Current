import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';

const directory = 'benchmark/auth-review-session-36/browser';
const report = JSON.parse(await readFile(join(directory, 'report.json'), 'utf8'));
assert.equal(report.priority, 'AUTH-REVIEW-SESSION-36');
assert.equal(report.browserCases, 6);
assert.equal(report.cases.length, 6);
assert.equal(report.confirmedLogout204Cases, 6);
assert.equal(report.unconfirmedLogout503NoticeCases, 6);
assert.equal(report.realNativeIndexedDB, true);
assert.equal(report.realSignedBrowserToCloud, false);
assert.equal(report.segFormerActuallyRun, false);
assert.equal(report.FamilyAlpha, 'HOLD');
assert.deepEqual(report.unexpectedUploads, []);
assert.deepEqual(report.pageErrors, []);
const files = new Set();
for (const engine of ['chromium', 'webkit']) {
 for (const width of [320, 390, 430]) {
  const [caseResult, ...duplicates] = report.cases.filter(row => row.engine === engine && row.width === width);
  assert.ok(caseResult && !duplicates.length);
  assert.ok(caseResult.ownerBCannotAccessA && caseResult.staleTabLocked && caseResult.previousAccountReopens);
  assert.ok(caseResult.realNativeIndexedDB && caseResult.originalBytesVerified && caseResult.humanConfirmed);
  assert.notEqual(caseResult.sourceA, caseResult.sourceB);
  assert.equal(caseResult.screenshots.length, 4);
  for (const shot of caseResult.screenshots) {
   assert.match(shot.file, /^[a-zA-Z0-9-]+\.png$/);
   assert.ok(!files.has(shot.file));
   files.add(shot.file);
   const bytes = await readFile(join(directory, shot.file));
   const metadata = await sharp(bytes).metadata();
   assert.equal(metadata.format, 'png');
   assert.equal(metadata.width, width);
   assert.equal(metadata.height, shot.height);
   assert.equal(bytes.length, shot.bytes);
   assert.equal(createHash('sha256').update(bytes).digest('hex'), shot.sha256);
   assert.ok((await sharp(bytes).stats()).channels.some(channel => channel.stdev > 6));
  }
 }
}
assert.equal(files.size, 24);
console.log('AUTH36 cumulative runtime: 6 native owner/session cases and 24 independently audited screenshots.');
