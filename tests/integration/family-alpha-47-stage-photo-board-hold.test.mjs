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

