/**
 * NEARDUP67: independently audit six native Chromium/WebKit mobile-width
 * manual 1–3px shifted re-crop duplicate rejection workflows. These are
 * genuinely executed photo/editor/private IndexedDB cases, NOT true model
 * recognition accuracy or physical-phone tests.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/source-near-duplicate-67';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,66);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const expected=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']),seen=new Set();
for(const row of report.cases){
 const key=row.engine+'/'+row.width;
 assert.ok(expected.has(key)&&!seen.has(key));
 seen.add(key);
 assert.equal(row.nearDuplicateCropKeyRejected67,true);
 assert.equal(row.detectorMessageReplay57,false);
 assert.equal(row.detectorFailureRecovery65,false);
 assert.equal(row.correctedAutoNameAndIndex66,false);
 assert.equal(row.pieces,3);
 assert.equal(row.sourceSHA256,report.source.sha256);
 assert.equal(row.ownerPrivate,true);
 assert.equal(row.outfitSaved,true);
 assert.equal(row.stylePinnedAndSaved,true);
 assert.equal(row.v4Backup,true);assert.equal(row.v4Restore,true);
 assert.equal(row.reimportDuplicateBlocked,true);
}
assert.deepEqual([...seen].sort(),[...expected].sort());
const actual=new Set();
for(const shot of report.screenshots){
 assert.ok(!actual.has(shot.file),'Duplicate screenshot filename');
 actual.add(shot.file);
 const png=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(png).digest('hex'),shot.sha256);
 const md=await sharp(png).metadata();
 assert.equal(md.format,'png');assert.equal(md.width,shot.width);
 assert.ok(md.height>=920);assert.ok(png.length>4000);
 assert.ok((await sharp(png).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 for(const name of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '03b-manual-same-shirt-shifted-crop-all',
  '03-owner-private-index-all','04-saved-outfit-all',
  '05-logout-photo-cleared'
 ])assert.ok(actual.has(engine+'-'+width+'-'+name+'.png'),
  'Required genuine source/manually re-cropped duplicate evidence missing: '+engine+'/'+width+'/'+name);
}
console.log('NEARDUP67 6/6 real owner-private original JPEG shifted manual crop key duplicate rejection + outfit V4 recovery browser PASS; 66/66 screenshot SHA/dimension/nonblank audits: '+
 JSON.stringify({sourceSHA256:report.source.sha256,screenshots:66,
  learnedSegmentationAccuracyEvidence:false,physicalPhoneAcceptance:false}));
