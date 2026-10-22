import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectLocalReleaseBlockers,DEV,MAIN,TREND_BLOB} from '../scripts/audit-main-ancestry-release-blockers.mjs';

test('pinned Git history and trend blob must name exact reviewed commits',()=>{
 assert.equal(DEV,'b15bc9cbe5d6b46b8790db0b888587ca397fc707');
 assert.equal(MAIN,'54c9e29ede069a05d1268e003f80cbda043c7d6a');
 assert.equal(TREND_BLOB,'0fd0911a32ff7c80fc027657465c96f34dfe532d');
});
test('legacy redirect and disabled deletion cannot be mistaken for release readiness',()=>{
 const status=inspectLocalReleaseBlockers({
  authSource:readFileSync('public/auth.js','utf8'),
  deleteSource:readFileSync('supabase/functions/account-delete/index.ts','utf8')
 });
 assert.equal(status.legacyGithubPagesEmailRedirectPresent,true);
 assert.equal(status.actualExternalInboxSignupAndResetVerified,false);
 assert.equal(status.completeHostedAccountDeletionVerified,false);
 assert.equal(status.accountDeletionDisabled,true);
 assert.equal(status.productionRelease,'BLOCKED');
 assert.equal(status.pilotRelease,'BLOCKED');
 assert.equal(status.validatedRecognitionAccuracy,null);
 assert.equal(status.independentlyReviewedOriginalScenes,0);
});
test('accidental reenablement of account delete aborts integration pending hosted owner approval',()=>{
 for(const patch of [
  "Deno.serve(()=>new Response('{}',{status:200}));",
  "Deno.serve(()=>new Response(JSON.stringify({deletionCompleted:true}),{status:200}));",
  "// index intentionally disabled but no callable handler"
 ])assert.throws(()=>inspectLocalReleaseBlockers({
  authSource:"const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/';",
  deleteSource:patch
 }));
});
test('changing an email URL cannot be equated to actual verified email delivery',()=>{
 const status=inspectLocalReleaseBlockers({
  authSource:"const APP_URL='https://closet-current.pages.dev/';",
  deleteSource:readFileSync('supabase/functions/account-delete/index.ts','utf8')
 });
 assert.equal(status.legacyGithubPagesEmailRedirectPresent,false);
 assert.equal(status.productionEmailCallbackSource,'https://closet-current.pages.dev/');
 assert.equal(status.cloudflareCanonicalEmailCallbackVerified,false);
 assert.equal(status.actualExternalInboxSignupAndResetVerified,false);
 assert.equal(status.productionRelease,'BLOCKED');
});
test('missing APP_URL cannot falsely claim Cloudflare email callback verified',()=>{
 const status=inspectLocalReleaseBlockers({
  authSource:"const URL='https://example.invalid';",
  deleteSource:readFileSync('supabase/functions/account-delete/index.ts','utf8')
 });
 assert.equal(status.productionEmailCallbackSource,null);
 assert.equal(status.actualExternalInboxSignupAndResetVerified,false);
 assert.equal(status.productionRelease,'BLOCKED');
});
