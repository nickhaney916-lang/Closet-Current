import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {
 STAGE_BASE,PRODUCTION_REF,BUCKET,assertLiveInputs,makeStageReadOnlyClient,
 runStageTwoOwnerReadOnly,safeSummary
} from '../../scripts/family-alpha-48-real-jwt-readonly-preflight.mjs';
const a='a1111111-1111-4111-8111-111111111111';
const b='b2222222-2222-4222-8222-222222222222';
const key='sb_publishable_'+'z'.repeat(25);
const tokenA='synthetic_A_'+'x'.repeat(80);
const tokenB='synthetic_B_'+'y'.repeat(80);
const args={key,tokenA,tokenB};
function mock({backupLeak=false,photoLeak=false,backupB=true,photoB=true,sameUser=false,badAuth=false,huge=false}={}){
 const traffic=[];
 async function fetchImpl(url,opts){
  const uri=new URL(url),actor=opts.headers.Authorization.slice(7)===tokenA?a:b;
  traffic.push({pathname:uri.pathname,method:opts.method,host:uri.host,redirect:opts.redirect,body:opts.body});
  if(uri.hostname!=='fbnplztkbsteuzrmbgib.supabase.co')throw Error('production request');
  if(uri.pathname==='/auth/v1/user')return {ok:!badAuth,status:badAuth?401:200,json:async()=>({id:sameUser?a:actor})};
  if(uri.pathname==='/rest/v1/closet_backups'){
   const queried=uri.searchParams.get('owner_id')?.slice(3);
   const exists=queried===a||backupB&&queried===b;
   return {ok:true,status:200,json:async()=>exists&&(queried===actor||backupLeak)?[{owner_id:queried}]:[]};
  }
  if(uri.pathname==='/storage/v1/object/list/'+BUCKET){
   const target=JSON.parse(opts.body).prefix.slice(0,-1);
   const exists=target===a||photoB&&target===b;
   return {ok:true,status:200,json:async()=>exists&&(target===actor||photoLeak)?
    Array.from({length:huge?50:1},(_,i)=>({name:'SENSITIVE-NAME-'+i+'.jpg'})):[]};
  }
  throw Error('unexpected API request');
 }
 return {fetchImpl,traffic};
}
test('explicit approval required; invoking script without credentials never makes a network request',()=>{
 const z=spawnSync(process.execPath,['scripts/family-alpha-48-real-jwt-readonly-preflight.mjs'],{
  encoding:'utf8',env:{PATH:process.env.PATH,CC_STAGE_JWT_A:tokenA,CC_STAGE_JWT_B:tokenB}
 });
 assert.equal(z.status,0);
 assert.match(z.stdout,/NOT_EXECUTED_NEEDS_EXPLICIT_LOCAL_LIVE_OPTIN/);
 assert.doesNotMatch(z.stdout,/(synthetic_A_|synthetic_B_|SENSITIVE-NAME)/);
});
test('reject privileged-looking keys, missing/duplicate/too-short/non-secret-isolated token inputs',()=>{
 for(const bad of [
  {...args,key:'sb_secret_'+'z'.repeat(30)},
  {...args,key:'production publishable'},
  {...args,tokenB:tokenA},
  {...args,tokenA:''},
  {...args,tokenA:'hello'},
  {...args,tokenB:tokenB+'\n'}
 ])assert.throws(()=>assertLiveInputs(bad));
 assert.equal(assertLiveInputs(args),true);
});
test('request layer only permits exact staging identity, backup owner IDs and storage metadata; never image content or writes',async()=>{
 const {fetchImpl,traffic}=mock(),api=makeStageReadOnlyClient({key,fetchImpl});
 const token=tokenA;
 for(const [method,path,body] of [
  ['GET','https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/user'],
  ['GET','https://example.com/auth/v1/user'],
  ['GET','/storage/v1/object/'+BUCKET+'/'+a+'/some.jpg'],
  ['POST','/rest/v1/rpc/save_closet_backup',{}],
  ['DELETE','/storage/v1/object/'+BUCKET+'/'+a+'/some.jpg'],
  ['GET','/rest/v1/closet_backups?select=document&limit=2'],
  ['POST','/storage/v1/object/list/'+BUCKET,{prefix:'../',limit:50,offset:0}],
  ['POST','/storage/v1/object/list/'+BUCKET,{prefix:a+'/',limit:999,offset:0}]
 ])await assert.rejects(api({path,token,method,body}));
 assert.equal(traffic.length,0);
 const id=await api({path:'/auth/v1/user',token});
 assert.equal(id.id,a);
 assert.equal(traffic.length,1);
 assert.equal(traffic[0].redirect,'error');
});
test('two real-API-shaped, distinct, existing synthetic owner sessions: only own metadata visible and overall release still HOLD',async()=>{
 const {fetchImpl,traffic}=mock();
 const s=await runStageTwoOwnerReadOnly({...args,fetchImpl});
 assert.equal(s.status,'PASS_LIVE_READONLY_TWO_OWNER_ACCESS');
 assert.equal(s.decision,'HOLD');
 assert.equal(s.signedInDistinctAdultSessions,true);
 assert.equal(s.crossOwnerBackupReadsDenied,true);
 assert.equal(s.crossOwnerPhotoListDenied,true);
 assert.equal(s.twoOwnerBackupPositiveControls,true);
 assert.equal(s.twoOwnerPhotoPositiveControls,true);
 assert.equal(s.authenticatedPhotoDownloadTested,false);
 assert.equal(s.signedInOwnerWritesTested,false);
 assert.equal(s.fourFamilyJwtSessionsTested,false);
 assert.equal(s.deploymentAuthorized,false);
 assert.equal(traffic.length,10);
 assert.ok(traffic.every(req=>req.host==='fbnplztkbsteuzrmbgib.supabase.co' &&
  (req.method==='GET'||req.pathname==='/storage/v1/object/list/'+BUCKET&&req.method==='POST')));
 const printed=JSON.stringify(s);
 for(const forbidden of [tokenA,tokenB,a,b,PRODUCTION_REF,'SENSITIVE-NAME'])
  assert.ok(!printed.includes(forbidden));
 assert.equal(STAGE_BASE,'https://fbnplztkbsteuzrmbgib.supabase.co');
});
test('a leaked foreign backup owner ID fails, even though this API is read-only',async()=>{
 const s=await runStageTwoOwnerReadOnly({...args,...mock({backupLeak:true})});
 assert.equal(s.status,'FAIL_CROSS_OWNER_VISIBILITY');
 assert.equal(s.crossOwnerBackupReadsDenied,false);
 assert.equal(s.decision,'HOLD');
});
test('a leaked foreign storage listing fails without downloading photo bytes',async()=>{
 const s=await runStageTwoOwnerReadOnly({...args,...mock({photoLeak:true})});
 assert.equal(s.status,'FAIL_CROSS_OWNER_VISIBILITY');
 assert.equal(s.crossOwnerPhotoListDenied,false);
 assert.equal(s.decision,'HOLD');
});
test('missing backup OR photo owner positive controls never becomes a false RLS pass',async()=>{
 for(const f of [{backupB:false},{photoB:false}]){
  const s=await runStageTwoOwnerReadOnly({...args,...mock(f)});
  assert.equal(s.status,'INCOMPLETE_POSITIVE_CONTROLS');
  assert.equal(s.decision,'HOLD');
 }
});
test('identical verified user identities, invalid signed sessions, or full photo page abort safely',async()=>{
 for(const f of [{sameUser:true},{badAuth:true},{huge:true}]){
  await assert.rejects(runStageTwoOwnerReadOnly({...args,...mock(f)}));
 }
});
test('no result can ever approve staging or production deployment',()=>{
 const s=safeSummary({
  status:'PASS_LIVE_READONLY_TWO_OWNER_ACCESS',
  signedInDistinctAdultSessions:true,
  crossOwnerBackupReadsDenied:true,
  crossOwnerPhotoListDenied:true,
  twoOwnerBackupPositiveControls:true,
  twoOwnerPhotoPositiveControls:true
 });
 assert.equal(s.decision,'HOLD');
 assert.equal(s.deploymentAuthorized,false);
 assert.equal(s.productionModified,false);
 assert.equal(s.stagingModified,false);
 assert.equal(s.signedInOwnerWritesTested,false);
});
