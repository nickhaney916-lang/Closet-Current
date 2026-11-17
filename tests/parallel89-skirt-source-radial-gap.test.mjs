/** Synthetic source-topology contracts only. Genuine real source skinned
 * body/skirt Chromium + WebKit evidence runs separately at exact SHA.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSelectedOriginalSkirtRadialGap89 as audit} from
 '../research/parallel89/skirt-source-radial-gap89.mjs';
const SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
function fixture({radius=.3,core='all'}={}){
 const skirt=[],skirtIdx=[],n=48;
 for(let row=0;row<7;row++)for(let j=0;j<=n;j++){
  const a=j*Math.PI*2/n;
  skirt.push(radius*Math.sin(a),1.6-row*.12,radius*Math.cos(a));
  if(row<6&&j<n){
   const p=row*(n+1)+j,q=p+n+1;
   skirtIdx.push(p,p+1,q,p+1,q+1,q);
  }
 }
 const verts=[],idx=[],m=160;
 for(let y of [.2,2])for(let j=0;j<=m;j++){
  const angle=j*Math.PI*2/m;
  verts.push(.2*Math.sin(angle),y,.2*Math.cos(angle));
 }
 for(let j=0;j<m;j++){
  const a=j,b=j+m+1;
  idx.push(a,b,a+1,a+1,b,b+1);
 }
 const mask=Uint8Array.from({length:idx.length/3},(_,i)=>{
  if(core==='half')return i<m?1:0;
  return i===2?0:1;
 });
 return {skirtPositions:new Float32Array(skirt),
  skirtIndices:new Uint16Array(skirtIdx),
  bodyPositions:new Float32Array(verts),
  bodyIndices:new Uint16Array(idx),coreBodyFaceMask:mask,
  avatar:'female',pose:'blend-25',sourcePhotoSHA256:SHA,
  originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
  selectedActualWebGLPreview:true};
}
test('separate source avatar radial plane measurement sees outward surface without falsely approving wearable cloth',()=>{
 const f=fixture(),old=f.skirtPositions.slice(),body=f.bodyPositions.slice();
 const x=audit(f);
 assert.equal(x.schema,'P89-actual-original-163bone-source-radial-body-gap/v1');
 assert.equal(x.sourceGarmentSevenMeasuredPhotoAlphaBands,true);
 assert.equal(x.sevenOriginalSourceSkirtBands.length,7);
 assert.equal(x.originalSourceGarmentRingAngularSamples,336);
 assert.equal(x.sampledInwardBodyGapAngularSectors,0);
 assert.ok(x.sampledOutwardBodyGapAngularSectors>0);
 assert.equal(x.exactRaySampledAngularPositions,336);
 assert.ok(x.exactRayOutwardSourceSectors>0);
 assert.equal(x.exactRayInwardSourceSectors,0);
 assert.equal(x.exactRayCannotCertifyWatertightVolume,true);
 assert.equal(x.exactRayWithoutOriginalBodyContourIsUnknownNotSafe,true);
 assert.equal(x.exactRayBodyContourSourceTopology,
  'ORIGINAL_INDEXED_FACE_HORIZONTAL_PLANE_RAY_INTERSECTION');
 assert.equal(x.exactRayOutwardSourceSectors+x.exactRayNearSourceSectors+
  x.exactRayInwardSourceSectors+x.exactRayUnknownSourceSectors,336);
 assert.equal(x.exactRaySourceFitDisposition,
  x.exactRayUnknownSourceSectors>0?'EXACT_ORIGINAL_BODY_RAY_UNOBSERVED_BLOCKED':
  'EXACT_ORIGINAL_BODY_RADIAL_GAP_SAMPLED_NOT_WEARABLE');
 assert.ok(x.originalBodySourcePlaneCutSegmentCount>20);
 assert.ok(x.minimumObservedRadialGapMeters>.05);
 assert.equal(x.radialWitnessIsNotSignedClosedMeshContainment,true);
 assert.equal(x.garmentSourceAbsoluteSizeInferredNotMeasured,true);
 assert.equal(x.consumer3DAdmitted,false);assert.equal(x.releaseAuthorized,false);
 assert.deepEqual(f.skirtPositions,old);assert.deepEqual(f.bodyPositions,body);
});
test('genuine radial negative gap remains an outward-body overlap even when a caller claims zero transverse BVH crossings',()=>{
 const x=audit(fixture({radius:.12}));
 assert.equal(x.status,'SAMPLED_SOURCE_RADIAL_INWARD_BODY_OVERLAP_WITNESSED_NOT_WEARABLE');
 assert.ok(x.sampledInwardBodyGapAngularSectors>0);
 assert.ok(x.largestObservedRadialInwardDistanceMeters>.04);
 assert.ok(x.exactRayInwardSourceSectors>0);
 assert.ok(x.exactRayMaximumObservedInwardMeters>.04);
 assert.ok(['EXACT_ORIGINAL_BODY_RAY_INWARD_BLOCKED',
  'EXACT_ORIGINAL_BODY_RAY_INWARD_AND_UNOBSERVED_BLOCKED']
  .includes(x.exactRaySourceFitDisposition));
 assert.equal(x.consumer3DAdmitted,false);
});
test('missing source-body angular sectors never become inferred safe garment clearance',()=>{
 const x=audit(fixture({core:'half'}));
 assert.equal(x.status,'SAMPLED_SOURCE_RADIAL_BODY_COVERAGE_INCOMPLETE_NOT_WEARABLE');
 assert.ok(x.sampledUnknownBodyGapAngularSectors>0);
 assert.ok(x.exactRayUnknownSourceSectors>0);
 assert.equal(x.exactRayWithoutOriginalBodyContourIsUnknownNotSafe,true);
 assert.equal(x.releaseAuthorized,false);
});
test('inward anatomical body evidence AND unknown angular sectors must both be disclosed, not hidden by one generic status',()=>{
 const x=audit(fixture({radius:.12,core:'half'}));
 assert.equal(x.status,'SAMPLED_SOURCE_RADIAL_INWARD_AND_MISSING_BODY_SECTORS_NOT_WEARABLE');
 assert.equal(x.actualModelBasedRadialInwardWitness,true);
 assert.equal(x.originalBodyAngularSectorEvidenceMissing,true);
 assert.ok(x.exactRayInwardSourceSectors>0);
 assert.ok(x.exactRayUnknownSourceSectors>0);
 assert.equal(x.exactRaySourceFitDisposition,
  'EXACT_ORIGINAL_BODY_RAY_INWARD_AND_UNOBSERVED_BLOCKED');
 assert.ok(x.sampledInwardBodyGapAngularSectors>0);
 assert.ok(x.sampledUnknownBodyGapAngularSectors>0);
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.releaseAuthorized,false);
});
test('when no original anatomical body faces cross the skirt plane, all exact rays stay UNKNOWN, never fabricated as safe',()=>{
 const f=fixture();
 const translated=Float32Array.from(f.bodyPositions,(v,i)=>i%3===1?v+5:v);
 const x=audit({...f,bodyPositions:translated});
 assert.equal(x.exactRaySampledAngularPositions,336);
 assert.equal(x.exactRayUnknownSourceSectors,336);
 assert.equal(x.exactRayOutwardSourceSectors,0);
 assert.equal(x.exactRayInwardSourceSectors,0);
 assert.equal(x.exactRaySourceFitDisposition,'EXACT_ORIGINAL_BODY_RAY_UNOBSERVED_BLOCKED');
 assert.equal(x.consumer3DAdmitted,false);
 assert.equal(x.originalPhoto2DFallbackRequired,true);
});
test('source contour exact rays are repeatable and do not mutate anatomical original indexed face data',()=>{
 const f=fixture(),copy=f.bodyIndices.slice(),weights=f.coreBodyFaceMask.slice();
 const one=audit(f),two=audit(f);
 assert.equal(one.exactRayOutwardSourceSectors,two.exactRayOutwardSourceSectors);
 assert.equal(one.exactRayUnknownSourceSectors,two.exactRayUnknownSourceSectors);
 assert.equal(one.exactRayMinimumObservedSkirtMinusBodyMeters,
  two.exactRayMinimumObservedSkirtMinusBodyMeters);
 assert.deepEqual(f.bodyIndices,copy);
 assert.deepEqual(f.coreBodyFaceMask,weights);
 assert.equal(one.releaseAuthorized,false);
});
test('wrong provenance, private person, invalid index, NaN geometry and forged scene gates refuse original-source radial receipt',()=>{
 const f=fixture();
 for(const k of [
  {avatar:'private-owner'},{pose:'unobserved-motion'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {originalRig163Bones:false},{selectedMeasuredFivePoseBvh:false},
  {selectedActualWebGLPreview:false},
  {skirtPositions:new Float32Array(8)},
  {bodyPositions:Float32Array.from(f.bodyPositions,(n,i)=>i===0?NaN:n)},
  {bodyIndices:new Uint32Array([0,1,99_999])},
  {coreBodyFaceMask:new Uint8Array(f.bodyIndices.length/3)}
 ]){
  const x=audit({...f,...k});
  assert.equal(x.status,'ORIGINAL_SOURCE_RADIAL_BODY_GAP_NOT_VERIFIABLE');
  assert.equal(x.originalPhoto2DFallbackRequired,true);
  assert.equal(x.releaseAuthorized,false);
 }
});
