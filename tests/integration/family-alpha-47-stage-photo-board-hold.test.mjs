import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assessMetadataEvidence,auditCurrentPhotoBoardStage,STAGING,PIN}
 from '../../scripts/check-family-alpha-47-stage-photo-board-hold.mjs';
const snapshot=async()=>JSON.parse(await readFile('docs/family-alpha-47/live-staging-metadata-20261027.json','utf8'));
const copy=x=>structuredClone(x);
test('actual staging metadata records one user, one owned backup, one private original photo and zero live privacy proofs',async()=>{
 const s=await snapshot(),a=assessMetadataEvidence(s);
 assert.equal(s.stagingProjectId,STAGING);
 assert.equal(s.registeredUsers,1);
 assert.equal(s.distinctUnexpiredSessionUsers,1);
 assert.equal(s.backup.rows,1);
 assert.equal(s.backup.distinctOwnerCount,1);
 assert.equal(s.photos.storageObjects,1);
 assert.equal(s.photos.private,true);
 assert.equal(s.photos.mimeTypes[0],'image/jpeg');
 assert.equal(s.advisors.leakedPasswordProtection,'WARN_DISABLED');
 assert.equal(s.photoBoardCandidate.sourceHead,PIN);
 assert.equal(a.evidenceConsistent,true,JSON.stringify(a.issues));
 assert.equal(a.decision,'HOLD');
 assert.equal(a.deploymentAuthorized,false);
});
test('counts/policies/bucket/privacy warning forged or changed require another audit, not a release',async()=>{
 const base=await snapshot();
 for(const mutation of [
  o=>o.registeredUsers=4,
  o=>o.distinctUnexpiredSessionUsers=4,
  o=>o.backup.distinctOwnerCount=4,
  o=>o.photos.storageObjects=0,
  o=>o.backup.rlsEnabled=false,
  o=>o.backup.authenticatedInsertGrant=true,
  o=>o.backup.ownerWithCheckClause=false,
  o=>o.photos.private=false,
  o=>o.photos.authenticatedOwnerFolderScope=false,
  o=>o.photos.mimeTypes=['image/png'],
  o=>o.photos.authenticatedPolicies=[],
  o=>o.advisors.leakedPasswordProtection='ENABLED',
  o=>o.stagingProjectId='not-stage',
  o=>o.photoBoardCandidate.sourceHead='main',
  o=>o.photoBoardCandidate.humanVisualApproval='PASS',
  o=>o.photoBoardCandidate.realAccountRlsProof='PASS',
  o=>o.release='READY',
  o=>o.deploymentAuthorized=true,
  o=>o.stagingModified=true
 ]){
  const tampered=copy(base);mutation(tampered);
  const a=assessMetadataEvidence(tampered);
  assert.equal(a.evidenceConsistent,false);
  assert.equal(a.decision,'HOLD');
  assert.equal(a.deploymentAuthorized,false);
 }
});
test('software checks cannot stand in for JWT privacy, physical phone, or Cloudflare verification',async()=>{
 const s=await snapshot();
 for(const key of Object.keys(s.verification)){
  const tampered=copy(s);tampered.verification[key]='PASS';
  const result=assessMetadataEvidence(tampered);
  assert.equal(result.evidenceConsistent,false,key);
  assert.ok(result.issues.some(x=>x.includes(key)),key);
  assert.equal(result.decision,'HOLD');
 }
});
test('read-only stage evidence expires; no stale ready decision',async()=>{
 const s=await snapshot();
 assert.equal(assessMetadataEvidence(s,{today:'2026-10-27'}).evidenceConsistent,true);
 assert.equal(assessMetadataEvidence(s,{today:'2026-11-01'}).evidenceConsistent,false);
 const future=copy(s);future.capturedOn='2027-01-01';
 assert.equal(assessMetadataEvidence(future,{today:'2026-10-27'}).evidenceConsistent,false);
});
test('full source-pinned signed-in board and independent release gate jointly remain HOLD',async()=>{
 const full=await auditCurrentPhotoBoardStage();
 assert.equal(full.decision,'HOLD');
 assert.equal(full.work43PrivateOriginalPhotoSource,'SOURCE_PINNED_OFFLINE');
 assert.equal(full.stagingReadOnlyEvidence.evidenceConsistent,true);
 assert.equal(full.unchangedFamilyVisualStageGate,'HOLD');
 assert.equal(full.humanVisualApproval,'NOT GIVEN');
 assert.equal(full.fourUniqueLiveJwtSessions,'NOT TESTED');
 assert.equal(full.deploymentsAuthorized,false);
});



test('actual read-only staging role simulations deny both distinct synthetic nonowners, without authenticating or reading user content',async()=>{
 const s=await snapshot(),p=s.syntheticNonownerReadProbes;
 assert.equal(p.method,'LIVE_STAGING_SQL_READ_ONLY_TRANSACTION_ROLE_SIMULATION');
 assert.equal(p.roleEmulationNotJwt,true);
 assert.equal(p.realJwtSessionCountUsed,0);
 assert.equal(p.newAccountsCreated,0);
 assert.equal(p.transactionsRolledBack,true);
 assert.equal(p.rowContentsAccessed,false);
 assert.equal(p.photoBytesAccessed,false);
 assert.equal(p.independentFixtures.length,2);
 for(const account of p.independentFixtures){
  assert.equal(account.roleVerified,true);
  assert.equal(account.claimVerified,true);
  assert.equal(account.visibleBackupRows,0);
  assert.equal(account.visiblePhotoObjects,0);
 }
 assert.equal(p.provesRealCrossAccountIsolation,false);
 assert.equal(assessMetadataEvidence(s).evidenceConsistent,true);
 assert.equal(assessMetadataEvidence(s).decision,'HOLD');
});
test('forged RLS pass or attempted promotion of synthetic claim to real four-user JWT invalidates evidence and stays HOLD',async()=>{
 const s=await snapshot();
 const mutations=[
  o=>o.syntheticNonownerReadProbes.independentFixtures[0].visibleBackupRows=1,
  o=>o.syntheticNonownerReadProbes.independentFixtures[1].visiblePhotoObjects=1,
  o=>o.syntheticNonownerReadProbes.independentFixtures[0].roleVerified=false,
  o=>o.syntheticNonownerReadProbes.independentFixtures[1].claimVerified=false,
  o=>o.syntheticNonownerReadProbes.transactionsRolledBack=false,
  o=>o.syntheticNonownerReadProbes.roleEmulationNotJwt=false,
  o=>o.syntheticNonownerReadProbes.realJwtSessionCountUsed=4,
  o=>o.syntheticNonownerReadProbes.newAccountsCreated=2,
  o=>o.syntheticNonownerReadProbes.rowContentsAccessed=true,
  o=>o.syntheticNonownerReadProbes.photoBytesAccessed=true,
  o=>o.syntheticNonownerReadProbes.provesRealCrossAccountIsolation=true,
  o=>o.syntheticNonownerReadProbes.independentFixtures=[o.syntheticNonownerReadProbes.independentFixtures[0]],
  o=>o.syntheticNonownerReadProbes.independentFixtures[1].identity='real-user',
  o=>o.syntheticNonownerReadProbes.result='REAL_OWNERSHIP_PASS',
  o=>o.syntheticNonownerReadProbes.exactSqlPattern='SELECT COUNT(*)'
 ];
 for(const mutate of mutations){
  const candidate=copy(s);mutate(candidate);
  const result=assessMetadataEvidence(candidate);
  assert.equal(result.decision,'HOLD');
  assert.equal(result.evidenceConsistent,false,JSON.stringify(candidate.syntheticNonownerReadProbes));
  assert.equal(result.deploymentAuthorized,false);
 }
});


test('actual live staging backup RPC metadata detects invoker/grant mismatch and refuses to certify cloud writes',async()=>{
 const snapshot=await (await import('node:fs/promises')).readFile('docs/family-alpha-47/live-staging-metadata-20261027.json','utf8').then(JSON.parse);
 const w=snapshot.backupRpcRuntime;
 assert.equal(w.function,'public.save_closet_backup(bigint,jsonb)');
 assert.equal(w.authenticatedCanExecute,true);
 assert.equal(w.functionSecurityDefiner,false);
 assert.equal(w.authenticatedCanInsert,false);
 assert.equal(w.authenticatedCanUpdate,false);
 assert.equal(w.authenticatedInheritsWriterPrivileges,false);
 assert.equal(w.authenticatedHasWriterMembership,false);
 assert.equal(w.liveRpcWriteAttempted,false);
 assert.equal(w.actualHttpOutcome,'NOT TESTED');
 const gate=assessMetadataEvidence(snapshot);
 assert.equal(gate.evidenceConsistent,true);
 assert.equal(gate.stageCloudBackupWriteStatus,'BLOCKED_PROBABLE_INVOKER_PRIVILEGE_MISMATCH');
 assert.equal(gate.actualBackupSaveHttpVerified,false);
 assert.equal(gate.decision,'HOLD');
});
test('neither a forged successful cloud write nor ad-hoc grant change silently clears the release blocker',async()=>{
 const snapshot=await (await import('node:fs/promises')).readFile('docs/family-alpha-47/live-staging-metadata-20261027.json','utf8').then(JSON.parse);
 for(const change of [
  w=>w.authenticatedCanInsert=true,
  w=>w.authenticatedCanUpdate=true,
  w=>w.functionSecurityDefiner=true,
  w=>w.authenticatedInheritsWriterPrivileges=true,
  w=>w.authenticatedHasWriterMembership=true,
  w=>w.likelyNormalAuthenticatedCloudBackupWritable=true,
  w=>w.liveRpcWriteAttempted=true,
  w=>w.actualHttpOutcome='PASS',
  w=>w.status='READY',
 ]){
  const modified=structuredClone(snapshot);change(modified.backupRpcRuntime);
  const outcome=assessMetadataEvidence(modified);
  assert.equal(outcome.decision,'HOLD');
  assert.equal(outcome.evidenceConsistent,false);
  assert.equal(outcome.deploymentAuthorized,false);
 }
});
