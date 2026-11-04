import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateEditTransport,PRIVATE_EDIT_DEFAULT_ENABLED} from
 '../supabase/functions/garment-normalize/private-edit-transport.mjs';
import {planEdit} from '../supabase/functions/garment-normalize/protocol.mjs';
const src='data:image/jpeg;base64,'+'A'.repeat(300);
const result='data:image/png;base64,'+
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJPQAAAABJRU5ErkJggg==';
const id='123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1';
const plan=()=>planEdit({action:'normalize-preview',category:'Bottoms',garmentImage:src,
 itemId:'test-shorts',photoSha256:'1'.repeat(64),userInitiated:true,storeResult:false});
function mock(fn){
 const calls=[];
 const fetchImpl=async (url,options)=>{
  calls.push({url,options});
  const body=fn(url,options);
  return {ok:true,headers:{get:()=>null},json:async()=>body};
 };
 const ctx={enabled:true,apiKey:'private-test-api-key-not-real-123456789',
  reservation:{approved:true,costCredits:1,maxOutputs:1,durableDbReservation:true},fetchImpl};
 return {ctx,calls};
}
test('provider calls use FASHN fixed host, one image and private base64, never browser key',async()=>{
 const x=mock((url,opts)=>opts.method==='POST'?{id}:{id,status:'completed',output:[result]});
 const t=createPrivateEditTransport(x.ctx);
 const job=await t.submit(plan());
 assert.equal(job.jobId,id);
 assert.equal(job.canAutoSave,false);
 const status=await t.poll(job.jobId);
 assert.equal(status.status,'preview-ready');
 assert.equal(status.image,result);
 assert.equal(status.sourceIdentityVerifiedByTransport,false);
 assert.equal(status.canAutoSave,false);
 assert.equal(x.calls.length,2);
 assert.equal(x.calls[0].url,'https://api.fashn.ai/v1/run');
 assert.equal(x.calls[1].url,'https://api.fashn.ai/v1/status/'+id);
 assert.equal(x.calls[0].options.method,'POST');
 assert.equal(JSON.parse(x.calls[0].options.body).inputs.return_base64,true);
 assert.equal(JSON.parse(x.calls[0].options.body).inputs.num_images,1);
 assert.ok(x.calls[0].options.headers.Authorization.startsWith('Bearer '));
 assert.equal(PRIVATE_EDIT_DEFAULT_ENABLED,false);
});
test('any missing explicit enablement or durable 1-credit reservation prevents a paid call',async()=>{
 const changes=[
  x=>x.enabled=false,x=>x.reservation.approved=false,
  x=>x.reservation.costCredits=2,x=>x.reservation.maxOutputs=2,
  x=>x.reservation.durableDbReservation=false,x=>x.apiKey=''
 ];
 for(const change of changes){
  const m=mock(()=>({id}));change(m.ctx);
  await assert.rejects(createPrivateEditTransport(m.ctx).submit(plan()));
  assert.equal(m.calls.length,0);
 }
});
test('reject external output URLs, multiple output images and mismatched jobs',async()=>{
 const bad=[
  {id,status:'completed',output:['https://cdn.fashn.ai/output.png']},
  {id,status:'completed',output:[result,result]},
  {id:'different-job-id-0000',status:'completed',output:[result]}
 ];
 for(const payload of bad){
  const m=mock(()=>payload);
  await assert.rejects(createPrivateEditTransport(m.ctx).poll(id));
 }
});
test('no arbitrary URL or freeform model config can be provided to private transport',async()=>{
 const invalid=plan();invalid.model_name='other';
 const m=mock(()=>({id}));
 await assert.rejects(createPrivateEditTransport(m.ctx).submit(invalid));
 const bad=plan();bad.inputs.num_images=4;
 await assert.rejects(createPrivateEditTransport(m.ctx).submit(bad));
 assert.equal(m.calls.length,0);
});
test('failed and pending status do not produce garment images',async()=>{
 const m=mock(()=>({id,status:'processing'}));
 const a=await createPrivateEditTransport(m.ctx).poll(id);
 assert.equal(a.status,'pending');assert.equal(a.image,undefined);
 const n=mock(()=>({id,status:'failed'}));
 assert.equal((await createPrivateEditTransport(n.ctx).poll(id)).status,'failed');
});
