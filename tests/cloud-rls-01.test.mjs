import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditCloudRLS01,CLOUD_RLS_01} from '../research/cloud-rls-01/read-only-policy-gate.mjs';

const actual=JSON.parse(readFileSync('research/cloud-rls-01/attested-catalog-2026-11-03.json','utf8'));
const modified=fn=>{const x=structuredClone(actual);fn(x);return auditCloudRLS01(x);};
const fails=(a,id)=>assert.ok(a.failures.some(x=>x.id===id),id+' must refuse change');
test('CLOUD01 independent real-read catalog has owner-bound RLS and private photo bucket in BOTH projects',()=>{
 const r=auditCloudRLS01(actual);
 assert.equal(r.status,'PASS_READ_ONLY_METADATA_ONLY');
 assert.equal(r.checkedEnvironments.length,2);
 assert.equal(r.checkedControls,r.passedControls);
 assert.equal(r.failures.length,0);
 assert.equal(r.warnings.filter(x=>x.code==='LEAKED_PASSWORD_PROTECTION_DISABLED').length,2);
 assert.equal(r.customerRowsRead,false);
 assert.equal(r.signedInTwoAccountProof,false);
 assert.equal(r.liveStorageJWTProof,false);
 assert.equal(r.clientReleaseAuthorized,false);
 assert.equal(r.familyAlpha,'HOLD');
 assert.equal(CLOUD_RLS_01.databaseMutations,false);
});
test('CLOUD01 RLS disabled or overly broad table owner policy FAILS CLOSED',()=>{
 fails(modified(x=>x.production.table.rlsEnabled=false),'exposed-public-table-rls-on');
 fails(modified(x=>x.production.ownerPolicy.using='true'),'owner-policy-authenticated-only');
 fails(modified(x=>x.production.ownerPolicy.withCheck='true'),'owner-policy-authenticated-only');
 fails(modified(x=>x.staging.ownerPolicy.role='anon'),'owner-policy-authenticated-only');
});
test('CLOUD01 anonymous grants or public bucket FAIL CLOSED without customer photo reads',()=>{
 fails(modified(x=>x.production.privileges.anonSelect=true),'unauthenticated-table-denied');
 fails(modified(x=>x.staging.privileges.anonInsert=true),'unauthenticated-table-denied');
 fails(modified(x=>x.production.bucket.public=true),'private-licensed-jpeg-bucket');
 fails(modified(x=>x.production.bucket.mimeTypes=['image/png']),'private-licensed-jpeg-bucket');
});
test('CLOUD01 object photo policy requires signed-in owner folder and both UPDATE predicates',()=>{
 fails(modified(x=>x.production.storagePolicies.find(p=>p.cmd==='UPDATE').withCheckOwner=false),'photo-policy-UPDATE');
 fails(modified(x=>x.production.storagePolicies.find(p=>p.cmd==='SELECT').ownerPath='true'),'photo-policy-SELECT');
 fails(modified(x=>x.production.storagePolicies.find(p=>p.cmd==='INSERT').bucket='another-bucket'),'photo-policy-INSERT');
 fails(modified(x=>x.staging.storagePolicies=[]),'photo-policy-SELECT');
});
test('CLOUD01 RPC and revision preconditions cannot be removed or redefined as public definer',()=>{
 fails(modified(x=>x.production.rpc.publicWrapperSecurityDefiner=true),'rpc-public-wrapper-not-definer');
 fails(modified(x=>x.staging.rpc.anonExecute=true),'rpc-public-wrapper-not-definer');
 fails(modified(x=>x.production.rpc.ownerFromJWT=false),'rpc-cas-owner-and-revision');
 fails(modified(x=>x.production.rpc.revisionCompareAndSwap=false),'rpc-cas-owner-and-revision');
 fails(modified(x=>x.staging.rpc.privateFunctionOwnerWriteBound=false),'private-definer-claims-owner-bound');
});
test('CLOUD01 staging authenticated remains read-only, writer unexposed and non-bypass',()=>{
 fails(modified(x=>x.staging.privileges.authenticatedInsert=true),'ordinary-auth-users-read-only');
 fails(modified(x=>x.staging.writer.anonMember=true),'isolated-no-bypass-writer-role');
 fails(modified(x=>x.staging.writer.authenticatedMember=true),'isolated-no-bypass-writer-role');
 fails(modified(x=>x.staging.writer.bypassRLS=true),'isolated-no-bypass-writer-role');
});
test('CLOUD01 source app uses owner-bound hash paths and signed-in token, not a service key',()=>{
 const cloud=readFileSync('public/cloud-backup.js','utf8'),
       auth=readFileSync('public/auth.js','utf8');
 assert.ok(cloud.includes("function photoPath(value)"));
 assert.ok(cloud.includes("closet-photo:"));
 assert.ok(cloud.includes("new RegExp('^'+user+'/"));
 assert.ok(cloud.includes("window.closetAuth.getAccessToken"));
 assert.ok(cloud.includes("window.closetAuth?.user?.id!==user"));
 assert.ok(cloud.includes("/rest/v1/rpc/save_closet_backup"));
 assert.ok(cloud.includes("p_expected_revision"));
 assert.ok(cloud.includes("p_document"));
 assert.ok(auth.includes("sb_publishable_"));
 assert.ok(!/service_role|sb_secret_/.test(auth+cloud));
});
test('CLOUD01 refuses unobserved or incomplete attestation and never treats policy metadata as live 2-account test',()=>{
 assert.throws(()=>auditCloudRLS01(null),/snapshot/);
 const a=structuredClone(actual);delete a.staging.ownerPolicy;
 assert.throws(()=>auditCloudRLS01(a),/metadata/);
 const b=structuredClone(actual);b.source='unverified-fixtures';
 assert.throws(()=>auditCloudRLS01(b),/snapshot/);
 const r=auditCloudRLS01(actual);
 assert.equal(r.signedInTwoAccountProof,false);
 assert.equal(r.liveDataAPIJWTProof,false);
 assert.equal(r.liveStorageJWTProof,false);
 assert.equal(r.clientReleaseAuthorized,false);
});
