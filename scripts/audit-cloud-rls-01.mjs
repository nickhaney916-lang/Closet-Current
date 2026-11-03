#!/usr/bin/env node
/**
 * CLOUD-RLS-01 — independently reproducible offline acceptance from attested
 * read-only Supabase catalog metadata. This is NOT a live-token A/B test.
 * Does not authenticate, contact a host, read rows/photos, or mutate a DB.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {auditCloudRLS01} from '../research/cloud-rls-01/read-only-policy-gate.mjs';
const path='research/cloud-rls-01/attested-catalog-2026-11-03.json';
const bytes=await readFile(path),sourceSha=createHash('sha256').update(bytes).digest('hex');
const data=JSON.parse(bytes.toString('utf8'));
const result=auditCloudRLS01(data);
assert.equal(result.status,'PASS_READ_ONLY_METADATA_ONLY');
assert.equal(result.failures.length,0);
assert.equal(result.passedControls,result.checkedControls);
assert.equal(result.warnings.length,2);
assert.equal(result.customerRowsRead,false);
assert.equal(result.signedInTwoAccountProof,false);
assert.equal(result.liveDataAPIJWTProof,false);
assert.equal(result.liveStorageJWTProof,false);
assert.equal(result.clientReleaseAuthorized,false);
assert.equal(result.familyAlpha,'HOLD');
const output='benchmark/cloud-rls-01';await mkdir(output,{recursive:true});
const report={
 sourceSha256:sourceSha,
 observedDate:result.observedDate,
 source:'read-only Supabase catalog observations from connected production and staging projects',
 checkScope:'static catalog/privilege/RPC/storage metadata only, replayed offline',
 result,
 productionOwnerTableRLSObserved:true,
 stagingOwnerTableRLSObserved:true,
 separateStagingWriterVerifiedAsRoleMetadata:true,
 bothBucketsPrivateJpegOnly:true,
 productionEndpointRequiresSignedInOwner:true,
 stagingPrivateDefinerRequiresJWTSub:true,
 liveBackendCrossAccountRequestsActuallyPerformed:false,
 realSignedInUserDataViewed:false,
 realPhotoObjectsViewed:false,
 productionSchemaMutated:false,
 stagingSchemaMutated:false,
 releaseAuthorized:false
};
await writeFile(output+'/acceptance.json',JSON.stringify(report,null,2)+'\n');
console.log('CLOUD01_READONLY_METADATA',JSON.stringify({
 status:result.status,passedControls:result.passedControls,
 warningCount:result.warnings.length,liveSignedInABTest:false,
 releases:'HOLD'
}));
