import test from 'node:test';
import assert from 'node:assert/strict';
import {
 PHASES56,summarizeActualOriginalDressPhase56,
 summarizeAllOriginalDressPhases56
} from '../research/mission2-source-length/real-photo-contact-phases56.mjs';
const stages=['02-genuine-163-bone-front-dress',
 '03-genuine-163-bone-side-dress',
 '04-genuine-163-bone-rear-neutral'];
const widths=[320,390,430];
function fakeOriginalSignedReceipt(phase){
 const half={
  schema:'M2-original-licensed-source-half-edge-winding-C55',
  originalSourceFacesExamined:3836,originalSourceVerticesExamined:11508,
  sourceCoordinateGroups:5762,distinctSourceCoordinateEdges:8700,
  sourceHalfEdgesExamined:11508,boundarySourceEdges:5892,
  pairedOppositeWindingEdges:2808,indexedConnectedOppositeWindingEdges:0,
  splitIndexOppositeWindingEdgeCandidates:2808,pairedSameWindingEdges:0,
  pairedUnsafeRestSkinOrPoseEdges:0,nonmanifoldSourceEdges:0,
  ambiguousSourceMatches:0,incompatibleSourceTwins:0,collapsedFaceEdges:0,
  everyNoncollapsedHalfEdgeAccountedFor:true,
  physicallySewnSeamsCertified:false,
  aggregateOnlyNoRawCoordinatesOrFaceIndices:true,
  originalPhotoAndGarmentMutated:false,releaseAuthorized:false
 };
 const proto={classificationComplete:true,zeroDistancePairsClassified:2,
  sourceIndependentZeroDistancePairs:0,
  sourceCoincidentButUnsafeSkinRestOrPose:0};
 return {
  priority:'NATIVE-3D-05',realWebGL:true,widths,
  originalNativeAuthHTTPOnlyMocked:true,realSignedRLS:false,
  familyAlpha:'HOLD',releaseAuthorized:false,errors:[],crashes:[],cases:3,
  evidence:widths.map(width=>({
   width,originalSourceDressPhysicalPhaseDisplacement36:true,
   originalSourceDressMotionPhase36:phase,
   originalSourceDressMotionVertices36:800,
   continuousClothPhysicsCertified36:false
  })),
  licensedDressContact52:widths.map(width=>({
   width,authenticOriginalLicensedDress:true,actuallySkinned163Bones:true,
   originalSourceFaces:3836,sourceAndPosedFullPairSweepCompleted:true,
   sourceAndPosedDistanceRefinementCompleted53:true,
   fullOriginalSourceTopologyAuditCompleted54:true,
   originalSourceBoxPairs:10,posedBoxPairs:10,
   originalSourceStrictCrossings:0,posedStrictCrossings:0,
   originalSourceHalfEdge55:structuredClone(half),
   actualSourceHalfEdgesCertifiedAsSewing55:false,
   noSourceStitchingOrCollisionWaiver55:true,
   originalSourceTopology54:structuredClone(proto),
   posedSourceTopology54:structuredClone(proto),
   refinedOriginalDistance53:{geometricZeroOrOverlapUnresolved:2},
   refinedPosedDistance53:{geometricZeroOrOverlapUnresolved:2},
   releaseAuthorized:false,familyAlpha:'HOLD'
  })),
  screens:widths.flatMap(width=>stages.map((stage,k)=>({
   width,stage,sha256:(String(Math.round(phase*4)+k).repeat(64)).slice(0,64)
  })))
 };
}
test('C56: each signed real-photo source sample is reduced to 3 aggregate-only WebGL receipts',()=>{
 const s=summarizeActualOriginalDressPhase56(fakeOriginalSignedReceipt(.25),.25);
 assert.equal(s.schema,'M2-C56-sampled-licensed-original-dress-source-phase');
 assert.deepEqual(s.actualNativeWebGLWidths,widths);
 assert.equal(s.sourceGeometryReceipts.length,3);
 assert.equal(s.sourceGeometryReceipts[0].sourceFaces,3836);
 assert.equal(s.sourceGeometryReceipts[0].originalHalfEdges.splitIndex,2808);
 assert.equal(s.originalPhotoBytesExcluded,true);
 assert.equal(s.continuousPoseCollisionCertified,false);
 assert.equal(s.physicallySewnSeamsCertified,false);
 assert.equal(s.noReleaseAuthorization,true);
 assert.equal(JSON.stringify(s).includes('sourceXYZ'),false);
});
test('C56: five distinct documented WebGL source motion phases can pass ONLY sampled-pose gate',()=>{
 const samples=PHASES56.map(phase=>
  summarizeActualOriginalDressPhase56(fakeOriginalSignedReceipt(phase),phase));
 const all=summarizeAllOriginalDressPhases56(samples);
 assert.equal(all.sampledPoseGuardPassed56,true);
 assert.equal(all.widthsWithMeasuredSideOrRearPhotoBackedWebGLChanges,3);
 assert.equal(all.sampledStrictIntersectionPhases,0);
 assert.equal(all.unmeasuredBetweenSampleContinuousContactNotCertified,true);
 assert.equal(all.authenticRearPhotographAvailable,false);
 assert.equal(all.releaseAuthorized,false);
});
test('C56: a single witnessed genuine future-pose penetration denies the sampled gate',()=>{
 const samples=PHASES56.map(phase=>
  summarizeActualOriginalDressPhase56(fakeOriginalSignedReceipt(phase),phase));
 samples[2].sourceGeometryReceipts[0].posedStrictCrossings=1;
 assert.equal(summarizeAllOriginalDressPhases56(samples).sampledPoseGuardPassed56,false);
});
test('C56: source seam/topology disagreement at one later phase remains unsafe',()=>{
 const samples=PHASES56.map(phase=>
  summarizeActualOriginalDressPhase56(fakeOriginalSignedReceipt(phase),phase));
 samples[3].sourceGeometryReceipts[0].originalHalfEdges.sameWinding=1;
 const all=summarizeAllOriginalDressPhases56(samples);
 assert.equal(all.phaseTopologiesChangedCount,1);
 assert.equal(all.sampledIndependentOrUnsafeContactPhases,1);
 assert.equal(all.sampledPoseGuardPassed56,false);
});
test('C56: no observed actual geometry/photo motion cannot be reported as proven cloth movement',()=>{
 const samples=PHASES56.map(phase=>
  summarizeActualOriginalDressPhase56(fakeOriginalSignedReceipt(phase),phase));
 const baseline=samples[0].sourceGeometryReceipts.map(x=>x.screenshotSHA256);
 for(const r of samples)r.sourceGeometryReceipts.forEach((x,i)=>{
  x.screenshotSHA256={...baseline[i]};
 });
 const all=summarizeAllOriginalDressPhases56(samples);
 assert.equal(all.widthsWithMeasuredSideOrRearPhotoBackedWebGLChanges,0);
 assert.equal(all.sampledPoseGuardPassed56,false);
});
test('C56: absent/malformed genuine original photograph provenance is refused',()=>{
 for(const mutate of [
  r=>{r.realWebGL=false;},
  r=>{r.realSignedRLS=true;},
  r=>{r.familyAlpha='RELEASED';},
  r=>{r.licensedDressContact52[1].fullOriginalSourceTopologyAuditCompleted54=false;},
  r=>{r.licensedDressContact52[0].originalSourceHalfEdge55.physicallySewnSeamsCertified=true;},
  r=>{r.licensedDressContact52[0].releaseAuthorized=true;},
  r=>{r.evidence[1].originalSourceDressMotionPhase36=.75;},
  r=>{r.screens=[];},
  r=>{r.licensedDressContact52[2].originalSourceFaces=9999;}
 ]){
  const r=fakeOriginalSignedReceipt(.25);mutate(r);
  assert.throws(()=>summarizeActualOriginalDressPhase56(r,.25));
 }
});
test('C56: missing or duplicated sampled-phase evidence is always rejected',()=>{
 const reports=PHASES56.map(phase=>
  summarizeActualOriginalDressPhase56(fakeOriginalSignedReceipt(phase),phase));
 assert.throws(()=>summarizeAllOriginalDressPhases56(reports.slice(1)));
 const duplicate=reports.slice();duplicate[4]=reports[3];
 assert.throws(()=>summarizeAllOriginalDressPhases56(duplicate));
 assert.throws(()=>summarizeActualOriginalDressPhase56(fakeOriginalSignedReceipt(.2),.2));
});
