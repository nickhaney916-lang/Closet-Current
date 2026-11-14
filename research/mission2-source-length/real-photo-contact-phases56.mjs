/**
 * Mission 2 P2-C56. De-identified, sampled-phase ORIGINAL photographed P61
 * 163-bone C52/C53/C54/C55 source-contact receipts. Never certifies
 * continuous collision clearance or seam sewing, even when all samples pass.
 * No private owner data, original photo pixels, raw mesh positions, face
 * identifiers or screenshot bytes are output.
 */
import assert from 'node:assert/strict';
export const PHASES56=Object.freeze([0,.25,.5,.75,1]);
const WIDTHS=Object.freeze([320,390,430]);
const stages=Object.freeze([
 '02-genuine-163-bone-front-dress',
 '03-genuine-163-bone-side-dress',
 '04-genuine-163-bone-rear-neutral'
]);
function requireSafeHeader56(report){
 assert.equal(report?.priority,'NATIVE-3D-05');
 assert.equal(report.realWebGL,true);
 assert.deepEqual(report.widths,WIDTHS);
 assert.equal(report.originalNativeAuthHTTPOnlyMocked,true);
 assert.equal(report.realSignedRLS,false);
 assert.equal(report.familyAlpha,'HOLD');
 assert.equal(report.releaseAuthorized,false);
 assert.deepEqual(report.errors,[]);
 assert.deepEqual(report.crashes,[]);
 assert.equal(report.cases,3);
 assert.ok(Array.isArray(report.evidence));
 assert.ok(Array.isArray(report.licensedDressContact52));
 assert.ok(Array.isArray(report.screens));
}
const topo55=e=>({
 sourceFaces:e.originalSourceFacesExamined,
 vertices:e.originalSourceVerticesExamined,
 coordinateGroups:e.sourceCoordinateGroups,
 originalEdges:e.distinctSourceCoordinateEdges,
 boundaries:e.boundarySourceEdges,
 opposite:e.pairedOppositeWindingEdges,
 indexShared:e.indexedConnectedOppositeWindingEdges,
 splitIndex:e.splitIndexOppositeWindingEdgeCandidates,
 sameWinding:e.pairedSameWindingEdges,
 incompatible:e.pairedUnsafeRestSkinOrPoseEdges,
 nonmanifold:e.nonmanifoldSourceEdges,
 ambiguous:e.ambiguousSourceMatches,
 incompatibleTwins:e.incompatibleSourceTwins,
 collapsed:e.collapsedFaceEdges
});
export function summarizeActualOriginalDressPhase56(report,phase){
 assert.ok(PHASES56.includes(phase),'C56 only permits 5 fixed motion phases');
 requireSafeHeader56(report);
 const out=[];
 for(const width of WIDTHS){
  const e=report.evidence.find(x=>x.width===width);
  const r=report.licensedDressContact52.find(x=>x.width===width);
  assert.ok(e&&r,'C56 each original source pose requires 163-bone evidence');
  assert.equal(e.originalSourceDressPhysicalPhaseDisplacement36,true);
  assert.equal(e.originalSourceDressMotionPhase36,phase);
  assert.ok(e.originalSourceDressMotionVertices36>=100);
  assert.equal(e.continuousClothPhysicsCertified36,false);
  assert.equal(r.authenticOriginalLicensedDress,true);
  assert.equal(r.actuallySkinned163Bones,true);
  assert.ok(r.originalSourceFaces>=1000);
  assert.equal(r.sourceAndPosedFullPairSweepCompleted,true);
  assert.equal(r.sourceAndPosedDistanceRefinementCompleted53,true);
  assert.equal(r.fullOriginalSourceTopologyAuditCompleted54,true);
  assert.equal(r.releaseAuthorized,false);
  assert.equal(r.familyAlpha,'HOLD');
  assert.equal(r.originalPhotoSourceAndPosedFullPairSweepCompleted56,undefined);
  const a=r.originalSourceHalfEdge55;
  assert.equal(a?.schema,'M2-original-licensed-source-half-edge-winding-C55');
  assert.equal(a.sourceHalfEdgesExamined,r.originalSourceFaces*3);
  assert.equal(a.everyNoncollapsedHalfEdgeAccountedFor,true);
  assert.equal(a.physicallySewnSeamsCertified,false);
  assert.equal(a.aggregateOnlyNoRawCoordinatesOrFaceIndices,true);
  assert.equal(a.originalPhotoAndGarmentMutated,false);
  assert.equal(a.releaseAuthorized,false);
  assert.equal(r.actualSourceHalfEdgesCertifiedAsSewing55,false);
  assert.equal(r.noSourceStitchingOrCollisionWaiver55,true);
  const original=r.originalSourceTopology54,posed=r.posedSourceTopology54;
  assert.equal(original.classificationComplete,true);
  assert.equal(posed.classificationComplete,true);
  assert.equal(original.zeroDistancePairsClassified,
   r.refinedOriginalDistance53.geometricZeroOrOverlapUnresolved);
  assert.equal(posed.zeroDistancePairsClassified,
   r.refinedPosedDistance53.geometricZeroOrOverlapUnresolved);
  const images=Object.fromEntries(stages.map(stage=>{
   const screen=report.screens.find(s=>s.width===width&&s.stage===stage);
   assert.ok(screen&&/^[a-f0-9]{64}$/i.test(screen.sha256),
    'C56 original WebGL source dress screenshot SHA missing');
   return [stage,screen.sha256];
  }));
  out.push({
   width,sourceFaces:r.originalSourceFaces,
   sourceTriangleCandidates:r.originalSourceBoxPairs,
   posedTriangleCandidates:r.posedBoxPairs,
   sourceStrictCrossings:r.originalSourceStrictCrossings,
   posedStrictCrossings:r.posedStrictCrossings,
   sourceIndependentZeroDistance:
    original.sourceIndependentZeroDistancePairs,
   posedIndependentZeroDistance:
    posed.sourceIndependentZeroDistancePairs,
   sourceUnsafeCoincidentPairs:
    original.sourceCoincidentButUnsafeSkinRestOrPose,
   posedUnsafeCoincidentPairs:
    posed.sourceCoincidentButUnsafeSkinRestOrPose,
   originalHalfEdges:topo55(a),
   screenshotSHA256:images
  });
 }
 const first=out[0];
 for(const o of out.slice(1)){
  for(const key of Object.keys(first)){
   if(key==='width'||key==='screenshotSHA256')continue;
   assert.deepEqual(o[key],first[key],
    'C56 actual original licensed source geometry must match across 3 viewport widths: '+key);
  }
 }
 return Object.freeze({
  schema:'M2-C56-sampled-licensed-original-dress-source-phase',
  phase,actualNativeWebGLWidths:[...WIDTHS],
  independentlyMeasuredRealDressViews:3,
  originalDressSourceSHAValidatedByNativeLoader:true,
  originalPhotoAndShaderRestUntouched:true,
  sourceGeometryReceipts:out,
  originalPhotoBytesExcluded:true,
  personalOwnerPhotographsExcluded:true,
  individualSourceVertexIDsExcluded:true,
  noReleaseAuthorization:true,
  continuousPoseCollisionCertified:false,
  physicallySewnSeamsCertified:false,
  familyAlpha:'HOLD'
 });
}
export function summarizeAllOriginalDressPhases56(reports){
 assert.ok(Array.isArray(reports)&&reports.length===PHASES56.length,
  'C56 requires exactly 5 real original-photo pose measurements');
 for(let i=0;i<PHASES56.length;i++){
  assert.equal(reports[i]?.schema,'M2-C56-sampled-licensed-original-dress-source-phase');
  assert.equal(reports[i].phase,PHASES56[i]);
  assert.deepEqual(reports[i].actualNativeWebGLWidths,WIDTHS);
  assert.equal(reports[i].sourceGeometryReceipts.length,3);
 }
 let inconsistentTopologies=0,observedStrictCrossingSamples=0,
  sourceIndependentOrUnsafeSamples=0;
 const reference=JSON.stringify(reports[0].sourceGeometryReceipts[0].originalHalfEdges);
 for(const r of reports){
  const sample=r.sourceGeometryReceipts[0];
  if(JSON.stringify(sample.originalHalfEdges)!==reference)inconsistentTopologies++;
  if(sample.sourceStrictCrossings>0||sample.posedStrictCrossings>0)
   observedStrictCrossingSamples++;
  if(sample.sourceIndependentZeroDistance>0||
     sample.posedIndependentZeroDistance>0||
     sample.sourceUnsafeCoincidentPairs>0||
     sample.posedUnsafeCoincidentPairs>0||
     sample.originalHalfEdges.incompatible>0||
     sample.originalHalfEdges.sameWinding>0||
     sample.originalHalfEdges.nonmanifold>0||
     sample.originalHalfEdges.ambiguous>0)
   sourceIndependentOrUnsafeSamples++;
 }
 let changingSideRearWebGLWidthCount=0;
 for(const width of WIDTHS){
  const screenshots=reports.map(r=>r.sourceGeometryReceipts.find(
   x=>x.width===width).screenshotSHA256);
  const side=new Set(screenshots.map(s=>s[stages[1]]));
  const rear=new Set(screenshots.map(s=>s[stages[2]]));
  if(side.size>1||rear.size>1)changingSideRearWebGLWidthCount++;
 }
 const sampledPoseGuardPassed56=inconsistentTopologies===0&&
  observedStrictCrossingSamples===0&&
  sourceIndependentOrUnsafeSamples===0&&
  changingSideRearWebGLWidthCount===3;
 return Object.freeze({
  schema:'M2-C56-authentic-licensed-163bone-five-phase-audit',
  sampledPhases:[...PHASES56],
  realPhotoBackedNativeWebGLDressViews:15,
  measuredSignedDressMeshAtFiveDistinctMotionPhases:true,
  phaseTopologiesChangedCount:inconsistentTopologies,
  sampledStrictIntersectionPhases:observedStrictCrossingSamples,
  sampledIndependentOrUnsafeContactPhases:sourceIndependentOrUnsafeSamples,
  widthsWithMeasuredSideOrRearPhotoBackedWebGLChanges:
   changingSideRearWebGLWidthCount,
  sampledPoseGuardPassed56,
  unmeasuredBetweenSampleContinuousContactNotCertified:true,
  authenticRearPhotographAvailable:false,
  independentHumanPhotorealismApproved:false,
  noRealPhoneAcceptance:true,
  noAutomaticWeldingOrCollisionWaivers:true,
  noSourcePhotoBytesOrPrivateOwnerIdentifiers:true,
  noProductionStagingOrSupabaseWrite:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
