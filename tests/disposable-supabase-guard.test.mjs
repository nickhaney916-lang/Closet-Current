import test from 'node:test';
import assert from 'node:assert/strict';
import {localConfig,localRequestURL} from '../scripts/disposable-supabase-guard.mjs';
const fixture=()=>({API_URL:'http://127.0.0.1:54321',DB_URL:'postgresql://postgres:postgres@127.0.0.1:54322/postgres',ANON_KEY:'invented-local-fixture-key-only'});
test('local integration refuses missing explicit disposable acknowledgement',()=>{
 assert.throws(()=>localConfig(fixture(),undefined));
 assert.equal(localConfig(fixture(),'LOCAL_DISPOSABLE_ONLY').origin,'http://127.0.0.1:54321');
});
test('local integration refuses hosted, lookalike, credentialed and alternate API origins',()=>{
 for(const API_URL of ['https://example.supabase.co','http://127.0.0.1.evil.invalid:54321','http://127.0.0.1:54322','https://127.0.0.1:54321','http://user@127.0.0.1:54321','http://127.0.0.1:54321/path','http://127.0.0.1:54321/?target=live'])
  assert.throws(()=>localConfig({...fixture(),API_URL},'LOCAL_DISPOSABLE_ONLY'));
});
test('local integration rejects hosted database and alternate database identity',()=>{
 for(const DB_URL of ['postgres://postgres:postgres@remote.invalid:54322/postgres','postgres://postgres:postgres@127.0.0.1:5432/postgres','postgres://postgres:postgres@127.0.0.1:54322/customer','postgres://postgres:other@127.0.0.1:54322/postgres','postgres://postgres:postgres@127.0.0.1:54322/postgres?host=remote.invalid'])
  assert.throws(()=>localConfig({...fixture(),DB_URL},'LOCAL_DISPOSABLE_ONLY'));
});
test('request construction rejects absolute, protocol-relative and backslash origin escapes',()=>{
 for(const path of ['https://remote.invalid/','//remote.invalid/','/\\remote.invalid/'])assert.throws(()=>localRequestURL('http://127.0.0.1:54321',path));
 assert.equal(localRequestURL('http://127.0.0.1:54321','/auth/v1/user').hostname,'127.0.0.1');
});
