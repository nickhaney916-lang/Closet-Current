/** 3D-66 source-authentic bone-driven upper-sleeve drape regression.
 * Original-source offline shirt fixture SHA vs REAL reviewed photo hash are
 * deliberately checked in separate fixtures/browser acceptance pipelines.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
import {drapeSourceUpperSleeveFabric} from '../research/three-d-66/source-upper-sleeve-fabric-drape.mjs';
const config={
 poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true,
 tailoredShoulderSleeves:true,independentShoulderCaps:true,realisticShoulderContour:true,
 upperArmFabricVolume:true,sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,
 naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true,poseConditionedSleeveDrape:true,
 anatomicalShirtSideFlow:true,naturalShoulderFall61:true,trueShoulderTop64:true
};
test('3D66 disabled does not synthesize or modify any garment',()=>{
 assert.equal(drapeSourceUpperSleeveFabric(null,null,{enabled:false}),null);
 assert.throws(()=>drapeSourceUpperSleeveFabric({},null),/3D66 needs/);
});
for(const kind of ['female','male'])for(const source of [A,B]){
 test('3D66 real source original-upperarm cloth folds '+kind+'/'+source.id,async()=>{
  const root=await person(kind);
  const control=createOutfitController(root,{...config,upperSleeveGravityDrape66:true});
  try{
   const outfit=control.setOutfit('shirt-pants',candidate('shirt'),{
    reviewed:true,pantsCandidate:denim(source),pantsReviewed:true
   });
   const g=outfit.shirt;
   assert.equal(g.actualUpperSleeveGravityDrape,true);
   assert.ok(g.upperSleeveDrapeRealMovedVertices>=40);
   assert.ok(g.upperSleeveDrapeMaximumMove>=.001&&g.upperSleeveDrapeMaximumMove<=.01301);
   assert.ok(g.upperSleeveDrapeRealSeamGap<=5e-5);
   assert.ok(g.upperSleeveDrapeProtectedPhotoCenterVertices>=100);
   for(const side of ['L','R']){
    assert.ok(g.upperSleeveDrapeBySide[side].moved>=20);
    assert.ok(g.upperSleeveDrapeBySide[side].foldNear>=8);
    assert.ok(g.upperSleeveDrapeBySide[side].foldFar>=8);
    assert.ok(g.upperSleeveDrapeRealCapTorsoWitnesses[side]>=3);
   }
   assert.equal(g.originalPhotographicPixelsUVAndSkinUnchanged,true);
   assert.equal(g.sourceSHA256,candidate('shirt').sourceSHA256);
   assert.equal(outfit.pants.sourceSHA256,source.originalSHA256);
   assert.equal(g.humanPhotorealismApproved,false);
   assert.equal(g.physicalAndroidIphoneCertified,false);
   assert.equal(g.releaseAuthorized,false);
   for(const pose of ['source','blend-50','relaxed']){
    const state=control.setPose(pose);
    assert.equal(state.shirt.actualUpperSleeveGravityDrape,true);
    assert.equal(state.shirt.poseTriangleContact.after.count,0,
     'Do not accept photo-real soft folds with actual skinned body/denim crossing in pose '+pose);
    assert.equal(state.shirt.releaseAuthorized,false);
   }
   console.log('3D66_REAL_SOURCE_UPPERARM_FOLDS',JSON.stringify({
    kind,denim:source.id,vertices:g.upperSleeveDrapeRealMovedVertices,
    maxMove:g.upperSleeveDrapeMaximumMove,seam:g.upperSleeveDrapeRealSeamGap,
    sides:g.upperSleeveDrapeBySide,release:false,humanApproved:false
   }));
   assert.equal(control.setOutfit('none').garmentMeshes,0);
  }finally{control.dispose();}
 });
}
