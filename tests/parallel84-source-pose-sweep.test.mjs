import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {auditRealSourceGarmentArmPoses84} from '../research/parallel84-real-photo-layers/source-pose-sweep84.mjs';

// All meshes are SYNTHETIC test geometry but have TRUE THREE SkinnedMesh
// transforms with an actual shared 163-bone skeleton. Not a real photo test.
const SHIRT='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DENIM='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
function fixture(){
 const root=new T.Group(),bones=Array.from({length:163},()=>new T.Bone());
 bones[0].name='upperarm01L';bones[1].name='upperarm01R';
 root.add(...bones);root.updateMatrixWorld(true);
 function make(xyz,faces,bone,{garment=true}={}){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setIndex(faces);g.computeVertexNormals();
  const ids=new Uint16Array(xyz.length/3*4),weights=new Float32Array(ids.length);
  for(let i=0;i<xyz.length/3;i++){
   ids[i*4]=bone;weights[i*4]=1;
  }
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));
  g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  g.setAttribute('uv',new T.Float32BufferAttribute(
   Array.from({length:xyz.length/3},(_,i)=>[i/4,i/4]).flat(),2));
  const m=new T.SkinnedMesh(g,new T.MeshStandardMaterial({side:T.DoubleSide}));
  m.userData.work56Garment=garment;
  root.add(m);root.updateMatrixWorld(true);
  m.bind(new T.Skeleton(bones));
  return m;
 }
 // Body at Z=0, shirt parallel Z=.08 under shared rig. Half and full
 // arm movements rotate shirt downward through body, yielding real 3D
 // triangle intersections. Denim remains further from the torso.
 const body=make([-.8,0,0,.8,0,0,-.8,1,0,.8,1,0],
  [0,1,2,1,3,2],2,{garment:false});
 const shirt=make([-.5,.10,.08,.5,.10,.08,-.5,.75,.08,.5,.75,.08],
  [0,1,2,1,3,2],1);
 const pants=make([-.2,2,1,.2,2,1,-.2,2.6,1,.2,2.6,1],
  [0,1,2,1,3,2],2);
 const applyPose=pose=>{
  const r={source:0,'blend-50':-.2,relaxed:-.4}[pose];
  if(r===undefined)throw Error('invalid-test-pose');
  bones[0].rotation.x=r;bones[1].rotation.x=r;
  root.updateMatrixWorld(true);
  for(const m of [body,shirt,pants])m.skeleton.update();
 };
 return {root,bones,body,shirt:{meshes:[shirt],stats:{sourceSHA256:SHIRT}},
  pants:{meshes:[pants],stats:{sourceId:'commons-public-domain-jeans-2005',
   sourceSHA256:DENIM,photoApplied:true}},
  avatar:'female',applyPose};
}
test('P84 real THREE 163-bone three-pose diagnostic detects collisions that source A-pose cannot see, and restores joint pose',()=>{
 const f=fixture(),bones=f.bones.map(x=>x.quaternion.clone());
 const before=f.shirt.meshes[0].geometry.getAttribute('position').array.slice();
 const receipt=auditRealSourceGarmentArmPoses84(f);
 assert.equal(receipt.actualPoseAuditCompleted,true,JSON.stringify(receipt));
 assert.equal(receipt.poseResults.length,3);
 assert.deepEqual(receipt.poseResults.map(x=>x.pose),['source','blend-50','relaxed']);
 assert.equal(receipt.poseResults[0].shirtBodyCrossingTrianglePairs,0);
 assert.ok(receipt.poseResults.at(-1).shirtBodyCrossingTrianglePairs>0,
  'Actual posed shirt intersects REAL skinned body, not a fake heuristic: '+JSON.stringify(receipt));
 assert.equal(receipt.status,'SOME_STATIC_POSES_WITNESS_CONTACT');
 assert.ok(receipt.actualShoulderPoseEndToEndRadians>.2);
 assert.equal(receipt.continuousOrSweptCollisionCertified,false);
 assert.equal(receipt.safe3DClearanceProven,false);
 assert.equal(receipt.releaseAuthorized,false);
 assert.equal(JSON.stringify(receipt).includes('cb909d7ad'),false);
 for(let i=0;i<f.bones.length;i++)
  assert.ok(f.bones[i].quaternion.equals(bones[i]));
 assert.deepEqual(f.shirt.meshes[0].geometry.getAttribute('position').array,before);
});
test('P84 does not accept a nonphotographed garment, forged original SHA or invalid figure without touching shared skeletal geometry',()=>{
 for(const which of ['bad-avatar','wrong-photo','nonoriginal-source']){
  const f=fixture(),original=f.bones[1].quaternion.clone();
  if(which==='bad-avatar')f.avatar='unknown';
  if(which==='wrong-photo')f.shirt.stats.sourceSHA256='0'.repeat(64);
  if(which==='nonoriginal-source')f.pants.stats.sourceId='private-closet';
  const receipt=auditRealSourceGarmentArmPoses84(f);
  assert.equal(receipt.status,'UNVERIFIED_FAIL_CLOSED');
  assert.equal(receipt.actualPoseAuditCompleted,false);
  assert.ok(f.bones[1].quaternion.equals(original));
 }
});
test('P84 rejects a renamed identical pose and never pretends to audit movement or swept collisions',()=>{
 const f=fixture();
 f.applyPose=()=>{};const receipt=auditRealSourceGarmentArmPoses84(f);
 assert.equal(receipt.status,'UNVERIFIED_FAIL_CLOSED');
 assert.equal(receipt.reason,'actual-original-bone-pose-motion-not-witnessed');
 assert.equal(receipt.safe3DClearanceProven,false);
 assert.equal(receipt.releaseAuthorized,false);
});
test('P84 restores exact current original joint quaternions after interrupted source 163-bone pose callback',()=>{
 const f=fixture();
 f.bones[0].rotation.y=.12;
 const original=f.bones.map(x=>x.quaternion.clone());
 f.applyPose=pose=>{f.bones[1].rotation.x=-.5;if(pose==='blend-50')throw Error('synthetic pose-error')};
 const receipt=auditRealSourceGarmentArmPoses84(f);
 assert.equal(receipt.status,'UNVERIFIED_FAIL_CLOSED');
 assert.equal(receipt.actualPoseAuditCompleted,false);
 for(let i=0;i<f.bones.length;i++)assert.ok(f.bones[i].quaternion.equals(original[i]));
});


test('P84 accepts authentic 163-bone source extraction shells containing zero rendered triangles while auditing every remaining photo-derived triangle',()=>{
 const f=fixture(),shell=f.shirt.meshes[0].clone();
 shell.geometry=f.shirt.meshes[0].geometry.clone();
 shell.geometry.setIndex([]); // Work45-style exhausted source shoulder shell
 f.root.add(shell);f.shirt.meshes.push(shell);
 const receipt=auditRealSourceGarmentArmPoses84(f);
 assert.equal(receipt.actualPoseAuditCompleted,true,JSON.stringify(receipt));
 assert.equal(receipt.poseResults.length,3);
 assert.ok(receipt.poseResults.at(-1).shirtBodyCrossingTrianglePairs>0,
  'Real body contact must remain detectable through other indexed source shirt panels');
 assert.equal(receipt.releaseAuthorized,false);
});
test('P84 refuses all-zero-source-triangle meshes even if their source hashes and 163-joint skeletons appear plausible',()=>{
 const f=fixture();f.shirt.meshes[0].geometry.setIndex([]);
 const receipt=auditRealSourceGarmentArmPoses84(f);
 assert.equal(receipt.status,'UNVERIFIED_FAIL_CLOSED');
 assert.equal(receipt.reason,'shirt-all-real-source-garment-triangles-absent');
 assert.equal(receipt.actualPoseAuditCompleted,false);
});
