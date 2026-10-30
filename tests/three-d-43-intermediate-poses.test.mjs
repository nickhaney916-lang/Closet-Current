import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A} from '../research/three-d-30/reviewed-photo-pants.mjs';
import {setResearchPose,APPROVED_RESEARCH_POSES} from '../research/three-d-43/intermediate-pose.mjs';
const namedBones=root=>{const arr=[];root.traverse(o=>{if(o.isBone)arr.push(o);});return arr;};
const poses=root=>namedBones(root).map(o=>o.quaternion.clone());
const originalBody=root=>{const records=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.work56Garment)records.push(o.geometry.getAttribute('position').array.slice());});return records;};
test('Original anatomical arm interpolation is deterministic, bounded and does not alter body positions',async()=>{
 const root=await person('female'),before=originalBody(root);
 setResearchPose(root,'source');const source=poses(root);
 setResearchPose(root,'relaxed');const relaxed=poses(root);
 for(const [mode,t] of [['blend-25',.25],['blend-50',.50],['blend-75',.75]]){
  const res=setResearchPose(root,mode),got=poses(root);
  assert.equal(res.fraction,t);assert.equal(res.sweptCollisionCertified,false);
  assert.equal(got.length,source.length);
  for(let i=0;i<got.length;i++){
   const expected=source[i].clone().slerp(relaxed[i],t);
   assert.ok(got[i].angleTo(expected)<1e-6,'Original rig quaternion must interpolate exactly '+mode+'/'+i);
  }
  setResearchPose(root,'source');setResearchPose(root,mode);
  const repeat=poses(root);
  for(let i=0;i<repeat.length;i++)assert.ok(repeat[i].angleTo(got[i])<1e-6);
 }
 assert.equal(APPROVED_RESEARCH_POSES.length,5);
 assert.throws(()=>setResearchPose(root,'blend-17'),/Only original/);
 assert.deepEqual(originalBody(root),before);
});
test('3D43 fractional arm poses require explicit independent source-true garment research',async()=>{
 const a=await person('female'),ordinary=createOutfitController(a);
 try{assert.throws(()=>ordinary.setPose('blend-50'),/requires isolated/);}finally{ordinary.dispose();}
 const root=await person('male');
 const app=createOutfitController(root,{poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true});
 try{
  const state=app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(A),pantsReviewed:true});
  assert.equal(state.pants.sourceSHA256,A.originalSHA256);
  const cached=new Map();
  for(const p of ['source','blend-25','blend-50','blend-75','relaxed','blend-50','source']){
   const s=app.setPose(p);
   assert.equal(s.pose,p);assert.equal(s.shirt.poseTriangleContact.pose,p);
   assert.ok(s.shirt.poseTriangleContact.solveMilliseconds>=0);
   assert.equal(s.shirt.poseTriangleContact.fullCollisionValidated,false);
   assert.equal(s.releaseAuthorized,false);
   const max=s.shirt.poseTriangleContact.maximumWorldCorrection;
   assert.ok(Number.isFinite(max)&&max<.09,'Bounded original photo garment corrections');
   if(cached.has(p))assert.equal(max,cached.get(p));
   cached.set(p,max);
  }
  assert.equal(app.setOutfit('none').garmentMeshes,0);
 }finally{app.dispose();}
});
