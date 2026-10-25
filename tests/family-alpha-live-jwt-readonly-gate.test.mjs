import test from 'node:test';
import assert from 'node:assert/strict';
import {
 BASE,PROD,STAGE_ORIGIN,validateReadOnlyFixture,plannedPaths,runApprovedReadOnlyProbe
} from '../scripts/family-alpha-live-jwt-readonly-gate.mjs';

const A={id:'a1111111-1111-4111-8111-111111111111',
 jwt:'SYNTHETIC_UNUSED_A_123456789',
 photoKey:'a'.repeat(64)+'.jpg'};
const B={id:'b2222222-2222-4222-8222-222222222222',
 jwt:'SYNTHETIC_UNUSED_B_987654321',
 photoKey:'b'.repeat(64)+'.jpg'};
const publicKey='sb_publishable_SYNTHETIC_ONLY_abcdefgh';
const options={ownerApproved:true,a:A,b:B,publicKey};
function mock({foreignBackup=false,foreignPhoto=false,missingOwnBackup=false,
 missingOwnPhoto=false,badTokenB=false,brokenHead=false}={}){
 const calls=[];
 const fetchFn=async (url,opts)=>{
  calls.push({url,method:opts.method,options:opts,
   headers:opts.headers});
  const path=url.slice(BASE.length);
  assert.equal(url.startsWith(BASE+'/'),true);
  assert.equal(url.includes(PROD),false);
  if(path==='/auth/v1/user'){
   const id=opts.headers.Authorization==='Bearer '+A.jwt?A.id:B.id;
   return {status:200,json:async()=>({id:badTokenB&&id===B.id?A.id:id})};
  }
  const actor=opts.headers.Authorization==='Bearer '+A.jwt?A:B;
  if(path.startsWith('/rest/v1/closet_backups?')){
   assert.equal(opts.method,'GET');
   const owner=path.endsWith(A.id)?A:B;
   return {status:200,json:async()=>{
    if(actor.id===owner.id&&missingOwnBackup)return [];
    return actor.id===owner.id||foreignBackup?
      [{owner_id:owner.id,revision:1}]:[];
   }};
  }
  if(path.startsWith('/storage/v1/object/closet-private/')){
   assert.equal(opts.method,'HEAD');
   const owner=path.includes('/'+A.id+'/')?A:B;
   return {status:brokenHead?405:actor.id===owner.id?
    (missingOwnPhoto?404:200):
    (foreignPhoto?200:404)};
  }
  throw Error('Unexpected mocked request '+path);
 };
 return {fetchFn,calls};
}
test('fixed, separate Supabase staging project never accepts production URLs',()=>{
 assert.equal(STAGE_ORIGIN,'https://closet-current-staging.pages.dev/');
 assert.equal(BASE,'https://fbnplztkbsteuzrmbgib.supabase.co');
 assert.equal(PROD,'hlkgymugtfbirlpunsra');
 const paths=plannedPaths(A,B);
 assert.equal(paths.stageBase,BASE);
 assert.equal(paths.backupA.includes(A.id),true);
 assert.equal(paths.backupB.includes(B.id),true);
 assert.match(paths.photoA,/\/closet-private\/a1111111-.+\.jpg$/);
});
test('without explicit approval, correct credentials and injected fetch, network is never called',async()=>{
 const h=mock();
 await assert.rejects(runApprovedReadOnlyProbe({
  ...options,ownerApproved:false,fetchFn:h.fetchFn
 }),/Explicit owner approval/);
 await assert.rejects(runApprovedReadOnlyProbe({
  ...options,publicKey:'sb_secret_DANGEROUS',fetchFn:h.fetchFn
 }),/separate staging publishable key/);
 await assert.rejects(runApprovedReadOnlyProbe({
  ...options,publicKey:'legacy-anon-key',fetchFn:h.fetchFn
 }),/separate staging publishable key/);
 await assert.rejects(runApprovedReadOnlyProbe(options),/Explicit network executor/);
 for(const malformed of [
  {...A,id:B.id},{...A,jwt:''},{...A,photoKey:'../photo.jpg'},
  {...A,photoKey:'a'.repeat(64)+'.png'},
  {...A,id:'not-a-uuid'}
 ]){
  await assert.rejects(runApprovedReadOnlyProbe({
   ...options,a:malformed,fetchFn:h.fetchFn
  }),/Two distinct|JWT|required|digest/);
 }
 assert.equal(h.calls.length,0);
});
test('two disposable owners can read only their own backups and HEAD photo in a fully mocked execution',async()=>{
 const h=mock();
 const r=await runApprovedReadOnlyProbe({...options,fetchFn:h.fetchFn});
 assert.equal(r.status,'PRELIMINARY_READ_ONLY_PASS');
 assert.equal(r.releaseGate,'HOLD');
 assert.equal(r.remoteWrites,0);
 assert.equal(r.checks.length,10);
 assert.equal(r.checks.filter(x=>x.result==='ALLOWED').length,6);
 assert.equal(r.checks.filter(x=>x.result==='DENIED').length,4);
 assert.deepEqual(r.remaining.length,6);
 assert.equal(h.calls.length,10);
 for(const call of h.calls){
  assert.ok(call.method==='GET'||call.method==='HEAD');
  assert.ok(call.url.startsWith(BASE+'/'));
  assert.equal(call.options.redirect,'error');
  assert.equal(call.options.credentials,'omit');
  assert.equal(call.options.cache,'no-store');
  assert.equal(call.headers.apikey,publicKey);
  assert.ok(call.headers.Authorization==='Bearer '+A.jwt||
            call.headers.Authorization==='Bearer '+B.jwt);
 }
 const log=JSON.stringify(r);
 assert.equal(log.includes(A.jwt)||log.includes(B.jwt),false,'never expose JWTs in report');
 assert.equal(log.includes(A.photoKey),false,'never expose photo paths in report');
});
test('a foreign row or private photo accessible by other JWT fails, not passes',async()=>{
 for(const opts of [
  {foreignBackup:true},{foreignPhoto:true},{foreignBackup:true,foreignPhoto:true}
 ]){
  const h=mock(opts);
  const r=await runApprovedReadOnlyProbe({...options,fetchFn:h.fetchFn});
  assert.equal(r.status,'FAIL_PRIVACY');
  assert.ok(r.checks.some(x=>x.result==='FAIL_LEAK'));
  assert.equal(r.releaseGate,'HOLD');
 }
});
test('missing fixture rows, object HEAD unsupported, or missing JPEG are inconclusive',async()=>{
 for(const opts of [{missingOwnBackup:true},{missingOwnPhoto:true},{brokenHead:true}]){
  const h=mock(opts);
  const r=await runApprovedReadOnlyProbe({...options,fetchFn:h.fetchFn});
  assert.equal(r.status,'INCONCLUSIVE');
  assert.ok(r.checks.some(x=>x.result==='INCONCLUSIVE'));
 }
});
test('bad staging account identity prevents later RLS/Storage probes',async()=>{
 const h=mock({badTokenB:true});
 const r=await runApprovedReadOnlyProbe({...options,fetchFn:h.fetchFn});
 assert.equal(r.status,'INCONCLUSIVE');
 assert.equal(h.calls.length,2);
 assert.ok(h.calls.every(x=>x.url.endsWith('/auth/v1/user')));
});
