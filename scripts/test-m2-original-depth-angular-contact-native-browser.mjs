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
 addon:'0036b79e28d40c73472d9b44b6e770a4fb719048'
};
const sha=b=>createHash('sha1').update('blob '+Buffer.byteLength(b)+'\0')
 .update(b).digest('hex');
const runner=await readFile(
 'scripts/test-parallel89-met-real-163bone-anatomy-study.mjs','utf8');
const original=await readFile(
 'research/parallel89/met-original-163bone-uncalibrated-registration89.mjs','utf8');
const addon=await readFile(
 'research/parallel89/original-depth-full-swept-integration-addon89.mjs','utf8');
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
 "    const addonSource=await readFile('research/parallel89/original-depth-full-swept-integration-addon89.mjs','utf8');",
 "    const blobSha=t=>createHash('sha1').update('blob '+Buffer.byteLength(t)+'\\0').update(t).digest('hex');",
 "    assert.equal(blobSha(originalSource),'b211d807c0ccc3c4a7b0eeec339f23bb4692afcb');",
 "    assert.equal(blobSha(addonSource),'0036b79e28d40c73472d9b44b6e770a4fb719048');",
 "    await route.fulfill({status:200,contentType:'text/javascript',body:originalSource+'\\n'+addonSource});",
 "   });",
 routeAnchor
].join('\n');
const poseAnchor="  const rest=await page.evaluate(()=>window.__M2RealRigPhotoTrial\n   .setSourceSkinnedMotionTrialPose('rest'));";
const verifyLines=[
 "   const audit=await page.evaluate(()=>window.__M2RealRigPhotoTrial",
 "    .verifyAllOriginalIndexedSpine04SweptBVH());",
 "   assert.equal(audit.actualLicensed163boneRigKind,kind);",
 "   assert.equal(audit.actualLicensedOriginalGLBSHA256,rigHashes[kind]);",
 "   assert.equal(audit.originalJPEG_SHA256,hash(image));",
 "   assert.equal(audit.originalDecodedRGB_SHA256,shell.originalDecodedRGBSHA256);",
 "   assert.equal(audit.originalSourceFrontIndexedFaces,35262);",
 "   assert.equal(audit.originalBodyIndexedFaces,109064);",
 "   assert.deepEqual(audit.actualFiveGenuineSpine04AnglesDegrees,[-12,-6,0,6,12]);",
 "   assert.equal(audit.trueOriginalFullIndexedFrontAndBodyVertexPosesGenerated,true);",
 "   assert.equal(audit.historicalZeroSeedFaultActuallyExcluded,true);",
 "   assert.ok(audit.historicalWrongZeroSeedDistanceRigUnits>.0001);",
 "   const actual=audit.actualAllOriginalIndexedAngularBroadphase;",
 "   assert.equal(actual.originalFrontFaceCount,35262);",
 "   assert.equal(actual.originalBodyFaceCount,109064);",
 "   assert.equal(actual.allSubmittedOriginalFacesIndexed,true);",
 "   assert.equal(actual.entireOriginalFrontAndBodyPoseVerticesPresent,true);",
 "   assert.ok(actual.minimumOriginalFrontDoubleAreaRigUnitsSquared>1e-12);",
 "   assert.ok(actual.minimumOriginalBodyDoubleAreaRigUnitsSquared>1e-12);",
 "   assert.ok(actual.maxHarmonicQuarterPoseResidualRigUnits<1e-5,",
 "    'corrected real ORIGINAL 163bone motion is not compatible with one-axis LBS');",
 "   assert.equal(actual.allOriginalBodyFacesPresentInSweptBVH,true);",
 "   assert.ok(actual.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted===true||",
 "    actual.decision==='BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',",
 "    'all original true geometry needs completed conservative swept audit or definitive true contact; no budget skipping');",
 "   assert.ok(['BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',",
 "    'BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT',",
 "    'RESEARCH_ONLY_FULL_INDEXED_ANGULAR_ENVELOPES_DISJOINT'",
 "   ].includes(actual.decision),",
 "    'full original body/photo angular sweep must not omit any faces or ignore uncertain contacts');",
 "   assert.equal(actual.consumer3DAdmitted,false);",
 "   assert.equal(audit.sourcePhoto2DFallbackRequired,true);",
 "   assert.equal(audit.consumer3DAdmitted,false);",
 "   assert.equal(audit.familyAlpha,'HOLD');",
 "   const contact=audit.exactOriginalBodyContactDepthIntegration;",
 "   assert.equal(contact.exactUnmodifiedOriginalPhotoFrontFaces,35262);",
 "   assert.equal(contact.exactUnmodifiedOriginalLicensedBodyFaces,109064);",
 "   assert.equal(contact.originalPositiveContactDecision,",
 "    'BLOCKED_ACTUAL_PHOTO_FRONT_ANATOMY_CAMERA_AXIS_CONTACT');",
 "   assert.equal(contact.sourceBodyFullIndexedDiscreteGateDecision,",
 "    'BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT');",
 "   assert.ok(Number.isFinite(contact.depthShiftRigUnitsOnly));",
 "   assert.ok(contact.depthShiftRigUnitsOnly>=0&&contact.depthShiftRigUnitsOnly<=3);",
 "   assert.equal(contact.translationAppliedIdenticallyToEveryFrontVertexAtEveryOriginalPose,true);",
 "   assert.equal(contact.sourcePhotoRotationChanged,false);",
 "   assert.equal(contact.sourcePhotoRGBUVGeometrySkinsStillImmutable,true);",
 "   assert.equal(contact.wholeOriginalFrontAndBodyPosedVertexBuffersIncluded,true);",
 "   const afterContact=contact.followupEntireAngularBVH;",
 "   assert.equal(afterContact.originalFrontFaceCount,35262);",
 "   assert.equal(afterContact.originalBodyFaceCount,109064);",
 "   assert.equal(afterContact.allSubmittedOriginalFacesIndexed,true);",
 "   assert.ok(afterContact.maxHarmonicQuarterPoseResidualRigUnits<1e-5);",
 "   assert.ok(afterContact.minimumOriginalFrontDoubleAreaRigUnitsSquared>1e-12);",
 "   assert.ok(afterContact.minimumOriginalBodyDoubleAreaRigUnitsSquared>1e-12);",
 "   assert.ok(['BLOCKED_ACTUAL_TRUE_ORIGINAL_DISCRETE_CONTACT',",
 "    'BLOCKED_UNRESOLVED_FULL_INDEXED_ANGULAR_CONTACT',",
 "    'BLOCKED_ANGULAR_BVH_VISIT_BUDGET','BLOCKED_ANGULAR_FACE_PAIR_BUDGET',",
 "    'BLOCKED_ANGULAR_EXACT_SAMPLE_BUDGET'",
 "   ].includes(afterContact.decision),'contacted original cannot be cleared');",
 "   assert.equal(afterContact.consumer3DAdmitted,false);",
 "   assert.equal(contact.physicallyFitted,false);",
 "   assert.equal(contact.originalPhotographCameraFocalLengthPixels,null);",
 "   assert.equal(contact.actualGarmentBodyReferenceScaleMmPerPixel,null);",
 "   assert.equal(contact.consumer3DAdmitted,false);",
 "   assert.equal(contact.familyAlpha,'HOLD');",
 "   console.log('M2_ORIGINAL_DEPTH_ANGULAR_CONTACT_INTEGRATION '+JSON.stringify({",
 "    engine:browserName,rig:kind,originalTrueFrontFaces:35262,",
 "    originalTrueAnatomicalFaces:109064,",
 "    sourceFrontWitness:contact.chosenTrueSourceBodyContactFrontFace,",
 "    realAnatomyWitness:contact.chosenTrueSourceBodyContactBodyFace,",
 "    cameraAxisShiftInRigUnits:contact.depthShiftRigUnitsOnly,",
 "    genuineOriginalDiscreteRefusal:contact.originalPositiveContactDecision,",
 "    allOriginalAngularDecision:afterContact.decision,",
 "    fullSweptBroadphaseComplete:afterContact.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted,",
 "    zeroSourceRotations:true,physicallyFitted:false,",
 "    consumer3DAdmitted:false,familyAlpha:'HOLD'",
 "   }));",
 "   await writeFile(resultDir+browserName+'-'+kind+",
 "    '-ORIGINAL-FULL-INDEXED-163bone-ANGULAR-BVH-RESEARCH-HOLD.json',",
 "    JSON.stringify(audit,null,2)+'\\n');",
 "   console.log('M2_DEPTH_REGISTERED_ALL_ORIGINAL_SOURCE_163BONE_ANGULAR_BVH '+JSON.stringify({",
 "    engine:browserName,rig:kind,realOriginalRigSHA256:rigHashes[kind],",
 "    trueOriginalFrontFaceCount:actual.originalFrontFaceCount,",
 "    trueOriginalBodyFaceCount:actual.originalBodyFaceCount,",
 "    actualOriginalFrontVertices:actual.originalFrontVertexCount,",
 "    actualOriginalBodyVertices:actual.originalBodyVertexCount,",
 "    trueOriginalMinimumFrontDoubleArea:actual.minimumOriginalFrontDoubleAreaRigUnitsSquared,",
 "    trueOriginalMinimumBodyDoubleArea:actual.minimumOriginalBodyDoubleAreaRigUnitsSquared,",
 "    genuineMaximumHarmonicResidual:actual.maxHarmonicQuarterPoseResidualRigUnits,",
 "    bodyBVHNodes:actual.originalBodyBVHNodes,",
 "    bodyBVHNodesVisited:actual.bodyBVHNodesVisited,",
 "    originalAngularEnvelopeOverlaps:actual.overlappingOriginalAngularEnvelopes,",
 "    exactOriginalDiscretePairSamples:actual.exactDiscreteOriginalFaceTests,",
 "    completeOriginalAngularBroadphase:actual.fullAllOriginalFrontAndBodyAngularBroadphaseCompleted,",
 "    decision:actual.decision,",
 "    physicallyFitted:false,consumer3DAdmitted:false,familyAlpha:'HOLD'",
 "   }));",
 poseAnchor
].join('\n');
assert.equal(runner.split(routeAnchor).length,2,'immutable original route moved');
assert.equal(runner.split(poseAnchor).length,2,'immutable original bone-pose test moved');
const derived=runner.replace(routeAnchor,routeLines)
 .replace(poseAnchor,verifyLines);
const generated=resolve(
 'scripts/.m2-original-depth-anchored-all-angular-derived-only-test.mjs');
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
