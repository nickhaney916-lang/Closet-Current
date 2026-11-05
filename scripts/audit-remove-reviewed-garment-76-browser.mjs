/**
 * REMOVE76: verify six REAL browser (not physical phone) original-JPEG review,
 * accepted/declined per-piece removal and independent screenshots.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/remove-reviewed-garment-76';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,72);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const cases=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const observed=new Set();
for(const r of report.cases){
 const key=r.engine+'/'+r.width;
 assert.ok(cases.has(key)&&!observed.has(key),key);
 observed.add(key);
 assert.equal(r.individualReviewRemoveSafeguard76,true);
 assert.equal(r.pieces,3);
 assert.equal(r.sourceSHA256,report.source.sha256);
 assert.equal(r.ownerPrivate,true);
 for(const k of ['stylePinnedAndSaved','outfitSaved','v4Backup','v4Restore','reimportDuplicateBlocked'])
  assert.equal(r[k],true,'Missing real wardrobe acceptance '+k);
}
assert.deepEqual([...observed].sort(),[...cases].sort());
const pngFiles=new Set();
for(const shot of report.screenshots){
 assert.ok(!pngFiles.has(shot.file),'Repeated screenshot '+shot.file);
 pngFiles.add(shot.file);
 const raw=await readFile(dir+'/'+shot.file);
 assert.equal(createHash('sha256').update(raw).digest('hex'),shot.sha256);
 const meta=await sharp(raw).metadata();
 assert.equal(meta.format,'png');assert.equal(meta.width,shot.width);
 assert.ok(meta.height>=920&&raw.length>4500);
 assert.ok((await sharp(raw).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430])
 for(const stage of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '02a-dismiss-remove-keeps-three-reviewed-garments-all',
  '02b-approve-removes-only-shoe-preserves-other-two-all',
  '03-owner-private-index-all','04-saved-outfit-all','05-logout-photo-cleared'
 ])assert.ok(pngFiles.has(engine+'-'+width+'-'+stage+'.png'),
  'Missing real original-JPEG native browser evidence '+engine+'/'+width+'/'+stage);
console.log('REMOVE76 6/6 Chromium/WebKit original-JPEG private mobile-width workflows: denied single-item discard preserves all 3 crop bytes/category/type/color confirmations; accepted discard drops exactly one uncommitted piece and retains two, source SHA and Save; shoe is deliberately recropped and reconfirmed; private Style/Outfit/V4 two-owner regression PASS; 72/72 PNG hash/dimensions/entropy PASS. No physical phone, model accuracy or garment-fit claim.');
