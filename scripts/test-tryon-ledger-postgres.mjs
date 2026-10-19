// REAL disposable PostgreSQL; SYNTHETIC provider; never hosted Supabase.
import {execFile} from 'node:child_process';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {submitReservedTryOn,createSubmissionLedger} from '../supabase/functions/ai-try-on/submission.mjs';
if(process.env.PGHOST!=='127.0.0.1'||process.env.PGDATABASE!=='closet_tryon_test')
 throw Error('Refusing non-disposable database');
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
function db(sql){return new Promise((resolve,reject)=>{
 const proc=execFile('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{timeout:15000},(error,stdout)=>{
  if(error)return reject(Error('Disposable SQL rejected: '+error.message));resolve(stdout.trim());
 });proc.stdin.end(sql);
});}
const q=x=>x==null?'null':typeof x==='number'?String(x):"'"+String(x).replaceAll("'","''")+"'";
async function rpc(name,args){
 const values=Object.values(args).map(q).join(',');
 return JSON.parse(await db(`set role service_role; select public.${name}(${values});`));
}
const reserve=(owner=A,request=randomUUID(),extra={})=>rpc('reserve_closet_tryon',{
 p_owner:owner,p_request:request,p_fingerprint:'a'.repeat(64),p_stage:1,p_figure:'female',p_category:'tops',p_parent:null,p_passes:1,p_next:null,p_garment:'a'.repeat(64),...extra});
const finish=(owner,request,provider)=>rpc('finish_closet_tryon',{p_owner:owner,p_request:request,p_provider:provider});
const reset=async(perOwner,global)=>db(`truncate closet_tryon_internal.jobs;
 update closet_tryon_internal.limits set enabled=true,per_owner_24h=${perOwner},global_24h=${global};`);
await db('create role anon; create role authenticated; create role service_role;');
await db(readFileSync('supabase/design/tryon-submission-ledger.DRAFT.sql','utf8'));
assert.equal((await reserve()).disposition,'disabled','draft quotas default to disabled/zero');
for(const role of ['anon','authenticated']){
 await assert.rejects(db(`set role ${role};select public.reserve_closet_tryon('${A}','${randomUUID()}','${'a'.repeat(64)}',1,'female','tops',null,1,null,'${'a'.repeat(64)}');`));
 await assert.rejects(db(`set role ${role};select * from closet_tryon_internal.jobs;`));
 await assert.rejects(db(`set role ${role};select public.hold_closet_tryon('${A}','${randomUUID()}');`));
 await assert.rejects(db(`set role ${role};select public.finish_closet_tryon('${A}','${randomUUID()}','synthetic-provider-12345');`));
}
await assert.rejects(db('set role service_role;update closet_tryon_internal.limits set enabled=true;'));
await reset(1,100);
assert.equal((await reserve(A,randomUUID(),{p_passes:2,p_next:'a'.repeat(64)})).disposition,'quota','both units required before first POST');
assert.equal(await db('select count(*) from closet_tryon_internal.jobs;'),'0');
await reset(2,2);
const prepaid=randomUUID();
assert.equal((await reserve(A,prepaid,{p_passes:2,p_next:'a'.repeat(64)})).disposition,'submit');
await finish(A,prepaid,'prepaid-first-12345');
assert.equal((await reserve(B)).disposition,'quota','root holds both global units');
assert.equal((await reserve(A,randomUUID(),{p_stage:2,p_category:'bottoms',p_parent:'prepaid-first-12345',p_garment:'b'.repeat(64)})).disposition,'invalid','only preselected second garment allowed');
assert.equal((await reserve(A,randomUUID(),{p_stage:2,p_category:'bottoms',p_parent:'prepaid-first-12345'})).disposition,'submit','prepaid second pass works at full cap');
assert.equal(await db('select sum(charge_units) from closet_tryon_internal.jobs;'),'2','continuation cannot double-charge quota');
await reset(2,100);
let batch=await Promise.all(Array.from({length:16},()=>reserve()));
assert.equal(batch.filter(x=>x.disposition==='submit').length,2,'per-owner concurrent quota');
assert.equal(batch.filter(x=>x.disposition==='quota').length,14);
await reset(20,3);
batch=await Promise.all(Array.from({length:16},()=>reserve(randomUUID())));
assert.equal(batch.filter(x=>x.disposition==='submit').length,3,'global concurrent quota');
await reset(20,100);
const request=randomUUID(),rootPlan={p_passes:2,p_next:'a'.repeat(64)};
batch=await Promise.all(Array.from({length:12},()=>reserve(A,request,rootPlan)));
assert.equal(batch.filter(x=>x.disposition==='submit').length,1,'one reservation across server instances');
assert.equal(batch.filter(x=>x.disposition==='hold').length,11,'pending/crashed attempts cannot resubmit');
await finish(A,request,'synthetic-first-12345');
assert.equal((await reserve(A,request,rootPlan)).providerJobId,'synthetic-first-12345');
assert.equal((await reserve(A,request,{...rootPlan,p_fingerprint:'b'.repeat(64)})).disposition,'conflict');
await assert.rejects(finish(B,request,'foreign-job-123456'));
await rpc('hold_closet_tryon',{p_owner:B,p_request:request});
assert.equal((await reserve(A,request,rootPlan)).disposition,'accepted','foreign hold cannot alter owner reservation');
const second={p_stage:2,p_category:'bottoms',p_parent:'synthetic-first-12345'};
batch=await Promise.all(Array.from({length:12},()=>reserve(A,randomUUID(),second)));
assert.equal(batch.filter(x=>x.disposition==='submit').length,1,'one continuation despite DIFFERENT request UUIDs');
assert.equal(batch.filter(x=>x.disposition==='hold').length,11);
const secondRequest=await db("select request_id from closet_tryon_internal.jobs where stage=2;");
await finish(A,secondRequest,'synthetic-second-12345');
assert.equal((await reserve(A,randomUUID(),second)).providerJobId,'synthetic-second-12345');
assert.equal((await reserve(A,randomUUID(),{...second,p_fingerprint:'b'.repeat(64)})).disposition,'conflict');
assert.equal((await reserve(B,randomUUID(),second)).disposition,'invalid','foreign predecessor blocked');
assert.equal((await reserve(B,randomUUID(),{...second,p_parent:'synthetic-second-12345'})).disposition,'invalid');
assert.equal(await db('select count(*) from closet_tryon_internal.jobs;'),'2','replays consume no extra reservations');
// Actual coordinator + SDK-shaped adapter + actual SQL, with synthetic run().
await reset(20,100);
const ledger=createSubmissionLedger({rpc:async(name,args)=>({data:await rpc(name,args),error:null})});
const input={owner:A,requestId:randomUUID(),stage:1,figure:'female',category:'tops',
 modelImage:'https://licensed.example/figure.jpg',garmentImage:'data:image/jpeg;base64,'+'Ab9/'.repeat(40)};
let providerCalls=0;
const options={enabled:true,ledger,run:async()=>{providerCalls++;return {id:'coordinator-job-12345'};}};
await Promise.allSettled(Array.from({length:10},()=>submitReservedTryOn(input,options)));
assert.equal(providerCalls,1);
assert.equal((await submitReservedTryOn(input,options)).reused,true);
assert.equal(providerCalls,1);
// Simulate acceptance COMMITTED in PostgreSQL but its network reply was lost.
const committedInput={...input,requestId:randomUUID()};
const responseLost={...ledger,accept:async x=>{await ledger.accept(x);throw Error('synthetic response loss');}};
await assert.rejects(submitReservedTryOn(committedInput,{enabled:true,ledger:responseLost,
 run:async()=>{providerCalls++;return {id:'committed-job-12345'};}}),/unresolved/);
const committedCount=providerCalls;
assert.equal((await submitReservedTryOn(committedInput,options)).providerJobId,'committed-job-12345');
assert.equal(providerCalls,committedCount,'lost commit acknowledgment reuses accepted job');
await reset(1,100);
const uncertain={...input,requestId:randomUUID()};
await assert.rejects(submitReservedTryOn(uncertain,{...options,run:async()=>{providerCalls++;throw Error('synthetic timeout');}}),/unresolved/);
const before=providerCalls;
await assert.rejects(submitReservedTryOn(uncertain,options),/unresolved/);
assert.equal(providerCalls,before,'unknown outcome never repeats billable submit');
assert.equal((await reserve()).disposition,'quota','uncertain attempts retain quota');
assert.equal(await db("select state from closet_tryon_internal.jobs;"),'unknown');
console.log('TRYON_DISPOSABLE_POSTGRES '+JSON.stringify({
 actualPostgres:true,actualSupabaseSdk:false,liveSupabase:false,actualProviderCalls:0,
 perOwnerRace:true,globalRace:true,sameRequestRace:true,changedRequestContinuationReplay:true,
 crossOwnerIsolation:true,unknownOutcomeHeld:true,lostCommitAcknowledgmentSafe:true,quotaDefaultsDisabled:true,
 browserRolesDenied:true,wholeOutfitBudgetPrepaid:true,continuationBoundToSelectedPhoto:true,coordinatorConcurrentSyntheticRuns:1
}));
