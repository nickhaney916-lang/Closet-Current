import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIRT_FLOW01,armPoseAt01,assertVerifiedShirtPose01,createArmPoseCycle01}
 from '../research/shirt-flow-01/arm-motion-gate.mjs';

test('source photographed original shirt on exactly five true anatomical upper-arm/elbow poses',()=>{
 assert.equal(SHIRT_FLOW01.approvedSourceId,'commons-0003');
 assert.equal(SHIRT_FLOW01.requiredRigBones,163);
 assert.equal(SHIRT_FLOW01.defaultOff,true);
 assert.equal(SHIRT_FLOW01.continuousClothPhysicsCertified,false);
 for(let i=0;i<5;i++)assert.equal(armPoseAt01(i/4),SHIRT_FLOW01.allowedPoses[i]);
 for(const n of [NaN,Infinity,-.25,.125,.375,.625,.875,1.01])
  assert.throws(()=>armPoseAt01(n),/five reviewed/);
});
test('exact original photo SHA, independently skinned shirt and zero real posed crossings required',()=>{
 const sha='a'.repeat(64);
 const valid={loaded:true,stats:{bones:163},outfit:{mode:'shirt-pants',
  shirt:{sourceSHA256:sha,sourceMeasuredNaturalSleeveHang:true,
   poseConditionedSleeveDrape:{maximum:.006},poseTriangleContact:{after:{count:0}}}}};
 assert.equal(assertVerifiedShirtPose01(valid,sha).realPosedSleeveFabric,true);
 assert.throws(()=>assertVerifiedShirtPose01(valid,'b'.repeat(64)),/Exact genuine/);
 assert.throws(()=>assertVerifiedShirtPose01({...valid,stats:{bones:162}},sha),/Exact genuine/);
 assert.throws(()=>assertVerifiedShirtPose01({...valid,outfit:{...valid.outfit,mode:'dress'}},sha),/Exact genuine/);
 assert.throws(()=>assertVerifiedShirtPose01({...valid,outfit:{...valid.outfit,
  shirt:{...valid.outfit.shirt,poseTriangleContact:{after:{count:1}}}}},sha),/Exact genuine/);
});
test('pose cycle reversible, bounded and retired on garment swap/logout',()=>{
 const cycle=createArmPoseCycle01();
 assert.deepEqual(Array.from({length:5},()=>cycle.step().pose),SHIRT_FLOW01.allowedPoses);
 assert.equal(cycle.step().pose,'source');
 cycle.reset();assert.equal(cycle.state().ticks,0);
 cycle.dispose();assert.throws(()=>cycle.step(),/closed/);
});
test('research viewer retains protected source, review gate, original source photo and locally opt-in',()=>{
 const demo=readFileSync('research/shirt-flow-01/photo-jeans-demo.mjs','utf8');
 const viewer=readFileSync('research/shirt-flow-01/showroom.mjs','utf8');
 const controller=readFileSync('research/shirt-flow-01/outfit-controller.mjs','utf8');
 const shirtSolver=readFileSync('research/three-d-56/pose-conditioned-sleeves.mjs','utf8');
 const html=readFileSync('research/shirt-flow-01/index.html','utf8');
 assert.ok(demo.includes("get('shirtFlow')==='after'"));
 assert.ok(demo.includes("get('move56')==='after'"));
 assert.ok(demo.includes("get('construction')==='after'"));
 assert.ok(demo.includes("e.isTrusted")&&demo.includes("sourceSHA256"));
 assert.ok(demo.includes('assertVerifiedShirtPose01(app.getState(),shirt.sourceSHA256)'));
 assert.ok(demo.includes('stopArms();'));
 assert.ok(viewer.includes('poseConditionedSleeveDrape'));
 assert.ok(controller.includes('createPoseConditionedSleeveContact'));
 for(const x of ['setResearchPose','shapePosedSleeveEase','original','skeleton','skinIndex','skinWeight'])
  assert.ok(shirtSolver.includes(x)||controller.includes(x),'Missing true photographed original-skin sleeve drape '+x);
 for(const id of ['arm-source','arm-quarter','arm-half','arm-threequarter','arm-relaxed','arm-play','arm-stop'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.doesNotMatch(demo,/supabase\.auth|createClient\(|localStorage\.setItem\(/);
});
