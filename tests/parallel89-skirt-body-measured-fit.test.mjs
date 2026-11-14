/**
 * P89 SYNTHETIC STRUCTURAL TESTS. They are never public photo, genuine
 * anatomical cross-sections, native WebGL or body/skirt collision evidence.
 * Actual Commons-0043 + real male/female GLB + P84 BVH proof runs in separate
 * no-deploy Chromium/WebKit GitHub Actions research jobs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {compareActualMeasuredSkirtFit89} from '../research/parallel89/skirt-body-measured-fit89.mjs';
const P=['source','blend-50','relaxed'];
function createSyntheticBodyAndSkirt(){
 const root=new T.Group(),g=new T.BufferGeometry(),pos=[],rest=[],uv=[],skin=[],weight=[],index=[];
 const segments=48;
 for(let r=0;r<7;r++)for(let j=0;j<=segments;j++){
  const theta=j*2*Math.PI/segments,s=1+r*.055;
  const point=[Math.sin(theta)*.18*s,1.30-r*.10,Math.cos(theta)*.16*s];
  pos.push(...point);rest.push(...point);
  uv.push(j/48,r/6);skin.push(0,0,0,0);weight.push(1,0,0,0);
  if(r<6&&j<segments){
   const i=r*(segments+1)+j,k=i+segments+1;
   index.push(i,i+1,k,i+1,k+1,k);
  }
 }
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setAttribute('sourceSkirt89Rest',new T.Float32BufferAttribute(rest,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));
 g.setAttribute('skinWeight',new T.Float32BufferAttribute(weight,4));
 g.setIndex(index);g.computeVertexNormals();
 const skeleton=new T.Skeleton(Array.from({length:163},()=>new T.Bone()));
 for(const bone of skeleton.bones)root.add(bone);
 const mesh=new T.SkinnedMesh(g,new T.MeshStandardMaterial());
 root.add(mesh);root.updateMatrixWorld(true);mesh.bind(skeleton);
 const originalGeometry=mesh.geometry;
 // THREE DIFFERENT ORIGINAL JOINT POSES are simulated identically HERE,
 // unlike actual native browser tests, which move real GLB arm bones.
 const sourceBodyPositions=[];
 for(let r=0;r<7;r++)for(let j=0;j<48;j++){
  const angle=j*Math.PI*2/48;
  for(let sample=0;sample<3;sample++){
   const rad=.170+.0005*sample;
   sourceBodyPositions.push(Math.sin(angle)*rad,1.30-r*.10,
    Math.cos(angle)*rad);
  }
 }
 return {root,mesh,originalGeometry,sourceBodyPositions:Float32Array.from(sourceBodyPositions),
  sourcePositionBytes:originalGeometry.getAttribute('position').array.slice(),
  sourceUVBytes:originalGeometry.getAttribute('uv').array.slice()};
}
function testBVHShape(mesh,original,mode='reduce'){
 const altered=mesh.geometry!==original;
 const names=Array.from({length:6},(_,i)=>i+'|'+(i+100));
 const keys=mode==='introduce'&&altered?['0|100','7|107']:altered?
  names.slice(0,3):names;
 return {count:keys.length,pairs:new Set(keys),maxDepth:.0005};
}
function trial(x,overrides={}){
 return compareActualMeasuredSkirtFit89({
  root:x.root,mesh:x.mesh,avatar:'female',
  applyPose:pose=>assert.ok(P.includes(pose),'only 3 synthetic pose names'),
  sampleBodySkinnedWorld:()=>x.sourceBodyPositions,
  sampleContact:()=>testBVHShape(x.mesh,x.originalGeometry),
  ...overrides
 });
}
test('source-bound seven-band anatomy fitted only provisionally; every source vertex, UV and rig restored',()=>{
 const x=createSyntheticBodyAndSkirt(),r=trial(x);
 assert.equal(r.schema,'P89-genuine-source-skirt-measured-anatomical-envelope/v1');
 assert.notEqual(r.status,'BODY_MEASURED_SOURCE_GEOMETRY_REJECTED',r.reason);
 assert.equal(r.nativeSkinnedRigBones,163);
 assert.equal(r.actualBodyMeasurementsFromOriginalPublicGLBsOnly,true);
 assert.deepEqual(r.sampledActualBonePoses,P);
 assert.equal(r.radialSourceBands,7);
 assert.equal(r.sectorCount,48);
 assert.equal(r.candidateRegimes.length,3);
 assert.equal(r.actualAnatomicalOriginalBodyCrossSectionSummaries.length,3);
 assert.equal(r.baselineStrictSkirtBodyTriangleCrossingsAcrossPoses,18);
 assert.equal(r.baselineCrossingsBySourceSkirtBand.length,6);
 assert.equal(r.baselineCrossingsBySourceSkirtBand.reduce((a,b)=>a+b,0),18);
 for(const v of r.candidateRegimes){
  assert.equal(v.sourceMaskBandFit.length,7);
  assert.equal(v.originalPhotoTextureUVNeverEdited,true);
  assert.equal(v.photoMotifStretchHasNoHumanAcceptance,true);
  assert.equal(v.releaseAuthorized,false);
  assert.ok(v.maximumWorldSkirtAdjustmentMeters<=.09501);
 }
 assert.equal(r.originalPhotographedFrontColorAndUVPreserved,true);
 assert.equal(r.allTestsRevertedNoConsumerGeometryChanged,true);
 assert.equal(r.source2DFallbackRequired,true);
 assert.equal(r.photoSkirtConsumer3DAdmitted,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(x.mesh.geometry,x.originalGeometry);
 assert.deepEqual(x.mesh.geometry.getAttribute('position').array,x.sourcePositionBytes);
 assert.deepEqual(x.mesh.geometry.getAttribute('uv').array,x.sourceUVBytes);
});
test('ANY new source/body crossing witness is a hard research veto despite possible gross reduction',()=>{
 const x=createSyntheticBodyAndSkirt();
 const r=trial(x,{sampleContact:()=>testBVHShape(x.mesh,x.originalGeometry,'introduce')});
 assert.notEqual(r.status,'BODY_MEASURED_SOURCE_GEOMETRY_REJECTED',r.reason);
 assert.equal(r.bestProvisionalStructuralAB,null);
 for(const v of r.candidateRegimes)
  if(v.realOriginalTriangleCrossingComparisons.length)
   assert.ok(v.refusedReasons.includes('new-body-skirt-original-triangle-crossing-IDs'));
 assert.equal(r.originalSkirtSourceBuffersUntouched,true);
 assert.equal(r.photoSkirtConsumer3DAdmitted,false);
});
test('original anatomical cross-sections must be genuine bounded typed vertex data',()=>{
 const x=createSyntheticBodyAndSkirt();
 for(const wrong of [new Float32Array(9),new Float32Array(300).fill(NaN),
   new Float32Array(300).fill(0)]){
  const r=trial(x,{sampleBodySkinnedWorld:()=>wrong});
  assert.equal(r.status,'BODY_MEASURED_SOURCE_GEOMETRY_REJECTED');
  assert.equal(r.source2DFallbackRequired,true);
  assert.equal(r.releaseAuthorized,false);
  assert.equal(x.mesh.geometry,x.originalGeometry);
 }
});
test('three posed body witnesses and original source rig are required, no invented owner approvals',()=>{
 const x=createSyntheticBodyAndSkirt();
 for(const args of [
  {root:{isObject3D:false}},
  {avatar:'owner'},
  {sampleContact:()=>({count:0,pairs:new Set(['forged']),maxDepth:0})},
  {sampleBodySkinnedWorld:()=>undefined},
  {applyPose:undefined}
 ]){
  const r=trial(x,args);
  assert.equal(r.status,'BODY_MEASURED_SOURCE_GEOMETRY_REJECTED');
  assert.equal(r.releaseAuthorized,false);
  assert.equal(r.photoSkirtConsumer3DAdmitted,false);
 }
});


test('forged or incomplete original 163-bone core-part face mask cannot grant a skirt fit',()=>{
 const x=createSyntheticBodyAndSkirt();
 const baseIndices=new Uint16Array([0,1,2,2,3,4,4,5,6]);
 const cases=[
  {positions:x.sourceBodyPositions,indices:baseIndices,coreFaceMask:new Uint8Array(2)},
  {positions:x.sourceBodyPositions,indices:baseIndices,coreFaceMask:new Uint8Array(3).fill(1)},
  {positions:x.sourceBodyPositions,indices:baseIndices,coreFaceMask:new Uint8Array(3).fill(0)},
  {positions:x.sourceBodyPositions,indices:baseIndices,coreFaceMask:Uint8Array.from([1,2,0])},
  {positions:x.sourceBodyPositions,indices:baseIndices,coreFaceMask:new Float32Array(3)}
 ];
 for(const datum of cases){
  const r=trial(x,{sampleBodySkinnedWorld:()=>datum});
  assert.equal(r.status,'BODY_MEASURED_SOURCE_GEOMETRY_REJECTED');
  assert.equal(r.photoSkirtConsumer3DAdmitted,false);
  assert.equal(r.originalSourceGeometryRetained,true);
  assert.equal(x.mesh.geometry,x.originalGeometry);
  assert.deepEqual(x.mesh.geometry.getAttribute('uv').array,x.sourceUVBytes);
 }
});
