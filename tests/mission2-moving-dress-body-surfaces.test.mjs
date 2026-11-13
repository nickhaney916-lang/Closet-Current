import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {captureSourceDressBodyPose40,auditMovingSourceDressBodySurfaces40,
 assertMovingSourceDressBodySurfaces40}
 from '../research/mission2-source-length/source-dress-moving-surface.mjs';
import {auditSourceDressSweptBody39}
 from '../research/mission2-source-length/source-dress-swept-body.mjs';
import {sampleSourceDressMotion36}
 from '../research/mission2-source-length/source-dress-motion.mjs';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
function fixture({fullDress=false,bodyZ=0}={}){
 const root=new THREE.Group(),bones=Array.from({length:163},()=>new THREE.Bone());
 bones[3].name='spine04';bones[3].position.y=1.01;root.add(...bones);
 const skeleton=new THREE.Skeleton(bones);
 // Independent anatomical body bones let tests sample ACTUAL body skinning
 // motion rather than assume changing a SkinnedMesh transform moves its skin.
 const bodyBones=Array.from({length:163},()=>new THREE.Bone());
 bodyBones[3].name='spine04';bodyBones[3].position.y=1.01;
 root.add(...bodyBones);
 const bodySkeleton=new THREE.Skeleton(bodyBones);
 const skinned=(geometry,garment)=>{
  const n=geometry.getAttribute('position').count;
  const ids=new Uint16Array(n*4),weights=new Float32Array(n*4);
  for(let i=0;i<n;i++)weights[4*i]=1;
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial());
  mesh.bind(garment?skeleton:bodySkeleton);mesh.userData.work56Garment=garment;root.add(mesh);
  return mesh;
 };
 const garment=new THREE.BufferGeometry();
 if(fullDress){
  const g=new THREE.CylinderGeometry(.33,.33,.86,96,32,true);g.translate(0,.85,0);
  for(const name of Object.keys(g.attributes))garment.setAttribute(name,g.getAttribute(name).clone());
  garment.setIndex(g.index.clone());g.dispose();
  garment.setAttribute('dressRest',garment.getAttribute('position').clone());
  garment.deleteAttribute('uv');
  garment.setAttribute('dressCustomPhotoProjection',garment.getAttribute('dressRest').clone());
 }else garment.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.4,-.012, .5,-.4,-.012, 0,.7,-.012
 ],3));
 const mesh=skinned(garment,true);
 const dress={mesh,stats:{
  sourceId:'commons-0053',sourceSHA256:SHA,photographedDressDrape61:true,
  originalRestPhotoCoordinatesUnchanged61:true,
  sourceTextureAndMaterialPreserved61:true,skinIndicesAndWeightsPreserved61:true,
  collisionValidated:false,releaseAuthorized:false
 }};
 const bodyGeo=new THREE.BufferGeometry();
 bodyGeo.setAttribute('position',new THREE.Float32BufferAttribute(fullDress?
  [-.6,.25,0, .6,.25,0, .6,.90,0, -.6,.90,0]:
  [-.1,-.1,0,.1,-.1,0,0,.1,0],3));
 if(fullDress)bodyGeo.setIndex([0,1,2,0,2,3]);
 bodyGeo.translate(0,0,bodyZ); // true source body plane; no skinned-mesh transform cancellation
 const body=skinned(bodyGeo,false);
 return {root,dress,body,bodyBones};
}
const snap=mesh=>Object.fromEntries(
 Object.entries(mesh.geometry.attributes).map(([key,a])=>[key,a.array.slice()]));
const capture=(f,stagedPositions=null)=>captureSourceDressBodyPose40({
 root:f.root,dress:f.dress,stagedPositions
});
const audit=(f,startPose,endPose,extra={})=>auditMovingSourceDressBodySurfaces40({
 root:f.root,dress:f.dress,startPose,endPose,...extra
});
test('C40: a moving CLOTH FACE overlaps body mid-frame while C39 sees ZERO vertex-only crossings',()=>{
 const f=fixture(),original=snap(f.dress.mesh);
 const startSource=f.dress.mesh.geometry.getAttribute('position').array.slice();
 const endSource=startSource.slice();
 for(let j=2;j<endSource.length;j+=3)endSource[j]=.012;
 // All three cloth-vertex paths cross z=0 OUTSIDE tiny body triangle.
 const old=auditSourceDressSweptBody39({root:f.root,dress:f.dress,
  startPositions:startSource,endPositions:endSource});
 assert.equal(old.crossedSegments,0,'existing vertex-only audit misses face-only crossing');
 const first=capture(f),last=capture(f,endSource),receipt=audit(f,first,last);
 assert.equal(receipt.genuine163BonePosePair,true);
 assert.equal(receipt.wholeGarmentFacesExamined,true);
 assert.equal(receipt.checkedClothFaces,1);
 assert.ok(receipt.potentialPairs>0);
 assert.equal(receipt.continuousCollisionCertified,false);
 assert.equal(receipt.exactContinuousNarrowphasePerformed,false);
 assert.throws(()=>assertMovingSourceDressBodySurfaces40(receipt),/potential fabric-face/);
 assert.deepEqual(snap(f.dress.mesh),original);
});
test('C40: moving 163-bone BODY face across static source cloth triggers unresolved swept-triangle veto',()=>{
 const f=fixture(),g=f.dress.mesh.geometry.getAttribute('position');
 // Static cloth triangle in plane z=0; moving body face crosses it.
 for(let i=0;i<g.count;i++)g.setZ(i,0);
 f.bodyBones[0].position.z=-.012;
 const start=capture(f);
 f.bodyBones[0].position.z=.012;
 const end=capture(f);
 const receipt=audit(f,start,end);
 assert.ok(receipt.potentialPairs>0);
 assert.ok(receipt.maximumBodyShiftMeters>.02);
 assert.equal(receipt.bodyPoseMotionObserved,true);
 assert.equal(receipt.movedClothVertices,0);
 assert.throws(()=>assertMovingSourceDressBodySurfaces40(receipt),/potential fabric-face/);
});
test('C40: far-apart cloth and changing 163-bone body pose pass only conservative research broadphase',()=>{
 const f=fixture({bodyZ:2}),original=snap(f.dress.mesh);
 const start=capture(f),next=f.dress.mesh.geometry.getAttribute('position').array.slice();
 for(let j=2;j<next.length;j+=3)next[j]=.012;
 f.bodyBones[0].position.z=.02;
 const end=capture(f,next),receipt=audit(f,start,end);
 assert.equal(receipt.potentialPairs,0);
 assert.equal(receipt.bodyPoseMotionObserved,true);
 assert.ok(receipt.maximumBodyShiftMeters>.019);
 assert.ok(receipt.maximumClothShiftMeters>.02);
 assert.equal(receipt.originalPhotoSourceUnmodified,true);
 const decision=assertMovingSourceDressBodySurfaces40(receipt);
 assert.equal(decision.linearBroadphaseClear,true);
 assert.equal(decision.noCompleteClothCertification,true);
 assert.equal(decision.releaseAuthorized,false);
 assert.equal(receipt.nonlinearBoneMotionCertified,false);
 assert.equal(receipt.realClothPhysics,false);
 assert.deepEqual(snap(f.dress.mesh),original);
});
test('C40: forged poses, unsafe budgets, changed source and bad body topology fail closed',()=>{
 const f=fixture({bodyZ:2}),start=capture(f);
 const next=f.dress.mesh.geometry.getAttribute('position').array.slice();
 const end=capture(f,next);
 for(const options of [
  {startPose:Object.freeze({})},{endPose:Object.freeze({})},
  {maxClothFaces:0},{maxBodyFaces:0},{maxTriangleCandidates:0},
  {maxPotentialPairs:0},{maxClothShiftMeters:0},{paddingMeters:.1}
 ])assert.throws(()=>audit(f,start,end,options),/M2 C40/);
 const unsupported={schema:'M2-source-dress-moving-face-body-v1',
  genuine163BonePosePair:true,completeConservativeLinearBroadphase:true,
  wholeGarmentFacesExamined:true,fullBodyFacesExamined:true,
  bodyFaces:1,checkedClothFaces:1,potentialPairs:0,
  exactContinuousNarrowphasePerformed:false,
  continuousCollisionCertified:true,releaseAuthorized:true,familyAlpha:'HOLD'};
 assert.throws(()=>assertMovingSourceDressBodySurfaces40(unsupported),/M2 C40/);
 f.dress.mesh.geometry.getAttribute('position').setX(0,99);
 assert.throws(()=>audit(f,start,end),/stale or altered original photographed/);
 f.dress.mesh.geometry.getAttribute('position').setX(0,-.5);
 f.body.geometry.getAttribute('position').setX(0,99);
 assert.throws(()=>audit(f,start,end),/body source topology/);
});
test('C40: cap actual body movement and do not mislabel snapshots as nonlinear moving-bone physics',()=>{
 const f=fixture(),start=capture(f);
 f.bodyBones[0].position.z=.16;
 const end=capture(f);
 assert.throws(()=>audit(f,start,end),/moving body pose exceeds capped linear path/);
 const small=capture(f);
 const original=snap(f.dress.mesh);
 const corrupt=f.dress.mesh.geometry.getAttribute('position').array.slice();
 corrupt[0]=NaN;
 assert.throws(()=>capture(f,corrupt),/M2 C40/);
 assert.deepEqual(snap(f.dress.mesh),original);
 assert.equal(Object.keys(start).length,0,'captured vertex arrays must not escape in public token');
 assert.equal(Object.keys(small).length,0);
});
test('C40: source dress opt-in precommit rejects ambiguous face/body surface but keeps original photo intact',()=>{
 const f=fixture({fullDress:true,bodyZ:-.33}),original=snap(f.dress.mesh);
 const start=capture(f);
 const callback=({endPositions})=>{
  const end=capture(f,endPositions);
  return audit(f,start,end);
 };
 assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptSurfaceAudit40:callback
 }),/C40 incomplete or potentially intersecting/);
 assert.deepEqual(snap(f.dress.mesh),original);
});
test('C40: clear, full original dress opt-in sample stays research-only, with photo/skin unchanged',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),original=snap(f.dress.mesh);
 const start=capture(f);
 const callback=({endPositions})=>audit(f,start,capture(f,endPositions));
 const result=sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptSurfaceAudit40:callback
 });
 assert.equal(result.stats.sourceDressMotionMovingSurfaceVetoObserved40,true);
 assert.equal(result.stats.sourceDressMotionSweptWholeFabricCertified40,false);
 assert.equal(result.stats.sourceDressMotionSweptCollisionCertified,false);
 assert.equal(result.stats.releaseAuthorized,false);
 assert.notDeepEqual(snap(f.dress.mesh).position,original.position);
 for(const name of ['dressRest','dressCustomPhotoProjection','skinIndex','skinWeight'])
  assert.deepEqual(snap(f.dress.mesh)[name],original[name]);
});
