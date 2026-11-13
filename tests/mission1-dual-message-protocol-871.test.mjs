/** P871: fake Worker transport protocol fixtures. No model/JPEG/account access. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browserRequest82} from '../public/dual-core-82.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';

test('P871 Worker messageerror terminates promptly and a second authorized request is not busy',async()=>{
 const saved=globalThis.Worker;let created=0,terminated=0,first=null,late=null;
 class WorkerFixture{
  constructor(){this.index=++created;if(this.index===1)first=this;}
  postMessage(request){
   if(this.index===1){late=this.onmessageerror;queueMicrotask(()=>this.onmessageerror?.({type:'messageerror'}));}
   else queueMicrotask(()=>this.onmessage?.({data:{requestId:request.requestId,type:'error',code:'P82_MODEL_UNAVAILABLE'}}));
  }
  terminate(){terminated++;}
 }
 globalThis.Worker=WorkerFixture;
 try{
  await assert.rejects(browserRequest82({requestId:'decode-one'},{timeoutMs:250}),/P82_MESSAGE_DECODE_FAILURE/);
  assert.equal(first.onmessage,null);
  assert.equal(first.onerror,null);
  assert.equal(first.onmessageerror,null);
  assert.equal(terminated,1);
  await assert.rejects(browserRequest82({requestId:'decode-retry'},{timeoutMs:250}),/P82_MODEL_UNAVAILABLE/);
  assert.equal(created,2);assert.equal(terminated,2);
  // A previously queued decode event must not break the settled promise or future requests.
  late?.({type:'messageerror'});
 }finally{if(saved===undefined)delete globalThis.Worker;else globalThis.Worker=saved;}
});

test('P871 unknown same-request worker reply fails closed, rather than holding expensive inference',async()=>{
 const saved=globalThis.Worker;let created=0,progress=0,terminated=0;
 class WorkerFixture{
  constructor(){this.index=++created;}
  postMessage(request){
   queueMicrotask(()=>{
    if(this.index===1){
     this.onmessage?.({data:{requestId:request.requestId,type:'progress',stage:'Preparing'}});
     this.onmessage?.({data:{requestId:request.requestId,type:'future-unrecognized-result'}});
    }else this.onmessage?.({data:{requestId:request.requestId,type:'error',code:'P82_MODEL_UNAVAILABLE'}});
   });
  }
  terminate(){terminated++;}
 }
 globalThis.Worker=WorkerFixture;
 try{
  await assert.rejects(browserRequest82({requestId:'protocol-one'},{timeoutMs:250,onProgress:()=>progress++}),/P82_WORKER_PROTOCOL/);
  assert.equal(progress,1,'known progress events remain supported');
  assert.equal(terminated,1);
  await assert.rejects(browserRequest82({requestId:'protocol-retry'},{timeoutMs:250}),/P82_MODEL_UNAVAILABLE/);
  assert.equal(created,2);assert.equal(terminated,2);
 }finally{if(saved===undefined)delete globalThis.Worker;else globalThis.Worker=saved;}
});

test('P871 messageerror still settles request if Worker terminate itself fails',async()=>{
 const saved=globalThis.Worker;let created=0;
 class WorkerFixture{
  constructor(){this.index=++created;}
  postMessage(request){queueMicrotask(()=>this.index===1?this.onmessageerror?.({type:'messageerror'}):this.onmessage?.({data:{requestId:request.requestId,type:'error',code:'P82_MODEL_UNAVAILABLE'}}));}
  terminate(){if(this.index===1)throw Error('synthetic broken terminate');}
 }
 globalThis.Worker=WorkerFixture;
 try{
  await assert.rejects(browserRequest82({requestId:'decode-throw'},{timeoutMs:250}),/P82_MESSAGE_DECODE_FAILURE/);
  await assert.rejects(browserRequest82({requestId:'decode-retry-throw'},{timeoutMs:250}),/P82_MODEL_UNAVAILABLE/);
  assert.equal(created,2);
 }finally{if(saved===undefined)delete globalThis.Worker;else globalThis.Worker=saved;}
});

test('P871 preserves original-photo review-first and explicit BLOCKED release gate',async()=>{
 const [source,app]=await Promise.all([readFile('public/dual-core-82.mjs','utf8'),readFile('public/app.js','utf8')]);
 assert.match(source,/worker\.onmessageerror=\(\)=>end\(Error\('P82_MESSAGE_DECODE_FAILURE'\)\)/);
 assert.match(source,/else end\(Error\('P82_WORKER_PROTOCOL'\)\)/);
 assert.match(app,/^const reviewFirst836=true;$/m);
 const result=evaluateMission1Evidence(null);
 assert.equal(result.status,'BLOCKED');
 assert.equal(result.shouldLiftFamilyAlphaHold,false);
});
