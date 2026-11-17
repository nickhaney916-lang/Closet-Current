/** M2 P89: synthetic source-shell tests do not prove true P541 original
 * anatomy. The source-locked native real Chromium/WebKit CI does that.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeActualOriginalSkirtCoreSpan89 as measure,
 auditActualOriginalSkirtCoreSpan89 as audit} from
 '../research/parallel89/skirt-original-core-span89.mjs';
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG='a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1';
const skinNames=(value='spine')=>Array.from({length:163},(_,i)=>i===0?value:'sourceBone'+i);
function fixture({skirtRadius=.45,bone='spine',faceMask=null,open=false}={}){
 const bodyPositions=Float32Array.from([
  -.2,.2,-.2, .2,.2,-.2, .2,1.8,-.2, -.2,1.8,-.2,
  -.2,.2,.2,  .2,.2,.2,  .2,1.8,.2, -.2,1.8,.2
 ]);
 const all=Uint16Array.from([
  0,2,1,0,3,2, 4,5,6,4,6,7, 0,1,5,0,5,4,
  3,7,6,3,6,2, 0,4,7,0,7,3, 1,2,6,1,6,5
 ]);
 const bodyIndices=open?all.slice(0,-6):all;
 const skirtPositions=new Float32Array(343*3);
 for(let row=0;row<7;row++)for(let j=0;j<49;j++){
  const k=(row*49+j)*3,rad=2*Math.PI*j/48;
  skirtPositions[k]=Math.cos(rad)*skirtRadius;
  skirtPositions[k+1]=.6+row*.12;
  skirtPositions[k+2]=Math.sin(rad)*skirtRadius;
 }
 const skirtIndices=new Uint16Array(576*3);
 for(let row=0,k=0;row<6;row++)for(let j=0;j<48;j++){
  const a=row*49+j,b=a+49;
  skirtIndices[k++]=a;skirtIndices[k++]=b;skirtIndices[k++]=a+1;
  skirtIndices[k++]=a+1;skirtIndices[k++]=b;skirtIndices[k++]=b+1;
 }
 return {bodyPositions,bodyIndices,skirtPositions,skirtIndices,
  coreBodyFaceMask:faceMask??new Uint8Array(bodyIndices.length/3).fill(1),
  skinIndices:new Uint16Array(8*4),
  skinWeights:Float32Array.from({length:32},(_,i)=>i%4===0?1:0),
  sourceMeshIds:new Uint16Array(8),sourceMeshNames:['OriginalTorso'],
  sourceBoneNamesByMesh:[skinNames(bone)]};
}
test('original closed indexed cube still gets ARTIFICIAL height-sliced ROI boundaries, not original anatomical holes',()=>{
 const x=fixture(),snap=Object.fromEntries(Object.entries(x)
  .filter(([,v])=>ArrayBuffer.isView(v)).map(([k,v])=>[k,v.slice()]));
 const r=measure(x);
 assert.equal(r.originalBodyFullIndexedTriangleCount,12);
 assert.ok(r.originalTorsoHipLegCoreFacesInSkirtSpan>0);
 assert.ok(r.roiArtificialSelectionCutEdges>0);
 assert.equal(r.roiUnderlyingOriginalIndexedOneFaceEdges,0);
 assert.equal(r.cropBoundaryIsNotAnOriginalBodyHole,true);
 assert.equal(r.originalSourceSkirtCoreTrueRayTests,336);
 assert.equal(r.originalSourceSkirtCoreInwardRays,0);
 assert.ok(r.originalSourceSkirtCoreOutwardRays>0);
 assert.equal(r.originalSourceSkirtCoreInwardRays+
  r.originalSourceSkirtCoreOutwardRays+
  r.originalSourceSkirtCoreNearZeroRays+
  r.originalSourceSkirtCoreUnobservedRays,336);
 assert.equal(r.signedExteriorContainmentCertified,false);
 assert.equal(r.originalPhoto2DFallbackRequired,true);
 assert.equal(r.consumer3DAdmitted,false);
 for(const [k,v] of Object.entries(snap))assert.deepEqual(x[k],v);
});
test('garment source rays INSIDE synthetic torso cube warn even though indexed body triangles may not directly cross skirt',()=>{
 const r=measure(fixture({skirtRadius:.1}));
 assert.ok(r.originalSourceSkirtCoreInwardRays>0);
 assert.ok(r.originalSourceSkirtCoreLargestObservedInwardRadiusGap>.05);
 assert.equal(r.coreRayGapIsNotFullSignedBodyVolumeContainment,true);
 assert.equal(r.releaseAuthorized,false);
});
test('unknown original bone names, head, eye and hand skin never silently become torso hip leg core',()=>{
 for(const bone of ['eyeL','hand01R','futureUnclassifiedBone']){
  const x=measure(fixture({bone}));
  assert.equal(x.originalTorsoHipLegCoreFacesInSkirtSpan,0);
  assert.equal(x.originalSourceSkirtCoreUnobservedRays,336);
  assert.equal(x.originalSourceSkirtCoreInwardRays,0);
  assert.equal(x.sourceSkirtPhysicalWaistOrHemSizeCalibrated,false);
  assert.equal(x.consumer3DAdmitted,false);
 }
});
test('missing ORIGINAL body face creates true one-face source indexed edge, separate from crop',()=>{
 const x=measure(fixture({open:true}));
 assert.ok(x.roiUnderlyingOriginalIndexedOneFaceEdges>0);
 assert.equal(x.originalGLBIndexedUVSeamsNotAutomaticallyWelded,true);
 assert.equal(x.originalCoreBodyFaceSetIsNotWatertightClosedVolume,true);
});
test('core face mask exclusion never becomes a hidden approved source torso body',()=>{
 const f=fixture();f.coreBodyFaceMask.fill(0);
 const x=measure(f);
 assert.equal(x.originalTorsoHipLegCoreFacesInSkirtSpan,0);
 assert.ok(x.coarseSourceFaceMaskExcludedCoreCandidates>0);
 assert.equal(x.originalSourceSkirtCoreUnobservedRays,336);
});
test('attested original source SHA gates refuse invalid pose, fake rig and invented face receipt; success still 2D-only',()=>{
 const f=fixture();
 const props={avatar:'female',pose:'source',sourcePhotoSHA256:PHOTO,
  sourceAnatomyGLBSHA256:RIG,originalRig163Bones:true,
  selectedMeasuredFivePoseBvh:true,selectedActualWebGLPreview:true,
  independentlyVerifiedOriginalSeamBoundaryCount:44710,
  independentlyVerifiedOriginalBodyTriangleCount:f.bodyIndices.length/3};
 const a=audit({...f,...props});
 assert.equal(a.schema,'P89-authentic-source-skirt-span-core-body-contour/v1');
 assert.equal(a.releaseAuthorized,false);
 assert.equal(a.consumer3DAdmitted,false);
 assert.equal(a.signedExteriorContainmentCertified,false);
 assert.equal(a.originalPhoto2DFallbackRequired,true);
 for(const broken of [
  {avatar:'private-owner'}, {pose:'animation'},
  {sourcePhotoSHA256:'f'.repeat(64)},
  {sourceAnatomyGLBSHA256:'a'.repeat(64)},
  {originalRig163Bones:false},{selectedActualWebGLPreview:false},
  {selectedMeasuredFivePoseBvh:false},
  {independentlyVerifiedOriginalSeamBoundaryCount:0},
  {independentlyVerifiedOriginalBodyTriangleCount:13},
  {coreBodyFaceMask:new Uint8Array(1)},
  {bodyIndices:Uint32Array.from(f.bodyIndices,(v,i)=>i===0?999:v)}
 ]){
  const out=audit({...f,...props,...broken});
  assert.equal(out.status,'SOURCE_SKIRT_CORE_BODY_SPAN_UNVERIFIABLE');
  assert.equal(out.originalPhoto2DFallbackRequired,true);
  assert.equal(out.consumer3DAdmitted,false);
  assert.equal(out.releaseAuthorized,false);
 }
});
test('skirt source height, original body skinned source, face mask, original rigged bone index buffers fail closed on corruption',()=>{
 const f=fixture();
 const arr=[
  {skirtPositions:Float32Array.from(f.skirtPositions,(v,i)=>i===1?NaN:v)},
  {bodyPositions:Float32Array.from(f.bodyPositions,(v,i)=>i===1?NaN:v)},
  {skirtIndices:Uint32Array.from(f.skirtIndices,(v,i)=>i===0?999:v)},
  {coreBodyFaceMask:Uint8Array.from(f.coreBodyFaceMask,(v,i)=>i===0?4:v)},
  {skinWeights:Float32Array.from(f.skinWeights,(v,i)=>i===0?.5:v)},
  {skinIndices:Uint16Array.from(f.skinIndices,(v,i)=>i===0?164:v)},
  {sourceMeshIds:Uint16Array.from(f.sourceMeshIds,(v,i)=>i===0?99:v)},
  {sourceBoneNamesByMesh:[['no-source-original-163bone-bone']]}
 ];
 for(const row of arr)assert.throws(()=>measure({...f,...row}));
});
