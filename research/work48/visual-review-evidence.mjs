/**
 * Family Alpha #59 — human-initiated, UNVERIFIED visual review evidence.
 * This module never grants release, authenticates an owner, edits source pixels,
 * or transmits files. It is intentionally separate from official Work48 grades.
 */
export const SCHEMA='closet-current-manual-licensed-visual-review-v1';
export const CHECKS=Object.freeze([
 'sourcePixels','cutoutEdge','bodyAttachment','proportions'
]);
export const DECISIONS=Object.freeze(['NOT_REVIEWED','PASS','REVIEW','FAIL']);
export const REASONS=Object.freeze([
 'All four visual criteria manually checked',
 'Sleeves or underarm attachment still disconnected',
 'Shoulder seams or neck placement appear wrong',
 'Waist, hem or body proportions look unnatural',
 'Cutout fringe, hanger or background remains',
 'Original photo does not support a faithful front view',
 'Missing or occluded fabric cannot be reconstructed',
 'Single-view footwear is reference-only',
 'Print, fabric or fine details are visually distorted',
 'Original-photo fallback needed for this garment'
]);
const ROOT=['schema','decision','release','ownerApproved','productionModified',
 'stagingModified','source','rows'];
const ROW=['id','decision','reason','checks'];
const keys=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===allowed.length&&
 Object.keys(o).every(k=>allowed.includes(k))&&allowed.every(k=>Object.hasOwn(o,k));
const fail=(reason)=>{throw Error(reason);};
export function newReviewEvidence(manifest){
 if(!manifest?.rows||!Array.isArray(manifest.rows)||manifest.rows.length!==15||
  new Set(manifest.rows.map(x=>x.id)).size!==15||
  manifest.rows.some(x=>!/^commons-\d{4}$/.test(x.id)))
  fail('A verified frozen fifteen-item licensed benchmark is required');
 return {
  schema:SCHEMA,
  decision:'HOLD',release:'HOLD',ownerApproved:false,
  productionModified:false,stagingModified:false,
  source:'UNVERIFIED_MANUAL_LOCAL_REVIEW',
  rows:manifest.rows.map(x=>({id:x.id,decision:'NOT_REVIEWED',reason:'',
   checks:Object.fromEntries(CHECKS.map(k=>[k,false]))}))
 };
}
export function validateEvidence(manifest,evidence){
 const expected=newReviewEvidence(manifest);
 if(!keys(evidence,ROOT)||evidence.schema!==SCHEMA||
  evidence.decision!=='HOLD'||evidence.release!=='HOLD'||
  evidence.ownerApproved!==false||evidence.productionModified!==false||
  evidence.stagingModified!==false||evidence.source!=='UNVERIFIED_MANUAL_LOCAL_REVIEW'||
  !Array.isArray(evidence.rows)||evidence.rows.length!==15)
  fail('Review format or non-release conditions invalid');
 let reviewed=0,passes=0,needsReview=0,failed=0;
 for(let i=0;i<15;i++){
  const row=evidence.rows[i],original=manifest.rows[i];
  if(!keys(row,ROW)||row.id!==expected.rows[i].id||
    !DECISIONS.includes(row.decision)||typeof row.reason!=='string'||
    row.reason.length>400||!keys(row.checks,CHECKS)||
    CHECKS.some(k=>typeof row.checks[k]!=='boolean'))
   fail('Visual decision contains missing, unexpected, or invalid fields');
  if(row.decision==='NOT_REVIEWED'){
   if(row.reason!==''||CHECKS.some(k=>row.checks[k]))fail('Pending rows must not claim review evidence');
   continue;
  }
  if(!REASONS.includes(row.reason))
   fail('Every completed visual judgment needs a specific 12–400 character explanation');
  if(row.decision==='PASS'){
   if(!original.profile||!original.hasCutout||CHECKS.some(k=>!row.checks[k]))
    fail('A manual PASS requires a supported fit, reviewed cutout and all four checked criteria');
   passes++;
  }else if(row.decision==='REVIEW'){needsReview++;}
  else failed++;
  reviewed++;
 }
 return Object.freeze({
  disposition:'HOLD',reviewed,pending:15-reviewed,pass:passes,
  review:needsReview,fail:failed,complete:reviewed===15,
  ownerApprovalVerified:false,releaseAuthorized:false,
  actualDeviceVerified:false
 });
}
export function recordReview(manifest,evidence,id,decision,reason,checks={}){
 validateEvidence(manifest,evidence);
 const i=manifest.rows.findIndex(r=>r.id===id);
 if(i<0||!DECISIONS.includes(decision))fail('Unknown garment or invalid grade');
 const copy=structuredClone(evidence);
 copy.rows[i]={id,decision,reason:decision==='NOT_REVIEWED'?'':reason,
  checks:Object.fromEntries(CHECKS.map(k=>[k,decision==='NOT_REVIEWED'?false:checks[k]===true]))};
 validateEvidence(manifest,copy);
 return copy;
}
export function parseReviewImport(manifest,json){
 if(typeof json!=='string'||json.length>32000)fail('Visual evidence too large or not JSON text');
 let e;
 try{e=JSON.parse(json);}catch{fail('Invalid JSON visual review file');}
 validateEvidence(manifest,e);
 return e;
}
export function serializeReviewExport(manifest,evidence){
 validateEvidence(manifest,evidence);
 return JSON.stringify({ ...evidence },null,2)+'\n';
}
