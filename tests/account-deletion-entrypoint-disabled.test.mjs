import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('deletion HTTP entrypoint is disabled and cannot load service credentials',async()=>{
 const source=await readFile('supabase/functions/account-delete/index.ts','utf8');
 const executable=source.split('\n').filter(line=>!line.trimStart().startsWith('//')).join('\n');
 assert.match(source,/status:503/);
 assert.match(source,/deletionCompleted:false/);
 assert.doesNotMatch(executable,/SUPABASE_SERVICE_ROLE_KEY|Deno\.env\.get|createClient|import\(/);
 assert.doesNotMatch(source,/deleteAccount\(|deleteUser\(|removePhotos\(/);
});
test('all deletion SDK adapters remain in server-only paths and uncalled until approved',async()=>{
 const source=await readFile('supabase/functions/account-delete/supabase-adapters.mjs','utf8');
 const publicJs=await Promise.all(['public/index.html','public/auth.js','public/cloud-backup.js']
  .map(p=>readFile(p,'utf8')));
 assert.match(source,/createSupabaseDeletionAdapters/);
 assert.match(source,/begin_closet_account_deletion/);
 assert.match(source,/verifySession\(bearer\)/);
 for(const js of publicJs){
  assert.doesNotMatch(js,/supabase-adapters\.mjs|account-delete\/index\.ts/);
  assert.doesNotMatch(js,/begin_closet_account_deletion|DELETE MY ACCOUNT/);
 }
});
