import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {auditTrueSkinnedPhotographedDenimContact77,classifyTrueDenimContacts77}
 from '../research/three-d-77/true-skinned-denim-body-intersections.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';

test('3D77 classifies actual source-photo triangles independently of pose',()=>{
 const front=new THREE.Float32BufferAttribute([0,.7,.9,0,0,0],1);
 const world=new THREE.Float32BufferAttribute([.1,.4,0,.12,.3,0,.13,.5,0,
  -.2,.7,0,-.1,.69,0,-.3,.68,0],3);
 const idx=new Uint32Array([0,1,2,3,4,5]);
 const c=classifyTrueDenimContacts77([{i:0},{i:1}],idx,front,world);
 assert.equal(c.reviewedSegments,2);
 assert.equal(c.sourcePhotoFront,1);
 assert.equal(c.sourceNeutralRear,1);
 assert.equal(c.left,1);
 assert.equal(c.right,1);
 assert.throws(()=>classifyTrueDenimContacts77([{i:4}],idx,front,world),/unmapped/);
 assert.throws(()=>classifyTrueDenimContacts77(null,idx,front,world),/mapping required/);
});
test('3D77 rejects fabricated trouser meshes and defaults OFF',()=>{
 assert.equal(auditTrueSkinnedPhotographedDenimContact77(null,null,{enabled:false}),null);
 assert.throws(()=>auditTrueSkinnedPhotographedDenimContact77({},{}),/source SHA-vetted/);
 assert.throws(()=>createOutfitController({},{
  photoDenimContactAudit77:true,photoDenimContinuity76:false,
  photoDenimFolds75:true,photoDenimCalfHang74:true,photoDenimRearDrape73:true
 }),/3D77 exact skinned-contact audit requires/);
});
test('3D77 uses actual skinned and posed anatomical triangles; preserves source photographs',()=>{
 const f=readFileSync(new URL('../research/three-d-77/true-skinned-denim-body-intersections.mjs',import.meta.url),'utf8');
 for(const q of ['posedGeometry(bodyMeshes)','posedGeometry([mesh])',
  'triangleContacts(jeans.g,body.g,{collect:true})','pantsSourceUV',
  'pantsRest','pantsSourceFront','skinIndex','skinWeight',
  'actualSkinnedDenimBodyCrossingSegments77:count',
  'originalPhotoUVRestFrontSkinPositionsBytePreserved77:true',
  'bodyContactAssessment77:count?', 'dynamicClothCollisionCertified:false',
  'humanVisualPhotorealismApproved:false','releaseAuthorized:false'])assert.ok(f.includes(q),q);
 assert.doesNotMatch(f,/fetch\(|toDataURL|createElement|localStorage|generateFakeBack|canvas/);
 const c=readFileSync(new URL('../research/three-d-15/outfit-controller.mjs',import.meta.url),'utf8');
 const s=readFileSync(new URL('../research/three-d-15/showroom.mjs',import.meta.url),'utf8');
 const d=readFileSync(new URL('../research/three-d-69/index-to-real-garment-demo.mjs',import.meta.url),'utf8');
 assert.match(c,/photoDenimContactAudit77=false/);
 assert.match(c,/auditTrueSkinnedPhotographedDenimContact77/);
 assert.match(s,/photoDenimContactAudit77=false/);
 assert.match(d,/get\('contact77'\)==='on'/);
});
