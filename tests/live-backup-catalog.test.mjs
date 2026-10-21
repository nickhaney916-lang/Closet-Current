import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {reviewLiveCatalog,EXPECTED} from '../scripts/review-live-backup-catalog.mjs';
const safe=()=>({format:'closet-current-security-catalog',version:1,...EXPECTED});
const current=()=>({...safe(),authCanInsert:true,authCanUpdate:true,authCanDelete:true,
 authCanTruncate:true,authCanTrigger:true,authCanReferences:true,
 authCanMaintain:true,photoUpdatePolicyPresent:true,
 privateWriterSafe:false,privateWriterPresent:false,
 privateRpcDefinerOwned:false,authCanCallPrivateRpc:false});
test('live pre-hardening grant fixture fails closed and flags TRUNCATE and direct writes',()=>{
 const report=reviewLiveCatalog(current());
 assert.equal(report.securityCatalogStatus,'REMEDIATION_REQUIRED');
 assert.ok(report.violations.includes('authCanTruncate'));
 assert.ok(report.violations.includes('authCanInsert'));
 assert.ok(report.violations.includes('authCanUpdate'));
 assert.ok(report.violations.includes('photoUpdatePolicyPresent'));
 assert.equal(report.hostedChangesPerformed,false);
 assert.equal(report.productionPromotion,'BLOCKED');
});
test('target draft permissions match catalog but never approve a release',()=>{
 const report=reviewLiveCatalog(safe());
 assert.equal(report.violationCount,0);
 assert.equal(report.securityCatalogStatus,'CATALOG_MATCHES_TARGET');
 assert.equal(report.independentRestAndStorageAccountTestsPerformed,false);
 assert.equal(report.productionPromotion,'BLOCKED');
});
test('missing and unexpected personal or credential fields are strictly rejected',()=>{
 assert.throws(()=>reviewLiveCatalog({...safe(),email:'private@example.invalid'}),/Unexpected/);
 assert.throws(()=>reviewLiveCatalog({...safe(),api_key:'secret'}),/Unexpected/);
 const missing=safe();delete missing.authCanTruncate;
 assert.throws(()=>reviewLiveCatalog(missing),/Unexpected/);
});
test('reject nullable and forged privilege flags or incorrect source format',()=>{
 assert.throws(()=>reviewLiveCatalog({...safe(),backupRls:null}),/boolean/);
 assert.throws(()=>reviewLiveCatalog({...safe(),authCanTruncate:'false'}),/boolean/);
 assert.throws(()=>reviewLiveCatalog({...safe(),version:2}),/Unsupported/);
 assert.throws(()=>reviewLiveCatalog({...safe(),format:'drive-duel'}),/Wrong/);
});
test('SQL source contains a single read-only catalog statement and no customer-row access',async()=>{
 const source=await readFile('supabase/audits/read-only-live-backup-grants.sql','utf8');
 const executable=source.split('\n').filter(line=>!line.trim().startsWith('--')).join('\n');
 assert.equal((executable.match(/;\s*$/g)||[]).length,1);
 assert.match(executable.trimStart(),/^select jsonb_build_object\(/i);
 assert.ok(!/\b(?:create|alter|drop|delete|insert|update|truncate|grant|revoke|copy)\s+(?:table|from|into|on|function|role|policy|schema|public|storage)/i.test(executable));
 assert.ok(!/\b(?:auth\.users|select\s+\*|storage\.objects\s+where)/i.test(executable));
 for(const key of Object.keys(EXPECTED))assert.ok(executable.includes("'"+key+"'"),key+' missing in SQL');
});
