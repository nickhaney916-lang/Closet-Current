import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateM257OriginalRun} from '../research/main1054/m257-original-browser-ci-ingest.mjs';

const SHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const HEAD='a'.repeat(40);
const marker=(name,data)=>name+' '+JSON.stringify(data);
const records=({engine='webkit',overwrite={}}={})=>{
 const model={engine,sourceSHA256:SHA,groups:2,realWorker:true,modelRequests:9,saved:0,hold:true};
 const owner={engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,
  ownerPrivateSaved:1,exactOriginalSHA256:SHA,realNativeOutfit:true,
  savedOutfitOwnerAction:true,actualV4BrowserDownload:true,atomicRestore:true,
  otherOwnerDenied:true,tamperDenied:true,threeDAuthorized:false,hostedRLS:false,
  physicalPhone:false,familyAlpha:'HOLD',releaseAuthorized:false};
 const isolation={engine,realWorkerFirst:true,ownerBPrivateRows:0,
  ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
  localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,releaseAllowed:false};
 const lifecycle={engine,uninterruptedSourceExportRestore:true,writeRetries:0,
  extraTamperReloads:0,ownerRecovery:true,originalPhotoByteTamperRefused:true,
  familyAlpha:'HOLD',releaseAuthorized:false};
 const groups={model,owner,isolation,lifecycle};
 for(const [key,delta] of Object.entries(overwrite))
  groups[key]={...groups[key],...delta};
 return Object.entries({
  M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW:groups.model,
  M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS:groups.owner,
  M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY:groups.isolation,
  P91_FULL_JOURNEY_PASS:groups.lifecycle
 }).map(([key,value])=>marker(key,value)).join('\n');
};
const assess=(stdout=records(),options={})=>evaluateM257OriginalRun({
 stdout,runnerExit:0,checkout:HEAD,expectedHead:HEAD,engine:'webkit',width:390,
 ...options
});

test('positive original browser and synthetic-owner markers can only pass journey, never provenance or release',()=>{
 const r=assess();
 assert.equal(r.originalJourney,'PASS');
 assert.equal(r.browserReceiptPromotionGate,'BLOCKED');
 assert.equal(r.originalModelBytesHashObservedInBrowser,false);
 assert.equal(r.originalJsepBytesHashObservedInBrowser,false);
 assert.equal(r.sameBrowserProcessTripleSourceAttested,false);
 assert.equal(r.originalOnnxWebkitPermanentRepairEstablished,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.pinnedOriginalJpegSHA256Verified,true);
 assert.equal(r.syntheticOwnerPrivateV4Reported,true);
 assert.equal(r.ownerBLocalIsolationReported,true);
 assert.equal(r.originalSourceRecoveryReported,true);
});

test('genuine original model error or nonzero exit preserves FAIL despite earlier positive markers',()=>{
 for(const change of [
  {stdout:records(),runnerExit:1},
  {stdout:records()+'\nM58_REAL_P88_WORKER_FAIL '+JSON.stringify({stage:'model',error:'REDACT_ME'})},
  {stdout:records(),runnerExit:124}
 ]){
  const r=assess(change.stdout,{runnerExit:change.runnerExit??0});
  assert.equal(r.originalJourney,'FAIL');
  assert.equal(r.browserReceiptPromotionGate,'FAIL');
  assert.equal(r.releaseAuthorized,false);
  assert.doesNotMatch(JSON.stringify(r),/REDACT_ME/);
 }
});

test('missing, duplicate, malformed and oversize output cannot certify private source',()=>{
 const complete=records();
 for(const changed of [
  complete.split('\n').slice(1).join('\n'),
  complete+'\n'+complete.split('\n')[0],
  complete.replace('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS {',
   'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS {invalid,'),
  complete+'\nJUNK'.repeat(2500000)
 ]){
  if(changed.length>8*1024*1024)
   assert.throws(()=>assess(changed),TypeError);
  else assert.notEqual(assess(changed).originalJourney,'PASS');
 }
});

test('tampered original source or copied sibling engine cannot be counted',()=>{
 for(const [raw,engine] of [
  [records({overwrite:{model:{sourceSHA256:'0'.repeat(64)}}}),'webkit'],
  [records({overwrite:{owner:{exactOriginalSHA256:'f'.repeat(64)}}}),'webkit'],
  [records({engine:'chromium'}),'webkit']
 ]){
  const r=assess(raw,{engine});
  assert.equal(r.originalJourney,'BLOCKED');
  assert.equal(r.browserReceiptPromotionGate,'BLOCKED');
 }
});

test('correct Chromium originally witnessed journey remains only provenance blocked',()=>{
 const r=assess(records({engine:'chromium'}),{engine:'chromium',width:320});
 assert.equal(r.originalJourney,'PASS');
 assert.equal(r.configuredViewportWidth,320);
 assert.equal(r.sameBrowserProcessTripleSourceAttested,false);
});

test('different checkout or missing exact head is never authenticated by valid-looking markers',()=>{
 assert.equal(assess(records(),{expectedHead:'b'.repeat(40)}).originalJourney,'BLOCKED');
 assert.throws(()=>assess(records(),{checkout:'bad'}),TypeError);
});

test('fake model inference, silent saves, synthetic cross-account leaks, or 3D admission refuse a positive',()=>{
 const changes=[
  {model:{realWorker:false}},
  {model:{modelRequests:0}},
  {model:{saved:1}},
  {owner:{ownerPrivateSaved:0}},
  {owner:{otherOwnerDenied:false}},
  {owner:{threeDAuthorized:true}},
  {owner:{hostedRLS:true}},
  {isolation:{ownerBPrivateRows:1}},
  {isolation:{ownerAOriginalNotVisibleToB:false}},
  {lifecycle:{writeRetries:1}},
  {lifecycle:{originalPhotoByteTamperRefused:false}},
  {owner:{familyAlpha:'OPEN'}}
 ];
 for(const overwrite of changes)
  assert.equal(assess(records({overwrite})).originalJourney,'BLOCKED',JSON.stringify(overwrite));
});

test('private source secrets/raw exceptions are never included in machine receipt',()=>{
 const raw=records()+'\nM58_REAL_P88_WORKER_FAIL '+JSON.stringify({
  error:'PERSONAL_RAW_SESSION_SECRET_DO_NOT_LOG',privatePhoto:'secret'})+'\n';
 const r=assess(raw);
 assert.equal(r.originalJourney,'FAIL');
 assert.doesNotMatch(JSON.stringify(r),/PERSONAL_RAW_SESSION_SECRET_DO_NOT_LOG|privatePhoto/);
});

test('unrecognized terminal status and invalid schema cannot be turned into PASS',()=>{
 for(const runnerExit of [-1,256,undefined,NaN,'0']) {
  assert.throws(()=>assess(records(),{runnerExit}),TypeError);
 }
 assert.throws(()=>assess(records(),{width:144}),TypeError);
 assert.throws(()=>assess(records(),{engine:'safari'}),TypeError);
});

test('report counts are bounded and duplicate original actor observation blocks',()=>{
 const full=records(),d=full.split('\n')[2];
 const r=assess(full+'\n'+d);
 assert.equal(r.originalJourney,'BLOCKED');
 assert.equal(r.isolationMarkerCount,2);
 assert.equal(r.releaseAuthorized,false);
});
