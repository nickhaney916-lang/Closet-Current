import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ARM_INTERMEDIATE_FRACTIONS65,summarizeSourceArmTransitions65}
 from '../research/mission2-source-length/source-arm-pose-transition65.mjs';
const ready=()=>Array.from({length:6},(_,i)=>({
 arm:Math.floor(i/3),phaseFraction:ARM_INTERMEDIATE_FRACTIONS65[i%3],
 originalSignedSourceGarmentFaces:3836,
 originalBodyStrictPairWitnesses:196,
 originalSelfStrictPairWitnesses:0,
 fittedBodyStrictPairWitnesses:0,
 fittedSelfStrictPairWitnesses:0,
 sourceContactFaceCountAfter2mm:6,
 maximumTemporaryWorldDisplacementMeters:.005,
 originalClothFaceShapeGuardPass:true,
 originalPhotoAnd163BoneBodyContactBudgetsComplete:true,
 noOriginalSourceMeshOrUVOrSkinChanged:true,
 noSourceFaceIdsOrWorldCoordinatesExported:true,
 releaseAuthorized:false
}));
test('C65: exactly six genuine 163-bone intermediate arm phases are summarized without granting continuous fabric physics clearance',()=>{
 const s=summarizeSourceArmTransitions65(ready());
 assert.deepEqual(s.sampledFractionsPerArm,[.25,.50,.75]);
 assert.equal(s.genuineSignedSource163BoneArmCount,2);
 assert.equal(s.intermediateOriginalSourcePoseSamples,6);
 assert.equal(s.sourceGarmentOriginalFaceCount,3836);
 assert.equal(s.everySampledPoseOriginalPhotoFaceShapeAndStrictContactPass,true);
 assert.equal(s.remainingSourceBodyStrictPairWitnessesAcrossIntermediatePoses,0);
 assert.equal(s.onlyDiscreteContactSamplesNotSweptContinuousMotion,true);
 assert.equal(s.originalPhotographedGarmentAndSkeletonNeverChanged,true);
 assert.equal(s.noIntermediateClothVerticesOrFaceIDsExported,true);
 assert.equal(s.neverApproveOwnerPhotoReconstructionOrPhotorealism,true);
 assert.equal(s.noPhysicalAndroidOrIPhoneDeviceVerified,true);
 assert.equal(s.releaseAuthorized,false);
 assert.equal(s.familyAlpha,'HOLD');
});
test('C65: one unsolved body crossing at one intermediate arm phase blocks every-sampled clearance',()=>{
 const a=ready();a[4].fittedBodyStrictPairWitnesses=1;
 const s=summarizeSourceArmTransitions65(a);
 assert.equal(s.everySampledPoseOriginalPhotoFaceShapeAndStrictContactPass,false);
 assert.equal(s.remainingSourceBodyStrictPairWitnessesAcrossIntermediatePoses,1);
});
test('C65: source photo surface strain failure at one intermediate phase blocks candidate even with zero strict crossings',()=>{
 const a=ready();a[2].originalClothFaceShapeGuardPass=false;
 const s=summarizeSourceArmTransitions65(a);
 assert.equal(s.everySampledPoseOriginalPhotoFaceShapeAndStrictContactPass,false);
 assert.equal(s.anyIntermediatePhotoStrainThresholdFailed,true);
});
test('C65: source pose incompleteness, world displacement beyond original fit and contact provenance forgery rejected',()=>{
 const mutations=[
  s=>s.pop(),
  s=>{s[0].arm=1;},
  s=>{s[0].phaseFraction=.11;},
  s=>{s[2].originalSignedSourceGarmentFaces=5;},
  s=>{s[1].originalPhotoAnd163BoneBodyContactBudgetsComplete=false;},
  s=>{s[1].noSourceFaceIdsOrWorldCoordinatesExported=false;},
  s=>{s[1].fittedBodyStrictPairWitnesses=-1;},
  s=>{s[1].maximumTemporaryWorldDisplacementMeters=.01;},
  s=>{s[1].releaseAuthorized=true;}
 ];
 for(const mut of mutations){
  const a=ready();mut(a);
  assert.throws(()=>summarizeSourceArmTransitions65(a));
 }
});
test('C65: source browser-authored transition helper requires neither Node runtime nor owner photo vertices',async()=>{
 const s=await readFile(
  'research/mission2-source-length/source-arm-pose-transition65.mjs','utf8');
 assert.ok(!s.includes("from 'node:")&&!s.includes('from "node:'));
 assert.ok(!s.includes('process.')&&!s.includes('require('));
 assert.ok(s.includes('noIntermediateClothVerticesOrFaceIDsExported'));
 assert.ok(s.includes('releaseAuthorized:false'));
});
