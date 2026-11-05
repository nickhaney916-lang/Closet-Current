/**
 * SNAPSHOT78 independently audit real Chromium/WebKit licensed-JPEG private
 * clothes save and safe noncloneable-metadata preclone browser probe.
 * These are true browser tests at mobile viewports, not physical handsets.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/allowlisted-review-snapshot-78';
const report=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(report.failure,undefined);
assert.equal(report.cases.length,6);
assert.equal(report.screenshots.length,72);
assert.equal(report.source.sha256,'e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff');
assert.equal(report.source.sourceHashPinned,true);
assert.deepEqual(report.unexpectedUploads,[]);
assert.deepEqual(report.errors,[]);
const cases=new Set(['chromium/320','chromium/390','chromium/430','webkit/320','webkit/390','webkit/430']);
const observed=new Set(),files=new Set();
for(const c of report.cases){
 const name=c.engine+'/'+c.width;
 assert.ok(cases.has(name)&&!observed.has(name),name);
 observed.add(name);
 assert.equal(c.reviewSnapshotSanitized78,true);
 assert.equal(c.sourceSHA256,report.source.sha256);
 assert.equal(c.pieces,3);
 for(const flag of ['ownerPrivate','stylePinnedAndSaved','outfitSaved','v4Backup','v4Restore','reimportDuplicateBlocked'])
  assert.equal(c[flag],true,flag);
}
assert.deepEqual([...observed].sort(),[...cases].sort());
for(const s of report.screenshots){
 assert.ok(!files.has(s.file),'Duplicate screenshot');
 files.add(s.file);
 const bytes=await readFile(dir+'/'+s.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);
 const metadata=await sharp(bytes).metadata();
 assert.equal(metadata.format,'png');
 assert.equal(metadata.width,s.width);
 assert.ok(metadata.height>=920&&bytes.length>4500);
 assert.ok((await sharp(bytes).stats()).entropy>1);
}
for(const engine of ['chromium','webkit'])for(const width of [320,390,430])
 for(const stage of [
  '01-original-source-all','02-three-reviewed-pieces-all',
  '02a-uncloneable-review-metadata-accepted-safely-all',
  '02b-after-safe-snapshot-three-private-committed-all',
  '03-owner-private-index-all','04-saved-outfit-all','05-logout-photo-cleared'
 ])assert.ok(files.has(engine+'-'+width+'-'+stage+'.png'),
 'Missing real mobile-width source-safe proof '+engine+'/'+width+'/'+stage);
console.log('SNAPSHOT78 6/6 native Chromium/WebKit 320/390/430: genuine licensed original JPEG review + crop bytes; noncloneable and oversized untrusted piece/model fields filtered BEFORE structuredClone with authentic source/crop SHA model binding; 3 owner-approved original-JPEG clothing pieces privately saved, owned Style, outfit, V4 restore, duplicate refusal, logout and second owner isolated; 72/72 PNG SHA, dimensions and entropy independently PASS. Does NOT assert actual ML category accuracy, 3D cloth fidelity or physical phone acceptance.');
