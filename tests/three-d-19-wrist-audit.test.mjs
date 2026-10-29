import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {auditAnatomicalWristHem,worldSkinnedPosition}
 from '../research/three-d-19/wrist-anatomy-audit.mjs';
globalThis.ProgressEvent=class {};
const candidate=()=>({id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,realFabricTexture:true,
 cutout:{width:1920,height:2880,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]});
async function person(kind){
 const data=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);
 assert.equal(createHash('sha256').update(data).digest('hex'),SOURCES[kind].sha256);
 const parsed=await new GLTFLoader().parseAsync(data.buffer.slice(
  data.byteOffset,data.byteOffset+data.byteLength),'');
 const root=parsed.scene;
 root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root),s=2/box.getSize(new THREE.Vector3()).y,
  center=box.getCenter(new THREE.Vector3());
 root.scale.multiplyScalar(s);root.position.set(-center.x*s,-box.min.y*s,-center.z*s);
 root.updateMatrixWorld(true);
 return root;
}
const garment=root=>({meshes:[
 'Work56-independent-shirt-shell',
 '3D17-neutral-inner-cuff-facing',
 '3D18-neutral-wrist-hem-bridge'
 ].map(name=>{
  const mesh=root.getObjectByName(name);
  assert.ok(mesh?.isSkinnedMesh,'Exact rig-bound source garment: '+name);
  return mesh;
 })});
test('Not allowed to assert human fit from missing or synthetic source geometry',()=>{
 assert.throws(()=>auditAnatomicalWristHem(null,null));
 assert.throws(()=>auditAnatomicalWristHem(new THREE.Group(),{meshes:[]}));
 assert.throws(()=>auditAnatomicalWristHem(new THREE.Group(),{meshes:[new THREE.Mesh()]}));
 assert.throws(()=>worldSkinnedPosition({},0));
});
for(const kind of ['female','male'])test(kind+
 ' real source + relaxed pose wrist-to-sampled-skin distances, never fake collision approval',async()=>{
 const root=await person(kind);
 const controller=createOutfitController(root,{enableCuffBridge:true});
 const source=candidate();
 controller.setOutfit('shirt-pants',source,{reviewed:true});
 assert.equal(controller.getState().shirt.sourceSHA256,source.sourceSHA256);
 const shirt=garment(root);
 const audits=[];
 for(const pose of ['source','relaxed','source']){
  controller.setPose(pose);
  const data=auditAnatomicalWristHem(root,shirt,{sampleStep:6});
  audits.push(data);
  assert.equal(data.anatomy,'real-CC0-skinned-wrist-bones');
  assert.equal(data.sourcePhotoChanged,false);
  assert.equal(data.bodyMeshChanged,false);
  assert.equal(data.photoUsedForHem,false);
  assert.equal(data.humanVisualApproval,false);
  assert.equal(data.releaseAuthorized,false);
  assert.equal(data.collisionValidated,false,'Nearest sampled skin vertices are NOT signed collision checks');
  for(const side of ['L','R']){
   const m=data.sideMetrics[side];
   assert.ok(m.hemSamples>=6&&m.bodySamples>=8);
   assert.ok(m.hemToSampledSkinMeters.min>=0);
   assert.ok(m.hemToSampledSkinMeters.max<.4,'Sanity bound only, not visually acceptable fit');
   assert.ok(m.radialHemMeters.median>.01);
   assert.equal(m.signedClearance,null);
   assert.equal(m.bodyTriangleIntersectionValidated,false);
   assert.equal(m.visualWedgeCount,null);
  }
  console.log('THREE_D_19_ANATOMICAL_WRIST_SAMPLED_SURFACES',
   JSON.stringify({kind,pose,sourceSHA256:source.sourceSHA256,
    sides:data.sideMetrics,collisionValidated:false,humanVisualApproval:false}));
 }
 for(const side of ['L','R']){
  assert.ok(Math.abs(audits[0].sideMetrics[side].hemAxisFraction.median-
   audits[2].sideMetrics[side].hemAxisFraction.median)<.002,
   'Source pose returned to same joint-relative cuff position');
 }
 controller.setOutfit('pants');
 assert.equal(root.getObjectByName('3D18-neutral-wrist-hem-bridge'),undefined);
 controller.dispose();
});
test('This stage is geometry and visual QA only; no source photo, production, auth, paid, staging edits',async()=>{
 const files=['research/three-d-19/wrist-anatomy-audit.mjs',
  'research/three-d-19/README.md'];
 for(const f of files){
  const src=await readFile(f,'utf8');
  for(const pat of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,
   /sendBeacon/,/openai\.com/,/unpkg\.com/,/jsdelivr\.net/])
   assert.doesNotMatch(src,pat);
 }
});
