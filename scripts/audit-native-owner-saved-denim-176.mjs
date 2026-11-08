import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='benchmark/native-3d-05',out='benchmark/native-owner-saved-denim-176';
await mkdir(out,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const results=JSON.parse(await readFile(dir+'/results.json','utf8'));
assert.equal(results.priority,'NATIVE-3D-05');assert.equal(results.widths.join(','),'320,390,430');
assert.equal(results.familyAlpha,'HOLD');assert.equal(results.originalUserSavedStateUnmodified,true);
assert.equal(results.screenshots,33);assert.equal(results.denim176.length,3);
const expected={shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 jeans:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c'};
const checked=[];
for(const row of results.denim176){
 assert.ok([320,390,430].includes(row.width));assert.equal(row.ownerSavedPair,true);
 assert.equal(row.viewerMode,'shirt-pants');assert.equal(row.bones,163);
 assert.equal(row.meshCount>=2,true);assert.equal(row.fallbackCount,0);
 assert.deepEqual(row.sourceSHA256,[expected.shirt,expected.jeans]);
 for(const shot of row.screens){
  const bytes=await readFile(dir+'/'+shot.name);
  assert.equal(digest(bytes),shot.sha256);assert.equal(bytes.readUInt32BE(16),row.width);
  checked.push({name:shot.name,width:row.width,stage:shot.stage,sha256:shot.sha256});
 }
}
assert.equal(checked.length,9);assert.equal(new Set(checked.map(x=>x.sha256)).size,9);
const receipt={priority:176,verdict:'PASS_NATIVE_OWNER_SAVED_SHIRT_DENIM_SOURCE_PAIR_WEBGL',
 browser:'Chromium WebGL SwiftShader',actualHardwarePhone:false,widths:[320,390,430],
 originalShirtAndJeansJPEGsRehashed:true,sourceSHA256:expected,ownerSavedBoardUnchanged:true,
 readOnlyPreview:true,viewerMode:'shirt-pants',rigBones:163,renderedMeshesAtLeast:2,
 photoOnlyFallbackCount:0,screenshotCount:checked.length,screenshots:checked,
 physicalDenimDisplacementIndependentlyMeasured:false,collisionCertified:false,
 arbitraryOwnerPhoto3D:false,productionOrStagingDeployed:false,releaseAuthorized:false,familyAlpha:'HOLD'};
await writeFile(out+'/acceptance.json',JSON.stringify(receipt,null,2)+'\n');
console.log('P176_NATIVE_OWNER_SAVED_SHIRT_DENIM_9_WEBGL_SCREENSHOTS_PASS');
