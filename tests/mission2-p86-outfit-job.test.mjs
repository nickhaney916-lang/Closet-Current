import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createOutfitJob86} from '../research/mission2-p86/outfit-job.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
function setup(){
 const state={ownerId:'owner-a',sessionEpoch:1,wardrobeRevision:2,boardRevision:3,
 active:true,researchOptIn:true,slots:{top:'dress',bottom:'pants',layer:'coat',shoes:'pair'}};
 const original=new Uint8Array([1,2,3]);const disposed=[];const requests=[];
 const adapters={readState:()=>state,sha256:async b=>digest(b),
 readOriginal:async ({ownerId,itemId})=>({ownerId,itemId,ownerConfirmed:true,bytes:original,sha256:digest(original)}),
 reconstruct:async r=>{requests.push(r);return {ownerId:r.ownerId,itemId:r.itemId,sourceSHA256:r.sourceSHA256};},
 dispose:r=>disposed.push(r)};
 return {state,original,disposed,requests,adapters};
}
test('complete native outfit preserves covered bottom, layers and shoe identity; remains 2D',async()=>{
 const x=setup(),job=createOutfitJob86(x.adapters);const result=await job.run();
 assert.deepEqual(result.items.map(x=>x.slot),['top','bottom','layer','shoes']);
 assert.equal(result.items.length,4);assert.equal(result.releaseAuthorized,false);
 assert.equal(x.disposed.length,4);assert.equal(x.original.byteLength,3);
 assert.ok(x.requests.every(r=>r.bytes!==x.original));
});
for(const field of ['ownerId','sessionEpoch','wardrobeRevision','boardRevision','active','researchOptIn']){
 test('late result revoked on '+field,async()=>{
  const x=setup();let resolve;
  x.adapters.reconstruct=()=>new Promise(r=>resolve=r);
  const job=createOutfitJob86(x.adapters),pending=job.run();
  while(!resolve)await new Promise(r=>setImmediate(r));
  x.state[field]=typeof x.state[field]==='number'?99:typeof x.state[field]==='boolean'?false:'other';
  resolve({resource:true});const result=await pending;
  assert.deepEqual(result.items,[]);assert.equal(result.reason,'stale-owner-or-outfit');
  assert.equal(x.disposed.length,1);
 });
}
test('same-revision slot edit invalidates lease',async()=>{
 const x=setup();x.adapters.sha256=async b=>{x.state.slots.shoes='other';return digest(b);};
 const r=await createOutfitJob86(x.adapters).run();assert.equal(r.items.length,0);assert.equal(x.requests.length,0);
});
for(const change of ['hash','owner','review','empty'])test('reject invalid original '+change,async()=>{
 const x=setup(),read=x.adapters.readOriginal;x.adapters.readOriginal=async r=>{
 const p=await read(r);if(change==='hash')p.sha256='0'.repeat(64);if(change==='owner')p.ownerId='other';
 if(change==='review')p.ownerConfirmed=false;if(change==='empty')p.bytes=new Uint8Array();return p;};
 const r=await createOutfitJob86(x.adapters).run();assert.equal(r.items.length,0);assert.equal(x.requests.length,0);
});
test('explicit revoke aborts worker and disposes late handle once',async()=>{
 const x=setup();let resolve,signal;x.adapters.reconstruct=r=>{signal=r.signal;return new Promise(r=>resolve=r);};
 const job=createOutfitJob86(x.adapters),pending=job.run();while(!resolve)await new Promise(r=>setImmediate(r));
 job.revoke();assert.equal(signal.aborted,true);resolve({});assert.equal((await pending).items.length,0);
 assert.equal(x.disposed.length,1);
});
test('overlapping jobs keep resource cleanup separate',async()=>{
 const x=setup();let first;let call=0;
 x.adapters.reconstruct=r=>++call===1?new Promise(resolve=>first=resolve):Promise.resolve({ownerId:r.ownerId,itemId:r.itemId,sourceSHA256:r.sourceSHA256});
 const job=createOutfitJob86(x.adapters),old=job.run();while(!first)await new Promise(r=>setImmediate(r));
 const current=await job.run();first({late:true});assert.equal((await old).items.length,0);
 assert.equal(current.items.length,4);assert.equal(x.disposed.length,5);
});
