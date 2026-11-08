#!/usr/bin/env node
/**
 * MAIN P179 — MANUAL ONLY. Authorize ONE NEW separately owned disposable
 * Supabase project and 2 synthetic-only verified Auth users before invoking.
 *
 * Required environment keys (never commit values or print them):
 *  CLOSET169_ISOLATED_WRITE_APPROVAL=I_OWN_THIS_DISPOSABLE_TEST_PROJECT
 *  CLOSET169_URL=https://<disposable20letters>.supabase.co
 *  CLOSET169_PROJECT_REF=<disposable20letters>
 *  CLOSET169_PUBLISHABLE_KEY=sb_publishable_...
 *  CLOSET169_OWNER_A_EMAIL/CLOSET169_OWNER_A_PASSWORD
 *  CLOSET169_OWNER_B_EMAIL/CLOSET169_OWNER_B_PASSWORD
 *
 * The 169 config validator forbids production hlkgymugtfbirlpunsra
 * and existing staging fbnplztkbsteuzrmbgib, regardless of approval.
 * No service-role token, administrator key or real user's garment photo.
 */
import {configFromEnvironment169,validateHostedConfig169}
 from '../research/hosted-two-owner-cloud-169/hosted-acceptance.mjs';
import {runHostedOriginalCutout179}
 from '../research/hosted-two-owner-original-cutout-179/hosted-acceptance.mjs';

try{
 const config=configFromEnvironment169();
 // All checks must pass before ANY HTTP request is possible.
 const guard=validateHostedConfig169(config);
 process.stdout.write('P179 isolated owner-controlled disposable project check PASS ('+guard.ref+')\n');
 const result=await runHostedOriginalCutout179(config,{
  onStep:step=>process.stdout.write('P179 verified step: '+step+'\n')
 });
 if(result.verdict!=='HOSTED_PASS')throw Error('no genuine hosted proof');
 // Never output JWTs, passwords, API keys, private sources, account emails,
 // source document contents or potentially sensitive response bodies.
 process.stdout.write('P179_GENUINE_HOSTED_AUTH_TWO_OWNER_ORIGINAL_AND_CUTOUT_PASS '+
  JSON.stringify({verdict:result.verdict,project:result.isolatedProjectRef,
   sourceAndCutoutJPEGs:result.ownerSourceAndCropJPEGs,
   checks:result.checks.length,privateOwners:result.distinctOwners,
   productionAndExistingStagingUntouched:true,releaseAuthorized:false,
   familyAlpha:'HOLD'})+'\n');
}catch(e){
 // Report only sanitized known reasons; never print arbitrary remote errors.
 const msg=String(e?.message||'');
 const safe=msg.startsWith('P169 hosted acceptance: ')||
  msg.startsWith('P179 hosted acceptance: ')?msg:'isolated hosted owner-photo security checks did not pass';
 process.stderr.write('P179_GENUINE_HOSTED_ACCEPTANCE_NOT_COMPLETE: '+safe+'\n');
 process.exitCode=1;
}
