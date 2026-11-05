/**
 * CANCEL74 independently audit actual Chromium/WebKit licensed JPEG browser
 * cancel-dismiss/approve original-photo and owner-private safety evidence.
 * Mobile viewports are not actual Android/iPhone hardware.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/cancel-reviewed-capture-74';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,72);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const expected=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const seen=new Set();
for(const c of report.cases){
 const key=c.engine+'/'+c.width;
 assert.ok(expected.has(key)&&!seen.has(key),key);
 seen.add(key);
 assert.equal(c.cancellationPreservesHumanReview74,true);
 assert.equal(c.pieces,3);
 assert.equal(c.sourceSHA256,report.source.sha256);
 assert.equal(c.detectorMessageReplay57,false);
 assert.equal(c.detectorFailureRecovery65,false);
 for(const flag of ['ownerPrivate','stylePinnedAndSaved','outfitSaved','v4Backup','v4Restore','reimportDuplicateBlocked'])
  assert.equal(c[flag],true,flag);
}
assert.deepEqual([...seen].sort(),[...expected].sort());
const actual=new Set();
for(const shot of report.screenshots){
 assert.ok(!actual.has(shot.file),'Duplicate screenshot');
 actual.add(shot.file);
 const data=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(data).digest('hex'),shot.sha256);
 const meta=await sharp(data).metadata();
 assert.equal(meta.format,'png');
 assert.equal(meta.width,shot.width);
 assert.ok(meta.height>=920&&data.length>4500);
 assert.ok((await sharp(data).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430])
 for(const stage of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '02a-dismiss-cancel-keeps-three-human-reviewed-source-all',
  '03c-accept-cancel-revokes-unsaved-keeps-three-private-all',
  '03-owner-private-index-all','04-saved-outfit-all','05-logout-photo-cleared'
 ])assert.ok(actual.has(engine+'-'+width+'-'+stage+'.png'),
  'Missing true browser stage '+engine+'/'+width+'/'+stage);
console.log('CANCEL74 6/6 licensed-original native Chromium/WebKit 320/390/430: dismissed cancel protects all 3 reviewed crop bytes, original JPEG SHA, confirmed labels and Save; approved cancel revokes only unsaved source but preserves 3 owner-private committed garments, Style/outfit, V4 restore and account isolation; 72/72 PNG SHA/size/entropy PASS. Not physical-device or model-accuracy evidence.');
