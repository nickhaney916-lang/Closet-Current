/** Adversarial SYNTHETIC tests, not original real 163bone GLB proof. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalCoreSkinWeightSensitivity89 as measure,
 auditOriginalCoreWeightSensitivity89 as audit} from
 '../research/parallel89/skirt-original-core-skin-weight-sensitivity89.mjs';
import {summarizeOriginalSkirtCoreUnknownCauses89 as independent} from
 '../research/parallel89/skirt-original-core-unknown-causes89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({radius=.45,blend='strict',mask=1}={}){
 const bodyPositions=Float32Array.from([
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2, .2,.2,.2, .2,1.8,.2, -.2,1.8,.2
 ]);
 const bodyIndices=Uint16Array.from([
  0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,
  3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5
 ]);
 const skirtPositions=new Float32Array(343*3),
  skirtIndices=new Uint16Array(576*3);
 for(let row=0;row<7;row++)for(let j=0;j<49;j++){
  const k=3*(row*49+j),angle=2*Math.PI*j/48;
  skirtPositions[k]=radius*Math.cos(angle);
  skirtPositions[k+1]=.6+row*.12;
  skirtPositions[k+2]=radius*Math.sin(angle);
 }
 for(let row=0,k=0;row<6;row++)for(let j=0;j<48;j++){
  const a=row*49+j,c=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=c;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=c;skirtIndices[k++]=c+1;
 }
 const originalNames=Array.from({length:163},(_,i)=>
  ({0:'spine04',1:'pelvisL',2:'upperleg01L',3:'finger5-1R',
   4:'UnclassifiedOriginal'}[i]||'sourceBone'+i));
 const skinIndices=new Uint16Array(32),skinWeights=new Float32Array(32);
 const opts={
  strict:[[0,0,0,0],[1,0,0,0]],
  allCore:[[0,1,2,0],[.4,.35,.25,0]],
  exploratory:[[0,1,3,0],[.4,.43,.17,0]],
  headReject:[[3,1,2,0],[.4,.35,.25,0]],
  unknownReject:[[0,1,4,0],[.4,.35,.25,0]],
  nonNormalized:[[0,1,2,0],[.4,.35,.05,0]]
 };
 const [id,w]=opts[blend];
 for(let v=0;v<8;v++){
  skinIndices.set(id,v*4);skinWeights.set(w,v*4);
 }
 return {bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  skinIndices,skinWeights,coreBodyFaceMask:new Uint8Array(12).fill(mask),
  sourceMeshIds:new Uint16Array(8),
  sourceMeshNames:['OriginalFullBody'],
  sourceBoneNamesByMesh:[originalNames]};
}
function compare(f){
 const x=measure(f),prior=independent(f);
 assert.equal(x.schema,'P89-original-skinweighted-core-counterfactual-sensitivity/v1');
 assert.deepEqual(x.strictOriginalSourceRays,{
  inward:prior.strictCoreInwardRays,
  near:prior.strictCoreNearRays,
  outward:prior.strictCoreOutwardRays,
  unknown:prior.strictCoreUnknownRays
 });
 assert.equal(x.originalPhotoSkirtSourceRays,336);
 assert.equal(x.originalSkirtBandSourceCounterfactuals.length,7);
 for(const k of ['counterfactual95','counterfactual80']){
  assert.equal(Object.values(x[k==='counterfactual95'?
   'hypothetical95SourceRays':'hypothetical80SourceRays'])
   .reduce((n,v)=>n+v,0),336);
  assert.equal(Object.values(x.originalStrictUnknownRayCounterfactualOutcomes[k])
   .reduce((n,v)=>n+v,0),x.strictOriginalSourceRays.unknown);
 }
 assert.equal(x.originalStrictCoreMaskAndHalfWeightThresholdRetained,true);
 assert.equal(x.noOriginalSourcePositionsIndicesOrWeightsModified,true);
 assert.equal(x.thresholdsAreResearchScenariosNotConfidenceOrReleaseCriteria,true);
 assert.equal(x.projectedSourceContourNotPhysicalGarmentClearance,true);
 assert.equal(x.originalBodyVolumeStillNotClosedOrSigned,true);
 assert.equal(x.originalPhoto2DFallbackRequired,true);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.releaseAuthorized,false);
 return x;
}
test('strict original full-source torso cube keeps original 336 rays with zero hypothetical changes',()=>{
 const f=fixture(),snap=Object.fromEntries(Object.entries(f)
  .filter(([,v])=>ArrayBuffer.isView(v))
  .map(([k,v])=>[k,v.slice()]));
 const x=compare(f);
 assert.equal(x.actualStrictSourceEligibleCoreFaces,12);
 assert.equal(x.originalLowDominanceMixedFaceCandidates,0);
 assert.equal(x.hypothetical95SourceBoneCoreWeightFaces,0);
 assert.equal(x.hypothetical80SourceBoneCoreWeightFaces,0);
 assert.equal(x.alreadyObservedStrictSourceRaysWhoseClassChanges.counterfactual95,0);
 assert.equal(x.alreadyObservedStrictSourceRaysWhoseClassChanges.counterfactual80,0);
 assert.equal(x.strictOriginalSourceRays.unknown,0);
 for(const [k,v] of Object.entries(snap))assert.deepEqual(f[k],v);
});
test('real named multi-joint torso pelvis upperleg weights each <50%, total named core 100%, supplement is EXPERIMENTAL only',()=>{
 const x=compare(fixture({blend:'allCore'}));
 assert.equal(x.actualStrictSourceEligibleCoreFaces,0);
 assert.equal(x.originalLowDominanceMixedFaceCandidates,12);
 assert.equal(x.hypothetical95SourceBoneCoreWeightFaces,12);
 assert.equal(x.hypothetical80SourceBoneCoreWeightFaces,12);
 assert.equal(x.strictOriginalSourceRays.unknown,336);
 assert.ok(x.originalStrictUnknownRayCounterfactualOutcomes.counterfactual95.outward>0);
 assert.equal(x.originalStrictUnknownRayCounterfactualOutcomes.counterfactual95.inward,0);
 assert.equal(x.originalStrictUnknownRayCounterfactualOutcomes.counterfactual95.unknown,0);
});
test('counterfactual 80% broadens 95% boundary but cannot grant outfit 3D and is not a confidence score',()=>{
 const x=compare(fixture({blend:'exploratory'}));
 assert.equal(x.originalLowDominanceMixedFaceCandidates,12);
 assert.equal(x.hypothetical95SourceBoneCoreWeightFaces,0);
 assert.equal(x.hypothetical80SourceBoneCoreWeightFaces,12);
 assert.equal(x.strictOriginalSourceRays.unknown,336);
 assert.equal(x.hypothetical95SourceRays.unknown,336);
 assert.equal(x.hypothetical80SourceRays.unknown,0);
 assert.equal(x.consumer3DAdmitted,false);
});
test('head/finger dominant blend is not eligible at either threshold when original source core mass is insufficient',()=>{
 const x=compare(fixture({blend:'headReject'}));
 assert.equal(x.actualStrictSourceEligibleCoreFaces,0);
 assert.equal(x.hypothetical95SourceBoneCoreWeightFaces,0);
 assert.equal(x.hypothetical80SourceBoneCoreWeightFaces,0);
 assert.equal(x.strictOriginalSourceRays.unknown,336);
 assert.equal(x.hypothetical80SourceRays.unknown,336);
});
test('unclassified original bone influence cannot count as a named source body core mass',()=>{
 const x=compare(fixture({blend:'unknownReject'}));
 assert.equal(x.hypothetical95SourceBoneCoreWeightFaces,0);
 assert.equal(x.hypothetical80SourceBoneCoreWeightFaces,0);
 assert.equal(x.unsupportedMixedSourceBoneFacesAt80,12);
});
test('original face mask zero blocks ALL hypothetical face inclusion including all-core original skin blend',()=>{
 const x=compare(fixture({blend:'allCore',mask:0}));
 assert.equal(x.hypothetical95SourceBoneCoreWeightFaces,0);
 assert.equal(x.hypothetical80SourceBoneCoreWeightFaces,0);
 assert.equal(x.strictOriginalSourceRays.unknown,336);
 assert.equal(x.hypothetical95SourceRays.unknown,336);
});
test('body inside original garment must be a detected hypothetical inward witness and never approved',()=>{
 const x=compare(fixture({blend:'allCore',radius:.1}));
 assert.ok(x.originalStrictUnknownRayCounterfactualOutcomes.counterfactual95.inward>0);
 assert.equal(x.consumer3DAdmitted,false);
});
test('source-locked original photo and old independent baseline mismatches fail CLOSED',()=>{
 const f=fixture(),prior=independent(f);
 const args={...f,avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:RIG,originalRig163Bones:true,
  selectedMeasuredFivePoseBvh:true,selectedActualWebGLPreview:true,
  previousIndependentOriginalCoreCauseReport:prior};
 const good=audit(args);
 assert.equal(good.status,'ORIGINAL_BONE_BLEND_SENSITIVITY_RESEARCH_NOT_WEARABLE');
 assert.equal(good.originalCoreRaysCrossChecked336,true);
 assert.equal(good.originalPhoto2DFallbackRequired,true);
 assert.equal(good.consumer3DAdmitted,false);
 for(const bad of [
  {avatar:'private'}, {pose:'continuous'},
  {sourcePhotoSHA256:'0'.repeat(64)},
  {sourceAnatomyGLBSHA256:'0'.repeat(64)},
  {originalRig163Bones:false},
  {selectedMeasuredFivePoseBvh:false},
  {selectedActualWebGLPreview:false},
  {previousIndependentOriginalCoreCauseReport:{
   ...prior,strictCoreUnknownRays:3}},
  {previousIndependentOriginalCoreCauseReport:{
   ...prior,sourceSevenSkirtBandCauseBreakdown:[]}},
  {coreBodyFaceMask:new Uint8Array(1)}
 ]){
  const result=audit({...args,...bad});
  assert.equal(result.status,'SOURCE_SKIN_WEIGHT_COUNTERFACTUAL_UNVERIFIED');
  assert.equal(result.originalPhoto2DFallbackRequired,true);
  assert.equal(result.releaseAuthorized,false);
 }
});
test('original source 163bone weight integrity, mesh indices and photos reject corruption',()=>{
 const f=fixture();
 for(const changed of [
  {bodyPositions:Float32Array.from(f.bodyPositions,(v,i)=>i===0?NaN:v)},
  {skirtPositions:Float32Array.from(f.skirtPositions,(v,i)=>i===0?NaN:v)},
  {skirtIndices:Uint16Array.from(f.skirtIndices,(v,i)=>i===0?999:v)},
  {bodyIndices:Uint16Array.from(f.bodyIndices,(v,i)=>i===0?999:v)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?163:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?0:v)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?9:v)},
  {sourceBoneNamesByMesh:[['fake']]},
  {sourceMeshNames:['']}
 ])assert.throws(()=>measure({...f,...changed}));
 assert.throws(()=>measure(fixture({blend:'nonNormalized'})));
});
