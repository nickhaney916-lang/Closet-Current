/** 3D48 — fail-closed independently witnessed cap-to-torso seam safety.
 * A reported seamGap of zero is meaningless unless real cross-mesh seam
 * witnesses exist and are preserved across the original photo cloth edit.
 * Research-only: checks actual original rigged male/female cloth and both
 * licensed photo denim sources, never customer images.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';

const key=p=>p.toArray().map(v=>v.toFixed(5)).join(':');
const at=(mesh,index)=>new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'),index).applyMatrix4(mesh.matrixWorld);
const garmentMeshes=root=>{
 root.updateMatrixWorld(true);
 const shells=[],caps=[];
 root.traverse(m=>{
  if(!m.isSkinnedMesh||!m.userData.work56Garment||m.userData.work60Pants)return;
  if(m.name==='Work56-independent-shirt-shell')shells.push(m);
  if(m.userData.work45IndependentShoulderCap)caps.push(m);
 });
 assert.ok(shells.length>0,'Actual detached source-photo shirt torso missing');
 assert.ok(caps.some(m=>m.userData.work45IndependentShoulderCap==='L'));
 assert.ok(caps.some(m=>m.userData.work45IndependentShoulderCap==='R'));
 return {shells,caps};
};
function seamWitnesses(root){
 const {shells,caps}=garmentMeshes(root);
 const byPosition=new Map();
 for(const shell of shells){
  for(let i=0;i<shell.geometry.getAttribute('position').count;i++){
   const k=key(at(shell,i));
   if(!byPosition.has(k))byPosition.set(k,[]);
   byPosition.get(k).push({mesh:shell.name,index:i});
  }
 }
 const matches=[];
 for(const cap of caps)for(let i=0;i<cap.geometry.getAttribute('position').count;i++){
  const adjacent=byPosition.get(key(at(cap,i)))||[];
  for(const shell of adjacent)matches.push({side:cap.userData.work45IndependentShoulderCap,cap:cap.name,ci:i,shell:shell.mesh,si:shell.index});
 }
 return matches;
}
for(const kind of ['female','male'])for(const src of [A,B])
 test('3D48 real cap-to-torso witnesses survive 3D47 photo tailoring '+kind+'/'+src.id,async()=>{
  const beforeRoot=await person(kind),afterRoot=await person(kind);
  const common={jeansPanelFall:true,independentGarments:true,tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,poseContactFactory:createPoseContact};
  const baseline=createOutfitController(beforeRoot,common);
  const updated=createOutfitController(afterRoot,{...common,upperArmFabricVolume:true});
  try{
   const args={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};
   const b=baseline.setOutfit('shirt-pants',candidate('shirt'),args);
   const a=updated.setOutfit('shirt-pants',candidate('shirt'),args);
   assert.equal(b.shirt.upperArmFabricVolumeTailored,undefined);
   assert.equal(a.shirt.upperArmFabricVolumeTailored,true);
   assert.equal(a.shirt.releaseAuthorized,false);
   assert.equal(a.pants.sourceSHA256,src.originalSHA256);
   const witnesses=seamWitnesses(beforeRoot);
   const counts={L:0,R:0},moved={L:0,R:0};
   for(const w of witnesses)counts[w.side]++;
   assert.ok(counts.L>=3&&counts.R>=3,
    'A zero seam gap without verified left/right cap-to-shell shared vertices is NOT a passing seam test: '+JSON.stringify(counts));
   const original=new Map(),tailored=new Map();
   for(const {shells,caps} of [garmentMeshes(beforeRoot)])for(const m of [...shells,...caps])original.set(m.name,m);
   for(const {shells,caps} of [garmentMeshes(afterRoot)])for(const m of [...shells,...caps])tailored.set(m.name,m);
   for(const w of witnesses){
    const ca=tailored.get(w.cap),sh=tailored.get(w.shell),base=original.get(w.cap);
    assert.ok(ca&&sh&&base,'Actual photo garment mesh identity must remain intact');
    const afterCap=at(ca,w.ci),afterTorso=at(sh,w.si);
    const separation=afterCap.distanceTo(afterTorso);
    assert.ok(separation<=5e-5,'Actual sewn left/right cap-to-torso seam pulled apart: '+JSON.stringify({...w,separation}));
    if(afterCap.distanceTo(at(base,w.ci))>.0005)moved[w.side]++;
   }
   assert.ok(moved.L>0&&moved.R>0,
    'Tailoring must move real sewn fabric along at least one witnessed seam on each arm: '+JSON.stringify({counts,moved}));
   assert.ok(a.shirt.upperArmFabricMaxMove<.023);
   console.log('THREE_D48_ACTUAL_CAP_TORSO_SEAMS',JSON.stringify({kind,denim:src.id,counts,moved}));
  } finally{baseline.dispose();updated.dispose();}
 });
