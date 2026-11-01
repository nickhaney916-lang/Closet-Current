import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {easeSourcePhotographedDenimSeat73} from '../research/three-d-73/photographed-denim-rear-drape.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';

test('3D73 is opt-in only and rejects invented or unverified pants sources',()=>{
 assert.equal(easeSourcePhotographedDenimSeat73(null,null,{enabled:false}),null);
 assert.throws(()=>easeSourcePhotographedDenimSeat73(null,null),/SHA-vetted/);
 assert.throws(()=>easeSourcePhotographedDenimSeat73({meshes:[{}],stats:{photoApplied:true}},null),/SHA-vetted/);
 assert.throws(()=>easeSourcePhotographedDenimSeat73({meshes:[{isSkinnedMesh:true,geometry:{getAttribute:()=>null}}],stats:{
  independentSewnPattern:true,photoApplied:true,originalPhotographedHangingLegPanels:true,
  sourceId:'fake',sourceSHA256:'b'.repeat(64)}},{}),/SHA-vetted/);
});
test('3D73 modification is skinned 3D geometry, requires verified source fields and body contact',()=>{
 const source=readFileSync(new URL('../research/three-d-73/photographed-denim-rear-drape.mjs',import.meta.url),'utf8');
 for(const field of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(source.includes("'"+field+"'"));
 for(const proof of ['bodySurface(root)','mesh.geometry=geometry','sourceSHA256',
  'original.clone()','fullSweptCollisionCertified:false','releaseAuthorized:false'])
  assert.ok(source.includes(proof));
 assert.doesNotMatch(source,/generateFakePhoto|canvas\.toDataURL|fetch\(|XMLHttpRequest|localStorage|paidInference/);
 const controller=readFileSync(new URL('../research/three-d-15/outfit-controller.mjs',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../research/three-d-15/showroom.mjs',import.meta.url),'utf8');
 const demo=readFileSync(new URL('../research/three-d-69/index-to-real-garment-demo.mjs',import.meta.url),'utf8');
 assert.match(controller,/photoDenimRearDrape73=false/);
 assert.match(controller,/if\(photoDenimRearDrape73&&built\.pants\?\.stats\?\.independentSewnPattern\)/);
 assert.match(viewer,/photoDenimRearDrape73=false/);
 assert.match(demo,/denimDrape73'\)==='after'/);
});
