import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {protectShirtCuffClearance,wristAxes} from '../research/three-d-16/cuff-clearance.mjs';
globalThis.ProgressEvent=class{};
const candidate=()=>({id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,realFabricTexture:true,
 cutout:{width:1920,height:2880,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]});
async function human(kind){
 const raw=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);
 assert.equal(createHash('sha256').update(raw).digest('hex'),SOURCES[kind].sha256);
 const {scene:r}=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
 r.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(r),
  scale=2/box.getSize(new THREE.Vector3()).y,cent=box.getCenter(new THREE.Vector3());
 r.scale.multiplyScalar(scale);r.position.set(-cent.x*scale,-box.min.y*scale,-cent.z*scale);
 r.updateMatrixWorld(true);return r;
}
const collect=root=>{const out=[];root.traverse(m=>{if(m.isSkinnedMesh&&m.userData.work56Garment)out.push(m);});return out;};
test('Invalid bodies, unsupported offsets and unverified garment proxies fail closed',async()=>{
 assert.throws(()=>wristAxes(null));
 assert.throws(()=>protectShirtCuffClearance({meshes:[]},new THREE.Group()));
 assert.throws(()=>protectShirtCuffClearance({meshes:[{}]},new THREE.Group(),{offset:.03}));
 for(const kind of ['male','female']){
  const root=await human(kind);
  const axes=wristAxes(root);
  assert.equal(axes.length,2);assert.ok(axes.every(a=>a.axisLengthSq>.01));
 }
});
for(const kind of ['male','female'])test(kind+' source-pose wrist and cuff 3D clearance, both arms, no photo identity changes',async()=>{
 const unchanged=await human(kind),baseline=createOutfitController(unchanged,{enableCuffFix:false}),
  revisedRoot=await human(kind),revised=createOutfitController(revisedRoot);
 const rootBody=[];revisedRoot.traverse(m=>{
  if(m.isSkinnedMesh&&!m.userData.work56Garment)rootBody.push({
   mesh:m,position:Buffer.from(m.geometry.attributes.position.array.buffer).toString('hex'),
   normal:Buffer.from(m.geometry.attributes.normal.array.buffer).toString('hex')
  });
 });
 const data=candidate(),a=baseline.setOutfit('shirt-pants',data,{reviewed:true}),
  b=revised.setOutfit('shirt-pants',data,{reviewed:true});
 assert.equal(a.shirt.cuffFit,undefined);
 assert.equal(b.shirt.cuffFit,'near-wrist-radial-ease');
 assert.equal(b.shirt.collisionValidated,false);assert.equal(b.shirt.minClearance,null);
 assert.ok(b.shirt.cuffMovedVertices>0,'Actual cuff vertices must move');
 assert.ok(b.shirt.cuffEligibleVertices>=b.shirt.cuffMovedVertices);
 assert.ok(b.shirt.cuffMaxCorrection>0&&b.shirt.cuffMaxCorrection<=.0080001);
 assert.ok(b.shirt.cuffCorrectionByArm.L>0&&b.shirt.cuffCorrectionByArm.R>0,'Both cuffs must receive correction');
 assert.equal(b.pants.sourceSHA256,null);
 assert.equal(b.pants.photoApplied,false);
 const before=collect(unchanged).filter(x=>x.name==='Work56-independent-shirt-shell'),
  after=collect(revisedRoot).filter(x=>x.name==='Work56-independent-shirt-shell');
 assert.equal(before.length,after.length);
 let moved=0;
 for(let k=0;k<before.length;k++){
  const x=before[k].geometry,y=after[k].geometry;
  for(const label of ['panelPosition','panelNormal','skinIndex','skinWeight']){
   assert.deepEqual(Array.from(x.attributes[label].array),Array.from(y.attributes[label].array),
    'Original picture UV, panel normal and original skeleton weights must remain untouched: '+label);
  }
  assert.deepEqual(Array.from(x.index.array),Array.from(y.index.array));
  for(let i=0;i<x.attributes.position.count;i++){
   const u=new THREE.Vector3().fromBufferAttribute(x.attributes.position,i),
    v=new THREE.Vector3().fromBufferAttribute(y.attributes.position,i);
   const d=u.distanceTo(v);if(d>1e-7)moved++;
   assert.ok(d<.00801,'No garment position may move by more than 8mm: '+d);
  }
 }
 assert.ok(moved>0);
 for(const {mesh,position,normal} of rootBody){
  assert.equal(Buffer.from(mesh.geometry.attributes.position.array.buffer).toString('hex'),position);
  assert.equal(Buffer.from(mesh.geometry.attributes.normal.array.buffer).toString('hex'),normal);
 }
 // Changing pose must not rewrite the verified source/RGB or rebuild the outfit.
 const count=b.changes;revised.setPose('source');revised.setPose('relaxed');
 assert.equal(revised.getState().changes,count);
 assert.equal(revised.getState().shirt.sourceSHA256,data.sourceSHA256);
 revised.dispose();baseline.dispose();assert.equal(collect(revisedRoot).length,0);
});
test('No original source, customer data, cloud, stage workflow or Drive Duel modification',async()=>{
 const paths=['research/three-d-16/cuff-clearance.mjs','research/three-d-15/outfit-controller.mjs',
  'research/three-d-15/showroom.mjs','research/three-d-15/demo.mjs'];
 for(const path of paths){
  const s=await readFile(path,'utf8');
  for(const bad of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,
   /sendBeacon/,/openai\.com/,/cdn\.jsdelivr/,/unpkg\.com/])assert.doesNotMatch(s,bad);
 }
 const s=await readFile('research/three-d-16/cuff-clearance.mjs','utf8');
 assert.match(s,/g\.attributes\.panelPosition/);
 assert.doesNotMatch(s,/panelPosition\.set|panelNormal\.set/);
 assert.match(s,/collisionValidated:false/);
});
