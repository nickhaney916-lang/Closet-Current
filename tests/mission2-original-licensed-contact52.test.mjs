import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {auditActualPhotographedDressSurfaces52}
 from '../research/mission2-source-length/actual-photo-contact-52.mjs';
const sha='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
function fixture52(coords,indices=null){
 const root=new THREE.Group();
 const bones=Array.from({length:163},()=>new THREE.Bone());
 const bodyBones=Array.from({length:163},()=>new THREE.Bone());
 root.add(...bones,...bodyBones);
 const skinned=(points,idx,bs,garment)=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  if(idx)g.setIndex(idx);
  const count=g.getAttribute('position').count;
  const ids=new Uint16Array(count*4),weights=new Float32Array(count*4);
  for(let i=0;i<count;i++)weights[4*i]=1;
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
  g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
  m.bind(new THREE.Skeleton(bs));m.userData.work56Garment=garment;
  root.add(m);return m;
 };
 const mesh=skinned(coords,indices,bones,true);
 const g=mesh.geometry;
 g.setAttribute('dressRest',g.getAttribute('position').clone());
 g.setAttribute('dressCustomPhotoProjection',
  g.getAttribute('position').clone());
 const body=skinned([
  -2,-2,-2,2,-2,-2,0,2,-2
 ],null,bodyBones,false);
 const dress={mesh,stats:{
  sourceId:'commons-0053',sourceSHA256:sha,photographedDressDrape61:true,
  originalRestPhotoCoordinatesUnchanged61:true,
  skinIndicesAndWeightsPreserved61:true,
  sourceTextureAndMaterialPreserved61:true,
  releaseAuthorized:false,collisionValidated:false
 }};
 return {root,dress,body,bones};
}
const original=f=>Object.fromEntries(
 Object.entries(f.dress.mesh.geometry.attributes).map(
 ([k,a])=>[k,a.array.slice()]));
const cross=[
 -.15,-.10,0,.15,-.10,0,0,.15,0,
 0,-.07,-.10,0,-.07,.10,0,.10,0
];
test('C52: source-authentic strict transverse crossing is recognized on actual 163-bone skinned triangle vertices',()=>{
 const f=fixture52(cross),before=original(f);
 const r=auditActualPhotographedDressSurfaces52({root:f.root,dress:f.dress});
 assert.equal(r.schema,'M2-real-original-photo-surface-diagnostic-C52');
 assert.equal(r.actuallySkinned163Bones,true);
 assert.equal(r.anatomicalBodyMeshes,1);
 assert.equal(r.originalSourceFaces,2);
 assert.equal(r.sourceAndPosedFullPairSweepCompleted,true);
 assert.ok(r.originalSourceStrictCrossings>=1);
 assert.ok(r.posedStrictCrossings>=1);
 assert.equal(r.anyStrictPosedCrossing,true);
 assert.equal(r.originalSourcePhotoUVRestSkinAndIndicesUntouched,true);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
 assert.equal(JSON.stringify(r).includes('sourceCoordinates'),false);
});
test('C52: parallel within 8 microns is only an uncertain AABB pair, never penetrative proof',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .15,.15,.000008,.7,.15,.000008,.15,.7,.000008
 ]),before=original(f);
 const r=auditActualPhotographedDressSurfaces52({root:f.root,dress:f.dress});
 assert.equal(r.sourceAndPosedFullPairSweepCompleted,true);
 assert.equal(r.posedStrictCrossings,0);
 assert.ok(r.posedUncertainBoxPairs>=1);
 assert.equal(r.nonCrossingNotProofOfClearance,true);
 assert.equal(r.anyContactMustRemainBlocked,true);
 assert.deepEqual(original(f),before);
});
test('C52: real weighted-bone motion induces crossing from originally separated source',()=>{
 const f=fixture52([
  -.15,-.10,0,.15,-.10,0,0,.15,0,
  0,-.07,.30,0,-.07,.50,0,.10,.40
 ]);
 for(let i=3;i<6;i++)f.dress.mesh.geometry.getAttribute('skinIndex').setX(i,1);
 f.bones[1].position.z=-.4;
 const orig=original(f),r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress
 });
 assert.equal(r.originalSourceStrictCrossings,0);
 assert.ok(r.posedStrictCrossings>=1);
 assert.deepEqual(original(f),orig);
});
test('C52: adjacent indexed cloth and original photographed source attributes remain untouched',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,1,1,0
 ],[0,1,2,1,3,2]),before=original(f);
 const r=auditActualPhotographedDressSurfaces52({root:f.root,dress:f.dress});
 assert.equal(r.originalSourceFaces,2);
 assert.equal(r.originalSourceBoxPairs,0);
 assert.equal(r.posedStrictCrossings,0);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});
test('C52: insufficient source pair budget is explicit incomplete evidence, never a clearance',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .15,.15,.000008,.7,.15,.000008,.15,.7,.000008,
  .20,.20,.000011,.8,.20,.000011,.20,.8,.000011
 ]);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,maxComparisons:1
 });
 assert.equal(r.sourceAndPosedFullPairSweepCompleted,false);
 assert.equal(r.sourceSweepExhausted,true);
 assert.equal(r.posedSweepExhausted,true);
 assert.equal(r.releaseAuthorized,false);
});
test('C52: forged licensed identity, source editing, fake bone roster and bad budgets are refused',()=>{
 const f=fixture52(cross),before=original(f);
 for(const opts of [{maxSourceFaces:1},{maxComparisons:0},
  {maxCandidatePairs:0},{toleranceMeters:-1},{maxStrictCrossings:0}]){
  assert.throws(()=>auditActualPhotographedDressSurfaces52({
   root:f.root,dress:f.dress,...opts
  }),/C52 original-photo diagnostic/);
 }
 f.dress.stats.sourceSHA256='other';
 assert.throws(()=>auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress
 }),/real original licensed SHA-pinned/);
 f.dress.stats.sourceSHA256=sha;
 f.dress.mesh.geometry.deleteAttribute('dressRest');
 assert.throws(()=>auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress
 }),/original full photo dress/);
 assert.deepEqual(original(f).position,before.position);
});

test('C53: real skinned transverse source crossing is zero-distance unresolved, NOT physical repair approval',()=>{
 const f=fixture52(cross),source=original(f);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,refineTriangleDistances53:true
 });
 assert.equal(r.sourceAndPosedDistanceRefinementCompleted53,true);
 assert.equal(r.refinedOriginalDistance53.triangleCandidatePairsMeasured,1);
 assert.equal(r.refinedOriginalDistance53.geometricZeroOrOverlapUnresolved,1);
 assert.equal(r.refinedPosedDistance53.geometricZeroOrOverlapUnresolved,1);
 assert.equal(r.refinedPosedDistance53.positiveGapBeyondToleranceAtThisPose,0);
 assert.equal(r.duplicateSourceSewingPermission53,false);
 assert.equal(r.noRealFabricPhysicsCertified53,true);
 assert.deepEqual(original(f),source);
});
test('C53: genuine near-parallel 8 micron separation is within tolerance but not claimed as penetration',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .15,.15,.000008,.7,.15,.000008,.15,.7,.000008
 ]),source=original(f);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,refineTriangleDistances53:true
 });
 assert.equal(r.refinedPosedDistance53.triangleCandidatePairsMeasured,1);
 assert.equal(r.refinedPosedDistance53.geometricZeroOrOverlapUnresolved,0);
 assert.equal(r.refinedPosedDistance53.positiveGapWithinToleranceUnresolved,1);
 assert.equal(r.refinedPosedDistance53.zeroGapNotCertifiedAsPenetration,true);
 assert.deepEqual(original(f),source);
});
test('C53: overlapping 3D bounding boxes can be definitively >tolerance apart as triangles',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .8,.8,0,1.5,.8,0,.8,1.5,0
 ]),source=original(f);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,refineTriangleDistances53:true
 });
 assert.equal(r.posedBoxPairs,1);
 assert.equal(r.posedStrictCrossings,0);
 assert.equal(r.refinedPosedDistance53.triangleCandidatePairsMeasured,1);
 assert.equal(r.refinedPosedDistance53.positiveGapBeyondToleranceAtThisPose,1);
 assert.equal(r.refinedPosedDistance53.positiveGapNotContinuousClothClearance,true);
 assert.equal(r.anyContactMustRemainBlocked,true);
 assert.deepEqual(original(f),source);
});
test('C53: coplanar original photo fabric faces nested in each other remain geometric zero, not fabricated source seam',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .1,.1,0,.6,.1,0,.1,.6,0
 ]);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,refineTriangleDistances53:true
 });
 assert.equal(r.posedStrictCrossings,0);
 assert.equal(r.refinedPosedDistance53.geometricZeroOrOverlapUnresolved,1);
 assert.equal(r.refinedPosedDistance53.positiveGapBeyondToleranceAtThisPose,0);
 assert.equal(r.duplicateSourceSewingPermission53,false);
 assert.equal(r.releaseAuthorized,false);
});
test('C53: a real 163-bone moved garment face produces posed zero distance even with source separated',()=>{
 const f=fixture52([
  -.15,-.10,0,.15,-.10,0,0,.15,0,
  0,-.07,.30,0,-.07,.50,0,.10,.40
 ]);
 for(let i=3;i<6;i++)f.dress.mesh.geometry.getAttribute('skinIndex').setX(i,1);
 f.bones[1].position.z=-.4;
 const originalState=original(f);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,refineTriangleDistances53:true
 });
 assert.equal(r.originalSourceBoxPairs,0);
 assert.equal(r.refinedPosedDistance53.geometricZeroOrOverlapUnresolved,1);
 assert.equal(r.refinedPosedDistance53.distanceRefinementComplete,true);
 assert.deepEqual(original(f),originalState);
});
test('C53: bounded original-photo triangle-distance workload fails closed, never counts unaudited AABB as safe',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .1,.1,0,.6,.1,0,.1,.6,0,
  .2,.2,0,.7,.2,0,.2,.7,0
 ]);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,refineTriangleDistances53:true,
  maxDistanceCandidates53:1
 });
 assert.equal(r.sourceAndPosedDistanceRefinementCompleted53,false);
 assert.equal(r.sourceAndPosedFullPairSweepCompleted,false);
 assert.equal(r.refinedOriginalDistance53.triangleCandidatePairsMeasured,1);
 assert.equal(r.refinedPosedDistance53.triangleCandidatePairsMeasured,1);
 assert.equal(r.refinedOriginalDistance53.distanceRefinementComplete,false);
 assert.equal(r.releaseAuthorized,false);
});
test('C53: original SHA, all source rest/skin/UV fields and duplicate source index boundaries remain untouched',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,1,1,0
 ],[0,1,2,1,3,2]),before=original(f);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,refineTriangleDistances53:true
 });
 assert.equal(r.posedBoxPairs,0);
 assert.equal(r.refinedPosedDistance53.triangleCandidatePairsMeasured,0);
 assert.equal(r.allCapturedPhotoAttributesUnchanged53,true);
 assert.equal(r.refinedPosedDistance53.exactSourceFaceIndicesExposed,false);
 assert.deepEqual(original(f),before);
 for(const invalid of [{maxDistanceCandidates53:0},
  {maxDistanceCandidates53:1000001},{refineTriangleDistances53:'yes'}])
  assert.throws(()=>auditActualPhotographedDressSurfaces52({
   root:f.root,dress:f.dress,...invalid
  }),/M2 C52 original-photo diagnostic/);
});

const audit54=f=>auditActualPhotographedDressSurfaces52({
 root:f.root,dress:f.dress,
 refineTriangleDistances53:true,refineSourceTopology54:true
});
test('C54: indexed-disconnected duplicate UV boundary has TWO same-source vertices, not an approved sewn seam',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]),snapshot=original(f),r=audit54(f);
 const w=r.posedSourceTopology54;
 assert.equal(w.schema,'M2-original-source-zero-contact-topology-C54');
 assert.equal(w.zeroDistancePairsClassified,1);
 assert.equal(w.sourceCoincidentEdgeCandidates,1);
 assert.equal(w.sourceCoincidentFaceCandidates,0);
 assert.equal(w.sourceIndependentZeroDistancePairs,0);
 assert.equal(w.classificationComplete,true);
 assert.equal(w.sourceCoincidenceNotAHumanVerifiedSewingSeam,true);
 assert.equal(w.sourceCoordinateDuplicateNotPermissionToWeld,true);
 assert.equal(r.actualPhysicalSewingSeamsCertified54,false);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(original(f),snapshot);
});
test('C54: exact duplicated original source triangle is a full-face candidate, never automatic source cleanup',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,0,1,0,1,0,0
 ]),r=audit54(f);
 assert.equal(r.originalSourceTopology54.zeroDistancePairsClassified,1);
 assert.equal(r.originalSourceTopology54.sourceCoincidentFaceCandidates,1);
 assert.equal(r.posedSourceTopology54.sourceCoincidentFaceCandidates,1);
 assert.equal(r.originalPhotoAndSkinnedSkinBindingPreserved54,true);
 assert.equal(r.allZeroSourcePairsRemainContactUnresolved54,true);
 assert.equal(r.releaseAuthorized,false);
});
test('C54: a touching original source point is a junction candidate, NOT proven sewn UV edge',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,-1,0,0,0,-1,0
 ]),r=audit54(f);
 const w=r.posedSourceTopology54;
 assert.equal(w.zeroDistancePairsClassified,1);
 assert.equal(w.sourceCoincidentSinglePointCandidates,1);
 assert.equal(w.sourceCoincidentEdgeCandidates,0);
 assert.equal(w.sourceIndependentZeroDistancePairs,0);
 assert.equal(w.sourceCoincidenceNotAHumanVerifiedSewingSeam,true);
});
test('C54: actual source-authentic crossing with NO original coincident vertices remains independent geometry',()=>{
 const f=fixture52(cross),r=audit54(f);
 assert.equal(r.originalSourceStrictCrossings,1);
 assert.equal(r.posedSourceTopology54.zeroDistancePairsClassified,1);
 assert.equal(r.posedSourceTopology54.sourceIndependentZeroDistancePairs,1);
 assert.equal(r.posedSourceTopology54.sourceCoincidentEdgeCandidates,0);
 assert.equal(r.allZeroSourcePairsRemainContactUnresolved54,true);
});
test('C54: copied source UV endpoints with INCOMPATIBLE original bone identities remain unsafe to reunite',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]);
 f.dress.mesh.geometry.getAttribute('skinIndex').setX(3,1);
 const old=original(f),r=audit54(f);
 assert.equal(r.originalSourceTopology54.zeroDistancePairsClassified,1);
 assert.equal(r.originalSourceTopology54.sourceCoincidentButUnsafeSkinRestOrPose,1);
 assert.equal(r.posedSourceTopology54.sourceCoincidentButUnsafeSkinRestOrPose,1);
 assert.equal(r.posedSourceTopology54.sourceCoincidentEdgeCandidates,0);
 assert.equal(r.posedSourceTopology54.sourceCoordinateDuplicateNotPermissionToWeld,true);
 assert.deepEqual(original(f),old);
});
test('C54: original shader rest texture source coordinates must agree before any UV boundary is even considered',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]);
 f.dress.mesh.geometry.getAttribute('dressRest').setX(3,1.02);
 const originalState=original(f),r=audit54(f);
 assert.equal(r.posedSourceTopology54.sourceCoincidentButUnsafeSkinRestOrPose,1);
 assert.equal(r.posedSourceTopology54.sourceCoincidentEdgeCandidates,0);
 assert.deepEqual(original(f),originalState);
});
test('C54: original index-connected adjacent garment faces stay outside disconnected zero-contact classification',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,1,1,0
 ],[0,1,2,1,3,2]),r=audit54(f);
 assert.equal(r.posedSourceTopology54.zeroDistancePairsClassified,0);
 assert.ok(r.posedSourceTopology54.sourceIndexSharedPairsExcludedBeforeDistance>=1);
 assert.equal(r.posedSourceTopology54.sourceIndependentZeroDistancePairs,0);
 assert.equal(r.fullOriginalSourceTopologyAuditCompleted54,true);
});
test('C54: 8-micron separated unconnected cloth is not mislabeled as a UV seam or zero-contact',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .15,.15,.000008,.7,.15,.000008,.15,.7,.000008
 ]),r=audit54(f);
 assert.equal(r.refinedPosedDistance53.positiveGapWithinToleranceUnresolved,1);
 assert.equal(r.posedSourceTopology54.zeroDistancePairsClassified,0);
 assert.equal(r.posedSourceTopology54.sourceCoincidentFaceCandidates,0);
 assert.equal(r.posedSourceTopology54.sourceIndependentZeroDistancePairs,0);
});
test('C54: bounded topology-classification budget cannot falsely declare full 3D source audit complete',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  .1,.1,0,.6,.1,0,.1,.6,0,
  .2,.2,0,.7,.2,0,.2,.7,0
 ]);
 const r=auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,
  refineTriangleDistances53:true,refineSourceTopology54:true,
  maxZeroDistanceTopologyPairs54:1
 });
 assert.equal(r.fullOriginalSourceTopologyAuditCompleted54,false);
 assert.equal(r.posedSourceTopology54.classificationComplete,false);
 assert.equal(r.sourceAndPosedDistanceRefinementCompleted53,false);
 assert.equal(r.releaseAuthorized,false);
});
test('C54: forged original-source topology configuration is rejected without changing photo source',()=>{
 const f=fixture52(cross),before=original(f);
 for(const invalid of [
  {refineSourceTopology54:true},
  {refineTriangleDistances53:true,refineSourceTopology54:'true'},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   maxZeroDistanceTopologyPairs54:0},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   maxZeroDistanceTopologyPairs54:999999}
 ]){
  assert.throws(()=>auditActualPhotographedDressSurfaces52({
   root:f.root,dress:f.dress,...invalid
  }),/C52 original-photo diagnostic/);
 }
 assert.deepEqual(original(f),before);
});
