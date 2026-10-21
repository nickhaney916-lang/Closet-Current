import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const script='scripts/build-restricted-staging.mjs';
const accepted={
 CLOSET_STAGING_APP_ORIGIN:'https://preview.closet-current-staging.pages.dev/',
 CLOSET_STAGING_SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',
 CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_STAGING_TEST_FIXTURE_XYZ001'
};
function invoke(overrides={}){
 const env={...process.env,...accepted,...overrides};
 return spawnSync(process.execPath,[script],{cwd:process.cwd(),
  env,encoding:'utf8',timeout:15000});
}
test('invalid origins refuse staging without copying production or publishing',()=>{
 for(const url of [
  'https://closet-current.pages.dev/',
  'https://nickhaney916-lang.github.io/Closet-Current/',
  'https://example.com/',
  'https://staging.example.com/path',
  'http://staging.example.com/',
  'https://staging.example.com/?redirect_to=https://evil.example',
  'https://closet-current-staging.pages.dev/',
  'https://production.closet-current.pages.dev/'
 ]){
  const r=invoke({CLOSET_STAGING_APP_ORIGIN:url});
  assert.notEqual(r.status,0,'Accepted unsafe stage origin '+url);
  assert.match(r.stderr,/STAGING_CONFIG_REJECTED/);
 }
});
test('production and Drive Duel Supabase project refs are rejected before staging build',()=>{
 for(const ref of ['hlkgymugtfbirlpunsra','qlwotqbqxpgkheitsboe']){
  const r=invoke({CLOSET_STAGING_SUPABASE_URL:'https://'+ref+'.supabase.co'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/Staging may never access/);
 }
});
test('reject malformed backends, wrong publishable keys and missing credentials',()=>{
 for(const patch of [
  {CLOSET_STAGING_SUPABASE_URL:'https://wrong.example.com'},
  {CLOSET_STAGING_SUPABASE_URL:'http://abcdefghijklmnopqrst.supabase.co'},
  {CLOSET_STAGING_SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co/secret'},
  {CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_secret_sensitive'},
  {CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'service_role_secret'},
  {CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO'},
  {CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY:''},
  {CLOSET_STAGING_APP_ORIGIN:''}
 ]){
  const r=invoke(patch);
  assert.notEqual(r.status,0,JSON.stringify(patch));
  assert.match(r.stderr,/STAGING_CONFIG_REJECTED/);
 }
});
test('code enables no public deployment triggers, no paid inference and stage only targets build copy',()=>{
 const scriptCode=readFileSync(script,'utf8');
 assert.match(scriptCode,/throw Error\('Paid AI is disabled for the restricted staging pilot/);
 assert.match(scriptCode,/authorizationToDeployProduction:false/);
 assert.match(scriptCode,/privateCloudflareAccessPolicyVerified:false/);
 assert.match(scriptCode,/restrictedStagingDeployed:false/);
 assert.match(scriptCode,/await cp\(BASE,OUTPUT/);
 assert.match(scriptCode,/staging-dist/);
 assert.ok(!scriptCode.includes('wrangler pages deploy'));
 assert.ok(!scriptCode.includes('cloudflare/wrangler-action'));
});
