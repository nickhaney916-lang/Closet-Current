/**
 * M2 P2-C52: fail-closed, public-fixture-only REAL native P175 browser
 * receipt audit. Only bounded, source-anonymous counts are retained.
 * This is not a photo mesh repair, clearance admission or cloth physics.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const file='benchmark/native-3d-05/results.json';
const report=JSON.parse(await readFile(file,'utf8'));
assert.equal(report.priority,'NATIVE-3D-05');
assert.equal(report.realWebGL,true);
assert.equal(report.originalNativeAuthHTTPOnlyMocked,true);
assert.equal(report.realSignedRLS,false);
assert.equal(report.familyAlpha,'HOLD');
assert.equal(report.releaseAuthorized,false);
assert.deepEqual(report.errors,[]);
assert.deepEqual(report.crashes,[]);
assert.deepEqual(report.widths,[320,390,430]);
const receipts=report.licensedDressContact52;
assert.ok(Array.isArray(receipts)&&receipts.length===3);
assert.deepEqual(receipts.map(r=>r.width),[320,390,430]);
for(const r of receipts){
 assert.equal(r.schema,'M2-real-original-photo-surface-diagnostic-C52');
 assert.equal(r.source,'licensed-original-Commons-0053-P61-P175');
 assert.equal(r.authenticOriginalLicensedDress,true);
 assert.equal(r.actuallySkinned163Bones,true);
 assert.ok(r.anatomicalBodyMeshes>=1);
 assert.ok(r.originalSourceFaces>=1000&&r.originalSourceFaces<=100000);
 assert.ok(r.sourcePairComparisons>=0&&r.posedPairComparisons>=0);
 assert.ok(r.originalSourceStrictCrossings>=0);
 assert.ok(r.posedStrictCrossings>=0);
 assert.equal(r.originalSourceBoxPairs,
  r.originalSourceStrictCrossings+r.originalSourceUncertainBoxPairs);
 assert.equal(r.posedBoxPairs,
  r.posedStrictCrossings+r.posedUncertainBoxPairs);
 assert.equal(r.sourceSweepExhausted||r.posedSweepExhausted,
  !r.sourceAndPosedFullPairSweepCompleted);
 assert.equal(r.originalSourcePhotoUVRestSkinAndIndicesUntouched,true);
 assert.equal(r.noRawGeometryOrPhotoExposed,true);
 assert.equal(r.boundingBoxOverlapNotProofOfContact,true);
 assert.equal(r.nonCrossingNotProofOfClearance,true);
 assert.equal(r.anyContactMustRemainBlocked,true);
 assert.equal(r.noContinuousSelfCollisionCertificate,true);
 assert.equal(r.realClothPhysics,false);
 assert.equal(r.humanPhotorealismApproval,false);
 assert.equal(r.realPhoneAcceptance,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
}
const first=receipts[0];
for(const r of receipts.slice(1))
 for(const k of ['originalSourceFaces','originalSourceBoxPairs',
  'originalSourceStrictCrossings','sourceAndPosedFullPairSweepCompleted'])
  assert.equal(r[k],first[k],
   'Same SHA-pinned P61 source original cannot silently change with viewport width: '+k);
const output={
 schema:'M2-P2-C52-live-licensed-photograph-contact-report',
 authenticOriginalPhotoBrowserRuns:receipts.length,
 originalSourceFaces:first.originalSourceFaces,
 sourceStrictCrossingWitnesses:first.originalSourceStrictCrossings,
 sourceBoundsUncertain:first.originalSourceUncertainBoxPairs,
 posedStrictCrossingWitnesses:receipts.map(r=>r.posedStrictCrossings),
 posedAABBUncertainty:receipts.map(r=>r.posedUncertainBoxPairs),
 comparisonBudgetsExhausted:receipts.some(r=>
  !r.sourceAndPosedFullPairSweepCompleted),
 exactSourceFaceCoordinatesNotExported:true,
 originalLicensedPhotographSHAValidatedInBrowser:true,
 originalGarmentStillUnchanged:true,
 entireActualSourceMeshRepairNotVerified:true,
 continuousSelfContactOrGarmentPhysicsCertified:false,
 independentPhotorealApproval:false,
 physicalMobileAcceptance:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await mkdir('benchmark/mission2-source-dress-motion',{recursive:true});
await writeFile('benchmark/mission2-source-dress-motion/live-source-contact52.json',
 JSON.stringify(output,null,2)+'\n');
console.log('M2_C52_REAL_LICENSED_P175_CONTACT_SAFE_SUMMARY',JSON.stringify(output));

if(process.env.PHOTO_DRESS_DISTANCE53==='1'){
 const witnesses=receipts.map(r=>({
  original:r.refinedOriginalDistance53,posed:r.refinedPosedDistance53,
  complete:r.sourceAndPosedDistanceRefinementCompleted53,
  boxes:[r.originalSourceBoxPairs,r.posedBoxPairs]
 }));
 for(const w of witnesses){
  assert.equal(w.complete,true,
   'C53 exhaustive exact original source and skinned pose refinement required');
  for(const [n,entry] of [w.original,w.posed].entries()){
   assert.equal(entry?.schema,'M2-source-posed-triangle-separation-C53');
   assert.equal(entry.distanceRefinementComplete,true);
   assert.equal(entry.triangleCandidatePairsMeasured,w.boxes[n]);
   assert.equal(entry.triangleCandidatePairsMeasured,
    entry.geometricZeroOrOverlapUnresolved+
    entry.positiveGapWithinToleranceUnresolved+
    entry.positiveGapBeyondToleranceAtThisPose);
   assert.equal(entry.originalPhotoVertexCoordinatesExposed,false);
   assert.equal(entry.exactSourceFaceIndicesExposed,false);
   assert.equal(entry.zeroGapNotCertifiedAsPenetration,true);
   assert.equal(entry.positiveGapNotContinuousClothClearance,true);
   assert.equal(entry.noSourceRepairAuthorized,true);
   assert.equal(entry.familyAlpha,'HOLD');
  }
 }
 const base=JSON.stringify(witnesses[0]);
 for(const witness of witnesses.slice(1))
  assert.equal(JSON.stringify(witness),base,
   'same source geometry and same skinned pose must give identical exact distances across viewport widths');
 const output53={
  schema:'M2-P2-C53-real-licensed-triangle-distance',
  source:'actual-licensed-photographed-P61-P175-C53',
  sourceFaces:first.originalSourceFaces,
  authenticatedBrowserWidths:[320,390,430],
  sourceOriginalBoundsPairs:witnesses[0].boxes[0],
  posedBoundsPairs:witnesses[0].boxes[1],
  sourceMeasuredExactTriangles:witnesses[0].original.triangleCandidatePairsMeasured,
  posedMeasuredExactTriangles:witnesses[0].posed.triangleCandidatePairsMeasured,
  sourceZeroOrOverlapUnresolved:witnesses[0].original.geometricZeroOrOverlapUnresolved,
  sourceNearUnresolved:witnesses[0].original.positiveGapWithinToleranceUnresolved,
  sourcePositiveGapAtSinglePose:witnesses[0].original.positiveGapBeyondToleranceAtThisPose,
  posedZeroOrOverlapUnresolved:witnesses[0].posed.geometricZeroOrOverlapUnresolved,
  posedNearUnresolved:witnesses[0].posed.positiveGapWithinToleranceUnresolved,
  posedPositiveGapAtSinglePose:witnesses[0].posed.positiveGapBeyondToleranceAtThisPose,
  genuineOriginalLicensedPhotoAnalyzed:true,
  originalPhotoUVAndSkinPreserved:true,
  originalGarmentMeshNeverRewritten:true,
  originalPhotoBytesNeverExported:true,
  noActualUVSeamAnnotation:true,
  noGeometryCorrectionApproved:true,
  noContinuousClothClearance:true,
  noIndependentHumanPhotorealismAcceptance:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-source-distance53.json',
  JSON.stringify(output53,null,2)+'\n');
 console.log('M2_C53_REAL_LICENSED_P175_DISTANCE_SAFE_SUMMARY',JSON.stringify(output53));
}

if(process.env.PHOTO_DRESS_TOPOLOGY54==='1'){
 assert.equal(process.env.PHOTO_DRESS_DISTANCE53,'1',
  'C54 requires independent original and posed C53 contact-distance evidence');
 const topologyNames=[
  'sourceCoincidentFaceCandidates','sourceCoincidentEdgeCandidates',
  'sourceCoincidentSinglePointCandidates',
  'sourceCoincidentButUnsafeSkinRestOrPose',
  'sourceIndependentZeroDistancePairs'
 ];
 const evidence=receipts.map(r=>({
  source:r.originalSourceTopology54,posed:r.posedSourceTopology54,
  complete:r.fullOriginalSourceTopologyAuditCompleted54,
  zeroSource:r.refinedOriginalDistance53.geometricZeroOrOverlapUnresolved,
  zeroPosed:r.refinedPosedDistance53.geometricZeroOrOverlapUnresolved
 }));
 for(const w of evidence){
  assert.equal(w.complete,true);
  for(const [kind,t,expected] of [['source',w.source,w.zeroSource],
   ['posed',w.posed,w.zeroPosed]]){
   assert.equal(t.schema,'M2-original-source-zero-contact-topology-C54');
   assert.equal(t.classificationComplete,true);
   assert.equal(t.zeroDistancePairsClassified,expected);
   assert.equal(topologyNames.reduce((count,key)=>count+t[key],0),expected,
    'C54 must classify EACH actual original triangle zero-distance pair exactly once: '+kind);
   assert.ok(t.sourceIndexSharedPairsExcludedBeforeDistance>=0);
   assert.equal(t.allSourceCorrespondencesCheckedAgainst163BonePose,true);
   assert.equal(t.sourceCoincidenceNotAHumanVerifiedSewingSeam,true);
   assert.equal(t.sourceDisconnectedFacesNotAutomaticallySeparated,true);
   assert.equal(t.sourceCoordinateDuplicateNotPermissionToWeld,true);
   assert.equal(t.originalPhotoVertexCoordinatesExposed,false);
   assert.equal(t.originalSourceFaceIdsExposed,false);
   assert.equal(t.releaseAuthorized,false);
   assert.equal(t.familyAlpha,'HOLD');
  }
 }
 for(const row of evidence.slice(1))
  assert.deepEqual(row,evidence[0],
   'source and actual posed topology distribution may not vary across same skinned P61 photograph viewport');
 const first54=evidence[0];
 const output54={
  schema:'M2-P2-C54-licensed-original-163bone-source-topology',
  originalPhotographedDressSourceFaces:first.originalSourceFaces,
  actualLicensedDressViewportRuns:3,
  sourceZeroDistanceCandidates:first54.zeroSource,
  posedZeroDistanceCandidates:first54.zeroPosed,
  sourceTopologyBins:Object.fromEntries(topologyNames.map(k=>[k,first54.source[k]])),
  posedTopologyBins:Object.fromEntries(topologyNames.map(k=>[k,first54.posed[k]])),
  indexedConnectedSourcePairsExcludedFromDistanceSweep:{
   original:first54.source.sourceIndexSharedPairsExcludedBeforeDistance,
   posed:first54.posed.sourceIndexSharedPairsExcludedBeforeDistance
  },
  signedOriginalPhotoSHAOnly:true,
  actualSkinned163BoneSkinRestCompared:true,
  originalSourceAndPhotoBytesImmutable:true,
  allSourceGeometryIdentifiersWithheld:true,
  allClassificationsAreCANDIDATESNotCertifiedSewingSeams:true,
  noSourceUVWeldingOrGeometryEdit:true,
  noFullContinuousClothSelfContactProof:true,
  noHumanPhotoRealismApproval:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-source-topology54.json',
  JSON.stringify(output54,null,2)+'\n');
 console.log('M2_C54_REAL_LICENSED_SOURCE_TOPOLOGY_SAFE_SUMMARY',JSON.stringify(output54));
}
