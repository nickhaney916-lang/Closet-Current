// Executes the actual staged TypeScript handler under Node's type stripping.
// Auth and provider transport are synthetic; no Deno server or network starts.
import test from 'node:test';
import assert from 'node:assert/strict';

test('actual handler: signed jobs, user isolation, failure normalization and paid-chain hard stop',async()=>{
 const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno;
 const env=new Map(Object.entries({
  SUPABASE_URL:'https://auth.synthetic.invalid',SUPABASE_ANON_KEY:'fake-public-key',
  TRYON_ALLOWED_ORIGIN:'https://closet.synthetic.invalid',TRYON_ENABLED:'true',
  TRYON_MULTI_ENABLED:'true',TRYON_PILOT_USER_IDS:'pilot-a,pilot-b',
  FASHN_API_KEY:'synthetic-provider-key',TRYON_JOB_SIGNING_KEY:'synthetic-signing-key-never-a-real-secret',
  TRYON_FEMALE_MODEL_IMAGE_URL:'https://models.synthetic.invalid/female.jpg',
  TRYON_MALE_MODEL_IMAGE_URL:'https://models.synthetic.invalid/male.jpg'
 }));
 let handler,providerCalls=0,status='processing';
 const image='data:image/jpeg;base64,'+'Ab9/'.repeat(40);
 globalThis.Deno={env:{get:key=>env.get(key)},serve:fn=>{handler=fn}};
 globalThis.fetch=async(url,options)=>{
  if(url==='https://auth.synthetic.invalid/auth/v1/user'){
   const bearer=options.headers.Authorization;
   if(bearer==='Bearer expired')return Response.json({error:'expired'},{status:401});
   return Response.json({id:bearer==='Bearer pilot-b'?'pilot-b':bearer==='Bearer outsider'?'outsider':'pilot-a'});
  }
  assert.ok(url.startsWith('https://api.fashn.ai/v1/'),'unexpected network target');
  providerCalls++;
  if(options.method==='POST'){
   const body=JSON.parse(options.body);
   assert.equal(body.inputs.garment_image,image);
   assert.equal(body.inputs.model_image,'https://models.synthetic.invalid/female.jpg');
   assert.equal(body.inputs.return_base64,true);
   return Response.json({id:'synthetic-provider-job-123'});
  }
  return Response.json(status==='completed'?{status,output:[image]}:
   status==='failed'?{status,error:{message:'private provider details'}}:{status});
 };
 const request=(body,bearer='pilot-a',origin='https://closet.synthetic.invalid')=>handler(new Request('https://edge.synthetic.invalid',{
  method:'POST',headers:{origin,authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify(body)
 }));
 try{
  await import('../supabase/functions/ai-try-on/index.ts');
  assert.equal(typeof handler,'function');
  const availability=await request({action:'availability'});
  assert.deepEqual(await availability.json(),{status:'ready',multiGarmentReady:false});
  assert.equal(providerCalls,0,'readiness must not contact provider');
  assert.equal((await request({action:'start'},'outsider')).status,403);
  assert.equal((await request({action:'start'},'expired')).status,401);
  assert.equal((await request({action:'start'},'pilot-a','https://evil.invalid')).status,403);
  assert.equal(providerCalls,0);
  const start=await request({action:'start',figure:'female',category:'tops',garmentImage:image});
  assert.equal(start.status,200);
  const job=await start.json();assert.ok(job.token.includes('.'));
  const beforeStatus=providerCalls;
  assert.equal((await request({action:'status',token:job.token},'pilot-b')).status,400);
  const tampered=job.token.slice(0,-8)+'AAAAAAAA';
  assert.equal((await request({action:'status',token:tampered})).status,400);
  assert.equal(providerCalls,beforeStatus,'foreign and tampered tokens cannot poll provider');
  assert.deepEqual(await (await request({action:'status',token:job.token})).json(),{status:'processing'});
  status='completed';
  const complete=await request({action:'status',token:job.token});
  assert.equal(complete.headers.get('cache-control'),'no-store');
  assert.deepEqual(await complete.json(),{status:'completed',image});
  const beforeContinue=providerCalls;
  assert.equal((await request({action:'continue',previousToken:job.token,
   figure:'female',category:'bottoms',garmentImage:image})).status,403);
  assert.equal(providerCalls,beforeContinue,'even configured flags cannot activate the paid second pass');
  status='failed';
  assert.deepEqual(await (await request({action:'status',token:job.token})).json(),{status:'failed'});
  env.set('TRYON_ENABLED','false');
  assert.deepEqual(await (await request({action:'availability'})).json(),{status:'unavailable',multiGarmentReady:false});
  assert.equal((await request({action:'start',figure:'female',category:'tops',garmentImage:image})).status,403);
 }finally{
  globalThis.fetch=originalFetch;
  if(originalDeno===undefined)delete globalThis.Deno;else globalThis.Deno=originalDeno;
 }
});
