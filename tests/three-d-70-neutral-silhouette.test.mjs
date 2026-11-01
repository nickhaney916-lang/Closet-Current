import test from 'node:test';
import assert from 'node:assert/strict';
import {person} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {fairNeutralAnatomicalLegSilhouette} from '../research/three-d-70/neutral-anatomical-leg-fairing.mjs';
test('3D70 opt-in no-op and strict neutral source only',()=>{
 assert.equal(fairNeutralAnatomicalLegSilhouette(null,null,{enabled:false}),null);
 assert.throws(()=>fairNeutralAnatomicalLegSilhouette({},null),/neutral-only/);
});
for(const kind of ['female','male']){
 test('3D70 measured original anatomical neutral leg surface '+kind,async()=>{
  const root=await person(kind),controller=createOutfitController(root,{
    premiumNeutralSilhouette70:true,
    independentGarments:false
  });
  try{
   const before=controller.getState();
   assert.equal(before.mode,'none');
   const s=controller.setOutfit('pants');
   assert.equal(s.pants.photoApplied,false);
   assert.equal(s.pants.naturalNeutralSilhouette70,true);
   assert.equal(s.pants.neutralContourOriginalSkinAndRestUnchanged,true);
   assert.equal(s.pants.sourceSHA256,null);
   assert.ok(s.pants.neutralContourMovedVertices>=80);
   assert.ok(s.pants.neutralContourUpperLegVertices>=30);
   assert.ok(s.pants.neutralContourLowerLegVertices>=30);
   assert.ok(s.pants.neutralContourMaxMotion<=.01301);
   assert.equal(s.pants.neutralContourPhotographedGarmentApplied,false);
   assert.equal(s.pants.neutralContourHumanAestheticApproved,false);
   assert.equal(s.releaseAuthorized,false);
   for(const pose of ['source','relaxed']){
    const posed=controller.setPose(pose);
    assert.equal(posed.pants.naturalNeutralSilhouette70,true);
    assert.equal(posed.pants.neutralContourOriginalSkinAndRestUnchanged,true);
   }
   console.log('THREE_D70_NEUTRAL_163_JOINT_PANT_FAIRING',JSON.stringify({
    kind,moved:s.pants.neutralContourMovedVertices,
    upper:s.pants.neutralContourUpperLegVertices,
    lower:s.pants.neutralContourLowerLegVertices,
    maxMove:s.pants.neutralContourMaxMotion,
    bodyLimited:s.pants.neutralContourBodyLimited,
    measuredRings:s.pants.measuredNeutralLegRings,
    humanVisualApproval:false,physicalPhones:false,release:false
   }));
   controller.setOutfit('none');
  }finally{controller.dispose();}
 });
}
test('3D70 default false leaves proven original 3D67 neutral pants untouched',async()=>{
 const root=await person('female'),controller=createOutfitController(root);
 try{
  const s=controller.setOutfit('pants');
  assert.equal(s.pants.naturalNeutralSilhouette70,undefined);
  assert.equal(s.pants.photoApplied,false);
  assert.equal(s.releaseAuthorized,false);
 }finally{controller.dispose();}
});
