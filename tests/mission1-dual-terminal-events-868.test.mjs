/** Mission 1 P868: synthetic late Worker callbacks; does not measure clothing accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browserRequest82} from '../public/dual-core-82.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';

test('P868 aborted worker cannot deliver late progress, error, or success to revoked owner',async()=>{
 const originalWorker=globalThis.Worker;
 let lastWorker=null,issued=0,progress=0,terminations=0;
 class FakeWorker{
  constructor(){lastWorker=this;issued++;}
  postMessage(request){
   if(issued>1)queueMicrotask(()=>this.onmessage?.({data:{requestId:request.requestId,type:'error',code:'P82_MODEL_UNAVAILABLE'}}));
  }
  terminate(){terminations++;}
 }
 globalThis.Worker=FakeWorker;
 try{
  const controller=new AbortController();
  const pending=browserRequest82({requestId:'synthetic-late-after-abort'},{
   signal:controller.signal,timeoutMs:250,onProgress:()=>progress++
  });
  const delayedMessage=lastWorker.onmessage,delayedError=lastWorker.onerror;
  controller.abort();
  await assert.rejects(pending,/P82_CANCELLED/);
  assert.equal(lastWorker.onmessage,null);
  assert.equal(lastWorker.onerror,null);
  delayedMessage({data:{requestId:'synthetic-late-after-abort',type:'progress',stage:'Stale owner progress'}});
  delayedMessage({data:{requestId:'synthetic-late-after-abort',type:'result',output:{}}});
  delayedError({message:'stale worker error'});
  assert.equal(progress,0,'revoked callback must not update owner status');
  await assert.rejects(browserRequest82({requestId:'synthetic-next-owner-request'},{timeoutMs:250}),/P82_MODEL_UNAVAILABLE/);
  assert.equal(issued,2);assert.equal(terminations,2);
 }finally{if(originalWorker===undefined)delete globalThis.Worker;else globalThis.Worker=originalWorker;}
});

test('P868 timeout and broken terminate still detach and silence old worker listeners',async()=>{
 const originalWorker=globalThis.Worker;
 let instance,progress=0;
 class FakeWorker{
  constructor(){instance=this;}
  postMessage(){}
  terminate(){throw Error('Synthetic broken terminate');}
 }
 globalThis.Worker=FakeWorker;
 try{
  const pending=browserRequest82({requestId:'synthetic-timed-out'},{
   timeoutMs:8,onProgress:()=>progress++
  });
  const delayed=instance.onmessage;
  await assert.rejects(pending,/P82_TIMEOUT/);
  assert.equal(instance.onmessage,null);assert.equal(instance.onerror,null);
  delayed({data:{requestId:'synthetic-timed-out',type:'progress',stage:'Stale result'}});
  assert.equal(progress,0);
 }finally{if(originalWorker===undefined)delete globalThis.Worker;else globalThis.Worker=originalWorker;}
});

test('P868 original-photo review-first and Alpha HOLD remain enforced',async()=>{
 const [source,app]=await Promise.all([
  readFile('public/dual-core-82.mjs','utf8'),readFile('public/app.js','utf8')
 ]);
 assert.match(source,/if\(finished\|\|data\?\.requestId!==request\.requestId\)return/);
 assert.match(source,/worker\.onmessage=null;worker\.onerror=null/);
 assert.match(app,/^const reviewFirst836=true;$/m);
 const gate=evaluateMission1Evidence(null);
 assert.equal(gate.status,'BLOCKED');
 assert.equal(gate.shouldLiftFamilyAlphaHold,false);
});
