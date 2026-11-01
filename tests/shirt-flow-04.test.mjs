import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {shapeGravityRespondingSleeveFolds} from '../research/shirt-flow-03/gravity-fabric-folds.mjs';
import {readFileSync} from 'node:fs';
import {CONTINUOUS_ARM_RESEARCH,verifiedArmFraction,setResearchPose}
 from '../research/shirt-flow-02/continuous-arm-pose.mjs';
test('17 bounded deterministic original photo arm poses; no arbitrary continuous cloth claims',()=>{
 assert.deepEqual(CONTINUOUS_ARM_RESEARCH.fractions,Array.from({length:17},(_,i)=>i/16));
 for(const phase of CONTINUOUS_ARM_RESEARCH.fractions)assert.equal(verifiedArmFraction(phase),phase);
 for(const phase of [NaN,Infinity,-1,1.001,.01,.225,.31,2,null,'0.5'])
  assert.throws(()=>verifiedArmFraction(phase),/Only 17/);
 assert.equal(CONTINUOUS_ARM_RESEARCH.releaseAuthorized,false);
 assert.equal(CONTINUOUS_ARM_RESEARCH.sweptCollisionCertified,false);
});
test('original skeletal quaternions interpolate and exactly reset without drift',()=>{
 const root=new T.Group(),bones=[];
 for(let i=0;i<163;i++){
  const b=new T.Bone();b.name=[
   'upperarm01L','lowerarm01L','wristL','upperarm01R','lowerarm01R','wristR'][i]||'spare'+i;
  b.quaternion.setFromAxisAngle(new T.Vector3(0,0,1),i*.0002);
  root.add(b);bones.push(b);
 }
 const base=bones.map(x=>x.quaternion.toArray());
 const source=setResearchPose(root,0);
 assert.equal(source.bones,163);
 const original=bones.map(x=>x.quaternion.toArray());
 setResearchPose(root,1);
 const relaxed=bones.map(x=>x.quaternion.toArray());
 assert.notDeepEqual(relaxed,original);
 for(const phase of CONTINUOUS_ARM_RESEARCH.fractions){
  const report=setResearchPose(root,phase);
  assert.equal(report.fraction,phase);
  assert.equal(report.releaseAuthorized,false);
  for(let i=0;i<bones.length;i++){
   const expected=new T.Quaternion().fromArray(original[i]).slerp(new T.Quaternion().fromArray(relaxed[i]),phase);
   assert.ok(expected.angleTo(bones[i].quaternion)<1e-6);
  }
 }
 setResearchPose(root,0);
 assert.deepEqual(bones.map(x=>x.quaternion.toArray()),base);
 setResearchPose(root,'source');
 assert.deepEqual(bones.map(x=>x.quaternion.toArray()),base);
});
test('new viewer isolate consumes its own real continuous contact solver, not a fake animated screenshot',()=>{
 const view=readFileSync('research/shirt-flow-04/photo-jeans-demo.mjs','utf8');
 const ctl=readFileSync('research/shirt-flow-04/outfit-controller.mjs','utf8');
 const contact=readFileSync('research/shirt-flow-02/posed-contact.mjs','utf8');
 const solver=readFileSync('research/shirt-flow-04/pose-conditioned-sleeves.mjs','utf8');
 const html=readFileSync('research/shirt-flow-04/index.html','utf8');
 for(const part of ["new URLSearchParams(location.search).get('smoothFlow')!=='after'",
  'window.ccShirtFlow02=fraction','window.ccShirtFlowPlay02=','e.isTrusted',
  'assertVerifiedShirtPose01(app.getState(),shirt.sourceSHA256)'])assert.ok(view.includes(part),part);
 for(const part of ["from './continuous-arm-pose.mjs'","createPoseContact","triangleContacts","applyBoneTransform"])assert.ok(contact.includes(part),part);
 assert.ok(ctl.includes("from './pose-conditioned-sleeves.mjs'"));
 assert.ok(solver.includes("from '../shirt-flow-02/continuous-arm-pose.mjs'"));
 assert.ok(html.includes('id="arm-progress"'));
 assert.ok(view.includes("new URLSearchParams(location.search).get('fabricFlow')==='after'"));
 assert.ok(view.includes('window.ccShirtFlow03=fraction'));
 assert.ok(view.includes('window.ccShirtFlow04=fraction'));
 assert.ok(view.includes("new URLSearchParams(location.search).get('torsoFlow')==='after'"));
 assert.ok(ctl.includes('torsoDrape04'));
 assert.ok(solver.includes('shapeSourceTrueYokeTorsoFlow(root,shirt)'));
 assert.ok(solver.includes('shirt.stats.sourceTorsoDrape04=torso'));
 const body=readFileSync('research/shirt-flow-04/source-torso-drape.mjs','utf8');
 for(const term of ['163','panelPosition','panelNormal','uv','skinWeight',"m.name==='Work56-independent-shirt-shell'",'sides:stats','realPoseResponse:true','protectedSeam'])assert.ok(body.includes(term),term);
 assert.ok(ctl.includes('gravityFabricFlow'));
 assert.ok(solver.includes('shapeGravityRespondingSleeveFolds(root,shirt)'));
 assert.ok(solver.includes("from '../shirt-flow-03/gravity-fabric-folds.mjs'"));
 assert.ok(solver.includes('shirt.stats.gravitationalFabricResponse=gravity'));
 assert.equal(typeof shapeGravityRespondingSleeveFolds,'function');
 assert.throws(()=>shapeGravityRespondingSleeveFolds(new T.Group(),{}),/Only verified original/);
 const folds=readFileSync('research/shirt-flow-03/gravity-fabric-folds.mjs','utf8');
 for(const term of ['163','skinWeight','skinIndex','originalRGBUVAndSkinUnmodified','sourceMeasuredNaturalSleeveHang',"m.name==='Work56-independent-shirt-shell'",'smoothSurfaceNormals'])assert.ok(folds.includes(term),'Source-truth prerequisite '+term);
 assert.doesNotMatch(view,/createClient\(|supabase\.auth|localStorage\.setItem\(/);
});
