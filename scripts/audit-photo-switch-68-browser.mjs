/**
 * SWITCH68 independent actual Chromium/WebKit original-photo switch (cancel
 * and accept) screenshot provenance audit. These browser actions simulate
 * user decisions but do NOT count as independent model accuracy evidence.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/photo-switch-guard-68';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined,'Incomplete native browser case cannot pass');
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,72,'Six native cases require 60 inherited + 12 accepted/declined photo switch screenshots');
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const expected=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const seen=new Set();
for(const c of report.cases){
 const key=c.engine+'/'+c.width;
 assert.ok(expected.has(key)&&!seen.has(key));seen.add(key);
 assert.equal(c.uncommittedPhotoSwitchProtected68,true);
 assert.equal(c.pieces,3);
 assert.equal(c.sourceSHA256,report.source.sha256);
 assert.equal(c.ownerPrivate,true);
 assert.equal(c.outfitSaved,true);
 assert.equal(c.stylePinnedAndSaved,true);
 assert.equal(c.v4Backup,true);assert.equal(c.v4Restore,true);
 assert.equal(c.reimportDuplicateBlocked,true);
 assert.equal(c.nearDuplicateCropKeyRejected67,false);
 assert.equal(c.detectorMessageReplay57,false);
 assert.equal(c.detectorFailureRecovery65,false);
}
assert.deepEqual([...seen].sort(),[...expected].sort());
const screenshots=new Set();
for(const shot of report.screenshots){
 assert.equal(screenshots.has(shot.file),false,'Duplicate screenshot path');
 screenshots.add(shot.file);
 const png=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(png).digest('hex'),shot.sha256);
 const meta=await sharp(png).metadata();
 assert.equal(meta.format,'png');assert.equal(meta.width,shot.width);
 assert.ok(meta.height>=920);assert.ok(png.length>4500);
 assert.ok((await sharp(png).stats()).entropy>1,'Blank screenshot');
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 for(const name of [
  '01-original-source-all',
  '02-three-reviewed-pieces-all',
  '02a-cancel-switch-preserves-three-reviewed-crops-all',
  '03b-approved-switch-clears-unsaved-keeps-private-closet-all',
  '03-owner-private-index-all',
  '04-saved-outfit-all',
  '05-logout-photo-cleared'
 ])assert.ok(screenshots.has(engine+'-'+width+'-'+name+'.png'),
  'Required actual original-photo switch+private wardrobe evidence missing '+engine+'/'+width+'/'+name);
}
console.log('SWITCH68 genuine original photograph Cancel/Accept original photo switch, owner-private wardrobe/Style V4 restored browser PASS; 72/72 screenshot SHA/dimension/entropy audits: '+
 JSON.stringify({cases:6,screenshots:72,scientificRecognitionAccuracyMeasured:false,
  physicalAndroidIphoneTested:false}));
