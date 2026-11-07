/**
 * P148 optional isolated hosted-Supabase acceptance runner.
 * Default mode is SAFELY BLOCKED, without ANY network or private data I/O.
 * Never automatically use an attached Supabase connector, GitHub secret,
 * existing production, current staging or Drive Duel for this research.
 */
import {assertHostedP148Guard,hostedP148Readiness}
 from '../research/isolated-hosted-supabase-acceptance-148/hosted-project-guard.mjs';

const ready=hostedP148Readiness(process.env);
if(!ready.configured){
 console.log(JSON.stringify({priority:148,status:'HOSTED_NOT_RUN_NO_APPROVED_DISPOSABLE_PROJECT',
  gate:'safe-closed',hostedSupabaseCertified:false,
  prohibitedProjectsPreserved:true,productionOrStagingTouched:false,
  familyAlpha:'HOLD'}));
}else{
 const config=assertHostedP148Guard(process.env);
 // Loading the real SDK and tests is intentionally delayed until AFTER all
 // target-project and test account allowlisting checks have passed.
 const {runHostedP148}=await import(
  '../research/isolated-hosted-supabase-acceptance-148/hosted-acceptance-probe.mjs');
 const receipt=await runHostedP148(config);
 // Never log JWTs, refresh tokens, user email, passwords or owner IDs.
 console.log(JSON.stringify({priority:148,...receipt}));
 if(config.mode==='readonly')
  console.log('P148 READONLY ONLY — full hosted backup/restore certification remains pending');
}
