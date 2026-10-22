#!/usr/bin/env node
// Closet Current: VERIFIED BACKEND-ID OFFLINE STAGING CANDIDATE.
// Never invokes Supabase Management APIs, Cloudflare or a deployment command.
// Only the public client publishable key and staging origin are provided by the
// operator's local environment. The key is never logged by this wrapper.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const STAGING_REF='fbnplztkbsteuzrmbgib';
const EXPECTED_URL='https://'+STAGING_REF+'.supabase.co';
const PROD='hlkgymugtfbirlpunsra',OTHER='qlwotqbqxpgkheitsboe';
function refuse(reason){throw Error('CONNECTED_STAGING_REFUSED: '+reason);}
export function validateKnownStagingEnvironment(env){
 if(env.CLOSET_STAGING_SUPABASE_URL!==EXPECTED_URL)
  refuse('Backend must be the verified Closet Current Staging project, not production or another database');
 const key=env.CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY||'';
 if(!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key))
  refuse('Use the staging project PUBLIC publishable key from its dashboard, never a service role or secret key');
 const origin=env.CLOSET_STAGING_APP_ORIGIN;
 if(typeof origin!=='string')refuse('Provide a separate protected preview origin');
 let url;
 try{url=new URL(origin)}catch{refuse('Invalid HTTPS staging preview origin');}
 if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||
  url.username||url.password||url.port||
  !/^[a-z0-9-]+\.closet-current-staging\.pages\.dev$/.test(url.hostname))
  refuse('Use a preview URL for the separate staging Pages project; root/custom hosts need independent access policies');
 if(url.hostname==='closet-current-staging.pages.dev')
  refuse('Do not start with a possibly unprotected staging project root');
 return Object.freeze({backendProjectRef:STAGING_REF,
  backendURL:EXPECTED_URL,stagingOrigin:url.href,
  publishableKeySyntaxValid:true,publicKeyMatchedToLiveProject:false,
  projectStatusLastReadOnlyConfirmed:'ACTIVE_HEALTHY',
  cloudflareAccessVerified:false,hostedAuthTested:false,hostedSignupTested:false,
  readyToDeploy:false,allowedToUseCustomerPhotos:false});
}
function main(){
 assert.equal(process.argv.length,2,'Usage: set CLOSET_STAGING_* env vars then invoke this script');
 const config=validateKnownStagingEnvironment(process.env);
 execFileSync(process.execPath,['scripts/build-restricted-staging.mjs'],{stdio:'inherit',env:process.env});
 execFileSync(process.execPath,['scripts/verify-restricted-staging-bundle.mjs'],{stdio:'inherit'});
 const proof=JSON.parse(readFileSync('staging-dist/staging-preflight.json','utf8'));
 assert.equal(proof.backendProjectRef,config.backendProjectRef);
 assert.equal(proof.stagingOrigin,config.stagingOrigin);
 assert.equal(proof.privateCloudflareAccessPolicyVerified,false);
 assert.equal(proof.restrictedStagingDeployed,false);
 assert.equal(proof.productionReleaseApproved,false);
 for(const ref of [PROD,OTHER])assert.notEqual(proof.backendProjectRef,ref);
 console.log('CONNECTED_STAGING_OFFLINE_CANDIDATE '+JSON.stringify({
  backendProjectRef:config.backendProjectRef,stagingOrigin:config.stagingOrigin,
  clientKeySyntaxVerified:true,actualStagingKeyVerified:false,
  actualCloudflareAccessVerified:false,hostedSignupVerified:false,
  hostedImageIsolationVerified:false,deployAuthorized:false,
  completePhysicalPhoneTests:0,recognizedAccuracyMeasured:false,
  productionAndDriveDuelUnchanged:true,release:'BLOCKED'}));
}
if(import.meta.url==='file://'+process.argv[1]||process.argv[1]?.endsWith('/build-connected-staging-candidate.mjs')){
 try{main()}catch(error){console.error(error.message);process.exitCode=1;}
}
