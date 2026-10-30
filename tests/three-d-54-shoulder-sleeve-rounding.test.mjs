/** 3D54 actual source photograph shoulder/sleeve transition regression.
 * Anatomical 163-bone female and male, original licensed shirt and two jeans,
 * physically distinct left/right sewn source cap surfaces.
 * Do not infer physical phone, signed containment or human visual approval.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {roundRealShoulderSleeveCrest} from '../research/three-d-54/round-shoulder-sleeve-crest.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const names=['panelPosition','panelNormal','skinIndex','skinWeight'];
function inventory(root){
 root.updateMatrixWorld(true);
 const body=[],pants=[],garments=[];
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;
  const position=m.geometry.getAttribute('position');
  if(!m.userData.work56Garment){body.push([...position.array]);return;}
  if(m.userData.work60Pants){pants.push([...position.array]);return;}
  const world=[];
  for(let i=0;i<position.count;i++){
   const q=new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(m.matrixWorld);
   world.push(q.x,q.y,q.z);
  }
  garments.push({name:m.name,side:m.userData.work45IndependentShoulderCap||null,
   pos:[...position.array],world,
   protected:Object.fromEntries(names.map(n=>[n,[...m.geometry.getAttribute(n).array]]))});
 });
 return {body,pants,garments};
}
for(const kind of ['female','male'])for(const src of [A,B])
 test('3D54 sewn real source shoulder crest '+kind+'/'+src.id,async()=>{
  const root=await person(kind),integratedRoot=await person(kind);
  const common={jeansPanelFall:true,independentGarments:true,tailoredShoulderSleeves:true,
   independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,
   sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,poseContactFactory:createPoseContact};
  const baseline=createOutfitController(root,common);
  const improved=createOutfitController(integratedRoot,{...common,naturalShoulderSleeveTransition:true});
  try{
   const args={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};
   const b=baseline.setOutfit('shirt-pants',candidate('shirt'),args);
   const a=improved.setOutfit('shirt-pants',candidate('shirt'),args);
   assert.equal(Boolean(b.shirt.naturalSourceShoulderSleeveTransition),false);
   assert.equal(a.shirt.naturalSourceShoulderSleeveTransition,true);
   assert.ok(a.shirt.shoulderRoundMovedRenderedVertices>=30);
   assert.ok(a.shirt.shoulderRoundMaximumMove>=.003&&a.shirt.shoulderRoundMaximumMove<=.014);
   assert.ok(a.shirt.shoulderRoundSharedCapTorsoSeamWitnesses.L>=3&&
    a.shirt.shoulderRoundSharedCapTorsoSeamWitnesses.R>=3);
   assert.ok(a.shirt.shoulderRoundRealSeamGap<=5e-5);
   assert.ok(a.shirt.shoulderRoundBySide.L.caps>=5&&a.shirt.shoulderRoundBySide.R.caps>=5);
   assert.ok(a.shirt.shoulderRoundBySide.L.shells>=5&&a.shirt.shoulderRoundBySide.R.shells>=5);
   assert.equal(a.shirt.originalPhotoUVAndSourceSkinWeightsUnchanged,true);
   assert.equal(a.shirt.independentRealGarmentCapsAndCollarPreserved,true);
   assert.equal(a.shirt.releaseAuthorized,false);
   assert.equal(a.pants.sourceSHA256,src.originalSHA256);
   // Expose original source geometry movement by comparing the SAME already
   // posed original-source rig before and after JUST the 3D54 operation.
   // Comparing separately contact-corrected outfits would conflate garment
   // crest construction with independently applied body triangle corrections.
   const before=inventory(root);
   const cloth=[];
   root.traverse(m=>{if(m.isSkinnedMesh&&m.userData.work56Garment&&!m.userData.work60Pants)cloth.push(m);});
   const direct=roundRealShoulderSleeveCrest({meshes:cloth,stats:b.shirt},root);
   assert.equal(direct.stats.naturalSourceShoulderSleeveTransition,true);
   const after=inventory(root),full=inventory(integratedRoot);
   assert.deepEqual(after.body,before.body,'Original anatomical source geometry must not move');
   assert.deepEqual(after.pants,before.pants,'Both original photographed jean sources must not move');
   assert.deepEqual(full.body,before.body,'Integrated model must preserve source anatomy');
   assert.deepEqual(full.pants,before.pants,'Integrated model must preserve original licensed jeans geometry');
   assert.equal(before.garments.length,after.garments.length);
   assert.equal(before.garments.length,full.garments.length);
   let moved=0,protectedFront=0,movedCaps={L:0,R:0},movedShells=0;
   for(let j=0;j<before.garments.length;j++){
    const x=before.garments[j],y=after.garments[j],integrated=full.garments[j];
    assert.equal(x.name,y.name);
    assert.equal(x.side,y.side);
    assert.deepEqual(x.protected,y.protected,'Sewn photographed shirt originals and 163-joint weights immutable');
    assert.deepEqual(x.protected,integrated.protected,'Source photographed material original preserved in full outfit');
    assert.equal(x.world.length,y.world.length);
    for(let i=0;i<x.world.length;i+=3){
     const dx=y.world[i]-x.world[i],dy=y.world[i+1]-x.world[i+1],dz=y.world[i+2]-x.world[i+2];
     assert.ok([dx,dy,dz].every(Number.isFinite),'No non-finite original photographed shoulder geometry');
     const distance=Math.hypot(dx,dy,dz);
     assert.ok(distance<=.014001,'Individual physical shoulder crest cannot shift beyond 14mm');
     if(distance>.0001){
      moved++;
      assert.ok(Math.abs(x.world[i])>.305,'Never reshape the original printed front or neckline');
      assert.ok(dy<=.000001,'Source shoulder crest should round downward without inflated pad');
      assert.ok(Math.abs(dz)<.000001,'Original front/rear photograph depth coordinates preserved');
      if(x.side)movedCaps[x.side]++;else if(x.name==='Work56-independent-shirt-shell')movedShells++;
     }
     if(Math.abs(x.world[i])<=.255){
      assert.ok(distance<.000001,'Original photographed central front shirt and print must stay fixed');
      protectedFront++;
     }
    }
   }
   assert.ok(moved>=30&&movedCaps.L>=5&&movedCaps.R>=5&&movedShells>=10&&protectedFront>=100,
    'Actual independently sewn and original-photo shoulder crest geometry must genuinely change');
   for(const pose of ['source','blend-50','relaxed']){
    const s=improved.setPose(pose);
    assert.equal(s.shirt.poseTriangleContact.after.count,0,
     'Original source skinned male/female shirt must remain clear of the anatomical body at '+pose);
    assert.equal(s.shirt.poseTriangleContact.fullCollisionValidated,false);
   }
   assert.equal(improved.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D54_TRUE_PHOTO_SHOULDER_ROUND',JSON.stringify({kind,source:src.id,moved,movedCaps,movedShells,protectedFront,max:a.shirt.shoulderRoundMaximumMove,realSeamGap:a.shirt.shoulderRoundRealSeamGap,release:false}));
  }finally{baseline.dispose();improved.dispose();}
 });
