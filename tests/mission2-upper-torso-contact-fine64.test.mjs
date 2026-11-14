import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LOCAL_FINE_TRIALS64,summarizeOriginalClothFineGrid64}
 from '../research/mission2-source-length/upper-torso-contact-fine-grid64.mjs';
const genuineLike=()=>({
 schema:'M2-C63-source-contact-local-feather-fit-diagnostic',
 originalStrictBodyCrossingPairWitnessesAfter2mm:42,
 originalSourceClothFacesWithBodyCrossingAfter2mm:6,
 localCandidateEvaluations:3,candidateAlreadyRenderedInApp:false,
 releaseAuthorized:false,
 perLocalCandidate:LOCAL_FINE_TRIALS64.map(c=>({
  boostMeters:c.boostMeters,radiusMeters:c.radiusMeters,
  noGarmentSourceOrOwnerPhotoMutated:true,
  noSourceTriangleIDsOrXYZExported:true,
  releaseAuthorized:false,
  largestSourceFaceEdgeRelativeStrain:.044,
  largestSourceFaceAreaRelativeChange:.05,
  originalPhotoSurfaceStrainGuardPass:true,
  actualOriginalBodyContactEvaluated:true,
  fullOriginalBodyAndSelfContactAuditCompleted:true,
  sourceBodyStrictCrossingsAfterLocalTrial:12,
  sourceFabricSelfStrictCrossingsAfterLocalTrial:0,
  facesAbove5PercentStrain:0,facesAbove10PercentAreaChange:0,
  flippedSourceFaceCount:0,collapsedSourceFaceCount:0
 }))
});
test('C64: strict original photo face-local fit grid only samples 2.5/3/4mm over exact 25cm source surface',()=>{
 assert.deepEqual(LOCAL_FINE_TRIALS64.map(x=>x.boostMeters),
  [.0025,.003,.004]);
 assert.ok(LOCAL_FINE_TRIALS64.every(x=>x.radiusMeters===.25));
 const reports=[genuineLike(),genuineLike(),genuineLike()];
 const s=summarizeOriginalClothFineGrid64(reports);
 assert.equal(s.schema,'M2-C64-original-public-photograph-local-contact-fine-grid');
 assert.equal(s.perSourcePose.length,3);
 assert.equal(s.anySampledPoseQualifiedLocalFit,false);
 assert.deepEqual(s.candidateProfilesClearingAllSampledStrictBodyAndClothContactsWithShapeGuard,[]);
 assert.equal(s.sampledWorldOnlyNotActualSkinnedDressEdit,true);
 assert.equal(s.releaseAuthorized,false);
});
test('C64: one fully source-verified local adjustment can be sampled-zero intersection yet remains not released or rendered',()=>{
 const p=[genuineLike(),genuineLike(),genuineLike()];
 for(const x of p)x.perLocalCandidate[1].sourceBodyStrictCrossingsAfterLocalTrial=0;
 const a=summarizeOriginalClothFineGrid64(p);
 assert.equal(a.anySampledPoseQualifiedLocalFit,true);
 assert.deepEqual(a.candidateProfilesClearingAllSampledStrictBodyAndClothContactsWithShapeGuard,
  [{extraOutwardMeters:.003,radiusMeters:.25}]);
 assert.equal(a.anyRealPhotographic3DPreviewRendered,false);
 assert.equal(a.continuousPoseClothCollisionSafeCertified,false);
 assert.equal(a.releaseAuthorized,false);
});
test('C64: a single genuine pose with still-crossing body faces denies common sample qualification',()=>{
 const p=[genuineLike(),genuineLike(),genuineLike()];
 for(const x of p)x.perLocalCandidate[1].sourceBodyStrictCrossingsAfterLocalTrial=0;
 p[2].perLocalCandidate[1].sourceBodyStrictCrossingsAfterLocalTrial=1;
 const r=summarizeOriginalClothFineGrid64(p);
 assert.equal(r.anySampledPoseQualifiedLocalFit,false);
});
test('C64: face strain failure or incomplete actual anatomical contact pass cannot produce fit approval',()=>{
 const p=[genuineLike(),genuineLike(),genuineLike()];
 for(const x of p)x.perLocalCandidate[1].sourceBodyStrictCrossingsAfterLocalTrial=0;
 p[1].perLocalCandidate[1].originalPhotoSurfaceStrainGuardPass=false;
 p[1].perLocalCandidate[1].actualOriginalBodyContactEvaluated=false;
 const r=summarizeOriginalClothFineGrid64(p);
 assert.equal(r.anySampledPoseQualifiedLocalFit,false);
});
test('C64: forged source, local profiles, face IDs or original 163-bone body counts rejected',()=>{
 for(const mutate of [
  p=>p.pop(),
  p=>{p[0].schema='invented-source';},
  p=>{p[0].originalStrictBodyCrossingPairWitnessesAfter2mm=0;},
  p=>{p[0].originalSourceClothFacesWithBodyCrossingAfter2mm=0;},
  p=>{p[0].perLocalCandidate[1].boostMeters=.0039;},
  p=>{p[0].perLocalCandidate[1].sourceBodyStrictCrossingsAfterLocalTrial=-1;},
  p=>{p[0].perLocalCandidate[1].actualOriginalBodyContactEvaluated=false;},
  p=>{p[0].perLocalCandidate[0].noSourceTriangleIDsOrXYZExported=false;}
 ]){
  const p=[genuineLike(),genuineLike(),genuineLike()];
  mutate(p);
  assert.throws(()=>summarizeOriginalClothFineGrid64(p));
 }
});
test('C64: original photographed dress helper has no server-only imports nor raw owner/source coordinates',async()=>{
 const s=await readFile('research/mission2-source-length/upper-torso-contact-fine-grid64.mjs','utf8');
 assert.ok(!s.includes("from 'node:")&&!s.includes('from "node:'));
 assert.ok(!s.includes('require(')&&!s.includes('process.'));
 assert.ok(s.includes('originalSourceStrictContactFaceIdentifiersNeverExported'));
 assert.ok(s.includes('releaseAuthorized:false'));
});
