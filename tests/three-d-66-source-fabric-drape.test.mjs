/** 3D-66 genuine original photographed fabric and pose contact acceptance.
 * No physical phone certification or human visual grade is inferred.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
import {articulateOriginalUpperSleeveDrape} from '../research/three-d-66/original-sleeve-gravity-drape.mjs';
const options={
 poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true,
 tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,
 upperArmFabricVolume:true,sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,
 naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true,
 anatomicalShirtSideFlow:true,poseConditionedSleeveDrape:true,
 naturalShoulderFall61:true,trueShoulderTop64:true,sourceUpperSleeveDrape66:true
};
test('3D66 source operation is a no-op unless explicitly enabled',()=>{
 assert.equal(articulateOriginalUpperSleeveDrape(null,null,{enabled:false}),null);
 assert.throws(()=>articulateOriginalUpperSleeveDrape({},null),/requires real source/);
});
for(const kind of ['female','male'])for(const source of [A,B]){
 test('3D66 genuinely sewn original-photo gravity fabric upper arm '+kind+'/'+source.id,async()=>{
  const root=await person(kind),controller=createOutfitController(root,options);
  try{
   const state=controller.setOutfit('shirt-pants',candidate('shirt'),{
    reviewed:true,pantsCandidate:denim(source),pantsReviewed:true
   });
   const s=state.shirt;
   assert.equal(s.sourceArticulatedUpperSleeveDrape,true);
   assert.equal(s.trueSourceShoulderTopSlope,true);
   assert.ok(s.upperSleeveDrapeMovedOriginalVertices>=60);
   assert.ok(s.upperSleeveDrapeMaxMove>=.002&&s.upperSleeveDrapeMaxMove<=.01001);
   assert.ok(s.upperSleeveDrapeGravityTotal>=.02);
   assert.ok(s.upperSleeveDrapeSeamGap<=5e-5);
   for(const side of ['L','R']){
    assert.ok(s.upperSleeveDrapeBySide[side].capVertices>=10);
    assert.ok(s.upperSleeveDrapeBySide[side].shellVertices>=10);
    assert.ok(s.upperSleeveDrapeBySide[side].upperFold>=8);
    assert.ok(s.upperSleeveDrapeBySide[side].lowerFold>=8);
   }
   assert.equal(s.originalPhotoUVSkinAndColorUnmodified,true);
   assert.equal(s.upperSleeveDrapeShoulderJointsVerified,true);
   assert.equal(s.physicalPhonesApproved,false);
   assert.equal(s.continuousClothCollisionCertified,false);
   assert.equal(s.humanPhotorealismApproved,false);
   assert.equal(s.sourceSHA256,candidate('shirt').sourceSHA256);
   assert.equal(state.pants.sourceSHA256,source.originalSHA256);
   for(const pose of ['source','blend-50','relaxed']){
    const p=controller.setPose(pose);
    assert.equal(p.shirt.sourceArticulatedUpperSleeveDrape,true);
    assert.equal(p.shirt.poseTriangleContact.after.count,0,'Real skinned cloth/body intersections forbidden '+kind+'/'+source.id+'/'+pose);
    assert.equal(p.shirt.releaseAuthorized,false);
   }
   console.log('THREE_D66_REAL_UPPER_SLEEVE_DRAPE',JSON.stringify({
    kind,denim:source.id,moved:s.upperSleeveDrapeMovedOriginalVertices,
    max:s.upperSleeveDrapeMaxMove,gravity:s.upperSleeveDrapeGravityTotal,
    sourceUnchanged:s.originalPhotoUVSkinAndColorUnmodified,
    seam:s.upperSleeveDrapeSeamGap,phone:false,visual:false,release:false
   }));
   assert.equal(controller.setOutfit('none').garmentMeshes,0);
  }finally{controller.dispose();}
 });
}
