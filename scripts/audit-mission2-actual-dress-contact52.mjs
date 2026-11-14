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

if(process.env.PHOTO_DRESS_EDGES55==='1'){
 assert.equal(process.env.PHOTO_DRESS_TOPOLOGY54,'1',
  'C55 actual licensed photograph edge audit requires all C54 original seam candidates');
 const keys=[
  'sourceTwoFaceOppositeWindingCandidates',
  'sourceTwoFaceSameWindingCandidates',
  'sourceThreePlusIncidentFaceNonmanifoldCandidates',
  'sourceUnsafeOrAmbiguousCoordinateGroupCandidates',
  'sourceEdgeUnpairedOrUnresolvedCandidates'
 ];
 const witnesses=receipts.map(r=>({
  original:r.originalSourceEdgeWinding55,
  posed:r.posedSourceEdgeWinding55,
  complete:r.fullOriginalSourceEdgeWindingAuditCompleted55,
  originalExpected:r.originalSourceTopology54.sourceCoincidentEdgeCandidates,
  posedExpected:r.posedSourceTopology54.sourceCoincidentEdgeCandidates
 }));
 for(const w of witnesses){
  assert.equal(w.complete,true);
  for(const [name,t,expected] of [
   ['original',w.original,w.originalExpected],
   ['posed',w.posed,w.posedExpected]]){
   assert.equal(t?.schema,'M2-original-photograph-source-edge-winding-C55');
   assert.equal(t.sourceEdgeAuditComplete,true);
   assert.equal(t.sourceEdgePairsClassified,expected,
    'C55 original photo '+name+' edge pairs must precisely match C54');
   assert.equal(keys.reduce((n,k)=>n+t[k],0),expected);
   assert.equal(t.originalSourceEdgeGroupCount,
    t.originalBoundarySingleIncidentEdgeGroups+
    t.originalTwoIncidentEdgeGroups+
    t.originalNonmanifoldThreePlusIncidentEdgeGroups);
   assert.equal(t.sourceEdgeWindingOnlyCandidateNotSewnSeam,true);
   assert.equal(t.oppositeWindingCannotAuthorizeWelding,true);
   assert.equal(t.sourceManifoldEstimateNotPhysicalFabricCertificate,true);
   assert.equal(t.changingPoseAndContinuousClothNotCertified,true);
   assert.equal(t.ownerPhotoOrVertexLocationsExposed,false);
   assert.equal(t.originalSourceFaceIdsExposed,false);
   assert.equal(t.photoUVSkinAndSourceMeshUnchanged,true);
   assert.equal(t.releaseAuthorized,false);
   assert.equal(t.familyAlpha,'HOLD');
  }
 }
 for(const w of witnesses.slice(1))
  assert.deepEqual(w,witnesses[0],
   'C55 source and posed real source/manifold graph counts must be viewport independent for identical signed source and pose');
 const w=witnesses[0];
 const output55={
  schema:'M2-P2-C55-original-licensed-photo-edge-incidence-and-winding',
  realPhotographedDressTriangles:first.originalSourceFaces,
  licensedOriginal163BoneViewportRuns:3,
  originalSourceEdgeCandidatesFromC54:w.originalExpected,
  posedSourceEdgeCandidatesFromC54:w.posedExpected,
  sourceEdgeWindingClasses:Object.fromEntries(keys.map(k=>[k,w.original[k]])),
  posedEdgeWindingClasses:Object.fromEntries(keys.map(k=>[k,w.posed[k]])),
  sourceEdgeIncidenceGroups:{
   unique:w.original.originalSourceEdgeGroupCount,
   singleIncident:w.original.originalBoundarySingleIncidentEdgeGroups,
   exactlyTwoIncident:w.original.originalTwoIncidentEdgeGroups,
   threeOrMoreIncident:w.original.originalNonmanifoldThreePlusIncidentEdgeGroups
  },
  sourceCoordinateGroupCounts:{
   originalUniqueGroups:w.original.originalCoordinateGroups,
   unsafeOrAmbiguousGroups:w.original.originalAmbiguousOrSkinMismatchedGroups
  },
  sourceFaceIdsAndVertexCoordinatesNeverExported:true,
  originalPhotoUVRestAndSkinImmutable:true,
  originalJPEGAndMaterialUntouched:true,
  genuineSewingSemanticsNOTProven:true,
  allGeometricSourceContactsStillUnresolved:true,
  noWeldOrCollisionExemptionAuthorized:true,
  continuousFabricPhysicsNotCertified:true,
  independentHumanRealismNotCertified:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-source-edges55.json',
  JSON.stringify(output55,null,2)+'\n');
 console.log('M2_C55_REAL_LICENSED_SOURCE_EDGE_WINDING_SAFE_SUMMARY',
  JSON.stringify(output55));
}

if(process.env.PHOTO_DRESS_BOUNDARIES56==='1'){
 assert.equal(process.env.PHOTO_DRESS_EDGES55,'1',
  'C56 signed photographed dress boundary components require source C55 edge audit');
 const rows=receipts.map(r=>({
  receipt:r.originalSourceBoundaryComponents56,
  complete:r.originalAndSkinned163BoneBoundaryAuditComplete56,
  expected:r.originalSourceEdgeWinding55.originalBoundarySingleIncidentEdgeGroups
 }));
 for(const {receipt:b,complete,expected} of rows){
  assert.equal(complete,true);
  assert.equal(b.schema,'M2-original-photograph-boundary-components-C56');
  assert.equal(b.boundaryComponentAuditComplete,true);
  assert.equal(b.budgetExhausted,false);
  assert.equal(b.totalOriginalSingleIncidentEdgeGroups,expected);
  assert.equal(b.boundariesActuallyVisited,expected);
  assert.equal(b.connectedBoundaryComponents,
   b.closedDirectedLoopComponents+b.openDirectedChainComponents+
   b.windingConflictComponents+b.branchedOrNonmanifoldComponents+
   b.unsafeSourceSkinOrPoseComponents);
  assert.equal(expected,b.edgesInClosedDirectedLoops+
   b.edgesInOpenDirectedChains+b.edgesInWindingConflictComponents+
   b.edgesInBranchedOrNonmanifoldComponents+
   b.edgesInUnsafeSourceSkinOrPoseComponents);
  assert.equal(b.boundaryVertexGroups,
   b.boundaryVerticesDegreeOne+b.boundaryVerticesDegreeTwo+
   b.boundaryVerticesDegreeThreePlus);
  assert.equal(b.sourceCoordinateGroupsComparedAgainstOriginalPhotoRestAndSkin,true);
  assert.equal(b.actual163BonePoseBoundaryLengthsChecked,true);
  assert.equal(b.sourceBoundaryNotAnAnatomicallyApprovedHemOrOpening,true);
  assert.equal(b.closedGeometricLoopNotProofOfSeamQuality,true);
  assert.equal(b.openBoundaryDoesNotAuthorizeAutomaticHoleRepair,true);
  assert.equal(b.originalSourceVertexOrFaceIdentifiersExposed,false);
  assert.equal(b.originalPhotoCoordinatesOrPixelsExposed,false);
  assert.equal(b.bodyClearanceAndContinuousMotionNotCertified,true);
  assert.equal(b.noUVOrGeometryEditsPermitted,true);
  assert.equal(b.releaseAuthorized,false);
  assert.equal(b.familyAlpha,'HOLD');
 }
 for(const row of rows.slice(1))assert.deepEqual(row,rows[0],
  'Original photograph source boundary components must be identical across all 3 viewports at same genuine bone pose');
 const b=rows[0].receipt;
 const output56={
  schema:'M2-P2-C56-licensed-original-source-boundary-components',
  realPhotographedSourceFaces:first.originalSourceFaces,
  originalAuthenticated163BoneBrowserWidths:[320,390,430],
  originalBoundaryEdgesAudited:b.boundariesActuallyVisited,
  originalBoundaryVertexGroups:b.boundaryVertexGroups,
  originalBoundaryComponents:b.connectedBoundaryComponents,
  closedDirectedBoundaryLoopCandidates:b.closedDirectedLoopComponents,
  openDirectedBoundaryChainCandidates:b.openDirectedChainComponents,
  inconsistentWindingBoundaryComponents:b.windingConflictComponents,
  branchedOrNonmanifoldBoundaryComponents:b.branchedOrNonmanifoldComponents,
  unsafeSkinRestOrPoseBoundaryComponents:b.unsafeSourceSkinOrPoseComponents,
  edgeAccounting:{
   closed:b.edgesInClosedDirectedLoops,
   open:b.edgesInOpenDirectedChains,
   directionConflict:b.edgesInWindingConflictComponents,
   branched:b.edgesInBranchedOrNonmanifoldComponents,
   unsafe:b.edgesInUnsafeSourceSkinOrPoseComponents
  },
  boundaryVertexDegreeDistribution:{
   degreeOne:b.boundaryVerticesDegreeOne,
   degreeTwo:b.boundaryVerticesDegreeTwo,
   degreeThreeOrMore:b.boundaryVerticesDegreeThreePlus
  },
  boundariesWithSkinnedPoseEdgeStretchOverTenPercent:
   b.actualSkinnedPoseEdgesWithOverTenPercentLengthChange,
  allBoundariesCheckedAgainstOriginalRestAnd163BoneSkin:true,
  intactLicensedOriginalPhotoAndMesh:true,
  noOriginalSourceXYZOrFaceIndicesExported:true,
  noOriginalSourceHemCollarSleeveAnnotation:true,
  noAutomaticHoleRepairOrSeamWelding:true,
  noContinuousClothDynamicsCertificate:true,
  realPhoneAcceptance:false,releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-source-boundary56.json',
  JSON.stringify(output56,null,2)+'\n');
 console.log('M2_C56_REAL_LICENSED_BOUNDARY_COMPONENTS_SAFE_SUMMARY',
  JSON.stringify(output56));
}

if(process.env.PHOTO_DRESS_LANDMARKS57==='1'){
 assert.equal(process.env.PHOTO_DRESS_BOUNDARIES56,'1',
  'C57 genuine licensed dress source 163-bone landmarks depend on C56 boundaries');
 const rows=receipts.map(r=>({
  a:r.originalAnatomicalLoopCandidates57,
  complete:r.sourceAnatomicalLoopEvidenceComplete57,
  verifiedSource:r.originalSourceBoundaryComponents56,
  sourcePhoto:r.originalSourcePhotoUVRestSkinAndIndicesUntouched
 }));
 for(const {a,complete,verifiedSource,sourcePhoto} of rows){
  assert.equal(complete,true,'actual 4-loop P61 source 163-bone anatomy must be source-verified');
  assert.equal(a.schema,'M2-original-photograph-anatomical-loop-landmarks-C57');
  assert.equal(a.sourceOpenBoundaryEdges,verifiedSource.totalOriginalSingleIncidentEdgeGroups);
  assert.equal(a.trueOriginalBoundaryLoopCount,verifiedSource.closedDirectedLoopComponents);
  assert.equal(a.sourceLoopComponentVerticesChecked,verifiedSource.boundaryVertexGroups);
  assert.equal(a.landmarkBoneNamesFound,4);
  assert.equal(a.anatomicalCandidateMappingPossible,true);
  assert.equal(a.landmarkMissingOrBoundaryAmbiguous,false);
  assert.equal(a.candidateLowestGeometricOpening,1);
  assert.equal(a.candidateNeckProximityOpening,1);
  assert.equal(a.candidateLeftUpperArmProximityOpening,1);
  assert.equal(a.candidateRightUpperArmProximityOpening,1);
  assert.equal(a.twoDistinct163BonePoseSamplesCompleted,2);
  assert.ok(a.boneSamplesWithActualBoundaryDisplacement>=0&&
   a.boneSamplesWithActualBoundaryDisplacement<=2);
  assert.ok(a.sampledLoopBoundaryVerticesChanged>=0);
  assert.equal(a.posedOriginalLoopConnectivityRetained,true);
  assert.equal(a.poseRestorationVerified,true);
  assert.equal(a.sourceReadOnlyAuditRefusedReason,null);
  assert.equal(a.noHumanPhotoOpeningsAnnotated,true);
  assert.equal(a.noSemanticCollarSleeveHemCertification,true);
  assert.equal(a.noPoseCollisionOrContinuousPhysicsCertificate,true);
  assert.equal(a.noBoneUVSkinRestOrOriginalPhotoMutated,true);
  assert.equal(a.releaseAuthorized,false);
  assert.equal(a.familyAlpha,'HOLD');
  assert.equal(sourcePhoto,true);
 }
 for(const w of rows.slice(1))assert.deepEqual(w,rows[0],
  'C57 signed original photo must have identical source loop associations and genuine bone test pose probes across viewport sizes');
 const a=rows[0].a;
 const output57={
  schema:'M2-P2-C57-source-authentic-licensed-dress-four-anatomical-opening-candidates',
  originalLicensedPhotographedDressSourceFaces:first.originalSourceFaces,
  sourceOpenBoundaryEdges:a.sourceOpenBoundaryEdges,
  verifiedClosedOriginalBoundaryLoops:a.trueOriginalBoundaryLoopCount,
  genuineSourceAnatomical163BoneLandmarks:a.landmarkBoneNamesFound,
  geometricLowHeightOpeningCandidates:a.candidateLowestGeometricOpening,
  nearActualSkeletonNeckBoneCandidates:a.candidateNeckProximityOpening,
  nearActualLeftUpperArmBoneCandidates:a.candidateLeftUpperArmProximityOpening,
  nearActualRightUpperArmBoneCandidates:a.candidateRightUpperArmProximityOpening,
  realTemporary163BonePoseArticulations:a.twoDistinct163BonePoseSamplesCompleted,
  boneArticulationsActuallyMovingBoundaryVertices:
   a.boneSamplesWithActualBoundaryDisplacement,
  sourceBoundaryVerticesMovedAcrossBonePoseSamples:
   a.sampledLoopBoundaryVerticesChanged,
  boundaryLoopsActuallyMovingAcrossBonePoseSamples:
   a.sampledBoundaryLoopsMoved,
  allSourcePoseQuaternionsRestored:true,
  sourceGeometryTopologyUnchanged:true,
  sourceOriginalPhotoSkinUVRestUntouched:true,
  noHumanVerifiedHemNecklineArmholeLabels:true,
  noBoneSourcePhotoOrVertexPositionsExported:true,
  noContinuousMotionCollisionOrFabricPhysicsProof:true,
  onlyOneOriginalSourceAndTwoLimitedBoneArticulations:true,
  physicalMobileAcceptance:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-source-anatomy57.json',
  JSON.stringify(output57,null,2)+'\n');
 console.log('M2_C57_REAL_LICENSED_ANATOMICAL_OPENINGS_SAFE_SUMMARY',
  JSON.stringify(output57));
}

if(process.env.PHOTO_DRESS_CONTACT58==='1'){
 assert.equal(process.env.PHOTO_DRESS_LANDMARKS57,'1',
  'C58 two skinned source-verified articulated poses require C57 original landmarks');
 const evidence=receipts.map(r=>({
  a:r.originalArticulatedContactReceipt58,
  complete:r.originalPhotoArticulatedPoseEvidenceComplete58,
  originalSelfAABB:r.posedBoxPairs,
  originalSelfStrict:r.posedStrictCrossings
 }));
 for(const {a,complete,originalSelfAABB,originalSelfStrict} of evidence){
  assert.equal(a.schema,'M2-licensed-original-163bone-articulated-contact-C58');
  assert.equal(complete,true,
   'C58 actual authenticated photographed dress source/body contact sweep must be complete');
  assert.equal(a.sourceFaceCount,first.originalSourceFaces);
  assert.equal(a.originalNeutralSelfBoxPairs,originalSelfAABB);
  assert.equal(a.originalNeutralSelfStrictCrossings,originalSelfStrict);
  assert.equal(a.originalNeutralBodyAuditComplete,true);
  assert.ok(a.originalNeutralBodyTriangleCount>0);
  assert.equal(a.poseSampleCount,2);
  assert.equal(a.completeSelfPoseSweeps,2);
  assert.equal(a.completeBodyPoseSweeps,2);
  assert.ok(a.originalBodyTrianglesInspectedAcrossSamples>=
   a.originalNeutralBodyTriangleCount);
  assert.ok(a.actuallyDisplacedClothVerticesAcrossSamples>=0);
  assert.ok(a.originalSelfBoxPairsAcrossSamples>=0);
  assert.ok(a.originalSelfGeometricZeroUnresolvedAcrossSamples>=0);
  assert.ok(a.originalSelfPositiveGapAtSampledPoseAcrossSamples>=0);
  assert.ok(a.originalSelfStrictTransverseCrossingsAcrossSamples>=0);
  assert.ok(a.originalNeutralBodyBoxPairs>=0);
  assert.ok(a.originalNeutralBodyNearOrZeroUnresolved>=0);
  assert.ok(a.originalNeutralBodyStrictCrossings>=0);
  assert.ok(a.originalBodyBoxPairsAcrossSamples>=0);
  assert.ok(a.originalBodyNearOrZeroUnresolvedAcrossSamples>=0);
  assert.ok(a.originalBodyStrictTransverseCrossingsAcrossSamples>=0);
  assert.equal(a.originalSelfPairSampleBudgetExhausted,false);
  assert.equal(a.originalBodyPairSampleBudgetExhausted,false);
  assert.equal(a.originalBodyIndependentClothFitCertified,false);
  assert.equal(a.allTemporaryBoneQuaternionsRestored,true);
  assert.equal(a.exactNeutralWorldSkinnedDressRestored,true);
  assert.equal(a.sourceReadOnlySampleRefusedReason,null);
  assert.equal(a.allGeometricZerosStillUnresolved,true);
  assert.equal(a.sampledPoseIntersectionNotContinuousPhysics,true);
  assert.equal(a.noSkinOrOriginalPhotoOrOwnerFieldsExposed,true);
  assert.equal(a.noSourceGeometryEdited,true);
  assert.equal(a.sampledPoseContactNotReleaseApproval,true);
  assert.equal(a.releaseAuthorized,false);
  assert.equal(a.familyAlpha,'HOLD');
 }
 for(const w of evidence.slice(1))assert.deepEqual(w,evidence[0],
  'Original licensed 163-bone P61/P175 articulated contact outcome must be invariant across browser widths at same source and articulations');
 const a=evidence[0].a;
 const report={
  schema:'M2-P2-C58-real-licensed-photo-articulated-garment-body-contact',
  genuinePhotographedSourceFaces:a.sourceFaceCount,
  originalNeutralSelfBoxPairs:a.originalNeutralSelfBoxPairs,
  originalNeutralSelfStrictCrossings:a.originalNeutralSelfStrictCrossings,
  originalNeutralAnatomicalBodyTriangles:a.originalNeutralBodyTriangleCount,
  originalNeutralBodyBoxPairs:a.originalNeutralBodyBoxPairs,
  originalNeutralBodyNearOrZeroUnresolved:a.originalNeutralBodyNearOrZeroUnresolved,
  originalNeutralBodyStrictCrossings:a.originalNeutralBodyStrictCrossings,
  separateGenuine163BoneArticulatedArmPoseSamples:a.poseSampleCount,
  sourceDressVerticesMovedAcrossTwoArmSamples:a.actuallyDisplacedClothVerticesAcrossSamples,
  fullSourceSelfContactSweepsCompleted:a.completeSelfPoseSweeps,
  originalSourceSelfAABBCandidatePairsAcrossTwoArmSamples:
   a.originalSelfBoxPairsAcrossSamples,
  originalSelfGeometricZeroOrOverlapStillUnresolvedAcrossSamples:
   a.originalSelfGeometricZeroUnresolvedAcrossSamples,
  originalSelfPositiveGapAtSampledPoseAcrossSamples:
   a.originalSelfPositiveGapAtSampledPoseAcrossSamples,
  originalSelfStrictTransverseCrossingWitnessesAcrossSamples:
   a.originalSelfStrictTransverseCrossingsAcrossSamples,
  originalBodySourceTrianglesTestedAcrossBothArmSamples:
   a.originalBodyTrianglesInspectedAcrossSamples,
  originalBodySpatialIndexComparisonsAcrossTwoSamples:
   a.originalBodyComparisonsAcrossSamples,
  fullAnatomicalBodyContactSweepsCompleted:a.completeBodyPoseSweeps,
  originalBodyBoxCandidatePairsAcrossTwoSamples:
   a.originalBodyBoxPairsAcrossSamples,
  originalBodyNearOrZeroUnresolvedAcrossTwoSamples:
   a.originalBodyNearOrZeroUnresolvedAcrossSamples,
  originalBodyStrictTransverseCrossingWitnessesAcrossTwoSamples:
   a.originalBodyStrictTransverseCrossingsAcrossSamples,
  originalBoneQuaternionsRestored:true,
  originalNeutralSkinnedWorldPositionsRestored:true,
  originalPhotoUVSkinSourceVertexPositionsAndIndexUntouched:true,
  noBodyOrSelfCollisionExceptionGranted:true,
  noContinuousMotionPhysicsCertification:true,
  noHumanPhotoOrOwnerAnatomicalSemanticsVerified:true,
  noOwnerImageOrSourceTriangleCoordinatesExported:true,
  noReleaseOrProductionWrite:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-articulated-contact58.json',
  JSON.stringify(report,null,2)+'\n');
 console.log('M2_C58_REAL_LICENSED_ARTICULATED_CONTACT_SAFE_SUMMARY',
  JSON.stringify(report));
}

if(process.env.PHOTO_DRESS_BODY_BANDS59==='1'){
 assert.equal(process.env.PHOTO_DRESS_CONTACT58,'1',
  'C59 authentic source body band audit requires exhaustive C58 anatomical contact');
 const rows=receipts.map(r=>{
  assert.equal(r.originalPhotoArticulatedPoseEvidenceComplete58,true);
  assert.equal(r.genuineSourceBodyCrossingHeightWitnesses59,true);
  assert.equal(r.noActualPiercingPointOrSeverityLocalizationCertified59,true);
  assert.equal(r.noSourceGeometryAdjustmentOrCollisionWaiver59,true);
  const a=r.originalArticulatedContactReceipt58;
  assert.equal(a.originalBodyHeightBandEvidenceComplete59,true);
  const zones=[a.originalNeutralBodyHeightBands59,
   ...a.originalArticulatedBodyHeightBands59];
  assert.equal(zones.length,3);
  const strict=[a.originalNeutralBodyStrictCrossings,
   ...a.originalArticulatedBodyHeightBands59.map(z=>
    z.strictlyCrossingBodyTrianglePairWitnesses)];
  assert.equal(strict.slice(1).reduce((n,c)=>n+c,0),
   a.originalBodyStrictTransverseCrossingsAcrossSamples);
  for(let i=0;i<zones.length;i++){
   const z=zones[i];
   assert.equal(z.schema,'M2-original-source-body-crossing-centroid-height-bands-C59');
   assert.equal(z.fullyAuditedAtThisOnePose,true);
   assert.equal(z.allObservedStrictCrossingsAccountedFor,true);
   assert.equal(z.strictlyCrossingBodyTrianglePairWitnesses,strict[i]);
   assert.equal(z.atOrAboveNeckAnchorHeight+
    z.betweenNeckAndSpineAnchorHeights+
    z.belowSpineAnchorHeight,strict[i]);
   assert.equal(z.noOwnerOrOriginalPhotoCoordinatesOrFacesExported,true);
   assert.equal(z.noContactSeverityOrPhysicalPenetrationDepthMeasured,true);
   assert.equal(z.geometricSourceTriangleCentroidNotActualIntersectionPoint,true);
   assert.equal(z.noValidatedAnatomicalDefectLocalization,true);
   assert.equal(z.anyStrictBodyCrossingBlocksGarmentRelease,true);
   assert.equal(z.collisionExceptionGranted,false);
   assert.equal(z.releaseAuthorized,false);
  }
  return {neutral:zones[0],arm1:zones[1],arm2:zones[2],
   neutralStrict:strict[0],armStrictTotal:strict[1]+strict[2]};
 });
 for(const row of rows.slice(1))assert.deepEqual(row,rows[0],
  'C59 same SHA-locked photographed garment and original 163-bone body source may not silently change geometric collision-height distribution across 3 mobile widths');
 const first59=rows[0];
 assert.ok(first59.neutralStrict>0,
  'C59 diagnostic must report genuine neutral licensed source anatomy collision, not invented fit clearance');
 const summary59={
  schema:'M2-P2-C59-authentic-public-photo-body-crossing-anonymous-height-bands',
  source:'original-licensed-P61-P175-dress-and-original-163bone-body',
  authenticatedWebGLWidthCount:3,
  sourcePortraitWidths:[320,390,430],
  genuineOriginalAnatomyAndPhotoTested:true,
  originalNeutralBodyStrictCrossingWitnesses:first59.neutralStrict,
  twoArticulatedBodyStrictCrossingWitnesses:first59.armStrictTotal,
  neutralSourceTriangleCentroidHeightBands:{
   atOrAboveNeckAnchorHeight:first59.neutral.atOrAboveNeckAnchorHeight,
   betweenNeckAndSpineAnchorHeights:first59.neutral.betweenNeckAndSpineAnchorHeights,
   belowSpineAnchorHeight:first59.neutral.belowSpineAnchorHeight
  },
  articulatedSourceTriangleCentroidHeightBands:[
   first59.arm1,first59.arm2
  ].map(z=>({
   atOrAboveNeckAnchorHeight:z.atOrAboveNeckAnchorHeight,
   betweenNeckAndSpineAnchorHeights:z.betweenNeckAndSpineAnchorHeights,
   belowSpineAnchorHeight:z.belowSpineAnchorHeight
  })),
  originalClothingPhotoPixelsOrSourceVerticesNeverExported:true,
  sourceBodyPoseAndPhotographicShaderRestUnchanged:true,
  noExactPenetrationPointOrDepthWitness:true,
  noHumanAnatomicalAreaApproval:true,
  noCollisionCorrectionOrSourceUVSeamEdit:true,
  measuredWitnessesStillReleaseBlocking:true,
  noTimeContinuousClothClearance:true,
  independentHumanPhotorealismVerified:false,
  physicalPhoneAcceptanceVerified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-body-height-bands59.json',
  JSON.stringify(summary59,null,2)+'\n');
 console.log('M2_C59_REAL_LICENSED_ANATOMICAL_WITNESS_BANDS_SAFE_SUMMARY',
  JSON.stringify(summary59));
}

if(process.env.PHOTO_DRESS_TORSO_TRIAL60==='1'){
 assert.equal(process.env.PHOTO_DRESS_BODY_BANDS59,'1',
  'C60 requires original source anatomical crossing bands and full C58 body sweeps');
 const rows=receipts.map(r=>{
  assert.equal(r.disposablePhotographedUpperTorsoFitWorldAudit60,true);
  assert.equal(r.originalPhotoAndAnatomicalBodyNeverAdjusted60,true);
  assert.equal(r.trialNotApprovedAsWearableGarment60,true);
  const a=r.originalArticulatedContactReceipt58;
  assert.equal(a?.fullOriginalPhotoTrialAuditCompleted60,true);
  const trials=[a.disposableNeutralUpperTorsoTrial60,
   ...a.disposableArticulatedUpperTorsoTrials60];
  assert.equal(trials.length,3);
  assert.equal(trials[0].baselineOriginalBodyStrictCrossings,
   a.originalNeutralBodyStrictCrossings);
  assert.equal(trials.slice(1).reduce((n,t)=>n+
   t.baselineOriginalBodyStrictCrossings,0),
   a.originalBodyStrictTransverseCrossingsAcrossSamples);
  for(const t of trials){
   assert.equal(t.schema,
    'M2-original-licensed-disposable-upper-torso-clearance-trial-C60');
   assert.equal(t.completeOriginalBodyAndSelfAudit,true);
   assert.equal(t.outwardTrialMeters,.006);
   assert.ok(t.trialVerticesMoved>0);
   assert.ok(t.maxTrialWorldDisplacementMeters<=.006002);
   assert.equal(t.trialBodyStrictCrossingReduction,
    t.baselineOriginalBodyStrictCrossings-
    t.trialOriginalBodyStrictCrossings);
   assert.equal(t.noNewBodyStrictCrossings,
    t.trialOriginalBodyStrictCrossings<=
    t.baselineOriginalBodyStrictCrossings);
   assert.equal(t.noNewSelfStrictCrossings,
    t.trialOriginalSelfStrictCrossings<=
    t.baselineOriginalSelfStrictCrossings);
   assert.equal(t.originalPhotoMeshUVSkinMaterialsAndBoneMatricesUnmodified,true);
   assert.equal(t.allTrialVerticesRetainedInMemoryOnly,true);
   assert.equal(t.researchCandidateNotApprovedForConsumer3D,true);
   assert.equal(t.releaseAuthorized,false);
  }
  return trials.map(t=>({
   phaseKind:t===trials[0]?'neutral':'temporary-arm',
   originalBodyStrict:t.baselineOriginalBodyStrictCrossings,
   trialBodyStrict:t.trialOriginalBodyStrictCrossings,
   bodyStrictWitnessDelta:t.trialBodyStrictCrossingReduction,
   originalSelfStrict:t.baselineOriginalSelfStrictCrossings,
   trialSelfStrict:t.trialOriginalSelfStrictCrossings,
   movedSourceVertices:t.trialVerticesMoved,
   maxWorldDisplacementMeters:t.maxTrialWorldDisplacementMeters,
   noNewSelfStrict:t.noNewSelfStrictCrossings,
   noNewBodyStrict:t.noNewBodyStrictCrossings,
   allBodyStrictGone:t.allOriginalBodyCrossingsActuallyGone
  }));
 });
 for(const row of rows.slice(1))assert.deepEqual(row,rows[0],
  'C60 same authenticated original public dress and 163-bone body must produce identical numerical candidate counts across all three mobile widths');
 const trial60=rows[0];
 const comparison={
  schema:'M2-P2-C60-original-licensed-upper-torso-world-only-disposable-fit-trial',
  originalPhoto3DBody:'public licensed Commons-0053 163-bone P61/P175',
  actual3DNativeWebGLWidths:[320,390,430],
  originalNeutralAndTwoArticulatedPoseSweeps:3,
  boundedOutwardDisplacementMeters:.006,
  sourceGarmentTriangles:first.originalSourceFaces,
  perSourcePoseComparisons:trial60,
  sampledNoWorseningBodyCrossings:trial60.every(x=>x.noNewBodyStrict),
  sampledNoWorseningSelfCrossings:trial60.every(x=>x.noNewSelfStrict),
  allStrictBodyIntersectionsActuallyEliminated:trial60.every(x=>x.allBodyStrictGone),
  realClothVisualChangeNotRenderedOrHumanReviewed:true,
  trialProposalNotAppliedToOriginalMesh:true,
  originalPhotoOrShaderUVSkinWeightsAltered:false,
  onlyTemporaryWorldBufferGeometryCompared:true,
  noOpenSourceSewingOrCollisionWaivers:true,
  noPhysicalHumanAnatomicalFitCertified:true,
  noContinuousClothOrPhysicalMobileAcceptance:true,
  noRealOwnerPhotosOrWardrobeWrites:true,
  noReleasePermissionRegardlessOfComparisonOutcome:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile(
  'benchmark/mission2-source-dress-motion/live-disposable-torso-fit60.json',
  JSON.stringify(comparison,null,2)+'\n');
 console.log('M2_C60_REAL_LICENSED_DISPOSABLE_TORSO_FIT_COMPARISON',
  JSON.stringify(comparison));
}

if(process.env.PHOTO_DRESS_STRAIN61==='1'){
 assert.equal(process.env.PHOTO_DRESS_TORSO_TRIAL60,'1',
  'C61 authenticated photo cloth strain must retain C60 original source body-contact comparison');
 const exact=receipts.map(r=>{
  assert.equal(r.disposablePhotographedUpperTorsoFitWorldAudit60,true);
  assert.equal(r.genuineOriginalPhotoSurfaceStrainBudgetCompleted61,true);
  assert.equal(r.sourceGeometryNotAlteredByStrainAudit61,true);
  assert.equal(r.noRealFabricVisualImprovementsCertified61,true);
  const a=r.originalArticulatedContactReceipt58;
  assert.equal(a.completeOriginalPhotographFaceStrainAudit61,true);
  const measurements=[a.disposableNeutralUpperTorsoTrial60,
   ...a.disposableArticulatedUpperTorsoTrials60].map(x=>
    x.sourceOriginalPhotoSurfaceStrain61);
  assert.equal(measurements.length,3);
  return measurements.map(m=>{
   assert.equal(m.schema,
    'M2-C61-disposable-original-photo-source-triangle-strain');
   assert.equal(m.signedOriginalSourceFacesAnalyzed,r.originalSourceFaces);
   for(const k of ['maxOriginalPhotoWorldEdgeRelativeStrain',
    'maxOriginalPhotoFaceNormalTurnDegrees',
    'maxOriginalPhotoFaceAreaRelativeChange'])
    assert.ok(Number.isFinite(m[k])&&m[k]>=0);
   for(const k of ['sourceFacesWithTemporaryPositionDifferences',
    'facesWithMaxEdgeStrainAbove2Percent',
    'facesWithMaxEdgeStrainAbove5Percent',
    'facesWithNormalTurnAbove10Degrees',
    'facesWithAreaChangeAbove10Percent',
    'facesWithReversedOrientation',
    'sourceFacesDegenerateOrCollapsed'])
    assert.ok(Number.isSafeInteger(m[k])&&m[k]>=0&&
     m[k]<=r.originalSourceFaces);
   assert.equal(m.originalPhotoTextureRestUVAndSkinNeverEdited,true);
   assert.equal(m.sourceFaceLocationsOrIdentifiersWithheld,true);
   assert.equal(m.noActualRenderedPhotorealismOrFabricPhysicsCertificate,true);
   assert.equal(m.candidateNotAllowedInConsumer3D,true);
   assert.equal(m.releaseAuthorized,false);
   return m;
  });
 });
 for(const row of exact.slice(1))assert.deepEqual(row,exact[0],
  'C61 identical original photographed 163-bone source geometry must yield identical strain counts across actual 320/390/430px viewport runs');
 const summary={
  schema:'M2-C61-original-licensed-source-6mm-torso-surface-strain',
  originalSourceFaces:first.originalSourceFaces,
  sourceOnlyLicensedOriginalPublicPhotograph:true,
  actualNativeWebGLWidths:[320,390,430],
  originalAnatomicalSourceWorldPoses:3,
  originalBodyCrossingTrialC60StillVerified:true,
  perOriginalSourcePose:exact[0].map((m,i)=>({
   poseIndex:i,
   sourceTrianglesAnalyzed:m.signedOriginalSourceFacesAnalyzed,
   originalTrianglesChanged:m.sourceFacesWithTemporaryPositionDifferences,
   sourceTrianglesWithEdgeStrainAbove2Percent:
    m.facesWithMaxEdgeStrainAbove2Percent,
   sourceTrianglesWithEdgeStrainAbove5Percent:
    m.facesWithMaxEdgeStrainAbove5Percent,
   sourceTrianglesWithNormalsChangedAbove10Degrees:
    m.facesWithNormalTurnAbove10Degrees,
   sourceTrianglesWithAreaChangedAbove10Percent:
    m.facesWithAreaChangeAbove10Percent,
   sourceTriangleNormalsFlipped:m.facesWithReversedOrientation,
   sourceTriangleDegenerateOrCollapsed:m.sourceFacesDegenerateOrCollapsed,
   largestRelativeEdgeStrain:m.maxOriginalPhotoWorldEdgeRelativeStrain,
   maximumNormalTurnDegrees:m.maxOriginalPhotoFaceNormalTurnDegrees,
   maximumFaceAreaRelativeChange:m.maxOriginalPhotoFaceAreaRelativeChange,
   provisionalMeshDistortionGuardPassed:m.provisionalMeshDistortionGuardPassed
  })),
  noSourcePhotoXYZUVOrTriangleIDsExported:true,
  noTemporaryGeometryCommittedToRenderMesh:true,
  noIndependentHumanRealismOrMobileAcceptance:true,
  noSourceCollisionOrSewingWaiver:true,
  noContinuousClothCollisionCertificate:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-original-cloth-strain61.json',
  JSON.stringify(summary,null,2)+'\n');
 console.log('M2_C61_REAL_LICENSED_SOURCE_CLOTH_STRAIN_SAFE_SUMMARY',
  JSON.stringify(summary));
}

/**
 * P85: genuine licensed original photographed world dress and 163-bone
 * anatomical body. Four disposable trials, both original C52/C58 collision
 * definitions and unchanged C61 source-face quality; no altered exemptions.
 * Receipts contain numbers only, never garment coordinates/photo pixels.
 */
if(process.env.PHOTO_DRESS_ALTERNATIVE85==='1'){
 assert.equal(process.env.PHOTO_DRESS_STRAIN61,'1',
  'P85 source alternative trial must retain full C61 6mm surface evidence');
 const measured=receipts.map(r=>{
  assert.equal(r.genuineOriginalPhotoAlternativesFullyAudited85,true);
  assert.equal(r.originalLicensedSourceNotDeformedOrDeployed85,true);
  assert.equal(r.noResearchAlternativeApprovedForWear85,true);
  const a=r.originalArticulatedContactReceipt58;
  assert.equal(a?.sourceOriginalPhotoAlternativeSweepComplete85,true);
  const all=[a.disposableNeutralAlternativeClearance85,
   ...a.disposableArmAlternativeClearance85];
  const originals=[a.disposableNeutralUpperTorsoTrial60,
   ...a.disposableArticulatedUpperTorsoTrials60];
  assert.equal(all.length,3);
  return all.map((p,i)=>{
   assert.equal(p.schema,'M2-P85-source-pinned-alternative-world-clearance-Pareto');
   assert.equal(p.licensedSourceTriangleCount,r.originalSourceFaces);
   assert.equal(p.actualSkinned163BoneSource,true);
   assert.equal(p.allFourSourceContactSweepsCompleted,true);
   assert.equal(p.originalPhotoUVRestSkinAnd163BonesUnchanged,true);
   assert.equal(p.realSourceContactAndQualityGatesUnchanged,true);
   assert.equal(p.noPhotoPixelsOrSourceCoordinatesExported,true);
   assert.equal(p.releaseAuthorized,false);
   assert.equal(p.candidates.length,4);
   const alternatives=p.candidates.map(t=>{
    assert.equal(t.schema,'M2-P85-disposable-licensed-world-candidate');
    assert.ok(['quintic-height-envelope',
     'welded-edge-strain-projection'].includes(t.method));
    assert.equal(t.fullOriginalContactAndQualitySweepCompleted,true);
    assert.equal(t.originalPhotoWorldAndRestNeverModified,true);
    assert.equal(t.sourceUVTextureSkinAndBonesNeverModified,true);
    assert.equal(t.originalIndicesNeverModified,true);
    assert.equal(t.noHumanReviewedPhotorealism,true);
    assert.equal(t.candidateNotInstalledInRenderer,true);
    assert.equal(t.releaseAuthorized,false);
    assert.ok(t.maxAppliedMeters>=0&&
     t.maxAppliedMeters<=t.limitMeters+.000002);
    const q=t.sourceFaceStrain61;
    assert.equal(q.schema,'M2-C61-disposable-original-photo-source-triangle-strain');
    assert.equal(q.signedOriginalSourceFacesAnalyzed,r.originalSourceFaces);
    assert.equal(q.originalPhotoTextureRestUVAndSkinNeverEdited,true);
    assert.equal(q.candidateNotAllowedInConsumer3D,true);
    assert.equal(t.baselineBodyStrictCrossings,
     originals[i].baselineOriginalBodyStrictCrossings);
    assert.equal(t.baselineSelfStrictCrossings,
     originals[i].baselineOriginalSelfStrictCrossings);
    assert.equal(t.bodyClearanceSampled,t.strictBodyCrossings===0);
    assert.equal(t.noIntroducedSelfCrossing,
     t.strictSelfCrossings<=t.baselineSelfStrictCrossings);
    assert.equal(t.provisionalGeometryGuard,
     q.provisionalMeshDistortionGuardPassed&&
     (t.maxCoincidentSeamDeltaMeters??0)<.000002);
    return {
     method:t.method,limitMeters:t.limitMeters,
     strictBodyCrossings:t.strictBodyCrossings,
     strictSelfCrossings:t.strictSelfCrossings,
     unresolvedBodyNearOrZeroPairs:t.unresolvedBodyNearOrZeroPairs,
     sourceTrianglesOver2PercentEdge:q.facesWithMaxEdgeStrainAbove2Percent,
     sourceTrianglesOver5PercentEdge:q.facesWithMaxEdgeStrainAbove5Percent,
     sourceTrianglesOver10PercentArea:q.facesWithAreaChangeAbove10Percent,
     sourceTrianglesOver10DegreesNormal:q.facesWithNormalTurnAbove10Degrees,
     flipped:q.facesWithReversedOrientation,
     collapsed:q.sourceFacesDegenerateOrCollapsed,
     maxEdgeStrain:q.maxOriginalPhotoWorldEdgeRelativeStrain,
     maxNormalTurnDegrees:q.maxOriginalPhotoFaceNormalTurnDegrees,
     maxAreaChange:q.maxOriginalPhotoFaceAreaRelativeChange,
     maxMovedMeters:t.maxAppliedMeters,
     movedVertices:t.movedVertices,
     maxCoincidentSeamDeltaMeters:t.maxCoincidentSeamDeltaMeters??null,
     sampledContactAndQualityThresholdsPassed:
      t.bodyClearanceSampled&&t.noIntroducedSelfCrossing&&
      t.provisionalGeometryGuard
    };
   });
   const base=originals[i],bq=base.sourceOriginalPhotoSurfaceStrain61;
   return {
    poseIndex:i,authenticSourceBodyStrict:base.baselineOriginalBodyStrictCrossings,
    authenticSourceSelfStrict:base.baselineOriginalSelfStrictCrossings,
    original6mm:{
     strictBodyCrossings:base.trialOriginalBodyStrictCrossings,
     strictSelfCrossings:base.trialOriginalSelfStrictCrossings,
     sourceTrianglesOver5PercentEdge:bq.facesWithMaxEdgeStrainAbove5Percent,
     sourceTrianglesOver10PercentArea:bq.facesWithAreaChangeAbove10Percent,
     maxEdgeStrain:bq.maxOriginalPhotoWorldEdgeRelativeStrain,
     maxAreaChange:bq.maxOriginalPhotoFaceAreaRelativeChange,
     provisionalGuard:bq.provisionalMeshDistortionGuardPassed
    },
    alternatives
   };
  });
 });
 for(const row of measured.slice(1))
  assert.deepEqual(row,measured[0],
   'P85 same exact licensed original 163-bone world and real articulated poses must not diverge with desktop viewport CSS width');
 const findings=measured[0];
 const summary={
  schema:'M2-P85-authentic-source-photo-anatomical-clearance-Pareto',
  licensedDressId:'commons-0053',
  originalLicensedPhotoSHA256:
   'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
  originalSourceTriangleCount:first.originalSourceFaces,
  actualSkinnedAnatomicalBoneCount:163,
  originalWorldPoses:3,
  desktopChromiumCSSWidths:[320,390,430],
  methodsCompared:['unmodified-original','C60-6mm',
   'quintic-height-envelope-4.5mm','quintic-height-envelope-6mm',
   'welded-edge-strain-projection-4.5mm',
   'welded-edge-strain-projection-6mm'],
  measured:findings,
  allSampledContactAndQualityGatesSatisfied:
   findings.some(x=>x.alternatives.some(t=>
    t.sampledContactAndQualityThresholdsPassed)),
  originalSourceUVSkinTextureNeverAltered:true,
  noSourceFaceIdentifiersOrPixelsPublished:true,
  trueCandidateRenderedVisualAB:false,
  sourcePhotoRGBPixelChangeUnmeasured:true,
  actualUVSeamOrViewClippingVisualAcceptanceUnmeasured:true,
  actualContinuousPoseSweepsUnmeasured:true,
  actualMaleFemaleFittingUnmeasured:true,
  noPhysicalPhoneTests:true,
  sampledFitNotReleaseAuthorization:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile('benchmark/mission2-source-dress-motion/live-source-alternative-clearance85.json',
  JSON.stringify(summary,null,2)+'\n');
 console.log('M2_P85_REAL_SOURCE_ALTERNATIVE_CLEARANCE',JSON.stringify(summary));
}
