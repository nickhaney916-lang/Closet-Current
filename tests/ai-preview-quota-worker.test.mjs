import test from 'node:test';import assert from 'node:assert/strict';
import quotaWorker,{AIPreviewQuota} from '../workers/ai-preview-quota/index.js';
test('quota worker public URL cannot reserve credits',async()=>{
 assert.equal((await quotaWorker.fetch()).status,404);
});
test('durable quota reserves at most two previews per account per UTC day',async()=>{
 const state=new Map();
 const quota=new AIPreviewQuota({storage:{transaction:async callback=>callback({get:async k=>state.get(k),put:async(k,v)=>{state.set(k,v);}})}});
 const req=()=>new Request('https://quota.internal/reserve',{method:'POST',body:JSON.stringify({day:'2099-12-31',limit:99999})});
 assert.deepEqual(await (await quota.fetch(req())).json(),{allowed:true,remaining:1});
 assert.deepEqual(await (await quota.fetch(req())).json(),{allowed:true,remaining:0});
 assert.deepEqual(await (await quota.fetch(req())).json(),{allowed:false,remaining:0});
});
test('quota worker rejects non-POST methods',async()=>{
 const quota=new AIPreviewQuota({storage:{}});
 const response=await quota.fetch(new Request('https://quota.internal/reserve',{method:'GET'}));
 assert.equal(response.status,405);
});
