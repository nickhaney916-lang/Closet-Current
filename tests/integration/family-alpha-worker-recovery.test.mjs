// Actual #281 worker-handler tests against #283-integrated Family Alpha stage-HOLD output.
// Run only after the pinned combined candidate is built; no live workers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Synthetic worker and JPEG identifiers only. Exercise the ACTUAL browser
// controller and recognition handler from public/app.js, not copied policies.
const source=await readFile('dist-family-alpha-recognition-integration-hold/app.js','utf8');
const workerStart=source.indexOf('function stopRecognitionWorker(');
const workerEnd=source.indexOf('\nasync function enableLocal()',workerStart);
const scanStart=source.indexOf('async function recognizeItem(item){');
const scanEnd=source.indexOf('\nasync function recognizeBatch()',scanStart);
assert.ok(workerStart>=0&&workerEnd>workerStart&&scanStart>=0&&scanEnd>scanStart);
const controller=source.slice(workerStart,workerEnd);
const handler=source.slice(scanStart,scanEnd);

function workerHarness(){
 const instances=[],timers=new Map(),events=[];
 let count=0,nextTimer=0;
 class FakeWorker{
  constructor(){this.sent=[];this.terminated=false;instances.push(this);}
  postMessage(message){this.sent.push(message);}
  terminate(){this.terminated=true;}
  emit(message){this.onmessage?.({data:message});}
 }
 const context=vm.createContext({
  localJobs:new Map(),localWorker:null,localReady:true,
  recognitionUnavailable:false,recognitionAssetVersion:'',
  recognitionState:{phase:'ready',percent:null,activeId:null},
  Worker:FakeWorker,crypto:{randomUUID:()=>String(++count)},
  setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,delay});return id;},
  clearTimeout:id=>timers.delete(id),
  recordDeviceEvent:(name)=>events.push(name),
  renderRecognitionNotice(){},Date,Error
 });
 vm.runInContext(controller+'\nglobalThis.controller={request:localRequest,stop:stopRecognitionWorker};',context,{timeout:1200});
 return {
  context,instances,timers,events,
  request:(type='classify')=>context.controller.request(type,'data:image/jpeg;base64,SYNTHETIC','fixture',null),
  fireTimer(){const timer=timers.values().next().value;assert.ok(timer,'Expected a pending watchdog');timer.fn();}
 };
}

test('worker load requires ready, classify requires result',async()=>{
 const h=workerHarness();
 const load=h.request('load');
 const w=h.instances[0];assert.equal(w.sent[0].type,'load');
 w.emit({type:'ready',id:w.sent[0].id});
 assert.equal((await load).type,'ready');
 const classify=h.request();
 w.emit({type:'result',id:w.sent[1].id,strong:false,choices:[]});
 assert.equal((await classify).type,'result');
 assert.equal(h.timers.size,0);
});

test('per-photo image/decode failure preserves the loaded worker and a subsequent scan',async()=>{
 const h=workerHarness();
 const first=h.request();const w=h.instances[0];
 w.emit({type:'error',id:w.sent[0].id,code:'image',stage:'identify',text:'Could not decode this photo'});
 await assert.rejects(first,error=>error.recoverable===true);
 assert.equal(h.context.localReady,true);
 assert.equal(h.context.recognitionUnavailable,false);
 const second=h.request();
 assert.equal(h.instances.length,1,'must not restart a healthy worker for a corrupt JPEG');
 w.emit({type:'result',id:w.sent[1].id,choices:[],strong:false});
 assert.equal((await second).type,'result');
 assert.equal(h.timers.size,0);
});

test('runtime and load failures cannot be treated as recoverable image failures',async()=>{
 for(const [type,code]of [['classify','memory'],['load','image']]){
  const h=workerHarness(),promise=h.request(type),w=h.instances[0];
  w.emit({type:'error',id:w.sent[0].id,code,text:'Scanner failed'});
  await assert.rejects(promise,error=>error.recoverable===false);
  assert.equal(h.context.localReady,false);
 }
});

test('unexpected ready result for classify fails closed and rejects all outstanding requests',async()=>{
 const h=workerHarness(),first=h.request(),second=h.request();
 const [a,b]=[first.catch(e=>e),second.catch(e=>e)];
 const w=h.instances[0];w.emit({type:'ready',id:w.sent[0].id});
 const errors=await Promise.all([a,b]);
 for(const e of errors)assert.match(e.message,/unexpected response/);
 assert.equal(w.terminated,true);assert.equal(h.context.recognitionUnavailable,true);
 assert.equal(h.context.recognitionState.phase,'failed');
 assert.equal(h.context.localJobs.size,0);assert.equal(h.timers.size,0);
});

test('malformed null worker events fail promptly instead of leaving pending photos',async()=>{
 const h=workerHarness(),p=h.request().catch(e=>e),w=h.instances[0];
 w.emit(null);const error=await p;
 assert.match(error.message,/invalid response/);
 assert.equal(w.terminated,true);assert.equal(h.timers.size,0);
});

test('intermediate identified events never complete or mutate a pending scan',async()=>{
 const h=workerHarness(),p=h.request(),w=h.instances[0],id=w.sent[0].id;
 w.emit({type:'identified',id,choice:{category:'Shoes',itemType:'Sneakers'}});
 assert.equal(h.context.localJobs.size,1);
 w.emit({type:'result',id,strong:false,choices:[]});
 assert.equal((await p).type,'result');
});

test('timeout stops the old worker; stale late events cannot settle a new retry',async()=>{
 const h=workerHarness(),first=h.request().catch(e=>e),old=h.instances[0];
 h.fireTimer();
 assert.match((await first).message,/timed out/);
 assert.equal(old.terminated,true);
 assert.equal(h.context.localJobs.size,0);
 assert.equal(h.timers.size,0);
 // Simulate the explicit Retry scan user action after the failure.
 h.context.recognitionUnavailable=false;
 const retry=h.request(),fresh=h.instances[1],id=fresh.sent[0].id;
 old.emit({type:'result',id,strong:true,choices:[{category:'Shoes'}]});
 assert.equal(h.context.localJobs.size,1);
 fresh.emit({type:'result',id,strong:false,choices:[]});
 assert.equal((await retry).type,'result');
 assert.equal(h.instances.length,2);
});

function scanFixture(error,{manual=false,duplicate=false,slow=false}={}){
 const item={
  id:'synthetic-item',image:'data:image/jpeg;base64,PHOTO_A',category:'Uncategorized',
  itemType:'Unknown',color:'Blue',name:'',userAdjusted:false
 };
 let saveCount=0,classifyResolve;
 const result={strong:true,choices:[{category:'Shoes',itemType:'Sneakers',label:'sneakers'}],details:{color:'Blue'}};
 const classify=slow?new Promise(resolve=>{classifyResolve=resolve;}):null;
 const context=vm.createContext({
  window:{closetAuth:{user:{id:'owner-1'}}},db:{name:'closet-current-user-owner-1'},
  batch:[item],items:duplicate?[{id:'existing-synthetic-photo',image:item.image}]:[],recognitionState:{phase:'ready',activeId:null},
  render(){},persistDraft(){},message(){},recordDeviceEvent(){},
  localPending:new Set([item.id]),localReady:true,recognitionUnavailable:false,
  recognitionSourcePhoto:x=>x.image,
  checkPhoto:async()=>({blank:false,signature:'synthetic',aspect:1,colorEstimate:null}),
  ClothingDetails:{
   fillColor:()=>({}),fill:()=>({color:'Blue'}),validColor:x=>x==='Blue'
  },
  trustedAutomaticPhotoColor:()=>null,exactlyRepeatedCapturedItem:()=>duplicate,
  independentlyDistinctOutfitRegions:()=>true,similarPhotos:()=>false,
  localRequest:async()=>{if(error)throw error;return slow?classify:result;},
  clothingSchema:{types:{Shoes:['Sneakers']}},
  segmentationAllows:()=>true,
  applyLocalChoice:(target,choice)=>{target.category=choice.category;target.itemType=choice.itemType;},
  saveIndexed:async()=>{saveCount++;return true;},
  $:()=>({textContent:''}),Date
 });
 const fn=vm.runInContext(handler+'\nrecognizeItem',context,{timeout:1200});
 return {context,item,run:()=>fn(item),resolve:()=>classifyResolve?.(result),get saves(){return saveCount;}};
}

test('real recognition handler keeps a bad JPEG reviewable without poisoning subsequent scans',async()=>{
 const error=Object.assign(new Error('Recognition could not read image'),{recoverable:true});
 const f=scanFixture(error);await f.run();
 assert.equal(f.context.recognitionUnavailable,false);
 assert.equal(f.item.scanFailed,true);
 assert.equal(f.context.batch.includes(f.item),true);
 assert.equal(f.saves,0);
 assert.equal(f.context.localPending.size,0);
});

test('real recognition handler keeps fatal runtime errors blocked for explicit retry',async()=>{
 const f=scanFixture(Object.assign(new Error('Scanner runtime failed'),{recoverable:false}));
 await f.run();
 assert.equal(f.context.recognitionUnavailable,true);
 assert.equal(f.item.scanFailed,true);
 assert.equal(f.context.batch.length,1);
 assert.equal(f.saves,0);
});

test('user correction during a pending model request wins over its late answer',async()=>{
 const f=scanFixture(null,{slow:true});
 const running=f.run();
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 f.item.userAdjusted=true;f.item.category='Bottoms';f.item.itemType='Skirt';
 f.resolve();await running;
 assert.equal(f.item.category,'Bottoms');
 assert.equal(f.item.itemType,'Skirt');
 assert.equal(f.saves,0);
});

test('exact duplicate is removed from unfinished batch without running classification',async()=>{
 const f=scanFixture(null,{duplicate:true});
 await f.run();
 assert.equal(f.context.batch.length,0);
 assert.equal(f.saves,0);
});
