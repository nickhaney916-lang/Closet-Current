/** 3D53 independent, actual original 163-bone source-photo rigs.
 * No customer photos; original source garment UVs and sewn shoulder caps must
 * remain exactly unchanged while the central neutral rear cloth actually moves.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {createPoseContact} from '../research/three-d-42/posed-contact.mjs';
import {easeSourceNeutralRearFabric} from '../research/three-d-53/source-neutral-rear-relief.mjs';
import {denim} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
const attributes=['panelPosition','panelNormal','skinIndex','skinWeight'];
const collect=root=>{
 root.updateMatrixWorld(true);
 const body=[],pants=[],shirts=[],caps=[],collars=[];
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;
  if(!m.userData.work56Garment){body.push([...m.geometry.getAttribute('position').array]);return;}
  if(m.userData.work60Pants){pants.push([...m.geometry.getAttribute('position').array]);return;}
  const position=m.geometry.getAttribute('position');
  const world=[];
  if(m.name==='Work56-independent-shirt-shell')for(let i=0;i<position.count;i++){
   const q=new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(m.matrixWorld);
   world.push(q.x,q.y,q.z);
  }
  const entry={name:m.name,pos:[...position.array],world,
   protected:Object.fromEntries(attributes.map(n=>[n,[...m.geometry.getAttribute(n).array]]))};
  if(m.userData.work45IndependentShoulderCap)caps.push(entry);
  else if(m.name==='Work59-source-neutral-collar-band')collars.push(entry);
  else if(m.name==='Work56-independent-shirt-shell')shirts.push(entry);
 });
 return {body,pants,shirts,caps,collars};
};
for(const kind of ['female','male'])for(const src of [A,B])
 test('3D53 real source-neutral rear drape '+kind+'/'+src.id,async()=>{
  const beforeRoot=await person(kind),afterRoot=await person(kind);
  const base={jeansPanelFall:true,independentGarments:true,
   tailoredShoulderSleeves:true,independentShoulderCaps:true,
   realisticShoulderContour:true,upperArmFabricVolume:true,
   sourceNeutralCollarRoll:true,poseContactFactory:createPoseContact};
  const before=createOutfitController(beforeRoot,base);
  const after=createOutfitController(afterRoot,{...base,rearShirtFabricRelief:true});
  try{
   const args={reviewed:true,pantsCandidate:denim(src),pantsReviewed:true};
   const b=before.setOutfit('shirt-pants',candidate('shirt'),args);
   const a=after.setOutfit('shirt-pants',candidate('shirt'),args);
   assert.equal(Boolean(b.shirt.sourceNeutralRearFabricRelief),false);
   assert.equal(a.shirt.sourceNeutralRearFabricRelief,true);
   assert.ok(a.shirt.rearReliefMovedRenderedVertices>=24);
   assert.ok(a.shirt.rearReliefMaximumMove>=.004&&a.shirt.rearReliefMaximumMove<=.01801);
   assert.ok(a.shirt.rearReliefProtectedFrontVertices>=30);
   assert.equal(a.shirt.originalPhotographedFrontAndUVUnchanged,true);
   assert.equal(a.shirt.sourceNeutralRearPhotoNotInvented,true);
   assert.equal(a.shirt.independentShoulderCapAndSewnSeamsUnchanged,true);
   assert.equal(a.pants.sourceSHA256,src.originalSHA256);
   assert.equal(a.shirt.releaseAuthorized,false);
   // The full outfit's real body-contact solver may make a separate
   // correction to male vertices when the rear panel changes. Compare
   // JUST the rear construction on the SAME original fitted rig here.
   // The separate complete fitted 3D53 outfit below still exercises the
   // genuine solver at source/intermediate/relaxed poses.
   const original=collect(beforeRoot);
   const independentCloth=[];
   beforeRoot.traverse(m=>{
    if(m.isSkinnedMesh&&m.userData.work56Garment&&!m.userData.work60Pants)
     independentCloth.push(m);
   });
   const isolated=easeSourceNeutralRearFabric(
    {stats:b.shirt,meshes:independentCloth},beforeRoot);
   const isolatedStats=isolated.stats;
   assert.equal(isolatedStats.sourceNeutralRearFabricRelief,true);
   assert.equal(isolatedStats.rearReliefMovedRenderedVertices,a.shirt.rearReliefMovedRenderedVertices,
    'Isolated source-true rear shaping and integrated stage must select same original rendered cloth');
   assert.equal(isolatedStats.originalPhotographedFrontAndUVUnchanged,true);
   const tailored=collect(beforeRoot);
   const integrated=collect(afterRoot);
   assert.deepEqual(integrated.body,original.body,'Integrated rear panel cannot mutate source anatomy');
   assert.deepEqual(integrated.pants,original.pants,'Integrated rear panel cannot mutate original licensed denim');
   for(const section of ['caps','collars'])
    assert.deepEqual(integrated[section],original[section],
     'Integrated contact fit must preserve original independent caps and sewn collar: '+section);
   for(const section of ['body','pants','caps','collars'])
    assert.deepEqual(tailored[section],original[section],
     '3D53 must not alter source body, photographed denim, real L/R sleeve caps or sewn collar: '+section);
   assert.equal(original.shirts.length,tailored.shirts.length);
   let moved=0,unchangedPhoto=0;
   for(let j=0;j<original.shirts.length;j++){
    const x=original.shirts[j],y=tailored.shirts[j];
    assert.equal(x.name,y.name);
    assert.deepEqual(x.protected,y.protected,'Photographic front/UV/rig original arrays must not change');
    assert.deepEqual(x.protected,integrated.shirts[j].protected,
     'Integrated full contact fit must retain original photographed UV/rig metadata');
    assert.equal(x.pos.length,y.pos.length);
    assert.equal(x.world.length,y.world.length,'World-space visible shirt vertices must retain original count');
    for(let i=0;i<x.world.length;i+=3){
     // Direct same-rig source geometry before/after JUST the 3D53 stage.
     // Unlike two collision-corrected outfits, this measures only the
     // opt-in cloth geometry displacement in physical world coordinates.
     const dx=Math.abs(x.world[i]-y.world[i]),dy=Math.abs(x.world[i+1]-y.world[i+1]),dz=Math.abs(x.world[i+2]-y.world[i+2]);
     assert.ok(Number.isFinite(dx)&&Number.isFinite(dy)&&Number.isFinite(dz),'World-space source garment geometry must remain finite');
     assert.ok(dx<.000001&&dy<.000001,
      'Actual world-space rear fabric must move only along source-fitted back depth');
     assert.ok(dz<=.01802,'Individual original shirt panel shift must be bounded in world space');
     if(dz>.0001)moved++;
     if(x.protected.panelNormal[i+2]>-.8){assert.ok(dz<.000001,'Original photographed front or side material moved');unchangedPhoto++;}
    }
   }
   assert.ok(moved>=24&&unchangedPhoto>30,'Source-neutral real rear change and protected original photo not demonstrated');
   for(const pose of ['source','blend-50','relaxed']){
    const state=after.setPose(pose);
    assert.equal(state.shirt.poseTriangleContact.after.count,0,'Actual fitted real garment/source body contact '+kind+'/'+src.id+'/'+pose);
    assert.equal(state.shirt.poseTriangleContact.fullCollisionValidated,false);
   }
   assert.equal(after.setOutfit('none').garmentMeshes,0);
   console.log('THREE_D53_SOURCE_NEUTRAL_BACK_GEOMETRY',JSON.stringify({kind,source:src.id,moved,unchangedPhoto,max:a.shirt.rearReliefMaximumMove,release:false}));
  }finally{before.dispose();after.dispose();}
 });
