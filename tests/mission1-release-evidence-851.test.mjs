// Mission 1 P851. ALL attestations and keys generated here are synthetic
// structural fixtures. They NEVER constitute human, device, or cloud evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {SCHEMA,METRICS,evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';
import {canonical} from '../scripts/p75-dataset-core.mjs';
import {REQUIRED_PHONE_CASES886,verifyPhoneCaseLedger886} from '../scripts/m1-physical-case-ledger-886.mjs';

const hex=x=>String(x).repeat(64);
const at='2026-11-13T03:20:00.000Z';
const target='a'.repeat(40),model=hex('b'),manifest=hex('c');
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
  signedAt:'2026-11-11T04:01:00.000Z',
  familyAlphaHold:true,releaseAuthorized:false,
  thresholds:Object.fromEntries(METRICS.map(m=>[m,{minimumSamples:m==='noWrongSave'?60:20,
   minimumAccuracy:m==='noWrongSave'?1:.8}]))
 };
 roles.independentBlind.payload={
  ...roles.independentBlind.payload,
  scoredAt:'2026-11-12T15:00:00.000Z',
  signedAt:'2026-11-12T15:05:00.000Z',
  independentRegistrarVetted:true,sourceDisjoint:true,
  historicalExposureCount:0,crossSplitLeakageCount:0,
  predictionsVisibleToReviewers:false,originalBytesVerified:true,
  curatorRightsApproved:true,sealedBeforeScoring:true,p75OfflineAuditVerified:true,
  newSealedBlindSources:60,originalSourcesVerified:60,
  twoIndependentHumanConsensus:60,eligibleScoredSources:60,
  metrics:Object.fromEntries(METRICS.map(m=>[m,{correct:m==='noWrongSave'?60:55,total:60}]))
 };
 const phone=(platform,browser)=>({platform,browser,physical:true,emulated:false,
  witnessedByIndependentOperator:true,genuineOriginalPhotoUsed:true,
  ownerConfirmedEachSave:true,noWrongSave:true,privateDataIsolationVerified:true,
  captureToPrivateClosetPass:true,osVersion:'TEST 0.0',browserVersion:'TEST 0.0',
  testEvidenceSha256:hex(platform==='Android'?'d':'f'),
  protocolVersion:'parallel78-23-v1',casesRequired:23,casesPassed:23,
  casesFailed:0,casesBlocked:0,casesNotRun:0,sourceCommit:target,
  cases:REQUIRED_PHONE_CASES886.map(caseId=>({
   caseId,status:'PASS',severity:'NONE',
   observedAt:'2026-11-13T03:00:00.000Z',
   evidenceSha256:createHash('sha256').update('SYNTHETIC-ONLY:'+platform+':'+caseId).digest('hex')
  }))});
 roles.physicalDevices.payload={
  ...roles.physicalDevices.payload,devices:[phone('Android','Chrome'),phone('iPhone','Safari')],
  realDeviceRuns:2,syntheticOnly:false
 };
 roles.signedCloud.payload={
  ...roles.signedCloud.payload,ownerAuthorizedTest:true,signedTwoAccountPrivateEndToEnd:true,
  ownerIsolationPass:true,backupRestorePass:true,sessionRevocationPass:true,
  crossTabRacePass:true,privateAuditSha256:hex('e'),fakeAccountsOnly:false
 };
 const policyHash=createHash('sha256').update(canonical(roles.ownerPolicy.payload)).digest('hex');
 for(const role of ['independentBlind','physicalDevices','signedCloud'])
  roles[role].payload.ownerPolicyCommitmentSha256=policyHash;
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
 blocked(evaluate(x),'physical device execution count must match all reported attempts');
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
test('integrated P880 runtime keeps explicit source review and original draft protection',()=>{
 const app=readFileSync('public/app.js','utf8');
 const gate=readFileSync('research/main-thread-integration-1054/source-to-outfit.mjs','utf8');
 assert.match(app,/const reviewedSave120Active=nativeCanonical167Active/);
 assert.match(app,/CLOSET_DRAFT_EXPLICIT_SOURCE_REQUIRED/);
 assert.match(app,/const sameRecognitionLease=\(\)=>epoch===captureOperationEpoch&&batch.includes\(item\)/);
 assert.match(app,/Original photo kept/);
 assert.match(gate,/source-verified-2d-only/);
});

test('P884 zero silently wrong blind saves requires full 60/60, not policy-approved 55/60',()=>{
 let x=syntheticSignedBundle();x.bundle.roles.ownerPolicy.payload.thresholds.noWrongSave.minimumAccuracy=.8;
 x.reseal('ownerPolicy');
 blocked(evaluate(x),'noWrongSave must have preapproved 100 percent');
 x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.metrics.noWrongSave.correct=59;
 x.reseal('independentBlind');
 blocked(evaluate(x),'noWrongSave must have preapproved 100 percent');
});
test('P884 refuse selective denominator shrinkage of blind no-wrong-save suite',()=>{
 let x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.metrics.noWrongSave.total=59;
 x.bundle.roles.independentBlind.payload.metrics.noWrongSave.correct=59;
 x.bundle.roles.ownerPolicy.payload.thresholds.noWrongSave.minimumSamples=59;
 x.reseal('independentBlind');x.reseal('ownerPolicy');
 blocked(evaluate(x),'noWrongSave must have preapproved 100 percent');
 x=syntheticSignedBundle();x.bundle.roles.ownerPolicy.payload.thresholds.noWrongSave.minimumSamples=20;
 x.reseal('ownerPolicy');
 blocked(evaluate(x),'noWrongSave must have preapproved 100 percent');
});
test('P884 one physical phone evidence digest cannot masquerade as two platforms',()=>{
 const x=syntheticSignedBundle(),a=x.bundle.roles.physicalDevices.payload;
 a.devices[1].testEvidenceSha256=a.devices[0].testEvidenceSha256;
 x.reseal('physicalDevices');
 blocked(evaluate(x),'duplicate physical-device evidence digest');
 blocked(evaluate(x),'physical end-to-end acceptance');
});
test('P884 malformed trusted pins, missing roles, extra roles fail closed without throwing',()=>{
 let x=syntheticSignedBundle();
 blocked(evaluateMission1Evidence({...x.bundle,roles:null},x.trusted,now),'no externally signed evidence bundle');
 blocked(evaluateMission1Evidence(x.bundle,null,now),'no owner-pinned independent signer fingerprints');
 x=syntheticSignedBundle();delete x.bundle.roles.physicalDevices;
 blocked(evaluate(x),'exactly four role-separated');
 x=syntheticSignedBundle();x.bundle.roles.fifthRole={spoofed:true};
 blocked(evaluate(x),'exactly four role-separated');
});
test('P884 numeric-only public reports ban underscore/case variations of private data keys',()=>{
 let x=syntheticSignedBundle();x.bundle.roles.independentBlind.payload.access_token='FAKE';
 x.reseal('independentBlind');
 blocked(evaluate(x),'private payload forbidden');
 x=syntheticSignedBundle();x.bundle.roles.signedCloud.payload.owner_ID='FAKE';
 x.reseal('signedCloud');
 blocked(evaluate(x),'private payload forbidden');
 x=syntheticSignedBundle();x.bundle.roles.physicalDevices.payload.photo_url='private://photo';
 x.reseal('physicalDevices');
 blocked(evaluate(x),'private payload forbidden');
});
test('P884 synthetic 100% noWrongSave only means review eligible, never deployed or released',()=>{
 const x=syntheticSignedBundle(),result=evaluate(x);
 assert.equal(result.status,'EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE');
 assert.equal(result.noDeploy,true);
 assert.equal(result.shouldLiftFamilyAlphaHold,false);
 assert.equal(result.countOfIndependentHumanBlindSources,60);
 assert.equal(result.countOfPhysicalDevicePlatforms,2);
});

test('P885 signed owner policy must predate scoring even if approvedAt is backdated',()=>{
 const x=syntheticSignedBundle();
 x.bundle.roles.ownerPolicy.payload.signedAt='2026-11-12T15:01:00.000Z';
 x.reseal('ownerPolicy');
 blocked(evaluate(x),'owner policy signature must precede blind scoring');
});
test('P885 owner cannot retroactively lower thresholds without independent role reattestation',()=>{
 const x=syntheticSignedBundle();
 x.bundle.roles.ownerPolicy.payload.thresholds.subtype.minimumAccuracy=.1;
 x.reseal('ownerPolicy');
 blocked(evaluate(x),'independentBlind not cryptographically bound to exact owner threshold policy');
 blocked(evaluate(x),'physicalDevices not cryptographically bound to exact owner threshold policy');
 blocked(evaluate(x),'signedCloud not cryptographically bound to exact owner threshold policy');
});
test('P885 blind receipt cannot substitute a scorer policy digest while preserving valid signatures',()=>{
 const x=syntheticSignedBundle();
 x.bundle.roles.independentBlind.payload.ownerPolicyCommitmentSha256=hex('9');
 x.reseal('independentBlind');
 blocked(evaluate(x),'independentBlind not cryptographically bound to exact owner threshold policy');
});
test('P885 scoring evidence must be independently signed after its claimed inference time',()=>{
 const x=syntheticSignedBundle();
 x.bundle.roles.independentBlind.payload.signedAt='2026-11-12T14:00:00.000Z';
 x.reseal('independentBlind');
 blocked(evaluate(x),'owner policy signature must precede blind scoring');
});
test('P885 physical #78 23-case matrix must have no not-run, blocked or failed rows',()=>{
 for(const [key,value] of [
  ['casesPassed',22],['casesFailed',1],['casesBlocked',1],
  ['casesNotRun',1],['casesRequired',22],['protocolVersion','other-protocol']]){
  const x=syntheticSignedBundle();
  x.bundle.roles.physicalDevices.payload.devices[1][key]=value;
  x.reseal('physicalDevices');
  blocked(evaluate(x),'physical-device 23-case acceptance incomplete');
 }
});
test('P885 all real reported physical attempts must match and be verified; no discarded bad runs',()=>{
 let x=syntheticSignedBundle();
 x.bundle.roles.physicalDevices.payload.realDeviceRuns=3;
 x.reseal('physicalDevices');
 blocked(evaluate(x),'physical device execution count must match all reported attempts');
 x=syntheticSignedBundle();
 x.bundle.roles.physicalDevices.payload.devices.push({platform:'iPhone',browser:'Safari',
  physical:false,testEvidenceSha256:hex('b')});
 x.bundle.roles.physicalDevices.payload.realDeviceRuns=3;
 x.reseal('physicalDevices');
 blocked(evaluate(x),'invalid, failed or unverified physical-device evidence receipt');
});
test('P885 browser mismatch and unknown physical platform cannot meet expected platform pair',()=>{
 let x=syntheticSignedBundle();
 x.bundle.roles.physicalDevices.payload.devices[1].browser='Chrome';
 x.reseal('physicalDevices');
 blocked(evaluate(x),'unsupported physical-device browser');
 x=syntheticSignedBundle();
 x.bundle.roles.physicalDevices.payload.devices[0].platform='tablet-unknown';
 x.reseal('physicalDevices');
 blocked(evaluate(x),'unsupported physical-device platform');
});
test('P885 fully signed synthetic only reaches review eligibility, not release authorization',()=>{
 const x=syntheticSignedBundle(),result=evaluate(x);
 assert.equal(result.status,'EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE');
 assert.equal(result.issues.length,0);
 assert.equal(result.noDeploy,true);
 assert.equal(result.shouldLiftFamilyAlphaHold,false);
});

test('P886 policy uses real 40-hex Git commit, 64-hex model and manifest SHA-256',()=>{
 const x=syntheticSignedBundle(),result=evaluate(x);
 assert.equal(result.status,'EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE');
 assert.equal(x.bundle.roles.ownerPolicy.payload.targetCommit.length,40);
 assert.equal(x.bundle.roles.ownerPolicy.payload.modelSha256.length,64);
 const y=syntheticSignedBundle();y.bundle.roles.ownerPolicy.payload.targetCommit=hex('a');
 y.reseal('ownerPolicy');
 blocked(evaluate(y),'real 40-hex Git commit');
});
test('P886 signed phone case list derives exact IDs from P78 operator recorder',()=>{
 const recorder=createRequire(import.meta.url)('../public/device-acceptance-78.js');
 assert.equal(REQUIRED_PHONE_CASES886.length,23);
 assert.deepEqual(REQUIRED_PHONE_CASES886,recorder.CASES.map(x=>x[0]));
 const x=syntheticSignedBundle(),report=evaluate(x);
 assert.equal(report.status,'EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE');
});
test('P886 all 23 individually signed cases required even if numeric summary falsely says 23 pass',()=>{
 const x=syntheticSignedBundle(),d=x.bundle.roles.physicalDevices.payload.devices[0];
 d.cases.pop();x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_INCOMPLETE_CASE_LEDGER');
});
test('P886 duplicate or unknown original P78 case names cannot replace difficult tasks',()=>{
 let x=syntheticSignedBundle(),d=x.bundle.roles.physicalDevices.payload.devices[0];
 d.cases[8].caseId=d.cases[7].caseId;x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_DUPLICATE_OR_UNKNOWN_CASE');
 x=syntheticSignedBundle();d=x.bundle.roles.physicalDevices.payload.devices[0];
 d.cases[1].caseId='easier_mock_photo';x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_DUPLICATE_OR_UNKNOWN_CASE');
});
test('P886 individual PASS claim requires distinct protected witness proof per case and per platform',()=>{
 let x=syntheticSignedBundle(),d=x.bundle.roles.physicalDevices.payload.devices[0];
 d.cases[9].evidenceSha256=d.cases[8].evidenceSha256;x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_MISSING_OR_REUSED_CASE_PROOF');
 x=syntheticSignedBundle();const ds=x.bundle.roles.physicalDevices.payload.devices;
 ds[1].cases[10].evidenceSha256=ds[0].cases[10].evidenceSha256;x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_MISSING_OR_REUSED_CASE_PROOF');
});
test('P886 negative severity and NOT_RUN/FAIL/BLOCKED case cannot be masked by 23 aggregate pass',()=>{
 for(const [key,value] of [
  ['status','NOT_RUN'],['status','FAIL'],['status','BLOCKED'],
  ['severity','P0'],['severity','P1'],['severity','P2']]){
  const x=syntheticSignedBundle(),d=x.bundle.roles.physicalDevices.payload.devices[1];
  d.cases[5][key]=value;x.reseal('physicalDevices');
  blocked(evaluate(x),'P886_UNPASSED_CASE');
 }
});
test('P886 exact running app SHA and signed witnessed case time cannot be substituted',()=>{
 let x=syntheticSignedBundle(),d=x.bundle.roles.physicalDevices.payload.devices[1];
 d.sourceCommit='f'.repeat(40);x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_WRONG_RUNNING_APP_COMMIT');
 x=syntheticSignedBundle();d=x.bundle.roles.physicalDevices.payload.devices[1];
 d.cases[2].observedAt='2026-11-11T02:00:00.000Z';x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_UNBOUND_PHYSICAL_CASE_TIME');
 x=syntheticSignedBundle();d=x.bundle.roles.physicalDevices.payload.devices[1];
 d.cases[2].observedAt='2026-11-13T04:00:00.000Z';x.reseal('physicalDevices');
 blocked(evaluate(x),'P886_UNBOUND_PHYSICAL_CASE_TIME');
});
test('P886 direct ledger validation never claims physical execution or releases family alpha',()=>{
 const x=syntheticSignedBundle(),dev=x.bundle.roles.physicalDevices.payload.devices[0];
 const used=new Set(),proof=verifyPhoneCaseLedger886(dev,{
  targetCommit:target,approvedAt:x.bundle.roles.ownerPolicy.payload.signedAt,
  signedAt:x.bundle.roles.physicalDevices.payload.signedAt,usedProofDigests:used
 });
 assert.deepEqual(proof,{ok:true,caseCount:23});
 assert.equal(used.size,23);
 const report=evaluate(x);
 assert.equal(report.noDeploy,true);
 assert.equal(report.shouldLiftFamilyAlphaHold,false);
 // The generated signing keys and fabricated receipts above exist ONLY here.
});
