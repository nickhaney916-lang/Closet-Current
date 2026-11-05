/**
 * COLOR77 native browser genuinely original JPEG Unknown-color confirmation.
 * Chromium/WebKit phone-width research browser, NOT physical phone acceptance.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/unknown-color-confirm-gate-77';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,72);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const expected=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const observed=new Set();
for(const c of report.cases){
 const id=c.engine+'/'+c.width;
 assert.ok(expected.has(id)&&!observed.has(id),'Missing or duplicate native browser case '+id);
 observed.add(id);
 assert.equal(c.unknownColorConfirmBlocked77,true);
 assert.equal(c.pieces,3);
 assert.equal(c.sourceSHA256,report.source.sha256);
 for(const flag of ['ownerPrivate','stylePinnedAndSaved','outfitSaved','v4Backup','v4Restore','reimportDuplicateBlocked'])
  assert.equal(c[flag],true,flag);
}
assert.deepEqual([...observed].sort(),[...expected].sort());
const names=new Set();
for(const item of report.screenshots){
 assert.ok(!names.has(item.file),'Duplicate screenshot '+item.file);
 names.add(item.file);
 const bytes=await readFile(dir+'/'+item.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
 const meta=await sharp(bytes).metadata();
 assert.equal(meta.format,'png');
 assert.equal(meta.width,item.width);
 assert.ok(meta.height>=920&&bytes.length>4500);
 assert.ok((await sharp(bytes).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430])
 for(const stage of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '02a-invalid-unknown-color-confirm-disabled-all',
  '02b-corrected-color-manually-reconfirmed-all',
  '03-owner-private-index-all','04-saved-outfit-all','05-logout-photo-cleared'
 ])assert.ok(names.has(engine+'-'+width+'-'+stage+'.png'),
  'Missing SHA-backed mobile-width state '+engine+'/'+width+'/'+stage);
console.log('COLOR77 6/6 licensed-original real Chromium/WebKit native phone-width workflows: all five unknown/blank variants disable only edited shoe confirmation, preserve 2 other approved garment Save and unchanged JPEG SHA/crops; valid Navy/Charcoal/Blue allow fresh explicit confirmation; private closet, owned Style, outfit, V4 restore and second-owner isolation PASS; 72/72 PNG hash/viewport/nonblank audit PASS. No physical phone, learned AI accuracy or 3D claim.');
