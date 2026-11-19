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
 addon:'51631098009dad3fc4902112feaef4f5bba5f5ea'
};
const sha=b=>createHash('sha1').update('blob '+Buffer.byteLength(b)+'\0')
 .update(b).digest('hex');
const runner=await readFile(
 'scripts/test-parallel89-met-real-163bone-anatomy-study.mjs','utf8');
const original=await readFile(
 'research/parallel89/met-original-163bone-uncalibrated-registration89.mjs','utf8');
const addon=await readFile(
 'research/parallel89/original-two-spine-native-pose-addon89.mjs','utf8');
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
 "    const addonSource=await readFile('research/parallel89/original-two-spine-native-pose-addon89.mjs','utf8');",
 "    const blobSha=t=>createHash('sha1').update('blob '+Buffer.byteLength(t)+'\\0').update(t).digest('hex');",
 "    assert.equal(blobSha(originalSource),'b211d807c0ccc3c4a7b0eeec339f23bb4692afcb');",
 "    assert.equal(blobSha(addonSource),'51631098009dad3fc4902112feaef4f5bba5f5ea');",
 "    await route.fulfill({status:200,contentType:'text/javascript',body:originalSource+'\\n'+addonSource});",
 "   });",
 routeAnchor
].join('\n');
const poseAnchor="  const rest=await page.evaluate(()=>window.__M2RealRigPhotoTrial\n   .setSourceSkinnedMotionTrialPose('rest'));";
const verifyLines=[
 "   const audit=await page.evaluate(()=>window.__M2RealRigPhotoTrial",
 "    .verifyOriginalTwoSpineSequentialFullFaces());",
 "   assert.equal(audit.realOriginalLicensedRigKind,kind);",
 "   assert.equal(audit.realLicensedRigOriginalSHA256,rigHashes[kind]);",
 "   assert.equal(audit.originalSourceJPEG_SHA256,hash(image));",
 "   assert.equal(audit.realOriginalFullPhotoFrontFaces,35262);",
 "   assert.equal(audit.realOriginalFullBodyFaces,109064);",
 "   assert.equal(audit.realOriginalFrontPosedVertices,17985);",
 "   assert.equal(audit.realOriginalBodyPosedVertices,72771);",
 "   assert.deepEqual(audit.realLicensedNamedMovingBones,['spine03','spine04']);",
 "   assert.equal(audit.actualJointOnlySequentialNotSimultaneous,true);",
 "   assert.equal(audit.originalSourceAndRigUnchanged,true);",
 "   assert.ok(audit.historicalRealSourceVsZeroSeedErrorRigUnits>.0001);",
 "   assert.equal(audit.originalCameraMetricCalibrationProved,false);",
 "   assert.equal(audit.actualMaterialClothDrapeCertified,false);",
 "   assert.equal(audit.consumer3DAdmitted,false);",
 "   const report=audit.piecewiseOriginalBodyFrontContactReport;",
 "   assert.equal(report.segmentCount,3);",
 "   assert.equal(report.segmentResults.length,3);",
 "   assert.equal(report.originalFrontFacesSubmittedPerSegment,35262);",
 "   assert.equal(report.originalBodyFacesSubmittedPerSegment,109064);",
 "   assert.equal(report.maximumBoundaryVertexMismatchRigUnits,0);",
 "   assert.deepEqual(report.actualNamedOriginalBonesMovedInDifferentSegments,",
 "    ['spine04','spine03']);",
 "   assert.equal(report.fixedAxisSingleMovingJointPerSegment,true);",
 "   assert.equal(report.simultaneousTwoJointMotionCertified,false);",
 "   assert.equal(report.completeArbitraryTwoJointMotionCertified,false);",
 "   assert.equal(report.consumer3DAdmitted,false);",
 "   assert.equal(report.familyAlpha,'HOLD');",
 "   assert.deepEqual(report.segmentResults.map(s=>s.movingOriginalLicensedBone),",
 "    ['spine04','spine03','spine04']);",
 "   assert.deepEqual(audit.actualOriginalNamedBoneMeasuredVertexDisplacements",
 "    .map(s=>s.realNamedMovingJoint),['spine04','spine03','spine04']);",
 "   for(const displacement of audit.actualOriginalNamedBoneMeasuredVertexDisplacements){",
 "    assert.ok(displacement.actualMaxOriginalFrontVertexMotionRigUnits>1e-6);",
 "    assert.ok(displacement.actualMaxOriginalAnatomyVertexMotionRigUnits>1e-6);",
 "   }",
 "   for(const segment of report.segmentResults){",
 "    assert.equal(segment.originalIndexedFaceScopeFromFullArrays,true);",
 "    assert.equal(segment.originalFrontFaceCount,35262);",
 "    assert.equal(segment.originalBodyFaceCount,109064);",
 "    assert.ok(segment.maximumQuarterPoseHarmonicResidualRigUnits<1e-5);",
 "    assert.ok(['RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT',",
 "     'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',",
 "     'BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT',",
 "     'BLOCKED_ANGULAR_EXACT_SAMPLE_BUDGET',",
 "     'BLOCKED_ANGULAR_FACE_PAIR_BUDGET',",
 "     'BLOCKED_ANGULAR_BVH_VISIT_BUDGET'].includes(segment.decision));",
 "    assert.equal(segment.consumer3DAdmitted,false);",
 "   }",
 "   assert.ok(['RESEARCH_ONLY_ORIGINAL_TWO_SPINE_PIECEWISE_FULL_FACE_SWEEPS_SEPARATED',",
 "    'BLOCKED_ORIGINAL_TWO_SPINE_SEQUENTIAL_REAL_CONTACT',",
 "    'BLOCKED_ORIGINAL_TWO_SPINE_SEQUENTIAL_UNRESOLVED_CONTACT',",
 "    'BLOCKED_ORIGINAL_TWO_SPINE_SEQUENTIAL_INCOMPLETE_RESOURCE_OR_MODEL']",
 "    .includes(report.decision));",
 "   assert.equal(report.originalPhotographCameraMetricScaleUnknown,true);",
 "   assert.equal(report.originalGarmentActualReverseUnobserved,true);",
 "   assert.equal(audit.familyAlpha,'HOLD');",
 "   await writeFile(resultDir+browserName+'-'+kind+",
 "    '-ORIGINAL-SPINE03-SPINE04-THREE-SEGMENT-FULL-ANGULAR-BVH-HOLD.json',",
 "    JSON.stringify(audit,null,2)+'\\n');",
 "   console.log('M2_AUTHENTIC_TWO_SPINE_SEQUENTIAL_ALL_ORIGINAL_FACE_SWEEPS '+JSON.stringify({",
 "    engine:browserName,rig:kind,rigSHA256:rigHashes[kind],",
 "    trueOriginalFaceCounts:[35262,109064],",
 "    actualNamedOriginalBones:['spine03','spine04'],",
 "    movedNamedBonesByLeg:report.segmentResults.map(s=>s.movingOriginalLicensedBone),",
 "    maxRealSegmentContinuityVertexError:report.maximumBoundaryVertexMismatchRigUnits,",
 "    maxActualQuarterPoseHarmonicResidual:report.maximumHarmonicQuarterPoseResidualRigUnits,",
 "    actualPerLegDecisions:report.segmentResults.map(s=>s.decision),",
 "    allThreeLegsFullSwept:report.completeAllThreeSequentialOriginalSweptSegments,",
 "    overallDecision:report.decision,",
 "    simultaneouslyAnimated:false,physicalFit:false,",
 "    consumer3DAdmitted:false,familyAlpha:'HOLD'",
 "   }));",
 poseAnchor
].join('\n');
assert.equal(runner.split(routeAnchor).length,2,'immutable original route moved');
assert.equal(runner.split(poseAnchor).length,2,'immutable original bone-pose test moved');
const derived=runner.replace(routeAnchor,routeLines)
 .replace(poseAnchor,verifyLines);
const generated=resolve(
 'scripts/.m2-original-two-spine-sequential-derived-only-test.mjs');
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
