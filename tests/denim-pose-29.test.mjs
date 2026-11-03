import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {POSE29,decideDenimPose29 as decide} from '../research/denim-pose-29/source-locked-pose-state-29.mjs';
const sha='a'.repeat(64),base={pose:'left-12',previous:{phase:'SOURCE_FIT_RESTORED',
 sourceSHA256:sha,resumePending:false},restFitWasFrozen:true,
 originalSourceSHA256:sha,originalPhotoPreserved:true,realKneeContactCount:0};
test('P29 does not silently call unverified knee-bend cloth the P28 fitted garment',()=>{
 for(const pose of ['left-12','right-12','both-16']){
  const v=decide({...base,pose});
  assert.equal(v.phase,'BENT_SOURCE_ONLY');assert.equal(v.fitVisible,false);
  assert.equal(v.resumePending,true);
  assert.equal(v.modeledBackNotPhotographed,true);
 }
 assert.equal(POSE29.bentRestFitApproval,false);
 assert.equal(POSE29.releaseAuthorized,false);
});
test('P29 source-rest return is NEVER approved without original SHA and real BVH recertification',()=>{
 const bent=decide(base);
 const unapproved=decide({...base,pose:'source',previous:bent,restFitWasFrozen:false});
 assert.equal(unapproved.phase,'SOURCE_UNFITTED_REVIEW');
 assert.equal(unapproved.fitVisible,false);
 const proof={originalPhotoSHA256:sha,sourceJPEGUVSkinRestProtected28:true,
  sourceNeutralSeamFlow28:true,bodyContactBefore:0,bodyContactAfter:0,
  trueBVHBodyContactNoNew:true};
 const recovered=decide({...base,pose:'source',previous:bent,restFitWasFrozen:false,
  restRecoveryProof:proof});
 assert.equal(recovered.phase,'SOURCE_FIT_RESTORED');
 assert.equal(recovered.fitVisible,true);assert.equal(recovered.resumePending,false);
 for(const change of [
  p=>p.originalPhotoSHA256='b'.repeat(64),
  p=>p.sourceJPEGUVSkinRestProtected28=false,
  p=>p.sourceNeutralSeamFlow28=false,
  p=>p.trueBVHBodyContactNoNew=false,
  p=>p.bodyContactAfter=1,
  p=>p.bodyContactBefore=undefined,
  p=>p.bodyContactAfter=NaN,
 ]){let p={...proof};change(p);assert.throws(()=>decide({...base,pose:'source',previous:bent,restFitWasFrozen:false,restRecoveryProof:p}),/P29/);}
});
test('P29 fail-closed on fake identity, unsupported pose or actual body collision',()=>{
 for(const patch of [
 {pose:'jump'}, {pose:'blend-4'}, {originalPhotoPreserved:false},
 {realKneeContactCount:1},{realKneeContactCount:-1},
 {originalSourceSHA256:'x'},{previous:{sourceSHA256:'b'.repeat(64)}},
 ])assert.throws(()=>decide({...base,...patch}),/P29/);
});
test('P29 research opt-in is guarded in real outfit pose controller',()=>{
 const path='research/fabric-sweep-04/dress-outfit-controller.mjs';
 const s=readFileSync(path,'utf8');
 const demo=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 assert.ok(s.includes('sourceDenimPoseGuard29&&(!sourceDenimFlow28||!photoDenimFlex79||!photoDenimKneePose78||!staticDenimFit06)'));
 assert.ok(s.includes('decideDenimPose29'));
 assert.ok(s.includes('staticFit06.freeze()'));
 assert.ok(s.includes('denimPose29:poseGuard29'));
 assert.ok(demo.includes("get('denimPose29')==='after'"));
 assert.ok(demo.includes('window.ccWardrobePoseProbe29'));
 const guard=readFileSync('research/denim-pose-29/source-locked-pose-state-29.mjs','utf8');
 for(const bad of ['fetch(', 'new Image(', 'texture2D(', 'Math.random(', 'indexedDB.'])
  assert.ok(!guard.includes(bad));
});
