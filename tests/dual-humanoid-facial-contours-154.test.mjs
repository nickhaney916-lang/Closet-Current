import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {FACE154,clearOriginalFaceContours154,applyOriginalFaceContours154}
 from '../research/dual-humanoid-facial-contours-154/face-contours.mjs';

test('P154 source-only facial geometry is not identity recognition or release authorized',()=>{
 assert.deepEqual(FACE154.figures,['female','male']);
 assert.equal(FACE154.mainParent,'d9b554207b0cc082d74b4c4741549cc495405553');
 assert.equal(FACE154.familyAlpha,'HOLD');
 assert.equal(FACE154.releaseAuthorized,false);
 assert.equal(FACE154.sourceBodyGeometryModified,false);
 assert.equal(FACE154.sourceGarmentGeometryModified,false);
 assert.equal(FACE154.userPortraitOrBiometricsUsed,false);
 assert.equal(FACE154.humanFacialRealismApproved,false);
});
test('P154 refuses original face layer without exact P131 eye mesh, P153 source-hair, skinned 163-bone source',()=>{
 assert.throws(()=>applyOriginalFaceContours154(null,'male'),/FACE154/);
 const root=new THREE.Group();
 assert.throws(()=>applyOriginalFaceContours154(root,'other'),/FACE154/);
 assert.throws(()=>applyOriginalFaceContours154(root,'female'),/FACE154/);
 const f=new THREE.Group();f.name='research-face-definition-131';
 const h=new THREE.Group();h.name='research-source-head-hair-153';
 root.add(f,h);
 assert.throws(()=>applyOriginalFaceContours154(root,'female'),/FACE154/);
 for(let i=0;i<14;i++)f.add(new THREE.Group());
 assert.throws(()=>applyOriginalFaceContours154(root,'male'),/FACE154/);
});
test('P154 removes ONLY overlay-owned material and geometry, with real P131 face and P153 hair unaffected',()=>{
 const root=new THREE.Group();
 const face=new THREE.Group();face.name='research-face-definition-131';
 const hair=new THREE.Group();hair.name='research-source-head-hair-153';
 const contour=new THREE.Group();contour.name='research-source-facial-contours-154';
 const g=new THREE.SphereGeometry(.002),m=new THREE.MeshStandardMaterial();
 const owned=new THREE.Mesh(g,m);owned.userData.face154Owned=true;
 contour.add(owned);root.add(face,hair,contour);
 const originalFace=new THREE.Mesh(new THREE.SphereGeometry(.001),new THREE.MeshBasicMaterial());
 face.add(originalFace);
 assert.equal(clearOriginalFaceContours154(root),true);
 assert.equal(root.getObjectByName('research-source-facial-contours-154'),undefined);
 assert.equal(root.getObjectByName('research-face-definition-131'),face);
 assert.equal(root.getObjectByName('research-source-head-hair-153'),hair);
 assert.equal(originalFace.geometry!==g,true);
 assert.equal(clearOriginalFaceContours154(root),false);
 originalFace.geometry.dispose();originalFace.material.dispose();
});
test('P154 tiny native contour must be sampled from actual source vertices, not a floating replacement nose mask',()=>{
 const text=readFileSync('research/dual-humanoid-facial-contours-154/face-contours.mjs','utf8');
 assert.match(text,/applyBoneTransform\(i,/);
 assert.match(text,/visibleZ\(x,y/);
 assert.match(text,/original source front skin/);
 assert.match(text,/nose-tip/);
 assert.match(text,/upper-lip-contour/);
 assert.match(text,/lower-lip-contour/);
 assert.match(text,/lower-eye-contour/);
 assert.match(text,/bone\.attach\(group\)/);
 assert.doesNotMatch(text,/new THREE\.ConeGeometry/);
 assert.doesNotMatch(text,/data:image\/|https?:\/\//);
});
test('P154 installer refuses mutation of shipping app or unrelated app and requires exact pinned original donor',()=>{
 const text=readFileSync('scripts/install-dual-humanoid-facial-contours-154.mjs','utf8');
 assert.match(text,/arg!=='\.p150-donor-541'/);
 assert.match(text,/df6885d6011cb33fb22dceb81a08f35a0ac4dd61/);
 assert.match(text,/P154 exact P153 donor bridge anchor changed/);
 assert.doesNotMatch(text,/supabase|service_role|production\.env/);
});
