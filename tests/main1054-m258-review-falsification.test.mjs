import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractM257Attempt, aggregateM257} from
  '../research/main1054/m257-real-runner-evidence.mjs';

// Native P94 prints four independently meaningful stages, never fake model
// outputs; these are structural unit-test fixtures, not genuine browser proof.
const candidate='a'.repeat(40), runId='44462380866';
const source='1'.repeat(64);
const make=(engine='webkit',width=390,extras={})=>({
  checkout:candidate, engine, width, runId, job:'m258-original',runAttempt:1,
  exitCode:0, lockedJpegSha:source,...extras
});
const marker=(name,obj)=>name+' '+JSON.stringify(obj);
const markerNames={
  model:'M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',
  owner:'M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS',
  isolation:'M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY',
  final:'P91_FULL_JOURNEY_PASS'
};
function originalStages(engine='webkit',overrides={}) {
 const data={
  model:{engine,sourceSHA256:source,realWorker:true,modelRequests:9,
    groups:2,saved:0,hold:true},
  owner:{engine,modelExecuted:true,manualSyntheticOwnerConfirmed:true,
    ownerPrivateSaved:1,exactOriginalSHA256:source,realNativeOutfit:true,
    savedOutfitOwnerAction:true,restoredSavedOutfitCount:1,
    actualV4BrowserDownload:true,tamperDenied:true,otherOwnerDenied:true,
    cancelledRestoreUnchanged:true,atomicRestore:true,threeDAuthorized:false,
    hostedRLS:false,physicalPhone:false,familyAlpha:'HOLD',
    releaseAuthorized:false},
  isolation:{engine,realWorkerFirst:true,explicitOwnerASave:1,
    ownerBPrivateRows:0,ownerAOriginalNotVisibleToB:true,
    ownerAOutfitNotVisibleToB:true,m59SourceOnlyGalleryUsesExactOriginal:true,
    m59BoardMutationRevoked:true,m59LogoutAndBRevoked:true,
    localIndexedDBOnly:true,syntheticAuth:true,hostedRLS:false,
    familyAlpha:'HOLD',releaseAllowed:false},
  final:{engine,uninterruptedSourceExportRestore:true,writeRetries:0,
    extraTamperReloads:0,ownerRecovery:true,
    originalPhotoByteTamperRefused:true,familyAlpha:'HOLD',
    releaseAuthorized:false}
 };
 for(const [key,delta] of Object.entries(overrides))
  data[key]={...data[key],...delta};
 return Object.entries(markerNames).map(([key,name])=>marker(name,data[key]));
}
const parse=(lines=originalStages(),id=make())=>
 extractM257Attempt(Array.isArray(lines)?lines.join('\n'):lines,id);

test('complete four-stage original marker structure is accepted as journey only, never source attested',()=>{
 const r=parse();
 assert.equal(r.journeyStatus,'PASS');
 assert.equal(r.sourceEvidenceGate,'BLOCKED');
 assert.equal(r.modelSHA256,null);
 assert.equal(r.jsepSHA256,null);
 assert.equal(r.sameBrowserProcessObserved,false);
 assert.equal(r.recordedSignals[markerNames.isolation],1);
 assert.equal(r.familyAlpha,'HOLD');
});

test('review #5969601250 baseline witness: explicit original terminal RED overrides all positive markers even exit 0',()=>{
 const lines=originalStages();
 lines.push('M58_REAL_P88_WORKER_FAIL '+JSON.stringify({
  stage:'model-session-load',error:'PRIVATE_RAW_FAILURE_DO_NOT_ECHO'
 }));
 const r=parse(lines);
 assert.equal(r.journeyStatus,'FAIL');
 assert.equal(r.sourceEvidenceGate,'FAIL');
 assert.equal(r.terminalRedMarkerCount,1);
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE_RAW_FAILURE_DO_NOT_ECHO/);
});

test('original WebKit terminal RED before positive markers still cannot be laundered by later successes',()=>{
 const lines=originalStages();
 lines.unshift('M58_REAL_P88_WORKER_FAIL '+JSON.stringify({stage:'model',error:'masked'}));
 assert.equal(parse(lines).journeyStatus,'FAIL');
});

test('mandatory independent native owner-B privacy/isolation marker cannot be omitted',()=>{
 const lines=originalStages().filter(line=>!line.startsWith(markerNames.isolation+' '));
 assert.equal(parse(lines).journeyStatus,'BLOCKED');
});

test('spoofed B privacy leak or ambiguous duplicate isolation marker blocks admission',()=>{
 const changed=originalStages('webkit',{isolation:{ownerBPrivateRows:1}});
 assert.equal(parse(changed).journeyStatus,'BLOCKED');
 const untrusted=originalStages('webkit',{isolation:{ownerAOriginalNotVisibleToB:false}});
 assert.equal(parse(untrusted).journeyStatus,'BLOCKED');
 const duplicate=originalStages();
 duplicate.splice(3,0,duplicate[2]);
 assert.equal(parse(duplicate).journeyStatus,'BLOCKED');
});

test('owner isolation must assert original A outfit/source absent to B, synthetic local only, no release',()=>{
 const cases=[
  {ownerAOutfitNotVisibleToB:false},
  {realWorkerFirst:false},
  {localIndexedDBOnly:false},
  {syntheticAuth:false},
  {hostedRLS:true},
  {releaseAllowed:true},
  {familyAlpha:'READY'}
 ];
 for(const delta of cases)
  assert.equal(parse(originalStages('webkit',{isolation:delta})).journeyStatus,'BLOCKED',
    JSON.stringify(delta));
});

test('marker positions are bound to one chronological original journey, not reordered transcript fragments',()=>{
 const lines=originalStages();
 assert.equal(parse([lines[2],lines[0],lines[1],lines[3]]).journeyStatus,'BLOCKED');
 assert.equal(parse([lines[0],lines[3],lines[1],lines[2]]).journeyStatus,'BLOCKED');
});

test('malformed terminal marker is still a RED without parsing secret error content',()=>{
 const lines=originalStages();
 lines.push('M58_REAL_P88_WORKER_FAIL {bad-json-private-value');
 assert.equal(parse(lines).journeyStatus,'FAIL');
});

test('unexpectedly large browser transcript is refused instead of blessing three copied positive markers',()=>{
 const oversized=originalStages().join('\n')+'\n'+('x'.repeat(8*1024*1024));
 assert.throws(()=>parse(oversized),TypeError);
});

test('nonzero original runner exit always fails independently of marker coverage',()=>{
 assert.equal(parse(originalStages(),make('webkit',390,{exitCode:124})).journeyStatus,'FAIL');
});

test('six-cell native candidate aggregation preserves FAIL from explicit terminal RED over five green siblings',()=>{
 const cells=['chromium','webkit'].flatMap(engine=>[320,390,430].map(width=>[engine,width]));
 const receipts=cells.map(([engine,width])=>parse(originalStages(engine),make(engine,width)));
 const failLines=originalStages('webkit');
 failLines.push('M58_REAL_P88_WORKER_FAIL '+JSON.stringify({stage:'native-session'}));
 receipts[5]=parse(failLines,make('webkit',430));
 const r=aggregateM257(receipts,{checkout:candidate,runId});
 assert.equal(r.journeyGate,'FAIL');
 assert.equal(r.failedJourneys,1);
 assert.equal(r.sourceEvidenceGate,'FAIL');
});

test('no raw original private errors or browser text are copied to machine evidence',()=>{
 const lines=originalStages();
 lines.push('M58_REAL_P88_WORKER_FAIL '+JSON.stringify({account:'SENSITIVE_ACCOUNT',photo:'SENSITIVE_PHOTO'}));
 const r=parse(lines);
 const report=JSON.stringify(r);
 assert.doesNotMatch(report,/SENSITIVE_ACCOUNT|SENSITIVE_PHOTO/);
 assert.equal(Object.hasOwn(r,'rawLog'),false);
});
