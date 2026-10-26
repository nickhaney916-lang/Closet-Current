import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {
 buildOwnerLoginRehearsal,assertOwnerLoginRehearsal,
 rehearsalConfig,REVIEW_OUTPUT,SYNTHETIC_PUBLIC_KEY
} from '../scripts/build-family-alpha-owner-login-rehearsal-hold.mjs';
import {STAGE_PREVIEW_OUTPUT,assertProtectedPreviewHold} from '../scripts/build-family-alpha-protected-preview-hold.mjs';
import {STAGE_BASE,PROD_ID} from '../scripts/build-family-alpha-staging-auth-hold.mjs';
const ROOT='https://closet-current-staging.pages.dev/';
const MOCK_HOSTS=[
 [ROOT,true],
 [ROOT+'index.html',false],
 ['https://fd096539.closet-current-staging.pages.dev/',false],
 ['https://pilot-access-check.closet-current-staging.pages.dev/',false],
 ['https://closet-current.pages.dev/',false],
 ['http://closet-current-staging.pages.dev/',false]
];
test('offline owner rehearsal uses fictional key only on exact staging root',()=>{
 const source=rehearsalConfig();
 assert.match(source,/SYNTHETIC_NEVER_VALID_FOR_SUPABASE/);
 assert.equal(source.includes(PROD_ID),false);
 for(const [href,expected]of MOCK_HOSTS){
  const window={};const location=new URL(href);
  vm.runInNewContext(source,{window,location});
  const a=window.__CLOSET_ALPHA_STAGE_AUTH__;
  assert.equal(a.ready,expected,href);
  assert.equal(a.base,STAGE_BASE);
  assert.equal(a.releaseGate,'HOLD');
  assert.equal(a.key,SYNTHETIC_PUBLIC_KEY);
 }
});
test('built rehearsal preserves entire protected production-isolated bundle except fake config',async()=>{
 const before=await assertProtectedPreviewHold();
 assert.equal(before.stagingAuthReady,false);
 const result=await buildOwnerLoginRehearsal();
 const verify=await assertOwnerLoginRehearsal();
 assert.equal(result.kind,'SYNTHETIC_OWNER_LOGIN_REHEARSAL_NEVER_DEPLOY');
 assert.ok(result.sourceFiles>=60);
 assert.equal(result.reviewFiles,result.sourceFiles+1);
 assert.equal(verify.releaseGate,'HOLD');
 assert.equal(verify.deployAllowed,false);
 assert.equal(verify.mockActivationOnly,true);
 assert.equal(verify.avatarEnabled,false);
 assert.equal(verify.realLoginVerified,false);
 assert.equal(verify.productionUntouched,true);
 assert.equal(verify.stagingProjectRef,'fbnplztkbsteuzrmbgib');
 const src=await readFile(join(STAGE_PREVIEW_OUTPUT,'alpha-stage-config.js'),'utf8');
 const qa=await readFile(join(REVIEW_OUTPUT,'alpha-stage-config.js'),'utf8');
 assert.match(src,/HOLD-NO-CALLBACK-OR-KEY/);
 assert.match(src,/"key":""/);
 assert.match(src,/"redirect":""/);
 assert.ok(!src.includes(SYNTHETIC_PUBLIC_KEY));
 assert.match(qa,/explicit-qa-only/);
 assert.match(qa,/SYNTHETIC_NEVER_VALID_FOR_SUPABASE/);
});
test('tampered fake rehearsal config or activated avatar flags trigger failure and cannot touch held stage',async()=>{
 const file=join(REVIEW_OUTPUT,'alpha-stage-config.js');
 const original=await readFile(file,'utf8');
 try{
  await writeFile(file,original.replace('SYNTHETIC_NEVER_VALID_FOR_SUPABASE','A_TAMPERED_KEY'));
  await assert.rejects(assertOwnerLoginRehearsal(),/rehearsal lost/);
 }finally{await writeFile(file,original);}
 const rolloutPath=join(REVIEW_OUTPUT,'alpha-stage-preview-rollout.js');
 const rollout=await readFile(rolloutPath,'utf8');
 try{
  await writeFile(rolloutPath,rollout.replace('"enablePhotoAvatar":false','"enablePhotoAvatar":true'));
  await assert.rejects(assertOwnerLoginRehearsal(),/Rehearsal modified protected-stage file|rehearsal lost/);
 }finally{await writeFile(rolloutPath,rollout);}
 const stillHeld=await assertProtectedPreviewHold();
 assert.equal(stillHeld.stagingAuthReady,false);
 assert.equal(stillHeld.photoAvatarEnabled,false);
});
test('no deploy, real credentials, account creation or provider network occurs when reviewing offline fixtures',async()=>{
 const report=await assertOwnerLoginRehearsal();
 assert.equal(report.releaseGate,'HOLD');
 assert.equal(report.deployAllowed,false);
 assert.equal(report.realLoginVerified,false);
 const manifest=JSON.parse(await readFile(join(REVIEW_OUTPUT,'family-alpha-owner-login-rehearsal-NEVER-DEPLOY.json'),'utf8'));
 for(const property of [
  'publishAllowed','deployAllowed','realAuthKeyPresent','emailSent',
  'accountCreated','liveStageModified','ownerApprovedForRealAuthActivation',
  'avatarRolloutEnabled','familyInvitesEnabled'
 ])assert.equal(manifest[property],false,property);
 assert.equal(manifest.serverCredentialPresent,false);
 assert.equal(manifest.stagingProjectRef,'fbnplztkbsteuzrmbgib');
 assert.equal(manifest.sourceFolder,STAGE_PREVIEW_OUTPUT);
 assert.equal(manifest.onlyChangedAsset,'alpha-stage-config.js');
 assert.equal(JSON.stringify(manifest).includes(SYNTHETIC_PUBLIC_KEY),false,
   'manifest should not store keys, even fictional ones');
});
