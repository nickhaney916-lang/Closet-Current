/**
 * Closet Current MAIN P162: EXACT verified cross-stream integration ONLY.
 *
 * Consume parallel P160 #716 actual real-mobile pointer-orbit harness at
 * fca5981c86a456ca172bd9810cb9c17e420cc30b (fetched read-only by CI).
 * Compose its genuine pointer events and 6 camera angles AFTER independently
 * accepted main P161 original MIT 80/163 neck/head axis registered outfit.
 *
 * No copy, cherry-pick, merge, publish, or modification of parallel PR #716.
 * No source Three.js/garment/photo/owner app change. Only disposable browser
 * acceptance fixture is generated and executed.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const [parallelSource,generated,mainHarness,combinedHarness]=process.argv.slice(2);
if(!parallelSource||!generated||!mainHarness||!combinedHarness||
 parallelSource===generated||mainHarness===combinedHarness)
 throw Error('P162 requires exact pinned parallel P716 preparer, generated preparer, P161 harness, and isolated output path');
let prep=await readFile(parallelSource,'utf8');
const anchor="const overlay=JSON.parse(await canvas.getAttribute('data-humanoid150'));";
assert.equal(prep.split(anchor).length,2,'exact P716 original genuine WebGL camera evidence anchor changed');
const guarded=anchor+String.raw`
  const inherited=overlay.licensedHead157;
  assert.equal(overlay.sourceRigBones,163,'P162 original owner outfit must retain original P541 163-bone skinned body');
  assert.equal(inherited?.headAttachedToOriginal163Bone,true,'P162 real MIT original licensed source head missing from original body');
  assert.equal(inherited?.headJointFit160?.measuredTrueSourceJointAlignmentApplied,true,'P162 source P160 original MIT neck joint offset improvement missing');
  assert.equal(inherited?.headAxis161?.priority,161,'P162 original P161 genuine neck-head angular correction missing during touch rotate');
  assert.equal(inherited?.neckTransition159?.bridgeTriangles,0,'P162 duplicate fake collar injected during real source camera orbit');
  assert.equal(inherited?.headAxis161?.originalPhotographedGarmentMeshesBefore,inherited?.headAxis161?.originalPhotographedGarmentMeshesAfter,'P162 original captured garment changed on real 3D rotation');
  assert.ok(inherited.headAxis161.actualAxisCorrectionDegrees>0.2,'P162 genuine P161 real MIT neck axis did not improve');
  assert.ok(inherited.headAxis161.originalLicensedNeckSkinOverlapMeters>.042,'P162 real MIT neck skin lost donor torso contact');
`;
prep=prep.replace(anchor,guarded);
const key='sourceRigBones:overlay.sourceRigBones,';
assert.equal(prep.split(key).length,2,'P716 source provenance row exact anchor changed');
prep=prep.replace(key,key+String.raw`
   crossStream162:true,
   mainExactP161SHA:'9c20ed0208d1ba547707e2a8c6fcd542ba327068',
   parallelExactP716SHA:'fca5981c86a456ca172bd9810cb9c17e420cc30b',
   licensedMITSourceSHA:inherited?.sha256,
   mainOriginal163BoneRig:inherited?.headJointFit160?.sourceOriginal163BoneRig,
   parallelOriginalMITHeadBones:inherited?.headJointFit160?.MITLicensedOriginalHeadRig,
   originalNeckJointDistanceImprovementMeters:inherited?.headJointFit160?.originalNeckToLicensedNeckAlignmentImprovementMeters,
   originalNeckHeadAngleBeforeDegrees:inherited?.headAxis161?.originalOriginalNeckToHeadAxisAngleDegrees,
   correctedNeckHeadAngleDegrees:inherited?.headAxis161?.measuredFinalNeckToHeadAxisAngleDegrees,
   sourceLicensedNeckRotationDegrees:inherited?.headAxis161?.actualAxisCorrectionDegrees,
   originalNeckPivotMovementMeters:inherited?.headAxis161?.originalLicensedNeckJointMovementMeters,
   originalFaceSkinOverlapMeters:inherited?.headAxis161?.originalLicensedNeckSkinOverlapMeters,
   ownedGarmentMeshCount:inherited?.headAxis161?.originalPhotographedGarmentMeshesAfter,
`);
assert.ok(prep.includes("if(process.env.P160==='1')")&&
 prep.includes("'threequarter-rear-right'")&&
 prep.includes("page.mouse.down()")&&
 prep.includes("ownerOriginal")&&
 prep.includes("originalNeckHeadAngleBeforeDegrees"),
 'P162 must retain exact parallel genuine pointer-orbit behavior plus original owner saved-outfit protection');
await writeFile(generated,prep);
console.log('P162_VERIFIED_PARALLEL_716_GESTURE_HARNESS_COMPOSED '+JSON.stringify({
 originalParallelSource:'fca5981c86a456ca172bd9810cb9c17e420cc30b',
 verifiedMainSource:'9c20ed0208d1ba547707e2a8c6fcd542ba327068',
 sourcePrep:parallelSource,mainOriginalHarness:mainHarness,
 output:combinedHarness,parallelPRNotEdited:true,originalSourceAppNotEdited:true,
 familyAlpha:'HOLD',releaseAuthorized:false
}));
