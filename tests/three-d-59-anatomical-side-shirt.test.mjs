/** 3D59 source-measured natural torso side fit, no synthetic garment.
 * Each real 163-bone model x each independently licensed original jeans
 * must demonstrate bilateral *rendered* shirt side motion and zero source
 * photo, original anatomy, UV, sewn cap, denim or skin-weight alteration.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const protectedAttrs=['panelPosition','panelNormal','skinIndex','skinWeight'];
const options={poseContactFactory:createPoseContact,jeansPanelFall:true,
 independentGarments:true,tailoredShoulderSleeves:true,
 independentShoulderCaps:true,realisticShoulderContour:true,
 upperArmFabricVolume:true,sourceNeutralCollarRoll:true,
 rearShirtFabricRelief:true,naturalShoulderSleeveTransition:true,
 sourceMeasuredSleeveHang:true,poseConditionedSleeveDrape:true};
const collect=root=>{
 const out={body:[],pants:[],shirt:[],caps:[]};
 root.updateMatrixWorld(true);
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;
  const g=m.geometry,p=g.getAttribute('position'),rec={
   name:m.name,position:p.array.slice(),
   attributes:Object.fromEntries(protectedAttrs.filter(n=>g.getAttribute(n)).map(n=>[n,g.getAttribute(n).array.slice()]))
  };
  if(!m.userData.work56Garment)out.body.push(rec);
  else if(m.userData.work60Pants)out.pants.push(rec);
  else if(m.userData.work45IndependentShoulderCap)out.caps.push(rec);
  else if(m.name==='Work56-independent-shirt-shell')out.shirt.push(rec);
 });
 return out;
};
for(const kind of ['female','male'])for(const src of [A,B]){
 test('3D59 genuine original photographed anatomical torso side fall '+kind+'/'+src.id,async()=>{
  const originalRig=await person(kind),improvedRig=await person(kind);
  const original=createOutfitController(originalRig,options);
  const improved=createOutfitController(improvedRig,{...options,anatomicalShirtSideFlow:true});
  try{
   const reviewed={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};
   const a=original.setOutfit('shirt-pants',candidate('shirt'),reviewed);
   const b=improved.setOutfit('shirt-pants',candidate('shirt'),reviewed);
   assert.equal(Boolean(a.shirt.measuredNaturalShirtSideFlow),false);
   assert.equal(b.shirt.measuredNaturalShirtSideFlow,true);
   assert.equal(b.shirt.directBodyMeasurementsOnly,true);
   assert.ok(b.shirt.shirtSideFlowEditedRealVertices>=40);
   assert.ok(b.shirt.shirtSideFlowMaximumWorldMove>=.0015&&b.shirt.shirtSideFlowMaximumWorldMove<=.01301);
   assert.ok(b.shirt.shirtSideFlowBySide.L.moved>=20);
   assert.ok(b.shirt.shirtSideFlowBySide.R.moved>=20);
   assert.ok(b.shirt.shirtSideFlowMeasuredBodyPoints.L>=80);
   assert.ok(b.shirt.shirtSideFlowMeasuredBodyPoints.R>=80);
   assert.ok(b.shirt.shirtSideFlowProtectedOriginalPhotoFront>=100);
   assert.equal(b.shirt.originalPhotographedSourcePixelsUVAndSkinUnchanged,true);
   assert.equal(b.shirt.originalBodyOriginalDenimAndIndependentCapsUnchanged,true);
   assert.equal(b.pants.sourceSHA256,src.originalSHA256);
   assert.equal(b.shirt.releaseAuthorized,false);
   const x=collect(originalRig),y=collect(improvedRig);
   assert.deepEqual(y.body,x.body,'Original actual male/female anatomical 163-bone body untouched');
   assert.deepEqual(y.pants,x.pants,'Original licensed jeans geometry and UV source untouched');
   assert.deepEqual(y.caps,x.caps,'Original source independent left/right sewn sleeve cap mesh untouched');
   assert.equal(x.shirt.length,y.shirt.length);
   let moved=0,max=0;
   for(let j=0;j<x.shirt.length;j++){
    const before=x.shirt[j],after=y.shirt[j];
    assert.equal(before.name,after.name);
    assert.deepEqual(after.attributes,before.attributes,'Original photo source panel positions, normals and true skin weights byte identical');
    assert.equal(before.position.length,after.position.length);
    for(let i=0;i<before.position.length;i+=3){
     const distance=Math.hypot(...[0,1,2].map(k=>after.position[i+k]-before.position[i+k]));
     assert.ok(Number.isFinite(distance)&&distance<=.01302,'Bound real source shirt side fit displacement per vertex');
     if(distance>.0001)moved++;
     max=Math.max(max,distance);
    }
   }
   assert.ok(moved>=40&&max>.0014,'The actual original source photographed shirt torso must measurably flow');
   // The same original 3D56 posed mesh contact solver must still certify
   // sampled triangle crossing reduction after our new body-measured source
   // side fit; do not mistake these samples for all-pose signed containment.
   for(const pose of ['source','blend-50','relaxed']){
    const state=improved.setPose(pose);
    assert.equal(state.shirt.poseTriangleContact.after.count,0,'Actual source skinned original shirt body/denim contact '+kind+'/'+src.id+'/'+pose);
    assert.equal(state.shirt.poseConditionedSleeveDrape.pose,pose);
    assert.equal(state.shirt.measuredNaturalShirtSideFlow,true);
    assert.equal(state.shirt.releaseAuthorized,false);
   }
   assert.equal(improved.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D59_TRUE_SOURCE_TORSO_SIDE_FIT',JSON.stringify({
    kind,source:src.id,moved,max,bySide:b.shirt.shirtSideFlowBySide,
    anatomicalBodyPoints:b.shirt.shirtSideFlowMeasuredBodyPoints,
    frontProtected:b.shirt.shirtSideFlowProtectedOriginalPhotoFront,
    humanApproved:false,release:false}));
  }finally{original.dispose();improved.dispose();}
 });
}
