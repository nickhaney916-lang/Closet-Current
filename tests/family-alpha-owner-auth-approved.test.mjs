import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import vm from 'node:vm';
import {
 buildApprovedOwnerAuth,verifyApprovedOwnerAuth,AUTH_OUTPUT,ownerStageCsp,OWNER_STAGE_CONNECT_SRC
} from '../scripts/build-family-alpha-owner-auth-approved.mjs';
import {assertProtectedPreviewHold,STAGE_PREVIEW_OUTPUT} from '../scripts/build-family-alpha-protected-preview-hold.mjs';
import {stageConfigScript,STAGE_ID,APPROVED_STAGE_CALLBACK} from '../scripts/build-family-alpha-staging-auth-hold.mjs';
const publicKey='sb_publishable_SYNTHETIC_OFFLINE_ONLY_TEST';
const acceptedKey='sb_publishable_STAGE_PUBKEY_LOCALTEST_abcd1234';
test('real owner-only builder refuses absent, secret, production and placeholder credentials',async()=>{
 for(const input of [
  undefined,'','service_role_secret','sb_secret_only',
  'sb_publishable_SYNTHETIC_NOKEY',
  'sb_publishable_EXAMPLE_LOCAL',
  'legacy_anon_deprecated'
 ])await assert.rejects(buildApprovedOwnerAuth({publicKey:input}),/publishable API key/);
});
test('offline copy enables only stage Auth on exact root while leaving avatar and release disabled',async()=>{
 const stage=await assertProtectedPreviewHold();
 assert.equal(stage.stagingAuthReady,false);
 assert.equal(stage.photoAvatarEnabled,false);
 const result=await buildApprovedOwnerAuth({publicKey:acceptedKey});
 const after=await verifyApprovedOwnerAuth({publicKey:acceptedKey});
 assert.ok(result.files>60);
 assert.equal(after.qaFiles,result.files);
 assert.equal(after.releaseGate,'HOLD');
 assert.equal(after.stagingAuthEnabled,true);
 assert.equal(after.avatarEnabled,false);
 assert.equal(after.familyAlphaAuthorized,false);
 assert.equal(after.stageRoot,APPROVED_STAGE_CALLBACK);
 const config=await readFile(join(AUTH_OUTPUT,'alpha-stage-config.js'),'utf8');
 for(const [href,ready] of [
  ['https://closet-current-staging.pages.dev/',true],
  ['https://closet-current-staging.pages.dev/index.html',false],
  ['https://pilot-access-check.closet-current-staging.pages.dev/',false],
  ['https://fd096539.closet-current-staging.pages.dev/',false],
  ['https://closet-current.pages.dev/',false]
 ]){
  const window={},location=new URL(href);
  vm.runInNewContext(config,{window,location});
  assert.equal(window.__CLOSET_ALPHA_STAGE_AUTH__?.ready,ready,href);
  assert.equal(window.__CLOSET_ALPHA_STAGE_AUTH__?.projectRef,STAGE_ID);
 }
 const hold=await readFile(join(STAGE_PREVIEW_OUTPUT,'alpha-stage-config.js'),'utf8');
 assert.match(hold,/HOLD-NO-CALLBACK-OR-KEY/);
 assert.equal(hold.includes(acceptedKey),false);
 assert.equal(config.includes(acceptedKey),true);
});
test('QA config alteration, unlocked avatar or omitted files fail closed',async()=>{
 const file=join(AUTH_OUTPUT,'alpha-stage-config.js');
 const original=await readFile(file,'utf8');
 try{
  await writeFile(file,original.replace('STAGE_PUBKEY_LOCALTEST','DIFFERENT_ACCOUNT'));
  await assert.rejects(verifyApprovedOwnerAuth({publicKey:acceptedKey}),/safeguard failed/);
 }finally{await writeFile(file,original)}
 const rollout=join(AUTH_OUTPUT,'alpha-stage-preview-rollout.js');
 const data=await readFile(rollout,'utf8');
 try{
  await writeFile(rollout,data.replace('"enablePhotoAvatar":false','"enablePhotoAvatar":true'));
  await assert.rejects(verifyApprovedOwnerAuth({publicKey:acceptedKey}),/Unapproved change/);
 }finally{await writeFile(rollout,data)}
 assert.equal((await assertProtectedPreviewHold()).stagingAuthReady,false);
});
test('QA manifest contains no exposed key and no family release authorization',async()=>{
 const manifest=JSON.parse(await readFile(join(AUTH_OUTPUT,'family-alpha-owner-auth-qa-manifest.json'),'utf8'));
 assert.equal(manifest.publishableKeyPresent,true);
 assert.equal(manifest.privilegedKeyPresent,false);
 assert.equal(manifest.publicSignupAllowed,false);
 assert.equal(manifest.familyAccountsAdded,false);
 assert.equal(manifest.firstPartyAvatarActivated,false);
 assert.equal(manifest.stageDeploymentAuthorized,true);
 assert.equal(manifest.productionDeploymentAuthorized,false);
 assert.equal(manifest.verifiedRealOwnerLogin,false);
 assert.equal(manifest.familyAlphaReleaseAuthorized,false);
 assert.equal(JSON.stringify(manifest).includes(acceptedKey),false);
});

test('owner-only artifact CSP authorizes exact stage Auth origin and never broadens the held preview or production',async()=>{
 const [owner,held]=await Promise.all([
   readFile(join(AUTH_OUTPUT,'index.html'),'utf8'),
   readFile(join(STAGE_PREVIEW_OUTPUT,'index.html'),'utf8')
 ]);
 assert.ok(owner.includes(OWNER_STAGE_CONNECT_SRC));
 assert.ok(!owner.includes("connect-src 'self';"));
 assert.ok(held.includes("connect-src 'self';"));
 assert.ok(!held.includes(OWNER_STAGE_CONNECT_SRC));
 assert.ok(!owner.includes('https://hlkgymugtfbirlpunsra.supabase.co'));
 assert.ok(!owner.includes('connect-src https:'));
 assert.ok(!owner.includes('connect-src *'));
 assert.equal(owner,ownerStageCsp(held));
 for(const unsafe of [
   '<html><head></head></html>',
   held.replace("connect-src 'self';","connect-src *;"),
   held.replace("connect-src 'self';",OWNER_STAGE_CONNECT_SRC),
   held.replace('Content-Security-Policy','Some-Other-Policy')
 ])assert.throws(()=>ownerStageCsp(unsafe),/staging CSP/);
});

test('tampering with allowed origin or broadening connect-src fails owner-only verification',async()=>{
 const p=join(AUTH_OUTPUT,'index.html');
 const original=await readFile(p,'utf8');
 try {
  await writeFile(p,original.replace(OWNER_STAGE_CONNECT_SRC,"connect-src *;"));
  await assert.rejects(verifyApprovedOwnerAuth({publicKey:acceptedKey}),/Unapproved staged owner-only CSP change/);
 }finally{await writeFile(p,original)}
});
