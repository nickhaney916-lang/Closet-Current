import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {evaluatePhoneEvidence,checkPhoneEvidenceFile,STEPS,COMBINED_CANDIDATE}
 from '../../scripts/check-family-alpha-50-physical-phone-hold.mjs';
const file='docs/family-alpha-50/physical-device-acceptance-template.json';
const template=async()=>JSON.parse(await readFile(file,'utf8'));
const modify=(o,fn)=>{const copy=structuredClone(o);fn(copy);return evaluatePhoneEvidence(copy)};
const fullyObserved=(o)=>{
 const d=structuredClone(o);
 d.source='HUMAN_RECORDED_SELF_REPORT';
 d.physicalAndroidIphoneAuthorized=true;
 d.stageHostProtected='PASS';d.realTwoOwnerJwtIsolation='PASS';
 for(const [index,device] of d.devices.entries()){
  device.browser=index?'Safari':'Chrome';
  device.physicalHardwareObserved=true;
  for(const step of STEPS)device.steps[step]='PASS';
 }
 return d;
};
test('unstarted committed template remains fully untested on TWO real platforms',async()=>{
 const s=await template(),r=await checkPhoneEvidenceFile();
 assert.equal(s.candidateCommit,COMBINED_CANDIDATE);
 assert.equal(r.evidenceConsistent,true,JSON.stringify(r.issues));
 assert.equal(r.decision,'HOLD');
 assert.equal(r.checklistStatus,'NOT_STARTED');
 assert.equal(r.totalRequiredSteps,28);
 assert.equal(r.untestedSteps,28);
 assert.equal(r.physicallyObservedDevices,0);
 assert.equal(r.actualHardwareVerifiableByScript,false);
 assert.equal(r.deploymentAuthorized,false);
});
test('even manually filled 28/28 with full host and JWT claimed success NEVER authorizes release',async()=>{
 const s=fullyObserved(await template()),r=evaluatePhoneEvidence(s);
 assert.equal(r.evidenceConsistent,true,JSON.stringify(r.issues));
 assert.equal(r.checkedSteps,28);
 assert.equal(r.checklistStatus,'READY_FOR_MANUAL_OWNER_REVIEW_NOT_RELEASE');
 assert.equal(r.decision,'HOLD');
 assert.equal(r.ownerExplicitGoApproval,false);
 assert.equal(r.humanVisualApprovalGrantedByScript,false);
 assert.equal(r.realJwtVerifiableByScript,false);
 assert.equal(r.cloudBackupVerifiedByScript,false);
 assert.equal(r.deploymentAuthorized,false);
});
test('missing platform/step, extra picture/email/token fields, or private data flags fail closed',async()=>{
 const s=await template();
 for(const f of [
  x=>x.devices.pop(),
  x=>x.devices[0].platform='iPhone',
  x=>delete x.devices[0].steps.hardware_camera,
  x=>x.devices[1].steps.private_photo='PASS',
  x=>x.devices[0].deviceId='private-identifier',
  x=>x.email='private@example.com',
  x=>x.privacy.tokensIncluded=true,
  x=>x.privacy.photoBytesIncluded=true,
  x=>x.privacy.originalFileNamesIncluded=true,
  x=>x.candidateCommit='main',
  x=>x.source='signed-hardware-proof',
  x=>x.release='READY',
  x=>x.deploymentAuthorized=true,
  x=>x.productionModified=true,
  x=>x.stagingModified=true,
 ]){
  const r=modify(s,f);
  assert.equal(r.evidenceConsistent,false,JSON.stringify(r));
  assert.equal(r.decision,'HOLD');
 }
});
test('cannot claim passed physical tests from a synthetic browser run',async()=>{
 const s=await template();
 for(const f of [
  x=>x.devices[0].steps.hardware_camera='PASS',
  x=>x.devices[1].steps.manual_photo_quality='FAIL',
  x=>x.devices[0].physicalHardwareObserved=true,
  x=>{x.source='HUMAN_RECORDED_SELF_REPORT';x.devices[0].physicalHardwareObserved=true;},
  x=>{x.source='HUMAN_RECORDED_SELF_REPORT';x.physicalAndroidIphoneAuthorized=true;x.devices[0].physicalHardwareObserved=true;},
 ]){
  const r=modify(s,f);
  assert.equal(r.evidenceConsistent,false,JSON.stringify(r));
  assert.equal(r.deploymentAuthorized,false);
 }
});
test('a real phone record missing privacy/host/JWT preconditions cannot mark connected tests PASS',async()=>{
 const complete=fullyObserved(await template());
 for(const f of [
  x=>x.stageHostProtected='NOT_TESTED',
  x=>x.realTwoOwnerJwtIsolation='NOT_TESTED',
  x=>x.devices[0].physicalHardwareObserved=false,
  x=>x.devices[1].browser='NOT_TESTED',
  x=>x.devices[0].steps.cloud_backup_restore='unverified',
  x=>x.devices[1].steps.two_owner_privacy='PASS_FAKED'
 ]){
  const r=modify(complete,f);
  assert.equal(r.evidenceConsistent,false,JSON.stringify(r));
  assert.equal(r.decision,'HOLD');
 }
});
test('real-world blocked/failed statuses are retained without losing pending status or producing a pass',async()=>{
 const s=await template();
 s.devices[0].steps.cloud_backup_restore='BLOCKED';
 s.devices[1].steps.two_owner_privacy='BLOCKED';
 const r=evaluatePhoneEvidence(s);
 assert.equal(r.evidenceConsistent,true);
 assert.equal(r.blockedSteps,2);
 assert.equal(r.checklistStatus,'BLOCKED');
 const f=fullyObserved(await template());f.devices[1].steps.original_photo_board='FAIL';
 const fail=evaluatePhoneEvidence(f);
 assert.equal(fail.evidenceConsistent,true);
 assert.equal(fail.failedSteps,1);
 assert.equal(fail.checklistStatus,'FAILED_REQUIRES_REVIEW');
 assert.equal(fail.decision,'HOLD');
});
test('CLI prints only sanitized count/status summary, no host requests or personal data',()=>{
 const x=spawnSync(process.execPath,['scripts/check-family-alpha-50-physical-phone-hold.mjs'],{encoding:'utf8',env:{PATH:process.env.PATH}});
 assert.equal(x.status,0,x.stderr);
 assert.match(x.stdout,/FAMILY_ALPHA_50_PHYSICAL_PHONE_EVIDENCE_HOLD/);
 assert.match(x.stdout,/"checklistStatus":"NOT_STARTED"/);
 assert.doesNotMatch(x.stdout,/(accountId|photoBytes|token|filename|emailAddress)/i);
});
