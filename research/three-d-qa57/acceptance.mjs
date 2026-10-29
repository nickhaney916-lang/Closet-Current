/**
 * Independent Work #57 human visual acceptance gate.
 * This is intentionally separate from 3D08/09 geometry, rigging and texture code.
 * Automated geometry, source hashes and screenshots can NEVER sign off a garment.
 */
export const SUBJECTS=Object.freeze(['female','male']);
export const POSES=Object.freeze(['source','relaxed']);
export const VIEWS=Object.freeze(['front','side','back']);
export const CRITERIA=Object.freeze([
 'photoFidelity','collarShoulders','sleeveCuffFit','sideDrape',
 'bodyClipping','overallRealism'
]);
export const evidenceKey=(model,pose,view)=>model+':'+pose+':'+view;
const validHash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function assessFamilyAlpha(review,ledger){
 const blockers=[];
 if(review?.disposition!=='APPROVE')blockers.push('Human disposition is not APPROVE');
 if(typeof review?.reviewer!=='string'||review.reviewer.trim().length<3)
  blockers.push('Independent human reviewer not identified');
 if(typeof review?.reviewDate!=='string'||!/^20\d\d-\d\d-\d\d$/.test(review.reviewDate))
  blockers.push('Human review date missing');
 if(!review?.physicalDeviceTested)blockers.push('Physical-phone testing not signed off');
 if(!review?.privacyGateVerified)blockers.push('Four-account privacy gate not signed off');
 if(!review?.ownerReleaseApproval)blockers.push('Owner release approval missing');
 if(ledger?.release!=='HOLD'||ledger?.sourceId!=='commons-0003')
  blockers.push('Frozen source ledger missing or unexpected');
 if(!validHash(ledger?.originalSHA256)||!validHash(ledger?.cutoutSHA256))
  blockers.push('Original/cutout SHA256 evidence missing');
 for(const model of SUBJECTS)for(const pose of POSES)for(const view of VIEWS){
  const k=evidenceKey(model,pose,view),row=review?.assessments?.[k],hash=ledger?.screenshots?.[k];
  if(!validHash(hash)){blockers.push(k+' original GPU screenshot missing');continue;}
  if(row?.screenshotSHA256!==hash)blockers.push(k+' screenshot provenance mismatch');
  if(typeof row?.notes!=='string'||row.notes.trim().length<15)
   blockers.push(k+' independent visual explanation missing');
  for(const c of CRITERIA)if(row?.[c]!=='PASS')
   blockers.push(k+' '+c+' not human-approved PASS');
 }
 return {approved:blockers.length===0,blockers};
}
