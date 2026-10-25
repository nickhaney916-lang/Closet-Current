import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {
 STAGE_PREVIEW_ROOT,protectedStagePreviewEligible,
 blockedRolloutScript,guardedStagingPreviewBoot,stagingPreviewIndex
} from '../scripts/build-family-alpha-protected-preview-hold.mjs';

const stage=()=>({
 projectRef:'fbnplztkbsteuzrmbgib',
 base:'https://fbnplztkbsteuzrmbgib.supabase.co',
 redirect:STAGE_PREVIEW_ROOT,intent:'explicit-qa-only',
 releaseGate:'HOLD',ready:true,key:'sb_publishable_SYNTHETIC_NONFUNCTIONAL_KEY_12345'
});
const rollout=()=>({
 projectRef:'fbnplztkbsteuzrmbgib',
 origin:'https://closet-current-staging.pages.dev',
 issue:255,ownerApproved:true,enablePhotoAvatar:true
});
const good=()=>({
 protocol:'https:',origin:'https://closet-current-staging.pages.dev',
 hostname:'closet-current-staging.pages.dev',pathname:'/',
 stage:stage(),rollout:rollout()
});
test('only exact main protected staging root is recognized by the isolated UI gate',()=>{
 assert.equal(protectedStagePreviewEligible(good()),true);
 for(const origin of [
  'https://closet-current.pages.dev',
  'https://a15254d6.closet-current-staging.pages.dev',
  'https://pilot-access-check.closet-current-staging.pages.dev',
  'https://closet-current-staging.pages.dev.attacker.invalid',
  'http://closet-current-staging.pages.dev'
 ])assert.equal(protectedStagePreviewEligible({
  ...good(),origin,hostname:new URL(origin).hostname,
  protocol:new URL(origin).protocol
 }),false,origin);
 for(const pathname of ['/Closet-Current/','/cdn-cgi/access/','/test.html','//']){
  assert.equal(protectedStagePreviewEligible({...good(),pathname}),false,pathname);
 }
});
test('stage publishable key/real stage project, Auth readiness and EXACT root callback all required',()=>{
 for(const key of ['ready','key','redirect','projectRef','base','intent','releaseGate']){
  const original=stage();
  const bad={...original,[key]:key==='ready'?false:key==='key'?'':key==='redirect'
   ?'https://pilot-access-check.closet-current-staging.pages.dev/':'changed'};
  assert.equal(protectedStagePreviewEligible({...good(),stage:bad}),false,key);
 }
 const prod={...stage(),base:'https://hlkgymugtfbirlpunsra.supabase.co'};
 assert.equal(protectedStagePreviewEligible({...good(),stage:prod}),false);
});
test('separate owner approval and enable flags are BOTH required even after mock stage Auth readiness',()=>{
 for(const key of ['projectRef','origin','issue','ownerApproved','enablePhotoAvatar']){
  const x=rollout();
  x[key]=key==='ownerApproved'||key==='enablePhotoAvatar'?false:'wrong';
  assert.equal(protectedStagePreviewEligible({...good(),rollout:x}),false,key);
 }
 assert.equal(protectedStagePreviewEligible({...good(),rollout:null}),false);
 assert.equal(protectedStagePreviewEligible({...good(),stage:null}),false);
});
test('the generated rollout starts disabled, is non-overwritable and includes no usable credentials',()=>{
 const script=blockedRolloutScript();
 const window={};
 runInNewContext(script,{window});
 const x=window.__CLOSET_ALPHA_PREVIEW_ROLLOUT__;
 assert.equal(x.ownerApproved,false);
 assert.equal(x.enablePhotoAvatar,false);
 assert.equal(x.releaseGate,'HOLD');
 assert.equal(x.origin,'https://closet-current-staging.pages.dev');
 assert.equal(Object.isFrozen(x),true);
 assert.equal(Object.getOwnPropertyDescriptor(window,'__CLOSET_ALPHA_PREVIEW_ROLLOUT__').writable,false);
 assert.doesNotMatch(script,/sb_publishable_|Bearer |service_role|hlkgymugtfbirlpunsra/);
});
test('only guarded preview host switch is rewritten, preserving source/original image and owner checks',async()=>{
 const input=await readFile('public/family-alpha-preview-boot.js','utf8');
 const converted=guardedStagingPreviewBoot(input);
 assert.notEqual(converted,input);
 assert.doesNotMatch(converted,/__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__/);
 for(const needle of [
  'stage?.ready===true','rollout?.ownerApproved===true',
  'window.closetAuth?.user?.id','window.closetCloud?.getOwnerId',
  'mountAlphaBuilderPreview','getDatabase:()=>db',
  "getLatestItem:id=>items.find(item=>item.id===id)||null",
  'fetchFn:window.fetch.bind(window)','localApproved:true'
 ])assert.ok(converted.includes(needle),needle);
 assert.equal(input.includes("host!=='localhost'&&host!=='127.0.0.1'"),true);
 assert.throws(()=>guardedStagingPreviewBoot(input.replace('localApproved:true','localApproved:false')));
 assert.throws(()=>guardedStagingPreviewBoot(input.replace('getDatabase:()=>db','getDatabase:()=>fakeDb')));
});
test('blocked rollout prevents boot execution before DOM reads or any dynamic imports',async()=>{
 const input=await readFile('public/family-alpha-preview-boot.js','utf8');
 const script=guardedStagingPreviewBoot(input);
 for(const overrides of [
  {stage:stage(),rollout:{...rollout(),ownerApproved:false}},
  {stage:{...stage(),ready:false},rollout:rollout()},
  {stage:stage(),rollout:{...rollout(),enablePhotoAvatar:false}}
 ]){
  const window={
   __CLOSET_ALPHA_STAGE_AUTH__:overrides.stage,
   __CLOSET_ALPHA_PREVIEW_ROLLOUT__:overrides.rollout
  };
  const result=runInNewContext(script,{
   window,location:{
    protocol:'https:',hostname:'closet-current-staging.pages.dev',
    origin:'https://closet-current-staging.pages.dev',pathname:'/'
   }
   // document, closetReady, cloud, fetch intentionally absent: should return early.
  });
  await result;
 }
});
test('only unique bootstrap tag receives separate blocked rollout before photo preview',()=>{
 const index='<script src="alpha-stage-config.js"></script><script src="family-alpha-preview-boot.js"></script>';
 const output=stagingPreviewIndex(index);
 assert.match(output,/alpha-stage-config\.js.*alpha-stage-preview-rollout\.js.*family-alpha-preview-boot\.js/);
 assert.throws(()=>stagingPreviewIndex(index.replace('alpha-stage-config.js','production-config.js')));
 assert.throws(()=>stagingPreviewIndex(index+index));
 assert.throws(()=>stagingPreviewIndex(output));
});
