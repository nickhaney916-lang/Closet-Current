import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/audits/backup-migration-state.sql','utf8');
const names=['UNKNOWN_OR_UNSAFE','OVERBROAD_CLIENT_GRANTS',
 'LIMITED_DIRECT_WRITES','RPC_ONLY_EXPECTED_CATALOG'];
test('stage gate is strictly a single, read-only metadata SELECT',()=>{
 const body=source.split('\n').filter(line=>!line.trim().startsWith('--')).join('\n');
 assert.match(body.trimStart(),/^WITH\s+flags\s+AS\s*\(/i);
 assert.equal((body.match(/;\s*$/g)||[]).length,1);
 assert.doesNotMatch(body,/\b(?:INSERT\s+INTO|UPDATE\s+public|DELETE\s+FROM|ALTER\s+TABLE|TRUNCATE\s+TABLE|DROP\s+(?:ROLE|SCHEMA|POLICY)|CREATE\s+(?:ROLE|POLICY|SCHEMA)|GRANT\s+\w|REVOKE\s+\w)\b/i);
 assert.doesNotMatch(body,/\b(?:COPY|pg_read_file|pg_ls_dir|auth\.users|FROM\s+public\.closet_backups)\b/i);
});
test('unknown state and all trusted stages still deny hosted release',()=>{
 for(const name of names)assert.ok(source.includes("'"+name+"'"));
 assert.match(source,/FALSE AS hosted_migration_authorized/);
 assert.match(source,/FALSE AS production_release_approved/);
 assert.ok(source.includes("ELSE 'UNKNOWN_OR_UNSAFE'"));
});
test('does not bless broad table privileges or mutable images as RPC-only',()=>{
 for(const permission of ['auth_delete','auth_truncate','auth_trigger','auth_references','auth_maintain','photo_mutable','auth_insert','auth_update'])
  assert.match(source,new RegExp('NOT '+permission+'\\b'));
});
test('cannot call private writer a match without checking role and policy owner',()=>{
 for(const marker of ['private_schema','private_role','private_function','no_client_writer_member','no_client_writer_set','no_anon_private_rpc','auth_private_rpc','owner_policy','private_bucket','storage_rls'])
  assert.ok(source.includes(marker));
});
