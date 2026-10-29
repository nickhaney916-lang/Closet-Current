import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {finishInnerCuffs} from '../research/three-d-17/inner-cuff-facing.mjs';
globalThis.ProgressEvent=class{};
const source=()=>({id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),
 ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,realFabricTexture:true,
 cutout:{width:1920,height:2880,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]});
async function human(kind){
 const raw=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);
 assert.equal(createHash('sha256').update(raw).digest('hex'),SOURCES[kind].sha256);
 const {scene:r}=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
 r.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(r),scale=2/box.getSize(new THREE.Vector3()).y,center=box.getCenter(new THREE.Vector3());
 r.scale.multiplyScalar(scale);r.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
 r.updateMatrixWorld(true);return r;
}
const snapshot=g=>Object.fromEntries(['position','normal','panelPosition','panelNormal','skinIndex','skinWeight'].filter(n=>g.attributes[n]).map(n=>[n,Buffer.from(g.attributes[n].array.buffer).toString('hex')]));
test('Unsupported, missing and excessive facing depth fails closed',()=>{
 for(const [shirt,root,opts] of [[null,null,{}],[{meshes:[]},new THREE.Group(),{}],
  [{meshes:[{}]},new THREE.Group(),{axial:.02}],[{meshes:[{}]},new THREE.Group(),{inward:.01}]]){
  assert.throws(()=>finishInnerCuffs(shirt,root,opts));
 }
});
for(const kind of ['male','female'])test(kind+' source-color inner cuff facing uses actual boundary, preserves all photo and anatomical source',async()=>{
 const a=await human(kind),b=await human(kind);
 const old=createOutfitController(a,{enableCuffFacing:false}),newer=createOutfitController(b,{enableCuffFacing:true});
 const candidate=source(),before=old.setOutfit('shirt-pants',candidate,{reviewed:true}),
  after=newer.setOutfit('shirt-pants',candidate,{reviewed:true});
 assert.equal(before.shirt.innerCuffFacing,undefined);
 assert.equal(after.shirt.innerCuffFacing,true);
 assert.ok(after.shirt.neutralCuffTriangles>=12);
 assert.ok(after.shirt.innerCuffEdges.L>=3&&after.shirt.innerCuffEdges.R>=3);
 assert.equal(after.shirt.innerCuffAxial,.005);assert.equal(after.shirt.innerCuffDepth,.002);
 assert.equal(after.shirt.photographicCuffPixels,false);
 assert.equal(after.shirt.sourceSHA256,before.shirt.sourceSHA256);
 assert.equal(after.shirt.releaseAuthorized,false);
 assert.equal(after.shirt.collisionValidated,false);
 assert.equal(after.pants.sourceSHA256,null);
 assert.equal(after.pants.photoApplied,false);
 assert.equal(after.garmentMeshes,before.garmentMeshes+1);
 const photos=arr=>arr.filter(o=>o.name==='Work56-independent-shirt-shell');
 const shellA=[],shellB=[],facings=[],bodyA=[],bodyB=[];
 a.traverse(o=>{if(o.isSkinnedMesh){if(o.name==='Work56-independent-shirt-shell')shellA.push(o);
  if(!o.userData.work56Garment)bodyA.push(o);}});
 b.traverse(o=>{if(o.isSkinnedMesh){if(o.name==='Work56-independent-shirt-shell')shellB.push(o);
  if(o.name==='3D17-neutral-inner-cuff-facing')facings.push(o);
  if(!o.userData.work56Garment)bodyB.push(o);}});
 assert.equal(shellA.length,shellB.length);
 assert.equal(facings.length,1,'One neutral independent skinned cuff facing required');
 assert.equal(bodyA.length,bodyB.length);
 for(let i=0;i<shellA.length;i++){
  const ga=shellA[i].geometry,gb=shellB[i].geometry;
  assert.deepEqual(snapshot(ga),snapshot(gb),'Photo panel, original RGB coordinates, skin weights and cuff corrected source must be byte identical');
  assert.deepEqual(Array.from(ga.index.array),Array.from(gb.index.array));
 }
 for(let i=0;i<bodyA.length;i++){
  assert.deepEqual(snapshot(bodyA[i].geometry),snapshot(bodyB[i].geometry),'Verified source human anatomy unchanged');
 }
 const f=facings[0],g=f.geometry;
 assert.ok(f.isSkinnedMesh&&f.skeleton===shellB[0].skeleton);
 assert.ok(g.index.count/3>=12&&g.attributes.position.count===g.attributes.skinIndex.count);
 assert.equal(g.attributes.position.count,g.attributes.panelPosition.count);
 assert.ok(Array.from(g.attributes.panelPosition.array).every((v,i)=>v===[0,-99,0][i%3]),'Cuff facing is ONLY neutral original fabric median, never a duplicate print/white logo');
 const sw=g.attributes.skinWeight;
 for(let i=0;i<sw.count;i++){
  const sum=sw.getX(i)+sw.getY(i)+sw.getZ(i)+sw.getW(i);
  assert.ok(Math.abs(sum-1)<.01,'Cuff uses normalized genuine body bone weights');
 }
 for(const pose of ['source','relaxed','source','relaxed']){
  newer.setPose(pose);assert.equal(newer.getState().shirt.sourceSHA256,candidate.sourceSHA256);
 }
 // Atomic dress replacement clears cuff independently; never overlays an
 // old photographed shirt underneath a full dress.
 newer.setOutfit('pants');assert.equal(newer.getState().garmentMeshes,1);
 assert.equal(f.parent,null);
 old.dispose();newer.dispose();
 assert.equal(b.getObjectByName('3D17-neutral-inner-cuff-facing'),undefined);
});
test('No paid AI, customer image data or production edits; original source photo material is never altered',async()=>{
 const files=['research/three-d-17/inner-cuff-facing.mjs',
  'research/three-d-15/outfit-controller.mjs','research/three-d-15/showroom.mjs','research/three-d-15/demo.mjs'];
 for(const f of files){
  const text=await readFile(f,'utf8');
  for(const re of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,/sendBeacon/,/openai\.com/,/cdn\.jsdelivr/,/unpkg\.com/])
   assert.doesNotMatch(text,re);
 }
 const s=await readFile('research/three-d-17/inner-cuff-facing.mjs','utf8');
 assert.match(s,/panelPosition\.push\(0,-99,0\)/);
 assert.doesNotMatch(s,/original\.geometry\.setAttribute|source\.setXYZ|panelPosition\.setXYZ/);
 assert.match(s,/collisionValidated:false/);
 assert.match(s,/shirt\.meshes/);
});
