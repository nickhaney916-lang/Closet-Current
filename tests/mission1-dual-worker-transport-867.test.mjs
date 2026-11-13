/** Mission 1 P867 — synthetic Worker transport exceptions, never real image accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browserRequest82} from '../public/dual-core-82.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';

test('P867 synchronous worker postMessage DataCloneError closes worker and releases busy state',async()=>{
 const saved=globalThis.Worker;let constructed=0,terminated=0;
 class FakeWorker{
  constructor(){this.seq=++constructed;}
  postMessage(request){
   if(this.seq===1)throw Error('Synthetic DataCloneError');
   queueMicrotask(()=>this.onmessage?.({data:{requestId:request.requestId,type:'error',code:'P82_MODEL_UNAVAILABLE'}}));
  }
  terminate(){terminated++;}
 }
 globalThis.Worker=FakeWorker;
 try{
  await assert.rejects(browserRequest82({requestId:'synthetic-post-fail'},{timeoutMs:200}),/P82_REQUEST_UNDELIVERABLE/);
  assert.equal(constructed,1);assert.equal(terminated,1,'failed transport must be closed immediately');
  await assert.rejects(browserRequest82({requestId:'synthetic-retry'},{timeoutMs:200}),/P82_MODEL_UNAVAILABLE/);
  assert.equal(constructed,2,'second request must not fail as P82_BUSY');
  assert.equal(terminated,2);
 }finally{if(saved===undefined)delete globalThis.Worker;else globalThis.Worker=saved;}
});
test('P867 progress UI exception cannot strand worker, even if terminate throws',async()=>{
 const saved=globalThis.Worker;let created=0,terminations=0;
 class FakeWorker{
  constructor(){this.seq=++created;}
  postMessage(request){queueMicrotask(()=>this.onmessage?.({data:{
   requestId:request.requestId,type:this.seq===1?'progress':'error',
   stage:'models-loading',code:'P82_MODEL_UNAVAILABLE'
  }}));}
  terminate(){terminations++;if(this.seq===1)throw Error('Synthetic broken terminate');}
 }
 globalThis.Worker=FakeWorker;
 try{
  await assert.rejects(browserRequest82({requestId:'synthetic-progress-fail'},{
   timeoutMs:200,onProgress:()=>{throw Error('Synthetic stale UI');}
  }),/P82_PROGRESS_FAILURE/);
  assert.equal(terminations,1);
  await assert.rejects(browserRequest82({requestId:'synthetic-after-progress'},{timeoutMs:200}),/P82_MODEL_UNAVAILABLE/);
  assert.equal(created,2);assert.equal(terminations,2);
 }finally{if(saved===undefined)delete globalThis.Worker;else globalThis.Worker=saved;}
});
test('P867 cancel ends request, terminates worker, and allows immediate retry',async()=>{
 const saved=globalThis.Worker;let created=0,terminated=0;
 class FakeWorker{
  constructor(){this.seq=++created;}
  postMessage(request){if(this.seq!==1)queueMicrotask(()=>this.onmessage?.({data:{requestId:request.requestId,type:'error',code:'P82_MODEL_UNAVAILABLE'}}));}
  terminate(){terminated++;}
 }
 globalThis.Worker=FakeWorker;
 try{
  const controller=new AbortController();
  const promise=browserRequest82({requestId:'synthetic-cancel'},{signal:controller.signal,timeoutMs:200});
  controller.abort();
  await assert.rejects(promise,/P82_CANCELLED/);
  await assert.rejects(browserRequest82({requestId:'synthetic-retry-after-cancel'},{timeoutMs:200}),/P82_MODEL_UNAVAILABLE/);
  assert.equal(created,2);assert.equal(terminated,2);
 }finally{if(saved===undefined)delete globalThis.Worker;else globalThis.Worker=saved;}
});
test('P867 transport does not touch default review, source original or research release gate',async()=>{
 const [app,source]=await Promise.all([readFile('public/app.js','utf8'),readFile('public/dual-core-82.mjs','utf8')]);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/Original photo kept/);
 assert.match(source,/P82_REQUEST_UNDELIVERABLE/);
 assert.match(source,/P82_PROGRESS_FAILURE/);
 assert.match(source,/worker\.terminate\(\)/);
 const gate=evaluateMission1Evidence(null);
 assert.equal(gate.status,'BLOCKED');assert.equal(gate.shouldLiftFamilyAlphaHold,false);
});
