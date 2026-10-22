// Read-only source/ancestry preflight. Passing is NOT hosted staging, safety,
// pilot or production release approval. Never touches production or customer data.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const DEV='b15bc9cbe5d6b46b8790db0b888587ca397fc707';
export const MAIN='54c9e29ede069a05d1268e003f80cbda043c7d6a';
export const TREND_BLOB='0fd0911a32ff7c80fc027657465c96f34dfe532d';
const allowed=new Set([
 '.github/workflows/reconciled-main-ancestry-no-deploy-qa.yml',
 'scripts/audit-main-ancestry-release-blockers.mjs',
 'tests/main-ancestry-release-blockers.test.mjs',
 'docs/MAIN-DEVELOPMENT-ANCESTRY-AUDIT-20261022.md'
]);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:9e6}).trim();
const ancestor=(base,head)=>{execFileSync('git',['merge-base','--is-ancestor',base,head]);};
export function inspectLocalReleaseBlockers({authSource,deleteSource}){
 assert.equal(typeof authSource,'string');
 assert.equal(typeof deleteSource,'string');
 const match=authSource.match(/\bconst APP_URL\s*=\s*'([^']+)'/);
 const currentEmailRedirect=match?.[1]||null;
 const legacyCallback=currentEmailRedirect==='https://nickhaney916-lang.github.io/Closet-Current/';
 const deletionDisabled=/Deno\.serve\(/.test(deleteSource)&&
  /deletionCompleted:\s*false/.test(deleteSource)&&
  /status:\s*503/.test(deleteSource);
 // A secure, functional deletion handler requires an independent approval and
 // cannot be claimed merely because its source is no longer disabled.
 assert.ok(deletionDisabled,'Account deletion protection unexpectedly changed; stop and review');
 return Object.freeze({
  productionEmailCallbackSource:currentEmailRedirect,
  cloudflareCanonicalEmailCallbackVerified:false,
  legacyGithubPagesEmailRedirectPresent:legacyCallback,
  actualExternalInboxSignupAndResetVerified:false,
  accountDeletionDisabled:true,
  completeHostedAccountDeletionVerified:false,
  hostedCloudflareRootAndPreviewsProtectedVerified:false,
  genuinePhysicalPhoneTestsVerified:0,
  independentlyReviewedOriginalScenes:0,
  validatedRecognitionAccuracy:null,
  checkoutSourceAuditOnly:true,
  pilotRelease:'BLOCKED',
  productionRelease:'BLOCKED'
 });
}
export function auditMainAncestry(){
 ancestor(DEV,'HEAD');
 ancestor(MAIN,'HEAD');
 // The first merge commit after the last verified development checkpoint
 // must have exactly the two verified parents, and its tree is identical.
 const merges=git('rev-list','--merges','--reverse',DEV+'..HEAD').split('\n').filter(Boolean);
 assert.equal(merges.length,1,'Expected precisely one reviewed reconciliation merge');
 const merge=merges[0];
 assert.equal(git('rev-parse',merge+'^1'),DEV);
 assert.equal(git('rev-parse',merge+'^2'),MAIN);
 assert.equal(git('rev-parse',merge+'^{tree}'),git('rev-parse',DEV+'^{tree}'),
  'Unexpected customer file change in ancestry reconciliation');
 assert.equal(git('rev-parse',MAIN+':public/trend-data.json'),TREND_BLOB);
 assert.equal(git('rev-parse',DEV+':public/trend-data.json'),TREND_BLOB);
 assert.equal(git('rev-parse','HEAD:public/trend-data.json'),TREND_BLOB);
 // Abort CI if main has moved since this factual review.
 assert.equal(git('rev-parse','origin/main'),MAIN,'Main changed: independent reconciliation required');
 const files=git('diff','--name-only',DEV,'HEAD').split('\n').filter(Boolean);
 assert.deepEqual(files.sort(),[...allowed].sort(),
  'Unexpected or missing change after original development checkpoint');
 for(const folder of ['public','supabase','benchmark','.github/workflows/pages.yml',
  '.github/workflows/cloudflare-pages.yml','scripts/build-restricted-staging.mjs',
  'docs/RESTRICTED-STAGING-SETUP-20261021.md']){
  assert.equal(git('rev-parse','HEAD:'+folder),git('rev-parse',DEV+':'+folder),
   'Protected customer, staging or production content changed: '+folder);
 }
 const workflow=readFileSync('.github/workflows/reconciled-main-ancestry-no-deploy-qa.yml','utf8');
 for(const needed of ['audit-main-ancestry-release-blockers.mjs','node --test tests/*.test.cjs tests/*.test.mjs',
  'test-disposable-supabase-security.mjs','test-staging-installed-pwa-chromium.mjs',
  'test-linked-phone-evidence-browsers.mjs','test-guided-linked-phone-evidence-browsers.mjs'])
  assert.ok(workflow.includes(needed),'Full regression missing: '+needed);
 const blockers=inspectLocalReleaseBlockers({
  authSource:readFileSync('public/auth.js','utf8'),
  deleteSource:readFileSync('supabase/functions/account-delete/index.ts','utf8')
 });
 const result={
  audit:'MAIN_HISTORY_RECONCILED_ONLY',reviewedProductionMain:MAIN,
  reviewedDevelopmentHead:DEV,mergeSha:merge,unchangedProductTree:true,
  trendDataBlobPreserved:TREND_BLOB,changedNonproductFiles:files.length,
  ...blockers,authorizedProductionMerge:false,
  productionMainUnmodified:true,driveDuelUnmodified:true,paidResourcesCreated:false
 };
 return Object.freeze(result);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 console.log(JSON.stringify(auditMainAncestry(),null,2));
}
