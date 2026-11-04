import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createGarmentNormalizeCreditLedger} from '../supabase/functions/garment-normalize/credit-ledger-client.mjs';
import {submitGuardedGarmentPreview,GARMENT_PREVIEW_SUBMISSION_ENABLED} from '../supabase/functions/garment-normalize/guarded-preview-submission.mjs';

const id='11111111-1111-4111-8111-111111111111',ownerId='33333333-3333-4333-8333-333333333333';
const body='data:image/png;base64,'+'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAH0lEQVR4nGOU03DjYWAnHrEwcLMzMJCARjWMahg6GgC7EAkcaboM0gAAAABJRU5ErkJggg==';
const hash=createHash('sha256').update(Buffer.from(body.split(',')[1],'base64')).digest('hex');
const user={id:ownerId,verifiedBySupabase:true};
function ctx(){
 return {candidate:{action:'normalize-preview',category:'Tops',garmentImage:body,
  itemId:'my-shirt',photoSha256:hash,userInitiated:true,storeResult:false},
  owner:user,consent:{verifiedByServer:true,granted:true,purpose:'external-ai-garment-preview',
   ownerId,itemId:'my-shirt',sourceSha256:hash,expiresAt:Date.now()+60000},
  requestId:id,enabled:true};
}
function rpcFake(){
 let count=0,claimed=false,bindCount=0;
 const sent=[];
 const fetchImpl=async (url,options)=>{
  const name=url.split('/').at(-1),args=JSON.parse(options.body);
  sent.push({name,args,url,options});
  if(name==='reserve_garment_normalize_pilot'){
   count++;
   const body={approved:true,durableDbReservation:true,costCredits:1,maxOutputs:1,
    requestId:args.p_request_id,ownerId:args.p_owner_id,category:args.p_category,
    sourceSha256:args.p_source_sha256,status:'reserved'};
   return {ok:true,text:async()=>JSON.stringify(body)};
  }
  if(name==='claim_garment_normalize_pilot'){
   const result=!claimed;claimed=true;
   return {ok:true,text:async()=>JSON.stringify(result)};
  }
  if(name==='bind_garment_normalize_pilot'){
   bindCount++;
   return {ok:true,text:async()=>JSON.stringify(bindCount===1)};
  }
  throw Error('Unknown RPC');
 };
 const ledger=createGarmentNormalizeCreditLedger({
  enabled:true,supabaseUrl:'https://testing-ref.supabase.co',
  serviceRoleKey:'test-service-role-never-used-in-real-db-01234567890',
  fetchImpl
 });
 return {ledger,sent,get count(){return count},get bindCount(){return bindCount}};
}
test('credit ledger uses only pinned HTTPS Supabase RPC with server service key',async()=>{
 const f=rpcFake();
 const reservation=await f.ledger.reserve({owner:user,requestId:id,sourceSha256:hash,category:'Tops'});
 assert.equal(reservation.approved,true);
 assert.equal(reservation.durableDbReservation,true);
 assert.equal(f.sent[0].url,'https://testing-ref.supabase.co/rest/v1/rpc/reserve_garment_normalize_pilot');
 assert.equal(f.sent[0].options.headers.apikey,'test-service-role-never-used-in-real-db-01234567890');
 assert.ok(!JSON.stringify(f.sent[0].args).includes(body));
 assert.equal(await f.ledger.claim({owner:user,requestId:id,sourceSha256:hash}),true);
 assert.equal(await f.ledger.claim({owner:user,requestId:id,sourceSha256:hash}),false);
 assert.equal(await f.ledger.bind({owner:user,requestId:id,jobId:'provider-job-1234567'}),true);
 assert.equal(await f.ledger.bind({owner:user,requestId:id,jobId:'provider-job-0000000'}),false);
});
test('a single approved request makes exactly one model call and binds one job, never saves',async()=>{
 const f=rpcFake();let calls=0;
 const args={...ctx(),ledger:f.ledger,transportFactory:r=>{
  assert.equal(r.costCredits,1);
  return {submit:async plan=>{
   calls++;
   assert.equal(plan.model_name,'edit');
   assert.equal(plan.inputs.image,body);
   return {jobId:'provider-job-1234567'};
  }};
 }};
 const result=await submitGuardedGarmentPreview(args);
 assert.equal(calls,1);assert.equal(f.bindCount,1);
 assert.equal(result.canAutoSave,false);
 assert.equal(result.garmentIdentityVerified,false);
 await assert.rejects(submitGuardedGarmentPreview(args),/already used/);
 assert.equal(calls,1);
});
test('wrong hash, missing user consent, disabled pilot are refused before any credit reservation',async()=>{
 for(const alter of [
  a=>{a.candidate.photoSha256='0'.repeat(64);},
  a=>{a.consent.granted=false;},
  a=>{a.consent.verifiedByServer=false;},
  a=>{a.consent.ownerId='44444444-4444-4444-8444-444444444444';},
  a=>{a.consent.expiresAt=Date.now()-1000;},
  a=>{a.owner={id:ownerId,verifiedBySupabase:false};},
  a=>{a.enabled=false;}
 ]){
  const f=rpcFake();const a={...ctx(),ledger:f.ledger,transportFactory:()=>({submit:async()=>{throw Error('unexpected provider call')}})};
  a.candidate={...a.candidate};a.consent={...a.consent};
  alter(a);
  await assert.rejects(submitGuardedGarmentPreview(a));
  assert.equal(f.sent.length,0);
 }
 assert.equal(GARMENT_PREVIEW_SUBMISSION_ENABLED,false);
});
test('provider failure consumes claim; it cannot cause a second paid submission',async()=>{
 const f=rpcFake();let calls=0;
 const a={...ctx(),ledger:f.ledger,transportFactory:()=>({submit:async()=>{
  calls++;throw Error('Mock provider unavailable');
 }})};
 await assert.rejects(submitGuardedGarmentPreview(a),/Mock provider unavailable/);
 await assert.rejects(submitGuardedGarmentPreview(a),/already used/);
 assert.equal(calls,1);
});
test('server ledger fails closed on forged owner and supabase host URL',async()=>{
 assert.throws(()=>createGarmentNormalizeCreditLedger({
   enabled:true,supabaseUrl:'https://evil.example',serviceRoleKey:'x'.repeat(40),fetchImpl:async()=>{}
 }));
 const f=rpcFake();
 await assert.rejects(f.ledger.reserve({owner:{id:ownerId,verifiedBySupabase:false},
  requestId:id,sourceSha256:hash,category:'Tops'}));
 assert.equal(f.sent.length,0);
});
test('server rejects lying DB reservation body, before provider or claim',async()=>{
 const sent=[];
 const ledger=createGarmentNormalizeCreditLedger({enabled:true,
  supabaseUrl:'https://testing-ref.supabase.co',serviceRoleKey:'x'.repeat(40),
  fetchImpl:async(url,opts)=>{sent.push(url);
   return {ok:true,text:async()=>JSON.stringify({approved:true,costCredits:10})};}});
 await assert.rejects(ledger.reserve({owner:user,requestId:id,sourceSha256:hash,category:'Tops'}));
 assert.equal(sent.length,1);
});

test('server-only status lookup requires exact authenticated owner and bound job',async()=>{
 const fake=rpcFake();
 // This is an HTTP-mocked table read; no actual credential or user records.
 const owner={id:ownerId,verifiedBySupabase:true};
 const ledger=createGarmentNormalizeCreditLedger({enabled:true,
  supabaseUrl:'https://testing-ref.supabase.co',serviceRoleKey:'x'.repeat(40),
  fetchImpl:async(url,options)=>{
   assert.equal(options.method,'GET');
   const parsed=new URL(url);
   assert.equal(parsed.pathname,'/rest/v1/garment_normalize_pilot_credits');
   assert.equal(parsed.searchParams.get('owner_id'),'eq.'+ownerId);
   assert.equal(parsed.searchParams.get('request_id'),'eq.'+id);
   return {ok:true,text:async()=>JSON.stringify([{
    request_id:id,owner_id:ownerId,source_sha256:hash,category:'Tops',
    status:'submitted',provider_job_id:'provider-job-123456789'
   }])};
  }
 });
 const rec=await ledger.status({owner,requestId:id});
 assert.equal(rec.jobId,'provider-job-123456789');
 assert.equal(rec.sourceSha256,hash);
 await assert.rejects(ledger.status({owner:{id:ownerId,verifiedBySupabase:false},requestId:id}));
});
test('unauthorized or mismatched provider job row cannot be polled',async()=>{
 const ledger=createGarmentNormalizeCreditLedger({enabled:true,
  supabaseUrl:'https://testing-ref.supabase.co',serviceRoleKey:'x'.repeat(40),
  fetchImpl:async()=>({ok:true,text:async()=>JSON.stringify([{
   request_id:id,owner_id:'44444444-4444-4444-8444-444444444444',
   source_sha256:hash,category:'Tops',status:'submitted',provider_job_id:'provider-job-123456789'
  }])})
 });
 await assert.rejects(ledger.status({owner:user,requestId:id}),/mismatched/);
});
