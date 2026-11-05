/**
 * BLINDED-HUMAN-COLOR-REVIEW-61 — immutable, offline review evidence protocol.
 *
 * Packets contain source JPEG identity but NEVER old labels, model guesses,
 * previous reviewers' answers, split/holdout status or owner photos.
 * A browser export is SELF-ATTESTED human activity, not cryptographic proof
 * of reviewer identity or a completed independent human study.
 */
import {createHash} from 'node:crypto';
import {COMMIT43_TYPES,validReviewTaxonomy43} from '../multi-garment-capture-01/atomic-group.mjs';
import {COLORS60} from '../recognition-ground-truth-gate-60/ground-truth-gate.mjs';
const SHA=/^[a-f0-9]{64}$/;
const roles=new Set(['A','B','C']);
const colors=new Set(COLORS60);
const digest=text=>createHash('sha256').update(text).digest('hex');
const err=message=>{throw Error('BLIND61 '+message);};
export const REVIEW_PROTOCOL61='closet-current-human-review-61/v1';
export const PACKET_PROTOCOL61='closet-current-blind-packet-61/v1';
export const reviewTaxonomy61=Object.freeze(
 Object.fromEntries(Object.entries(COMMIT43_TYPES).map(([k,v])=>[k,[...v]]))
);
export function makeBlindPacket61({sets,sources,role,onlyIds=null}){
 if(!roles.has(role))err('unknown role');
 if(!sets||!Array.isArray(sources))err('source/partition input missing');
 const sourceMap=new Map(),seenIds=new Set(),seenSHA=new Set(),items=[];
 for(const s of sources){
  if(!s||typeof s.id!=='string'||!SHA.test(s.sha256)||sourceMap.has(s.id))
   err('bad/duplicate source row');
  sourceMap.set(s.id,s);
 }
 const eligible=new Set();
 for(const split of ['development','validation','locked-evaluation']){
  if(!Array.isArray(sets[split]))err('missing partition '+split);
  for(const row of sets[split]){
   const s=sourceMap.get(row?.id);
   if(!s||row.image!==s.image||!s.verified||!s.attribution?.source||!s.attribution?.license)
    err('source license/image evidence missing '+row?.id);
   if(seenIds.has(row.id)||seenSHA.has(s.sha256))
    err('duplicate ID/SHA across partitions');
   seenIds.add(row.id);seenSHA.add(s.sha256);eligible.add(row.id);
   // Deliberately discard existing expectedCategory, expectedType,
   // labels, source filename titles and partition allocation.
   items.push({id:row.id,image:s.image,sourceSHA256:s.sha256});
  }
 }
 if(onlyIds!==null){
  if(!Array.isArray(onlyIds)||new Set(onlyIds).size!==onlyIds.length||
    onlyIds.some(id=>!eligible.has(id)))err('unknown/duplicate scoped review ID');
 }
 const chosen=onlyIds===null?items:items.filter(x=>onlyIds.includes(x.id));
 chosen.sort((a,b)=>digest(role+'|'+a.sourceSHA256).localeCompare(digest(role+'|'+b.sourceSHA256)));
 const packetId=digest(JSON.stringify({schema:PACKET_PROTOCOL61,role,items:chosen}));
 return {schema:PACKET_PROTOCOL61,role,packetId,blinded:true,
  neverShown:['previous-category','previous-subtype','model-prediction','reviewer-peer-vote','holdout-allocation'],
  total:chosen.length,taxonomy:reviewTaxonomy61,colors:[...COLORS60],items:chosen};
}
const humanID=x=>typeof x==='string'&&/^[A-Za-z0-9._-]{3,80}$/.test(x);
function checkedLabel61(row){
 if(!row||typeof row!=='object'||Array.isArray(row))return false;
 if(row.uncertain===true)
  return row.category===null&&row.itemType===null&&row.primaryColor===null&&
   row.secondaryColor===null&&typeof row.uncertaintyReason==='string'&&row.uncertaintyReason.trim().length>=8;
 if(row.uncertain!==false)return false;
 if(row.category==='Uncategorized')
  return row.itemType==='Unknown'&&row.primaryColor===null&&row.secondaryColor===null;
 return validReviewTaxonomy43(row.category,row.itemType)&&colors.has(row.primaryColor)&&
  (row.secondaryColor===null||colors.has(row.secondaryColor)&&row.secondaryColor!==row.primaryColor);
}
export function validateHumanExport61(packet,exp){
 if(!packet||packet.schema!==PACKET_PROTOCOL61||!roles.has(packet.role)||
  !Array.isArray(packet.items)||packet.total!==packet.items.length||
  typeof packet.packetId!=='string')err('invalid packet');
 const known=makeBlindPacketHash61(packet);
 if(packet.packetId!==known)err('packet tampered or mismatched');
 if(!exp||exp.schema!==REVIEW_PROTOCOL61||exp.role!==packet.role||
  exp.packetId!==packet.packetId||!humanID(exp.reviewerId)||
  exp.method!=='direct-human-visual-review'||exp.independent!==true||
  !Array.isArray(exp.rows))err('invalid self-attested review export');
 const byId=new Map(packet.items.map(r=>[r.id,r])),seen=new Set(),records=[];
 for(const row of exp.rows){
  const src=byId.get(row?.id);
  if(!src||seen.has(row.id)||row.sourceSHA256!==src.sourceSHA256)
   err('duplicate/unknown/misbound review source');
  if(row.reviewerId!==exp.reviewerId||row.method!==exp.method||row.independent!==true||
   typeof row.reviewedAt!=='string'||!Number.isFinite(Date.parse(row.reviewedAt)))
   err('invalid source-bound human review record metadata');
  if(!checkedLabel61(row))err('incomplete/invalid human category, subtype or color '+row.id);
  seen.add(row.id);records.push(row);
 }
 return {role:packet.role,reviewerId:exp.reviewerId,complete:seen.size===packet.items.length,
  reviewed:seen.size,total:packet.total,sourceSHA256:packet.packetId,
  rows:records,independenceSelfAttestedNotVerified:true};
}
export function makeBlindPacketHash61(packet){
 if(!packet||!roles.has(packet.role)||!Array.isArray(packet.items))err('packet hash input invalid');
 const sorted=packet.items.map(x=>({id:x.id,image:x.image,sourceSHA256:x.sourceSHA256}));
 for(const x of sorted){
  if(typeof x.id!=='string'||typeof x.image!=='string'||!SHA.test(x.sourceSHA256))
   err('malformed packet sample');
 }
 // Canonical source set identity does not rely on the current UI's render state.
 return digest(JSON.stringify({schema:PACKET_PROTOCOL61,role:packet.role,items:sorted}));
}
const labelOf=row=>row.uncertain===true?null:JSON.stringify({
 category:row.category,itemType:row.itemType,primaryColor:row.primaryColor,
 secondaryColor:row.secondaryColor
});
export function reconcileHumanExports61(packetA,reviewA,packetB,reviewB,packetC=null,reviewC=null){
 const a=validateHumanExport61(packetA,reviewA),b=validateHumanExport61(packetB,reviewB);
 if(packetA.role!=='A'||packetB.role!=='B'||a.reviewerId===b.reviewerId)
  err('same reviewer or wrong independent A/B role');
 const idsA=new Map(packetA.items.map(x=>[x.id,x])),idsB=new Map(packetB.items.map(x=>[x.id,x]));
 if(idsA.size!==idsB.size||[...idsA].some(([id,p])=>idsB.get(id)?.sourceSHA256!==p.sourceSHA256))
  err('reviewer packet identity/coverage mismatch');
 const recordsA=new Map(a.rows.map(x=>[x.id,x])),recordsB=new Map(b.rows.map(x=>[x.id,x]));
 let c=null,recordsC=new Map();
 if(packetC!==null||reviewC!==null){
  if(!packetC||!reviewC)err('third human packet and export required together');
  c=validateHumanExport61(packetC,reviewC);
  if(packetC.role!=='C'||[a.reviewerId,b.reviewerId].includes(c.reviewerId))
   err('third human must have distinct reviewer identity');
  recordsC=new Map(c.rows.map(x=>[x.id,x]));
  if([...recordsC.keys()].some(id=>!idsA.has(id)))err('unmatched third reviewer source');
 }
 const adjudications={},disagreements=[],pending=[],accepted=[];
 for(const [id,p] of idsA){
  const first=recordsA.get(id),second=recordsB.get(id);
  if(!first||!second){pending.push({id,reason:'missing-one-or-both-independent-review-votes'});continue;}
  const aa=labelOf(first),bb=labelOf(second);
  if(aa===null||bb===null){pending.push({id,reason:'reviewer-marked-ambiguous-or-out-of-scope'});continue;}
  const claim={sourceSHA256:p.sourceSHA256,independentReviews:[first,second]};
  if(aa!==bb){
   disagreements.push({id,sourceSHA256:p.sourceSHA256,reason:'category-subtype-or-color-disagreement'});
   const third=recordsC.get(id);
   if(!third||labelOf(third)===null){pending.push({id,reason:'separate-third-human-adjudication-required'});continue;}
   claim.adjudication=third;
  }
  adjudications[id]=claim;
  accepted.push(id);
 }
 return {schema:'closet-current-reconciled-review-61/v1',releaseAuthorized:false,
  humanIndependenceVerified:false,explanation:'Reviewer IDs and independence are self-attested; verify people and process outside software',
  reviewerIds:[a.reviewerId,b.reviewerId,...(c?[c.reviewerId]:[])],
  count:{sources:idsA.size,reviewedA:a.reviewed,reviewedB:b.reviewed,
   adjudicatorReviewed:c?.reviewed||0,accepted:accepted.length,disagreements:disagreements.length,
   pending:pending.length},
  adjudications,disagreements,pending,
  thirdHumanPacketIDs:disagreements.map(x=>x.id)};
}
