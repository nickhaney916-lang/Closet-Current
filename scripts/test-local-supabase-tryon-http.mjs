// Real LOCAL Supabase Auth/PostgREST/SDK + real loopback HTTP handler.
// ALL FASHN traffic is intercepted before network access. No hosted project.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import assert from 'node:assert/strict';
import {createTryOnHandler,createRpcTransport} from '../supabase/functions/ai-try-on/http.mjs';
import {createPredictionTokens} from '../supabase/functions/ai-try-on/job-tokens.mjs';
import {createSubmissionLedger,imageDigest} from '../supabase/functions/ai-try-on/submission.mjs';
const base=(process.env.API_URL||'').replace(/\/$/,'');
if(process.env.CI!=='true'||!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)||
 !process.env.ANON_KEY||!process.env.SERVICE_ROLE_KEY||!process.env.LOCAL_SDK_ROOT||!process.env.DB_URL)
 throw Error('Refusing a non-local Supabase integration environment');
const dbUrl=new URL(process.env.DB_URL);
if(!['127.0.0.1','localhost'].includes(dbUrl.hostname))throw Error('Refusing non-local SQL');
function db(sql){return new Promise((resolve,reject)=>{
 const child=execFile('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{timeout:15000,env:{...process.env,
  PGHOST:dbUrl.hostname,PGPORT:dbUrl.port,PGUSER:decodeURIComponent(dbUrl.username),
  PGPASSWORD:decodeURIComponent(dbUrl.password),PGDATABASE:dbUrl.pathname.slice(1)}},(err,out)=>{
   if(err)return reject(Error('Disposable local SQL failed (private details withheld)'));resolve(out.trim());
  });child.stdin.end(sql);
});}
const require=createRequire(resolve(process.env.LOCAL_SDK_ROOT,'tryon-bootstrap.cjs'));
const {createClient}=require('@supabase/supabase-js');
const config={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(base,process.env.SERVICE_ROLE_KEY,config),anon=createClient(base,process.env.ANON_KEY,config);
const users=[];
function data(result,label){if(result.error)throw Error(label+' failed (private details withheld)');return result.data;}
async function owner(){
 const email='tryon-local-'+randomUUID()+'@example.invalid',password='Synthetic-local-test-only-2026!';
 const made=data(await admin.auth.admin.createUser({email,password,email_confirm:true}),'local create');
 users.push(made.user.id);const client=createClient(base,process.env.ANON_KEY,config);
 const login=data(await client.auth.signInWithPassword({email,password}),'local sign in');
 return {id:made.user.id,token:login.session.access_token,client};
}
const image='data:image/jpeg;base64,'+'Ab9/'.repeat(40);
const origin='https://closet-current.test';let server,providerPosts=0,timeoutProvider=false,authReads=0,rpcCalls=0;
try{
 const a=await owner(),b=await owner();
 const args={p_owner:a.id,p_request:randomUUID(),p_fingerprint:'a'.repeat(64),p_stage:1,
  p_figure:'female',p_category:'tops',p_parent:null,p_passes:1,p_next:null,p_garment:await imageDigest(image)};
 // Real SDK RPC against real PostgREST; quotas are initially disabled/zero.
 assert.equal(data(await admin.rpc('reserve_closet_tryon',args),'service SDK RPC').disposition,'disabled');
 assert.ok((await a.client.rpc('reserve_closet_tryon',args)).error,'ordinary signed-in client denied');
 assert.ok((await anon.rpc('reserve_closet_tryon',args)).error,'anonymous client denied');
 await db('update closet_tryon_internal.limits set enabled=true,per_owner_24h=2,global_24h=2;');
 const values={SUPABASE_URL:base,SUPABASE_ANON_KEY:process.env.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:process.env.SERVICE_ROLE_KEY,
  TRYON_ENABLED:'true',TRYON_LEDGER_ENABLED:'true',TRYON_MULTI_ENABLED:'true',TRYON_ALLOWED_ORIGIN:origin,
  TRYON_PILOT_USER_IDS:a.id+','+b.id,TRYON_JOB_SIGNING_KEY:'synthetic-local-signing-key-not-used-outside-ci',
  FASHN_API_KEY:'synthetic-key-never-sent-to-provider',TRYON_FEMALE_MODEL_IMAGE_URL:'https://licensed.example/female.jpg',
  TRYON_MALE_MODEL_IMAGE_URL:'https://licensed.example/male.jpg'};
 const fetchImpl=async(url,options)=>{
  if(url.startsWith(base+'/')){
   if(url.endsWith('/auth/v1/user'))authReads++;
   if(url.includes('/rest/v1/rpc/'))rpcCalls++;
   return fetch(url,options);
  }
  if(url==='https://api.fashn.ai/v1/run'){
   providerPosts++;if(timeoutProvider)throw Error('synthetic provider timeout');
   return Response.json({id:'local-synthetic-job-'+providerPosts});
  }
  if(url.startsWith('https://api.fashn.ai/v1/status/'))return Response.json({status:'completed',output:[image]});
  throw Error('Unexpected external network request blocked');
 };
 const env=name=>values[name],tokens=createPredictionTokens(()=>values.TRYON_JOB_SIGNING_KEY);
 const ledger=createSubmissionLedger(createRpcTransport({env,fetchImpl}));
 const handler=createTryOnHandler({env,fetchImpl,ledger,...tokens,submissionApproved:true,chainedApproved:true});
 server=createServer(async(req,res)=>{
  try{
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const response=await handler(new Request('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,body:Buffer.concat(chunks)}));
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Local test handler failed');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/ai-try-on';
 const request=(body,token=a.token)=>fetch(url,{method:'POST',headers:{origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 // The actual deployed construction stays unapproved even with every env flag.
 const off=createTryOnHandler({env,fetchImpl,ledger,...tokens});
 const offResponse=await off(new Request(url,{method:'POST',headers:{origin,Authorization:'Bearer '+a.token},body:JSON.stringify({action:'availability'})}));
 assert.equal((await offResponse.json()).status,'unavailable');assert.equal(providerPosts,0);
 const root={action:'start',requestId:randomUUID(),figure:'female',category:'tops',garmentImage:image,
  plannedPasses:2,nextGarmentDigest:await imageDigest(image)};
 const firstResponse=await request(root);assert.equal(firstResponse.status,200,'real HTTP start with local Auth/RPC');
 const first=await firstResponse.json();assert.equal(providerPosts,1);
 assert.equal(await db('select sum(charge_units) from closet_tryon_internal.jobs;'),'2');
 assert.equal((await request(root)).status,200);assert.equal(providerPosts,1,'HTTP replay reuses real SQL job');
 const next={action:'continue',requestId:randomUUID(),previousToken:first.token,figure:'female',category:'bottoms',garmentImage:image};
 assert.equal((await request(next,b.token)).status,400,'real second signed-in account cannot use predecessor');
 const other={...root,requestId:randomUUID(),plannedPasses:1,nextGarmentDigest:null};
 assert.equal((await request(other,b.token)).status,503,'global pair budget already held');
 assert.equal((await request({...next,garmentImage:image.replace('Ab9/','Cb9/')})).status,503,'changed second garment cannot spend reserved slot');
 assert.equal(providerPosts,1);
 const finalResponse=await request(next);assert.equal(finalResponse.status,200,'prepaid continuation works at global cap');
 const final=await finalResponse.json();assert.equal(providerPosts,2);
 assert.equal((await request({...next,requestId:randomUUID()})).status,200);
 assert.equal(providerPosts,2,'changed request ID does not bypass parent replay protection');
 assert.equal((await request({...next,previousToken:final.token})).status,400,'no third pass');
 assert.equal((await request(other)).status,503);assert.equal(providerPosts,2);
 assert.equal((await request({action:'status',token:final.token})).status,200);
 assert.equal((await request(root,'invalid.token')).status,401,'actual Auth rejects forged access token');
 assert.equal(await db('select sum(charge_units) from closet_tryon_internal.jobs;'),'2');
 await db('truncate closet_tryon_internal.jobs;update closet_tryon_internal.limits set per_owner_24h=1,global_24h=1;');
 timeoutProvider=true;const uncertain={...other,requestId:randomUUID()};
 assert.equal((await request(uncertain)).status,503);const count=providerPosts;
 assert.equal((await request(uncertain)).status,503);assert.equal(providerPosts,count,'uncertain HTTP retry stays blocked');
 assert.equal(await db('select state from closet_tryon_internal.jobs;'),'unknown');
 assert.ok(authReads>0&&rpcCalls>0);
 console.log('LOCAL_SUPABASE_TRYON_HTTP '+JSON.stringify({actualSdk:true,actualLocalAuth:true,actualLocalPostgREST:true,
  actualLoopbackHttp:true,wholeOutfitBudgetReserved:true,selectedSecondGarmentBound:true,globalCapRespected:true,
  repeatedStartReused:true,changedRequestContinuationReused:true,crossAccountTokenRejected:true,
  unknownOutcomeNeverResubmitted:true,deploymentDefaultDisabled:true,hostedSupabase:false,
  actualProviderCalls:0,actualPhone:false}));
}finally{
 if(server)await new Promise(resolve=>server.close(resolve));
 for(const id of users)await admin.auth.admin.deleteUser(id);
}
