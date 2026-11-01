import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hangOriginalPhotographedDenimCalf74} from '../research/three-d-74/source-photographed-denim-calf-hang.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';

test('3D74 explicitly OFF by default, no unverified photographs or neutral mannequin pants',()=>{
 assert.equal(hangOriginalPhotographedDenimCalf74(null,null,{enabled:false}),null);
 assert.throws(()=>hangOriginalPhotographedDenimCalf74({},{}),/exact SHA-vetted/);
 assert.throws(()=>hangOriginalPhotographedDenimCalf74({meshes:[{isSkinnedMesh:true}],stats:{
  photoApplied:true,independentSewnPattern:true,sourcePhotographedDenimRearDrape73:true,
  sourceId:'fabricated',sourceSHA256:'a'.repeat(64)}},{}),/exact SHA-vetted/);
 assert.throws(()=>createOutfitController({},{
  photoDenimCalfHang74:true,photoDenimRearDrape73:false
 }),/3D74 requires exact/);
});
test('3D74 changes real original photographed skinned cloth vertices only',()=>{
 const source=readFileSync(new URL('../research/three-d-74/source-photographed-denim-calf-hang.mjs',import.meta.url),'utf8');
 for(const field of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(source.includes("'"+field+"'"),field);
 for(const proof of ['bodySurface(body)','old.clone()','mesh.geometry=geometry','sourceSHA256',
  'denimCalfOriginalUVRestFrontSkinUnchanged:true','denimCalfNoFakePhotographicBack:true',
  'physicalAndroidIphoneTested:false','releaseAuthorized:false'])
  assert.ok(source.includes(proof),proof);
 assert.doesNotMatch(source,/createElement|toDataURL|generateFakePhoto|XMLHttpRequest|fetch\(|localStorage|paidInference/);
 const controller=readFileSync(new URL('../research/three-d-15/outfit-controller.mjs',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../research/three-d-15/showroom.mjs',import.meta.url),'utf8');
 const demo=readFileSync(new URL('../research/three-d-69/index-to-real-garment-demo.mjs',import.meta.url),'utf8');
 assert.match(controller,/photoDenimCalfHang74=false/);
 assert.match(controller,/if\(photoDenimCalfHang74&&built\.pants\?\.stats\?\.sourcePhotographedDenimRearDrape73\)/);
 assert.match(viewer,/photoDenimCalfHang74=false/);
 assert.match(demo,/get\('calf74'\)==='after'/);
});
