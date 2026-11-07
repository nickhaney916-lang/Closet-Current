import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/cloud-backup.sql','utf8');
const auth=readFileSync('public/auth.js','utf8');
const backupDocs=readFileSync('docs/CLOUD-BACKUP.md','utf8');
const localFlow=readFileSync('scripts/run-cloud-backup-flow.mjs','utf8');

test('cloud backup rows are owner-bound by Supabase auth.uid RLS',()=>{
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/using\s*\(\(select auth\.uid\(\)\)\s*=\s*owner_id\)/i);
 assert.match(sql,/with check\s*\(\(select auth\.uid\(\)\)\s*=\s*owner_id\)/i);
 assert.match(sql,/revoke all on public\.closet_backups from public, anon/i);
 assert.match(sql,/grant select, insert, update on public\.closet_backups to authenticated/i);
});
test('backup RPC derives owner from JWT and rejects stale revisions',()=>{
 assert.match(sql,/security invoker/i);
 assert.match(sql,/if auth\.uid\(\) is null then raise exception 'Authentication required'/i);
 assert.match(sql,/values\(auth\.uid\(\),1,p_document\)/i);
 assert.match(sql,/where owner_id=auth\.uid\(\) and revision=p_expected_revision/i);
 assert.doesNotMatch(sql,/save_closet_backup\s*\([^)]*owner_id/i);
});
test('photo bucket is private and object access is scoped to JWT owner folder',()=>{
 assert.match(sql,/values\('closet-private','closet-private',false,/i);
 for(const operation of ['read','insert','update','delete'])
  assert.match(sql,new RegExp('create policy closet_photos_'+operation+'[\\s\\S]*?auth\\.uid\\(\\)', 'i'));
 assert.match(sql,/storage\.foldername\(name\)\)\[1\]=\(select auth\.uid\(\)\)::text/i);
 assert.match(backupDocs,/public photo URLs are denied/i);
});
test('browser cloud-flow mock is identified as a mock and cannot serve as JWT/RLS proof',()=>{
 assert.match(localFlow,/controlled here/i);
 assert.match(localFlow,/await context\.route\('\*\*\/auth\.js\*/);
 assert.match(localFlow,/closetAuth=\{user:\{id:/);
 assert.match(backupDocs,/controlled HTTP backend/i);
});
test('auth refresh prevents account swap and sign-out removes persisted session',()=>{
 assert.match(auth,/data\.user\?\.id!==expected/);
 assert.match(auth,/localStorage\.removeItem\(STORE\)/);
 assert.match(auth,/location\.reload\(\)/);
});
test('inherited docs disclose real-auth and restore test scope and prior result',()=>{
 assert.match(backupDocs,/actual Supabase Auth, REST and Storage APIs were exercised using two disposable synthetic accounts/i);
 assert.match(backupDocs,/cross-owner inserts and ownership changes/i);
 assert.match(backupDocs,/Refresh loss in an existing browser session is not independently reproduced/i);
});
