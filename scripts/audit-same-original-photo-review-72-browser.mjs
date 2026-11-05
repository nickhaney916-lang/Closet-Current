/**
 * SOURCE72 independent six-real-browser acceptance evidence audit.
 * Browsers are mobile viewport emulations, not physical camera hardware.
 * Same original source bytes must preserve three exact human reviewed crops.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/same-original-photo-review-72';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,90);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const expected=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const seen=new Set();
for(const row of report.cases){
 const key=row.engine+'/'+row.width;
 assert.ok(expected.has(key)&&!seen.has(key),'Invalid/duplicate mobile browser case');
 seen.add(key);
 assert.equal(row.verifiedPhotoSwitch70,true);
 assert.equal(row.sameOriginalReviewPreserved72,true);
 assert.equal(row.invalidSelectionDefeatsStaleValidProof71,false);
 assert.equal(row.uncommittedPhotoSwitchProtected68,true);
 assert.equal(row.pieces,3);
 assert.equal(row.sourceSHA256,report.source.sha256);
 for(const flag of ['ownerPrivate','outfitSaved','stylePinnedAndSaved','v4Backup','v4Restore','reimportDuplicateBlocked'])
  assert.equal(row[flag],true,flag);
 assert.equal(row.detectorMessageReplay57,false);
 assert.equal(row.detectorFailureRecovery65,false);
}
assert.deepEqual([...seen].sort(),[...expected].sort());
const actual=new Set();
for(const shot of report.screenshots){
 assert.ok(!actual.has(shot.file),'Duplicate screenshot path');
 actual.add(shot.file);
 const buffer=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(buffer).digest('hex'),shot.sha256);
 const m=await sharp(buffer).metadata();
 assert.equal(m.format,'png');assert.equal(m.width,shot.width);
 assert.ok(m.height>=920&&buffer.length>4500);
 assert.ok((await sharp(buffer).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430])
 for(const stage of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '02b-invalid-false-jpeg-preserves-reviewed-original-all',
  '02c-undecodable-jpeg-envelope-preserves-reviewed-original-all',
  '02e-same-original-preserves-three-reviewed-all',
  '02a-cancel-switch-preserves-three-reviewed-crops-all',
  '03b-approved-switch-clears-unsaved-keeps-private-closet-all',
  '03-owner-private-index-all','04-saved-outfit-all','05-logout-photo-cleared'
 ])assert.ok(actual.has(engine+'-'+width+'-'+stage+'.png'),
  'Missing real browser screenshot '+engine+'/'+width+'/'+stage);
console.log('SOURCE72: 6/6 original licensed JPEG Chromium/WebKit owner-private real browser scenarios; same photo protected human review and post-save duplicate reimport; 90/90 PNG SHA/dimensions/entropy PASS. No hardware or model-accuracy claim.');
