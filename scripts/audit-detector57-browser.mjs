/**
 * DETECTOR57 archived genuine browser screenshot / source audit.
 * The detector worker response is deliberately synthetic and has ZERO
 * scientific value as model-accuracy evidence; the photos and app flow are real.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const base='benchmark/detector-proposal-native-57';
const a=JSON.parse(await readFile(base+'/acceptance.json','utf8'));
assert.equal(a.failure,undefined,'No failed case may look like complete acceptance');
assert.equal(a.cases.length,6);
assert.equal(a.screenshots.length,72,'Six mobile browser cases with two new unreviewed proposal screenshots each');
assert.deepEqual(a.unexpectedUploads,[],'Original customer photos are never uploaded');
assert.deepEqual(a.errors,[],'No uncaught page errors');
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const source='e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff';
assert.equal(a.source.sha256,source);
assert.equal(a.source.sourceHashPinned,true);
const keys=new Set(),paths=new Set();
for(const c of a.cases){
 assert.equal(c.detectorMessageReplay57,true);
 assert.equal(c.ownerPrivate,true);
 assert.equal(c.v4Backup,true);
 assert.equal(c.v4Restore,true);
 assert.equal(c.reimportDuplicateBlocked,true);
 assert.equal(c.outfitSaved,true);
 assert.equal(c.stylePinnedAndSaved,true);
 assert.equal(c.sourceSHA256,source);
 keys.add(c.engine+'/'+c.width);
}
assert.deepEqual([...keys].sort(),['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430'].sort());
for(const screenshot of a.screenshots){
 const raw=await readFile(base+'/'+screenshot.file);
 assert.equal(sha(raw),screenshot.sha256);
 const info=await sharp(raw).metadata();
 assert.equal(info.width,screenshot.width);
 assert.ok(info.height>=920||!screenshot.fullPage);
 assert.ok(raw.length>4000);
 paths.add(screenshot.file);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 assert.ok(paths.has(engine+'-'+width+'-01a-detector-unreviewed-all.png'));
 assert.ok(paths.has(engine+'-'+width+'-01a-detector-unreviewed.png'));
}
console.log('DETECTOR57 REAL NATIVE BROWSER + SYNTHETIC WORKER-MESSAGE GATE EVIDENCE VERIFIED: '+JSON.stringify({cases:a.cases.length,screenshots:a.screenshots.length,sourceSHA256:source,modelAccuracyClaim:false}));
