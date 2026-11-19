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
 registration:'2e22aa7202043dba7a85981c115bd6620da1107b',
 addon:'e129737af316be81100ef2d95e8922ff2f8c62d6'
};
const sha=b=>createHash('sha1').update('blob '+Buffer.byteLength(b)+'\0')
 .update(b).digest('hex');
const runner=await readFile(
 'scripts/test-parallel89-met-real-163bone-anatomy-study.mjs','utf8');
const original=await readFile(
 'research/parallel89/met-original-163bone-uncalibrated-registration89.mjs','utf8');
const addon=await readFile(
 'research/parallel89/original-163bone-spine04-angular-witness-addon89.mjs','utf8');
assert.equal(sha(runner),pins.runner,
 'original authentic photo original real anatomy browser test mutated');
assert.equal(sha(original),pins.registration,
 'original authentic photo original 163bone registration mutated');
assert.equal(sha(addon),pins.addon,
 'original additive native rotation witness mutated');

// These inserts exist ONLY in a disposable generated script: no protected
// research files are edited, no consumer or other parallel assignment touched.
const routeAnchor=" await page.goto(origin,{waitUntil:'load'});";
const routeLines=[
 "  await page.route('**/research/parallel89/met-original-163bone-uncalibrated-registration89.mjs',",
 "   async route=>{",
 "    const originalSource=await readFile('research/parallel89/met-original-163bone-uncalibrated-registration89.mjs','utf8');",
 "    const addonSource=await readFile('research/parallel89/original-163bone-spine04-angular-witness-addon89.mjs','utf8');",
 "    const blobSha=t=>createHash('sha1').update('blob '+Buffer.byteLength(t)+'\\0').update(t).digest('hex');",
 "    assert.equal(blobSha(originalSource),'2e22aa7202043dba7a85981c115bd6620da1107b');",
 "    assert.equal(blobSha(addonSource),'e129737af316be81100ef2d95e8922ff2f8c62d6');",
 "    await route.fulfill({status:200,contentType:'text/javascript',body:originalSource+'\\n'+addonSource});",
 "   });",
 routeAnchor
].join('\n');
const poseAnchor="  const rest=await page.evaluate(()=>window.__M2RealRigPhotoTrial\n   .setSourceSkinnedMotionTrialPose('rest'));";
const verifyLines=[
 "   const rotationAudit=await page.evaluate(()=>window.__M2RealRigPhotoTrial",
 "    .verifyGenuineSpine04AngularEnvelope());",
 "   assert.equal(rotationAudit.actualOriginalRigKind,kind);",
 "   assert.equal(rotationAudit.actualRealBoneCount,163);",
 "   assert.equal(rotationAudit.independentRealOriginalRigSHA256,rigHashes[kind]);",
 "   assert.equal(rotationAudit.originalMuseumJPEG_SHA256,hash(image));",
 "   assert.deepEqual(rotationAudit.fiveGenuineOriginalBoneAnglesDeg,[-12,-6,0,6,12]);",
 "   assert.equal(rotationAudit.genuinelyPosedSourceFrontFaces,96);",
 "   assert.equal(rotationAudit.genuinelyPosedLicensedBodyFaces,160);",
 "   assert.ok(rotationAudit.originalPhotoFrontFaceCount>1000);",
 "   assert.ok(rotationAudit.originalIndexedBodyFaceCount>5000);",
 "   assert.equal(rotationAudit.allOriginalFacePairsAudited,false);",
 "   assert.ok(rotationAudit.harmonicAudit.maximumConservativePerCoordinateInflationRigUnits>0);",
 "   assert.ok(rotationAudit.harmonicAudit.maximumQuarterPoseHarmonicResidualRigUnits<.0001,",
 "    'original-source+anatomy pose cannot be certified as a single-axis harmonic LBS path');",
 "   assert.notEqual(rotationAudit.harmonicAudit.decision,",
 "    'RESEARCH_ONLY_COMPLETE_SUBMITTED_ROTATIONAL_ENVELOPES_SEPARATED');",
 "   assert.ok(['BLOCKED_REAL_POSE_FACE_CONTACT',",
 "    'BLOCKED_UNRESOLVED_ROTATIONAL_CONTACT','BLOCKED_ROTATION_ENVELOPE_RESOURCE_LIMIT',",
 "    'RESEARCH_ONLY_SAMPLED_ROTATIONAL_ENVELOPES_SEPARATED'",
 "   ].includes(rotationAudit.harmonicAudit.decision),",
 "    'genuine original rig needs explicit sampled-only/contact/blocked research proof');",
 "   assert.equal(rotationAudit.harmonicAudit.consumer3DAdmitted,false);",
 "   assert.equal(rotationAudit.consumer3DAdmitted,false);",
 "   assert.equal(rotationAudit.familyAlpha,'HOLD');",
 "   await writeFile(resultDir+browserName+'-'+kind+",
 "    '-ORIGINAL-163bone-spine04-ROTATIONAL-ENVELOPE-SAMPLED-HOLD.json',",
 "    JSON.stringify(rotationAudit,null,2)+'\\n');",
 "   console.log('M2_ACTUAL_ORIGINAL_163BONE_SPINE04_HARMONIC_SWEEP '+JSON.stringify({",
 "    engine:browserName,rig:kind,actualRigSHA256:rigHashes[kind],",
 "    realOriginalFaceCounts:[rotationAudit.originalPhotoFrontFaceCount,",
 "     rotationAudit.originalIndexedBodyFaceCount],",
 "    auditedSampledFaceCounts:[96,160],",
 "    maximumQuarterResidualRigUnits:",
 "     rotationAudit.harmonicAudit.maximumQuarterPoseHarmonicResidualRigUnits,",
 "    decision:rotationAudit.harmonicAudit.decision,",
 "    allOriginalFacePairsAudited:false,consumer3DAdmitted:false,familyAlpha:'HOLD'",
 "   }));",
 poseAnchor
].join('\n');
assert.equal(runner.split(routeAnchor).length,2,'immutable original route moved');
assert.equal(runner.split(poseAnchor).length,2,'immutable original bone-pose test moved');
const derived=runner.replace(routeAnchor,routeLines)
 .replace(poseAnchor,verifyLines);
const generated=resolve(
 'scripts/.m2-original-163bone-fixed-axis-derived-only-test.mjs');
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
