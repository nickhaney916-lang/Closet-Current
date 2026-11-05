/**
 * BOUNDS58 authentic native mobile browser screenshot and source audit.
 * A synthetic 1000-message detector flood proves resource safeguards only.
 * It does not constitute genuine garment segmentation or accuracy evidence.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/bounded-detection-review-58';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined,'Interrupted test cannot be accepted');
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,78,'Six real mobile flows: 72 previous native frames plus six bounded-flood screenshots');
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
const sha=data=>createHash('sha256').update(data).digest('hex');
const cases=new Set();
for(const c of report.cases){
 assert.equal(c.detectorMessageReplay57,true);
 assert.equal(c.detectorFloodBound58,true);
 assert.equal(c.pieces,3);
 assert.equal(c.ownerPrivate,true);
 assert.equal(c.v4Backup,true);
 assert.equal(c.v4Restore,true);
 assert.equal(c.reimportDuplicateBlocked,true);
 assert.equal(c.outfitSaved,true);
 assert.equal(c.stylePinnedAndSaved,true);
 cases.add(c.engine+'/'+c.width);
}
assert.deepEqual([...cases].sort(),['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430'].sort());
const names=new Set();
for(const shot of report.screenshots){
 assert.equal(names.has(shot.file),false,'Screenshot file overwritten');
 names.add(shot.file);
 const png=await readFile(dir+'/'+shot.file);
 assert.equal(sha(png),shot.sha256);
 const info=await sharp(png).metadata();
 assert.equal(info.width,shot.width);
 assert.ok(info.height>=920);
 assert.ok(png.length>4000);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 assert.ok(names.has(engine+'-'+width+'-01b-flood-bounded-12-all.png'));
 assert.ok(names.has(engine+'-'+width+'-01a-detector-unreviewed-all.png'));
 assert.ok(names.has(engine+'-'+width+'-02-three-reviewed-pieces-all.png'));
}
console.log('BOUNDS58 REAL NATIVE MOBILE 1000-PROPOSAL RESOURCE CAP VERIFIED: '+
 JSON.stringify({cases:report.cases.length,screenshots:report.screenshots.length,
 sourceSHA256:report.source.sha256,realSegFormerAccuracyMeasured:false}));
