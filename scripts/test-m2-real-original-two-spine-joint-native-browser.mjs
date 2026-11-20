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
 addon:'bec6091c48db680f9e416242c5c4ffe8a3b9e4da'
};
const sha=b=>createHash('sha1').update('blob '+Buffer.byteLength(b)+'\0')
 .update(b).digest('hex');
const runner=await readFile(
 'scripts/test-parallel89-met-real-163bone-anatomy-study.mjs','utf8');
const original=await readFile(
 'research/parallel89/met-original-163bone-uncalibrated-registration89.mjs','utf8');
const addon=await readFile(
 'research/parallel89/original-licensed-two-spine-sequential-browser-addon89.mjs','utf8');
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
 "    const addonSource=await readFile('research/parallel89/original-licensed-two-spine-sequential-browser-addon89.mjs','utf8');",
 "    const blobSha=t=>createHash('sha1').update('blob '+Buffer.byteLength(t)+'\\0').update(t).digest('hex');",
 "    assert.equal(blobSha(originalSource),'b211d807c0ccc3c4a7b0eeec339f23bb4692afcb');",
 "    assert.equal(blobSha(addonSource),'bec6091c48db680f9e416242c5c4ffe8a3b9e4da');",
 "    await route.fulfill({status:200,contentType:'text/javascript',body:originalSource+'\\n'+addonSource});",
 "   });",
 routeAnchor
].join('\n');
const poseAnchor="  const rest=await page.evaluate(()=>window.__M2RealRigPhotoTrial\n   .setSourceSkinnedMotionTrialPose('rest'));";
const verifyLines=[
 "   const trial=await page.evaluate(()=>window.__M2RealRigPhotoTrial",
 "    .verifyRealTwoSequentialSpineJointFullSurface());",
 "   assert.equal(trial.actualOriginalLicensedRigKind,kind);",
 "   assert.equal(trial.actualOriginalLicensedRigSHA256,rigHashes[kind]);",
 "   assert.equal(trial.originalPublicMuseumSourceJPEG_SHA256,hash(image));",
 "   assert.equal(trial.originalFrontIndexedFaceCount,35262);",
 "   assert.equal(trial.originalBodyIndexedFaceCount,109064);",
 "   assert.equal(trial.originalFrontSkinnedVertexCount,17985);",
 "   assert.equal(trial.originalBodySkinnedVertexCount,72771);",
 "   assert.equal(trial.authenticOriginalSkinnedLocalXYZNotZeroVector,true);",
 "   assert.ok(trial.historicalIncorrectZeroSeedDisplacementRigUnits>.0001);",
 "   assert.deepEqual(trial.originalNamedMovingJointsInOrder,['spine03','spine04']);",
 "   assert.deepEqual(trial.originalJointPoseSamplesInOrder.map(s=>s.anglesDeg),",
 "    [[-6,-3,0,3,6],[-12,-6,0,6,12]]);",
 "   assert.equal(trial.allOther161BoneLocalPosesFrozen,true);",
 "   const combined=trial.fullOriginalTwoSegmentAudits;",
 "   assert.equal(combined.continuousJoinVerifiedForEveryOriginalSourceAndBodyVertex,true);",
 "   assert.ok(combined.maximumOriginalPoseJoinXYZDifferenceRigUnits<1e-7);",
 "   assert.equal(combined.completeOriginalIndexedScopeSubmitted,true);",
 "   assert.equal(combined.originalFrontFacesPresentInEachSegment,35262);",
 "   assert.equal(combined.originalLicensedBodyFacesPresentInEachSegment,109064);",
 "   assert.equal(combined.bothSegmentsComputed,true);",
 "   assert.equal(combined.concurrentTwoJointMotionAudited,false);",
 "   assert.equal(combined.consumer3DAdmitted,false);",
 "   assert.equal(combined.segmentAudits.length,2);",
 "   assert.deepEqual(combined.segmentAudits.map(s=>s.namedJoint),",
 "    ['spine03','spine04']);",
 "   for(const segment of combined.segmentAudits){",
 "    assert.equal(segment.allSubmittedOriginalFacesIndexed,true);",
 "    assert.equal(segment.originalFrontFaceCount,35262);",
 "    assert.equal(segment.originalBodyFaceCount,109064);",
 "    assert.ok(segment.maxHarmonicQuarterPoseResidualRigUnits<1e-5);",
 "    assert.ok(segment.minimumOriginalFrontDoubleAreaRigUnitsSquared>1e-12);",
 "    assert.ok(segment.minimumOriginalBodyDoubleAreaRigUnitsSquared>1e-12);",
 "    assert.ok(segment.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted||",
 "     segment.decision==='BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',",
 "     'each true original named-joint segment requires complete BVH or verified real contact');",
 "    assert.ok(['RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT',",
 "     'BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT',",
 "     'BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT'].includes(segment.decision));",
 "    assert.equal(segment.consumer3DAdmitted,false);",
 "   }",
 "   assert.ok(['RESEARCH_ONLY_TWO_SEQUENTIAL_FIXED_AXIS_JOINT_SEGMENTS_DISJOINT',",
 "    'BLOCKED_TRUE_ORIGINAL_CONTACT_ON_SEQUENTIAL_JOINT_PATH',",
 "    'BLOCKED_UNRESOLVED_OR_BUDGETED_SEQUENTIAL_JOINT_PATH'].includes(combined.decision));",
 "   assert.equal(trial.concurrentJointMovementNotProven,true);",
 "   assert.equal(trial.originalFrontCurrentlyArbitrarilyFloatingNotFit,true);",
 "   assert.equal(trial.realMeasuredSourceCameraAndGarmentScale,null);",
 "   assert.equal(trial.physicalFitCertified,false);",
 "   assert.equal(trial.originalPhoto2DFallbackRequired,true);",
 "   assert.equal(trial.consumer3DAdmitted,false);",
 "   assert.equal(trial.familyAlpha,'HOLD');",
 "   await writeFile(resultDir+browserName+'-'+kind+",
 "    '-ORIGINAL-163bone-TWO-SEQUENTIAL-SPINE-JOINTS-HOLD.json',",
 "    JSON.stringify(trial,null,2)+'\\n');",
 "   console.log('M2_REAL_ORIGINAL_163BONE_TWO_ORDERED_SPINE_SEGMENTS '+JSON.stringify({",
 "    engine:browserName,rig:kind,originalRigSHA256:rigHashes[kind],",
 "    originalFrontFaces:trial.originalFrontIndexedFaceCount,",
 "    originalBodyFaces:trial.originalBodyIndexedFaceCount,",
 "    movingJoints:['spine03','spine04'],",
 "    originalPoseJunctionMaximumRigUnits:combined.maximumOriginalPoseJoinXYZDifferenceRigUnits,",
 "    segmentDecisions:combined.segmentAudits.map(s=>s.decision),",
 "    segmentsFullyAudited:combined.segmentAudits.map(s=>",
 "     s.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted),",
 "    decision:combined.decision,",
 "    concurrentTwoJointMotionAudited:false,physicallyFitted:false,",
 "    consumer3DAdmitted:false,familyAlpha:'HOLD'",
 "   }));",
 poseAnchor
].join('\n');
assert.equal(runner.split(routeAnchor).length,2,'immutable original route moved');
assert.equal(runner.split(poseAnchor).length,2,'immutable original bone-pose test moved');
const derived=runner.replace(routeAnchor,routeLines)
 .replace(poseAnchor,verifyLines);
const generated=resolve(
 'scripts/.m2-two-original-spine-sequential-derived-only-test.mjs');
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
