import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {
 assertHostedP148Guard,hostedP148Readiness,PROTECTED_REFS_148,
 P148_WRITE_APPROVAL_PHRASE,P148_REQUIRED_DISPOSABLE_NAME
} from '../research/isolated-hosted-supabase-acceptance-148/hosted-project-guard.mjs';

const ID='abcdefghijklmnopqrst'; // exactly 20, not a live project
const pass='p148-fixture-long-password-1234';
const good=(overrides={})=>({
 P148_ISOLATED_PROJECT_REF:ID,
 P148_APPROVED_PROJECT_REF:ID,
 P148_CONFIRMED_PROJECT_LABEL:P148_REQUIRED_DISPOSABLE_NAME,
 P148_SUPABASE_URL:'https://'+ID+'.supabase.co',
 P148_PUBLISHABLE_KEY:'sb_publishable_for_test_only_no_network',
 P148_TEST_A_EMAIL:'alpha+p148@example.invalid',
 P148_TEST_B_EMAIL:'bravo+p148@example.invalid',
 P148_TEST_A_PASSWORD:pass+'A',
 P148_TEST_B_PASSWORD:pass+'B',
 P148_RUN_HOSTED:'readonly',
 ...overrides
});

test('P148 default denial always returns safe and credential-free summary',()=>{
 const status=hostedP148Readiness({});
 assert.equal(status.configured,false);
 assert.equal(status.hostedSupabaseVerified,false);
 assert.equal(status.productionOrStagingTouched,false);
 assert.ok(!JSON.stringify(status).includes('password'));
 assert.ok(!JSON.stringify(status).includes('access_token'));
});

test('P148 known production, staging and unrelated Drive Duel project refs are unconditionally refused',()=>{
 assert.equal(PROTECTED_REFS_148.length,3);
 for(const projectRef of PROTECTED_REFS_148)
  for(const mode of ['readonly','full']){
   const env=good({
    P148_ISOLATED_PROJECT_REF:projectRef,
    P148_APPROVED_PROJECT_REF:projectRef,
    P148_SUPABASE_URL:'https://'+projectRef+'.supabase.co',
    P148_RUN_HOSTED:mode,
    P148_WRITE_APPROVAL:P148_WRITE_APPROVAL_PHRASE
   });
   assert.throws(()=>assertHostedP148Guard(env),/protected existing/);
   assert.equal(hostedP148Readiness(env).configured,false);
  }
});

test('P148 exact isolated HTTPS host, independent project reference approval and test-only label',()=>{
 assert.equal(assertHostedP148Guard(good()).projectRef,ID);
 for(const change of [
  {P148_APPROVED_PROJECT_REF:'different-project-ref'},
  {P148_CONFIRMED_PROJECT_LABEL:'Closet Current Staging'},
  {P148_SUPABASE_URL:'http://'+ID+'.supabase.co'},
  {P148_SUPABASE_URL:'https://'+ID+'.supabase.co.evil.example'},
  {P148_SUPABASE_URL:'https://user:pass@'+ID+'.supabase.co'},
  {P148_SUPABASE_URL:'https://'+ID+'.supabase.co:8443'},
  {P148_SUPABASE_URL:'https://'+ID+'.supabase.co/path'},
  {P148_SUPABASE_URL:'https://'+ID+'.supabase.co/?danger=1'},
  {P148_SUPABASE_URL:'https://'+ID+'.supabase.co/#token'},
  {P148_ISOLATED_PROJECT_REF:'wrong'},
  {P148_ISOLATED_PROJECT_REF:'ABCDEFGHIJKLMNOPQRST'},
  {P148_SUPABASE_URL:'https://'+ID.slice(0,19)+'1.supabase.co'}
 ])assert.throws(()=>assertHostedP148Guard(good(change)),/P148 isolated hosted-project guard/);
});

test('P148 readonly still requires two separate dedicated test accounts and safe publishable key',()=>{
 const safe=assertHostedP148Guard(good());
 assert.equal(safe.mode,'readonly');
 assert.equal(safe.onlyDisposableHosted,true);
 assert.equal(safe.liveProjectBlocked,true);
 for(const changes of [
  {P148_TEST_A_EMAIL:'real-user@example.com'},
  {P148_TEST_B_EMAIL:'alpha+p148@example.invalid'},
  {P148_TEST_A_PASSWORD:'short'},
  {P148_TEST_B_PASSWORD:pass+'A'},
  {P148_TEST_B_PASSWORD:''},
  {P148_PUBLISHABLE_KEY:'sb_secret_something_prohibited'},
  {P148_PUBLISHABLE_KEY:'sb_service_role_sensitive_bad'},
  {P148_PUBLISHABLE_KEY:'not-a-key'},
  {P148_RUN_HOSTED:'NO'}
 ])assert.throws(()=>assertHostedP148Guard(good(changes)));
});

test('P148 reject legacy elevated service-role JWT supplied as API key',()=>{
 const jwt=(role)=>{
  const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const p=Buffer.from(JSON.stringify({role})).toString('base64url');
  return h+'.'+p+'.testsignature';
 };
 assert.throws(()=>assertHostedP148Guard(good({P148_PUBLISHABLE_KEY:jwt('service_role')})));
 assert.equal(assertHostedP148Guard(good({P148_PUBLISHABLE_KEY:jwt('anon')})).mode,'readonly');
});

test('P148 destructive hosted write mode requires explicit independent approval and never defaults to it',()=>{
 assert.throws(()=>assertHostedP148Guard(good({P148_RUN_HOSTED:'full'})),/write approval/);
 assert.throws(()=>assertHostedP148Guard(good({P148_RUN_HOSTED:'full',P148_WRITE_APPROVAL:'yes'})),/write approval/);
 const approved=assertHostedP148Guard(good({P148_RUN_HOSTED:'full',P148_WRITE_APPROVAL:P148_WRITE_APPROVAL_PHRASE}));
 assert.equal(approved.mode,'full');
 assert.equal(approved.projectRef,ID);
});

test('P148 real entrypoint with no authorized project exits safely before any network',()=>{
 const child=spawnSync(process.execPath,['scripts/test-isolated-hosted-supabase-148.mjs'],{
  encoding:'utf8',timeout:15000,
  env:{PATH:process.env.PATH||'',HOME:process.env.HOME||''}
 });
 assert.equal(child.status,0,child.stderr);
 assert.equal(child.stderr,'');
 const report=JSON.parse(child.stdout.trim());
 assert.equal(report.status,'HOSTED_NOT_RUN_NO_APPROVED_DISPOSABLE_PROJECT');
 assert.equal(report.hostedSupabaseCertified,false);
 assert.equal(report.productionOrStagingTouched,false);
});

test('P148 local test report and source explicitly prohibit live Supabase writes',()=>{
 const runner=readFileSync('scripts/test-isolated-hosted-supabase-148.mjs','utf8');
 const probe=readFileSync('research/isolated-hosted-supabase-acceptance-148/hosted-acceptance-probe.mjs','utf8');
 const guard=readFileSync('research/isolated-hosted-supabase-acceptance-148/hosted-project-guard.mjs','utf8');
 assert.ok(runner.indexOf('assertHostedP148Guard(process.env)')<
  runner.indexOf('await import('),'guard must execute before any hosted I/O module loads');
 assert.match(runner,/HOSTED_NOT_RUN_NO_APPROVED_DISPOSABLE_PROJECT/);
 assert.match(probe,/createSignedOwnerCloud129/);
 assert.match(probe,/https:/);
 assert.match(guard,/qlwotqbqxpgkheitsboe/);
 assert.match(guard,/hlkgymugtfbirlpunsra/);
 assert.match(guard,/fbnplztkbsteuzrmbgib/);
});
