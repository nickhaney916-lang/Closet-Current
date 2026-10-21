// Offline review of read-only pg_catalog privilege booleans; no project token,
// network, customer record, database SDK, API key or deploy operation.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export const EXPECTED=Object.freeze({
 "backupRls": true,
 "backupOwnerPolicy": true,
 "anonCanSelect": false,
 "authCanSelect": true,
 "authCanInsert": false,
 "authCanUpdate": false,
 "authCanDelete": false,
 "authCanTruncate": false,
 "authCanTrigger": false,
 "authCanReferences": false,
 "authCanMaintain": false,
 "backupRpcInvoker": true,
 "authCanCallBackupRpc": true,
 "anonCanCallBackupRpc": false,
 "photoBucketPrivate": true,
 "photoStorageRls": true,
 "photoSelectOwnerPolicy": true,
 "photoInsertOwnerPolicy": true,
 "photoUpdatePolicyPresent": false,
 "privateWriterSafe": true,
 "privateWriterPresent": true,
 "privateRpcDefinerOwned": true,
 "authCanCallPrivateRpc": true,
 "anonCanCallPrivateRpc": false,
 "authHasWriterMembership": false
});
const KEYS=Object.keys(EXPECTED).sort();
export function reviewLiveCatalog(snapshot){
 assert.ok(snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot),
  'Expected one metadata-only catalog snapshot object');
 const keys=Object.keys(snapshot).sort();
 assert.deepEqual(keys,['format','version',...KEYS].sort(),
  'Unexpected or missing catalog field; reject non-metadata input');
 assert.equal(snapshot.format,'closet-current-security-catalog','Wrong catalog format');
 assert.equal(snapshot.version,1,'Unsupported catalog format');
 for(const key of KEYS)assert.equal(typeof snapshot[key],'boolean',
  'Catalog field must be boolean: '+key);
 const failed=KEYS.filter(key=>snapshot[key]!==EXPECTED[key]);
 return Object.freeze({
  audit:'closet-current-live-catalog-review',version:1,
  checked:KEYS.length,
  violations:failed,violationCount:failed.length,
  securityCatalogStatus:failed.length?'REMEDIATION_REQUIRED':'CATALOG_MATCHES_TARGET',
  independentRestAndStorageAccountTestsPerformed:false,
  hostedChangesPerformed:false,liveDataRead:false,
  productionPromotion:'BLOCKED'
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==3)throw Error('Usage: node scripts/review-live-backup-catalog.mjs local-snapshot.json');
 const source=await readFile(process.argv[2],'utf8');
 if(source.length>12000)throw Error('Snapshot exceeds metadata-only size limit');
 const result=reviewLiveCatalog(JSON.parse(source));
 console.log('CLOSET_BACKUP_CATALOG_AUDIT '+JSON.stringify(result));
 if(result.violationCount)process.exitCode=2;
}
