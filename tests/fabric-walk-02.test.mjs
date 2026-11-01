import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {WALK02,gait02Angles,createOriginal163BoneGait02}
 from '../research/fabric-walk-02/anatomical-gait-driver.mjs';

test('source-approved actual anatomical gait: conservative real hip, knee, pelvis degrees',()=>{
 assert.match(WALK02.sourceSHA256,/^[a-f0-9]{64}$/);
 assert.equal(WALK02.originalSkeletonBones,163);
 assert.equal(WALK02.sweptCollisionCertified,false);
 assert.equal(WALK02.releaseAuthorized,false);
 assert.equal(WALK02.maxHipDegrees,11);
 for(const p of [0,.1,.25,.5,.75,1]){
  const a=gait02Angles(p);
  assert.ok(Math.abs(a.pelvisYaw)<=2.5);
  assert.ok(Math.abs(a.leftHip)<=11&&Math.abs(a.rightHip)<=11);
  assert.ok(a.leftKnee>=0&&a.leftKnee<=12);
  assert.ok(a.rightKnee>=0&&a.rightKnee<=12);
  assert.equal(a.leftHip,-a.rightHip);
 }
 for(const v of [NaN,Infinity,-.01,1.01])assert.throws(()=>gait02Angles(v),/phase/);
});
test('actual 163 bones receive animation, fully restore original quaternion bytes, and revoke on disposal',()=>{
 const root=new THREE.Group(),bones=[];
 for(let i=0;i<163;i++){
  const b=new THREE.Bone();b.name=['pelvis','upperleg01L','upperleg01R','lowerleg01L','lowerleg01R'][i]||'joint'+i;
  bones.push(b);root.add(b);
 }
 const mesh=new THREE.SkinnedMesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshBasicMaterial());
 mesh.bind(new THREE.Skeleton(bones));root.add(mesh);
 const initial=bones.map(b=>b.quaternion.toArray());
 const driver=createOriginal163BoneGait02(root);
 const left=driver.sample(.25),leftQ=bones.map(b=>b.quaternion.toArray());
 assert.equal(left.original163BoneRig,true);
 assert.ok(left.changedBoneCount>=3);
 assert.notDeepEqual(leftQ,initial);
 const right=driver.sample(.75);
 assert.equal(right.originalSkinnedBodies,1);
 assert.notDeepEqual(bones.map(b=>b.quaternion.toArray()),leftQ);
 const again=driver.sample(.25);
 assert.deepEqual(bones.map(b=>b.quaternion.toArray()),leftQ,'repeated pose never accumulates quaternion drift');
 assert.equal(again.photoAndSkinWeightsUntouched,true);
 driver.reset();
 assert.deepEqual(bones.map(b=>b.quaternion.toArray()),initial);
 driver.sample(.75);driver.dispose();
 assert.deepEqual(bones.map(b=>b.quaternion.toArray()),initial,'logout/swap/dispose restores exact original anatomical rig');
 assert.throws(()=>driver.sample(.25),/detached/);
 assert.throws(()=>createOriginal163BoneGait02(root,{sourceSHA256:'0'.repeat(64)}),/Source-vetted/);
});
test('integration opt-in is default OFF, current synthetic owner + source dress mandatory, no sibling or production',()=>{
 const dir='research/fabric-walk-02/';
 const html=readFileSync(dir+'index.html','utf8'),
  app=readFileSync(dir+'wardrobe-demo.mjs','utf8'),
  viewer=readFileSync(dir+'dress-mobile-showroom.mjs','utf8'),
  ctrl=readFileSync(dir+'dress-outfit-controller.mjs','utf8');
 for(const id of ['walk-left','walk-right','walk-reset','walk-play','walk-stop','walk-audit'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(app.includes("get('walk')==='after'"));
 assert.ok(app.includes("last3D.originalPhotoSHA256s?.dress===SYNTHETIC_SOURCES10.dress.sha"));
 assert.ok(app.includes("bound.indexed.byId.get(slots.top)?.category==='Dresses'"));
 assert.ok(app.includes("app.getState().stats?.bones===163"));
 assert.ok(viewer.includes('poseDrivenDressWalk02=false'));
 for(const token of ['haltGait02','createOriginal163BoneGait02','setGaitPhase02','resetGait02','auditGaitDress02','startGait02'])
  assert.ok(viewer.includes(token),token);
 assert.ok(ctrl.includes('skirtSecondaryMotion01=false'));
 assert.ok(app.includes("from '../integration-04-wardrobe-dress/account-source-bridge.mjs'"));
 assert.doesNotMatch(app,/supabase\.auth|createClient\(|localStorage\.setItem\(/);
});
