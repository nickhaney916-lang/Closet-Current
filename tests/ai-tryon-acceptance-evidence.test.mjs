// All positive records here are deliberately fabricated unit fixtures, NOT
// actual hardware/provider evidence. The audit never grants release approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditTryOnAcceptance} from '../benchmark/tryon-acceptance-evidence.mjs';
const sha='a'.repeat(40),origin='https://staging.example.invalid';
const phone=platform=>({schemaVersion:1,status:'passed',testKind:'physical-device',actualDevice:true,
 branchSha:sha,stagingOrigin:origin,testedAtWithOffset:'2026-10-19T08:00:00-07:00',testerAlias:'fixture-'+platform,
 device:{platform,makeModel:'synthetic fixture',osBuild:'test',browserVersion:'test',viewport:'390x844',network:'test'},
 billingEnabled:true,liveInferenceAuthorized:true,actualProviderCalls:2,
 checks:Object.fromEntries(['cameraDeniedThenGranted','originalPhotoDigestUnchangedAfterReload',
  'originalPhotoFirstRecognition','ownedTopPinnedAndOwnedBottomSwap','disabledGenerationMakesZeroPaidCalls',
  'lateResultHiddenAfterGarmentOrFigureChange','lateResultHiddenAfterAccountChange','backgroundLockRotationAndNetworkRecovery',
  'screenReaderAndTextZoom','memoryAndResponsiveness'].map(k=>[k,true])),
 privateEvidenceReferences:['qa:fixture-only-not-real'],failures:[]});
function fixture(){
 const cases=[];
 for(let pair=0;pair<3;pair++)for(const figure of ['female','male'])for(const pose of ['front','alternate'])cases.push({
  pairId:'pair-'+pair,figure,pose,topOriginalDigest:(pair*2+1).toString(16).padStart(64,'0'),bottomOriginalDigest:(pair*2+2).toString(16).padStart(64,'0'),
  firstPassOutputDigest:'c'.repeat(64),secondPassOutputDigest:'d'.repeat(64),topPreservedAfterSecondPass:true,
  finalGarmentChecks:Object.fromEntries(['top','bottom'].map(g=>[g,Object.fromEntries(
   ['category','color','pattern','fabric','seams','shapeAndLength'].map(k=>[k,true]))])),
  operatorAlias:'fixture-operator',reviewerAlias:'fixture-reviewer',independentReviewerVerdict:'pass',
  privateEvidenceReferences:['qa:fixture-only-not-real']
 });
 return {branchSha:sha,android:phone('android'),iphone:phone('ios'),fidelity:{
  schemaVersion:1,status:'passed',testKind:'actual-provider',branchSha:sha,stagingOrigin:origin,
  testedAtWithOffset:'2026-10-19T08:00:00-07:00',liveInferenceAuthorized:true,ownerApprovalReferences:['qa:fixture-approval'],
  actualProviderCalls:24,prerequisites:{licensedModelAssetsVerified:true,durableQuotasAndIdempotencyVerified:true,
   providerSpendCapVerified:true,consentAndRetentionApproved:true},cases,privateEvidenceReferences:['qa:fixture'],failures:[]
 }};
}
test('unperformed templates and missing input remain blocked with unmeasured accuracy',()=>{
 const p=JSON.parse(readFileSync('benchmark/MULTIGARMENT-PHONE-EVIDENCE-TEMPLATE.json','utf8'));
 const f=JSON.parse(readFileSync('benchmark/MULTIGARMENT-LIVE-FIDELITY-TEMPLATE.json','utf8'));
 for(const input of [{},{branchSha:sha,android:p,iphone:p,fidelity:f}]){
  const r=auditTryOnAcceptance(input);assert.equal(r.evidenceRecordsComplete,false);
  assert.equal(r.actualHardwarePass,null);assert.equal(r.actualGarmentAccuracy,null);
  assert.equal(r.providerActivationAllowed,false);assert.equal(r.productionReleaseApproved,false);
 }
});
test('complete fabricated fixtures validate format only and never authorize release',()=>{
 const r=auditTryOnAcceptance(fixture());assert.equal(r.evidenceRecordsComplete,true);
 assert.deepEqual(r.blockers,[]);assert.equal(r.productionReleaseApproved,false);assert.equal(r.providerActivationAllowed,false);
 assert.equal(r.actualHardwarePass,null);assert.equal(r.actualGarmentAccuracy,null);
});
test('emulation, reused tester, stale build and incomplete hardware checks cannot pass',()=>{
 for(const mutate of [x=>x.android.actualDevice=false,x=>x.iphone.testKind='browser-emulation',
  x=>x.iphone.testerAlias=x.android.testerAlias,x=>x.android.branchSha='b'.repeat(40),
  x=>x.iphone.checks.screenReaderAndTextZoom=null,x=>x.iphone.actualProviderCalls=0,
  x=>x.android.privateEvidenceReferences=['data:image/jpeg;base64,private'],
  x=>x.android.stagingOrigin='https://staging.example.invalid/?token=private']){
  const x=fixture();mutate(x);assert.equal(auditTryOnAcceptance(x).hardwareRecordsComplete,false);
 }
});
test('missing coverage, copied cases, altered garment and absent approval keep fidelity incomplete',()=>{
 for(const mutate of [x=>x.fidelity.testKind='synthetic-provider',x=>x.fidelity.cases.pop(),
  x=>x.fidelity.cases[1]=structuredClone(x.fidelity.cases[0]),
  x=>x.fidelity.cases[0].topPreservedAfterSecondPass=false,
  x=>x.fidelity.cases[0].finalGarmentChecks.bottom.fabric=null,
  x=>x.fidelity.cases[0].reviewerAlias='fixture-operator',
  x=>x.fidelity.cases[0].secondPassOutputDigest='c'.repeat(64),
  x=>x.fidelity.cases[1].topOriginalDigest='a'.repeat(64),
  x=>{for(const row of x.fidelity.cases){row.topOriginalDigest='a'.repeat(64);row.bottomOriginalDigest='b'.repeat(64);}},
  x=>x.fidelity.ownerApprovalReferences=[],x=>x.fidelity.prerequisites.providerSpendCapVerified=false,
  x=>x.fidelity.actualProviderCalls=0,x=>x.fidelity.branchSha='b'.repeat(40)]){
  const x=fixture();mutate(x);assert.equal(auditTryOnAcceptance(x).fidelityRecordComplete,false);
 }
});
