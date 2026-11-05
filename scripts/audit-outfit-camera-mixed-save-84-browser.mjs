/**
 * CAMERA84 independent native whole-outfit camera to mixed-new private original-JPEG
 * exact/near duplicate+fresh human-consent private wardrobe acceptance.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/outfit-camera-mixed-save-84';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,78);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const expected=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const observed=new Set(),screens=new Set();
for(const c of report.cases){
 const id=c.engine+'/'+c.width;
 assert.ok(expected.has(id)&&!observed.has(id));
 observed.add(id);
 assert.equal(c.mixedPreviouslySavedAndNew80,true);
 assert.equal(c.nativeOutfitCameraToMixedSave84,true);
 assert.equal(c.sourceSHA256,report.source.sha256);
 assert.equal(c.pieces,3);
 for(const flag of ['ownerPrivate','stylePinnedAndSaved','outfitSaved','v4Backup','v4Restore','reimportDuplicateBlocked'])
  assert.equal(c[flag],true,flag);
}
assert.deepEqual([...observed].sort(),[...expected].sort());
for(const file of report.screenshots){
 assert.ok(!screens.has(file.file));screens.add(file.file);
 const bytes=await readFile(dir+'/'+file.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
 const metadata=await sharp(bytes).metadata();
 assert.equal(metadata.format,'png');assert.equal(metadata.width,file.width);
 assert.ok(metadata.height>=920&&bytes.length>4500);
 assert.ok((await sharp(bytes).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430])
 for(const stage of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '02x-native-outfit-camera-cancel-preserves-reviewed-crops-all',
  '02a-mixed-duplicate-dismiss-keeps-new-confirmed-all',
  '02b-approve-skip-saved-shirt-save-jeans-shoes-all',
  '03-owner-private-index-all','04-saved-outfit-all','05-logout-photo-cleared'
 ])assert.ok(screens.has(engine+'-'+width+'-'+stage+'.png'),
  'Missing source-backed mobile browser evidence '+engine+'/'+width+'/'+stage);
console.log('CAMERA84 6/6 native outfit camera JPEG-to-three-real-crops browser workflows: native shirt-first save followed by saved-near-duplicate shirt + 2 true new owner-confirmed jeans/shoes; one native consent dismissed preserves all reviewed original/crops/color and writes zero, accepted consent skips previously committed row byte-for-byte and atomically saves only 2 fresh, 3 total; owner private Style/outfit/duplicate barrier V4 backup restore and B isolation PASS; 78/78 camera-intake mobile Chromium/WebKit screenshots SHA/dimensions/entropy PASS. No physical device, real ML category accuracy, or 3D acceptance.');
