import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {settleAndFreeze09,SETTLE09} from '../research/shirt-flow-09/settle-and-freeze.mjs';
function spring(){
 let pose=0,lastPose=0,velocity=0,displacement=0,steps=0;
 return {
  tick(target){
   const difference=target-lastPose;
   velocity=Math.max(-.006,Math.min(.006,.70*velocity-.24*displacement-difference*.013));
   displacement=Math.max(-.008,Math.min(.008,displacement+velocity));
   pose=target;lastPose=target;steps++;
   return {contact:{after:{count:0}},motion:{velocity,displacement},
    photoAndSkinPreserved:true};
  },
  getState:()=>({pose,velocity,displacement,steps})
 };
}
test('F09 converges deterministically then freezes once, no playback loop',()=>{
 const run=()=>{const physics=spring();let freezes=0;
  const proof=settleAndFreeze09({pose:.5,step:p=>physics.tick(p),
   freeze:result=>{freezes++;assert.equal(result.pose,.5);}});
  assert.equal(freezes,1);assert.equal(proof.frozenSourcePhotographed3DMesh,true);
  assert.equal(proof.bodyTriangleContactVerifiedEachStep,true);
  assert.equal(proof.sourcePhotoUVAndSkinPreserved,true);
  assert.equal(proof.dynamicPlaybackRequired,false);
  assert.equal(proof.releaseAuthorized,false);
  assert.ok(proof.steps>=10&&proof.steps<=SETTLE09.maxSteps);
  assert.ok(Math.abs(physics.getState().velocity)<=SETTLE09.maxVelocityMetersPerStep);
  assert.ok(Math.abs(physics.getState().displacement)<=SETTLE09.maxOffsetMeters);
  return proof;};
 assert.deepEqual(run(),run(),'Same fixed sampled pose must reach identical frozen result');
});
test('Reject crossing body triangles, mutable photographs, invalid pose and unstable cloth',()=>{
 const base={pose:.5,freeze:()=>{}};
 assert.throws(()=>settleAndFreeze09({...base,step:()=>({
  contact:{after:{count:1}},motion:{velocity:0,displacement:0},photoAndSkinPreserved:true
 })}),/body-contact/);
 assert.throws(()=>settleAndFreeze09({...base,step:()=>({
  contact:{after:{count:0}},motion:{velocity:0,displacement:0},photoAndSkinPreserved:false
 })}),/photographed/);
 assert.throws(()=>settleAndFreeze09({...base,pose:.1,step:()=>{}}),/17 skeletal/);
 assert.throws(()=>settleAndFreeze09({...base,step:()=>({
  contact:{after:{count:0}},motion:{velocity:.005,displacement:.008},photoAndSkinPreserved:true
 }),settings:{maxSteps:8,requiredStableFrames:2}}),/failed to settle/);
});
test('Actual original photo cloth contact and viewer are wired for on-demand frozen fitting',()=>{
 const m=readFileSync('research/shirt-flow-08/pose-conditioned-sleeves.mjs','utf8');
 const controller=readFileSync('research/shirt-flow-08/outfit-controller.mjs','utf8');
 const room=readFileSync('research/shirt-flow-08/showroom.mjs','utf8');
 const view=readFileSync('research/shirt-flow-08/photo-jeans-demo.mjs','utf8');
 for(const term of ['settleAndFreeze09','temporal.reset();fit(0);fit(pose)','contact:shirt.stats.poseTriangleContact',
  'frozen={pose,meshes:capture()','if(frozen&&frozen.pose===pose)'])
  assert.ok(m.includes(term),term);
 assert.ok(controller.includes('function settlePose(next)'));
 assert.ok(room.includes('const settlePose=phase=>'));
 assert.ok(view.includes('window.ccShirtFitFreeze09=fraction=>'));
 assert.ok(view.includes("get('settleFit')!=='after'"));
 assert.ok(view.includes('detail.poseTriangleContact.after.count!==0'));
});
