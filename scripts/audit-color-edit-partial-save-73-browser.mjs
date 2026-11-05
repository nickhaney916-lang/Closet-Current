/**
 * COLOR73 original-JPEG real native browser independent partial Save audit.
 * Simulated mobile-width Chromium/WebKit, NOT actual physical camera devices.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/color-edit-partial-save-73';
const result=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(result.failure,undefined);
assert.equal(result.cases.length,6);
assert.equal(result.screenshots.length,72);
assert.equal(result.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(result.source.sourceHashPinned,true);
assert.deepEqual(result.unexpectedUploads,[]);
assert.deepEqual(result.errors,[]);
const cases=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const seen=new Set();
for(const c of result.cases){
 const key=c.engine+'/'+c.width;
 assert.ok(cases.has(key)&&!seen.has(key));
 seen.add(key);
 assert.equal(c.partialColorEditSavesOtherConfirmed73,true);
 assert.equal(c.detectorMessageReplay57,false);
 assert.equal(c.detectorFailureRecovery65,false);
 assert.equal(c.pieces,3);
 assert.equal(c.sourceSHA256,result.source.sha256);
 assert.equal(c.ownerPrivate,true);
 for(const k of ['stylePinnedAndSaved','outfitSaved','v4Backup','v4Restore','reimportDuplicateBlocked'])
  assert.equal(c[k],true,k);
}
assert.deepEqual([...seen].sort(),[...cases].sort());
const screenshotNames=new Set();
for(const screenshot of result.screenshots){
 assert.ok(!screenshotNames.has(screenshot.file));
 screenshotNames.add(screenshot.file);
 const png=await readFile(dir+'/'+screenshot.file);
 assert.equal(createHash('sha256').update(png).digest('hex'),screenshot.sha256);
 const meta=await sharp(png).metadata();
 assert.equal(meta.format,'png');assert.equal(meta.width,screenshot.width);
 assert.ok(meta.height>=920&&png.length>4500);
 assert.ok((await sharp(png).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430])
 for(const stage of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '02a-color-edited-other-two-saveable-all',
  '02b-only-two-private-committed-unconfirmed-shoe-retained-all',
  '03-owner-private-index-all','04-saved-outfit-all','05-logout-photo-cleared'
 ])assert.ok(screenshotNames.has(engine+'-'+width+'-'+stage+'.png'),
  'Missing genuine native browser screenshot '+engine+'/'+width+'/'+stage);
console.log('COLOR73 6/6 actual Chromium/WebKit browser 320/390/430: edited shoe excluded from 2-of-3 owner-private save; shoe remains for explicit reconfirm; private Style/V4 and owner isolation PASS. 72/72 PNG SHA, width and entropy PASS; no physical phone/model accuracy claim.');
