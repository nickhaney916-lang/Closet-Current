/**
 * Family Alpha combined safe-readiness review (not a deployment gate).
 * Reuses #335's exact 12-field and read-only staging metadata checkers.
 * This does NOT provide a way to activate a preview or bypass a human.
 *
 * 15 licensed benchmark originals: 7 provisional cutouts, 8 unavailable,
 * none owner-approved; Work #41 compositing FAIL, other research incomplete.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {assessTogether} from './check-family-alpha-stage-live-preflight.mjs';
import {assert43HOLD} from './build-family-alpha-43-still-source-hold.mjs';
export const PARENT_SHA='9b093fe3f86613c2876e7e1b1f135d7a52948c20';
export const VISUAL_GATES=Object.freeze(['source-originals','cutouts-reviewed','compositing','photo-only-fallback','physical-phones','four-person-outfit-experience','human-approval']);
const sha=/^[0-9a-f]{64}$/i;
const id=/^[a-zA-Z0-9:_-]{1,160}$/;
const textEvidence=s=>typeof s==='string'&&s.trim().length>=12&&s.length<=800;
const failures=(items,label,okay)=>{if(!okay)items.push(label);};
export function evaluateVisualReview(evidence){
 const issues=[];
 if(evidence?.schema!=='closet-family-alpha-44-release-evidence-v1')
  issues.push('Visual readiness evidence schema not recognized');
 if(evidence?.parentCandidateCommit!==PARENT_SHA)
  issues.push('Evidence must pin exact compiled preview source');
 if(evidence?.status!=='HOLD'&&evidence?.status!=='READY_FOR_MAIN_THREAD_REVIEW')
  issues.push('Invalid visual evidence status');
 const v=evidence?.visual||{},si=evidence?.sourceIntegrity||{},
  auth=evidence?.liveAuthorization||{},phone=evidence?.physicalPhoneTests||{};
 failures(issues,'15 licensed originals must be accounted for',v.licensedOriginals===15);
 failures(issues,'Benchmark cutouts cannot be fabricated or omitted',
  Number.isInteger(v.proposedCutouts)&&Number.isInteger(v.missingUsableCutouts)&&
  v.proposedCutouts>=0&&v.missingUsableCutouts>=0&&
  v.proposedCutouts+v.missingUsableCutouts===15);
 failures(issues,'Approved count cannot exceed real proposed cutouts',
  Number.isInteger(v.visuallyApprovedCutouts)&&v.visuallyApprovedCutouts>=0&&
  v.visuallyApprovedCutouts<=v.proposedCutouts);
 const records=v.garmentAcceptanceRecords;
 failures(issues,'Garment approval ledger required',Array.isArray(records));
 if(Array.isArray(records)){
  const seen=new Set();
  for(const [index,record]of records.entries()){
   const k=record?.garmentId;
   if(!id.test(k||'')||seen.has(k))issues.push('Invalid or duplicate garment approval record '+index);
   else seen.add(k);
   if(record?.visualApproval!=='PASS'||record?.reviewedBy!=='human-owner'||
     record?.reviewType!=='real-licensed-photo-manual-visual'||
     !sha.test(record?.originalSha256||'')||
     !sha.test(record?.transparentPngSha256||'')||
     !textEvidence(record?.sourceLicense)||
     !textEvidence(record?.beforeAfterEvidence)||
     record?.stagingDeploymentVerified===true)
    issues.push('No owner-signed, source-provenance-grounded visual review for garment '+index);
  }
  if(records.length!==v.visuallyApprovedCutouts)
   issues.push('Approved cutout count differs from ledger length');
 }
 failures(issues,'Original photos must remain authoritative for recognition',si.originalJpegOnlyRecognition===true);
 failures(issues,'Stage Auth/cloud still disabled in source candidate',si.stageAuthCloudDisabled===true);
 failures(issues,'High-res camera source gate must be exact',
  si.manualStillMaxAxis===4096&&si.automaticFrameMaxAxis===2048);
 failures(issues,'Fit state must be session+owner+approved-mask scoped',si.sameOwnerSessionPhotoHashFitRequired===true);
 // Work41 can be superseded by explicitly accepted photo-only presentation:
 // never require broken worn overlays if owner approves a truthful photo board.
 const photoOnly=v.allowedDefaultPresentation==='PHOTO_ONLY'&&
  v.work42PhotoFallback==='PASS'&&v.photoOnlyOutfitFallbackOwnerAccepted===true;
 if(!photoOnly){
  failures(issues,'Work37 fitting lacks accepted real visual evidence',v.work37Fit==='PASS');
  failures(issues,'Work38 segmentation is not accepted',v.work38Isolation==='PASS');
 }
 const wearable=v.allowedDefaultPresentation==='WORN_WITH_REVIEWED_GARMENTS'&&
  v.work41Compositing==='PASS'&&v.humanWornPreviewOwnerAccepted===true&&
  v.visuallyApprovedCutouts>0;
 failures(issues,'Neither a human-approved photo-only fallback nor a verified worn preview is accepted',photoOnly||wearable);
 if(v.allowedDefaultPresentation==='WORN_WITH_REVIEWED_GARMENTS'&&
    v.visuallyApprovedCutouts<v.proposedCutouts)
  issues.push('Provisional or missing masks may not be displayed as approved worn garments');
 failures(issues,'One coordinated family session with acceptable outfits not verified',
  v.fourPersonAlphaOutfitExperienceApproved===true);
 failures(issues,'Actual Android and iPhone physical trials required',
  phone.android==='PASS'&&phone.iphone==='PASS');
 failures(issues,'Four unique actual authenticated family JWTs required',auth.uniqueFamilyJwtSessions===4);
 failures(issues,'Adult A/B actual read-write RLS proof required',auth.twoOwnerReadWriteRlsTest==='PASS');
 failures(issues,'Four simultaneous distinct participants must be verified',
  auth.distinctParticipantsOneSimultaneousSession==='PASS');
 failures(issues,'Explicit owner review decision still absent',evidence?.ownerExplicitGoApproval===true);
 if(evidence?.deploymentAuthorized!==false)issues.push('This checker can never authorize deployment');
 return Object.freeze({
  decision:issues.length?'HOLD':'READY FOR MAIN-THREAD REVIEW',
  issues,technicallyTestedCameraIsNotPhysicalValidation:true,
  garmentCutoutsOwnerApproved:v.visuallyApprovedCutouts??null,
  photoOnlyFallbackVerified:photoOnly,
  releaseAuthorized:false,
  productionModified:false
 });
}
export function assessIntegrated(report,stage,evidence,{today='2026-10-27'}={}){
 const stageResult=assessTogether(report,stage,{today});
 const visual=evaluateVisualReview(evidence);
 const ready=stageResult.decision==='READY FOR MAIN-THREAD REVIEW'&&
   visual.decision==='READY FOR MAIN-THREAD REVIEW';
 return Object.freeze({
  decision:ready?'READY FOR MAIN-THREAD REVIEW':'HOLD',
  stageAndFamily:stageResult,visual,
  deploymentAuthorized:false,
  credentialsEnabled:false,
  productionModified:false,
  note:'Even a fully evidenced PASS is for explicit main-thread owner review, never an automatic staging invitation or deployment.'
 });
}
export async function readIntegratedSnapshot(){
 const paths=[
  'docs/family-alpha-27/release-report.json',
  'docs/family-alpha-27/staging-metadata-audit-20261027.json',
  'docs/family-alpha-44/integrated-release-evidence-20261027.json'
 ];
 return Promise.all(paths.map(async path=>JSON.parse(await readFile(path,'utf8'))));
}
export async function auditIntegratedBuild({today='2026-10-27'}={}){
 // This source-pin audit makes it impossible to mistake ordinary source
 // HTML for a validated full Family Alpha compiled candidate.
 const m=await assert43HOLD();
 const [report,stage,evidence]=await readIntegratedSnapshot();
 const assessment=assessIntegrated(report,stage,evidence,{today});
 if(m.releaseGate!=='HOLD'||m.deployAuthorized!==false||
   assessment.deploymentAuthorized!==false||
   assessment.decision!=='HOLD')
  throw Error('STOP: source-pinned family release HOLD or source integrity violated');
 return assessment;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const review=await auditIntegratedBuild({today:process.argv[2]||'2026-10-27'});
 console.log(JSON.stringify(review,null,2));
 console.log('FAMILY_ALPHA_44_CORRECTLY_HELD: 0 accepted cutouts, 1 stage user, no four-JWT privacy or real garment visual approval');
}
