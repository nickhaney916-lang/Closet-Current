/** Synthetic adversarial fixture tests ONLY: real 163-bone source
 * proof is exclusive to native Chromium and WebKit source-locked CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalMissingRayBoneNames89 as summarize,
 auditOriginalSkirtCoreBoneNamesAndNoHits89 as audit} from
 '../research/parallel89/skirt-original-core-nohit-source-bones89.mjs';
import {summarizeOriginalSkirtCoreUnknownCauses89 as prior} from
 '../research/parallel89/skirt-original-core-unknown-causes89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const FEMALE='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({bone='spine',radius=.45,masked=true,partial=false}={}){
 const bodyPositions=Float32Array.from([
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2, .2,.2,.2, .2,1.8,.2, -.2,1.8,.2
 ]);
 const i=Uint16Array.from([
  0,2,1,0,3,2,4,5,6,4,6,7,
  0,1,5,0,5,4,3,7,6,3,6,2,
  0,4,7,0,7,3,1,2,6,1,6,5
 ]);
 const bodyIndices=partial?i.slice(0,18):i;
 const skirtPositions=new Float32Array(343*3),skirtIndices=new Uint16Array(576*3);
 for(let row=0;row<7;row++)for(let j=0;j<49;j++){
  const p=(row*49+j)*3,a=2*Math.PI*j/48;
  skirtPositions[p]=radius*Math.cos(a);
  skirtPositions[p+1]=.6+.12*row;
  skirtPositions[p+2]=radius*Math.sin(a);
 }
 for(let row=0,k=0;row<6;row++)for(let j=0;j<48;j++){
  const a=row*49+j,b=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=b;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=b;skirtIndices[k++]=b+1;
 }
 const names=Array.from({length:163},(_,i)=>i===0?bone:'OriginalSourceBone'+i);
 return {bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask:new Uint8Array(bodyIndices.length/3).fill(masked?1:0),
  skinIndices:new Uint16Array(8*4),
  skinWeights:Float32Array.from({length:32},(_,i)=>i%4===0?1:0),
  sourceMeshIds:new Uint16Array(8),
  sourceMeshNames:['OriginalPublicModelMesh'],
  sourceBoneNamesByMesh:[names]};
}
function reconcile(input){
 const x=summarize(input),y=prior(input);
 assert.equal(x.originalCoreInward,y.strictCoreInwardRays);
 assert.equal(x.originalCoreOutward,y.strictCoreOutwardRays);
 assert.equal(x.originalCoreNear,y.strictCoreNearRays);
 assert.equal(x.originalCoreUnknown,y.strictCoreUnknownRays);
 assert.equal(x.unknownSpokesWithAnyExcludedSourceFaceHit,
  y.unknownRaysWithExcludedSourceFaceWitness);
 assert.equal(x.unknownSpokesWithNoActualSourceFaceRayHit,
  y.unknownRaysWithNoObservedOriginalBodyFaceWitness);
 assert.equal(x.originalUnknownCoreExcludedUnclassifiedBoneHitSpokes,
  y.strictCoreUnknownExcludedSourceFaceHitCounts.UNKNOWN_ORIGINAL_DOMINANT_BONE);
 assert.equal(x.originalUnknownCoreExcludedHeadArmHitSpokes,
  y.strictCoreUnknownExcludedSourceFaceHitCounts.EXCLUDED_HEAD_ARMS);
 assert.equal(x.originalCoreInward+x.originalCoreOutward+
  x.originalCoreNear+x.originalCoreUnknown,336);
 assert.equal(x.unknownSpokesWithAnyExcludedSourceFaceHit+
  x.unknownSpokesWithNoActualSourceFaceRayHit,x.originalCoreUnknown);
 assert.equal(x.originalSourceSevenBandProvenanceReceipts.length,7);
 assert.equal(x.sourceOriginalPhotoAndGLBBuffersReadOnly,true);
 assert.equal(x.angleToOriginalPlaneCutEndpointIsOnlyAProxyNotGapOrClearance,true);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.releaseAuthorized,false);
 return x;
}
test('no unknowns in fully observed valid original synthetic core and source model immutable',()=>{
 const a=fixture(),bytes=Object.fromEntries(Object.entries(a).filter(([,v])=>
  ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const r=reconcile(a);
 assert.equal(r.originalCoreUnknown,0);
 assert.equal(r.unknownSpokesWithAnyExcludedSourceFaceHit,0);
 assert.equal(r.unknownSpokesWithNoActualSourceFaceRayHit,0);
 assert.deepEqual(r.originalUnknownCoreRaySourcePrimaryBoneNames,[]);
 for(const [k,v] of Object.entries(bytes))assert.deepEqual(a[k],v);
});
test('unknown original source bone NAME comes directly from source skeleton, never promoted to trusted hips',()=>{
 const a=fixture({bone:'unclassifiedSourceBoneABC'}),r=reconcile(a);
 assert.equal(r.originalCoreUnknown,336);
 assert.ok(r.unknownSpokesWithAnyExcludedSourceFaceHit>0);
 assert.ok(r.originalUnknownCoreExcludedUnclassifiedBoneHitSpokes>0);
 assert.equal(r.originalUnknownCoreRaySourcePrimaryBoneNames[0].label,
  'unclassifiedSourceBoneABC');
 assert.equal(r.originalUnknownCoreRaySourcePrimaryMeshNames[0].label,
  '0:OriginalPublicModelMesh');
 assert.equal(r.originalSourceBoneLabelsNeverAutomaticallyReclassified,true);
});
test('excluded original HEAD eye bone stays visibly attributed to SOURCE name rather than counted as core',()=>{
 const r=reconcile(fixture({bone:'eyeL'}));
 assert.equal(r.originalCoreUnknown,336);
 assert.ok(r.originalUnknownCoreExcludedHeadArmHitSpokes>0);
 assert.equal(r.originalUnknownCoreRaySourcePrimaryBoneNames[0].label,'eyeL');
 assert.equal(r.signedExteriorContainmentCertified,undefined);
});
test('original eligibility mask excluded source hips are never silently counted as core',()=>{
 const r=reconcile(fixture({masked:false}));
 assert.equal(r.originalCoreUnknown,336);
 assert.ok(r.unknownSpokesWithAnyExcludedSourceFaceHit>0);
 assert.equal(r.originalUnknownCoreExcludedOriginalMaskHitSpokes,
  r.unknownSpokesWithAnyExcludedSourceFaceHit);
 assert.equal(r.consumer3DAdmitted,false);
});
test('genuine no-ray directional miss in partial source mesh stays UNKNOWN with angular ENDPOINT proxy not fabricated clearance',()=>{
 const r=reconcile(fixture({partial:true}));
 assert.ok(r.unknownSpokesWithNoActualSourceFaceRayHit>0);
 assert.equal(r.noOriginalBodyFaceHitByOriginalSkirtBand.reduce((a,b)=>a+b,0),
  r.unknownSpokesWithNoActualSourceFaceRayHit);
 assert.equal(Object.values(r.noBodyRayHitNearestSegmentEndpointAngularProxyBins)
  .reduce((a,b)=>a+b,0),r.unknownSpokesWithNoActualSourceFaceRayHit);
 assert.equal(Object.values(r.noOriginalBodyFaceHitAxisGroups)
  .reduce((a,b)=>a+b,0),r.unknownSpokesWithNoActualSourceFaceRayHit);
 assert.equal(r.originalBodyCannotCertifyClosedSignedVolume,true);
});
test('full source proof still refuses physical size, signed volume or consumer original 3D even on synthetic zero-unknown input',()=>{
 const a=fixture(),cause=prior(a),shared={
  ...a,avatar:'female',pose:'source',
  sourcePhotoSHA256:PHOTO,sourceAnatomyGLBSHA256:FEMALE,
  originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
  selectedActualWebGLPreview:true,
  independentlyVerifiedMissingCoreCauseReport:cause
 };
 const ok=audit(shared);
 assert.equal(ok.schema,'P89-source-locked-original-core-nohit-bone-provenance/v1');
 assert.equal(ok.original336SourceSpokesIndependentlyVerified,true);
 assert.equal(ok.closedBodyVolumeCertified,false);
 assert.equal(ok.signedExteriorContainmentCertified,false);
 assert.equal(ok.originalPhoto2DFallbackRequired,true);
 assert.equal(ok.consumer3DAdmitted,false);
 assert.equal(ok.releaseAuthorized,false);
 for(const changed of [
  {avatar:'owner'}, {pose:'anim'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'f'.repeat(64)},
  {originalRig163Bones:false},
  {selectedMeasuredFivePoseBvh:false},
  {selectedActualWebGLPreview:false},
  {independentlyVerifiedMissingCoreCauseReport:{
   ...cause,strictCoreUnknownRays:199}},
  {independentlyVerifiedMissingCoreCauseReport:{
   ...cause,sourceSevenSkirtBandCauseBreakdown:[]}},
  {skinWeights:Float32Array.from(a.skinWeights,(x,i)=>i===0?.2:x)}
 ]){
  const invalid=audit({...shared,...changed});
  assert.equal(invalid.status,'SOURCE_BONE_OR_RAY_PROVENANCE_UNVERIFIABLE');
  assert.equal(invalid.originalPhoto2DFallbackRequired,true);
  assert.equal(invalid.consumer3DAdmitted,false);
  assert.equal(invalid.releaseAuthorized,false);
 }
});
test('malformed original GLB source buffers, indices, 163-bone skin weights, source photo radius fail closed',()=>{
 const a=fixture();
 for(const changed of [
  {bodyPositions:Float32Array.from(a.bodyPositions,(x,i)=>i===0?NaN:x)},
  {skirtPositions:Float32Array.from(a.skirtPositions,(x,i)=>i===1?NaN:x)},
  {bodyIndices:Uint16Array.from(a.bodyIndices,(x,i)=>i===0?999:x)},
  {skirtIndices:Uint16Array.from(a.skirtIndices,(x,i)=>i===0?999:x)},
  {coreBodyFaceMask:new Uint8Array(1)},
  {skinIndices:Uint16Array.from(a.skinIndices,(x,i)=>i===0?163:x)},
  {skinWeights:Float32Array.from(a.skinWeights,(x,i)=>i===0?.5:x)},
  {sourceMeshIds:Uint16Array.from(a.sourceMeshIds,(x,i)=>i===0?99:x)},
  {sourceBoneNamesByMesh:[['not-full-original-163bone-labels']]},
  {sourceMeshNames:['']}
 ])assert.throws(()=>summarize({...a,...changed}));
});
