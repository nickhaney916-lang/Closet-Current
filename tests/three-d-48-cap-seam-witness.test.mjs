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
// 3D52: fail closed on invalid indices or non-finite source coordinates.
// A wrong mesh with a duplicate display name formerly returned a NaN
// distance (serialized as null), which gave no useful seam diagnosis.
const at=(mesh,index)=>{
 const pos=mesh.geometry.getAttribute('position');
 assert.ok(pos&&Number.isInteger(index)&&index>=0&&index<pos.count,
  'Seam witness must reference a real position on the exact named mesh instance: '+
  JSON.stringify({name:mesh.name,index,count:pos?.count}));
 const p=new THREE.Vector3().fromBufferAttribute(pos,index).applyMatrix4(mesh.matrixWorld);
 assert.ok([p.x,p.y,p.z].every(Number.isFinite),'Non-finite original photographed seam position '+mesh.name+'/'+index);
 return p;
};
const indexedVertices=mesh=>{
 const index=mesh.geometry.index,pos=mesh.geometry.getAttribute('position');
 assert.ok(index&&index.count>=3&&pos,'Real original cloth seam requires indexed, rendered garment faces');
 const used=new Set();
 for(let i=0;i<index.count;i++){
  const vertex=index.getX(i);
  assert.ok(Number.isInteger(vertex)&&vertex>=0&&vertex<pos.count,'Invalid rendered garment triangle index');
  used.add(vertex);
 }
 return used;
};
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
 // The shirt construction contains multiple shell meshes with the SAME
 // display name. Preserve traversal-stable instance ordinals, not names.
 // Limit witnesses to triangle-referenced vertices: unused cap-cut shell
 // vertices are not evidence of an actual rendered sewn seam.
 for(const [shellId,shell] of shells.entries()){
  for(const i of indexedVertices(shell)){
   const k=key(at(shell,i));
   if(!byPosition.has(k))byPosition.set(k,[]);
   byPosition.get(k).push({shellId,index:i});
  }
 }
 const matches=[];
 for(const [capId,cap] of caps.entries())for(const i of indexedVertices(cap)){
  const adjacent=byPosition.get(key(at(cap,i)))||[];
  for(const shell of adjacent)matches.push({
   side:cap.userData.work45IndependentShoulderCap,capId,ci:i,
   shellId:shell.shellId,si:shell.index
  });
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
   const original=garmentMeshes(beforeRoot),tailored=garmentMeshes(afterRoot);
   assert.deepEqual(tailored.shells.map(m=>m.name),original.shells.map(m=>m.name),
    'Actual original source shirt panel identities and traversal order must be preserved');
   assert.deepEqual(tailored.caps.map(m=>[m.name,m.userData.work45IndependentShoulderCap]),
    original.caps.map(m=>[m.name,m.userData.work45IndependentShoulderCap]),
    'Actual independently skinned L/R cap order must not change');
   for(const w of witnesses){
    const ca=tailored.caps[w.capId],sh=tailored.shells[w.shellId],base=original.caps[w.capId];
    assert.ok(ca&&sh&&base,'Witness must resolve the exact photographed cap and shell mesh instances');
    const afterCap=at(ca,w.ci),afterTorso=at(sh,w.si);
    const separation=afterCap.distanceTo(afterTorso);
    assert.ok(Number.isFinite(separation)&&separation<=5e-5,
     'Actual sewn cap-to-torso seam separated: '+JSON.stringify({...w,
      cap:ca.name,shell:sh.name,capXYZ:afterCap.toArray(),shellXYZ:afterTorso.toArray(),separation}));
    if(afterCap.distanceTo(at(base,w.ci))>.0005)moved[w.side]++;
   }
   assert.ok(moved.L>0&&moved.R>0,
    'Tailoring must move real sewn fabric along at least one witnessed seam on each arm: '+JSON.stringify({counts,moved}));
   assert.ok(a.shirt.upperArmFabricMaxMove<.023);
   console.log('THREE_D48_ACTUAL_CAP_TORSO_SEAMS',JSON.stringify({kind,denim:src.id,counts,moved}));
  } finally{baseline.dispose();updated.dispose();}
 });
