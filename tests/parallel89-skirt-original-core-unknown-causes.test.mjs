/** M2 P89 adversarial fixtures; TRUE CC0 163-bone model acceptance is
 * only via genuine native original-source browser matrix, never mock GLBs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalSkirtCoreUnknownCauses89 as measure,
 auditOriginalSkirtCoreRayUnknownCauses89 as audit} from
 '../research/parallel89/skirt-original-core-unknown-causes89.mjs';
import {summarizeActualOriginalSkirtCoreSpan89 as previous} from
 '../research/parallel89/skirt-original-core-span89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const FEMALE='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
const boneNames=s=>Array.from({length:163},(_,i)=>i===0?s:'OriginalSourceBone'+i);
function fixture({radius=.45,bone='spine',faceMask=true,partial=false,empty=false,invalid=false}={}){
 const bodyPositions=Float32Array.from([
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2, .2,.2,.2, .2,1.8,.2, -.2,1.8,.2
 ]);
 const original=Uint16Array.from([
  0,2,1,0,3,2,4,5,6,4,6,7,
  0,1,5,0,5,4,3,7,6,3,6,2,
  0,4,7,0,7,3,1,2,6,1,6,5
 ]);
 const bodyIndices=partial?original.slice(0,18):original;
 const skirtPositions=new Float32Array(343*3),skirtIndices=new Uint16Array(576*3);
 for(let band=0;band<7;band++)for(let i=0;i<49;i++){
  const at=3*(band*49+i),theta=2*Math.PI*i/48;
  skirtPositions[at]=Math.cos(theta)*radius;
  skirtPositions[at+1]=.6+band*.12;
  skirtPositions[at+2]=Math.sin(theta)*radius;
 }
 if(invalid)skirtPositions[0]=NaN;
 for(let band=0,k=0;band<6;band++)for(let i=0;i<48;i++){
  const a=band*49+i,b=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=b;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=b;skirtIndices[k++]=b+1;
 }
 const coreBodyFaceMask=new Uint8Array(bodyIndices.length/3).fill(faceMask?1:0);
 if(empty)coreBodyFaceMask.fill(0);
 return {bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask,skinIndices:new Uint16Array(8*4),
  skinWeights:Float32Array.from({length:8*4},(_,i)=>i%4===0?1:0),
  sourceMeshIds:new Uint16Array(8),sourceMeshNames:['OriginalSourceBody'],
  sourceBoneNamesByMesh:[boneNames(bone)]};
}
function compare(x){
 const a=measure(x),b=previous(x);
 assert.equal(a.strictCoreUnknownRays,b.originalSourceSkirtCoreUnobservedRays);
 assert.equal(a.strictCoreInwardRays,b.originalSourceSkirtCoreInwardRays);
 assert.equal(a.strictCoreOutwardRays,b.originalSourceSkirtCoreOutwardRays);
 assert.equal(a.strictCoreNearRays,b.originalSourceSkirtCoreNearZeroRays);
 assert.equal(a.sourceSevenSkirtBandCauseBreakdown.length,7);
 assert.equal(a.independentRayCauseCountsReconcile,true);
 assert.equal(Object.values(a.strictCoreUnknownCauseTotals).reduce((n,v)=>n+v,0),
  a.strictCoreUnknownRays);
 assert.equal(Object.values(a.strictCoreUnknownBySourceAxes).reduce((n,v)=>n+v,0),
  a.strictCoreUnknownRays);
 assert.equal(a.unknownRaysWithExcludedSourceFaceWitness+
  a.unknownRaysWithNoObservedOriginalBodyFaceWitness,a.strictCoreUnknownRays);
 assert.equal(a.sourceBodyAllIndexedFacesNeverModified,true);
 assert.equal(Object.values(a.unknownWithNoOriginalIndexedFaceByModelAxes).reduce((n,v)=>n+v,0),
  a.unknownRaysWithNoObservedOriginalBodyFaceWitness);
 assert.equal(a.unknownWithNoOriginalIndexedFaceCircularRunsByBand.length,7);
 assert.equal(a.unknownWithNoOriginalIndexedFaceCircularRunsByBand.reduce(
  (n,v)=>n+v.noOriginalIndexedBodyFaceHitRays,0),
  a.unknownRaysWithNoObservedOriginalBodyFaceWitness);
 assert.equal(a.originalExcludedSourceMeshRayNames.every(x=>
  x.unknownRayDirections<=a.unknownRaysWithExcludedSourceFaceWitness),true);
 assert.equal(a.originalExcludedSourceBoneRayNames.every(x=>
  x.unknownRayDirections<=a.unknownRaysWithExcludedSourceFaceWitness),true);
 assert.equal(a.sourceDominantBoneNamesAreHeuristicNotVerifiedAnatomicalRegions,true);
 assert.equal(a.sourceBodyNotProvenClosedSignedVolume,true);
 assert.equal(a.originalPhoto2DFallbackRequired,true);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.releaseAuthorized,false);
 return a;
}
test('original indexed synthetic core cube has independent same 336 original skirt ray classifications and unmodified source bytes',()=>{
 const f=fixture(),before=Object.fromEntries(Object.entries(f).filter(([,v])=>ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const r=compare(f);
 assert.equal(r.trueOriginalSourceRingRayCount,336);
 assert.equal(r.strictCoreInwardRays,0);
 assert.ok(r.strictCoreOutwardRays>0);
 assert.equal(r.strictCoreUnknownRays,0);
 for(const [k,v] of Object.entries(before))assert.deepEqual(f[k],v);
});
test('original synthetic garment INSIDE body core marks inward, never becomes approved exterior',()=>{
 const r=compare(fixture({radius:.1}));
 assert.ok(r.strictCoreInwardRays>0);
 assert.equal(r.originalAnatomyExclusionIsNotAValidCoreFitRepair,true);
});
test('head/arm original bone source removed from strict torso-core yields UNKNOWN but records excluded anatomy intersections',()=>{
 const r=compare(fixture({bone:'hand01L'}));
 assert.equal(r.strictCoreUnknownRays,336);
 assert.equal(r.strictCoreUnknownCauseTotals.NO_VERIFIED_CORE_SEGMENT_AT_SKIRT_BAND,336);
 assert.ok(r.unknownRaysWithExcludedSourceFaceWitness>0);
 assert.ok(r.strictCoreUnknownExcludedSourceFaceHitCounts.EXCLUDED_HEAD_ARMS>0);
 assert.equal(r.strictCoreInwardRays,0);
});
test('mask excluded valid original torso triangles create unknowns with independently identified excluded source contour',()=>{
 const r=compare(fixture({faceMask:false}));
 assert.equal(r.strictCoreUnknownRays,336);
 assert.equal(r.strictCoreUnknownCauseTotals.NO_VERIFIED_CORE_SEGMENT_AT_SKIRT_BAND,336);
 assert.ok(r.strictCoreUnknownExcludedSourceFaceHitCounts.EXCLUDED_ORIGINAL_CORE_FACE_MASK>0);
 assert.equal(r.sourceBodyNotProvenClosedSignedVolume,true);
});
test('unrecognized source dominant bones remain unknown; they are not silently treated as hips or legs',()=>{
 const r=compare(fixture({bone:'CautionUnmappedSourceBone'}));
 assert.equal(r.strictCoreUnknownRays,336);
 assert.ok(r.strictCoreUnknownExcludedSourceFaceHitCounts.UNKNOWN_ORIGINAL_DOMINANT_BONE>0);
 assert.equal(r.consumer3DAdmitted,false);
});
test('original source partial mesh and non-intersecting core ray correctly distinguish missing-plane vs missing-ray',()=>{
 const r=compare(fixture({partial:true}));
 assert.ok(r.strictCoreUnknownRays>=0);
 assert.equal(r.strictCoreUnknownRays+r.strictCoreInwardRays+
  r.strictCoreNearRays+r.strictCoreOutwardRays,336);
 const z=compare(fixture({empty:true}));
 assert.equal(z.strictCoreUnknownRays,336);
 assert.equal(z.strictCoreUnknownCauseTotals.NO_VERIFIED_CORE_SEGMENT_AT_SKIRT_BAND,336);
});
test('authentic photo+rig gate binds to independent previous ORIGINAL 336-ray receipts and rejects forged claims',()=>{
 const f=fixture(),prev=previous(f),base={
  ...f,avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:FEMALE,originalRig163Bones:true,
  selectedMeasuredFivePoseBvh:true,selectedActualWebGLPreview:true,
  independentlyVerifiedCoreSpanReport:prev
 };
 const good=audit(base);
 assert.equal(good.schema,'P89-source-locked-skirt-core-unknown-ray-cause/v1');
 assert.equal(good.originalSkirtCoreUnknownCauseEvidence.strictCoreUnknownRays,
  prev.originalSourceSkirtCoreUnobservedRays);
 assert.equal(good.independentlyCrossCheckedEachOf336SourceRays,true);
 assert.equal(good.originalPhoto2DFallbackRequired,true);
 assert.equal(good.releaseAuthorized,false);
 for(const x of [
  {avatar:'real-owner'}, {pose:'fast-running'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'a'.repeat(64)},
  {originalRig163Bones:false},{selectedMeasuredFivePoseBvh:false},
  {selectedActualWebGLPreview:false},
  {independentlyVerifiedCoreSpanReport:{...prev,originalSourceSkirtCoreUnobservedRays:300}},
  {independentlyVerifiedCoreSpanReport:{...prev,sourceSkirtCoreSevenBandReceipts:[]}},
  {bodyPositions:Float32Array.from(f.bodyPositions,(v,i)=>i===0?NaN:v)},
  {coreBodyFaceMask:new Uint8Array(1)}
 ]){
  const report=audit({...base,...x});
  assert.equal(report.status,'SOURCE_CORE_RAY_CAUSE_OR_PROVENANCE_UNVERIFIABLE');
  assert.equal(report.originalPhoto2DFallbackRequired,true);
  assert.equal(report.consumer3DAdmitted,false);
 }
});
test('synthetic malformed original source buffers and fake bone weights rejected before claiming anatomical region',()=>{
 const f=fixture();
 for(const x of [
  {skirtPositions:Float32Array.from(f.skirtPositions,(v,i)=>i===1?NaN:v)},
  {skirtIndices:Uint32Array.from(f.skirtIndices,(v,i)=>i===0?900:v)},
  {bodyIndices:Uint16Array.from(f.bodyIndices,(v,i)=>i===0?999:v)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?163:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?.2:v)},
  {sourceMeshNames:['']},
  {sourceBoneNamesByMesh:[['wrong-length']]},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?99:v)}
 ])assert.throws(()=>measure({...f,...x}));
});

test('excluded original unmapped source bone is identified by immutable exact mesh ID and dominant name',()=>{
 const f=fixture({bone:'CautionUnmappedSourceBone'});
 const r=compare(f);
 assert.equal(r.unknownRaysWithExcludedSourceFaceWitness,336);
 assert.equal(r.unknownRaysWithNoObservedOriginalBodyFaceWitness,0);
 assert.deepEqual(r.originalExcludedSourceMeshRayNames,[{
  kind:'UNKNOWN_ORIGINAL_DOMINANT_BONE',sourceMeshId:0,
  sourceMeshName:'OriginalSourceBody',unknownRayDirections:336
 }]);
 assert.deepEqual(r.originalExcludedSourceBoneRayNames,[{
  kind:'UNKNOWN_ORIGINAL_DOMINANT_BONE',sourceMeshId:0,
  sourceMeshName:'OriginalSourceBody',
  sourceBoneIndex:0,sourceBoneName:'CautionUnmappedSourceBone',
  sourceNameRequiresReview:false,unknownRayDirections:336
 }]);
 assert.equal(r.consumer3DAdmitted,false);
});

test('excluded real original hand source bone remains EXCLUDED rather than anatomical core',()=>{
 const r=compare(fixture({bone:'hand01L'}));
 assert.ok(r.originalExcludedSourceBoneRayNames.some(x=>
  x.kind==='EXCLUDED_HEAD_ARMS'&&x.sourceBoneName==='hand01L'&&
  x.sourceBoneIndex===0&&x.sourceNameRequiresReview===false&&
  x.sourceMeshId===0&&x.unknownRayDirections===336));
 assert.equal(r.strictCoreUnknownRays,336);
 assert.equal(r.releaseAuthorized,false);
});

test('uncovered source directions preserve a full seven-ring 48-sector circular gap and four axes',()=>{
 const f=fixture();
 f.bodyPositions=Float32Array.from(f.bodyPositions,(v,i)=>i%3===0?v+8:v);
 const r=compare(f);
 assert.equal(r.strictCoreUnknownRays,336);
 assert.equal(r.unknownRaysWithExcludedSourceFaceWitness,0);
 assert.equal(r.unknownRaysWithNoObservedOriginalBodyFaceWitness,336);
 assert.equal(Object.values(r.unknownWithNoOriginalIndexedFaceByModelAxes).reduce(
  (n,v)=>n+v,0),336);
 assert.ok(r.unknownWithNoOriginalIndexedFaceCircularRunsByBand.every(x=>
  x.noOriginalIndexedBodyFaceHitRays===48&&
  x.longestCircularConsecutiveNoHitSectors===48));
 assert.equal(r.originalExcludedSourceBoneRayNames.length,0);
 assert.equal(r.originalExcludedSourceMeshRayNames.length,0);
});

test('original inputs and original bone label tables remain byte-unmodified after source-name attribution',()=>{
 const f=fixture({bone:'OriginalUnknownBoneSource'});
 const before=f.sourceBoneNamesByMesh.map(x=>x.slice());
 const ids=f.sourceMeshIds.slice(),mask=f.coreBodyFaceMask.slice();
 compare(f);
 assert.deepEqual(f.sourceBoneNamesByMesh,before);
 assert.deepEqual(f.sourceMeshIds,ids);
 assert.deepEqual(f.coreBodyFaceMask,mask);
});
