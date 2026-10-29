import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {measureCuffBodyTriangleContact} from '../research/three-d-20/triangle-contact.mjs';
globalThis.ProgressEvent=class {};
const candidate=()=>({id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,
 realFabricTexture:true,cutout:{width:1920,height:2880,decode(){}},
 cropRect:[0,0,1,1],baseColor:[.08,.08,.08]});
async function person(kind){
 const bytes=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SOURCES[kind].sha256);
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(
  bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const root=gltf.scene;
 root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root);
 const factor=2/box.getSize(new THREE.Vector3()).y;
 const center=box.getCenter(new THREE.Vector3());
 root.scale.multiplyScalar(factor);
 root.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);
 root.updateMatrixWorld(true);
 return root;
}
const shirtOf=root=>({meshes:['Work56-independent-shirt-shell',
 '3D17-neutral-inner-cuff-facing','3D18-neutral-wrist-hem-bridge'].map(name=>{
  const mesh=root.getObjectByName(name);
  assert.ok(mesh?.isSkinnedMesh,'Need original skeleton-bound mesh '+name);
  return mesh;
 })});
test('Cannot fabricate triangle clearance from missing synthetic geometry',()=>{
 assert.throws(()=>measureCuffBodyTriangleContact(null,null));
 assert.throws(()=>measureCuffBodyTriangleContact(new THREE.Group(),{meshes:[]}));
 assert.throws(()=>measureCuffBodyTriangleContact(new THREE.Group(),{meshes:[new THREE.Mesh()]}));
 assert.throws(()=>measureCuffBodyTriangleContact(new THREE.Group(),{meshes:[new THREE.Mesh()]},{hemStep:0}));
});
test('Recompute true body-skin triangles for both exact-licensed humans and poses',async()=>{
 const records=[];
 for(const kind of ['female','male']){
  const root=await person(kind);
  const controller=createOutfitController(root,{enableCuffBridge:true});
  const garment=candidate();
  controller.setOutfit('shirt-pants',garment,{reviewed:true});
  assert.equal(controller.getState().shirt.sourceSHA256,garment.sourceSHA256);
  const shirt=shirtOf(root);
  const poses=kind==='female'?['source','relaxed','source']:['source','relaxed'];
  let previous=null;
  for(const pose of poses){
   controller.setPose(pose);
   const x=measureCuffBodyTriangleContact(root,shirt,{hemStep:3});
   assert.equal(x.stage,'3D-20-triangle-contact-diagnostic');
   assert.equal(x.source,'real-skinned-CC0-body-surface-triangles');
   assert.equal(x.pointToTriangleMeasured,true);
   assert.ok(x.realBodyMeshCount>=1);
   assert.ok(x.inspectedBodyTriangles>10000);
   assert.equal(x.sourcePhotoOrMaskModified,false);
   assert.equal(x.bodyMeshModified,false);
   assert.equal(x.newGarmentMeshAdded,false);
   assert.equal(x.fullTriangleCollisionValidated,false);
   assert.equal(x.signedClearance,null);
   assert.equal(x.visualGapClosureProven,false);
   assert.equal(x.humanVisualApproval,false);
   assert.equal(x.releaseAuthorized,false);
   for(const arm of ['L','R']){
    const v=x.sides[arm];
    assert.ok(v.realSourceHemSamples>=6);
    assert.ok(v.realBodyWristTriangles>=20);
    assert.equal(v.hemPointToBodyTriangleMeters.n,v.realSourceHemSamples);
    assert.ok(v.hemPointToBodyTriangleMeters.min>=0);
    assert.ok(v.hemPointToBodyTriangleMeters.max<.2,'Sanity only, not accepted body fit');
    assert.ok(v.inwardSkinHitFraction>=0&&v.inwardSkinHitFraction<=1);
    assert.ok(v.inwardRadialSkinSurfaceMeters.n<=v.realSourceHemSamples);
    assert.ok(v.outwardRadialSkinSurfaceMeters.n<=v.realSourceHemSamples);
    assert.equal(v.signedClearance,null);
    assert.equal(v.garmentTriangleToBodyTriangleIntersectionValidated,false);
    assert.equal(v.watertightBodyValidated,false);
    assert.equal(v.humanVisualApproval,false);
    assert.equal(v.palePixelWedgeCount,null);
   }
   if(kind==='female'&&pose==='source'&&previous)
    for(const arm of ['L','R']){
     assert.ok(Math.abs(x.sides[arm].hemBoneAxisFraction.median-
      previous.sides[arm].hemBoneAxisFraction.median)<.003,
      'Source pose must restore original bone-relative hem position');
    }
   if(kind==='female'&&pose==='source'&&!previous)previous=x;
   const record={kind,pose,sourceSHA256:garment.sourceSHA256,...x};
   records.push(record);
   console.log('THREE_D_20_ACTUAL_TRIANGLE_WRIST_CONTACT',JSON.stringify({
    kind,pose,skinTriangles:x.inspectedBodyTriangles,
    L:x.sides.L,R:x.sides.R,release:'HOLD'
   }));
  }
  controller.setOutfit('pants');
  assert.equal(root.getObjectByName('3D18-neutral-wrist-hem-bridge'),undefined);
  controller.dispose();
 }
 await mkdir('benchmark/three-d-20',{recursive:true});
 await writeFile('benchmark/three-d-20/actual-skin-triangle-contact-HOLD.json',
 JSON.stringify({
  stage:'3D-20',source:'both exact-hash CC0 anatomical meshes + source-bound licensed AJ shirt',
  data:'true deformed skin triangle point proximity and radial rays',
  originalSourcePhotosModified:false,garmentGeometryModified:false,
  proofOfContinuousGarmentFit:false,bodyTriangleIntersectionValidated:false,
  humanVisualApproval:false,release:'HOLD',records
 },null,2));
 assert.equal(records.length,5);
});
test('Source privacy and hard release HOLD are preserved',async()=>{
 const m=await readFile('research/three-d-20/triangle-contact.mjs','utf8');
 for(const pattern of [/supabase\.co/,/localStorage/,/indexedDB/,/openai\.com/,
 /getUserMedia/,/sendBeacon/,/cloudflare\.com/,/jsdelivr\.net/,/unpkg\.com/])
  assert.doesNotMatch(m,pattern);
 assert.match(m,/new THREE\.Triangle/);
 assert.match(m,/closestPointToPoint/);
 assert.match(m,/intersectTriangle/);
 assert.match(m,/fullTriangleCollisionValidated:false/);
 assert.match(m,/visualGapClosureProven:false/);
});
