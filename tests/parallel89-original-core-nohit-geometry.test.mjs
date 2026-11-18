/** P89 synthetic adversarial no-hit geometry. ONLY genuine native
 * Chromium/WebKit source-locked original P541/P84 validates real model.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalCoreNoHitGeometry89 as measure,
 auditActualOriginalCoreNoHitGeometry89 as audit}
 from '../research/parallel89/skirt-original-core-nohit-geometry89.mjs';
import {summarizeOriginalCoreSkinWeightSensitivity89 as prior}
 from '../research/parallel89/skirt-original-core-skin-weight-sensitivity89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const FEMALE='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({blend=false,mask=1,radius=.45,bodyRadius=.2,
 faces='closed',shiftX=0}={}){
 const bodyPositions=Float32Array.from([
  -bodyRadius+shiftX,.2,-bodyRadius,bodyRadius+shiftX,.2,-bodyRadius,
  bodyRadius+shiftX,1.8,-bodyRadius,-bodyRadius+shiftX,1.8,-bodyRadius,
  -bodyRadius+shiftX,.2,bodyRadius,bodyRadius+shiftX,.2,bodyRadius,
  bodyRadius+shiftX,1.8,bodyRadius,-bodyRadius+shiftX,1.8,bodyRadius
 ]);
 const whole=Uint16Array.from([
  0,2,1,0,3,2,4,5,6,4,6,7,
  0,1,5,0,5,4,3,7,6,3,6,2,
  0,4,7,0,7,3,1,2,6,1,6,5
 ]);
 const bodyIndices=faces==='single'?whole.slice(0,6):
  faces==='twoWalls'?whole.slice(0,12):whole;
 const skirtPositions=new Float32Array(343*3),
  skirtIndices=new Uint16Array(576*3);
 for(let row=0;row<7;row++)for(let j=0;j<49;j++){
  const k=3*(row*49+j),rad=j*Math.PI/24;
  skirtPositions[k]=radius*Math.cos(rad);
  skirtPositions[k+1]=.6+row*.12;
  skirtPositions[k+2]=radius*Math.sin(rad);
 }
 for(let row=0,k=0;row<6;row++)for(let j=0;j<48;j++){
  const a=row*49+j,c=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=c;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=c;skirtIndices[k++]=c+1;
 }
 const skinIndices=new Uint16Array(32),skinWeights=new Float32Array(32);
 for(let v=0;v<8;v++){
  skinIndices.set(blend?[0,1,2,0]:[0,0,0,0],v*4);
  skinWeights.set(blend?[.4,.35,.25,0]:[1,0,0,0],v*4);
 }
 return {
  bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask:new Uint8Array(bodyIndices.length/3).fill(mask),
  skinIndices,skinWeights,sourceMeshIds:new Uint16Array(8),
  sourceMeshNames:['OriginalBodyMesh'],
  sourceBoneNamesByMesh:[Array.from({length:163},(_,i)=>
   ({0:'spine04',1:'pelvisL',2:'upperleg01L'}[i]||'sourceBone'+i))]
 };
}
function check(f){
 const before=Object.fromEntries(Object.entries(f).filter(([,v])=>
  ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const a=measure(f),b=prior(f);
 assert.equal(a.originalSkirtSampledRays,336);
 assert.equal(a.original95PercentHypotheticalAddedFaces,
  b.hypothetical95SourceBoneCoreWeightFaces);
 assert.equal(a.originalStrictCoreFaceCount,b.actualStrictSourceEligibleCoreFaces);
 assert.deepEqual(a.original95PercentHypotheticalObservedRays,b.hypothetical95SourceRays);
 for(let j=0;j<7;j++){
  const c=a.originalSourceSevenSkirtRingNoHitGeometry[j];
  assert.equal(c.noHitRays,
   b.originalSkirtBandSourceCounterfactuals[j].hypothetical95.unknown);
  assert.equal(c.originalSource95CorePlaneCutSegments,
   b.originalSkirtBandSourceCounterfactuals[j].genuineStrictBodyFacePlaneCuts+
   b.originalSkirtBandSourceCounterfactuals[j].additional95BoneAttestedFacePlaneCuts);
  assert.equal(Object.values(c.primarySourceNoHitCauses).reduce((x,v)=>x+v,0),c.noHitRays);
 }
 assert.equal(a.original95PercentHypotheticalUnknownRays,
  a.original95PercentHypotheticalObservedRays.unknown);
 assert.equal(Object.values(a.causePriorityDisjointOriginalBodyRayOutcomes)
  .reduce((n,v)=>n+v,0),a.original95PercentHypotheticalUnknownRays);
 assert.equal(Object.values(a.sourceUnknownRayDirectionsBySourceAxes)
  .reduce((n,v)=>n+v,0),a.original95PercentHypotheticalUnknownRays);
 assert.equal(a.sourceNoHitRaysWhoseOriginInsideCoreConvexEnvelope+
  a.sourceNoHitRaysWhoseOriginOutsideCoreConvexEnvelope,
  a.original95PercentHypotheticalUnknownRays);
 assert.equal(a.original95PercentSkinnedCoreFaceSetResearchOnly,true);
 assert.equal(a.noOriginalSourceGeometryOrSkinWeightsMutated,true);
 assert.equal(a.convex2DEnvelopeIsNotAClosedBodySignedVolume,true);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.releaseAuthorized,false);
 for(const [k,v] of Object.entries(before))assert.deepEqual(f[k],v);
 return a;
}
test('original CLOSED indexed synthetic torso: all radial rays observed; no artificial unknown/hull errors',()=>{
 const v=check(fixture());
 assert.deepEqual(v.original95PercentHypotheticalObservedRays,{
  inward:0,near:0,outward:336,unknown:0});
 assert.equal(v.sourceNoHitRaysWithExcludedOriginalBodyForwardWitness,0);
});
test('mixed original 0.4/0.35/0.25 core skin joints eligible ONLY hypothetical, not real source release',()=>{
 const v=check(fixture({blend:true}));
 assert.equal(v.originalStrictCoreFaceCount,0);
 assert.equal(v.original95PercentHypotheticalAddedFaces,12);
 assert.equal(v.original95PercentHypotheticalObservedRays.unknown,0);
});
test('source ORIGINAL mask excludes body but full indexed original body cuts still show forward excluded-source rays',()=>{
 const x=check(fixture({mask:0}));
 assert.equal(x.original95PercentHypotheticalObservedRays.unknown,336);
 assert.equal(x.sourceNoHitRaysWithExcludedOriginalBodyForwardWitness,336);
 assert.equal(x.causePriorityDisjointOriginalBodyRayOutcomes.ORIGINAL_EXCLUDED_SOURCE_BODY_FORWARD_INTERSECTION,336);
 assert.equal(x.originalPhoto2DFallbackRequired,true);
});
test('source body intersections beyond original t<=3 research ray cap stay UNKNOWN, never false clearance',()=>{
 const x=check(fixture({bodyRadius:4}));
 assert.equal(x.original95PercentHypotheticalObservedRays.unknown,336);
 assert.ok(x.sourceNoHitRaysBeyond3OriginalModelUnitRadialLimit>0);
 assert.equal(x.causePriorityDisjointOriginalBodyRayOutcomes.ORIGINAL_CORE_FARTHER_THAN_FINITE_RAY_3_UNIT_CAP,336);
});
test('original indexed single wall leaves missing forward source body angular spokes',()=>{
 const x=check(fixture({faces:'single'}));
 assert.ok(x.original95PercentHypotheticalObservedRays.unknown>0);
 assert.ok(x.sourceNoHitRaysWhoseOriginOutsideCoreConvexEnvelope>0);
 assert.ok(x.originalSourceSevenSkirtRingNoHitGeometry.every(r=>
  r.originalSource95CorePlaneCutSegments>0));
});
test('two original indexed separated wall cuts may surround origin in convex envelope but leave angular rays missing',()=>{
 const x=check(fixture({faces:'twoWalls'}));
 assert.ok(x.original95PercentHypotheticalObservedRays.unknown>0);
 assert.ok(x.sourceNoHitRaysWhoseOriginInsideCoreConvexEnvelope>0);
 assert.equal(x.convex2DEnvelopeIsNotAClosedBodySignedVolume,true);
});
test('shifted original anatomical world body changes center/hull without inventing a source garment re-registration',()=>{
 const x=check(fixture({shiftX:2}));
 assert.ok(x.original95PercentHypotheticalObservedRays.unknown>0);
 assert.ok(x.sourceNoHitRaysWhoseOriginOutsideCoreConvexEnvelope>0);
 assert.equal(x.originalSourceSkirtRearUnobserved,true);
});
test('attested original source photo + independently verified original 95% scenario is required; even complete rays do NOT admit wearable',()=>{
 const f=fixture(),prev=prior(f);
 const args={...f,avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:FEMALE,originalRig163Bones:true,
  selectedMeasuredFivePoseBvh:true,selectedActualWebGLPreview:true,
  independentOriginalSkinWeightSensitivityReceipt:prev};
 const ok=audit(args);
 assert.equal(ok.status,'ORIGINAL_SOURCE_95_CORE_NOHIT_CAUSES_LOCALIZED_NOT_FIT');
 assert.equal(ok.independentlySourceLockedOriginalRays336,true);
 assert.equal(ok.originalPhoto2DFallbackRequired,true);
 assert.equal(ok.originalSignedBodyVolumeCertified,false);
 assert.equal(ok.consumer3DAdmitted,false);
 assert.equal(ok.releaseAuthorized,false);
 for(const bad of [
  {avatar:'owner'}, {pose:'moving'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'f'.repeat(64)},
  {originalRig163Bones:false},{selectedActualWebGLPreview:false},
  {selectedMeasuredFivePoseBvh:false},
  {independentOriginalSkinWeightSensitivityReceipt:{...prev,
   originalPhotoSkirtSourceRays:335}},
  {independentOriginalSkinWeightSensitivityReceipt:{...prev,
   hypothetical95SourceRays:{...prev.hypothetical95SourceRays,unknown:22}}},
  {independentOriginalSkinWeightSensitivityReceipt:{...prev,
   originalSkirtBandSourceCounterfactuals:[]}},
  {coreBodyFaceMask:new Uint8Array(1)}
 ]){
  const z=audit({...args,...bad});
  assert.equal(z.status,'ORIGINAL_BODY_NOHIT_SOURCE_GEOMETRY_NOT_VERIFIED');
  assert.equal(z.consumer3DAdmitted,false);
  assert.equal(z.originalPhoto2DFallbackRequired,true);
 }
});
test('original source skinned GLB anatomy, index, public photo and source-bone name corruption fails closed',()=>{
 const f=fixture();
 for(const bad of [
  {bodyPositions:Float32Array.from(f.bodyPositions,(v,i)=>i===0?NaN:v)},
  {skirtPositions:Float32Array.from(f.skirtPositions,(v,i)=>i===0?NaN:v)},
  {bodyIndices:Uint16Array.from(f.bodyIndices,(v,i)=>i===0?9999:v)},
  {skirtIndices:Uint16Array.from(f.skirtIndices,(v,i)=>i===0?9999:v)},
  {coreBodyFaceMask:Uint8Array.from(f.coreBodyFaceMask,(v,i)=>i===0?2:v)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?163:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?.7:v)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?100:v)},
  {sourceBoneNamesByMesh:[['wrong']]},
  {sourceMeshNames:['']}
 ])assert.throws(()=>measure({...f,...bad}));
});
