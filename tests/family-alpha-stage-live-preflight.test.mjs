import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gates} from '../scripts/check-family-alpha-27.mjs';
import {evaluateStageMetadata,assessTogether,REQUIRED_LIVE}
 from '../scripts/check-family-alpha-stage-live-preflight.mjs';
const existing=JSON.parse(await readFile('docs/family-alpha-27/staging-metadata-audit-20261027.json','utf8'));
const release=JSON.parse(await readFile('docs/family-alpha-27/release-report.json','utf8'));
const readySnapshot=()=>({
 ...structuredClone(existing),
 registeredAuthAccountCount:4,
 familyParticipantsVerifiedByRealJwt:4,
 securityAdvisors:{leakedPasswordProtectionEnabled:true},
 liveValidations:Object.fromEntries(REQUIRED_LIVE.map(x=>[x,'PASS'])),
 ownerReleaseApproval:true,
 releaseGate:'READY_FOR_REVIEW'
});
const readyReport=()=>({environment:'staging',
 gates:gates.map(id=>({
  id,status:'PASS',method:['android','iphone'].includes(id)?'physical-device':'live-staging',
  evidence:'independently verified real test record, not simulated',
  build:'source-pinned-source-sha',testedAt:'2026-10-27'
 }))
});
test('actual read-only staging evidence stays HOLD because only one user, password warning and no real JWTs',()=>{
 const result=evaluateStageMetadata(existing);
 assert.equal(result.decision,'HOLD');assert.equal(result.reportedAccounts,1);
 assert.equal(result.personallyIdentifyingDataAccessed,false);
 assert.ok(result.issues.some(x=>x.includes('Four distinct family test accounts')));
 assert.ok(result.issues.some(x=>x.includes('leaked-password')));
 assert.ok(result.issues.some(x=>x.includes('four unique real user JWT')||x.includes('Four unique real user JWT')));
 assert.equal(assessTogether(release,existing).decision,'HOLD');
});
test('even complete synthetic 12-gate report cannot overcome actual one-user stage audit',()=>{
 assert.equal(assessTogether(readyReport(),existing).decision,'HOLD');
});
test('four account count is never itself cross-owner RLS or storage proof',()=>{
 const example=readySnapshot();
 example.familyParticipantsVerifiedByRealJwt=0;
 assert.equal(evaluateStageMetadata(example).decision,'HOLD');
 example.familyParticipantsVerifiedByRealJwt=4;
 example.liveValidations.signedInOwnerAAndOwnerBReadWriteIsolation='NOT TESTED';
 assert.equal(evaluateStageMetadata(example).decision,'HOLD');
});
test('one missed policy or public bucket blocks even with synthetic claimed full test',()=>{
 for(const change of [
  x=>x.tables.closet_backups.rlsEnabled=false,
  x=>x.tables.closet_backups.ownerScopedWithCheck=false,
  x=>x.tables.closet_backups.ownerScopedUsing=false,
  x=>x.tables.closet_backups.authenticatedUnscopedWrites=true,
  x=>x.privatePhotoStorage.publicBucketCount=1,
  x=>x.privatePhotoStorage.ownerFolderScopedSelect=false,
  x=>x.privatePhotoStorage.ownerFolderScopedInsert=false,
  x=>x.privatePhotoStorage.ownerFolderScopedDelete=false,
  x=>x.securityAdvisors.leakedPasswordProtectionEnabled=false,
  x=>x.ownerReleaseApproval=false
 ]){
  const example=readySnapshot();change(example);
  assert.equal(evaluateStageMetadata(example).decision,'HOLD');
 }
});
test('stale snapshot, mismatched project and unverified live stage always block',()=>{
 for(const change of [
  x=>x.observedOn='2026-10-01',
  x=>x.observedOn='2026-10-28',
  x=>x.stagingProjectRef='hlkgymugtfbirlpunsra',
  x=>x.projectStatus='INACTIVE',
  x=>x.liveValidations.physicalIphone='NOT TESTED'
 ]){
  const example=readySnapshot();change(example);
  assert.equal(evaluateStageMetadata(example).decision,'HOLD');
 }
 assert.equal(evaluateStageMetadata(readySnapshot(),{today:'2026-11-04'}).decision,'HOLD');
});
test('all operator-attested distinct real checks and all 12 original gates only allow REVIEW — never deploy',()=>{
 const result=assessTogether(readyReport(),readySnapshot());
 assert.equal(result.decision,'READY FOR MAIN-THREAD REVIEW');
 assert.equal(result.deploymentAuthorized,false);
 assert.equal(result.productionModified,false);
});
