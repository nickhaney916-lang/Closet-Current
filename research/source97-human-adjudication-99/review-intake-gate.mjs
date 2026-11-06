/**
 * SOURCE99 — source-locked P98 human review intake. Research-only.
 *
 * Reads PRIVATE REVIEW JSON in memory, rejects unbound/tampered/QA data,
 * never writes labels, reviewers, source JPEG bytes, or model predictions.
 * P94's agreement is provisional because self-attestation is not a human
 * identity audit; P97's source pool has not been exposure-cleared or accepted
 * into an independent locked benchmark. All scientific scores MUST stay null.
 */
import {verifyProvenance97} from '../new-real-commons-candidate-cohort-97/source-gate.mjs';
import {
 makeInstancePacket94,validateInstanceReview94,reconcileIndependentInstanceReviews94
} from '../independent-instance-ground-truth-94/instance-evidence.mjs';

export const SOURCE99_SCHEMA='closet-current-human-review-intake-99/v1';
const ROLES=['A','B','C'];
const sha=/^[a-f0-9]{64}$/;
const fail=s=>{throw Error('SOURCE99 '+s);};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,keys)=>plain(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');
const reviewKeys=['schema','role','packetId','reviewerId','method','independent','identityVerification','rows'];
const rowKeys=['id','sourceSHA256','reviewerId','reviewedAt','noGarments','note','instances'];
const instanceKeys=['category','itemType','primaryColor','secondaryColor','polygon'];
function source(c){
 if(!plain(c)||!/^r97-[a-z-]{6,50}$/.test(c.id||'')||
  !sha.test(c.pinnedSourceSHA256||'')||c.holdoutEligible!==false||
  c.quarantine!==true||c.knownModelExposure!=='NOT_AUDITED'||
  !/^https:\/\/commons.wikimedia.org\/wiki\/File:/.test(c.commonsPage||''))
  fail('candidate no longer strictly P97 source-SHA-quarantined');
 return {id:c.id,image:c.id+'.jpg',sha256:c.pinnedSourceSHA256,
  verified:true,attribution:{source:c.commonsPage,license:c.license}};
}
export function makeSource99Packets({manifest,original59,quarantined96}={}){
 verifyProvenance97({manifest,original59,quarantined96,requirePinned:true});
 const sources=manifest.candidates.map(source);
 if(new Set(sources.map(x=>x.id)).size!==7||
  new Set(sources.map(x=>x.sha256)).size!==7)
  fail('source identity collision');
 return Object.fromEntries(ROLES.map(role=>[role,makeInstancePacket94({sources,role})]));
}
function strictReviewShape99(review){
 if(!exact(review,reviewKeys)||!Array.isArray(review.rows)||review.rows.length>7)
  fail('unexpected review fields or source records; no photos/private extras permitted');
 if(/^(qa[-_.]|robot[-_.]|synthetic[-_.]|automated[-_.]|test[-_.])/i.test(review.reviewerId||''))
  fail('automated QA persona cannot be imported as a real human reviewer');
 for(const row of review.rows){
  if(!exact(row,rowKeys)||typeof row.note!=='string'||row.note.length>600||
   !Array.isArray(row.instances)||row.instances.length>20)
   fail('unexpected per-image fields, oversized note, or noncanonical human row');
  for(const instance of row.instances)
   if(!exact(instance,instanceKeys)||
    !Array.isArray(instance.polygon)||instance.polygon.length>96)
    fail('unexpected garment/mask data or excessive polygon vertices');
 }
}
/**
 * A and B may be independently submitted in either order. C MUST only enter
 * after A and B are present, as a resolution for source-specific disagreements.
 * No caller-supplied "approved" or identity attestation can promote scientific
 * accuracy or independent human identity verification.
 */
export function auditProvisionalHumanReviews99({
 manifest,original59,quarantined96,exportsByRole={}
}={}){
 const packets=makeSource99Packets({manifest,original59,quarantined96});
 if(!plain(exportsByRole)||
    Object.keys(exportsByRole).some(role=>!ROLES.includes(role)))
  fail('unrecognized review roles or review map');
 const validated={};
 for(const role of ROLES){
  const review=exportsByRole[role];
  if(review===undefined||review===null)continue;
  strictReviewShape99(review);
  validated[role]=validateInstanceReview94(packets[role],review);
 }
 if(validated.C&&(!validated.A||!validated.B))
  fail('third-person adjudicator only when A and B supplied');
 const persons=Object.values(validated).map(x=>x.reviewerId);
 if(new Set(persons).size!==persons.length)
  fail('reviewer reused across nominally distinct independent roles');
 let pair=null;
 if(validated.A&&validated.B){
  pair=reconcileIndependentInstanceReviews94({
   packetA:packets.A,reviewA:exportsByRole.A,
   packetB:packets.B,reviewB:exportsByRole.B,
   ...(validated.C?{packetC:packets.C,reviewC:exportsByRole.C}:{})
  });
 }
 // An A/B pair agreement is provisional, NOT independent identity-validated.
 const agreed=pair?.accepted.filter(x=>x.adjudicatedBy==='A/B-independent-agreement')||[];
 const third=pair?.accepted.filter(x=>x.adjudicatedBy==='third-human-source-bound')||[];
 const pending=pair?.pending||[];
 const idStatus=new Map(manifest.candidates.map(c=>[c.id,'AWAITING_TWO_REVIEWER_LABELS']));
 for(const x of agreed)idStatus.set(x.id,'TWO_SELF_ATTESTED_REVIEWERS_AGREE_UNVERIFIED');
 for(const x of third)idStatus.set(x.id,'THIRD_SELF_ATTESTED_ADJUDICATION_UNVERIFIED');
 for(const x of pending)idStatus.set(x.id,x.reason==='third-human-mask-adjudication-required'?
  'AWAITING_THIRD_ADJUDICATION':'AWAITING_TWO_REVIEWER_LABELS');
 // Safety invariant: no incoming photo or person identifiers in exported
 // metadata. A role can submit fewer than 7 human rows; never count the other
 // 7-n as an inspected negative-control photo.
 return Object.freeze({
  schema:SOURCE99_SCHEMA,researchOnly:true,
  sourcePhotoCount:7,originalFrozenPhotoCount:59,
  oldModelExposedQuarantineCount:2,newCandidatesScientificallyAccepted:0,
  independentEligibleSourceGapStill41:true,
  reviewerRolesProvided:Object.keys(validated).length,
  reviewedSourceCounts:Object.fromEntries(ROLES.map(role=>[role,validated[role]?.rows.length||0])),
  selfAttestedAgreementOnly:agreed.length,
  selfAttestedThirdAdjudicationOnly:third.length,
  unresolvedSources:7-agreed.length-third.length,
  thirdReviewerStillRequired:pending.filter(x=>x.reason==='third-human-mask-adjudication-required').length,
  sourceStatus:manifest.candidates.map(c=>({id:c.id,status:idStatus.get(c.id)})),
  actualHumanIdentityVerified:false,
  humanIndependentReviewVerified:false,
  realHumanReviewAssertionsVerifiedExternally:false,
  importedReviewContentIsPrivate:true,
  QAIsNotHumanTruth:true,
  candidateModelExposureAudited:false,
  quarantinedNoLockedEvaluation:true,
  perInstancePrecision:null,perInstanceRecall:null,realModelMaskIoU:null,
  categoryAccuracy:null,subtypeAccuracy:null,
  primaryColorAccuracy:null,secondaryColorAccuracy:null,
  originalPhotoBytesInReport:false,reviewerIDsInReport:false,
  sourceGarmentLabelsInReport:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  verdict:'PROVISIONAL_REVIEW_INTAKE_NOT_SCIENTIFIC_ACCEPTANCE'
 });
}
