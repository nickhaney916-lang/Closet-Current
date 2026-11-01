import test from 'node:test';
import assert from 'node:assert/strict';
import {PHONE_QA_CASES,assessPhysicalPhoneEvidence,phoneReleaseGate} from '../research/three-d-66/phone-hardware-acceptance.mjs';
import {assertPrivateResearchOrigin} from '../research/three-d-66/private-qa-origin.mjs';
const hash='c'.repeat(64);
const full=(platform='Android')=>({
 platform,makeModel:platform==='Android'?'Samsung Galaxy S25':'iPhone 16',
 osVersion:platform==='Android'?'Android 17':'iOS 19',
 browser:platform==='Android'?'Chrome':'Safari',
 runEnvironment:'physical-device',physicalDeviceObserved:true,
 localTestOriginVerified:true,originalSourceScreenshotSHA256:hash,
 actualDeviceRecordingSHA256:'d'.repeat(64),
 gitCommitSHA:'f'.repeat(40),independentHumanReviewerSigned:true,
 reviewerNameOrHandle:'independent-tester',
 cases:PHONE_QA_CASES.map(id=>({id,status:'PASS'})),
 performance:{maxMemoryMiB:250,p95RenderMs:15}
});
test('real devices require exact independent source screenshot and video evidence',()=>{
 assert.equal(PHONE_QA_CASES.length,10);
 assert.equal(assessPhysicalPhoneEvidence(null).status,'HOLD');
 for(const platform of ['Android','iPhone']){
  const data=full(platform),r=assessPhysicalPhoneEvidence(data);
  assert.equal(r.status,'EVIDENCE_READY_FOR_REVIEW');
  assert.equal(r.physicalPhoneAccepted,false);
  assert.equal(phoneReleaseGate([data]).status,'HOLD');
  const emulated={...data,runEnvironment:'chromium-mobile-viewport'};
  assert.equal(assessPhysicalPhoneEvidence(emulated).status,'HOLD');
  const disguised={...data,physicalDeviceObserved:false};
  assert.equal(assessPhysicalPhoneEvidence(disguised).status,'HOLD');
  const skipped={...data,cases:[...data.cases.slice(0,9),{id:data.cases.at(-1).id,status:'REVIEW'}]};
  assert.equal(assessPhysicalPhoneEvidence(skipped).status,'HOLD');
  const noEvidence={...data,actualDeviceRecordingSHA256:''};
  assert.equal(assessPhysicalPhoneEvidence(noEvidence).status,'HOLD');
  const noSignature={...data,independentHumanReviewerSigned:false};
  assert.equal(assessPhysicalPhoneEvidence(noSignature).status,'HOLD');
 }
});
test('even both submitted physical phone reports are pending independent manual release gate',()=>{
 const result=phoneReleaseGate([full('Android'),full('iPhone')]);
 assert.equal(result.status,'PENDING_INDEPENDENT_HARDWARE_SIGNOFF');
 assert.equal(result.physicalPhoneAccepted,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(phoneReleaseGate([]).status,'HOLD');
 assert.equal(phoneReleaseGate([{...full('Android'),platform:'iPhone',browser:'Chrome'}]).status,'HOLD');
});
test('generated proof must never equate any simulated device to actual physical device',()=>{
 const original=full();
 for(const name of ['desktop','simulator','emulator','playwright','browserstack-simulation']){
  const result=assessPhysicalPhoneEvidence({...original,runEnvironment:name});
  assert.equal(result.status,'HOLD',name);
  assert.equal(result.physicalPhoneAccepted,false,name);
 }
});

test('only localhost or explicitly opted-in private tailnet HTTPS serves physical-phone 3D research',()=>{
 for(const href of ['http://localhost:8787/research/three-d-31/index.html',
                     'http://127.0.0.1:8787/research/three-d-37/index.html']){
  const status=assertPrivateResearchOrigin({href});
  assert.equal(status.local,true);
  assert.equal(status.privatePhoneQA,false);
  assert.equal(status.releaseAuthorized,false);
 }
 const privatePhone=assertPrivateResearchOrigin({href:'https://closet-workstation.haney-test.ts.net/research/three-d-31/index.html?phone66=after'});
 assert.equal(privatePhone.local,false);
 assert.equal(privatePhone.privatePhoneQA,true);
 assert.equal(privatePhone.releaseAuthorized,false);
 for(const url of [
  'http://closet-workstation.haney-test.ts.net/research/three-d-31/index.html?phone66=after',
  'https://closet-workstation.haney-test.ts.net/research/three-d-31/index.html',
  'https://closet-workstation.haney-test.ts.net/research/three-d-31/index.html?phone66=before',
  'https://example.com/research/three-d-31/index.html?phone66=after',
  'https://closet-workstation.haney-test.ts.net.example.com/research/three-d-31/index.html?phone66=after'
 ]) assert.throws(()=>assertPrivateResearchOrigin({href:url}),/Research 3D only/);
});
