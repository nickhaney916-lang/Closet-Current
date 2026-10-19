// Request/Response integration with real HMACs and simulated Auth/RPC/provider.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createTryOnHandler,createRpcTransport} from '../supabase/functions/ai-try-on/http.mjs';
import {createPredictionTokens} from '../supabase/functions/ai-try-on/job-tokens.mjs';
import {imageDigest,createSubmissionLedger} from '../supabase/functions/ai-try-on/submission.mjs';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const img='data:image/jpeg;base64,'+'Ab9/'.repeat(40),origin='https://closet-current.test';
const start=()=>({action:'start',requestId:randomUUID(),figure:'female',category:'tops',garmentImage:img});
function setup(overrides={}){
 const values={SUPABASE_URL:'https://synthetic.supabase.test',SUPABASE_ANON_KEY:'synthetic-anon',
  SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',FASHN_API_KEY:'synthetic-provider',TRYON_ENABLED:'true',TRYON_LEDGER_ENABLED:'true',
  TRYON_JOB_SIGNING_KEY:'synthetic-signing-secret-not-a-real-key',TRYON_ALLOWED_ORIGIN:origin,TRYON_PILOT_USER_IDS:A+','+B,
  TRYON_MULTI_ENABLED:'true',TRYON_FEMALE_MODEL_IMAGE_URL:'https://licensed.example/female.jpg',TRYON_MALE_MODEL_IMAGE_URL:'https://licensed.example/male.jpg'};
 const calls=[],reservations=[],accepted=new Map();let runCount=0;
 const tokens=createPredictionTokens(()=>values.TRYON_JOB_SIGNING_KEY);
 const ledger={reserve:async x=>{
  reservations.push(x);if(accepted.has(x.requestId))return {disposition:'accepted',providerJobId:accepted.get(x.requestId)};
  return {disposition:overrides.disposition||'submit'};
 },accept:async x=>{accepted.set(x.requestId,x.providerJobId);return {accepted:true};},unknown:async()=>({held:true})};
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/auth/v1/user')){
   assert.equal(options.headers.apikey,'synthetic-anon');
   return Response.json({id:options.headers.Authorization==='Bearer account-b'?B:A});
  }
  if(url==='https://api.fashn.ai/v1/run'){
   runCount++;if(overrides.providerFailure)throw Error('private provider failure details');
   return Response.json({id:'synthetic-http-job-'+runCount});
  }
  if(url.startsWith('https://api.fashn.ai/v1/status/'))return Response.json(overrides.priorStatus||{status:'completed',output:[img]});
  throw Error('Unexpected outbound request');
 };
 const handler=createTryOnHandler({env:k=>values[k],ledger,fetchImpl,...tokens,
  submissionApproved:overrides.approved??true,chainedApproved:overrides.chained??true});
 const request=async(body,token='account-a',extra={})=>handler(new Request('https://edge.test/ai-try-on',{
  method:'POST',headers:{origin,Authorization:'Bearer '+token,'Content-Type':'application/json',...extra},body:JSON.stringify(body)}));
 return {request,handler,calls,reservations,values,tokens,runCount:()=>runCount};
}
test('deployment approval cannot be supplied by body or environment',async()=>{
 const e=setup({approved:false});
 assert.equal((await (await e.request({action:'availability'})).json()).status,'unavailable');
 assert.equal((await e.request({...start(),submissionApproved:true})).status,403);
 assert.equal(e.runCount(),0);assert.equal(e.reservations.length,0);
});
test('handler derives owner from authenticated user, reserves entire pair and signs returned job',async()=>{
 const e=setup(),body={...start(),owner:B,plannedPasses:2,nextGarmentDigest:await imageDigest(img)};
 const response=await e.request(body);assert.equal(response.status,200);
 const first=await response.json(),job=await e.tokens.readPrediction(first.token,A);
 assert.equal(job.step,1);assert.equal(e.reservations[0].owner,A);assert.equal(e.reservations[0].plannedPasses,2);
 const second=await e.request({action:'continue',requestId:randomUUID(),previousToken:first.token,
  figure:'female',category:'bottoms',garmentImage:img});
 assert.equal(second.status,200);assert.equal(e.runCount(),2);
 const posted=e.calls.filter(x=>x.url.endsWith('/v1/run')).map(x=>JSON.parse(x.options.body));
 assert.equal(posted[1].inputs.model_image,img,'authenticated first-provider result is the second model');
 assert.equal(e.reservations[1].parentJobId,job.id);
 assert.equal((await e.tokens.readPrediction((await second.json()).token,A)).step,2);
});
test('accepted HTTP replay uses recorded job and makes no second provider POST',async()=>{
 const e=setup(),body=start();const first=await (await e.request(body)).json();
 const again=await (await e.request(body)).json();assert.equal(e.runCount(),1);
 assert.equal((await e.tokens.readPrediction(first.token,A)).id,(await e.tokens.readPrediction(again.token,A)).id);
});
test('quota or unavailable durable storage fails closed before provider submission',async()=>{
 for(const disposition of ['quota','hold','disabled','conflict']){
  const e=setup({disposition});assert.equal((await e.request(start())).status,503);assert.equal(e.runCount(),0);
 }
 const e=setup();delete e.values.SUPABASE_SERVICE_ROLE_KEY;
 assert.equal((await e.request(start())).status,403);assert.equal(e.runCount(),0);
});
test('cross-account, tampered and invalid predecessors cannot fetch or submit provider jobs',async()=>{
 const e=setup(),first=await (await e.request(start())).json(),before=e.calls.length;
 const body={action:'continue',requestId:randomUUID(),previousToken:first.token,figure:'female',category:'bottoms',garmentImage:img};
 assert.equal((await e.request(body,'account-b')).status,400);
 assert.equal((await e.request({...body,previousToken:'forged.token'})).status,400);
 assert.equal((await e.request({...body,category:'tops'})).status,400);
 assert.equal(e.calls.slice(before).filter(x=>x.url.startsWith('https://api.fashn.ai')).length,0);
});
test('uncompleted predecessor and disabled chaining cannot start second pass',async()=>{
 for(const overrides of [{priorStatus:{status:'processing'}},{chained:false}]){
  const e=setup(overrides),first=await (await e.request(start())).json();
  const response=await e.request({action:'continue',requestId:randomUUID(),previousToken:first.token,
   figure:'female',category:'bottoms',garmentImage:img});
  assert.ok([403,503].includes(response.status));assert.equal(e.runCount(),1);
 }
});
test('unapproved pair, invalid request IDs, person overrides and malformed JSON never submit',async()=>{
 const e=setup({chained:false});
 for(const body of [{...start(),plannedPasses:2,nextGarmentDigest:'a'.repeat(64)},
  {...start(),requestId:'bad'},{...start(),modelImage:'https://attacker.example/person.jpg'},null,[],
  {...start(),plannedPasses:2,nextGarmentDigest:'bad'}]){
  assert.ok([400,403].includes((await e.request(body)).status));
 }
 assert.equal(e.runCount(),0);
});
test('request body limit is enforced without trusting Content-Length',async()=>{
 const e=setup();const response=await e.request({action:'start',garmentImage:'x'.repeat(8_000_001)});
 assert.equal(response.status,413);assert.equal(e.runCount(),0);
});
test('origin and missing auth deny before authentication or quota traffic',async()=>{
 const e=setup();assert.equal((await e.request(start(),'account-a',{origin:'https://attacker.example'})).status,403);
 const result=await e.handler(new Request('https://edge.test/',{method:'POST',headers:{origin},body:'{}'}));
 assert.equal(result.status,401);assert.equal(e.calls.length,0);
});
test('provider failures return generic errors and never expose private provider payloads',async()=>{
 const e=setup({providerFailure:true}),response=await e.request(start());
 assert.equal(response.status,503);assert.equal(e.runCount(),1);
 assert.deepEqual(await response.json(),{error:'AI try-on is currently unavailable'});
});
test('REST transport routes service credentials only to the allowlisted ledger RPC',async()=>{
 const calls=[],transport=createRpcTransport({env:k=>({SUPABASE_URL:'https://synthetic.supabase.test',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'})[k],
  fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json({disposition:'quota'});}});
 const ledger=createSubmissionLedger(transport);
 assert.equal((await ledger.reserve({owner:A})).disposition,'quota');
 assert.equal(calls[0].url,'https://synthetic.supabase.test/rest/v1/rpc/reserve_closet_tryon');
 assert.equal(calls[0].options.headers.Authorization,'Bearer synthetic-service');
 await assert.rejects(transport.rpc('arbitrary_rpc',{}));assert.equal(calls.length,1);
 const broken=createSubmissionLedger({rpc:async()=>{throw Error('private transport details');}});
 await assert.rejects(broken.reserve({}),/^Error: Durable submission ledger unavailable$/);
});
