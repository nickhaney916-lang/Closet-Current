import test from 'node:test';import assert from 'node:assert/strict';
import quotaWorker,{AIPreviewQuota} from '../workers/ai-preview-quota/index.js';
const store=()=>{const rows=new Map();return {storage:{transaction:async callback=>callback({get:async k=>rows.get(k),put:async(k,v)=>{rows.set(k,v)}})}};};
const call=async(quota,path='/reserve',payload={})=>(await quota.fetch(new Request('https://quota.internal'+path,{method:'POST',body:JSON.stringify(payload)}))).json();
test('public Worker refuses quota access',async()=>assert.equal((await quotaWorker.fetch()).status,404));
test('quota allows only two reservations and issues distinct opaque identifiers',async()=>{
 const q=new AIPreviewQuota(store());
 const a=await call(q,'/reserve',{day:'2099-12-31',limit:99999}),b=await call(q),c=await call(q);
 assert.equal(a.allowed,true);assert.equal(b.allowed,true);assert.notEqual(a.reservationId,b.reservationId);
 assert.deepEqual(c,{allowed:false,remaining:0});
});
test('refund restores one credit, repeated refund cannot restore another',async()=>{
 const q=new AIPreviewQuota(store()),a=await call(q),b=await call(q);
 assert.equal((await call(q)).allowed,false);
 assert.deepEqual(await call(q,'/refund',{reservationId:a.reservationId}),{ok:true,status:'refunded'});
 assert.equal((await call(q,'/refund',{reservationId:a.reservationId})).ok,true);
 assert.equal((await call(q)).allowed,true);
 assert.equal((await call(q)).allowed,false);
 assert.deepEqual(await call(q,'/commit',{reservationId:b.reservationId}),{ok:true,status:'committed'});
 assert.equal((await call(q,'/refund',{reservationId:b.reservationId})).ok,false);
 assert.equal((await call(q)).allowed,false);
});
test('commit prevents refund and unknown IDs never change counters',async()=>{
 const q=new AIPreviewQuota(store()),a=await call(q);
 assert.equal((await call(q,'/commit',{reservationId:a.reservationId})).ok,true);
 assert.equal((await call(q,'/refund',{reservationId:a.reservationId})).ok,false);
 assert.equal((await call(q,'/refund',{reservationId:'00000000-0000-4000-8000-000000000000'})).ok,false);
 assert.equal((await call(q)).allowed,true);
 assert.equal((await call(q)).allowed,false);
});
test('non POST denied',async()=>assert.equal((await new AIPreviewQuota(store()).fetch(new Request('https://quota.internal/reserve'))).status,405));
