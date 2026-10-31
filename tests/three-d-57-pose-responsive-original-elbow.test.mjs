/** 3D57: TRUE original photographed male/female 163-joint elbow fabric
 * changes *by arm pose*, independently from the prior static 3D56 creases.
 * No passing sampled source geometry may be called dynamic cloth simulation,
 * swept-contact certification or Family Alpha visual approval.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {preparePhotographedPoseResponsiveElbows} from '../research/three-d-57/pose-responsive-photographed-elbows.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const original=['panelPosition','panelNormal','skinIndex','skinWeight'];
function inventory(root){
 root.updateMatrixWorld(true);
 const body=[],pants=[],shirt=[],caps=[];
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;
  const p=m.geometry.getAttribute('position');
  if(!m.userData.work56Garment){body.push([...p.array]);return;}
  if(m.userData.work60Pants){pants.push([...p.array]);return;}
  const e={name:m.name,side:m.userData.work45IndependentShoulderCap||null,
   positions:[...p.array],
   attributes:Object.fromEntries(original.map(n=>[n,[...m.geometry.getAttribute(n).array]]))};
  if(m.userData.work45IndependentShoulderCap)caps.push(e);
  else shirt.push(e);
 });
 return {body,pants,shirt,caps};
}
const options={jeansPanelFall:true,independentGarments:true,
 tailoredShoulderSleeves:true,independentShoulderCaps:true,
 realisticShoulderContour:true,upperArmFabricVolume:true,
 sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,
 naturalShoulderSleeveTransition:true,sourceMeasuredSleeveHang:true,
 sourceElbowClothCreases:true,poseContactFactory:createPoseContact};

for(const kind of ['female','male'])for(const src of [A,B])
 test('3D57 genuine pose-reactive ORIGINAL elbow cloth '+kind+'/'+src.id,async()=>{
  const baseRoot=await person(kind),activeRoot=await person(kind);
  const baseline=createOutfitController(baseRoot,options);
  const active=createOutfitController(activeRoot,{...options,poseResponsiveElbowCloth:true});
  try{
   const args={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};
   const originalBase=baseline.setOutfit('shirt-pants',candidate('shirt'),args);
   const originalActive=active.setOutfit('shirt-pants',candidate('shirt'),args);
   assert.equal(Boolean(originalBase.shirt.sourceMeasuredPoseResponsiveElbow),false);
   assert.equal(originalActive.shirt.sourceMeasuredPoseResponsiveElbow,true);
   assert.equal(originalActive.shirt.originalSourceSleevePhotoAndRigUnchanged,true);
   assert.ok(originalActive.shirt.poseResponseRealVertices>=40);
   assert.ok(originalActive.shirt.poseResponseMaxMove>=.001&&originalActive.shirt.poseResponseMaxMove<=.00801);
   assert.ok(originalActive.shirt.poseResponseBySide.L.moved>=20);
   assert.ok(originalActive.shirt.poseResponseBySide.R.moved>=20);
   assert.equal(originalActive.shirt.releaseAuthorized,false);
   assert.equal(originalActive.pants.sourceSHA256,src.originalSHA256);
   const initBase=inventory(baseRoot),initActive=inventory(activeRoot);
   assert.deepEqual(initBase.body,initActive.body,'Actual anatomical original source geometry immutable');
   assert.deepEqual(initBase.pants,initActive.pants,'Both licensed original photographed jean meshes immutable');
   assert.equal(initBase.caps.length,initActive.caps.length);
   for(let j=0;j<initBase.caps.length;j++)
    assert.deepEqual(initBase.caps[j].attributes,initActive.caps[j].attributes,
     'Original separately sewn shoulder caps source UV/skin data byte-identical');
   const fractions={source:0,'blend-25':.25,'blend-50':.5,'blend-75':.75,relaxed:1};
   const first=new Map();
   for(const pose of ['source','blend-25','blend-50','blend-75','relaxed','blend-50','source']){
    const state=active.setPose(pose);
    const response=state.shirt.poseResponsiveElbowState;
    assert.equal(state.shirt.sourceMeasuredPoseResponsiveElbow,true);
    assert.equal(response.blendFactor,fractions[pose]);
    assert.equal(response.realSourceSkinnedElbowVertices,state.shirt.poseResponseRealVertices);
    assert.ok(response.maximumAddedLocalClothMove<=.00801);
    assert.equal(state.shirt.poseTriangleContact.after.count,0,
     'Original source photographed real elbow + shirt/body triangle contact after pose-responsive folds at '+pose);
    assert.equal(state.shirt.poseTriangleContact.sourceMeasuredPoseResponsiveElbow,true);
    assert.equal(state.shirt.poseTriangleContact.fullCollisionValidated,false);
    assert.equal(state.shirt.releaseAuthorized,false);
    if(first.has(pose)){
     assert.deepEqual(inventory(activeRoot),first.get(pose),
      'Returning to identical source-verified arm pose must reproduce identical genuine garment fabric and source body');
    } else first.set(pose,inventory(activeRoot));
   }
   const activeDone=inventory(activeRoot);
   assert.deepEqual(activeDone.body,initActive.body,'Source anatomy cannot change after any arm pose');
   assert.deepEqual(activeDone.pants,initActive.pants,'Original licensed photo denim cannot change after any arm pose');
   // Isolate ONLY the new posed fabric stage on a single SAME source rig. This
   // avoids comparing different independent collision-contact solver outputs.
   baseline.setPose('source');
   const originalBaseRig=inventory(baseRoot);
   let sourceShirt;
   const meshes=[];
   baseRoot.traverse(m=>{
    if(m.isSkinnedMesh&&m.userData.work56Garment&&!m.userData.work60Pants)meshes.push(m);
   });
   sourceShirt={meshes,stats:baseline.getState().shirt};
   const profile=preparePhotographedPoseResponsiveElbows(baseRoot,sourceShirt);
   assert.ok(profile.summary.poseResponseRealVertices>=40);
   assert.equal(profile.summary.originalSourceSleevePhotoAndRigUnchanged,true);
   const source=profile.apply('source');
   assert.equal(source.blendFactor,0);
   assert.deepEqual(inventory(baseRoot),originalBaseRig,'0% source pose must leave original photographed source geometry exactly fixed');
   const before=profile.snapshot();
   const quarter=profile.apply('blend-25');
   assert.equal(quarter.blendFactor,.25);
   const quarterGeometry=inventory(baseRoot);
   assert.equal(profile.apply('blend-50').blendFactor,.5);
   const middleGeometry=inventory(baseRoot);
   assert.equal(profile.apply('relaxed').blendFactor,1);
   const relaxedGeometry=inventory(baseRoot);
   assert.deepEqual(relaxedGeometry.body,originalBaseRig.body);
   assert.deepEqual(relaxedGeometry.pants,originalBaseRig.pants);
   assert.deepEqual(relaxedGeometry.caps,originalBaseRig.caps,
    'Every original independent L/R sleeve cap geometry, seam and protected source attribute stays EXACT');
   let quarterMoved=0,midMoved=0,relaxedMoved=0,originalSourceProtected=0;
   for(let j=0;j<originalBaseRig.shirt.length;j++){
    const o=originalBaseRig.shirt[j],q=quarterGeometry.shirt[j],
     m=middleGeometry.shirt[j],r=relaxedGeometry.shirt[j];
    assert.deepEqual(o.attributes,q.attributes);
    assert.deepEqual(o.attributes,m.attributes);
    assert.deepEqual(o.attributes,r.attributes,
     'All original photographed source UV/skin/index metadata byte-identical at any elbow pose');
    for(let i=0;i<o.positions.length;i+=3){
     const distance=g=>Math.hypot(...[0,1,2].map(k=>g.positions[i+k]-o.positions[i+k]));
     const dq=distance(q),dm=distance(m),dr=distance(r);
     assert.ok(dr<=.00805,'Source stage alone cannot change any photographed garment local vertex beyond 8.05mm');
     assert.ok(dq<=dm+.000002&&dm<=dr+.000002,
      'Source photographic elbow crease response must increase monotonically with approved arm-pose fraction');
     if(dq>.00005)quarterMoved++;
     if(dm>.00005)midMoved++;
     if(dr>.00005)relaxedMoved++;
     if(o.name==='Work56-independent-shirt-shell'){
      // Center original chest garment photo samples remain fixed.
      const mesh=meshes.find(x=>x.name===o.name);
      if(mesh){
       const x=new T.Vector3(o.positions[i],o.positions[i+1],o.positions[i+2]).applyMatrix4(mesh.matrixWorld).x;
       if(Math.abs(x)<=.31){assert.ok(dr<.000002);originalSourceProtected++;}
      }
     }
    }
   }
   assert.ok(quarterMoved>=40&&midMoved>=quarterMoved&&relaxedMoved>=midMoved&&originalSourceProtected>100,
    'Real original licensed source fabric must physically reshape with arm pose but protect chest front');
   profile.restoreSnapshot(before);
   assert.deepEqual(inventory(baseRoot),originalBaseRig,
    'Source garment can be fully restored after pose-dependent cloth simulation-like research stage');
   assert.equal(active.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D57_ORIGINAL_PHOTO_POSE_RESPONSIVE_ELBOW',JSON.stringify({
    kind,source:src.id,quarterMoved,midMoved,relaxedMoved,
    originalSourceProtected,max:profile.summary.poseResponseMaxMove,
    release:false,signed:false,swept:false,humanApproved:false}));
  }finally{baseline.dispose();active.dispose();}
 });
