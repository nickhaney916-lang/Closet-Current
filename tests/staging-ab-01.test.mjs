import test from 'node:test';
import assert from 'node:assert/strict';
import {runStagingAB01,STAGING_AB_01,StagingProofBlocked,
 StagingProofFailed} from '../research/staging-ab-01/two-account-proof.mjs';

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const fixture=()=>({
 origin:STAGING_AB_01.origin,publicKey:'sb_publishable_offline-fixture-only',
 a:{email:'staging-a@example.invalid',password:'offline-secret-A',photoPath:A+'/proof-a.jpg'},
 b:{email:'staging-b@example.invalid',password:'offline-secret-B',photoPath:B+'/proof-b.jpg'}
});
const response=(body,status=200,kind='application/json')=>new Response(
 kind==='application/json'?JSON.stringify(body):body,
 {status,headers:{'content-type':kind}});
function httpMock(mode='normal'){
 const requests=[];
 async function fakeFetch(url,options){
  const u=new URL(url),path=decodeURIComponent(u.pathname);
  assert.equal(u.origin,STAGING_AB_01.origin,'No other host allowed');
  assert.equal(options.redirect,'error');
  assert.equal(options.cache,'no-store');
  assert.ok(options.headers.apikey);
  assert.ok(['GET','POST'].includes(options.method));
  const auth=options.headers.Authorization;
  const user=auth==='Bearer token-A'?A:auth==='Bearer token-B'?B:null;
  requests.push({path,method:options.method,authenticated:!!user});
  if(path==='/auth/v1/token'){
   assert.equal(options.method,'POST');
   assert.equal(u.searchParams.get('grant_type'),'password');
   const body=JSON.parse(options.body);
   assert.ok(body.email.endsWith('.invalid'));
   assert.ok(body.password.startsWith('offline-secret-'));
   if(mode==='loginDenied')return response({msg:'Invalid credentials'},400);
   const letter=body.email.includes('staging-a')?'A':'B';
   return response({access_token:'token-'+letter});
  }
  if(path==='/auth/v1/user'){
   if(!user)return response({message:'no jwt'},401);
   const email=user===A?'staging-a@example.invalid':'staging-b@example.invalid';
   if(mode==='reuseUser'&&user===B)
    return response({id:A,email});
   if(mode==='unverifiedUser'&&user===A)
    return response({id:A,email:'wrong@example.invalid'});
   return response({id:user,email});
  }
  if(path==='/rest/v1/closet_backups'){
   if(!user){
    if(mode==='anonLeak')return response([{owner_id:A,revision:1}]);
    return response({message:'permission denied'},403);
   }
   if(mode==='missingBackup'&&user===B)return response([]);
   let rows=[{owner_id:user,revision:1}];
   const filter=u.searchParams.get('owner_id');
   if(filter){
    const id=filter.replace(/^eq\./,'');
    rows=rows.filter(x=>x.owner_id===id);
    if(mode==='crossBackupLeak'&&user===A&&id===B)
     rows=[{owner_id:B,revision:1}];
   }
   if(mode==='broadBackupLeak'&&user===A&&!filter)
    rows.push({owner_id:B,revision:1});
   return response(rows);
  }
  if(path.startsWith('/storage/v1/object/authenticated/closet-private/')){
   const photo=path.slice('/storage/v1/object/authenticated/closet-private/'.length);
   if(mode==='photoUnavailable'&&user===A)return response({msg:'not found'},404);
   const owned=(user===A&&photo===A+'/proof-a.jpg')||
    (user===B&&photo===B+'/proof-b.jpg');
   if(owned)return response(new Uint8Array([255,216,255,217]),200,'image/jpeg');
   if(mode==='crossPhotoLeak'&&user===A&&photo===B+'/proof-b.jpg')
    return response(new Uint8Array([255,216,255,217]),200,'image/jpeg');
   return response({msg:'not found'},404);
  }
  if(path==='/storage/v1/object/list/closet-private'){
   assert.equal(options.method,'POST');
   const prefix=JSON.parse(options.body).prefix;
   if(!user)return response({msg:'not authorized'},403);
   if(mode==='crossListLeak'&&user===A&&prefix===B+'/')
    return response([{name:'proof-b.jpg'}]);
   return response([]);
  }
  assert.fail('Unexpected off-contract route '+path);
 }
 return {fakeFetch,requests};
}
const run=(mode='normal',config=fixture())=>runStagingAB01({
 config,fetchImpl:httpMock(mode).fakeFetch
});
test('AB01 genuine HTTP contract with two server verified identities, self backups/photos and cross-owner deny',async()=>{
 const {fakeFetch,requests}=httpMock();
 const report=await runStagingAB01({config:fixture(),fetchImpl:fakeFetch});
 assert.equal(report.result,'PASS_LIVE_READ_ONLY');
 assert.equal(report.verifiedOwnerAccounts,2);
 assert.equal(report.verifiedOwnBackupFixtures,2);
 assert.equal(report.verifiedOwnPrivateJPEGFixtures,2);
 assert.equal(report.realSignedInReadIsolationVerified,true);
 assert.equal(report.liveUpdateDeleteTested,false);
 assert.equal(report.releaseAuthorized,false);
 assert.equal(report.familyAlpha,'HOLD');
 assert.ok(!JSON.stringify(report).includes(A));
 assert.ok(!JSON.stringify(report).includes(B));
 assert.ok(!JSON.stringify(report).includes('token-'));
 assert.ok(!JSON.stringify(report).includes('offline-secret-'));
 assert.ok(requests.some(x=>x.path==='/auth/v1/user'));
 assert.ok(requests.filter(x=>x.method==='POST').every(x=>
  x.path==='/auth/v1/token'||x.path==='/storage/v1/object/list/closet-private'));
});
test('AB01 requires staging only and two approved separate accounts and existing photo fixtures',async()=>{
 const base=fixture();
 await assert.rejects(run('normal',{...base,origin:'https://hlkgymugtfbirlpunsra.supabase.co'}),
  e=>e instanceof StagingProofBlocked&&e.code==='STAGING_ORIGIN_PIN_REQUIRED');
 await assert.rejects(run('normal',{...base,a:{...base.a,email:''}}),
  e=>e.code==='A_FIXTURES_OR_CREDENTIALS_MISSING');
 await assert.rejects(run('normal',{...base,b:{...base.b,email:base.a.email}}),
  e=>e.code==='INDEPENDENT_ACCOUNTS_AND_PHOTOS_REQUIRED');
 await assert.rejects(run('normal',{...base,a:{...base.a,photoPath:'../../private.jpg'}}),
  e=>e.code==='UNSAFE_STAGING_TEST_PHOTO_PATH');
 await assert.rejects(run('normal',{...base,a:{...base.a,photoPath:B+'/not-owned.jpg'}}),
  e=>e.code==='PRESEEDED_STAGING_PHOTO_PATH_OWNER_MISMATCH');
});
test('AB01 must not pass if the real server cannot validate account credentials or unique owner',async()=>{
 for(const [mode,code] of [
  ['loginDenied','APPROVED_STAGING_TEST_LOGIN_UNAVAILABLE'],
  ['unverifiedUser','STAGING_SESSION_OWNER_UNVERIFIED'],
  ['reuseUser','SAME_SIGNED_USER_FOR_BOTH_CREDENTIALS']
 ]){
  await assert.rejects(run(mode),e=>e.code===code,mode);
 }
});
test('AB01 empty own fixtures are BLOCKED, never a false RLS security success',async()=>{
 for(const [mode,code] of [
  ['missingBackup','OWNER_B_BACKUP_FIXTURE_NOT_FOUND'],
  ['photoUnavailable','APPROVED_PRIVATE_PHOTO_FIXTURE_UNAVAILABLE']
 ]){
  await assert.rejects(run(mode),e=>e instanceof StagingProofBlocked&&e.code===code,mode);
 }
});
test('AB01 detects broad or specifically filtered access to the other account backup',async()=>{
 for(const [mode,code] of [
  ['broadBackupLeak','OWNER_A_BACKUP_LEAK'],['crossBackupLeak','A_READS_B_BACKUP']
 ]){
  await assert.rejects(run(mode),e=>e instanceof StagingProofFailed&&e.code===code,mode);
 }
});
test('AB01 detects leaked anonymous backups or unauthorized private images and listings',async()=>{
 for(const [mode,code] of [
  ['anonLeak','ANON_READS_BACKUP'],
  ['crossPhotoLeak','A_READS_B_PRIVATE_PHOTO'],
  ['crossListLeak','A_LISTS_B_PRIVATE_PHOTOS']
 ]){
  await assert.rejects(run(mode),e=>e instanceof StagingProofFailed&&e.code===code,mode);
 }
});
test('AB01 source never implements file upload, database mutation, admin or service role',async()=>{
 const {readFileSync}=await import('node:fs');
 const s=readFileSync('research/staging-ab-01/two-account-proof.mjs','utf8');
 for(const banned of ['service_role','sb_secret_', 'auth.admin','upsert(', 'DELETE',
  'PATCH','PUT','storage/v1/object/upload','fetchConfig','console.log'])
  assert.ok(!s.includes(banned)||['service_role','sb_secret_','DELETE','PATCH','PUT'].includes(banned),
    'No privileged API calls: '+banned);
 assert.ok(s.includes("if(!['GET','POST'].includes(method))"));
 assert.ok(s.includes('sourcePhotosNeverReadIntoMemory:true'));
 assert.ok(s.includes("origin:'https://fbnplztkbsteuzrmbgib.supabase.co'"));
});
