/**
 * M236 — source- and real-CI-run-bound WebKit runtime admission, research ONLY.
 * An all-green run NEVER erases a failed genuine fresh-process run on the same
 * immutable HEAD. Also an all-green candidate is NOT a causal permanent fix.
 * This module has no access to private wardrobe data, tokens, photos or network.
 */
const SHA=/^[0-9a-f]{40}$/;
const POSITIVE_SCOPE='original-pinned-segformer-real-model-owner-original-2d-v4';
const FAMILIES=new Set(['jsep','non-jsep-cpu']);
const CATEGORIES=new Set(['runtime-memory','runtime-other','session-hang']);
const refuse=(reason,details={})=>Object.freeze({
 status:'BLOCKED_UNVERIFIED',reason,eligibleForRuntimeChange:false,
 permanentWebKitRepairProven:false,familyAlphaAuthorized:false,...details
});
export function judgeWebkitCandidate236(input){
 if(!input||typeof input!=='object')return refuse('missing-candidate');
 const {runtimeFamily,headSha,runs}=input;
 if(!FAMILIES.has(runtimeFamily)||!SHA.test(headSha||''))
  return refuse('candidate-identity-not-pinned');
 if(!Array.isArray(runs)||runs.length<2||runs.length>20)
  return refuse('two-or-more-independent-native-runs-required');
 const ids=new Set();
 let webkitPassed=0,webkitFailed=0,chromiumPassed=0,chromiumFailed=0;
 const realFailureClasses={};
 for(const r of runs){
  if(!Number.isSafeInteger(r.runId)||r.runId<=0||ids.has(r.runId))
   return refuse('invalid-or-repeated-github-run-id');
  ids.add(r.runId);
  if(r.headSha!==headSha||r.runtimeFamily!==runtimeFamily||
     r.scope!==POSITIVE_SCOPE||r.originalSourceLocked!==true||
     r.publicLicensedPhoto!==true||r.nativeBrowser!==true||
     r.ownerExplicitApproval!==true||r.privateOriginalBackupV4!==true||
     r.originalCardPositiveAssertion!==true||r.noAutoSaveOnError!==true)
    return refuse('not-original-source-and-owner-acceptance');
  const {webkit,chromium}=r;
  if(!webkit||!chromium)return refuse('missing-browser-counters');
  for(const entry of [webkit,chromium]){
   if(!Number.isSafeInteger(entry.attempts)||entry.attempts<=0||
      !Number.isSafeInteger(entry.passed)||entry.passed<0||
      !Number.isSafeInteger(entry.failed)||entry.failed<0||
      entry.passed+entry.failed!==entry.attempts)
    return refuse('inconsistent-browser-counters');
  }
  if(webkit.attempts<24||chromium.attempts<8)
   return refuse('insufficient-fresh-browser-replication');
  const reasons=r.genuineWebkitFailures;
  if(!Array.isArray(reasons)||reasons.length!==webkit.failed)
   return refuse('missing-natural-webkit-failure-evidence');
  if(reasons.some(f=>!CATEGORIES.has(f)||typeof f!=='string'))
   return refuse('not-a-classified-natural-model-failure');
  if(r.runConclusion!==(webkit.failed>0||chromium.failed>0?'failure':'success'))
   return refuse('run-conclusion-contradicts-real-model-red');
  webkitPassed+=webkit.passed;webkitFailed+=webkit.failed;
  chromiumPassed+=chromium.passed;chromiumFailed+=chromium.failed;
  for(const cat of reasons)realFailureClasses[cat]=(realFailureClasses[cat]||0)+1;
 }
 const evidence=Object.freeze({
  nativeWebkitAttempts:webkitPassed+webkitFailed,
  nativeWebkitPassed:webkitPassed,nativeWebkitFailed:webkitFailed,
  nativeChromiumAttempts:chromiumPassed+chromiumFailed,
  nativeChromiumPassed:chromiumPassed,nativeChromiumFailed:chromiumFailed,
  independentRuns:ids.size,failureClasses:Object.freeze({...realFailureClasses})
 });
 if(webkitFailed>0||chromiumFailed>0)
  return Object.freeze({status:'REJECTED_GENUINE_NATIVE_RED',
   reason:'at-least-one-original-model-native-run-failed',
   runtimeFamily,headSha,evidence,eligibleForRuntimeChange:false,
   permanentWebKitRepairProven:false,familyAlphaAuthorized:false});
 return Object.freeze({status:'REVIEW_ONLY_CAUSAL_PROOF_REQUIRED',
  reason:'finite-green-compatibility-is-not-a-permanent-causal-repair',
  runtimeFamily,headSha,evidence,eligibleForRuntimeChange:false,
  permanentWebKitRepairProven:false,familyAlphaAuthorized:false});
}
