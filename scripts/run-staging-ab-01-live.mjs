#!/usr/bin/env node
/**
 * STAGING-AB-01 MANUAL / EXPLICITLY AUTHORIZED TEST ACCOUNT RUN ONLY.
 * No service_role, no admin APIs, no production, no uploads or writes.
 * Requires pre-provisioned test user credentials and source-verified JPEGs.
 * Running without all required fixtures exits BLOCKED (code 2), NEVER PASS.
 * Environment secrets are never printed, stored in JSON or included in errors.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {STAGING_AB_01,StagingProofBlocked,StagingProofFailed,
  runStagingAB01} from '../research/staging-ab-01/two-account-proof.mjs';
const e=process.env;
const config={
 origin:STAGING_AB_01.origin,
 publicKey:e.CC_STAGING_AB01_PUBLIC_KEY,
 a:{email:e.CC_STAGING_AB01_A_EMAIL,
   password:e.CC_STAGING_AB01_A_PASSWORD,
   photoPath:e.CC_STAGING_AB01_A_PHOTO_PATH},
 b:{email:e.CC_STAGING_AB01_B_EMAIL,
   password:e.CC_STAGING_AB01_B_PASSWORD,
   photoPath:e.CC_STAGING_AB01_B_PHOTO_PATH}
};
const dir='benchmark/staging-ab-01';
await mkdir(dir,{recursive:true});
let report;
try{
 report=await runStagingAB01({config});
}catch(error){
 const known=error instanceof StagingProofBlocked||error instanceof StagingProofFailed;
 report={priority:'STAGING-AB-01',
  result:error instanceof StagingProofBlocked?'LIVE_BLOCKED':
   error instanceof StagingProofFailed?'LIVE_FAILED':'LIVE_BLOCKED_UNEXPECTED',
  // Nothing from the error string, the HTTP response or external data is
  // written. Only allowlisted constant error codes, never user identities.
  code:known?error.code:'INTERNAL_ERROR_REDACTED',
  noStagingMutation:true,noProductionAccess:true,
  liveTwoAccountProof:false,releaseAuthorized:false,familyAlpha:'HOLD'};
}
await writeFile(dir+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
console.log('STAGING_AB01_ACCEPTANCE',JSON.stringify(report));
if(report.result!=='PASS_LIVE_READ_ONLY')process.exitCode=
 report.result==='LIVE_FAILED'?1:2;
