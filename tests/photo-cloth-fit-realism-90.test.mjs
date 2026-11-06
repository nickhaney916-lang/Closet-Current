import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const base='research/photo-cloth-fit-realism-90/';
const manifest=JSON.parse(await readFile(base+'source-manifest.json','utf8'));
const patch=await readFile(base+'add-45-degree-knee-acceptance.patch','utf8');
const report=await readFile(base+'REPORT.md','utf8');

test('90 source manifest pins original garment JPEG and 163-bone model identities',()=>{
 assert.equal(manifest.verifiedParent,'e6c2ef87499b354bc8440bfdc9ab3a92980f92f0');
 assert.equal(manifest.pinnedRendererSource,'df6885d6011cb33fb22dceb81a08f35a0ac4dd61');
 assert.equal(manifest.garments.length,4);
 for(const row of manifest.garments){
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  assert.equal(row.photoCoverage,'front only');
 }
 assert.deepEqual(manifest.humanoids.map(x=>x.bones),[163,163]);
 assert.equal(manifest.photorealismAccepted,false);
 assert.equal(manifest.inventedRearPhoto,false);
});

test('90 acceptance overlay adds real 45-degree source-pose comparisons without weakening prior checks',()=>{
 assert.match(patch,/\[0,45,90,180\]/);
 assert.match(patch,/screenshots:64/);
 assert.match(patch,/images:64/);
 assert.doesNotMatch(patch,/humanApproved:true|humanPhotorealismApproved:true|releaseAuthorized:true/);
});

test('90 report keeps visual, hardware and production status explicit',()=>{
 for(const phrase of ['BLOCKED','NEEDS REVIEW','Human visual acceptance has not occurred',
  'do not certify continuous collision freedom','No merge or deployment'])
  assert.ok(report.includes(phrase),phrase);
});
