import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSelectedOriginalSkirtRadialGap89 as priorAudit}
 from '../research/parallel89/skirt-source-radial-gap89.mjs';
import {auditOriginalWholeBodyCoreRayCauses89 as audit}
 from '../research/parallel89/skirt-original-ray-coverage-causes89.mjs';

const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({clothRadius=.3,maskMode='normal',bodyDisplacementY=0}={}){
 const skirt=[],skirtIdx=[],n=48;
 for(let row=0;row<7;row++)for(let j=0;j<=n;j++){
  const a=j*Math.PI*2/n;
  skirt.push(clothRadius*Math.sin(a),1.6-row*.12,clothRadius*Math.cos(a));
  if(row<6&&j<n){
   const p=row*(n+1)+j,q=p+n+1;
   skirtIdx.push(p,p+1,q,p+1,q+1,q);
  }
 }
 const verts=[],idx=[],m=160;
 for(let y of [.2+bodyDisplacementY,2+bodyDisplacementY])
  for(let j=0;j<=m;j++){
   const a=j*Math.PI*2/m;
   verts.push(.2*Math.sin(a),y,.2*Math.cos(a));
  }
 for(let j=0;j<m;j++){
  const a=j,b=j+m+1;
  idx.push(a,b,a+1,a+1,b,b+1);
 }
 const mask=Uint8Array.from({length:idx.length/3},(_,i)=>{
  if(maskMode==='half')return i<m?1:0;
  if(maskMode==='stripe')return i%5===0?0:1;
  return i===2?0:1;
 });
 return {
  skirtPositions:new Float32Array(skirt),
  skirtIndices:new Uint16Array(skirtIdx),
  bodyPositions:new Float32Array(verts),
  bodyIndices:new Uint16Array(idx),
  coreBodyFaceMask:mask,avatar:'female',pose:'blend-25',
  sourcePhotoSHA256:PHOTO,sourceAnatomyGLBSHA256:RIG,
  originalRig163Bones:true,selectedActualWebGLPreview:true,
  selectedFivePoseBvhVerified:true
 };
}
function evaluate(x){
 const input={...x};
 input.priorExactRadialReceipt=priorAudit({
  skirtPositions:x.skirtPositions,skirtIndices:x.skirtIndices,
  bodyPositions:x.bodyPositions,bodyIndices:x.bodyIndices,
  coreBodyFaceMask:x.coreBodyFaceMask,avatar:x.avatar,pose:x.pose,
  sourcePhotoSHA256:x.sourcePhotoSHA256,
  originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
  selectedActualWebGLPreview:true
 });
 return audit(input);
}
function safe(x){
 assert.equal(x.schema,'P89-original-163bone-whole-vs-core-ray-missing-cause/v1');
 assert.equal(x.status,'ORIGINAL_SOURCE_BODY_RAY_COVERAGE_CAUSES_MEASURED_NO_FIT_AUTHORIZED',
  JSON.stringify(x));
 assert.equal(x.independentlyMatchedExactOriginalCoreRayReceipt,true);
 assert.equal(x.originalPhotoSkirtRaySectors,336);
 assert.equal(x.sevenSourceOriginalBodyRayCauseBands.length,7);
 const c=x.sourceCoreRayMissingReasonTotals;
 assert.equal(c.CORE_SOURCE_ORIGINAL_RAY_KNOWN,
  x.originalCoreSourceExactInwardRaySectors+
  x.originalCoreSourceExactNearRaySectors+
  x.originalCoreSourceExactOutwardRaySectors);
 assert.equal(c.CORE_SOURCE_ORIGINAL_RAY_KNOWN+
  x.originalCoreSourceExactUnknownRaySectors,336);
 assert.equal(x.originalWholeSourceRayObservedSectors+
  x.originalWholeSourceRayUnobservedSectors,336);
 assert.equal(c.EXCLUDED_ORIGINAL_BODY_SOURCE_FACE_RAY_FOUND+
  c.ORIGINAL_SELECTED_CORE_RAY_WITH_INSUFFICIENT_SEGMENT_SUPPORT+
  c.WHOLE_ORIGINAL_BODY_SOURCE_RAY_COLLINEAR_AMBIGUOUS+
  c.NO_ORIGINAL_FULL_BODY_INDEXED_FACE_RAY,
  x.originalCoreSourceExactUnknownRaySectors);
 assert.equal(x.originalBodySignedVolumeUnavailable,true);
 assert.equal(x.unfilteredBodySourceRayMayBeHeadArmOrMultipleSkinMeshes,true);
 assert.equal(x.originalPhoto2DFallbackRequired,true);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.noOriginalFaceIndicesOrVertexCoordinatesReleased,true);
 assert.equal('bodyPositions' in x,false);
 return x;
}
test('real indexed full original body and core both observed, never infer signed fit',()=>{
 const f=fixture(),old=f.bodyPositions.slice(),photo=f.skirtPositions.slice();
 const x=safe(evaluate(f));
 assert.equal(x.originalCoreSourceExactInwardRaySectors,0);
 assert.ok(x.originalCoreSourceExactOutwardRaySectors>0);
 assert.ok(x.originalWholeSourceRayObservedSectors>0);
 assert.deepEqual(f.bodyPositions,old);
 assert.deepEqual(f.skirtPositions,photo);
});
test('core mask drops a genuine source-body sector but full-body original ray proves an EXCLUDED source face exists, not safe torso',()=>{
 const x=safe(evaluate(fixture({maskMode:'half'})));
 assert.ok(x.originalCoreSourceExactUnknownRaySectors>0);
 assert.ok(x.sourceCoreRayMissingReasonTotals.EXCLUDED_ORIGINAL_BODY_SOURCE_FACE_RAY_FOUND>0,
  JSON.stringify(x.sourceCoreRayMissingReasonTotals));
 assert.equal(x.consumer3DAdmitted,false);
});
test('original full body has no indexed face crossing a skirt height: missing evidence is NOT a gap pass',()=>{
 const x=safe(evaluate(fixture({bodyDisplacementY:5})));
 assert.equal(x.originalCoreSourceExactUnknownRaySectors,336);
 assert.equal(x.originalWholeSourceRayObservedSectors,0);
 assert.equal(x.sourceCoreRayMissingReasonTotals.NO_ORIGINAL_FULL_BODY_INDEXED_FACE_RAY,336);
 assert.equal(x.consumer3DAdmitted,false);
});
test('original full-body inward ray remains a geometric body overlap witness, even with transverse contacts asserted elsewhere as zero',()=>{
 const x=safe(evaluate(fixture({clothRadius:.12})));
 assert.ok(x.originalCoreSourceExactInwardRaySectors>0);
 assert.ok(x.originalWholeSourceRayInwardSectors>0);
 assert.equal(x.releaseAuthorized,false);
});
test('source core mask excludes sparse triangles and source full ray remains separately counted',()=>{
 const x=safe(evaluate(fixture({maskMode:'stripe',clothRadius:.12})));
 assert.ok(x.sevenSourceOriginalBodyRayCauseBands.every(row=>
  row.actualWholeOriginalBodyTrianglePlaneSegments===
   row.actualSourceCoreTrianglePlaneSegments+
    row.actualSourceExcludedOriginalFacePlaneSegments));
 assert.equal(x.originalCoreSourceExactInwardRaySectors>0,true);
 assert.equal(x.originalBodySignedVolumeUnavailable,true);
});
test('forged prior radial counts cannot validate whole original anatomy ray',()=>{
 const f=fixture(),r=priorAudit({
  ...f,selectedMeasuredFivePoseBvh:true
 });
 const bogus={...r,sevenOriginalSourceSkirtBands:r.sevenOriginalSourceSkirtBands.map((row,i)=>
  i===0?{...row,exactRayObservedOutwardSectors:99}:row)};
 const x=audit({...f,priorExactRadialReceipt:bogus});
 assert.equal(x.status,'ORIGINAL_WHOLE_VS_SELECTED_CORE_RAY_EVIDENCE_UNVERIFIABLE');
 assert.equal(x.reason,'independent-original-core-exact-ray-evidence-mismatch');
 assert.equal(x.consumer3DAdmitted,false);
});
test('reject source mismatch, unsigned body, invalid skin face mask, malformed photo',()=>{
 const f=fixture(),prior=priorAudit({...f,selectedMeasuredFivePoseBvh:true});
 const opts={...f,priorExactRadialReceipt:prior};
 for(const wrong of [
  {sourcePhotoSHA256:'injected'},
  {sourceAnatomyGLBSHA256:'injected'},
  {originalRig163Bones:false},
  {selectedFivePoseBvhVerified:false},
  {avatar:'unrelated'},
  {coreBodyFaceMask:new Uint8Array(4)},
  {bodyIndices:Uint16Array.from([999,0,1,...f.bodyIndices])},
  {skirtPositions:new Float32Array(3)},
  {skirtPositions:Float32Array.from(f.skirtPositions,(x,i)=>i===3?Infinity:x)}
 ]){
  const x=audit({...opts,...wrong});
  assert.equal(x.status,'ORIGINAL_WHOLE_VS_SELECTED_CORE_RAY_EVIDENCE_UNVERIFIABLE');
  assert.equal(x.releaseAuthorized,false);
 }
});
test('no earlier original radial source receipt is accepted as a surrogate for genuine data',()=>{
 const x=audit(fixture());
 assert.equal(x.reason,'immutable-original-indexed-face-and-independent-exact-ray-receipt-required');
 assert.equal(x.originalPhoto2DFallbackRequired,true);
});
test('a skinned source-photo ring tilted at an unsampled spoke cannot be audited as one level body slice',()=>{
 for(const avatar of ['female','male'])for(const ring of [0,3,6]){
  const f=fixture();
  f.avatar=avatar;
  if(avatar==='male')f.sourceAnatomyGLBSHA256=
   'd15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8';
  const original=f.skirtPositions.slice();
  // Opposite spokes j=0 and j=24 retain the original equal Y. The older
  // source audit accepted this data despite the hidden +60mm third spoke.
  f.skirtPositions[(ring*49+12)*3+1]+=.06;
  const r=evaluate(f);
  assert.equal(r.status,'ORIGINAL_WHOLE_VS_SELECTED_CORE_RAY_EVIDENCE_UNVERIFIABLE');
  assert.equal(r.reason,'posed-photo-skirt-ring-slice-not-planar');
  assert.equal(r.originalPhoto2DFallbackRequired,true);
  assert.equal(r.consumer3DAdmitted,false);
  assert.equal(r.releaseAuthorized,false);
  assert.equal(f.skirtPositions[(ring*49+0)*3+1],original[(ring*49+0)*3+1]);
  assert.equal(f.skirtPositions[(ring*49+24)*3+1],original[(ring*49+24)*3+1]);
 }
});
