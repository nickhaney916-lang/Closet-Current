/**
 * SOURCE100 — independent original-photograph instance disagreement triage.
 *
 * Not a classifier, a source-label oracle, or an independent-human identity
 * verification. Never exposes private reviewer names, polygon vertices,
 * instance categories, types, colors, notes or JPEG data in its report.
 *
 * The inherited P94 greedy match can choose one high-IoU pair even where a
 * different pair assignment would match both independently drawn garments.
 * This module performs MAXIMUM-CARDINALITY bipartite mask matching (separate
 * geometry-only and exact category/subtype/color stages) and explicitly
 * warns whenever that provisional result disagrees with P99's old gate.
 */
import {makeSource99Packets,auditProvisionalHumanReviews99}
 from '../source97-human-adjudication-99/review-intake-gate.mjs';
import {validateInstanceReview94,polygonIoU94}
 from '../independent-instance-ground-truth-94/instance-evidence.mjs';

export const SOURCE100_SCHEMA='closet-current-multi-instance-conflict-triage-100/v1';
const MAX=20, THRESHOLD=0.5;
const fail=msg=>{throw Error('SOURCE100 '+msg);};

/**
 * Scores must be true normalized finite [0,1] overlap measures. Returning
 * one-to-one MAXIMUM cardinality rather than greedy maximum local IoU avoids
 * false A/B conflicts on multi-garment overlapping masks. Score ordering
 * breaks ties but does not change the maximum number of assigned pairs.
 */
export function maximumCardinalityMatches100(matrix,{threshold=THRESHOLD}={}){
 if(!Array.isArray(matrix)||matrix.length>MAX||!Number.isFinite(threshold)||
  threshold<=0||threshold>1)fail('invalid maximum matching matrix or threshold');
 const rows=matrix.length,columns=rows?matrix[0]?.length:0;
 if(!Number.isInteger(columns)||columns<0||columns>MAX||
  matrix.some(row=>!Array.isArray(row)||row.length!==columns||
   row.some(x=>x!==null&&(!Number.isFinite(x)||x<0||x>1))))
  fail('mask matrix is not a finite rectangular normalized IoU matrix');
 if(!rows||!columns)return [];
 const candidates=matrix.map(row=>row.map((score,j)=>({score,j}))
  .filter(p=>p.score!==null&&p.score>=threshold)
  .sort((a,b)=>b.score-a.score||a.j-b.j).map(p=>p.j));
 const leftOrder=[...Array(rows).keys()].sort((a,b)=>
  candidates[a].length-candidates[b].length||a-b);
 const owners=Array(columns).fill(-1);
 const augment=(i,visited)=>{
  for(const j of candidates[i]){
   if(visited.has(j))continue;
   visited.add(j);
   if(owners[j]===-1||augment(owners[j],visited)){
    owners[j]=i;return true;
   }
  }
  return false;
 };
 for(const i of leftOrder)augment(i,new Set());
 return owners.map((i,j)=>i<0?null:{a:i,b:j,iou:matrix[i][j]})
  .filter(Boolean).sort((a,b)=>a.a-b.a||a.b-b.b);
}
const sameLabels=(a,b)=>['category','itemType','primaryColor','secondaryColor']
 .every(k=>a[k]===b[k]);
const sameVertices=(a,b)=>JSON.stringify(a.polygon)===JSON.stringify(b.polygon);
function compareRows100(a,b){
 const scores=a.instances.map(left=>b.instances.map(right=>
  polygonIoU94(left.polygon,right.polygon)));
 const geometry=maximumCardinalityMatches100(scores);
 const labeled=maximumCardinalityMatches100(scores.map((row,i)=>row.map((v,j)=>
  sameLabels(a.instances[i],b.instances[j])?v:null)));
 const flags=[];
 if(a.noGarments!==b.noGarments)flags.push('NO_GARMENTS_VS_GARMENTS_CONFLICT');
 if(a.instances.length!==b.instances.length)flags.push('INSTANCE_COUNT_MISMATCH');
 if(geometry.length!==Math.min(a.instances.length,b.instances.length))
  flags.push('UNMATCHED_GARMENT_BOUNDARIES');
 if(geometry.length>labeled.length)flags.push('CATEGORY_SUBTYPE_OR_COLOR_CONFLICT');
 if(geometry.some(p=>sameVertices(a.instances[p.a],b.instances[p.b])))
  flags.push('IDENTICAL_POLYGON_COORDINATES_REVIEW_INDEPENDENCE');
 if(a.reviewedAt===b.reviewedAt)
  flags.push('IDENTICAL_REVIEW_TIMESTAMP_REVIEW_INDEPENDENCE');
 if(scores.some(row=>row.filter(v=>v>=THRESHOLD).length>1)||
  scores.some((_,i)=>false)||
  (scores.length&&scores[0].some((_,j)=>scores.filter(row=>row[j]>=THRESHOLD).length>1)))
  flags.push('AMBIGUOUS_OVERLAPPING_MASK_ASSOCIATION');
 const equalCounts=a.instances.length===b.instances.length;
 const matchAll=equalCounts&&labeled.length===a.instances.length&&
  a.noGarments===b.noGarments;
 return {flags,geometryPairs:geometry.length,labeledPairs:labeled.length,
  matchedFullCount:matchAll,isNegative:matchAll&&a.noGarments,
  copyingCaution:flags.includes('IDENTICAL_POLYGON_COORDINATES_REVIEW_INDEPENDENCE')||
   flags.includes('IDENTICAL_REVIEW_TIMESTAMP_REVIEW_INDEPENDENCE'),
  ambiguous:flags.includes('AMBIGUOUS_OVERLAPPING_MASK_ASSOCIATION')};
}
export function triageSource97Instances100({
 manifest,original59,quarantined96,exportsByRole={}
}={}){
 const legacy=auditProvisionalHumanReviews99({
  manifest,original59,quarantined96,exportsByRole
 });
 const packets=makeSource99Packets({manifest,original59,quarantined96});
 const rows={};
 for(const role of ['A','B','C']){
  const review=exportsByRole[role];
  rows[role]=review==null?new Map():new Map(
   validateInstanceReview94(packets[role],review).rows.map(row=>[row.id,row]));
 }
 const legacyStatus=new Map(legacy.sourceStatus.map(r=>[r.id,r.status]));
 const sourceStatus=manifest.candidates.map(c=>{
  const a=rows.A.get(c.id),b=rows.B.get(c.id),third=rows.C.get(c.id);
  if(!a||!b){
   return {sourceId:c.id,status:'AWAITING_INDEPENDENT_A_B',
    flags:[],thirdRolePresent:!!third};
  }
  const compared=compareRows100(a,b),flags=[...compared.flags];
  const former=legacyStatus.get(c.id);
  if(compared.matchedFullCount&&
   former!=='TWO_SELF_ATTESTED_REVIEWERS_AGREE_UNVERIFIED')
   flags.push('DISAGREES_WITH_LEGACY_GREEDY_MATCHER_MANUAL_AUDIT');
  if(third&&compared.matchedFullCount)
   flags.push('UNSOLICITED_THIRD_REVIEW_SOURCE');
  if(compared.matchedFullCount){
   // Exact point copying or ambiguous overlap must never be described as
   // independently accepted. Matching source IDs is not verified identity.
   const uncertain=compared.copyingCaution||compared.ambiguous||
    flags.includes('DISAGREES_WITH_LEGACY_GREEDY_MATCHER_MANUAL_AUDIT');
   return {sourceId:c.id,status:uncertain?
    'A_B_MATCHABLE_BUT_INDEPENDENCE_OR_ASSOCIATION_REVIEW_REQUIRED':
    compared.isNegative?'A_B_PROVISIONAL_NO_GARMENTS':'A_B_PROVISIONAL_MASK_AGREEMENT',
    flags,thirdRolePresent:!!third};
  }
  if(!third)flags.push('THIRD_INDEPENDENT_REVIEW_REQUIRED');
  return {sourceId:c.id,
   status:third?'C_REVIEW_PRESENT_SELF_ATTESTED_ONLY':'A_B_CONFLICT_NEEDS_C',
   flags,thirdRolePresent:!!third};
 });
 const counts=sourceStatus.reduce((all,r)=>{
  all[r.status]=(all[r.status]||0)+1;return all;
 },{});
 // No label, individual human identity, mask shape, freeform note or garment
 // color is included. Even an A/B/C completion is NEVER scientific pass.
 return Object.freeze({
  schema:SOURCE100_SCHEMA,
  researchOnly:true,photoCohort:7,originalFrozen:59,olderQuarantine:2,
  scientificAcceptedNewSources:0,
  eligibleOriginalPhotoGapUntil100:41,
  sourceStatus,counts,
  independentlyVerifiedHumanReviewers:0,
  independentHumanIdentitiesValidated:false,
  sourceCandidateModelExposureAudited:false,
  sourceCandidateUnseenHoldoutEligible:false,
  perInstancePrecision:null,perInstanceRecall:null,perInstanceMaskIoU:null,
  categoryAccuracy:null,subtypeAccuracy:null,
  primaryColorAccuracy:null,secondaryColorAccuracy:null,
  redactedNoPrivateSourceLabels:true,
  redactedNoIndividualReviewerIdentifiers:true,
  redactedNoMaskVerticesOrPhotos:true,
  fromAutomatedQATestIsNotHumanGroundTruth:true,
  releaseAuthorized:false,familyAlpha:'HOLD',
  verdict:'CONFLICT_TRIAGE_ONLY_REAL_HUMAN_REVIEW_REQUIRED'
 });
}
