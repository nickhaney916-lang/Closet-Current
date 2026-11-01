/** Real independent 3D64 shoulder-top cloth source regression.
 * Four original 163-bone rig x licensed denim combinations; no private photos.
 * Geometry and sampled posed contact are necessary, not photorealism approval.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
import {slopeTruePhotographedShoulderTop} from '../research/three-d-64/source-shoulder-top-slope.mjs';
const base={
 poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true,
 tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,
 upperArmFabricVolume:true,sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,
 naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true,
 anatomicalShirtSideFlow:true,poseConditionedSleeveDrape:true,naturalShoulderFall61:true
};
test('3D64 operator disabled returns original immutable object',()=>{
 assert.equal(slopeTruePhotographedShoulderTop(null,null,{enabled:false}),null);
});
for(const kind of ['female','male'])for(const src of [A,B]){
 test('3D64 source-true high shoulder crest, real skin and bilateral physical seam '+kind+'/'+src.id,async()=>{
  const root=await person(kind),controller=createOutfitController(root,{...base,trueShoulderTop64:true});
  try{
   const state=controller.setOutfit('shirt-pants',candidate('shirt'),{
    reviewed:true,pantsCandidate:denim(src),pantsReviewed:true
   });
   const s=state.shirt;
   assert.equal(s.trueSourceShoulderTopSlope,true);
   assert.equal(s.sourceRigNaturalShoulderFall,true);
   assert.ok(s.shoulderTopMovedOriginalRenderedVertices>=30);
   assert.ok(s.shoulderTopNearRealBoneHeightVertices>=15);
   assert.ok(s.shoulderTopMaximumWorldMove>=.005&&s.shoulderTopMaximumWorldMove<=.02801);
   assert.ok(s.shoulderTopOriginalPhotoFrontProtected>=100);
   assert.ok(s.shoulderTopSeamGap<=5e-5);
   for(const side of ['L','R']){
    assert.ok(s.shoulderTopBySide[side].caps>=5);
    assert.ok(s.shoulderTopBySide[side].shells>=5);
    assert.ok(s.shoulderTopSewnCapTorsoSeamWitnesses[side]>=3);
   }
   assert.equal(s.originalSourcePhotographUVAndSkinBytesIdentical,true);
   assert.equal(s.humanPhotorealismApproved,false);
   assert.equal(s.releaseAuthorized,false);
   assert.equal(s.sourceSHA256,candidate('shirt').sourceSHA256);
   assert.equal(state.pants.sourceSHA256,src.originalSHA256);
   for(const pose of ['source','blend-50','relaxed']){
    const p=controller.setPose(pose);
    assert.equal(p.shirt.trueSourceShoulderTopSlope,true);
    assert.equal(p.shirt.poseTriangleContact.after.count,0);
    assert.equal(p.shirt.releaseAuthorized,false);
   }
   console.log('THREE_D64_REAL_UPPER_SHOULDER_CREST',JSON.stringify({
    kind,denim:src.id,vertices:s.shoulderTopMovedOriginalRenderedVertices,
    highLandmark:s.shoulderTopNearRealBoneHeightVertices,max:s.shoulderTopMaximumWorldMove,
    bySide:s.shoulderTopBySide,seam:s.shoulderTopSeamGap,humanApproved:false,release:false}));
   assert.equal(controller.setOutfit('none').garmentMeshes,0);
  }finally{controller.dispose();}
 });
}
