/**
 * Launch exactly the pinned original P89 real-Met-JPEG + real dual-163bone
 * Chromium/WebKit runner with additive in-memory original skinned pose proof.
 * Do not modify the original experimental module, original test or source.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const pins={
 runner:'5f999c1dc440539cec143f7c7de48b8fe88dd91e',
 registration:'b211d807c0ccc3c4a7b0eeec339f23bb4692afcb',
 addon:'49d5fcdec63be3544af8b76ac090d12a9e6a71af'
};
const sha=b=>createHash('sha1').update('blob '+Buffer.byteLength(b)+'\0')
 .update(b).digest('hex');
const runner=await readFile(
 'scripts/test-parallel89-met-real-163bone-anatomy-study.mjs','utf8');
const original=await readFile(
 'research/parallel89/met-original-163bone-uncalibrated-registration89.mjs','utf8');
const addon=await readFile(
 'research/parallel89/real-original-simultaneous-spine03-spine04-browser-addon89.mjs','utf8');
assert.equal(sha(runner),pins.runner,
 'original authentic photo original real anatomy browser test mutated');
assert.equal(sha(original),pins.registration,
 'original authentic photo original 163bone registration mutated');
const donor=await readFile(
 'research/parallel89/donor-original-camera-axis-body-contact89.mjs','utf8');
assert.equal(sha(donor),'bb31af8ff4e7f401d5c5cf33b6e1754f1b3e054a',
 'independent original camera-axis ray/body donor source drift');
assert.equal(sha(addon),pins.addon,
 'original additive native rotation witness mutated');

// These inserts exist ONLY in a disposable generated script: no protected
// research files are edited, no consumer or other parallel assignment touched.
const routeAnchor=" await page.goto(origin,{waitUntil:'load'});";
const routeLines=[
 "  await page.route('**/research/parallel89/met-original-163bone-uncalibrated-registration89.mjs',",
 "   async route=>{",
 "    const originalSource=await readFile('research/parallel89/met-original-163bone-uncalibrated-registration89.mjs','utf8');",
 "    const addonSource=await readFile('research/parallel89/real-original-simultaneous-spine03-spine04-browser-addon89.mjs','utf8');",
 "    const blobSha=t=>createHash('sha1').update('blob '+Buffer.byteLength(t)+'\\0').update(t).digest('hex');",
 "    assert.equal(blobSha(originalSource),'b211d807c0ccc3c4a7b0eeec339f23bb4692afcb');",
 "    assert.equal(blobSha(addonSource),'49d5fcdec63be3544af8b76ac090d12a9e6a71af');",
 "    await route.fulfill({status:200,contentType:'text/javascript',body:originalSource+'\\n'+addonSource});",
 "   });",
 routeAnchor
].join('\n');
const poseAnchor="  const rest=await page.evaluate(()=>window.__M2RealRigPhotoTrial\n   .setSourceSkinnedMotionTrialPose('rest'));";
const verifyLines=[
 "   const trial=await page.evaluate(()=>window.__M2RealRigPhotoTrial",
 "    .verifyTrueConcurrentSpine03Spine04OriginalSurface());",
 "   assert.equal(trial.realOriginalLicensedRigKind,kind);",
 "   assert.equal(trial.originalLicensed163boneGLBSHA256,rigHashes[kind]);",
 "   assert.equal(trial.originalJPEG_SHA256,hash(image));",
 "   assert.equal(trial.originalDecodedRGB_SHA256,shell.originalDecodedRGBSHA256);",
 "   assert.equal(trial.realOriginalFrontFaces,35262);",
 "   assert.equal(trial.realOriginalBodyFaces,109064);",
 "   assert.equal(trial.realOriginalFrontVertices,17985);",
 "   assert.equal(trial.realOriginalBodyVertices,72771);",
 "   assert.equal(trial.originalGridRealJointAnglePairsDegrees.length,9);",
 "   assert.deepEqual(trial.originalSimultaneousPathJointAnglePairsDegrees,",
 "    [[-6,-12],[-3,-6],[0,0],[3,6],[6,12]]);",
 "   assert.deepEqual(trial.independentOriginalOffDiagonalPosePairsDegrees,",
 "    [[-3,6],[3,-6]]);",
 "   assert.equal(trial.actualOriginalCorrectedXYZRatherThanZeroSeed,true);",
 "   assert.ok(trial.originalCorrectedVsHistoricalZeroSeedDistanceRigUnits>.0001);",
 "   assert.equal(trial.other161BoneLocalPoseTransformsImmutable,true);",
 "   const proportions=trial.sampledOriginalFrontProportionAudit;",
 "   assert.equal(proportions.sampledPoseCount,16);",
 "   assert.equal(proportions.originalFrontFaces,35262);",
 "   assert.ok(proportions.uniqueOriginalFrontEdges>35262);",
 "   assert.equal(proportions.sampledPoseDistortion.length,16);",
 "   assert.ok(proportions.sampledPoseDistortion.every(p=>",
 "    Number.isFinite(p.maximumEdgeLengthRatio)&&Number.isFinite(p.maximumTriangleAreaRatio)));",
 "   assert.equal(proportions.sampledPoseDistortion[4].minimumEdgeLengthRatio,1);",
 "   assert.equal(proportions.sampledPoseDistortion[4].maximumTriangleAreaRatio,1);",
 "   assert.equal(proportions.sampledPoseDistortion[4].edgesOutsideResearchBand,0);",
 "   assert.equal(proportions.continuousMotionOrMaterialStrainCertified,false);",
 "   assert.equal(proportions.consumer3DAdmitted,false);",
 "   assert.equal(proportions.familyAlpha,'HOLD');",
 "   const correction=trial.sampledWorstPoseBoundedCorrection;",
 "   assert.ok(Number.isInteger(correction.worstPoseIndex)&&correction.worstPoseIndex>=0&&correction.worstPoseIndex<16);",
 "   assert.equal(correction.correctionAppliedToLiveMesh,false);",
 "   assert.equal(correction.materialOrCollisionCertified,false);",
 "   assert.equal(correction.consumer3DAdmitted,false);",
 "   assert.equal(correction.correctedPose,undefined);",
 "   assert.ok(correction.before.worstOriginalEdge.vertexIndices.every(i=>i>=0&&i<17985));",
 "   assert.ok(correction.before.worstOriginalFace.faceOrdinal<35262);",
 "   if(correction.decision==='RESEARCH_ONLY_BOUNDED_EDGE_CORRECTION_CANDIDATE'){",
 "    assert.ok(correction.maximumEndpointDisplacementRigUnits<=.02*correction.before.worstOriginalEdge.restLength);",
 "    assert.ok(correction.after.collapsedFaces<=correction.before.collapsedFaces);",
 "   }else assert.ok(['RESEARCH_ONLY_NO_SAFE_EDGE_CORRECTION_ATTEMPT','RESEARCH_ONLY_CORRECTION_REJECTED_NO_GLOBAL_IMPROVEMENT'].includes(correction.decision));",
 "   const coordinated=trial.sampledWorstPoseCoordinatedCorrection;",
 "   assert.equal(coordinated.worstPoseIndex,correction.worstPoseIndex);",
 "   assert.equal(coordinated.correctionAppliedToLiveMesh,false);",
 "   assert.equal(coordinated.materialOrCollisionCertified,false);",
 "   assert.equal(coordinated.consumer3DAdmitted,false);",
 "   assert.equal(coordinated.correctedPose,undefined);",
 "   if(coordinated.decision==='RESEARCH_ONLY_COORDINATED_CORRECTION_CANDIDATE'){",
 "    assert.ok(coordinated.maximumVertexStepFractionOfShortestIncidentRestEdge<=.020000000001);",
 "    const accepted=coordinated.trials.at(-1);",
 "    assert.equal(accepted.newBadEdges,0);assert.equal(accepted.newBadFaces,0);",
 "    assert.equal(accepted.flippedOrOrthogonalFaces,0);",
 "   }else assert.ok(['RESEARCH_ONLY_NO_COORDINATED_CORRECTION_ATTEMPT','RESEARCH_ONLY_COORDINATED_CORRECTION_REJECTED'].includes(coordinated.decision));",
 "   const progressive=trial.sampledWorstPoseProgressiveStabilization;",
 "   assert.equal(progressive.worstPoseIndex,correction.worstPoseIndex);",
 "   assert.equal(progressive.correctionAppliedToLiveMesh,false);",
 "   assert.equal(progressive.materialOrCollisionCertified,false);",
 "   assert.equal(progressive.consumer3DAdmitted,false);",
 "   assert.equal(progressive.correctedPose,undefined);",
 "   assert.ok(progressive.maximumCumulativeTravelFraction<=.05);",
 "   assert.ok(progressive.passes.length<=6);",
 "   assert.ok(progressive.passes.every(p=>p.maximumCumulativeTravelFraction<=.05));",
 "   assert.ok(['RESEARCH_ONLY_PROGRESSIVE_STABILIZATION_CANDIDATE','RESEARCH_ONLY_PROGRESSIVE_STABILIZATION_REFUSED'].includes(progressive.decision));",
 "   assert.equal(progressive.familyAlpha,'HOLD');",
 "   const audit=trial.trueSimultaneousTwoJointFullIndexedAudit;",
 "   assert.equal(audit.originalFrontFaceCount,35262);",
 "   assert.equal(audit.originalBodyFaceCount,109064);",
 "   assert.equal(audit.originalFrontVertexCount,17985);",
 "   assert.equal(audit.originalBodyVertexCount,72771);",
 "   assert.deepEqual(audit.originalMovingJoints,['spine03','spine04']);",
 "   assert.equal(audit.originalGrid3x3BothActualBonesPoseBuffersPresent,true);",
 "   assert.equal(audit.originalIndependentNonDiagonalPoseHoldoutsVerified,true);",
 "   assert.equal(audit.allSubmittedOriginalFacesIndexed,true);",
 "   assert.ok(audit.maxTwoAngleHarmonicResidualRigUnits<1e-5);",
 "   assert.ok(audit.maxConservativeEnvelopeInflationRigUnits>0);",
 "   assert.ok(audit.minimumOriginalFrontDoubleAreaRigUnitsSquared>1e-12);",
 "   assert.ok(audit.minimumOriginalBodyDoubleAreaRigUnitsSquared>1e-12);",
 "   assert.equal(audit.allOriginalBodyFacesPresentInSweptBVH,true);",
 "   assert.equal(audit.fullOriginalTwoJointSimultaneousPathSweptBroadphaseCompleted,true);",
 "   assert.equal(audit.arbitrary2DJointAngleRectangleAudited,false);",
 "   assert.equal(audit.decision,",
 "    'RESEARCH_ONLY_FULL_INDEXED_SIMULTANEOUS_TWO_JOINT_PATH_ENVELOPES_DISJOINT');",
 "   assert.equal(audit.consumer3DAdmitted,false);",
 "   assert.equal(trial.sourcePhotoFrontFloatingWithoutPhysicalCalibratedFit,true);",
 "   assert.equal(trial.simultaneousMotionConstrainedToSingleDiagonalJointAnglePath,true);",
 "   assert.equal(trial.originalPhoto2DFallbackRequired,true);",
 "   const rectangle=trial.independentTwoAngleRectangleOriginalFullFaceAudit;",
 "   assert.ok(rectangle);",
 "   assert.equal(rectangle.originalFullFrontFaces,35262);",
 "   assert.equal(rectangle.originalFullBodyFaces,109064);",
 "   assert.equal(rectangle.entireTwoAngleRectangleIncluded,true);",
 "   assert.equal(rectangle.cells,4);",
 "   assert.ok(rectangle.verifiedOffDiagonalMaxResidualRigUnits<1e-5);",
 "   assert.ok(rectangle.decision.startsWith('BLOCKED_')||",
 "    rectangle.decision.startsWith('RESEARCH_ONLY_'));",
 "   assert.equal(rectangle.consumer3DAdmitted,false);",
 "   assert.equal(rectangle.familyAlpha,'HOLD');",
 "   const witness=trial.originalRectangleFirstWitnessExactPoseContactTriage;",
 "   assert.equal(witness.sourcePoseSamples,5);",
 "   assert.equal(witness.actualOriginalGridCornersExamined,4);",
 "   assert.equal(witness.actualOriginalIndependentCellCentersExamined,1);",
 "   assert.equal(witness.genuineOriginalIndexedFacePairsExamined,1);",
 "   assert.equal(witness.originalFrontIndexedFace,rectangle.originalWitness.frontFace);",
 "   assert.equal(witness.originalBodyIndexedFace,rectangle.originalWitness.bodyFace);",
 "   assert.equal(witness.rectangleCell,rectangle.originalWitness.cell);",
 "   assert.equal(witness.firstWitnessSampledOriginalPoseContacts.length,5);",
 "   assert.ok(witness.firstWitnessSampledOriginalPoseContacts.every(p=>",
 "    ['NONE','INDETERMINATE','TOUCHING','COPLANAR_OVERLAP','CROSSING']",
 "    .includes(p.contactClass)));",
 "   assert.ok(witness.decision.startsWith('BLOCKED_'));",
 "   assert.equal(witness.fullOriginalRectangularSweepContactResolved,false);",
 "   assert.equal(witness.consumer3DAdmitted,false);",
 "   assert.equal(witness.familyAlpha,'HOLD');",
 "   const dimensions=trial.museumOriginalPartARealPhysicalDimensionEvidence;",
 "   assert.equal(dimensions.reason,'REAL_CATALOGUED_GARMENT_PART_A_DIMENSIONS_ONLY');",
 "   assert.equal(dimensions.sourceMuseumCollectionObjectId,70759);",
 "   assert.equal(dimensions.sourceOriginalMuseumImageId,2551406);",
 "   assert.equal(dimensions.sourceOriginalImageSHA256,hash(image));",
 "   assert.equal(dimensions.sourceDecodedOriginalRGB_SHA256,shell.originalDecodedRGBSHA256);",
 "   assert.equal(dimensions.measuredPhysicalPart,'a');",
 "   assert.deepEqual(dimensions.physicalGarmentPartADimensionsMillimeters,{",
 "    length:990.6,bottomWidth:1333.5,waistBandWidthExcludingLoopButton:723.9});",
 "   assert.equal(dimensions.projectedImageContourNotMatchedToMeasuredSeamLandmarks,true);",
 "   assert.equal(dimensions.localPhotoMillimetersPerPixel,null);",
 "   assert.equal(dimensions.photoToOriginalRigUnitsPerMillimeter,null);",
 "   assert.equal(dimensions.consumer3DAdmitted,false);",
 "   assert.equal(dimensions.familyAlpha,'HOLD');",
 "   const plane=trial.unmeasuredOriginalMuseumFivePointPhotoPlane;",
 "   assert.equal(plane.status,'NOT_PHYSICALLY_CALIBRATED');",
 "   assert.equal(plane.reason,'BLOCKED_MISSING_PHOTO_AND_PLANE_REVIEW');",
 "   assert.equal(plane.originalGarmentPhysicalPixelScaleMmPerPixel,null);",
 "   assert.equal(plane.photographedGarmentToAvatarRigUnitsPerMillimeter,null);",
 "   assert.equal(plane.independentMeasuredRealWorldSourceGeometryCertified,false);",
 "   assert.equal(plane.consumer3DAdmitted,false);",
 "   assert.equal(plane.familyAlpha,'HOLD');",
 "   const measuredFit=trial.originalGarmentToBodyMeasuredWearerFitGate;",
 "   assert.equal(measuredFit.decision,'BLOCKED_NO_REAL_GARMENT_OR_WEARER_MEASUREMENTS');",
 "   assert.equal(measuredFit.actualLicensed163BoneRigKind,kind);",
 "   assert.equal(measuredFit.sourceImageId,2551406);",
 "   assert.equal(measuredFit.actualOwnerMeasuredPhysicalFitCertified,false);",
 "   assert.equal(measuredFit.garmentToLicensedRigMeshFitted,false);",
 "   assert.equal(measuredFit.consumer3DAdmitted,false);",
 "   assert.equal(measuredFit.familyAlpha,'HOLD');",



 "   assert.equal(trial.consumer3DAdmitted,false);",
 "   assert.equal(trial.familyAlpha,'HOLD');",
 "   await writeFile(resultDir+browserName+'-'+kind+",
 "    '-ORIGINAL-SIMULTANEOUS-TWO-SPINE-BVH-RESEARCH-HOLD.json',",
 "    JSON.stringify(trial,null,2)+'\\n');",
 "   console.log('M2_TRUE_ORIGINAL_163BONE_SIMULTANEOUS_TWO_SPINE_FULL_FACE '+JSON.stringify({",
 "    engine:browserName,rig:kind,originalRigSHA256:rigHashes[kind],",
 "    originalFrontFaces:audit.originalFrontFaceCount,",
 "    originalBodyFaces:audit.originalBodyFaceCount,",
 "    originalFrontVertices:audit.originalFrontVertexCount,",
 "    originalBodyVertices:audit.originalBodyVertexCount,",
 "    harmonicOffDiagonalMaxResidual:audit.maxTwoAngleHarmonicResidualRigUnits,",
 "    inflatedRigUnits:audit.maxConservativeEnvelopeInflationRigUnits,",
 "    bodyBVHNodes:audit.originalBodyBVHNodes,",
 "    sweptBodyBVHVisits:audit.bodyBVHNodesVisited,",
 "    actualFullOriginalSweepComplete:audit.fullOriginalTwoJointSimultaneousPathSweptBroadphaseCompleted,",
 "    overlappingConservativeSweptFaceEnvelopes:audit.overlappingOriginalSimultaneousAngularEnvelopes,",
 "    decision:audit.decision,",
 "    entireTwoAngleRectangleAudited:rectangle.entireTwoAngleRectangleIncluded,",
 "    independentRectangleDecision:rectangle.decision,",
 "    originalWitnessPoseContactTriage:witness.decision,",
 "    originalWitnessDiscreteVerifiedContacts:witness.observedExactTriangleContactsAtSampledPoses,",
 "    realMetPublishedGarmentPartADimensionsMm:dimensions.physicalGarmentPartADimensionsMillimeters,",
 "    photoMillimetersPerPixel:dimensions.localPhotoMillimetersPerPixel,",
 "    photoToAvatarRigUnitsPerMm:dimensions.photoToOriginalRigUnitsPerMillimeter,",
 "    genuineOriginalPhotoPlaneFiducialDecision:plane.reason,",
 "    originalPhotoPlaneMetricMap:plane.originalGarmentPhysicalPixelScaleMmPerPixel,",
 "    originalWearerMetricBodyFitDecision:measuredFit.decision,",
 "    realOwnerMeasurementsPresent:!measuredFit.licensedOriginalRigNotPhysicalWearerMeasurement,",
 "    originalWitnessFiveTruePoseClasses:witness.firstWitnessSampledOriginalPoseContacts.map(p=>p.contactClass),",
 "    originalPhysicalFitCertified:false,consumer3DAdmitted:false,familyAlpha:'HOLD'",
 "   }));",
 poseAnchor
].join('\n');
assert.equal(runner.split(routeAnchor).length,2,'immutable original route moved');
assert.equal(runner.split(poseAnchor).length,2,'immutable original bone-pose test moved');
const derived=runner.replace(routeAnchor,routeLines)
 .replace(poseAnchor,verifyLines);
const generated=resolve(
 'scripts/.m2-concurrent-original-dual-spine-derived-only-test.mjs');
await writeFile(generated,derived);
try{
 const result=spawnSync(process.execPath,[generated,...process.argv.slice(2)],{
  stdio:'inherit',env:{...process.env},maxBuffer:24*1024*1024
 });
 if(result.error)throw result.error;
 if(result.signal)throw Error('original-real-rig-child-process-signal-'+result.signal);
 assert.equal(result.status,0,
  'protected original P89 real rig + source browser and added angular witness must both pass');
}finally{await unlink(generated);}
