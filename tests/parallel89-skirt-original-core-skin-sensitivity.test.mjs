/** Only synthetic adversarial tests. True original 163-bone GLBs/photo are
 * independently exercised in real Chromium/WebKit native no-deploy CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalCoreSkinSensitivity89 as measure,
 auditOriginalCoreSkinSensitivity89 as audit} from
 '../research/parallel89/skirt-original-core-skin-sensitivity89.mjs';
import {summarizeOriginalMissingRayBoneNames89 as prior} from
 '../research/parallel89/skirt-original-core-nohit-source-bones89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({masked=true,partial=false,offset=0}={}){
 const bodyPositions=Float32Array.from([
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2, .2,.2,.2, .2,1.8,.2, -.2,1.8,.2
 ],(x,i)=>i%3===0?x+offset:x);
 const original=Uint16Array.from([
  0,2,1,0,3,2,4,5,6,4,6,7,
  0,1,5,0,5,4,3,7,6,3,6,2,
  0,4,7,0,7,3,1,2,6,1,6,5
 ]);
 const bodyIndices=partial?original.slice(0,18):original;
 const skirtPositions=new Float32Array(343*3),
  skirtIndices=new Uint16Array(576*3);
 for(let row=0;row<7;row++)for(let j=0;j<49;j++){
  const v=3*(row*49+j),angle=j*2*Math.PI/48;
  skirtPositions[v]=Math.cos(angle)*.45;
  skirtPositions[v+1]=.6+row*.12;
  skirtPositions[v+2]=Math.sin(angle)*.45;
 }
 for(let row=0,k=0;row<6;row++)for(let j=0;j<48;j++){
  const a=row*49+j,b=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=b;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=b;skirtIndices[k++]=b+1;
 }
 const bones=Array.from({length:163},(_,i)=>
  i===0?'spine04':i===1?'spine05':
  i===2?'pelvisL':i===3?'hand01L':
  i===4?'UnclassifiedRealSourceJoint':'OriginalBone'+i);
 return {bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask:new Uint8Array(bodyIndices.length/3).fill(masked?1:0),
  skinIndices:new Uint16Array(32),
  skinWeights:Float32Array.from({length:32},(_,i)=>i%4===0?1:0),
  sourceMeshIds:new Uint16Array(8),sourceMeshNames:['OriginalPublicModelMesh'],
  sourceBoneNamesByMesh:[bones]};
}
function setWeights(x,idx,weights){
 for(let v=0;v<8;v++){
  x.skinIndices.set(idx,4*v);
  x.skinWeights.set(weights,4*v);
 }
 return x;
}
function compare(x){
 const a=measure(x),b=prior(x);
 assert.equal(a.sourceSkirtSpokeCount,336);
 assert.equal(a.sourceIndexedBodyTriangles,b.sourceIndexedOriginalBodyTriangleCount);
 assert.equal(a.baselineStrictCoreInward,b.originalCoreInward);
 assert.equal(a.baselineStrictCoreOutward,b.originalCoreOutward);
 assert.equal(a.baselineStrictCoreNear,b.originalCoreNear);
 assert.equal(a.baselineStrictCoreUnknown,b.originalCoreUnknown);
 assert.equal(a.baselineUnknownExcludedOriginalFaceRayHits,
  b.unknownSpokesWithAnyExcludedSourceFaceHit);
 assert.equal(a.baselineUnknownNoOriginalFaceRayHits,
  b.unknownSpokesWithNoActualSourceFaceRayHit);
 for(let i=0;i<7;i++){
  assert.equal(a.originalStrictCoreSourceBandReceipts[i].strictCoreUnknown,
   b.originalSourceSevenBandProvenanceReceipts[i].unknown);
  assert.equal(a.originalStrictCoreSourceBandReceipts[i].originalExcludedFaceIntersection,
   b.originalSourceSevenBandProvenanceReceipts[i].excludedSourceHit);
 }
 assert.deepEqual(a.hypotheticalSourceNamedCoreWeightSensitivity.map(x=>
  x.namedCoreWeightThreshold),[.5,.65,.8,.9,.95]);
 assert.ok(a.hypotheticalSourceNamedCoreWeightSensitivity.every((v,i,all)=>
  i===0||v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection<=
   all[i-1].originalCoreUnknownRaysWithHypotheticalCandidateIntersection));
 assert.ok(a.hypotheticalSourceNamedCoreWeightSensitivity.every(v=>
  v.sourceNoFaceRayHitDirectionsRemainingUnknown===
  a.baselineUnknownNoOriginalFaceRayHits));
 assert.equal(a.counterfactualsMayNotChangeOriginalStrictCoreMask,true);
 assert.equal(a.allCandidateFacesAreOriginalIndexedNotCreatedGeometry,true);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.releaseAuthorized,false);
 return a;
}
test('untouched original cube strict 336 spokes: no reinterpretation of verified core faces',()=>{
 const f=fixture(),bytes=Object.fromEntries(Object.entries(f).filter(([,v])=>
  ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const r=compare(f);
 assert.equal(r.baselineStrictCoreUnknown,0);
 assert.ok(r.baselineStrictCoreOutward>0);
 assert.ok(r.hypotheticalSourceNamedCoreWeightSensitivity.every(v=>
  v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection===0));
 for(const [key,value] of Object.entries(bytes))assert.deepEqual(f[key],value);
});
test('all original low-dominance blended torso/pelvis bones are threshold hypotheses, never approved core',()=>{
 const f=setWeights(fixture(),[0,1,2,0],[.4,.35,.25,0]),r=compare(f);
 assert.equal(r.baselineStrictCoreUnknown,336);
 assert.equal(r.baselineUnknownExcludedOriginalFaceRayHits,336);
 assert.equal(r.baselineUnknownNoOriginalFaceRayHits,0);
 assert.ok(r.hypotheticalSourceNamedCoreWeightSensitivity.every(v=>
  v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection===336&&
  v.candidateFacesWithNoncoreWeightOverFivePercent===0));
 assert.equal(r.corePartMembershipFromOriginalBoneNameHeuristicOnly,true);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
});
test('mixed original head skin influence stays a contaminated hypothetical and drops at higher thresholds',()=>{
 const f=setWeights(fixture(),[0,1,3,0],[.4,.25,.35,0]),r=compare(f);
 assert.equal(r.baselineStrictCoreUnknown,336);
 assert.equal(r.baselineUnknownExcludedOriginalFaceRayHits,336);
 assert.deepEqual(r.hypotheticalSourceNamedCoreWeightSensitivity.map(v=>
  v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection),
  [336,336,0,0,0]);
 assert.ok(r.hypotheticalSourceNamedCoreWeightSensitivity.slice(0,2).every(v=>
  v.candidateFacesWithNoncoreWeightOverFivePercent>0&&
  v.contaminatedHypotheticalCandidateHitDirections===336));
 assert.equal(r.closedSignedBodyVolumeVerified,false);
});
test('unknown actual source joint weight is not guessed to be core even with visible spine name',()=>{
 const f=setWeights(fixture(),[0,4,3,0],[.4,.35,.25,0]),r=compare(f);
 assert.equal(r.baselineStrictCoreUnknown,336);
 assert.ok(r.hypotheticalSourceNamedCoreWeightSensitivity.every(v=>
  v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection===0));
 assert.equal(r.fullBodyOrClothCollisionCleared,false);
});
test('original mask exclusion is evaluated only as an explicit hypothetical, never silently overridden',()=>{
 const f=fixture({masked:false}),r=compare(f);
 assert.equal(r.baselineStrictCoreUnknown,336);
 assert.equal(r.baselineUnknownExcludedOriginalFaceRayHits,336);
 assert.ok(r.hypotheticalSourceNamedCoreWeightSensitivity.every(v=>
  v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection===336));
 assert.equal(r.counterfactualsMayNotChangeOriginalStrictCoreMask,true);
 assert.equal(f.coreBodyFaceMask.every(v=>v===0),true);
});
test('true source no-hit rays remain UNKNOWN at every threshold even when bone names are anatomical',()=>{
 const r=compare(fixture({partial:true}));
 assert.ok(r.baselineUnknownNoOriginalFaceRayHits>0);
 assert.ok(r.hypotheticalSourceNamedCoreWeightSensitivity.every(v=>
  v.sourceNoFaceRayHitDirectionsRemainingUnknown===
  r.baselineUnknownNoOriginalFaceRayHits));
});
test('displaced original body source still cannot fabricate any contour hit or garment clearance',()=>{
 const r=compare(fixture({offset:8}));
 assert.equal(r.baselineStrictCoreUnknown,336);
 assert.equal(r.baselineUnknownNoOriginalFaceRayHits,336);
 assert.ok(r.hypotheticalSourceNamedCoreWeightSensitivity.every(v=>
  v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection===0));
 assert.equal(r.garmentPhysicalSizeMeasured,false);
});
test('exact original public photo and 163-bone rig receipts required; unsupported owner approval fails closed',()=>{
 const f=fixture(),evidence=prior(f),proof={...f,avatar:'female',pose:'source',
  sourcePhotoSHA256:PHOTO,sourceAnatomyGLBSHA256:RIG,
  originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
  selectedActualWebGLPreview:true,independentlyVerifiedBoneNoHitReceipt:evidence};
 const result=audit(proof);
 assert.equal(result.status,'ORIGINAL_SKIN_CORE_THRESHOLD_HYPOTHESES_MEASURED_NO_WEARABLE_FIT');
 assert.equal(result.independentlyReconciledAll336OriginalPhotoSpokes,true);
 assert.equal(result.releaseAuthorized,false);
 for(const modified of [
  {avatar:'owner'},{pose:'fake'},{sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'f'.repeat(64)},{originalRig163Bones:false},
  {selectedMeasuredFivePoseBvh:false},{selectedActualWebGLPreview:false},
  {independentlyVerifiedBoneNoHitReceipt:{...evidence,originalCoreUnknown:8}},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?.3:v)}
 ]){
  const rejected=audit({...proof,...modified});
  assert.equal(rejected.status,'ORIGINAL_SKIN_THRESHOLD_OR_SOURCE_PROVENANCE_UNVERIFIABLE');
  assert.equal(rejected.originalPhoto2DFallbackRequired,true);
  assert.equal(rejected.consumer3DAdmitted,false);
 }
});
test('broken source model coordinates, face arrays, skin weights and mesh provenance fail closed',()=>{
 const f=fixture();
 for(const changed of [
  {bodyPositions:Float32Array.from(f.bodyPositions,(v,i)=>i===0?NaN:v)},
  {skirtPositions:Float32Array.from(f.skirtPositions,(v,i)=>i===1?NaN:v)},
  {bodyIndices:Uint16Array.from(f.bodyIndices,(v,i)=>i===0?999:v)},
  {skirtIndices:Uint16Array.from(f.skirtIndices,(v,i)=>i===0?999:v)},
  {coreBodyFaceMask:new Uint8Array(1)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?163:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?.4:v)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?99:v)},
  {sourceBoneNamesByMesh:[['not-163bone']]},{sourceMeshNames:['']}
 ])assert.throws(()=>measure({...f,...changed}));
});
