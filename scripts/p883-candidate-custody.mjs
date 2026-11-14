/**
 * Mission 1 P883 — public DEVELOPMENT candidate custody, NOT blinded truth.
 * Only source originality/digests/known exposure overlap are automated.
 * No machine check certifies a garment, photographer rights, physical group,
 * labels, subject releases, independence of reviewers, or model accuracy.
 */
import {checkOverlap,sourceKey,sourceSeriesHint,verifiedSource,publicAuditReport} from './p75-dataset-core.mjs';
const forbid=reason=>{throw Error('P883_'+reason);};
/** Conservative museum source-identity screen. A repeated museum accession
 * is only SUSPECTED to be the same physical object, so quarantine/skip its
 * sibling rather than silently count two different garments or blind groups.
 * Original P75 historical sourceSeriesHint recognizes MET/LACMA, but not
 * Commons Auckland Museum filenames '(AM 2008.11.3-1)' and '-2'.
 */
export function sourceSeriesHint883(url){
 const original=sourceSeriesHint(url);
 if(original)return original;
 const key=sourceKey(url);
 const match=key?.match(/\bam[ _-]+(\d{4}(?:\.\d+){2,})(?:-\d+)?\b/);
 return match?'museum-accession-am:'+match[1]:null;
}
export function exposedSources883(manifests,pinned){
 if(!Array.isArray(pinned?.rows)||pinned.schema!=='p75-public-candidates-pin-v1')forbid('PINNED_P75_LEDGER');
 const seen=new Set(),exposed=[];
 for(const [name,rows] of Object.entries(manifests)){
  if(!Array.isArray(rows))forbid('HISTORICAL_MANIFEST');
  for(const row of rows){
   const source=row.sourcePage||row.source||row.attribution?.source;
   const key=sourceKey(source);
   const receipt={id:row.id,sourcePage:source,
    sha256:row.sha256,seriesKey:row.seriesKey||sourceSeriesHint883(source),from:name};
   const receiptKey=(receipt.sha256||'')+'|'+(key||'');
   if(!seen.has(receiptKey)){exposed.push(receipt);seen.add(receiptKey);}
  }
 }
 for(const row of pinned.rows){
  if(!row.sourcePage||!row.sha256)forbid('PINNED_P75_SOURCE');
  const key=sourceKey(row.sourcePage);
  if(!key)forbid('PINNED_P75_URL');
  const receipt={id:row.id,sourcePage:row.sourcePage,sha256:row.sha256,
   dhash64:row.dhash64,seriesKey:row.seriesKey||sourceSeriesHint883(row.sourcePage),
   from:'previous-p75-publicly-exposed-not-blind'};
  const receiptKey=receipt.sha256+'|'+key;
  if(!seen.has(receiptKey)){exposed.push(receipt);seen.add(receiptKey);}
 }
 return exposed;
}
export function inspectNewCandidate883(row,exposed,accepted=[]){
 if(!Array.isArray(exposed)||!Array.isArray(accepted))forbid('CANDIDATE_COHORT');
 const issues=verifiedSource(row);
 if(row?.split!=='quarantine'||row?.sourceGroupApproved!==false||
   row?.garmentHumanVerified!==false||row?.photoContent!=='unreviewed'||
   row?.rightsReview!=='manual-review-required'||row?.modelScored!==false||
   row?.labelsPublic!==false||row?.sourceGroupId!==null)
  issues.push('unapproved-public-claim');
 // Repair missing accession grouping on incoming metadata before comparing;
 // the actual old source record remains untouched.
 const group=sourceSeriesHint883(row?.sourcePage);
 const normalized={...row,seriesKey:group||row?.seriesKey||null};
 const prior=[...exposed,...accepted].map(p=>({...p,seriesKey:p.seriesKey||sourceSeriesHint883(p.sourcePage)}));
 const flags=checkOverlap(normalized,prior);
 return {sourceMachineVerified:issues.length===0,
  newSourceDisjoint:issues.length===0&&flags.length===0,
  issues:[...new Set(issues)].sort(),overlapFlags:flags};
}
export function reportCandidates883(rows,exposed,{planQueries,querySuccesses,failures={}}={}){
 if(!Array.isArray(rows)||!Array.isArray(exposed)||!Number.isInteger(planQueries)||
  !Number.isInteger(querySuccesses)||planQueries<1||planQueries>12||
  querySuccesses<0||querySuccesses>planQueries)forbid('REPORT_INPUT');
 const ids=new Set(),hashes=new Set(),sources=new Set();
 for(let i=0;i<rows.length;i++){
  const r=rows[i],p=inspectNewCandidate883(r,exposed,rows.slice(0,i));
  if(!p.newSourceDisjoint)forbid('UNSAFE_OR_REPEATED_SOURCE');
  if(ids.has(r.id)||hashes.has(r.sha256)||sources.has(sourceKey(r.sourcePage)))forbid('DUPLICATE_RECEIPT');
  ids.add(r.id);hashes.add(r.sha256);sources.add(sourceKey(r.sourcePage));
 }
 const base=publicAuditReport(rows,exposed);
 return {schema:'mission1-public-commons-expansion-883-v1',status:'PUBLIC_UNLABELED_DEVELOPMENT_QUARANTINE_ONLY',
  ...base,queriesPlanned:planQueries,queriesSucceeded:querySuccesses,rejectedByReason:failures,
  machineVerifiedNewOriginals:rows.length,publicPreviouslyExposedSourceReceipts:exposed.length,
  distinctNewSourceDigests:hashes.size,sourceGroupHumanApproved:0,
  humanGarmentLabels:0,twoHumanConsensusLabels:0,humanSubtypes:0,
  verifiedSubjectOrArtistRights:0,availableForBlindEvaluation:0,
  independentBlindOriginals:0,independentBlindAccuracy:null,
  trainingDataApproved:0,developmentDataApproved:0,
  humanReviewedGarmentGroups:0,modelInferencesPerformed:0,
  modelPromoted:false,originalJPEGsCommitted:0,originalJPEGsInCIArtifacts:0,
  externalAccountDataRead:false,privateWardrobesTouched:false,
  releaseReady:false,shouldLiftFamilyAlphaHold:false};
}
