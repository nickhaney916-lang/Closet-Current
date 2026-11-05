/**
 * LABELSYNC66 exact 6 native Chromium/WebKit 320/390/430 original JPEG
 * human-corrected private wardrobe: title/search/V4 restore screenshot audit.
 * Synthetic typed correction in browser UI is a software test, not an
 * independent human model recognition benchmark.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/corrected-name-index-66';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined,'A failed/incomplete native flow cannot be accepted');
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,72,
 'Six mobile cases require 60 original native flow frames plus 12 before/after correction frames');
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const expected=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']),seen=new Set();
for(const row of report.cases){
 const key=row.engine+'/'+row.width;
 assert.ok(expected.has(key));assert.equal(seen.has(key),false);seen.add(key);
 assert.equal(row.correctedAutoNameAndIndex66,true);
 assert.equal(row.pieces,3);
 assert.equal(row.sourceSHA256,report.source.sha256);
 assert.equal(row.ownerPrivate,true);
 assert.equal(row.outfitSaved,true);assert.equal(row.stylePinnedAndSaved,true);
 assert.equal(row.v4Backup,true);assert.equal(row.v4Restore,true);
 assert.equal(row.reimportDuplicateBlocked,true);
 assert.equal(row.detectorMessageReplay57,false);
 assert.equal(row.detectorFailureRecovery65,false);
}
assert.deepEqual([...seen].sort(),[...expected].sort());
const names=new Set();
for(const shot of report.screenshots){
 assert.equal(names.has(shot.file),false,'Screenshot must not overwrite another screenshot');
 names.add(shot.file);
 const bytes=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),shot.sha256);
 const meta=await sharp(bytes).metadata();
 assert.equal(meta.format,'png');assert.equal(meta.width,shot.width);
 assert.ok(meta.height>=920,'Too short to visually inspect native mobile UI');
 assert.ok(bytes.length>4000);
 const stats=await sharp(bytes).stats();
 assert.ok(stats.entropy>1,'Captured screenshot looks blank');
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 for(const name of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '03-owner-private-index-all','04-saved-outfit-all',
  '05a-before-correction-old-blue-shoes-all',
  '05b-after-correction-new-black-boots-all',
  '05-logout-photo-cleared'
 ])assert.ok(names.has(engine+'-'+width+'-'+name+'.png'),
  'Missing source-to-corrected-title native browser evidence '+engine+'/'+width+'/'+name);
}
console.log('LABELSYNC66 6/6 REAL NATIVE ORIGINAL-PHOTO HUMAN CORRECTION -> PRIVATE CLOSET SEARCH -> V4 RESTORE, 72/72 SHA-VERIFIED MOBILE SCREENSHOTS. Model accuracy not measured: '+
 JSON.stringify({screenshots:report.screenshots.length,
 sourceSHA256:report.source.sha256,qaTypingIsNotHumanBenchmark:true}));
