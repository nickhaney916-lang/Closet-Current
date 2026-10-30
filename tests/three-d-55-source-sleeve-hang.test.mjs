/** 3D55 actual original source photographed lower sleeve ease regression.
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
import {hangPhotographedSleeveCloth} from '../research/three-d-55/source-measured-sleeve-hang.mjs';
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
 test('3D55 real source elbow-to-wrist sleeve fabric hang '+kind+'/'+src.id,async()=>{
  const root=await person(kind),integratedRoot=await person(kind);
  const common={jeansPanelFall:true,independentGarments:true,tailoredShoulderSleeves:true,
   independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,
   sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,naturalShoulderSleeveTransition:true,poseContactFactory:createPoseContact};
  const baseline=createOutfitController(root,common);
  const improved=createOutfitController(integratedRoot,{...common,sourceMeasuredSleeveHang:true});
  try{
   const args={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};
   const b=baseline.setOutfit('shirt-pants',candidate('shirt'),args);
   const a=improved.setOutfit('shirt-pants',candidate('shirt'),args);
   assert.equal(Boolean(b.shirt.sourceMeasuredNaturalSleeveHang),false);
   assert.equal(a.shirt.sourceMeasuredNaturalSleeveHang,true);
   assert.ok(a.shirt.sleeveHangChangedRenderedVertices>=50);
   assert.ok(a.shirt.sleeveHangMaximumMove>=.001&&a.shirt.sleeveHangMaximumMove<=.01201);
   assert.ok(a.shirt.sleeveHangBySide.L.moved>=25&&a.shirt.sleeveHangBySide.R.moved>=25);
   assert.ok(a.shirt.sleeveHangBySide.L.foldA>=8&&a.shirt.sleeveHangBySide.R.foldA>=8);
   assert.ok(a.shirt.sleeveHangBySide.L.foldB>=8&&a.shirt.sleeveHangBySide.R.foldB>=8);
   assert.equal(a.shirt.originalPhotographedSleeveUVAndSkinPreserved,true);
   assert.equal(a.shirt.originalIndependentShoulderCapSeamsPreserved,true);
   assert.equal(a.shirt.originalPhotographedBodyAndDenimPreserved,true);
   assert.equal(a.shirt.releaseAuthorized,false);
   assert.equal(a.pants.sourceSHA256,src.originalSHA256);
   // Expose original source geometry movement by comparing the SAME already
   // posed original-source rig before and after JUST the 3D55 operation.
   // Comparing separately contact-corrected outfits would conflate garment
   // crest construction with independently applied body triangle corrections.
   const before=inventory(root);
   const cloth=[];
   root.traverse(m=>{if(m.isSkinnedMesh&&m.userData.work56Garment&&!m.userData.work60Pants)cloth.push(m);});
   const direct=hangPhotographedSleeveCloth({meshes:cloth,stats:b.shirt},root);
   assert.equal(direct.stats.sourceMeasuredNaturalSleeveHang,true);
   const after=inventory(root),full=inventory(integratedRoot);
   assert.deepEqual(after.body,before.body,'Original anatomical source geometry must not move');
   assert.deepEqual(after.pants,before.pants,'Both original photographed jean sources must not move');
   assert.deepEqual(full.body,before.body,'Integrated model must preserve source anatomy');
   assert.deepEqual(full.pants,before.pants,'Integrated model must preserve original licensed jeans geometry');
   assert.equal(before.garments.length,after.garments.length);
   assert.equal(before.garments.length,full.garments.length);
   let moved=0,protectedFront=0,movedShells=0,immutableCaps=0;
   for(let j=0;j<before.garments.length;j++){
    const x=before.garments[j],y=after.garments[j],integrated=full.garments[j];
    assert.equal(x.name,y.name);
    assert.equal(x.side,y.side);
    assert.deepEqual(x.protected,y.protected,'Actual original source licensed shirt photographed material and rig untouched');
    assert.deepEqual(x.protected,integrated.protected,'Full contact adjusted original source photo/rig fields untouched');
    assert.equal(x.world.length,y.world.length);
    for(let i=0;i<x.world.length;i+=3){
     const dx=y.world[i]-x.world[i],dy=y.world[i+1]-x.world[i+1],dz=y.world[i+2]-x.world[i+2];
     assert.ok([dx,dy,dz].every(Number.isFinite),'No non-finite original skinned photographed sleeve geometry');
     const distance=Math.hypot(dx,dy,dz);
     assert.ok(distance<=.01202,'Single original skinned sleeve fall movement bounded by 12.02mm');
     if(x.side){
      assert.ok(distance<.000001,'3D55 must not disturb independent left or right shoulder seam cap');
      immutableCaps++;
     }
     if(distance>.0001){
      moved++;movedShells++;
      assert.equal(x.name,'Work56-independent-shirt-shell','Only original source shell forearm sleeve material may move');
      assert.ok(Math.abs(x.world[i])>=.31,'Original photo chest print, neckline and torso must be immutable');
     }
     if(Math.abs(x.world[i])<.31){
      assert.ok(distance<.000001,'Original source front print and neckline untouched');
      protectedFront++;
     }
    }
   }
   assert.ok(moved>=50&&movedShells>=50&&protectedFront>100&&immutableCaps>10,
    'Both source measured forearm sleeves must genuinely alter rendered photographed fabric without changing original caps');
   for(const pose of ['source','blend-50','relaxed']){
    const s=improved.setPose(pose);
    assert.equal(s.shirt.poseTriangleContact.after.count,0,
     'Original source skinned male/female shirt must remain clear of the anatomical body at '+pose);
    assert.equal(s.shirt.poseTriangleContact.fullCollisionValidated,false);
   }
   assert.equal(improved.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D55_TRUE_PHOTO_SLEEVE_HANG',JSON.stringify({kind,source:src.id,moved,movedShells,protectedFront,originalCaps:immutableCaps,max:a.shirt.sleeveHangMaximumMove,perSide:a.shirt.sleeveHangBySide,release:false}));
  }finally{baseline.dispose();improved.dispose();}
 });
