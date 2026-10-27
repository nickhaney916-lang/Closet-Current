import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {abortSynchronousWriteFailure} from '../scripts/family-alpha-28-storage-candidate.mjs';
const source=readFileSync('public/app.js','utf8');
test('offline transaction overlay is narrow and refuses duplicate application',()=>{
 const result=abortSynchronousWriteFailure(source);
 assert.equal((result.match(/SYNC_WRITE_ABORT_28/g)||[]).length,2);
 assert.throws(()=>abortSynchronousWriteFailure(result),/source changed/);
 assert.ok(result.includes('function persistDraft(){if(!db)return;const snapshot=structuredClone(batch);'));
 assert.ok(result.includes("indexedDB.open('closet-current-user-'+window.closetAuth.user.id,2)"));
});
test('source drift fails closed rather than patching an unknown transaction',()=>{
 assert.throws(()=>abortSynchronousWriteFailure(source.replace('function writeAll(values)','function renamed(values)')),/source changed/);
 assert.throws(()=>abortSynchronousWriteFailure(source.replace("db.transaction('items','readwrite');for", "db.transaction('items','readwrite',{});for")),/source changed/);
});
