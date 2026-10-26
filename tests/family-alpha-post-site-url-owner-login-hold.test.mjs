/**
 * Family Alpha #255 — after OWNER-CONFIRMED staging Site URL, prepare owner-only
 * Auth QA in an offline VM. No real publishable key, no email, no login, no
 * Supabase/Cloudflare requests, no changed website, no invited accounts.
 * This must NEVER be interpreted as permission to deploy enabled Auth.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {
 STAGE_ID,STAGE_BASE,PROD_ID,PROD_BASE,
 APPROVED_STAGE_CALLBACK,stageConfigScript,validRedirect,
 stageAuthSource,stageCloudSource
} from '../scripts/build-family-alpha-staging-auth-hold.mjs';
import {
 protectedStagePreviewEligible,blockedRolloutScript
} from '../scripts/build-family-alpha-protected-preview-hold.mjs';
const FAKE_PUBLIC_KEY='sb_publishable_SYNTHETIC_OFFLINE_NEVER_PUBLISH';
const ROOT='https://closet-current-staging.pages.dev';
const MOCK_ROLLOUT=Object.freeze({
 projectRef:STAGE_ID,origin:ROOT,issue:255,
 ownerApproved:false,enablePhotoAvatar:false,releaseGate:'HOLD'
});
const SENTINEL='owner-confirmed-2026-10-25';
function execute(code,href){
 const location=new URL(href),window={};
 vm.runInNewContext(code,{location,window});
 return {window,location};
}
test('owner confirmation is a dated observation, not server Auth or deployment authorization',()=>{
 assert.equal(SENTINEL,'owner-confirmed-2026-10-25');
 assert.equal(STAGE_ID,'fbnplztkbsteuzrmbgib');
 assert.equal(STAGE_BASE,'https://fbnplztkbsteuzrmbgib.supabase.co');
 assert.equal(APPROVED_STAGE_CALLBACK,ROOT+'/');
 assert.notEqual(STAGE_ID,PROD_ID);
 assert.notEqual(STAGE_BASE,PROD_BASE);
});
test('currently deployed default staged Auth config remains disabled after Site URL changed',()=>{
 const code=stageConfigScript();
 for(const href of [
  ROOT+'/',ROOT+'/index.html',
  'https://pilot-access-check.closet-current-staging.pages.dev/',
  'https://a15254d6.closet-current-staging.pages.dev/',
  'https://closet-current.pages.dev/'
 ]){
  const {window}=execute(code,href),auth=window.__CLOSET_ALPHA_STAGE_AUTH__;
  assert.equal(auth.projectRef,STAGE_ID);
  assert.equal(auth.base,STAGE_BASE);
  assert.equal(auth.key,'');
  assert.equal(auth.redirect,'');
  assert.equal(auth.ready,false);
  assert.equal(auth.intent,'HOLD-NO-CALLBACK-OR-KEY');
  assert.equal(auth.releaseGate,'HOLD');
 }
});
test('fictional future QA config can become ready ONLY on exact protected staging root',()=>{
 const code=stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,
  publicKey:FAKE_PUBLIC_KEY,
  enableForTesting:true
 });
 for(const [url,ready]of [
  [ROOT+'/',true],
  [ROOT+'/index.html',false],
  [ROOT+'/?return=/',true],
  [ROOT+'/#access_token=SYNTHETIC',true],
  ['https://pilot-access-check.closet-current-staging.pages.dev/',false],
  ['https://a15254d6.closet-current-staging.pages.dev/',false],
  ['https://closet-current.pages.dev/',false],
  ['http://closet-current-staging.pages.dev/',false]
 ]){
  const {window}=execute(code,url),auth=window.__CLOSET_ALPHA_STAGE_AUTH__;
  assert.equal(auth.ready,ready,url);
  assert.equal(auth.releaseGate,'HOLD',url);
  assert.equal(auth.base,STAGE_BASE,url);
  assert.equal(auth.redirect,APPROVED_STAGE_CALLBACK,url);
 }
});
test('real deployment does not use fake QA key, and incomplete/production configuration cannot enable Auth',()=>{
 assert.equal(validRedirect('https://closet-current.pages.dev/'),null);
 assert.equal(validRedirect('https://a15254d6.closet-current-staging.pages.dev/'),null);
 assert.equal(validRedirect('https://pilot-access-check.closet-current-staging.pages.dev/'),null);
 assert.equal(validRedirect(APPROVED_STAGE_CALLBACK),APPROVED_STAGE_CALLBACK);
 for(const arg of [
  {approvedRedirect:APPROVED_STAGE_CALLBACK,enableForTesting:true},
  {publicKey:FAKE_PUBLIC_KEY,enableForTesting:true},
  {approvedRedirect:APPROVED_STAGE_CALLBACK,publicKey:FAKE_PUBLIC_KEY},
  {approvedRedirect:'https://closet-current.pages.dev/',publicKey:FAKE_PUBLIC_KEY,enableForTesting:true},
  {approvedRedirect:APPROVED_STAGE_CALLBACK,publicKey:'sb_secret_sensitive',enableForTesting:true}
 ])assert.throws(()=>stageConfigScript(arg),/Invalid|required|explicit/);
});
test('even a future fictional QA-ready Auth config cannot enable avatar or family rollout',()=>{
 const stage=execute(stageConfigScript({
  approvedRedirect:APPROVED_STAGE_CALLBACK,publicKey:FAKE_PUBLIC_KEY,
  enableForTesting:true
 }),ROOT+'/').window.__CLOSET_ALPHA_STAGE_AUTH__;
 const blocked=execute(blockedRolloutScript(),ROOT+'/').window.__CLOSET_ALPHA_PREVIEW_ROLLOUT__;
 assert.equal(stage.ready,true);
 assert.equal(blocked.ownerApproved,false);
 assert.equal(blocked.enablePhotoAvatar,false);
 assert.equal(protectedStagePreviewEligible({
  protocol:'https:',origin:ROOT,hostname:'closet-current-staging.pages.dev',
  pathname:'/',stage,rollout:blocked
 }),false);
 assert.equal(protectedStagePreviewEligible({
  protocol:'https:',origin:ROOT,hostname:'closet-current-staging.pages.dev',
  pathname:'/',stage,rollout:MOCK_ROLLOUT
 }),false);
});
test('staged Auth and cloud transformation still exclude the production endpoint and signup route',async()=>{
 const auth=stageAuthSource(await readFile('public/auth.js','utf8'));
 const cloud=stageCloudSource(await readFile('public/cloud-backup.js','utf8'));
 for(const script of [auth,cloud]){
  assert.equal(script.includes(PROD_ID),false);
  assert.equal(script.includes(PROD_BASE),false);
  assert.equal(script.includes('sb_secret_'),false);
  assert.equal(script.includes('service_role'),false);
  assert.ok(script.includes(STAGE_BASE)||script.includes('stage.base'));
 }
 assert.equal(auth.includes("request('signup'+EMAIL_REDIRECT"),false);
 assert.match(auth,/closet-alpha-staging-auth-v1/);
 assert.match(auth,/Family Alpha accounts require a private invitation/);
 assert.match(auth,/if\(linkType==='recovery'\|\|linkType==='invite'\)/);
});
