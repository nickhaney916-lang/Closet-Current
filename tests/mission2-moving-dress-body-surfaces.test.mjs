import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {captureSourceDressBodyPose40,auditMovingSourceDressBodySurfaces40,
 assertMovingSourceDressBodySurfaces40,
 auditMovingSourceDressBodyIntervals41,assertMovingSourceDressBodyIntervals41,
 auditSourceDressArticulatedPoseSamples42,assertSourceDressArticulatedPoseSamples42,
 auditSourceDressHighCadencePose43,assertSourceDressHighCadencePose43,
 auditSourceDressSelfContact44,assertSourceDressSelfContact44}
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
const capture=(f,stagedPositions=null,poseFraction=null)=>captureSourceDressBodyPose40({
 root:f.root,dress:f.dress,stagedPositions,poseFraction
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
 assert.throws(()=>audit(f,start,end),/M2 C40 source surface sweep original source/);
 f.dress.mesh.geometry.getAttribute('position').setX(0,-.5);
 f.body.geometry.getAttribute('position').setX(0,99);
 assert.throws(()=>audit(f,start,end),/M2 C40 source surface sweep original source/);
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

test('C40: a changed photographed projection, skin weight, or body-scene roster invalidates captured evidence',()=>{
 for(const change of ['photo','skin','missing-body']){
  const f=fixture({fullDress:true,bodyZ:-2});
  const start=capture(f),end=capture(f);
  const before=structuredClone(snap(f.dress.mesh));
  if(change==='photo')
   f.dress.mesh.geometry.getAttribute('dressCustomPhotoProjection').setX(1,42);
  if(change==='skin')
   f.dress.mesh.geometry.getAttribute('skinWeight').setX(2,.5);
  if(change==='missing-body')f.body.userData.work56Garment=true;
  assert.throws(()=>audit(f,start,end),/M2 C40/,
   'stale owner/source/body capture cannot silently approve research movement');
  if(change==='missing-body')assert.deepEqual(snap(f.dress.mesh),before);
 }
});


const intervalAudit=(f,startPose,endPose,extra={})=>
 auditMovingSourceDressBodyIntervals41({
  root:f.root,dress:f.dress,startPose,endPose,...extra
 });

test('C41: coplanar DISJOINT source cloth/body triangles overlap C40 AABBs yet have a provable temporal separating axis',()=>{
 const f=fixture(),cloth=f.dress.mesh.geometry.getAttribute('position');
 const body=f.body.geometry.getAttribute('position');
 // A = right triangle x+y <= .100; B = right triangle x+y >= .160.
 // Their X and Y AABBs nevertheless overlap by 20mm on both axes.
 cloth.setXYZ(0,0,0,0);cloth.setXYZ(1,.1,0,0);cloth.setXYZ(2,0,.1,0);
 body.setXYZ(0,.08,.08,0);body.setXYZ(1,.18,.08,0);body.setXYZ(2,.08,.18,0);
 const pristine=snap(f.dress.mesh);
 const first=capture(f),next=cloth.array.slice();
 for(let j=0;j<next.length;j+=3)next[j]-=.004;
 f.bodyBones[0].position.x=.004;
 const last=capture(f,next);
 const coarse=audit(f,first,last),fine=intervalAudit(f,first,last);
 assert.ok(coarse.potentialPairs>0,
  'pure swept bounding-box veto refuses safe separated coplanar triangles');
 assert.equal(fine.broadphasePotentialPairs,coarse.potentialPairs);
 assert.equal(fine.provenSeparatedPairs,coarse.potentialPairs);
 assert.equal(fine.unresolvedPairs,0,
  'fixed separating-axis envelopes prove disjoint for every linear time');
 assert.ok(fine.temporalNodes>=1);
 assert.equal(fine.movingBodyObserved,true);
 assert.equal(fine.exactContinuousTimeOfImpactMeasured,false);
 assert.equal(fine.nonlinearBoneMotionCertified,false);
 assert.equal(fine.continuousCollisionCertified,false);
 const safe=assertMovingSourceDressBodyIntervals41(fine);
 assert.equal(safe.linearTimeIntervalsSeparated,true);
 assert.equal(safe.releaseAuthorized,false);
 assert.deepEqual(snap(f.dress.mesh),pristine);
});

test('C41: face-only source crossing missed by C39 vertex sweep remains unresolved and VETOED in temporal narrowphase',()=>{
 const f=fixture(),pristine=snap(f.dress.mesh);
 const first=capture(f),ending=f.dress.mesh.geometry.getAttribute('position').array.slice();
 for(let j=2;j<ending.length;j+=3)ending[j]=.012;
 const last=capture(f,ending);
 const fine=intervalAudit(f,first,last);
 assert.ok(fine.broadphasePotentialPairs>0);
 assert.ok(fine.unresolvedPairs>0);
 assert.equal(fine.provenSeparatedPairs+fine.unresolvedPairs,fine.broadphasePotentialPairs);
 assert.throws(()=>assertMovingSourceDressBodyIntervals41(fine),
  /unresolved moving cloth\/body temporal/);
 assert.deepEqual(snap(f.dress.mesh),pristine);
});

test('C41: independently moving 163-bone body stays unresolved when it sweeps through still cloth',()=>{
 const f=fixture(),cloth=f.dress.mesh.geometry.getAttribute('position');
 for(let i=0;i<cloth.count;i++)cloth.setZ(i,0);
 const pristine=snap(f.dress.mesh);
 f.bodyBones[0].position.z=-.012;
 const first=capture(f);
 f.bodyBones[0].position.z=.012;
 const last=capture(f),fine=intervalAudit(f,first,last);
 assert.equal(fine.movingBodyObserved,true);
 assert.ok(fine.maximumBodyShiftMeters>.02);
 assert.ok(fine.unresolvedPairs>0);
 assert.equal(fine.exactContinuousTimeOfImpactMeasured,false);
 assert.throws(()=>assertMovingSourceDressBodyIntervals41(fine),
  /unresolved moving cloth\/body temporal/);
 assert.deepEqual(snap(f.dress.mesh),pristine);
});

test('C41: temporal budgets and forged or stale pose receipts never report clearance',()=>{
 const f=fixture();
 const first=capture(f),ending=f.dress.mesh.geometry.getAttribute('position').array.slice();
 for(let j=2;j<ending.length;j+=3)ending[j]=.012;
 const last=capture(f,ending);
 for(const extra of [
  {maxDepth:-1},{maxDepth:16},{maxTemporalNodes:0},
  {maxBroadphasePairs:0},{maxBroadphaseCandidates:0},
  {maxTemporalNodes:1}
 ])assert.throws(()=>intervalAudit(f,first,last,extra),/M2 C40/);
 assert.throws(()=>intervalAudit(f,{},last),/M2 C40/);
 assert.throws(()=>assertMovingSourceDressBodyIntervals41({
  schema:'M2-source-dress-linear-triangle-intervals-v1',
  completeBoundedTemporalIntervalAudit:true,
  originalSourceAndBodyProvenanceVerified:true,allBroadphasePairsExamined:true,
  bodyFaces:1,clothFaces:1,
  broadphasePotentialPairs:1,provenSeparatedPairs:1,unresolvedPairs:0,
  exactContinuousTimeOfImpactMeasured:false,
  nonlinearBoneMotionCertified:false,continuousCollisionCertified:true,
  releaseAuthorized:true,familyAlpha:'HOLD'
 }),/M2 C40/);
 // Original photo projection, body source and owner source identity are
 // guarded by the inherited C40 immutable opaque-capture provenance.
 f.dress.mesh.geometry.getAttribute('position').setX(0,4);
 assert.throws(()=>intervalAudit(f,first,last),/M2 C40/);
});

test('C41: clear photo-source P61-style full dress passes opt-in interval guard but can NEVER approve release',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),pristine=snap(f.dress.mesh);
 const first=capture(f);
 const callback=({endPositions})=>intervalAudit(f,first,capture(f,endPositions));
 const after=sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptIntervalAudit41:callback
 });
 assert.equal(after.stats.sourceDressMotionLinearIntervalGuardObserved41,true);
 assert.equal(after.stats.sourceDressMotionExactContinuousCollisionCertified41,false);
 assert.equal(after.stats.sourceDressMotionRealClothPhysics,false);
 assert.equal(after.stats.sourceDressMotionHumanVisualAcceptance,false);
 assert.equal(after.stats.releaseAuthorized,false);
 for(const name of ['dressRest','dressCustomPhotoProjection','skinIndex','skinWeight'])
  assert.deepEqual(snap(f.dress.mesh)[name],pristine[name]);
 assert.notDeepEqual(snap(f.dress.mesh).position,pristine.position);
});

test('C41: uncertain source dress full-face interval refuses BEFORE source photo/normal/skin mutation',()=>{
 const f=fixture({fullDress:true,bodyZ:-.33}),pristine=snap(f.dress.mesh);
 const first=capture(f);
 const callback=({endPositions})=>intervalAudit(f,first,capture(f,endPositions));
 assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptIntervalAudit41:callback
 }),/C41 incomplete or unresolved/);
 assert.deepEqual(snap(f.dress.mesh),pristine);
 assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptIntervalAudit41:()=>({schema:'fake'})
 }),/C41 incomplete or unresolved/);
 assert.deepEqual(snap(f.dress.mesh),pristine);
});

const sampleRotations42=(f,{angles=[0,Math.PI/4,Math.PI/2,Math.PI/4,0],
 stagedEnd=null}={})=>{
 const tokens=[];
 for(let i=0;i<angles.length;i++){
  f.bodyBones[0].rotation.z=angles[i];
  tokens.push(capture(f,i===angles.length-1?stagedEnd:null,i/(angles.length-1)));
 }
 return tokens;
};
const sampled42=(f,tokens,extra={})=>auditSourceDressArticulatedPoseSamples42({
 root:f.root,dress:f.dress,poseTokens:tokens,
 startPositions:f.dress.mesh.geometry.getAttribute('position').array.slice(),
 endPositions:f.dress.mesh.geometry.getAttribute('position').array.slice(),...extra
});
test('C42: true 163-bone rotation to intermediate collision and BACK defeats identical-endpoint linear C41',()=>{
 const f=fixture(),cloth=f.dress.mesh.geometry.getAttribute('position'),
  body=f.body.geometry.getAttribute('position');
 // The rotating body triangle maps exactly onto the source cloth triangle
 // at 90 degrees, but starts and ends remote from the cloth.
 cloth.setXYZ(0,-.04,.24,0);cloth.setXYZ(1,.04,.24,0);
 cloth.setXYZ(2,-.04,.30,0);
 body.setXYZ(0,.24,.04,0);body.setXYZ(1,.24,-.04,0);
 body.setXYZ(2,.30,.04,0);
 const before=snap(f.dress.mesh);
 const tokens=sampleRotations42(f);
 const chord=audit(f,tokens[0],tokens.at(-1));
 const linear=intervalAudit(f,tokens[0],tokens.at(-1));
 assert.equal(chord.potentialPairs,0,'identical endpoint poses have no possible crossing');
 assert.equal(linear.unresolvedPairs,0,'C41 linear chord misses nonlinear middle swing');
 const evidence=sampled42(f,tokens);
 assert.equal(evidence.poseSamples,5);
 assert.equal(evidence.sampledIntervals,4);
 assert.equal(evidence.genuineIntermediateBodyRotationsObserved,true);
 assert.ok(evidence.rotatedBodyJointIntervals>=2);
 assert.ok(evidence.broadphasePotentialPairs>0);
 assert.ok(evidence.unresolvedPairs>0);
 assert.equal(evidence.actualNonlinearMotionBetweenSamplesCertified,false);
 assert.equal(evidence.collisionFreeContinuousRotationCertified,false);
 assert.throws(()=>assertSourceDressArticulatedPoseSamples42(evidence),
  /intermediate 163-bone pose may cross/);
 assert.deepEqual(snap(f.dress.mesh),before);
 assert.deepEqual(Object.keys(tokens[2]),[],
  'original bone orientations/posed coordinates cannot escape opaque token');
});
test('C42: genuine far-body joint rotation across 5 intermediate samples clears only research veto',()=>{
 const f=fixture({bodyZ:2}),before=snap(f.dress.mesh);
 const tokens=sampleRotations42(f,{angles:[0,.18,.37,.18,0]});
 const receipt=sampled42(f,tokens);
 assert.equal(receipt.unresolvedPairs,0);
 assert.ok(receipt.rotatedBodyJointIntervals>=2);
 assert.equal(receipt.sampledIntervals,4);
 assert.equal(receipt.maximumObservedPoseFractionGap,.25);
 const verdict=assertSourceDressArticulatedPoseSamples42(receipt);
 assert.equal(verdict.allSampledIntervalsSeparated,true);
 assert.equal(verdict.unsampledNonlinearMotionNotCertified,true);
 assert.equal(verdict.releaseAuthorized,false);
 assert.deepEqual(snap(f.dress.mesh),before);
});
test('C42: missing actual intermediate poses, wrong phase order and forged release evidence fail closed',()=>{
 const f=fixture({bodyZ:2}),tokens=sampleRotations42(f);
 const original=snap(f.dress.mesh);
 for(const extra of [
  {poseTokens:tokens.slice(0,4)},
  {poseTokens:[tokens[0],tokens[1],tokens[2],tokens[1],tokens[4]]},
  {poseTokens:[tokens[0],tokens[2],tokens[1],tokens[3],tokens[4]]},
  {maxTimeGap:.24},{maxPoseSamples:4},{maxTemporalNodesPerInterval:0},
  {endPositions:new Float32Array(9)}
 ])assert.throws(()=>sampled42(f,tokens,extra),/M2 C40/);
 assert.throws(()=>assertSourceDressArticulatedPoseSamples42({
  schema:'M2-source-dress-articulated-pose-samples-v1',
  genuineIntermediateBodyRotationsObserved:true,
  fullProvidedPoseSequenceChecked:true,matchedOriginalPhotoSourceStartEnd:true,
  allSampledPairsAccounted:true,poseSamples:5,sampledIntervals:4,
  broadphasePotentialPairs:0,provenSeparatedPairs:0,unresolvedPairs:0,
  actualNonlinearMotionBetweenSamplesCertified:true,
  collisionFreeContinuousRotationCertified:true,
  releaseAuthorized:true,familyAlpha:'HOLD'
 }),/M2 C40/);
 assert.deepEqual(snap(f.dress.mesh),original);
});
test('C42: failed frozen original-photograph source data rejects independent captured rotation sequence',()=>{
 const f=fixture({bodyZ:2}),tokens=sampleRotations42(f);
 f.dress.mesh.geometry.getAttribute('position').setX(1,99);
 assert.throws(()=>sampled42(f,tokens),/M2 C40/);
});
test('C42: full 163-bone source dress opt-in checks real intermediate body joint phases before write',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),pristine=snap(f.dress.mesh);
 const callback=({startPositions,endPositions})=>{
  const tokens=sampleRotations42(f,{
   angles:[0,.08,.16,.08,0],stagedEnd:endPositions
  });
  return auditSourceDressArticulatedPoseSamples42({
   root:f.root,dress:f.dress,poseTokens:tokens,
   startPositions,endPositions,maxBodyShiftMeters:.25
  });
 };
 const result=sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptArticulatedAudit42:callback
 });
 assert.equal(result.stats.sourceDressMotionArticulatedSamplesObserved42,true);
 assert.equal(result.stats.sourceDressMotionContinuousBoneRotationCertified42,false);
 assert.equal(result.stats.sourceDressMotionRealClothPhysics,false);
 assert.equal(result.stats.releaseAuthorized,false);
 assert.notDeepEqual(snap(f.dress.mesh).position,pristine.position);
 for(const name of ['dressRest','dressCustomPhotoProjection','skinIndex','skinWeight'])
  assert.deepEqual(snap(f.dress.mesh)[name],pristine[name]);
});
test('C42: explicit incomplete or forged articulated receipt refuses source dress motion before photo change',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),pristine=snap(f.dress.mesh);
 assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptArticulatedAudit42:()=>({
   schema:'M2-source-dress-articulated-pose-samples-v1',
   fullProvidedPoseSequenceChecked:true,genuineIntermediateBodyRotationsObserved:true,
   matchedOriginalPhotoSourceStartEnd:true,allSampledPairsAccounted:true,
   poseSamples:5,sampledIntervals:4,unresolvedPairs:1,
   provenSeparatedPairs:0,broadphasePotentialPairs:1,
   actualNonlinearMotionBetweenSamplesCertified:false,
   collisionFreeContinuousRotationCertified:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  })
 }),/C42 incomplete or unsafe/);
 assert.deepEqual(snap(f.dress.mesh),pristine);
});

const captureHighCadence43=(f,{angles=null,stagedEnd=null,
 count=17}={})=>{
 const tokens=[];
 for(let i=0;i<count;i++){
  const phase=i/(count-1);
  f.bodyBones[0].rotation.z=angles?.[i]??.12*Math.sin(2*Math.PI*phase);
  tokens.push(capture(f,i===count-1?stagedEnd:null,phase));
 }
 return tokens;
};
const highAudit43=(f,tokens,other={})=>auditSourceDressHighCadencePose43({
 root:f.root,dress:f.dress,poseTokens:tokens,
 startPositions:f.dress.mesh.geometry.getAttribute('position').array.slice(),
 endPositions:f.dress.mesh.geometry.getAttribute('position').array.slice(),
 ...other
});

test('C43: 17 REAL body poses reveal short 1/16-phase collision missed by valid five-pose C42 schedule',()=>{
 const f=fixture(),cloth=f.dress.mesh.geometry.getAttribute('position'),
  body=f.body.geometry.getAttribute('position');
 // At 0° body stays around Y=-.015 to .015; at +10° the moving
 // tiny anatomical face sweeps into the photograph-cloth triangle.
 cloth.setXYZ(0,.225,.035,0);
 cloth.setXYZ(1,.237,.037,0);
 cloth.setXYZ(2,.223,.049,0);
 body.setXYZ(0,.24,-.015,0);
 body.setXYZ(1,.26,-.015,0);
 body.setXYZ(2,.24,.015,0);
 const original=snap(f.dress.mesh);
 const angles=Array.from({length:17},(_,i)=>i===1?10*Math.PI/180:
   .02*Math.sin(Math.PI*i/16));
 const tokens=captureHighCadence43(f,{angles});
 const quarter=[tokens[0],tokens[4],tokens[8],tokens[12],tokens[16]];
 const coarse=sampled42(f,quarter);
 assert.equal(coarse.unresolvedPairs,0,
  'C42 quarter-phase samples miss the narrow but genuine intervening swing');
 assert.equal(assertSourceDressArticulatedPoseSamples42(coarse).releaseAuthorized,false);
 const fine=highAudit43(f,tokens);
 assert.equal(fine.poseSamples,17);
 assert.equal(fine.sampledIntervals,16);
 assert.ok(fine.broadphasePotentialPairs>0);
 assert.ok(fine.unresolvedPairs>0,
  'actual 1/16-phase body triangle collision must not receive permission');
 assert.ok(fine.maxObservedJointStepDegrees<12);
 assert.throws(()=>assertSourceDressHighCadencePose43(fine),
  /unresolved genuinely sampled body/);
 assert.deepEqual(snap(f.dress.mesh),original);
});

test('C43: distant actual 163-bone 17-sample moving rig passes research-only bounded motion',()=>{
 const f=fixture({bodyZ:2}),original=snap(f.dress.mesh);
 const tokens=captureHighCadence43(f);
 const proof=highAudit43(f,tokens);
 assert.equal(proof.completeUniformPoseGrid,true);
 assert.equal(proof.sampledIntervals,16);
 assert.equal(proof.verifiedBodyBoneComparisons,16*163);
 assert.ok(proof.rotatedIntervals>0);
 assert.ok(proof.movingBodyVertices>0);
 assert.ok(proof.maxObservedJointStepDegrees<12);
 assert.ok(proof.maxObservedBodyStepMeters<.06);
 assert.equal(proof.unresolvedPairs,0);
 assert.equal(proof.actualMotionBetweenSamplesCertified,false);
 const decision=assertSourceDressHighCadencePose43(proof);
 assert.equal(decision.allCapturedSubframeIntervalsSeparated,true);
 assert.equal(decision.unobservedHighFrequencyMotionNotCertified,true);
 assert.equal(decision.releaseAuthorized,false);
 assert.deepEqual(snap(f.dress.mesh),original);
 assert.deepEqual(Object.keys(tokens[8]),[],
  'opaque body pose must not expose source XYZ or user data');
});

test('C43: intentionally undersampled large anatomical rotation is rejected although source body is far away',()=>{
 const f=fixture({bodyZ:2}),angles=Array(17).fill(0);
 angles[1]=.7;
 const tokens=captureHighCadence43(f,{angles}),original=snap(f.dress.mesh);
 assert.throws(()=>highAudit43(f,tokens),
  /C43 undersampled excessive real bone rotation step/);
 assert.deepEqual(snap(f.dress.mesh),original);
});

test('C43: invalid phase grid, missing frames, duplicate samples and shifted body pose fail closed',()=>{
 const f=fixture({bodyZ:2}),tokens=captureHighCadence43(f),original=snap(f.dress.mesh);
 const irregular=capture(f,null,.33);
 for(const values of [
  tokens.slice(0,16),
  [tokens[0],tokens[0],...tokens.slice(2)],
  [tokens[0],irregular,...tokens.slice(2)],
  [tokens[0],tokens[2],tokens[1],...tokens.slice(3)],
  [...tokens,irregular]
 ])assert.throws(()=>highAudit43(f,values),/M2 C40/);
 for(const options of [
  {maxJointStepDegrees:0},{maxJointStepDegrees:13},
  {maxBodyVertexStepMeters:0},{maxBodyVertexStepMeters:.1},
  {maxTemporalNodesPerInterval:0},
  {startPositions:new Float32Array(3)}
 ])assert.throws(()=>highAudit43(f,tokens,options),/M2 C40/);
 assert.throws(()=>assertSourceDressHighCadencePose43({
  schema:'M2-source-dress-high-cadence-joint-guard-v1',
  originalSourceAndSkinVerified:true,completeUniformPoseGrid:true,
  independentlyCaptured163BoneBody:true,fullProvidedPoseSequenceChecked:true,
  poseSamples:17,sampledIntervals:16,
  verifiedBodyBoneComparisons:2608,rotatedIntervals:8,movingBodyVertices:8,
  maxObservedJointStepDegrees:1,maxAllowedJointStepDegrees:12,
  maxObservedBodyStepMeters:.002,maxAllowedBodyStepMeters:.06,
  broadphasePotentialPairs:0,provenSeparatedPairs:0,unresolvedPairs:0,
  allSampledPairsAccounted:true,actualMotionBetweenSamplesCertified:true,
  continuousNonlinearBoneRotationCertified:true,releaseAuthorized:true,
  familyAlpha:'HOLD'
 }),/M2 C40/);
 assert.deepEqual(snap(f.dress.mesh),original);
});

test('C43: real body surface jump beyond physical subframe limit refuses even small joint angle',()=>{
 const f=fixture({bodyZ:2});
 const tokens=[];
 for(let i=0;i<17;i++){
  f.bodyBones[0].rotation.z=.01*Math.sin(Math.PI*i/16);
  f.bodyBones[0].position.z=i===1?.12:0;
  tokens.push(capture(f,null,i/16));
 }
 assert.throws(()=>highAudit43(f,tokens),
  /C43 undersampled excessive skinned body surface displacement/);
});

test('C43: full source photographed dress passes only an opt-in safe REAL sampled high-cadence guard',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),original=snap(f.dress.mesh);
 const callback=({startPositions,endPositions})=>{
  const tokens=captureHighCadence43(f,{stagedEnd:endPositions});
  return auditSourceDressHighCadencePose43({
   root:f.root,dress:f.dress,poseTokens:tokens,startPositions,endPositions
  });
 };
 const result=sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptHighCadenceAudit43:callback
 });
 assert.equal(result.stats.sourceDressMotionHighCadenceObserved43,true);
 assert.equal(result.stats.sourceDressMotionHighFrequencyBoneMotionCertified43,false);
 assert.equal(result.stats.sourceDressMotionRealClothPhysics,false);
 assert.equal(result.stats.releaseAuthorized,false);
 assert.notDeepEqual(snap(f.dress.mesh).position,original.position);
 for(const key of ['dressRest','dressCustomPhotoProjection','skinIndex','skinWeight'])
  assert.deepEqual(snap(f.dress.mesh)[key],original[key]);
});

test('C43: incomplete/forged sampled motion refuses BEFORE photographed XYZ and normals are written',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),original=snap(f.dress.mesh);
 assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptHighCadenceAudit43:()=>({
   schema:'M2-source-dress-high-cadence-joint-guard-v1',
   originalSourceAndSkinVerified:true,completeUniformPoseGrid:true,
   independentlyCaptured163BoneBody:true,fullProvidedPoseSequenceChecked:true,
   poseSamples:17,sampledIntervals:16,
   rotatedIntervals:4,movingBodyVertices:4,
   maxObservedJointStepDegrees:2,maxAllowedJointStepDegrees:12,
   maxObservedBodyStepMeters:.003,maxAllowedBodyStepMeters:.06,
   broadphasePotentialPairs:1,provenSeparatedPairs:0,unresolvedPairs:1,
   allSampledPairsAccounted:true,actualMotionBetweenSamplesCertified:false,
   continuousNonlinearBoneRotationCertified:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  })
 }),/C43 incomplete or unsafe/);
 assert.deepEqual(snap(f.dress.mesh),original);
});

const clothed44=(positions,index=null)=>{
 const f=fixture({bodyZ:2}),g=f.dress.mesh.geometry;
 const count=positions.length/3;
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const ids=new Uint16Array(count*4),weights=new Float32Array(count*4);
 for(let i=0;i<count;i++)weights[i*4]=1;
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 if(index)g.setIndex(index);
 return f;
};
const self44=(f,poseToken=null,options={})=>
 auditSourceDressSelfContact44({
  root:f.root,dress:f.dress,poseToken:poseToken??capture(f),...options
 });
test('C44: two NONADJACENT real 163-bone skinned cloth triangles intersect in 3D and veto research',()=>{
 const f=clothed44([
  -.15,-.10,0,.15,-.10,0,0,.15,0,
  0,-.07,-.10,0,-.07,.10,0,.10,0
 ]);
 const original=snap(f.dress.mesh),token=capture(f);
 const report=self44(f,token);
 assert.equal(report.schema,'M2-source-dress-self-contact-v1');
 assert.equal(report.originalFaceCount,2);
 assert.equal(report.checkedOriginalFaces,2);
 assert.ok(report.unresolvedPairs>0);
 assert.equal(report.actual163BoneSkinnedPose,true);
 assert.equal(report.actualContinuousSelfContactCertified,false);
 assert.throws(()=>assertSourceDressSelfContact44(report),
  /potentially self-intersecting original source garment/);
 assert.deepEqual(snap(f.dress.mesh),original);
 assert.deepEqual(Object.keys(token),[]);
});
test('C44: real topological shared-edge neighbors are excluded, but disconnected matching seam is not assumed safe',()=>{
 const joined=clothed44([
  0,0,0,1,0,0,0,1,0,1,1,0
 ],[0,1,2,1,3,2]);
 const joinedResult=self44(joined);
 assert.equal(joinedResult.unresolvedPairs,0);
 assert.ok(joinedResult.adjacentPairsExcluded>=1);
 assert.equal(assertSourceDressSelfContact44(joinedResult).releaseAuthorized,false);
 const seam=clothed44([
  0,0,0,1,0,0,0,1,0,
  1,0,0,1,1,0,0,1,0
 ]);
 const seamResult=self44(seam);
 assert.ok(seamResult.unresolvedPairs>0,
  'two disconnected source faces meeting across source UV seam need confirmation');
 assert.throws(()=>assertSourceDressSelfContact44(seamResult),/potentially self-intersecting/);
});
test('C44: nonadjacent well separated triangles pass a research-only source-self-contact veto',()=>{
 const f=clothed44([
  0,0,0,.1,0,0,0,.1,0,
  .3,.3,0,.4,.3,0,.3,.4,0
 ]);
 const original=snap(f.dress.mesh),proof=self44(f);
 assert.equal(proof.unresolvedPairs,0);
 assert.equal(proof.checkedOriginalFaces,2);
 assert.equal(proof.completeNonadjacentFaceAudit,true);
 assert.equal(proof.releaseAuthorized,false);
 const verdict=assertSourceDressSelfContact44(proof);
 assert.equal(verdict.sampledSourceSelfContactVetoPassed,true);
 assert.equal(verdict.completeClothContactNotCertified,true);
 assert.deepEqual(snap(f.dress.mesh),original);
});
test('C44: invalid bounds, stale original source and changing body roster fail closed',()=>{
 const f=clothed44([
  0,0,0,.1,0,0,0,.1,0,
  .3,.3,0,.4,.3,0,.3,.4,0
 ]),original=snap(f.dress.mesh),token=capture(f);
 for(const other of [
  {poseToken:{}},{maxSourceFaces:1},{maxTriangleCandidates:0},
  {maxUnresolvedPairs:0},{toleranceMeters:.003},
  {toleranceMeters:NaN}
 ])assert.throws(()=>self44(f,token,other),/M2 C40/);
 const damaged={schema:'M2-source-dress-self-contact-v1',
  originalSourceAndSkinVerified:true,actual163BoneSkinnedPose:true,
  completeNonadjacentFaceAudit:true,originalFaceCount:2,checkedOriginalFaces:1,
  candidateTriangles:1,unresolvedPairs:0,
  topologicalNeighborsExcluded:true,
  disconnectedSeamCollisionsUnresolved:true,
  actualContinuousSelfContactCertified:false,
  selfContactPhysicsCertified:false,
  releaseAuthorized:true,familyAlpha:'HOLD'};
 assert.throws(()=>assertSourceDressSelfContact44(damaged),/M2 C40/);
 f.dress.mesh.geometry.getAttribute('skinWeight').setX(0,.5);
 assert.throws(()=>self44(f,token),/original source\/photo\/skin data/);
 f.dress.mesh.geometry.getAttribute('skinWeight').setX(0,1);
 f.body.userData.work56Garment=true;
 assert.throws(()=>self44(f,token),/body roster altered/);
 assert.deepEqual(snap(f.dress.mesh).position,original.position);
});
test('C44: opt-in source-dress callback rejects actual unresolved self-contact before writing source normals or photographs',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),original=snap(f.dress.mesh);
 const callback=({endPositions})=>self44(f,capture(f,endPositions));
 // Native original cylinder seam topology may contain touching disconnected
 // source pieces, or its deformed skirt may self-intersect. Either is a
 // conservative veto; never fabricate a ground-truth "seam safe" label.
 // The native original dress has thousands of source faces and UV-split
 // seam boundaries. A bounded scan may conservatively reject before
 // finishing; incomplete scanning MUST NOT authorize original-photo edits.
 let receipt=null,incomplete=false;
 try{receipt=callback({endPositions:original.position.slice()});}
 catch(error){
  assert.match(error.message,/C44 self-contact evidence incomplete/);
  incomplete=true;
 }
 if(incomplete||receipt.unresolvedPairs){
  assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
   phase:.25,sweptSelfContactAudit44:callback
  }),/C44 self-contact evidence incomplete|C44 incomplete or possibly self-contacting/);
  assert.deepEqual(snap(f.dress.mesh),original,
   'over-budget original source garment must be byte-preserved');
 }else{
  const result=sampleSourceDressMotion36(f.dress,f.root,{
   phase:.25,sweptSelfContactAudit44:callback
  });
  assert.equal(result.stats.sourceDressMotionSelfContactAuditObserved44,true);
  assert.equal(result.stats.sourceDressMotionContinuousSelfContactCertified44,false);
  assert.equal(result.stats.releaseAuthorized,false);
 }
 for(const name of ['dressRest','dressCustomPhotoProjection','skinIndex','skinWeight'])
  assert.deepEqual(snap(f.dress.mesh)[name],original[name]);
});
test('C44: fabricated green self-contact evidence may not report full cloth physics or authorize original-photo release',()=>{
 const f=fixture({fullDress:true,bodyZ:-2}),original=snap(f.dress.mesh);
 assert.throws(()=>sampleSourceDressMotion36(f.dress,f.root,{
  phase:.25,sweptSelfContactAudit44:()=>({
   schema:'M2-source-dress-self-contact-v1',
   originalSourceAndSkinVerified:true,actual163BoneSkinnedPose:true,
   completeNonadjacentFaceAudit:true,originalFaceCount:2,
   checkedOriginalFaces:2,unresolvedPairs:1,
   topologicalNeighborsExcluded:true,
   disconnectedSeamCollisionsUnresolved:true,
   actualContinuousSelfContactCertified:false,
   selfContactPhysicsCertified:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  })
 }),/C44 incomplete or possibly self-contacting/);
 assert.deepEqual(snap(f.dress.mesh),original);
});
