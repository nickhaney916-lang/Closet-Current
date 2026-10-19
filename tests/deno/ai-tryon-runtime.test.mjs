// ACTUAL Deno TCP HTTP, SYNTHETIC Auth/provider/ledger. No external networking
// permission is granted. This is neither a hosted gateway nor a real AI test.
import assert from 'node:assert/strict';
import {createTryOnHandler} from '../../supabase/functions/ai-try-on/http.mjs';
import {createPredictionTokens} from '../../supabase/functions/ai-try-on/job-tokens.mjs';
import {imageDigest} from '../../supabase/functions/ai-try-on/submission.mjs';

const owner='a1111111-1111-4111-8111-111111111111';
const origin='https://closet-runtime.invalid';
const image='data:image/jpeg;base64,'+'Ab9/'.repeat(40);
function values(){return {
 SUPABASE_URL:'https://auth.runtime.invalid',SUPABASE_ANON_KEY:'synthetic-public',
 SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',FASHN_API_KEY:'synthetic-provider',
 TRYON_ENABLED:'true',TRYON_LEDGER_ENABLED:'true',TRYON_MULTI_ENABLED:'true',
 TRYON_ALLOWED_ORIGIN:origin,TRYON_PILOT_USER_IDS:owner,
 TRYON_JOB_SIGNING_KEY:'synthetic-deno-signing-secret-never-real',
 TRYON_FEMALE_MODEL_IMAGE_URL:'https://models.runtime.invalid/female.jpg',
 TRYON_MALE_MODEL_IMAGE_URL:'https://models.runtime.invalid/male.jpg'
};}
const request=(url,body,extra={})=>fetch(url,{method:'POST',headers:{origin,
 Authorization:'Bearer synthetic-owner',...extra},body:JSON.stringify(body)});
async function consume(response,status){assert.equal(response.status,status);return await response.json();}

Deno.test('actual entrypoint boots over loopback and cannot enable submission from environment or body',async()=>{
 const realServe=Deno.serve,realFetch=globalThis.fetch,env=values();
 const old=new Map(Object.keys(env).map(k=>[k,Deno.env.get(k)]));
 let server,authCalls=0,blockedExternal=0;
 try{
  for(const [key,value] of Object.entries(env))Deno.env.set(key,value);
  globalThis.fetch=async(url,options)=>{
   if(String(url)==='https://auth.runtime.invalid/auth/v1/user'){
    authCalls++;return Response.json({id:owner});
   }
   if(String(url).startsWith('http://127.0.0.1:'))return realFetch(url,options);
   blockedExternal++;throw Error('External network forbidden');
  };
  // Preserve the real entrypoint handler; bind its server to an ephemeral
  // loopback port for this isolated test instead of the deployment default.
  Deno.serve=handler=>(server=realServe({hostname:'127.0.0.1',port:0,onListen(){}},handler));
  await import('../../supabase/functions/ai-try-on/index.ts');
  const url='http://127.0.0.1:'+server.addr.port+'/ai-try-on';
  assert.deepEqual(await consume(await request(url,{action:'availability'}),200),{status:'unavailable',multiGarmentReady:false});
  for(const action of ['start','continue'])await consume(await request(url,{action,requestId:crypto.randomUUID(),
   figure:'female',category:'tops',garmentImage:image,submissionApproved:true,chainedApproved:true}),403);
  await consume(await realFetch(url,{method:'POST',headers:{origin},body:'{}'}),401);
  await consume(await request(url,{action:'availability'},{origin:'https://untrusted.invalid'}),403);
  assert.equal(authCalls,3);assert.equal(blockedExternal,0,'disabled entrypoint must not attempt ledger/provider traffic');
  console.log('DENO_TRYON_ENTRYPOINT '+JSON.stringify({actualDeno:true,actualLoopbackHttp:true,
   sourceApprovalDisabled:true,environmentCannotApprove:true,ledgerProviderTraffic:0,hostedGateway:false,actualProviderCalls:0}));
 }finally{
  Deno.serve=realServe;globalThis.fetch=realFetch;
  if(server)await server.shutdown();
  for(const [key,value] of old)value===undefined?Deno.env.delete(key):Deno.env.set(key,value);
 }
});

Deno.test('real Deno HTTP preserves signed top/bottom chaining and accepted replay with synthetic dependencies',async()=>{
 const env=values(),accepted=new Map(),reservations=[];let posts=0;
 const ledger={reserve:async x=>{
  reservations.push(x);
  return accepted.has(x.requestId)?{disposition:'accepted',providerJobId:accepted.get(x.requestId)}:{disposition:'submit'};
 },accept:async x=>{accepted.set(x.requestId,x.providerJobId);return {accepted:true};},unknown:async()=>({held:true})};
 const fetchImpl=async(url,options)=>{
  if(url==='https://auth.runtime.invalid/auth/v1/user')return Response.json({id:owner});
  if(url==='https://api.fashn.ai/v1/run'){
   const payload=JSON.parse(options.body);posts++;
   if(posts===2){assert.equal(payload.inputs.model_image,image);assert.equal(payload.inputs.category,'bottoms');}
   return Response.json({id:'synthetic-deno-job-'+posts});
  }
  if(url.startsWith('https://api.fashn.ai/v1/status/'))return Response.json({status:'completed',output:[image]});
  throw Error('External network forbidden');
 };
 const tokens=createPredictionTokens(()=>env.TRYON_JOB_SIGNING_KEY);
 // These approvals are injected only into this SYNTHETIC test handler.
 // Source entrypoint constants tested above remain false and unchanged.
 const handler=createTryOnHandler({env:k=>env[k],fetchImpl,ledger,...tokens,submissionApproved:true,chainedApproved:true});
 const server=Deno.serve({hostname:'127.0.0.1',port:0,onListen(){}},handler);
 try{
  const url='http://127.0.0.1:'+server.addr.port+'/ai-try-on';
  const root={action:'start',requestId:crypto.randomUUID(),figure:'female',category:'tops',garmentImage:image,
   plannedPasses:2,nextGarmentDigest:await imageDigest(image)};
  const first=await consume(await request(url,root),200);
  assert.equal((await tokens.readPrediction(first.token,owner)).step,1);
  const next={action:'continue',requestId:crypto.randomUUID(),previousToken:first.token,
   figure:'female',category:'bottoms',garmentImage:image};
  const second=await consume(await request(url,next),200);
  assert.equal((await tokens.readPrediction(second.token,owner)).step,2);
  await consume(await request(url,root),200);await consume(await request(url,next),200);
  assert.equal(posts,2,'accepted replay must not call synthetic run again');
  assert.equal(reservations[0].plannedPasses,2);
  assert.equal(reservations[0].nextGarmentDigest,await imageDigest(image));
  await consume(await request(url,{...next,previousToken:second.token}),400);
  assert.deepEqual(await consume(await request(url,{action:'status',token:second.token}),200),{status:'completed',image});
  console.log('DENO_TRYON_CHAIN '+JSON.stringify({actualDeno:true,actualLoopbackHttp:true,
   syntheticAcceptedJobs:posts,signedTwoPass:true,acceptedReplayReused:true,dependenciesSynthetic:true,
   actualProviderCalls:0,actualDatabase:false,hostedGateway:false,actualPhone:false}));
 }finally{await server.shutdown();}
});
