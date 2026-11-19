import test from 'node:test';
import assert from 'node:assert/strict';
import {extractM257Attempt} from '../research/main1054/m257-real-runner-evidence.mjs';
import {extractM258Attempt,aggregateM258} from '../research/main1054/m258-six-cell-red-preserving-adoption.mjs';

const checkout='a'.repeat(40),jpeg='1'.repeat(64),runId='44462380866';
const cells=['chromium','webkit'].flatMap(engine=>[320,390,430].map(width=>[engine,width]));
const markers=(engine='webkit',overrides={})=>{
 const rows={
  M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW:{
   engine,sourceSHA256:jpeg,realWorker:true,modelRequests:9,groups:2,saved:0,hold:true
  },
  M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS:{
   engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,ownerPrivateSaved:1,
   exactOriginalSHA256:jpeg,realNativeOutfit:true,savedOutfitOwnerAction:true,
   restoredSavedOutfitCount:1,actualV4BrowserDownload:true,tamperDenied:true,
   otherOwnerDenied:true,cancelledRestoreUnchanged:true,atomicRestore:true,
   threeDAuthorized:false,hostedRLS:false,familyAlpha:'HOLD',releaseAuthorized:false
  },
  P91_FULL_JOURNEY_PASS:{
   engine,uninterruptedSourceExportRestore:true,writeRetries:0,ownerRecovery:true,
   originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',releaseAuthorized:false
  },
  M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY:{
   engine,realWorkerFirst:true,explicitOwnerASave:1,ownerBPrivateRows:0,
   ownerAOriginalNotVisibleToB:true,ownerAOutfitNotVisibleToB:true,
   m59SourceOnlyGalleryUsesExactOriginal:true,m59BoardMutationRevoked:true,
   m59LogoutAndBRevoked:true,localIndexedDBOnly:true,syntheticAuth:true,
   hostedRLS:false,independentHumanLabelAccuracy:false,physicalPhone:false,
   familyAlpha:'HOLD',releaseAllowed:false
  }
 };
 for(const [name,fields] of Object.entries(overrides))
  rows[name]={...rows[name],...fields};
 return Object.entries(rows).map(([key,value])=>key+' '+JSON.stringify(value)).join('\n');
};
const identity=(engine='webkit',width=390,extra={})=>({
 checkout,engine,width,runId,job:'m258-original',runAttempt:1,
 exitCode:0,lockedJpegSha:jpeg,...extra
});
const extract=(engine='webkit',width=390,log=markers(engine),extra={})=>
 extractM258Attempt(log,identity(engine,width,extra));
const matrix=()=>cells.map(([engine,width])=>extract(engine,width));

test('M258 true first-attempt original model/owner-B success passes journey but blocks unseen JSEP/model',()=>{
 const x=extract();
 assert.equal(x.journeyStatus,'PASS');
 assert.equal(x.originalOwnerBLocalIsolationAttested,true);
 assert.equal(x.syntheticOwnerBIsolationMarkerCount,1);
 assert.equal(x.explicitOriginalNativeRedSeen,false);
 assert.equal(x.sourceEvidenceGate,'BLOCKED');
 assert.equal(x.modelSHA256,null);
 assert.equal(x.jsepSHA256,null);
 assert.equal(x.actualBrowserProcessId,null);
 assert.equal(x.sameBrowserProcessObserved,false);
 assert.equal(x.familyAlpha,'HOLD');
});

test('M258 RED-before witness: original #1453 accepts four positive markers plus explicit native FAIL',()=>{
 const log=markers()+'\nM58_REAL_P88_WORKER_FAIL '+JSON.stringify({
  stage:'native-model-init',error:'SYNTHETIC_ERROR_SECRET_TO_HIDE'});
 assert.equal(extractM257Attempt(log,identity()).journeyStatus,'PASS');
 const result=extract('webkit',390,log);
 assert.equal(result.journeyStatus,'FAIL');
 assert.equal(result.sourceEvidenceGate,'FAIL');
 assert.equal(result.explicitOriginalNativeRedSeen,true);
 assert.doesNotMatch(JSON.stringify(result),/SYNTHETIC_ERROR_SECRET_TO_HIDE/);
});

test('M258 missing original owner-B private isolation marker cannot pass despite 3 green stages',()=>{
 const log=markers().split('\n').filter(s=>
  !s.startsWith('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY ')).join('\n');
 assert.equal(extractM257Attempt(log,identity()).journeyStatus,'PASS');
 const result=extract('webkit',390,log);
 assert.equal(result.journeyStatus,'BLOCKED');
 assert.equal(result.originalOwnerBLocalIsolationAttested,false);
 assert.equal(result.syntheticOwnerBIsolationMarkerCount,0);
});

test('M258 duplicate or malformed cross-owner isolation markers remain BLOCKED',()=>{
 const log=markers();
 const p=log.split('\n').find(s=>s.startsWith(
  'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY '));
 assert.equal(extract('webkit',390,log+'\n'+p).journeyStatus,'BLOCKED');
 assert.equal(extract('webkit',390,log.replace(p,
  'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY {bad')).journeyStatus,'BLOCKED');
 assert.equal(extract('webkit',390,log.replace(p,p+' '.repeat(4000))).journeyStatus,'BLOCKED');
});

test('M258 explicit original native RED has precedence over missing or corrupt other markers',()=>{
 const log=markers().split('\n').slice(0,2).join('\n')+'\nM58_REAL_P88_WORKER_FAIL {}';
 const r=extract('webkit',390,log);
 assert.equal(r.journeyStatus,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
});

test('M258 false owner-B isolation/hosted-auth/photo-review conditions cannot pass',()=>{
 for(const altered of [
  {ownerBPrivateRows:1},
  {ownerAOriginalNotVisibleToB:false},
  {ownerAOutfitNotVisibleToB:false},
  {m59SourceOnlyGalleryUsesExactOriginal:false},
  {m59BoardMutationRevoked:false},
  {m59LogoutAndBRevoked:false},
  {syntheticAuth:false},
  {hostedRLS:true},
  {explicitOwnerASave:0},
  {releaseAllowed:true},
  {physicalPhone:true},
  {familyAlpha:'OPEN'}
 ]){
  const log=markers('webkit',{
   M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY:altered
  });
  const r=extract('webkit',390,log);
  assert.equal(r.journeyStatus,'BLOCKED',JSON.stringify(altered));
 }
});

test('M258 native model failure always outranks any prior owner success, even on exit code 0',()=>{
 assert.equal(extract('webkit',390,markers(),{exitCode:1}).journeyStatus,'FAIL');
 assert.equal(extract('webkit',390,markers()+'\nM58_REAL_P88_WORKER_FAIL').journeyStatus,'FAIL');
 assert.equal(extract('webkit',390,markers(),{exitCode:124}).journeyStatus,'FAIL');
});

test('M258 successful six-cell original matrix remains strict source/release HOLD',()=>{
 const x=aggregateM258(matrix(),{checkout,runId});
 assert.equal(x.originalCells,6);
 assert.equal(x.originalJourneysAccepted,6);
 assert.equal(x.journeyGate,'PASS');
 assert.equal(x.sourceEvidenceGate,'BLOCKED');
 assert.equal(x.releaseAuthorized,false);
 assert.equal(x.originalIntermittentWebkitFaultPermanentlyFixed,false);
 assert.equal(x.originalModelJsepSameProcessAttested,false);
});

test('M258 one genuine same-checkout WebKit RED cannot be rescued by five green browser cells',()=>{
 const rows=matrix();
 rows[5]=extract('webkit',430,markers('webkit')+'\nM58_REAL_P88_WORKER_FAIL {}');
 const x=aggregateM258(rows,{checkout,runId});
 assert.equal(x.journeyGate,'FAIL');
 assert.equal(x.sourceEvidenceGate,'FAIL');
 assert.equal(x.originalRedDetected,true);
});

test('M258 missing, duplicate, stale donor and retry receipts block full matrix',()=>{
 const rows=matrix(),scope={checkout,runId};
 assert.equal(aggregateM258(rows.slice(1),scope).journeyGate,'BLOCKED');
 assert.equal(aggregateM258([...rows,rows[0]],scope).journeyGate,'BLOCKED');
 assert.equal(aggregateM258(rows.map((x,i)=>i===0?{...x,checkout:'b'.repeat(40)}:x),scope).journeyGate,'BLOCKED');
 assert.equal(aggregateM258(rows.map((x,i)=>i===0?{...x,runAttempt:2}:x),scope).journeyGate,'BLOCKED');
});

test('M258 forged owner-proof flags or full hash claims cannot bypass source restriction',()=>{
 const rows=matrix();
 rows[0]={...rows[0],originalOwnerBLocalIsolationAttested:false};
 assert.equal(aggregateM258(rows,{checkout,runId}).journeyGate,'BLOCKED');
 const forged=matrix();
 forged[3]={...forged[3],sameBrowserProcessObserved:true,modelSHA256:'f'.repeat(64),
  jsepSHA256:'f'.repeat(64)};
 assert.equal(aggregateM258(forged,{checkout,runId}).journeyGate,'BLOCKED');
});

test('M258 wrong engine, original source, and synthetic owner check remain blocked',()=>{
 assert.equal(extract('webkit',390,markers('chromium')).journeyStatus,'BLOCKED');
 assert.equal(extract('webkit',390,markers('webkit',{
  M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW:{sourceSHA256:'f'.repeat(64)}
 })).journeyStatus,'BLOCKED');
 assert.equal(extract('webkit',390,markers('webkit',{
  M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS:{otherOwnerDenied:false}
 })).journeyStatus,'BLOCKED');
});

test('M258 rejects unbounded original stdout and never serializes secrets or pixel payloads',()=>{
 assert.throws(()=>extract('webkit',390,'x'.repeat(9*1024*1024)),TypeError);
 const r=extract('webkit',390,markers()+'\nANON_ACCOUNT_SECRET=NOT_FOR_EVIDENCE');
 assert.equal(r.journeyStatus,'PASS');
 assert.doesNotMatch(JSON.stringify(r),/NOT_FOR_EVIDENCE/);
});
