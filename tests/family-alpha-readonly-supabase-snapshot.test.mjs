import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 assessFamilyAlphaMetadata,runStaticMetadataAudit
} from '../scripts/family-alpha-readonly-supabase-snapshot-check.mjs';
const fixture=JSON.parse(readFileSync('research/family-alpha-live-readonly/metadata-2026-10-23.json','utf8'));
const auth=readFileSync('public/auth.js','utf8');
const copy=()=>structuredClone(fixture);
test('actual sanitized live catalog snapshot is dated, metadata-only and release HOLD',async()=>{
 const findings=await runStaticMetadataAudit();
 assert.equal(findings.releaseStatus,'HOLD');
 assert.equal(findings.auditDate,'2026-10-23');
 assert.equal(findings.metadataReadOnly,true);
 assert.equal(findings.actualPrivateAccountAccessTested,false);
 assert.ok(findings.counts.BLOCKER>=3);
 assert.equal(fixture.projects.every(x=>x.verifiedLiveUserDenyAllow===false),true);
 assert.equal(/access_token|refresh_token|password_hash|user_email|photo_data|photo_name/i.test(
  JSON.stringify(fixture)),false,'No individual auth credentials or customer image data in checked-in evidence');
});
test('staging intentionally uses an owner-checked restricted writer and never grants ordinary authenticated INSERT or UPDATE',()=>{
 const x=assessFamilyAlphaMetadata(copy(),auth);
 assert.ok(x.findings.some(f=>f.id==='staging.restricted-writer-model'&&f.level==='INFO'));
 assert.ok(!x.findings.some(f=>f.id==='staging.restricted-writer-broken'));
 const staging=fixture.projects.find(x=>x.environment==='staging');
 assert.deepEqual(staging.table.authenticatedGrants,['SELECT']);
 assert.equal(staging.backupRpc.privateFunctionSecurityDefiner,true);
 assert.equal(staging.backupRpc.restrictedWriterBypassRls,false);
});
test('production table least-privilege overgrant is reported and never treated as metadata PASS',()=>{
 const x=assessFamilyAlphaMetadata(copy(),auth);
 assert.ok(x.findings.some(f=>f.id==='production.overbroad-table-grants'&&f.level==='REVIEW'));
 assert.ok(x.findings.some(f=>f.id==='production.backup-delete-privilege'&&f.level==='REVIEW'));
});
test('app still points to live production Supabase and GitHub Pages rather than segregated staging Auth',()=>{
 const report=assessFamilyAlphaMetadata(copy(),auth);
 assert.ok(report.findings.some(f=>f.id==='staging.app-backend-not-separated'&&f.level==='BLOCKER'));
});
test('both live projects have private photo buckets and owner-scoped metadata policies',()=>{
 const x=copy();
 for(const p of x.projects){
  assert.equal(p.bucket.public,false);
  assert.equal(p.bucket.ownerPathPredicateOnAll,true);
  assert.equal(p.table.rlsEnabled,true);
  assert.equal(p.table.anonSelect,false);
  assert.equal(p.backupRpc.anonExecute,false);
 }
});
test('removing staging private writer owner proof causes BLOCKER',()=>{
 const x=copy();x.projects.find(p=>p.environment==='staging').backupRpc.functionValidatesRequestJwtOwner=false;
 const result=assessFamilyAlphaMetadata(x,auth);
 assert.ok(result.findings.some(f=>f.id==='staging.restricted-writer-broken'&&f.level==='BLOCKER'));
 assert.ok(!result.findings.some(f=>f.id==='staging.restricted-writer-model'));
});
test('public photo bucket or missing strict photo path produces BLOCKER even if legacy owner policy exists',()=>{
 const x=copy();x.projects.find(p=>p.environment==='production').bucket.public=true;
 const r=assessFamilyAlphaMetadata(x,auth);
 assert.ok(r.findings.some(f=>f.id==='production.private-images'&&f.level==='BLOCKER'));
});
test('unprotected backup policy is BLOCKER, not a pass from existence alone',()=>{
 const x=copy();x.projects[0].table.policies[0].ownerWithCheck=false;
 const r=assessFamilyAlphaMetadata(x,auth);
 assert.ok(r.findings.some(f=>f.id==='production.backup.owner-policy'&&f.level==='BLOCKER'));
});
test('cannot replace read-only snapshot with a false claim of four authorized family tests',()=>{
 const x=copy();x.projects[0].verifiedLiveUserDenyAllow=true;
 assert.throws(()=>assessFamilyAlphaMetadata(x,auth),/not live account allow\/deny evidence/);
});
test('missing release HOLD guard or non-historical snapshot fails closed',()=>{
 const x=copy();x.releaseStatus='APPROVED';
 assert.throws(()=>assessFamilyAlphaMetadata(x,auth),/Invalid or overclaimed/);
 x.releaseStatus='HOLD';x.captureIsHistorical=false;
 assert.throws(()=>assessFamilyAlphaMetadata(x,auth),/Invalid or overclaimed/);
});
test('password security advisors remain visible in both projects',()=>{
 const r=assessFamilyAlphaMetadata(copy(),auth);
 assert.equal(r.findings.filter(x=>x.id.endsWith('.password-protection')&&x.level==='HARDEN').length,2);
});
