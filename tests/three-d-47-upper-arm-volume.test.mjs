import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const hash=v=>createHash('sha256').update(Buffer.from(v.buffer,v.byteOffset,v.byteLength)).digest('hex');
const inventory=root=>{
 const body=[],pants=[],shirt=[];
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;
  const p=m.geometry.getAttribute('position');
  if(!m.userData.work56Garment){body.push(hash(p.array));return;}
  if(m.userData.work60Pants){pants.push(hash(p.array));return;}
  shirt.push({name:m.name,p:p.array.slice(),protected:Object.fromEntries(['panelPosition','panelNormal','skinIndex','skinWeight'].map(n=>[n,hash(m.geometry.getAttribute(n).array)]))});
 });
 return {body,pants,shirt};
};
for(const kind of ['female','male'])for(const source of [A,B])test('3D47 source-neutral realistic garment shoulder contour '+kind+' '+source.id,async()=>{
 const rootBefore=await person(kind),rootAfter=await person(kind);
 const options={jeansPanelFall:true,independentGarments:true,tailoredShoulderSleeves:true,independentShoulderCaps:true,poseContactFactory:createPoseContact};
 const before=createOutfitController(rootBefore,{...options,realisticShoulderContour:true}),after=createOutfitController(rootAfter,{...options,realisticShoulderContour:true,upperArmFabricVolume:true});
 try{
  const args={reviewed:true,pantsCandidate:denim(source),pantsReviewed:true};
  const base=before.setOutfit('shirt-pants',candidate('shirt'),args),tailored=after.setOutfit('shirt-pants',candidate('shirt'),args);
  assert.equal(base.shirt.independentShoulderClothContour,true);
  assert.equal(base.shirt.upperArmFabricVolumeTailored,undefined);
  assert.equal(tailored.shirt.upperArmFabricVolumeTailored,true);
  assert.ok(tailored.shirt.upperArmFabricEditedVertices>50);
  assert.ok(tailored.shirt.upperArmFabricDepthMoves>15);
  assert.ok(tailored.shirt.upperArmFabricMaxMove>.006&&tailored.shirt.upperArmFabricMaxMove<.023);
  assert.ok(tailored.shirt.upperArmFabricSeamGap<=5e-5);
  assert.ok(tailored.shirt.upperArmFabricBySide.L.caps>10&&tailored.shirt.upperArmFabricBySide.R.caps>10);
  // 3D52 regression: original narrow cap profile was collision-safe on the
  // pinned male fixture; widening it created 176 *real* source-pose crossings.
  // Female source caps had zero narrow-window candidates, requiring recovery.
  const expectedRecovery=kind==='female';
  assert.deepEqual(tailored.shirt.upperArmFabricAdaptiveCapRecoverySides,
   {L:expectedRecovery,R:expectedRecovery},
   'Use true source-cap coverage to choose each sleeve envelope, never widen an already covered cap');
  for(const side of ['L','R']){
   const candidates=tailored.shirt.upperArmFabricOriginalCapCandidates[side];
   assert.ok(Number.isInteger(candidates)&&candidates>=0,'Actual untouched source-cap candidates measured');
   assert.equal(candidates<10,expectedRecovery,
    'Existing cap candidates and adaptive source-true silhouette decision must agree');
  }
  assert.ok(tailored.shirt.upperArmFabricProtectedFrontVertices>100);
  assert.equal(tailored.shirt.originalPhotographicSourceAndPanelCoordinatesUnchanged,true);
  assert.equal(tailored.shirt.signedVolumeContainmentCertified,false);
  assert.equal(tailored.shirt.independentShoulderClothContour,true);
  assert.equal(tailored.shirt.independentArmholeCapPanels,true);
  assert.ok(tailored.shirt.realSeparateSkinnedCapMeshes>=2);
  assert.ok(tailored.shirt.shoulderContourEditedVertices>80);
  assert.ok(tailored.shirt.shoulderContourMaximumMove>.008&&tailored.shirt.shoulderContourMaximumMove<=.047);
  assert.ok(tailored.shirt.shoulderContourMaximumSeamGap<=5e-5);
  assert.ok(tailored.shirt.shoulderContourBySide.L.capVertices>20&&tailored.shirt.shoulderContourBySide.R.capVertices>20);
  assert.ok(tailored.shirt.shoulderContourBySide.L.torsoVertices>10&&tailored.shirt.shoulderContourBySide.R.torsoVertices>10);
  assert.ok(tailored.shirt.shoulderContourProtectedFrontVertices>100);
  assert.equal(tailored.shirt.originalPhotographicSourcePixelsAndUVUnchanged,true);
  assert.equal(tailored.shirt.originalShirtRigWeightsUnchanged,true);
  assert.equal(tailored.shirt.continuousSweptCollisionValidated,false);
  assert.equal(tailored.shirt.releaseAuthorized,false);
  assert.equal(tailored.pants.sourceSHA256,source.originalSHA256);
  const a=inventory(rootBefore),b=inventory(rootAfter);
  assert.deepEqual(a.body,b.body,'Original anatomical source model geometry untouched');
  assert.deepEqual(a.pants,b.pants,'Real original photographed jeans topology and source untouched');
  assert.equal(a.shirt.length,b.shirt.length);
  let movement=0;
  for(let i=0;i<a.shirt.length;i++){
   assert.equal(a.shirt[i].name,b.shirt[i].name);
   assert.deepEqual(a.shirt[i].protected,b.shirt[i].protected,'Original source photographic coordinates and original rig skin weights immutable');
   for(let j=0;j<a.shirt[i].p.length;j++)if(Math.abs(a.shirt[i].p[j]-b.shirt[i].p[j])>.0001)movement++;
  }
  assert.ok(movement>50,'Physical garment shoulder silhouette must actually change');
  for(const pose of ['source','blend-25','blend-50','blend-75','relaxed','blend-50']){
   const state=after.setPose(pose);
   assert.equal(state.shirt.poseTriangleContact.after.count,0,'Actual posed garment/body collisions '+kind+'/'+pose);
   assert.equal(state.shirt.poseTriangleContact.fullCollisionValidated,false);
  }
  assert.equal(after.setOutfit('none').garmentMeshes,0);
  console.log('THREE_D47_SOURCE_NEUTRAL_UPPER_ARM_VOLUME',JSON.stringify({kind,denim:source.id,movement,max:tailored.shirt.shoulderContourMaximumMove,seamGap:tailored.shirt.shoulderContourMaximumSeamGap}));
 }finally{before.dispose();after.dispose();}
});
