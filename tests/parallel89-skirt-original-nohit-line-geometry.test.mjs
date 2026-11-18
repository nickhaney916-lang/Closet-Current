/** Exact original licensed GLB/JPEG acceptance is ONLY by CI native
 * Chromium + WebKit; these fixtures prove conservation and refusal.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOriginalNoHitLineGeometry89 as measure,
 auditOriginalNoHitLineGeometry89 as audit} from
 '../research/parallel89/skirt-original-nohit-line-geometry89.mjs';
import {summarizeOriginalCoreSkinSensitivity89 as prior} from
 '../research/parallel89/skirt-original-core-skin-sensitivity89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
function fixture({shift=0,partial=false,mask=true}={}){
 const bodyPositions=Float32Array.from([
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2, .2,.2,.2, .2,1.8,.2, -.2,1.8,.2
 ],(v,i)=>i%3===0?v+shift:v);
 const full=Uint16Array.from([
  0,2,1,0,3,2,4,5,6,4,6,7,
  0,1,5,0,5,4,3,7,6,3,6,2,
  0,4,7,0,7,3,1,2,6,1,6,5
 ]);
 const bodyIndices=partial?full.slice(0,18):full,
  skirtPositions=new Float32Array(343*3),
  skirtIndices=new Uint16Array(576*3);
 for(let row=0;row<7;row++)for(let i=0;i<49;i++){
  const off=3*(row*49+i),angle=i*2*Math.PI/48;
  skirtPositions[off]=Math.cos(angle)*.45;
  skirtPositions[off+1]=.6+.12*row;
  skirtPositions[off+2]=Math.sin(angle)*.45;
 }
 for(let row=0,k=0;row<6;row++)for(let i=0;i<48;i++){
  const a=row*49+i,b=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=b;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=b;skirtIndices[k++]=b+1;
 }
 return {bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask:new Uint8Array(bodyIndices.length/3).fill(mask?1:0),
  skinIndices:new Uint16Array(32),
  skinWeights:Float32Array.from({length:32},(_,i)=>i%4===0?1:0),
  sourceMeshIds:new Uint16Array(8),sourceMeshNames:['sourceBody'],
  sourceBoneNamesByMesh:[Array.from({length:163},(_,i)=>
   i===0?'spine04':'OriginalSourceBone'+i)]};
}
function compare(f){
 const result=measure(f),p=prior(f);
 assert.equal(result.originalPhotoSkirtSourceRayCount,336);
 assert.equal(result.originalSourceIndexedBodyFaceCount,p.sourceIndexedBodyTriangles);
 assert.equal(result.originalStrictCoreInward,p.baselineStrictCoreInward);
 assert.equal(result.originalStrictCoreOutward,p.baselineStrictCoreOutward);
 assert.equal(result.originalStrictCoreNear,p.baselineStrictCoreNear);
 assert.equal(result.originalStrictCoreUnknown,p.baselineStrictCoreUnknown);
 assert.equal(result.originalSourceExcludedFaceRayHits,
  p.baselineUnknownExcludedOriginalFaceRayHits);
 assert.equal(result.originalSourceNoForwardFaceRayHits,
  p.baselineUnknownNoOriginalFaceRayHits);
 assert.equal(Object.values(result.exclusiveNoHitLineGeometryReasons)
  .reduce((a,b)=>a+b,0),result.originalSourceNoForwardFaceRayHits);
 assert.equal(result.sevenOriginalSkirtBandLineReasons.length,7);
 for(let i=0;i<7;i++){
  const x=result.sevenOriginalSkirtBandLineReasons[i],
   y=p.originalStrictCoreSourceBandReceipts[i];
  assert.equal(x.originalPhotoSkirtBand,i);
  assert.equal(x.originalStrictUnknown,y.strictCoreUnknown);
  assert.equal(x.originalExcludedBodySourceHit,y.originalExcludedFaceIntersection);
  assert.equal(x.originalNoForwardBodySourceRayHit,y.noObservedOriginalFaceIntersection);
  assert.equal(Object.values(x.noHitLineGeometryReasons)
   .reduce((a,b)=>a+b,0),x.originalNoForwardBodySourceRayHit);
  assert.equal(x.noHitSourceAngularSectors.length,x.originalNoForwardBodySourceRayHit);
  assert.ok(x.noHitSourceAngularSectors.every(x=>x>=0&&x<48&&Number.isInteger(x)));
 }
 assert.equal(result.sourceMeshEdgesNotWeldedOrFabricated,true);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.releaseAuthorized,false);
 return result;
}
test('complete original-indexed synthetic torso cannot invent a missing ray or body repair',()=>{
 const a=fixture(),copy=Object.fromEntries(Object.entries(a)
  .filter(([,x])=>ArrayBuffer.isView(x)).map(([k,v])=>[k,v.slice()]));
 const x=compare(a);
 assert.equal(x.originalStrictCoreUnknown,0);
 assert.equal(x.originalSourceNoForwardFaceRayHits,0);
 assert.equal(x.originalPhoto2DFallbackRequired,true);
 for(const [k,v] of Object.entries(copy))assert.deepEqual(a[k],v);
});
test('physically shifted original source exposes distinct forward beyond 3m and rear-origin evidence',()=>{
 const x=compare(fixture({shift:5}));
 assert.equal(x.originalStrictCoreUnknown,336);
 assert.equal(x.originalSourceNoForwardFaceRayHits,336);
 assert.ok(x.exclusiveNoHitLineGeometryReasons.SOURCE_FORWARD_BEYOND_RAY_CAP>0);
 assert.ok(x.exclusiveNoHitLineGeometryReasons.SOURCE_BEHIND_ORIGINAL_SKIRT_CENTER>0);
 assert.ok(x.exclusiveNoHitLineGeometryReasons.NO_ORIGINAL_SOURCE_PLANE_LINE_INTERSECTION>0);
 assert.equal(x.newRealWorldBodyGarmentDimensionsInferred,false);
});
test('valid nonclosed partial source-indexed geometry remains no-hit UNKNOWN without constructing a body',()=>{
 const x=compare(fixture({partial:true}));
 assert.ok(x.originalSourceNoForwardFaceRayHits>0);
 assert.equal(x.lineBehindSkirtCenterIsNotBodyOrGarmentClearance,true);
 assert.ok(x.exclusiveNoHitLineGeometryReasons.SOURCE_BEHIND_ORIGINAL_SKIRT_CENTER>=0);
 assert.equal(x.sourceNoHitCollinearPossibleDirections>=0,true);
});
test('faces excluded by original legitimate strict core mask are NOT silently promoted',()=>{
 const x=compare(fixture({mask:false}));
 assert.equal(x.originalStrictCoreUnknown,336);
 assert.equal(x.originalSourceExcludedFaceRayHits,336);
 assert.equal(x.originalSourceNoForwardFaceRayHits,0);
 assert.deepEqual(x.exclusiveNoHitLineGeometryReasons,{
  SOURCE_FORWARD_BEYOND_RAY_CAP:0,
  SOURCE_BEHIND_ORIGINAL_SKIRT_CENTER:0,
  SOURCE_COLLINEAR_OR_DEGENERATE_LINE:0,
  NO_ORIGINAL_SOURCE_PLANE_LINE_INTERSECTION:0
 });
});
test('source provenance receipts validate original 336 rays; even perfect synthetic input cannot certify consumer fit',()=>{
 const f=fixture(),p=prior(f),payload={...f,
  avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:RIG,
  originalRig163Bones:true,selectedMeasuredFivePoseBvh:true,
  selectedActualWebGLPreview:true,
  independentlyVerifiedSkinSensitivityReceipt:p};
 const good=audit(payload);
 assert.equal(good.schema,'P89-locked-original-nohit-anatomy-plane-line/v1');
 assert.equal(good.status,'SOURCE_NOHIT_LINE_REASONS_EVIDENCED_NOT_WEARABLE_FIT');
 assert.equal(good.closedSignedBodyVolumeVerified,false);
 assert.equal(good.consumer3DAdmitted,false);
 for(const changed of [
  {avatar:'owner'},{pose:'running'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'0'.repeat(64)},
  {originalRig163Bones:false},{selectedMeasuredFivePoseBvh:false},
  {selectedActualWebGLPreview:false},
  {independentlyVerifiedSkinSensitivityReceipt:{
   ...p,baselineStrictCoreUnknown:191}},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?.3:v)}
 ]){
  const bad=audit({...payload,...changed});
  assert.equal(bad.status,'ORIGINAL_SKIRT_SOURCE_LINE_ANALYSIS_UNVERIFIABLE');
  assert.equal(bad.consumer3DAdmitted,false);
  assert.equal(bad.originalPhoto2DFallbackRequired,true);
 }
});
test('invalid original source position, mesh, bone skin, polygon mask and photo buffers refuse auditable rays',()=>{
 const f=fixture();
 for(const change of [
  {bodyPositions:Float32Array.from(f.bodyPositions,(v,i)=>i===0?NaN:v)},
  {skirtPositions:Float32Array.from(f.skirtPositions,(v,i)=>i===2?Infinity:v)},
  {bodyIndices:Uint16Array.from(f.bodyIndices,(v,i)=>i===0?999:v)},
  {skirtIndices:Uint16Array.from(f.skirtIndices,(v,i)=>i===0?999:v)},
  {coreBodyFaceMask:new Uint8Array(2)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?163:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?.2:v)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?200:v)},
  {sourceMeshNames:['']},{sourceBoneNamesByMesh:[['not-full-original-163bone']]}
 ])assert.throws(()=>measure({...f,...change}));
});
