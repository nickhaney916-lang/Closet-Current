/**
 * Mission 1 P886: exact Parallel #78 physical acceptance case identity.
 * Node-only independent signed summary validator; no private media reads.
 * Import the ACTUAL 23-case operator recorder so release cannot silently
 * invent/rename a list of easier scenarios.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const recorder=require('../public/device-acceptance-78.js');
export const REQUIRED_PHONE_CASES886=Object.freeze(recorder.CASES.map(([id])=>id));
const COMMIT=/^[a-f0-9]{40}$/,SHA=/^[a-f0-9]{64}$/;
if(REQUIRED_PHONE_CASES886.length!==23||
   new Set(REQUIRED_PHONE_CASES886).size!==23)
 throw Error('P886_PHYSICAL_PROTOCOL_MISMATCH');
const validDate=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT/.test(s)&&Number.isFinite(Date.parse(s));
/**
 * This checks a role-SIGNED REDACTED manifest of independently witnessed
 * physical artifacts. A valid digest or timestamp DOES NOT prove a phone or
 * witness actually existed. External trusted examination remains required.
 * Never include photographed original, its SHA, filenames, accounts or EXIF.
 */
export function verifyPhoneCaseLedger886(device,{
 targetCommit,approvedAt,signedAt,usedProofDigests=new Set()
}={}){
 const fail=reason=>({ok:false,reason});
 if(!device||typeof device!=='object'||!COMMIT.test(targetCommit||'')||
    device.sourceCommit!==targetCommit)
  return fail('P886_WRONG_RUNNING_APP_COMMIT');
 if(!validDate(approvedAt)||!validDate(signedAt)||
    Date.parse(approvedAt)>=Date.parse(signedAt))
  return fail('P886_PHYSICAL_WITNESS_TIME');
 if(!Array.isArray(device.cases)||device.cases.length!==REQUIRED_PHONE_CASES886.length)
  return fail('P886_INCOMPLETE_CASE_LEDGER');
 const expected=new Set(REQUIRED_PHONE_CASES886),seen=new Set(),newProofs=new Set();
 for(const row of device.cases){
  if(!row||typeof row!=='object'||!expected.has(row.caseId)||seen.has(row.caseId))
   return fail('P886_DUPLICATE_OR_UNKNOWN_CASE');
  seen.add(row.caseId);
  if(row.status!=='PASS'||row.severity==='P0'||row.severity==='P1'||
     row.severity==='P2'||!['NONE','P3'].includes(row.severity))
   return fail('P886_UNPASSED_CASE');
  if(typeof row.evidenceSha256!=='string'||!SHA.test(row.evidenceSha256)||
     newProofs.has(row.evidenceSha256)||usedProofDigests.has(row.evidenceSha256))
   return fail('P886_MISSING_OR_REUSED_CASE_PROOF');
  if(!validDate(row.observedAt)||
     Date.parse(row.observedAt)<Date.parse(approvedAt)||
     Date.parse(row.observedAt)>Date.parse(signedAt))
   return fail('P886_UNBOUND_PHYSICAL_CASE_TIME');
  newProofs.add(row.evidenceSha256);
 }
 if(seen.size!==23||REQUIRED_PHONE_CASES886.some(id=>!seen.has(id)))
  return fail('P886_INCOMPLETE_CASE_LEDGER');
 // Commit only if ALL 23 proof records passed. No poisoned global set on fail.
 for(const digest of newProofs)usedProofDigests.add(digest);
 return {ok:true,caseCount:23};
}
