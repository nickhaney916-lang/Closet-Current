import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relaxOriginalPhotoDenimFoldContinuity76,relaxMeshFoldHeights76}
 from '../research/three-d-76/source-photo-denim-seam-fold-relaxation.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';

test('3D76 graph fold relaxation is local, bounded and protects original-photo pinned nodes',()=>{
 const z=[0,.04,-.04,.02,0],neighbor=[[1,2],[0,2,3],[0,1,4],[1,4],[2,3]],eligible=[false,true,true,true,true];
 const out=relaxMeshFoldHeights76(z,neighbor,eligible,{strength:.38});
 assert.deepEqual(out.slice(0,1),[0]);
 assert.ok(Math.abs(out[1])<Math.abs(z[1]));
 assert.ok(Math.abs(out[2])<Math.abs(z[2]));
 assert.equal(relaxMeshFoldHeights76(z,neighbor,eligible,{strength:0})[1],z[1]);
 assert.throws(()=>relaxMeshFoldHeights76(z,neighbor,eligible,{strength:1}),/finite original denim mesh graph/);
 assert.throws(()=>relaxMeshFoldHeights76(z,[[],[100,2],[],[],[]],eligible),/broken original triangle edge|finite/);
});
test('3D76 OFF by default and never accepts neutral/trustless trousers',()=>{
 assert.equal(relaxOriginalPhotoDenimFoldContinuity76(null,null,{enabled:false}),null);
 assert.throws(()=>relaxOriginalPhotoDenimFoldContinuity76({},{}),/true SHA-verified/);
 assert.throws(()=>relaxOriginalPhotoDenimFoldContinuity76({meshes:[{isSkinnedMesh:true}],stats:{
  sourcePhotoDenimStructuralFolds75:true,sourcePhotographedDenimCalfHang74:true,
  sourcePhotographedDenimRearDrape73:true,independentSewnPattern:true,
  photoApplied:true,sourceId:'fake-001',sourceSHA256:'a'.repeat(64)}},{}),/true SHA-verified/);
 assert.throws(()=>createOutfitController({},{
  photoDenimContinuity76:true,photoDenimFolds75:false,photoDenimCalfHang74:true,
  photoDenimRearDrape73:true
 }),/3D76 requires exact 3D75/);
});
test('3D76 real original 3D sewn garment has immutable photo UV/rest/front/skin and no release',()=>{
 const m=readFileSync(new URL('../research/three-d-76/source-photo-denim-seam-fold-relaxation.mjs',import.meta.url),'utf8');
 for(const name of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(m.includes("'"+name+"'"),name);
 for(const proof of ['bodySurface(body)','old.clone()','mesh.geometry=geometry',
  'sourcePhotoDenimSeamContinuity76:true','originalPhotoJPEGAndRGBAlphaUnmodified:true',
  'originalPhotoUVRestFrontSkinByteIdentical:true','unphotographedRearStillSourceNeutral:true',
  'physicalPhonesVerified:false','releaseAuthorized:false'])
  assert.ok(m.includes(proof),proof);
 assert.doesNotMatch(m,/fetch\(|toDataURL|createElement|generateFakeBack|localStorage|WebSocket/);
 const ctl=readFileSync(new URL('../research/three-d-15/outfit-controller.mjs',import.meta.url),'utf8');
 const view=readFileSync(new URL('../research/three-d-15/showroom.mjs',import.meta.url),'utf8');
 const demo=readFileSync(new URL('../research/three-d-69/index-to-real-garment-demo.mjs',import.meta.url),'utf8');
 assert.match(ctl,/photoDenimContinuity76=false/);
 assert.match(ctl,/if\(photoDenimContinuity76&&built\.pants\?\.stats\?\.sourcePhotoDenimStructuralFolds75\)/);
 assert.match(view,/photoDenimContinuity76=false/);
 assert.match(demo,/get\('continuity76'\)==='after'/);
});
