import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {submitReservedTryOn,createSubmissionLedger} from '../supabase/functions/ai-try-on/submission.mjs';
const input={owner:'a1111111-1111-4111-8111-111111111111',requestId:'b2222222-2222-4222-8222-222222222222',
 stage:1,figure:'female',category:'tops',modelImage:'https://licensed.example/standard.jpg',
 garmentImage:'data:image/jpeg;base64,'+'Ab9/'.repeat(40)};
function deps(){
 const calls=[];return {calls,enabled:true,ledger:{
  reserve:async x=>{calls.push(['reserve',x]);return {disposition:'submit'};},
  accept:async x=>{calls.push(['accept',x]);return {accepted:true};},
  unknown:async x=>{calls.push(['unknown',x]);return {held:true};}},
  run:async x=>{calls.push(['run',x]);return {id:'synthetic-job-123456'};}};
}
test('staged coordinator is disabled by default before ledger or provider calls',async()=>{
 const d=deps();delete d.enabled;
 await assert.rejects(submitReservedTryOn(input,d),/disabled/);assert.equal(d.calls.length,0);
});
test('reserves before provider, records acceptance before returning, and stores no source images',async()=>{
 const d=deps(),result=await submitReservedTryOn(input,d);
 assert.equal(result.providerJobId,'synthetic-job-123456');
 assert.deepEqual(d.calls.map(x=>x[0]),['reserve','run','accept']);
 const reservation=d.calls[0][1];assert.match(reservation.fingerprint,/^[a-f0-9]{64}$/);
 assert.equal(JSON.stringify(reservation).includes(input.garmentImage),false);
});
test('payload fingerprint changes with garment bytes and configured model',async()=>{
 const hashes=[];
 for(const override of [{},{garmentImage:input.garmentImage.replace('Ab9/','Cb9/')},{modelImage:'https://licensed.example/other.jpg'}]){
  const d=deps();await submitReservedTryOn({...input,...override},d);hashes.push(d.calls[0][1].fingerprint);
 }
 assert.equal(new Set(hashes).size,3);
});
test('accepted replay reuses a recorded job without another provider submission',async()=>{
 const d=deps();d.ledger.reserve=async()=>({disposition:'accepted',providerJobId:'earlier-job-12345'});
 assert.equal((await submitReservedTryOn(input,d)).reused,true);assert.equal(d.calls.length,0);
});
test('quota, disabled, conflict, pending and malformed ledger replies cannot submit',async()=>{
 for(const disposition of ['quota','disabled','conflict','hold','invalid','unexpected']){
  const d=deps();d.ledger.reserve=async()=>({disposition});
  await assert.rejects(submitReservedTryOn(input,d));assert.equal(d.calls.length,0);
 }
 const d=deps();d.ledger.reserve=async()=>{throw Error('storage unavailable');};
 await assert.rejects(submitReservedTryOn(input,d));assert.equal(d.calls.length,0);
});
test('ambiguous provider errors consume the reservation and are never retried',async()=>{
 const d=deps();let count=0;
 d.run=async()=>{count++;throw Error('private provider timeout payload');};
 await assert.rejects(submitReservedTryOn(input,d),/outcome is unresolved/);
 assert.equal(count,1);assert.deepEqual(d.calls.map(x=>x[0]),['reserve','unknown']);
});
test('acceptance persistence failure cannot return a success or cause resubmission',async()=>{
 for(const fail of [async()=>{throw Error('database timeout');},async()=>({accepted:false})]){
  const d=deps();d.ledger.accept=fail;
  await assert.rejects(submitReservedTryOn(input,d),/outcome is unresolved/);
  assert.equal(d.calls.filter(x=>x[0]==='run').length,1);
  assert.equal(d.calls.at(-1)[0],'unknown');
 }
});
test('failure to mark unknown still never resubmits the reserved job',async()=>{
 const d=deps();d.run=async()=>{throw Error('timeout');};d.ledger.unknown=async()=>{throw Error('offline');};
 await assert.rejects(submitReservedTryOn(input,d),/unresolved/);
});
test('invalid ownership, continuation shape and absent durable dependencies reject before provider',async()=>{
 for(const override of [{owner:null},{requestId:'bad'},{stage:2},{category:'shoes'},{stage:1,parentJobId:'earlier-job-12345'}]){
  const d=deps();await assert.rejects(submitReservedTryOn({...input,...override},d),/Invalid/);assert.equal(d.calls.length,0);
 }
 await assert.rejects(submitReservedTryOn(input,{enabled:true}),/ledger unavailable/);
});
test('server SDK adapter propagates errors and uses only server RPCs',async()=>{
 const calls=[];
 const ledger=createSubmissionLedger({rpc:async(name,args)=>{calls.push({name,args});return {data:{accepted:true},error:null};}});
 await ledger.accept({owner:input.owner,requestId:input.requestId,providerJobId:'synthetic-job-12345'});
 assert.equal(calls[0].name,'finish_closet_tryon');assert.equal(calls[0].args.p_owner,input.owner);
 const broken=createSubmissionLedger({rpc:async()=>({data:null,error:{message:'sensitive database details'}})});
 await assert.rejects(broken.reserve({}),/^Error: Durable submission ledger unavailable$/);
});
test('paid entrypoint stays hard disabled for chaining and does not import staged coordinator',()=>{
 const source=readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(source,/CHAINED_PAID_INFERENCE_APPROVED=false/);
 assert.doesNotMatch(source,/submission\.mjs/);
});
