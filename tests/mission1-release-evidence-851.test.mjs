// Mission 1 P851. ALL attestations and keys generated here are synthetic
// structural fixtures. They NEVER constitute human, device, or cloud evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {SCHEMA,METRICS,evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';
import {canonical} from '../scripts/p75-dataset-core.mjs';

const hex=x=>String(x).repeat(64);
const at='2026-11-13T03:20:00.000Z';
const target=hex('a'),model=hex('b'),manifest=hex('c');
const now=new Date('2026-11-13T03:45:00.000Z');
function syntheticSignedBundle(){
 const roles={},trusted={},secrets={};
 for(const role of ['ownerPolicy','independentBlind','physicalDevices','signedCloud']){
  const kp=generateKeyPairSync('ed25519');
  const publicKey=kp.publicKey.export({type:'spki',format:'pem'});
  trusted[role]=createHash('sha256').update(kp.publicKey.export({type:'spki',format:'der'})).digest('hex');
  secrets[role]=kp.privateKey;
  roles[role]={role,publicKey,signature:'',payload:{
   schema:SCHEMA,signedAt:at,targetCommit:target,modelSha256:model,blindManifestSha256:manifest
  }};
 }
 roles.ownerPolicy.payload={
  ...roles.ownerPolicy.payload,approvedAt:'2026-11-11T04:00:00.000Z',
  familyAlphaHold:true,releaseAuthorized:false,
  thresholds:Object.fromEntries(METRICS.map(m=>[m,{minimumSamples:20,minimumAccuracy:.8}]))
 };
 roles.independentBlind.payload={
  ...roles.independentBlind.payload,
  scoredAt:'2026-11-12T15:00:00.000Z',
  independentRegistrarVetted:true,sourceDisjoint:true,
  historicalExposureCount:0,crossSplitLeakageCount:0,
  predictionsVisibleToReviewers:false,originalBytesVerified:true,
  curatorRightsApproved:true,sealedBeforeScoring:true,p75OfflineAuditVerified:true,
  newSealedBlindSources:60,originalSourcesVerified:60,
  twoIndependentHumanConsensus:60,eligibleScoredSources:60,
  metrics:Object.fromEntries(METRICS.map(m=>[m,{correct:55,total:60}]))
 };
 const phone=(platform,browser)=>({platform,browser,physical:true,emulated:false,
  witnessedByIndependentOperator:true,genuineOriginalPhotoUsed:true,
  ownerConfirmedEachSave:true,noWrongSave:true,privateDataIsolationVerified:true,
  captureToPrivateClosetPass:true,osVersion:'TEST 0.0',browserVersion:'TEST 0.0',
  testEvidenceSha256:hex('d')});
 roles.physicalDevices.payload={
  ...roles.physicalDevices.payload,devices:[phone('Android','Chrome'),phone('iPhone','Safari')],
  realDeviceRuns:2,syntheticOnly:false
 };
 roles.signedCloud.payload={
  ...roles.signedCloud.payload,ownerAuthorizedTest:true,signedTwoAccountPrivateEndToEnd:true,
  ownerIsolationPass:true,backupRestorePass:true,sessionRevocationPass:true,
  crossTabRacePass:true,privateAuditSha256:hex('e'),fakeAccountsOnly:false
 };
 function reseal(role){
  roles[role].signature=sign(null,Buffer.from(canonical({role,payload:roles[role].payload})),secrets[role]).toString('base64');
 }
 Object.keys(roles).forEach(reseal);
 return {bundle:{schema:SCHEMA,roles},trusted,reseal};
}
function evaluate(x){return evaluateMission1Evidence(x.bundle,x.trusted,now);}
function blocked(report,text){assert.equal(report.status,'BLOCKED');assert.equal(report.shouldLiftFamilyAlphaHold,false);assert.ok(report.issues.some(s=>s.includes(text)),JSON.stringify(report.issues));}

test('P851 default repository state refuses to claim independent recognition, phone or cloud approval',()=>{
 const no=evaluateMission1Evidence(null,{},now);
 blocked(no,'no externally signed evidence');
 assert.equal(no.noDeploy,true);
 assert.equal(no.checkedRoles,0);
 assert.equal(no.countOfPhysicalDevicePlatforms,0);
 assert.equal(no.countOfIndependentHumanBlindSources,0);
});
test('P851 signed synthetic contract only becomes review-eligible; NEVER automatically lifts HOLD',()=>{
 const x=syntheticSignedBundle(),report=evaluate(x);
 assert.equal(report.status,'EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE');
 assert.equal(report.issues.length,0);
 assert.equal(report.countOfPhysicalDevicePlatforms,2);
 assert.equal(report.countOfIndependentHumanBlindSources,60);
 assert.equal(report.shouldLiftFamilyAlphaHold,false);
 assert.equal(report.noDeploy,true);
});
test('P851 cannot substitute own generated fixture mark, private wardrobe payload or raw photo into acceptance',()=>{
 const x=syntheticSignedBundle();x.bundle.fixture=true;
 blocked(evaluate(x),'test fixture');
 const y=syntheticSignedBundle();y.bundle.roles.independentBlind.payload.rawLabels=[{category:'Blue'}];y.reseal('independentBlind');
 blocked(evaluate(y),'private payload forbidden');
 const z=syntheticSignedBundle();z.bundle.roles.physicalDevices.payload.photo='data:image/png;base64,FAKE';z.reseal('physicalDevices');
 blocked(evaluate(z),'private payload forbidden');
});
test('P851 unsigned/tampered, wrong trust-pin or counterfeit role cannot authorize release',()=>{
 let x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.metrics.category.correct=100;
 blocked(evaluate(x),'independentBlind signature');
 x=syntheticSignedBundle();x.trusted.independentBlind=hex('f');
 blocked(evaluate(x),'independentBlind signature');
 x=syntheticSignedBundle();x.bundle.roles.physicalDevices.role='ownerPolicy';
 blocked(evaluate(x),'physicalDevices signature');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.signature='Zm9yZ2Vk';
 blocked(evaluate(x),'independentBlind signature');
});
test('P851 same reviewer key cannot impersonate multiple independent acceptance duties',()=>{
 const x=syntheticSignedBundle(),key=x.bundle.roles.independentBlind;
 x.bundle.roles.physicalDevices.publicKey=key.publicKey;
 x.trusted.physicalDevices=x.trusted.independentBlind;
 // Invalid signature, even with changed external trust fingerprint:
 blocked(evaluate(x),'physicalDevices signature');
});
test('P851 human review count/rights/disjoint leakage/predictions remain independent blockers',()=>{
 let x=syntheticSignedBundle();
 x.bundle.roles.independentBlind.payload.newSealedBlindSources=59;x.reseal('independentBlind');
 blocked(evaluate(x),'at least 60');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.twoIndependentHumanConsensus=0;x.reseal('independentBlind');
 blocked(evaluate(x),'at least 60');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.historicalExposureCount=1;x.reseal('independentBlind');
 blocked(evaluate(x),'ground truth or rights');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.predictionsVisibleToReviewers=true;x.reseal('independentBlind');
 blocked(evaluate(x),'ground truth or rights');
});
test('P851 predeclared thresholds and strict metric denominators are not retrospective tuning',()=>{
 let x=syntheticSignedBundle();
 x.bundle.roles.ownerPolicy.payload.approvedAt='2026-11-12T20:00:00.000Z';x.reseal('ownerPolicy');
 blocked(evaluate(x),'not frozen before scoring');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.metrics.subtype.correct=3;x.reseal('independentBlind');
 blocked(evaluate(x),'subtype below preapproved');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.metrics.ownedFootwearUnit.total=2;x.reseal('independentBlind');
 blocked(evaluate(x),'underpowered ownedFootwearUnit');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.metrics.category.total=100;x.reseal('independentBlind');
 blocked(evaluate(x),'denominator exceeds blind source count');
});
test('P851 desktop Chromium/WebKit emulation cannot pretend to be a witnessed Android or iPhone device',()=>{
 let x=syntheticSignedBundle();x.bundle.roles.physicalDevices.payload.devices[0].physical=false;x.reseal('physicalDevices');
 blocked(evaluate(x),'physical end-to-end acceptance');
 x=syntheticSignedBundle();x.bundle.roles.physicalDevices.payload.devices[1].browser='Chrome';x.reseal('physicalDevices');
 blocked(evaluate(x),'physical end-to-end acceptance');
 x=syntheticSignedBundle();x.bundle.roles.physicalDevices.payload.devices[0].noWrongSave=false;x.reseal('physicalDevices');
 blocked(evaluate(x),'physical end-to-end acceptance');
 x=syntheticSignedBundle();x.bundle.roles.physicalDevices.payload.syntheticOnly=true;x.reseal('physicalDevices');
 blocked(evaluate(x),'execution count missing');
});
test('P851 owner-approved signed two-account cloud isolation is mandatory and cannot be inferred from local mocks',()=>{
 const x=syntheticSignedBundle();
 x.bundle.roles.signedCloud.payload.signedTwoAccountPrivateEndToEnd=false;x.reseal('signedCloud');
 blocked(evaluate(x),'signed two-owner cloud');
});
test('P851 cross-version source/model/manifest and time-bound receipts are rejected',()=>{
 let x=syntheticSignedBundle();
 x.bundle.roles.independentBlind.payload.modelSha256=hex('4');x.reseal('independentBlind');
 blocked(evaluate(x),'not bound to owner-approved');
 x=syntheticSignedBundle();
 x.bundle.roles.physicalDevices.payload.signedAt='2030-01-01T00:00:00.000Z';x.reseal('physicalDevices');
 blocked(evaluate(x),'signature timestamp invalid');
});
test('P851 existing P850 owner-reviewed save, source-bound color, queue and P849 duplicate protections unchanged',()=>{
 const app=readFileSync('public/app.js','utf8');
 const outfit=readFileSync('public/outfit-capture.js','utf8');
 const queue=readFileSync('public/review-queue-850.js','utf8');
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/let saveInFlight=false;/);
 assert.match(app,/P849_CHANGED_CANDIDATE_OR_OWNER/);
 assert.match(app,/function learningScope72\(/);
 assert.match(app,/reviewQueue850\.keepForLater/);
 assert.match(outfit,/const outfitColor76=outfitUnits70/);
 assert.doesNotMatch(queue,/writeAll\(|savePiece\(/);
});
