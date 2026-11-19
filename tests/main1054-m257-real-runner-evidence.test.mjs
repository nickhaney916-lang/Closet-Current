import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractM257Attempt, aggregateM257 } from
  '../research/main1054/m257-real-runner-evidence.mjs';

const checkout = 'a'.repeat(40);
const sha = '1'.repeat(64);
const runId = '44460906635';
const pinned = { checkout, runId, job: 'm257-original',
  runAttempt: 1, exitCode: 0, lockedJpegSha: sha };
const cells = ['chromium','webkit'].flatMap(engine =>
  [320,390,430].map(width => [engine,width]));
function identity(engine='webkit',width=390,overrides={}) {
  return { ...pinned, engine, width, ...overrides };
}
function goodSignals(engine='webkit', override={}) {
  const stages = {
    M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW: {
      engine, sourceSHA256: sha, realWorker: true, modelRequests: 9,
      saved: 0, hold: true,
    },
    M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS: {
      engine, modelExecuted: true, manualSyntheticOwnerConfirmed: true,
      ownerPrivateSaved: 1, exactOriginalSHA256: sha,
      realNativeOutfit: true, savedOutfitOwnerAction: true,
      restoredSavedOutfitCount: 1, actualV4BrowserDownload: true,
      tamperDenied: true, otherOwnerDenied: true,
      cancelledRestoreUnchanged: true, atomicRestore: true,
      threeDAuthorized: false, hostedRLS: false, familyAlpha: 'HOLD',
    },
    P91_FULL_JOURNEY_PASS: {
      engine, uninterruptedSourceExportRestore: true, writeRetries: 0,
      ownerRecovery: true, originalPhotoByteTamperRefused: true,
      familyAlpha: 'HOLD', releaseAuthorized: false,
    },
  };
  for (const [name, fields] of Object.entries(override))
    stages[name] = { ...stages[name], ...fields };
  return Object.entries(stages).map(([name,body]) =>
    name + ' ' + JSON.stringify(body)).join('\n');
}
const extract=(log=goodSignals(), id=identity())=>extractM257Attempt(log,id);
const fullyGreen = () => cells.map(([engine,width]) =>
  extract(goodSignals(engine),identity(engine,width)));

test('authentic-shape original runner signals produce journey PASS but source promotion BLOCKED', () => {
  const r=extract();
  assert.equal(r.journeyStatus,'PASS');
  assert.equal(r.sourceEvidenceGate,'BLOCKED');
  assert.equal(r.jpegSHA256,sha);
  assert.equal(r.modelSHA256,null);
  assert.equal(r.jsepSHA256,null);
  assert.equal(r.actualBrowserProcessId,null);
  assert.equal(r.sameBrowserProcessObserved,false);
  assert.equal(r.syntheticAuthOnly,true);
  assert.equal(r.privateCloudRlsTested,false);
});

test('an original native browser RED never becomes green despite forged success markers', () => {
  const r=extract(goodSignals(),identity('webkit',390,{exitCode:1}));
  assert.equal(r.journeyStatus,'FAIL');
  assert.equal(r.sourceEvidenceGate,'FAIL');
});

test('a native model-timeout exit code remains a RED even when no marker survived', () => {
  const r=extract('',identity('webkit',320,{exitCode:124}));
  assert.equal(r.journeyStatus,'FAIL');
  assert.ok(r.reasons.some(s=>s.includes('nonzero')));
});

test('missing, duplicated, malformed stage records fail closed',()=>{
  assert.equal(extract(goodSignals().split('\n').slice(0,2).join('\n')).journeyStatus,'BLOCKED');
  assert.equal(extract(goodSignals()+'\n'+goodSignals().split('\n')[0]).journeyStatus,'BLOCKED');
  assert.equal(extract(goodSignals().replace(/P91_FULL_JOURNEY_PASS .+$/, 'P91_FULL_JOURNEY_PASS {BAD')).journeyStatus,'BLOCKED');
});

test('wrong engine is not a valid same-browser owner result',()=>{
  assert.equal(extract(goodSignals('chromium')).journeyStatus,'BLOCKED');
});

test('source JPEG mismatch blocks and never substitutes an external model URL',()=>{
  const log=goodSignals('webkit',{
    M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW:{sourceSHA256:'f'.repeat(64)}
  });
  const r=extract(log);
  assert.equal(r.journeyStatus,'BLOCKED');
  assert.equal(r.jpegSHA256,null);
});

test('owner denial, zero-autosave and lack of fitted 3D admission are mandatory',()=>{
  const variants=[
    {M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS:{otherOwnerDenied:false}},
    {M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS:{threeDAuthorized:true}},
    {M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS:{atomicRestore:false}},
    {M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW:{saved:1}},
    {P91_FULL_JOURNEY_PASS:{writeRetries:1}},
  ];
  for(const v of variants)
    assert.equal(extract(goodSignals('webkit',v)).journeyStatus,'BLOCKED',JSON.stringify(v));
});

test('untrusted stdout cannot submit secret fields into bounded evidence receipt',()=>{
  const poison=goodSignals()+'\nUSER_PRIVATE_TOKEN=NEVER_ECHO_ME';
  const r=extract(poison);
  assert.equal(r.journeyStatus,'PASS');
  assert.equal(JSON.stringify(r).includes('NEVER_ECHO_ME'),false);
  assert.equal(Object.hasOwn(r,'rawLog'),false);
});

test('identity and job attempts require exact, positive CI metadata',()=>{
  assert.throws(()=>extract('',identity('webkit',390,{checkout:'bad'})),TypeError);
  assert.throws(()=>extract('',identity('webkit',390,{runAttempt:0})),TypeError);
  assert.throws(()=>extract('',identity('webkit',390,{job:'bad job'})),TypeError);
  assert.throws(()=>extract('',identity('webkit',390,{width:500})),TypeError);
  assert.throws(()=>extract('',identity('webkit',390,{lockedJpegSha:'bad'})),TypeError);
});

test('6-cell integration aggregates exactly original valid candidate journeys as research-only',()=>{
  const r=aggregateM257(fullyGreen(),{checkout,runId});
  assert.equal(r.journeyGate,'PASS');
  assert.equal(r.passedJourneys,6);
  assert.equal(r.sourceEvidenceGate,'BLOCKED');
  assert.equal(r.releaseAuthorized,false);
});

test('missing, duplicate, replaced, wrong-checkout or old-run donor cannot clear exact six-cell matrix',()=>{
  const all=fullyGreen();
  assert.equal(aggregateM257(all.slice(1),{checkout,runId}).journeyGate,'BLOCKED');
  assert.equal(aggregateM257([...all,all[0]],{checkout,runId}).journeyGate,'BLOCKED');
  assert.equal(aggregateM257(all.map((row,i)=>i===0?{...row,checkout:'b'.repeat(40)}:row),
    {checkout,runId}).journeyGate,'BLOCKED');
  assert.equal(aggregateM257(all.map((row,i)=>i===0?{...row,runId:'44460906636'}:row),
    {checkout,runId}).journeyGate,'BLOCKED');
});

test('any original WebKit nonzero attempt must FAIL despite five green siblings',()=>{
  const rows=fullyGreen();
  rows[5]=extract(goodSignals('webkit'),identity('webkit',430,{exitCode:1}));
  const r=aggregateM257(rows,{checkout,runId});
  assert.equal(r.journeyGate,'FAIL');
  assert.equal(r.failedJourneys,1);
  assert.equal(r.sourceEvidenceGate,'FAIL');
});

test('CI job ID is not invented native browser process identity',()=>{
  const rows=fullyGreen();
  rows[0]={...rows[0],modelSHA256:'2'.repeat(64),jsepSHA256:'3'.repeat(64),
    sameBrowserProcessObserved:true};
  const r=aggregateM257(rows,{checkout,runId});
  assert.equal(r.journeyGate,'BLOCKED');
  assert.equal(r.sourceEvidenceGate,'BLOCKED');
});

test('running whole suite does not promote actual WebKit reliability or release',()=>{
  const r=aggregateM257(fullyGreen(),{checkout,runId});
  assert.ok(r.reasons.some(s=>s.includes('not observed')));
  assert.equal(r.familyAlpha,'HOLD');
});
