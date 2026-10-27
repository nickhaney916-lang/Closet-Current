import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateVisualReview,assessIntegrated,auditIntegratedBuild,PARENT_SHA}
 from '../../scripts/check-family-alpha-44-integrated-readiness-hold.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const pVisual='docs/family-alpha-44/integrated-release-evidence-20261027.json';
const pStage='docs/family-alpha-27/staging-metadata-audit-20261027.json';
const pFamily='docs/family-alpha-27/release-report.json';
const dup=o=>structuredClone(o);
test('real offline visual evidence remains HOLD with 0 of 15 owner approved cutouts',async()=>{
 const v=await read(pVisual),r=evaluateVisualReview(v);
 assert.equal(v.parentCandidateCommit,PARENT_SHA);
 assert.equal(v.visual.licensedOriginals,15);
 assert.equal(v.visual.proposedCutouts,7);
 assert.equal(v.visual.missingUsableCutouts,8);
 assert.equal(v.visual.visuallyApprovedCutouts,0);
 assert.equal(v.visual.work41Compositing,'FAIL');
 assert.equal(r.decision,'HOLD');
 assert.equal(r.releaseAuthorized,false);
 assert.ok(r.issues.some(x=>x.includes('Neither a human-approved')));
});
test('one staging user cannot be equated with real four-user privacy even if software CI passes',async()=>{
 const [family,stage,visual]=await Promise.all([read(pFamily),read(pStage),read(pVisual)]);
 const all=assessIntegrated(family,stage,visual);
 assert.equal(all.decision,'HOLD');
 assert.equal(all.stageAndFamily.decision,'HOLD');
 assert.equal(all.stageAndFamily.stage.reportedAccounts,1);
 assert.equal(all.visual.photoOnlyFallbackVerified,false);
 assert.equal(all.deploymentAuthorized,false);
 assert.equal(all.credentialsEnabled,false);
});
test('forged release flags, impossible benchmark counts or apparently positive visual labels are refused',async()=>{
 const start=await read(pVisual);
 for(const [p,v] of [
  ['parentCandidateCommit','main'],
  ['status','READY'],['deploymentAuthorized',true],
  ['originalJpegOnlyRecognition',false],['stageAuthCloudDisabled',false],
  ['visuallyApprovedCutouts',8],['proposedCutouts',15],['missingUsableCutouts',0],
  ['ownerExplicitGoApproval',true],['physicalAndroid','PASS'],['actualFourJwt',4]
 ]){
  const x=dup(start);
  if(p in x)x[p]=v;
  else if(p in x.visual)x.visual[p]=v;
  else if(p in x.sourceIntegrity)x.sourceIntegrity[p]=v;
  else if(p==='physicalAndroid')x.physicalPhoneTests.android=v;
  else if(p==='actualFourJwt')x.liveAuthorization.uniqueFamilyJwtSessions=v;
  assert.equal(evaluateVisualReview(x).decision,'HOLD','Cannot bypass visual decision via '+p);
 }
});
test('photo-based fallback may be considered for review without falsely marking Work37/38 or Work41 as solved',async()=>{
 const v=await read(pVisual);
 v.visual.allowedDefaultPresentation='PHOTO_ONLY';
 v.visual.work42PhotoFallback='PASS';
 v.visual.photoOnlyOutfitFallbackOwnerAccepted=true;
 v.visual.fourPersonAlphaOutfitExperienceApproved=true;
 v.physicalPhoneTests.android='PASS';v.physicalPhoneTests.iphone='PASS';
 v.liveAuthorization.uniqueFamilyJwtSessions=4;
 v.liveAuthorization.twoOwnerReadWriteRlsTest='PASS';
 v.liveAuthorization.distinctParticipantsOneSimultaneousSession='PASS';
 v.ownerExplicitGoApproval=true;
 v.status='READY_FOR_MAIN_THREAD_REVIEW';
 const visual=evaluateVisualReview(v);
 assert.equal(visual.decision,'READY FOR MAIN-THREAD REVIEW');
 assert.equal(v.visual.work37Fit,'INCOMPLETE');
 assert.equal(v.visual.work41Compositing,'FAIL');
 assert.equal(visual.photoOnlyFallbackVerified,true);
 assert.equal(visual.releaseAuthorized,false);
 // A truthful photo board still cannot substitute for actual four JWTs in
 // the unchanged source-pinned staged checker.
 const stage=await read(pStage),family=await read(pFamily);
 const all=assessIntegrated(family,stage,v);
 assert.equal(all.decision,'HOLD');
 assert.equal(all.deploymentAuthorized,false);
});
test('unreviewed worn PNG cannot pass with fabricated mannequin/garment label',async()=>{
 const v=await read(pVisual);
 v.visual.allowedDefaultPresentation='WORN_WITH_REVIEWED_GARMENTS';
 v.visual.work37Fit='PASS';v.visual.work38Isolation='PASS';
 v.visual.work41Compositing='PASS';v.visual.humanWornPreviewOwnerAccepted=true;
 v.visual.visuallyApprovedCutouts=7;
 v.visual.garmentAcceptanceRecords=[];
 let result=evaluateVisualReview(v);
 assert.equal(result.decision,'HOLD');
 assert.ok(result.issues.some(x=>x.includes('ledger length')));
 const f={
  garmentId:'skirt-0043',visualApproval:'PASS',reviewedBy:'model',
  reviewType:'synthetic',
  originalSha256:'a'.repeat(64),transparentPngSha256:'b'.repeat(64),
  sourceLicense:'public licensed fixture',beforeAfterEvidence:'fake photo gallery',
  stagingDeploymentVerified:false
 };
 v.visual.visuallyApprovedCutouts=1;v.visual.garmentAcceptanceRecords=[f];
 result=evaluateVisualReview(v);
 assert.equal(result.decision,'HOLD');
 assert.ok(result.issues.some(x=>x.includes('No owner-signed')));
});
test('tampered staging meta cannot be treated as successful authorization even with visual fallback approved',async()=>{
 const v=await read(pVisual),f=await read(pFamily),s=await read(pStage);
 s.registeredAuthAccountCount=4;
 s.familyParticipantsVerifiedByRealJwt=0;
 const result=assessIntegrated(f,s,v);
 assert.equal(result.decision,'HOLD');
 assert.ok(result.stageAndFamily.stage.issues.some(x=>x.includes('Four unique real user JWT')));
});
test('exact camera/UI/photo/session software source passes pinned integrity but RELEASE STILL HOLDS',async()=>{
 const result=await auditIntegratedBuild();
 assert.equal(result.decision,'HOLD');
 assert.equal(result.deploymentAuthorized,false);
 assert.equal(result.stageAndFamily.deploymentAuthorized,false);
 assert.equal(result.visual.releaseAuthorized,false);
});
