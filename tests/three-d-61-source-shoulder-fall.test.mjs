/** 3D-61: prove real licensed photograph shoulder geometry moved, original
 * 163-bone female/male figures + 2 independent licensed denim sources.
 * An automated geometry test is NOT human photorealistic acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
import {easePhotographedShoulderFall} from '../research/three-d-61/source-rig-shoulder-fall.mjs';
const options={
 poseContactFactory:createPoseContact,jeansPanelFall:true,independentGarments:true,
 tailoredShoulderSleeves:true,independentShoulderCaps:true,
 realisticShoulderContour:true,upperArmFabricVolume:true,
 sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,
 naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true,
 anatomicalShirtSideFlow:true,poseConditionedSleeveDrape:true
};
const attrs=['panelPosition','panelNormal','skinIndex','skinWeight','uv'];
test('3D61 disabled truly returns source object untouched',()=>{
 assert.equal(easePhotographedShoulderFall(null,null,{enabled:false}),null);
});
for(const kind of ['female','male'])for(const source of [A,B]){
 test('3D61 real original-source sewn shoulders '+kind+'/'+source.id,async()=>{
  const rig=await person(kind),controller=createOutfitController(rig,{...options,naturalShoulderFall61:true});
  try{
   const result=controller.setOutfit('shirt-pants',candidate('shirt'),{
    reviewed:true,pantsCandidate:denim(source),pantsReviewed:true
   });
   const s=result.shirt;
   assert.equal(s.sourceRigNaturalShoulderFall,true);
   assert.ok(s.shoulderFallRealVertices>=20);
   assert.ok(s.shoulderFallMaximumWorldMove>.002&&s.shoulderFallMaximumWorldMove<=.01601);
   assert.ok(s.shoulderFallProtectedCenterPhotoVertices>100);
   for(const side of ['L','R']){
    assert.ok(s.shoulderFallBySide[side].caps>=5);
    assert.ok(s.shoulderFallBySide[side].shells>=5);
    assert.ok(s.shoulderFallSharedSeamWitnesses[side]>=3);
   }
   assert.ok(s.shoulderFallSeamGap<=5e-5);
   assert.equal(s.shoulderFallOriginalPhotoUVSkinUnchanged,true);
   assert.equal(s.shoulderFallNoFabricBackInvented,true);
   assert.equal(s.shoulderFallHumanVisualApproved,false);
   assert.equal(s.releaseAuthorized,false);
   assert.equal(s.sourceSHA256,candidate('shirt').sourceSHA256,
    'Offline unit fixture must retain its own exact source identity; real licensed SHA is checked independently by original-image Chromium tests');
   assert.equal(result.pants.sourceSHA256,source.originalSHA256);
   // Real original photo UV positions and source bone bindings are checked by
   // the geometry operator itself; also verify present and well-formed here.
   const protectedMeshes=[];
   rig.traverse(m=>{
    if(!m.isSkinnedMesh || !m.userData.work56Garment || m.userData.work60Pants)return;
    if(m.name!=='Work56-independent-shirt-shell'&&!m.userData.work45IndependentShoulderCap)return;
    protectedMeshes.push(m);
    for(const name of attrs){
     const a=m.geometry.getAttribute(name);
     if(name==='uv'&&!a)continue;
     assert.ok(a&&a.count===m.geometry.getAttribute('position').count,name);
     assert.ok([...a.array].every(Number.isFinite),name+' original source is finite');
    }
   });
   assert.ok(protectedMeshes.length>=3);
   for(const pose of ['source','blend-50','relaxed']){
    const state=controller.setPose(pose);
    assert.equal(state.shirt.sourceRigNaturalShoulderFall,true);
    assert.equal(state.shirt.poseTriangleContact.after.count,0);
    assert.equal(state.shirt.releaseAuthorized,false);
   }
   assert.equal(controller.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D61_ORIGINAL_SOURCE_BILATERAL_SEWN_SHOULDER',JSON.stringify({
    kind,denim:source.id,edited:s.shoulderFallRealVertices,
    maxWorldMove:s.shoulderFallMaximumWorldMove,seam:s.shoulderFallSeamGap,
    centerProtected:s.shoulderFallProtectedCenterPhotoVertices,
    realPhysicalPhone:false,humanVisualApproval:false,release:false
   }));
  }finally{controller.dispose();}
 });
}
