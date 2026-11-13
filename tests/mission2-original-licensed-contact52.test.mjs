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

const audit55=(f,opts={})=>auditActualPhotographedDressSurfaces52({
 root:f.root,dress:f.dress,
 refineTriangleDistances53:true,refineSourceTopology54:true,
 refineEdgeWinding55:true,...opts
});
test('C55: actual SOURCE UV-split opposite-winding two-face edge yields an audit CANDIDATE, not welded cloth',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]),before=original(f),report=audit55(f);
 const a=report.originalSourceEdgeWinding55,
  b=report.posedSourceEdgeWinding55;
 assert.equal(report.fullOriginalSourceEdgeWindingAuditCompleted55,true);
 assert.equal(a.sourceEdgePairsClassified,1);
 assert.equal(a.sourceTwoFaceOppositeWindingCandidates,1);
 assert.equal(a.sourceTwoFaceSameWindingCandidates,0);
 assert.equal(a.originalTwoIncidentEdgeGroups,1);
 assert.equal(a.originalBoundarySingleIncidentEdgeGroups,4);
 assert.equal(a.originalNonmanifoldThreePlusIncidentEdgeGroups,0);
 assert.deepEqual(b,a);
 assert.equal(a.sourceEdgeWindingOnlyCandidateNotSewnSeam,true);
 assert.equal(a.oppositeWindingCannotAuthorizeWelding,true);
 assert.equal(report.trueSourceSeamSewingEvidenceMissing55,true);
 assert.equal(report.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});
test('C55: same-winding source-coincident edge is NOT silently accepted as a seam',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,1,0,0,1,-1,0
 ]),report=audit55(f);
 const w=report.posedSourceEdgeWinding55;
 assert.equal(w.sourceEdgePairsClassified,1);
 assert.equal(w.sourceTwoFaceSameWindingCandidates,1);
 assert.equal(w.sourceTwoFaceOppositeWindingCandidates,0);
 assert.equal(w.originalTwoIncidentEdgeGroups,1);
 assert.equal(w.releaseAuthorized,false);
});
test('C55: 3 original disconnected faces incident on same source edge are NON-MANIFOLD, no repair',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0,
  0,0,0,1,0,0,0,0,1
 ]),originalState=original(f),r=audit55(f);
 const a=r.posedSourceEdgeWinding55;
 assert.equal(a.sourceEdgePairsClassified,3);
 assert.equal(a.sourceThreePlusIncidentFaceNonmanifoldCandidates,3);
 assert.ok(a.originalNonmanifoldThreePlusIncidentEdgeGroups>=1);
 assert.equal(a.sourceTwoFaceOppositeWindingCandidates,0);
 assert.equal(a.sourceTwoFaceSameWindingCandidates,0);
 assert.equal(r.noEdgeWindingCollisionExemption55,true);
 assert.deepEqual(original(f),originalState);
});
test('C55: source INDEX-connected actual two-face mesh is counted in global edge incidence but not double-audited',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,1,1,0
 ],[0,1,2,1,3,2]),before=original(f),r=audit55(f);
 const w=r.posedSourceEdgeWinding55;
 assert.equal(w.sourceEdgePairsClassified,0);
 assert.equal(w.originalTwoIncidentEdgeGroups,1);
 assert.equal(w.originalBoundarySingleIncidentEdgeGroups,4);
 assert.ok(r.posedSourceTopology54.sourceIndexSharedPairsExcludedBeforeDistance>=1);
 assert.deepEqual(original(f),before);
});
test('C55: matching source SINGLE POINT cannot be fabricated into an original source edge seam',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,-1,0,0,0,-1,0
 ]),r=audit55(f);
 assert.equal(r.posedSourceTopology54.sourceCoincidentSinglePointCandidates,1);
 assert.equal(r.posedSourceEdgeWinding55.sourceEdgePairsClassified,0);
 assert.equal(r.trueSourceSeamSewingEvidenceMissing55,true);
});
test('C55: full duplicated triangle must never be counted as an accepted opposite-winding edge',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,0,1,0,1,0,0
 ]),r=audit55(f);
 assert.equal(r.posedSourceTopology54.sourceCoincidentFaceCandidates,1);
 assert.equal(r.posedSourceEdgeWinding55.sourceEdgePairsClassified,0);
 assert.ok(r.posedSourceEdgeWinding55.originalTwoIncidentEdgeGroups>=3);
 assert.equal(r.releaseAuthorized,false);
});
test('C55: original 163-bone skin mismatch on same source edge remains UNSAFE before edge winding classification',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]);
 f.dress.mesh.geometry.getAttribute('skinIndex').setX(3,1);
 const state=original(f),r=audit55(f);
 assert.equal(r.posedSourceTopology54.sourceCoincidentButUnsafeSkinRestOrPose,1);
 assert.equal(r.posedSourceEdgeWinding55.sourceEdgePairsClassified,0);
 assert.ok(r.posedSourceEdgeWinding55.originalAmbiguousOrSkinMismatchedGroups>=1);
 assert.equal(r.noEdgeWindingCollisionExemption55,true);
 assert.deepEqual(original(f),state);
});
test('C55: genuine 163-bone different pose makes mismatched UV endpoints unsafe rather than sewing them together',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]);
 for(let i=3;i<6;i++)f.dress.mesh.geometry.getAttribute('skinIndex').setX(i,1);
 f.bones[1].position.x=.02;
 const before=original(f),r=audit55(f);
 assert.equal(r.posedSourceTopology54.sourceCoincidentButUnsafeSkinRestOrPose,1);
 assert.equal(r.posedSourceEdgeWinding55.sourceEdgePairsClassified,0);
 assert.equal(r.posedSourceEdgeWinding55.sourceManifoldEstimateNotPhysicalFabricCertificate,true);
 assert.deepEqual(original(f),before);
});
test('C55: incomplete source-edge budget NEVER certifies original photographed garment edge topology',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0,
  0,0,0,1,0,0,0,0,1
 ]),r=audit55(f,{maxEdgePairs55:1});
 assert.equal(r.fullOriginalSourceEdgeWindingAuditCompleted55,false);
 assert.equal(r.posedSourceEdgeWinding55.sourceEdgeAuditComplete,false);
 assert.equal(r.posedSourceEdgeWinding55.sourceEdgePairsClassified,1);
 assert.equal(r.releaseAuthorized,false);
});
test('C55: source-owned real original photograph parser rejects unverified or incomplete edge research flags',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]),state=original(f);
 for(const invalid of [
  {refineEdgeWinding55:true},
  {refineTriangleDistances53:true,refineEdgeWinding55:true},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:'enabled'},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,maxEdgePairs55:0},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,maxEdgePairs55:200001}
 ])assert.throws(()=>auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,...invalid
 }),/M2 C52 original-photo diagnostic/);
 assert.deepEqual(original(f),state);
});

const audit56=(f,more={})=>auditActualPhotographedDressSurfaces52({
 root:f.root,dress:f.dress,
 refineTriangleDistances53:true,refineSourceTopology54:true,
 refineEdgeWinding55:true,refineBoundaryComponents56:true,
 ...more
});
test('C56: original licensed-source one triangle makes one closed oriented boundary, never a hem label',()=>{
 const f=fixture52([0,0,0,1,0,0,0,1,0]),before=original(f),
  r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(r.originalAndSkinned163BoneBoundaryAuditComplete56,true);
 assert.equal(b.schema,'M2-original-photograph-boundary-components-C56');
 assert.equal(b.totalOriginalSingleIncidentEdgeGroups,3);
 assert.equal(b.boundariesActuallyVisited,3);
 assert.equal(b.boundaryVertexGroups,3);
 assert.equal(b.boundaryVerticesDegreeTwo,3);
 assert.equal(b.closedDirectedLoopComponents,1);
 assert.equal(b.edgesInClosedDirectedLoops,3);
 assert.equal(b.connectedBoundaryComponents,1);
 assert.equal(b.openDirectedChainComponents,0);
 assert.equal(b.windingConflictComponents,0);
 assert.equal(b.branchedOrNonmanifoldComponents,0);
 assert.equal(b.unsafeSourceSkinOrPoseComponents,0);
 assert.equal(b.actualSkinnedPoseEdgesWithOverTenPercentLengthChange,0);
 assert.equal(b.sourceBoundaryNotAnAnatomicallyApprovedHemOrOpening,true);
 assert.equal(b.closedGeometricLoopNotProofOfSeamQuality,true);
 assert.equal(b.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});
test('C56: two physically separate original source cloth triangles remain TWO boundary loops',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  3,0,0,4,0,0,3,1,0
 ]),r=audit56(f);
 const b=r.originalSourceBoundaryComponents56;
 assert.equal(b.boundaryComponentAuditComplete,true);
 assert.equal(b.connectedBoundaryComponents,2);
 assert.equal(b.closedDirectedLoopComponents,2);
 assert.equal(b.totalOriginalSingleIncidentEdgeGroups,6);
 assert.equal(b.edgesInClosedDirectedLoops,6);
 assert.equal(b.boundaryVerticesDegreeTwo,6);
});
test('C56: UV split with source-welded opposite-edge group makes one connected 4-edge loop without modifying garment',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]),before=original(f),r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(r.posedSourceEdgeWinding55.sourceTwoFaceOppositeWindingCandidates,1);
 assert.equal(b.totalOriginalSingleIncidentEdgeGroups,4);
 assert.equal(b.boundaryVertexGroups,4);
 assert.equal(b.closedDirectedLoopComponents,1);
 assert.equal(b.edgesInClosedDirectedLoops,4);
 assert.equal(b.unsafeSourceSkinOrPoseComponents,0);
 assert.equal(r.noAutomaticSourceBoundaryRepairPermitted56,true);
 assert.deepEqual(original(f),before);
});
test('C56: two originally same-direction incident faces have an unoriented boundary, NOT a safe loop',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,1,0,0,1,-1,0
 ]),r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(r.posedSourceEdgeWinding55.sourceTwoFaceSameWindingCandidates,1);
 assert.equal(b.connectedBoundaryComponents,1);
 assert.equal(b.closedDirectedLoopComponents,0);
 assert.equal(b.windingConflictComponents,1);
 assert.equal(b.edgesInWindingConflictComponents,4);
 assert.equal(b.releaseAuthorized,false);
});
test('C56: three triangles on one original source edge induce branched non-manifold boundary components',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0,
  0,0,0,1,0,0,0,0,1
 ]),r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.ok(r.posedSourceEdgeWinding55.originalNonmanifoldThreePlusIncidentEdgeGroups>=1);
 assert.equal(b.boundaryVerticesDegreeThreePlus,2);
 assert.equal(b.branchedOrNonmanifoldComponents,1);
 assert.equal(b.edgesInBranchedOrNonmanifoldComponents,6);
 assert.equal(b.closedDirectedLoopComponents,0);
 assert.equal(b.releaseAuthorized,false);
});
test('C56: coordinate-only single point connection creates a branched junction, not two approved hems',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,-1,0,0,0,-1,0
 ]),r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(r.posedSourceTopology54.sourceCoincidentSinglePointCandidates,1);
 assert.equal(b.boundaryVerticesDegreeThreePlus,1);
 assert.equal(b.connectedBoundaryComponents,1);
 assert.equal(b.branchedOrNonmanifoldComponents,1);
 assert.equal(b.edgesInBranchedOrNonmanifoldComponents,6);
 assert.equal(b.closedDirectedLoopComponents,0);
});
test('C56: real original dressRest/skin mismatch marks a coincident UV-boundary COMPONENT unsafe',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,-1,0
 ]);
 f.dress.mesh.geometry.getAttribute('skinIndex').setX(3,1);
 const before=original(f),r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(b.boundaryComponentAuditComplete,true);
 assert.equal(b.unsafeSourceSkinOrPoseComponents,1);
 assert.equal(b.edgesInUnsafeSourceSkinOrPoseComponents,4);
 assert.equal(b.closedDirectedLoopComponents,0);
 assert.equal(b.openDirectedChainComponents,0);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});
test('C56: source-verified real moving 163-bone dress boundary stays oriented but reports pose edge stretch',()=>{
 const f=fixture52([0,0,0,1,0,0,0,1,0]);
 f.dress.mesh.geometry.getAttribute('skinIndex').setX(1,1);
 // A 0.35m displacement changes a 1m edge length only ~6%;
 // use an actual >10% skinned edge-length displacement.
 f.bones[1].position.z=.7;
 const before=original(f),r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(b.boundaryComponentAuditComplete,true);
 assert.equal(b.closedDirectedLoopComponents,1);
 assert.ok(b.actualSkinnedPoseEdgesWithOverTenPercentLengthChange>=1);
 assert.equal(b.bodyClearanceAndContinuousMotionNotCertified,true);
 assert.equal(b.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});
test('C56: full duplicate original-source faces can have zero boundary edges, but never an approved cloth repair',()=>{
 const f=fixture52([
  0,0,0,1,0,0,0,1,0,
  0,0,0,0,1,0,1,0,0
 ]),r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(b.totalOriginalSingleIncidentEdgeGroups,0);
 assert.equal(b.connectedBoundaryComponents,0);
 assert.equal(b.boundariesActuallyVisited,0);
 assert.equal(b.boundaryComponentAuditComplete,true);
 assert.equal(r.allOpenSourceBoundaryCandidatesRemainUnverified56,true);
 assert.equal(r.releaseAuthorized,false);
});
test('C56: boundary analysis budget exhaustion blocks source topology claims without altering original JPEG coordinates',()=>{
 const f=fixture52([0,0,0,1,0,0,0,1,0]),before=original(f);
 for(const limit of [
  {maxBoundaryEdges56:2},{maxBoundaryVertexGroups56:2}
 ]){
  const r=audit56(f,limit),b=r.originalSourceBoundaryComponents56;
  assert.equal(b.totalOriginalSingleIncidentEdgeGroups,3);
  assert.equal(b.boundaryComponentAuditComplete,false);
  assert.equal(b.budgetExhausted,true);
  assert.equal(r.originalAndSkinned163BoneBoundaryAuditComplete56,false);
  assert.equal(b.releaseAuthorized,false);
 }
 assert.deepEqual(original(f),before);
});
test('C56: signed photograph source requires C55, C54, C53 prerequisites and safe bounded options',()=>{
 const f=fixture52([0,0,0,1,0,0,0,1,0]),before=original(f);
 for(const invalid of [
  {refineBoundaryComponents56:true},
  {refineTriangleDistances53:true,refineBoundaryComponents56:true},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineBoundaryComponents56:true},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,refineBoundaryComponents56:'yes'},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,refineBoundaryComponents56:true,
   maxBoundaryEdges56:0},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,refineBoundaryComponents56:true,
   maxBoundaryVertexGroups56:200001}
 ])assert.throws(()=>auditActualPhotographedDressSurfaces52({
  root:f.root,dress:f.dress,...invalid
 }),/M2 C52 original-photo diagnostic/);
 assert.deepEqual(original(f),before);
});

test('C56: actual avatar world scale and root rotation MUST NOT be fabricated into clothing fabric-edge stretch',()=>{
 const f=fixture52([0,0,0,1,0,0,0,1,0]),before=original(f);
 f.root.scale.set(1.7,1.4,.8);
 f.root.rotation.z=.31;
 const r=audit56(f),b=r.originalSourceBoundaryComponents56;
 assert.equal(b.boundaryComponentAuditComplete,true);
 assert.equal(b.closedDirectedLoopComponents,1);
 assert.equal(b.actualSkinnedPoseEdgesWithOverTenPercentLengthChange,0,
  'original source edge lengths must use the same mesh world frame as posed skinned world lengths');
 assert.equal(b.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});

function annotatedBones57(f){
 for(const [i,name,pos] of [
  [5,'neck01',[0,1.1,0]],
  [6,'spine04',[0,0,0]],
  [7,'upperarm01L',[-.8,.5,0]],
  [8,'upperarm01R',[.8,.5,0]]
 ]){f.bones[i].name=name;f.bones[i].position.set(...pos);}
 return f;
}
const fourLoops57=[
 0,-1.1,0,.6,-1.1,0,0,-.6,0,
 0,.9,0,.3,.9,0,0,1.2,0,
 -.95,.2,0,-.6,.2,0,-.95,.55,0,
 .95,.2,0,1.3,.2,0,.95,.55,0
];
const audit57=(f,more={})=>auditActualPhotographedDressSurfaces52({
 root:f.root,dress:f.dress,
 refineTriangleDistances53:true,refineSourceTopology54:true,
 refineEdgeWinding55:true,refineBoundaryComponents56:true,
 refineAnatomicalLoopLandmarks57:true,...more
});
test('C57: four genuinely distinct source-boundary loops rank relative to P61 actual 163-bone neck/arms/spine, no human labels',()=>{
 const f=annotatedBones57(fixture52(fourLoops57)),before=original(f),
  r=audit57(f),a=r.originalAnatomicalLoopCandidates57;
 assert.equal(a.schema,'M2-original-photograph-anatomical-loop-landmarks-C57');
 assert.equal(r.sourceAnatomicalLoopEvidenceComplete57,true);
 assert.equal(a.trueOriginalBoundaryLoopCount,4);
 assert.equal(a.sourceOpenBoundaryEdges,12);
 assert.equal(a.sourceLoopComponentVerticesChecked,12);
 assert.equal(a.landmarkBoneNamesFound,4);
 assert.equal(a.anatomicalCandidateMappingPossible,true);
 assert.equal(a.candidateLowestGeometricOpening,1);
 assert.equal(a.candidateNeckProximityOpening,1);
 assert.equal(a.candidateLeftUpperArmProximityOpening,1);
 assert.equal(a.candidateRightUpperArmProximityOpening,1);
 assert.equal(a.twoDistinct163BonePoseSamplesCompleted,2);
 assert.equal(a.boneSamplesWithActualBoundaryDisplacement,0);
 assert.equal(a.poseRestorationVerified,true);
 assert.equal(a.noHumanPhotoOpeningsAnnotated,true);
 assert.equal(a.noSemanticCollarSleeveHemCertification,true);
 assert.equal(a.noPoseCollisionOrContinuousPhysicsCertificate,true);
 assert.equal(a.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});
test('C57: articulated real left/right bone rotations physically move source-skinned garment boundary samples and restore bones',()=>{
 const f=annotatedBones57(fixture52(fourLoops57));
 for(let i=6;i<9;i++)f.dress.mesh.geometry.getAttribute('skinIndex').setX(i,7);
 for(let i=9;i<12;i++)f.dress.mesh.geometry.getAttribute('skinIndex').setX(i,8);
 const q=[f.bones[7].quaternion.clone(),f.bones[8].quaternion.clone()],
  before=original(f),r=audit57(f),a=r.originalAnatomicalLoopCandidates57;
 assert.equal(a.twoDistinct163BonePoseSamplesCompleted,2);
 assert.equal(a.boneSamplesWithActualBoundaryDisplacement,2);
 assert.ok(a.sampledLoopBoundaryVerticesChanged>=2);
 assert.ok(a.sampledBoundaryLoopsMoved>=2);
 assert.equal(a.posedOriginalLoopConnectivityRetained,true);
 assert.equal(a.poseRestorationVerified,true);
 assert.ok(f.bones[7].quaternion.equals(q[0]));
 assert.ok(f.bones[8].quaternion.equals(q[1]));
 assert.deepEqual(original(f),before);
 assert.equal(r.anyContactMustRemainBlocked,true);
});
test('C57: absent signed anatomical bone names BLOCKS fake neckline and sleeves',()=>{
 const f=fixture52(fourLoops57),r=audit57(f),a=r.originalAnatomicalLoopCandidates57;
 assert.equal(r.sourceAnatomicalLoopEvidenceComplete57,false);
 assert.equal(a.landmarkMissingOrBoundaryAmbiguous,true);
 assert.equal(a.anatomicalCandidateMappingPossible,false);
 assert.equal(a.sourceReadOnlyAuditRefusedReason,'source-163-bone-anatomical-names-unavailable');
 assert.equal(a.candidateNeckProximityOpening,0);
 assert.equal(a.twoDistinct163BonePoseSamplesCompleted,0);
 assert.equal(r.releaseAuthorized,false);
});
test('C57: only THREE legitimate source boundary loops cannot be force-labeled as four body openings',()=>{
 const f=annotatedBones57(fixture52(fourLoops57.slice(0,27))),
  r=audit57(f),a=r.originalAnatomicalLoopCandidates57;
 assert.equal(a.trueOriginalBoundaryLoopCount,3);
 assert.equal(a.anatomicalCandidateMappingPossible,false);
 assert.equal(a.sourceReadOnlyAuditRefusedReason,'not-four-original-consistent-closed-loops');
 assert.equal(a.candidateLowestGeometricOpening,0);
 assert.equal(r.sourceAnatomicalLoopEvidenceComplete57,false);
});
test('C57: small source boundary vertex budget FAILS CLOSED rather than returning fake collar/hem positions',()=>{
 const f=annotatedBones57(fixture52(fourLoops57)),
  r=audit57(f,{maxLoopVertices57:6}),a=r.originalAnatomicalLoopCandidates57;
 assert.equal(a.anatomicalCandidateMappingPossible,false);
 assert.equal(a.sourceReadOnlyAuditRefusedReason,'original-source-vertex-budget-exceeded');
 assert.equal(a.noSemanticCollarSleeveHemCertification,true);
 assert.equal(r.releaseAuthorized,false);
});
test('C57: only ONE genuine arm articulation sample is truthful and is NOT two-pose validation',()=>{
 const f=annotatedBones57(fixture52(fourLoops57)),
  r=audit57(f,{maxPoseSamples57:1}),a=r.originalAnatomicalLoopCandidates57;
 assert.equal(a.anatomicalCandidateMappingPossible,true);
 assert.equal(a.twoDistinct163BonePoseSamplesCompleted,1);
 assert.equal(r.sourceAnatomicalLoopEvidenceComplete57,false);
 assert.equal(a.poseRestorationVerified,true);
});
test('C57: invalid artifact provenance, detached 163-bone pose flags and out-of-bounds samples are refused',()=>{
 const f=annotatedBones57(fixture52(fourLoops57)),originalBytes=original(f);
 for(const invalid of [
  {refineAnatomicalLoopLandmarks57:true},
  {refineTriangleDistances53:true,refineAnatomicalLoopLandmarks57:true},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineAnatomicalLoopLandmarks57:true},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,refineAnatomicalLoopLandmarks57:true},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,refineBoundaryComponents56:true,
   refineAnatomicalLoopLandmarks57:true,maxLoopVertices57:0},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,refineBoundaryComponents56:true,
   refineAnatomicalLoopLandmarks57:true,maxPoseSamples57:3}
 ]){
  assert.throws(()=>auditActualPhotographedDressSurfaces52({
   root:f.root,dress:f.dress,...invalid
  }),/M2 C52 original-photo diagnostic/);
 }
 assert.deepEqual(original(f),originalBytes);
});

const audit58=(f,more={})=>auditActualPhotographedDressSurfaces52({
 root:f.root,dress:f.dress,
 refineTriangleDistances53:true,refineSourceTopology54:true,
 refineEdgeWinding55:true,refineBoundaryComponents56:true,
 refineAnatomicalLoopLandmarks57:true,refineArticulatedContacts58:true,
 ...more
});
test('C58: two REAL original-source 163-bone articulated samples measure neutral/self/body without permitting collision waiver',()=>{
 const f=annotatedBones57(fixture52(fourLoops57)),before=original(f),
  qs=f.bones.map(b=>b.quaternion.clone()),r=audit58(f),
  c=r.originalArticulatedContactReceipt58;
 assert.equal(c.schema,'M2-licensed-original-163bone-articulated-contact-C58');
 assert.equal(r.originalPhotoArticulatedPoseEvidenceComplete58,true);
 assert.equal(c.poseSampleCount,2);
 assert.equal(c.completeSelfPoseSweeps,2);
 assert.equal(c.originalNeutralBodyAuditComplete,true);
 assert.equal(c.completeBodyPoseSweeps,2);
 assert.equal(c.sourceFaceCount,4);
 assert.equal(c.originalNeutralSelfStrictCrossings,0);
 assert.equal(c.originalSelfStrictTransverseCrossingsAcrossSamples,0);
 assert.equal(c.originalBodyStrictTransverseCrossingsAcrossSamples,0);
 assert.equal(c.originalBodyIndependentClothFitCertified,false);
 assert.equal(c.allTemporaryBoneQuaternionsRestored,true);
 assert.equal(c.exactNeutralWorldSkinnedDressRestored,true);
 assert.equal(c.sampledPoseIntersectionNotContinuousPhysics,true);
 assert.equal(c.allGeometricZerosStillUnresolved,true);
 assert.equal(c.noSkinOrOriginalPhotoOrOwnerFieldsExposed,true);
 assert.equal(r.noGenuineArticulatedPhotoCollisionSafetyCertificate58,true);
 assert.equal(r.noOriginalPhotographedGarmentSewingOrBodyCollisionWaiver58,true);
 assert.equal(r.releaseAuthorized,false);
 assert.ok(f.bones.every((b,i)=>b.quaternion.equals(qs[i])));
 assert.deepEqual(original(f),before);
});
test('C58: original weighted shoulder vertices physically move in both articulated samples and all skin bones are restored',()=>{
 const f=annotatedBones57(fixture52(fourLoops57));
 for(let i=6;i<9;i++)f.dress.mesh.geometry.getAttribute('skinIndex').setX(i,7);
 for(let i=9;i<12;i++)f.dress.mesh.geometry.getAttribute('skinIndex').setX(i,8);
 const before=original(f),qs=f.bones.map(b=>b.quaternion.clone()),
  r=audit58(f),c=r.originalArticulatedContactReceipt58;
 assert.equal(r.originalPhotoArticulatedPoseEvidenceComplete58,true);
 assert.equal(c.poseSampleCount,2);
 assert.ok(c.actuallyDisplacedClothVerticesAcrossSamples>=6);
 assert.equal(c.completeSelfPoseSweeps,2);
 assert.equal(c.completeBodyPoseSweeps,2);
 assert.equal(c.allTemporaryBoneQuaternionsRestored,true);
 assert.equal(c.exactNeutralWorldSkinnedDressRestored,true);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
 assert.ok(f.bones.every((b,i)=>b.quaternion.equals(qs[i])));
});
test('C58: genuine source THREE body-vs-fabric overlapping coplanar triangles are unresolved in neutral and both articulated poses',()=>{
 const f=annotatedBones57(fixture52(fourLoops57));
 const a=f.body.geometry.getAttribute('position');
 a.array.set([0,.9,0,.3,.9,0,0,1.2,0]);
 a.needsUpdate=true;
 const snapshot=original(f),r=audit58(f),c=r.originalArticulatedContactReceipt58;
 assert.equal(r.originalPhotoArticulatedPoseEvidenceComplete58,true);
 assert.ok(c.originalNeutralBodyBoxPairs>=1);
 assert.ok(c.originalNeutralBodyNearOrZeroUnresolved>=1);
 assert.ok(c.originalBodyBoxPairsAcrossSamples>=2);
 assert.ok(c.originalBodyNearOrZeroUnresolvedAcrossSamples>=2);
 assert.equal(c.originalBodyIndependentClothFitCertified,false);
 assert.equal(r.anyContactMustRemainBlocked,true);
 assert.equal(r.releaseAuthorized,false);
 assert.deepEqual(original(f),snapshot);
});
test('C58: insufficient body triangle candidate budget must FAIL CLOSED, not invent cloth clearance',()=>{
 const f=annotatedBones57(fixture52(fourLoops57));
 const a=f.body.geometry.getAttribute('position');
 a.array.set([-10,-10,0,10,-10,0,0,10,0]);
 a.needsUpdate=true;
 const r=audit58(f,{maxBodyCandidatePairs58:1}),
  c=r.originalArticulatedContactReceipt58;
 assert.equal(c.poseSampleCount,2);
 assert.equal(c.originalNeutralBodyAuditComplete,false);
 assert.equal(c.completeBodyPoseSweeps,0);
 assert.equal(c.originalBodyPairSampleBudgetExhausted,true);
 assert.equal(r.originalPhotoArticulatedPoseEvidenceComplete58,false);
 assert.equal(r.noGenuineArticulatedPhotoCollisionSafetyCertificate58,true);
 assert.equal(r.releaseAuthorized,false);
});
test('C58: one true skinned arm-pose sample never claims two articulated poses',()=>{
 const f=annotatedBones57(fixture52(fourLoops57)),
  r=audit58(f,{maxPoseSamples58:1}),c=r.originalArticulatedContactReceipt58;
 assert.equal(c.poseSampleCount,1);
 assert.equal(c.completeSelfPoseSweeps,1);
 assert.equal(c.completeBodyPoseSweeps,1);
 assert.equal(c.allTemporaryBoneQuaternionsRestored,true);
 assert.equal(c.exactNeutralWorldSkinnedDressRestored,true);
 assert.equal(r.originalPhotoArticulatedPoseEvidenceComplete58,false);
 assert.equal(r.releaseAuthorized,false);
});
test('C58: missing P61 anatomical original photo landmarks blocks fake bone/body pose claims',()=>{
 const f=fixture52(fourLoops57),before=original(f),
  r=audit58(f),c=r.originalArticulatedContactReceipt58;
 assert.equal(r.sourceAnatomicalLoopEvidenceComplete57,false);
 assert.equal(r.originalPhotoArticulatedPoseEvidenceComplete58,false);
 assert.equal(c.poseSampleCount,0);
 assert.equal(c.sourceReadOnlySampleRefusedReason,
  'C57-anatomical-source-pose-evidence-incomplete');
 assert.equal(c.originalBodyIndependentClothFitCertified,false);
 assert.equal(c.releaseAuthorized,false);
 assert.deepEqual(original(f),before);
});
test('C58: malicious or undersized actual-source photograph self/body workload refuses collision evidence without owner mutations',()=>{
 const f=annotatedBones57(fixture52(fourLoops57)),before=original(f);
 for(const invalid of [
  {refineArticulatedContacts58:true},
  {refineTriangleDistances53:true,refineArticulatedContacts58:true},
  {refineTriangleDistances53:true,refineSourceTopology54:true,
   refineEdgeWinding55:true,refineBoundaryComponents56:true,
   refineArticulatedContacts58:true},
  {maxPoseSamples58:3},{maxComparisons58:0},
  {maxCandidatePairs58:0},{maxDistancePairs58:0},
  {maxBodyFaces58:0},{maxBodyComparisons58:0},
  {maxBodyCandidatePairs58:0},{refineArticulatedContacts58:'true'}
 ]){
  assert.throws(()=>auditActualPhotographedDressSurfaces52({
   root:f.root,dress:f.dress,...invalid
  }),/M2 C52 original-photo diagnostic/);
 }
 assert.deepEqual(original(f),before);
});

test('C58: oversized original anatomical body face spans many Y/Z cells and is never silently omitted from contact checks',()=>{
 const f=annotatedBones57(fixture52(fourLoops57));
 const a=f.body.geometry.getAttribute('position');
 a.array.set([0,-3,-3,0,3,-3,0,0,3]);
 a.needsUpdate=true;
 const immutable=original(f),r=audit58(f),
  report=r.originalArticulatedContactReceipt58;
 assert.equal(report.originalNeutralBodyAuditComplete,true);
 assert.equal(report.completeBodyPoseSweeps,2);
 assert.ok(report.originalNeutralBodyBoxPairs>0);
 assert.ok(report.originalNeutralBodyNearOrZeroUnresolved>0);
 assert.equal(report.originalBodyIndependentClothFitCertified,false);
 assert.equal(report.allTemporaryBoneQuaternionsRestored,true);
 assert.equal(report.releaseAuthorized,false);
 assert.deepEqual(original(f),immutable);
});
