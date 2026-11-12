'use strict';
// MISSION 3 — execute actual app.js weekly memory controller and persistence.
// A second owner can restore the same garment ID and source JPEG: row matching
// is not independent proof that an old async result still belongs to its owner.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
function section(a,b){
 const i=app.indexOf(a),j=app.indexOf(b,i);
 assert.ok(i>=0&&j>i,'actual app section absent: '+a);
 return app.slice(i,j);
}
const weekly=section('let memoryReviewTimer=null,memoryReviewRunning=false;','closetReady.then(scheduleMemoryReview);');
const save=section('function saveMemoryReview(value){','setInterval(scheduleMemoryReview');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function context(obj){vm.createContext(obj);vm.runInContext(weekly+'\n'+save,obj);return obj;}
const ownerA='owner-a',ownerB='owner-b';
const original={id:'same-id-after-restore',image:'identical-source-jpeg',category:'Tops',itemType:'Polo',color:'Blue',confirmedDetails:{itemType:'Polo'},learningReviewedWeek:''};
const memory=()=>({version:1,modelKey:'owner-A-private-features',features:Array(512).fill(0).map((_,i)=>i===0?1:0)});
function fakeDb(owner,record,{deferRead=false}={}){
 const data=new Map([[record.id,structuredClone(record)]),pending=[];
 let transactions=0,puts=0,aborts=0;
 const db={name:'closet-current-user-'+owner,
  transaction(){
   transactions++;
   let stopped=false;
   const tx={
    objectStore:()=>({
     get(id){const req={};
      const trigger=()=>{if(stopped)return;req.result=data.get(id);req.onsuccess?.();if(!stopped)queueMicrotask(()=>tx.oncomplete?.());};
      if(deferRead)pending.push(trigger);else queueMicrotask(trigger);
      return req;
     },
     put(row){if(stopped)throw Error('transaction aborted');puts++;data.set(row.id,structuredClone(row));}
    }),
    abort(){stopped=true;aborts++;queueMicrotask(()=>tx.onabort?.());}
   };
   return tx;
  }
 };
 return {db,pending,data,get puts(){return puts;},get transactions(){return transactions;},get aborts(){return aborts;}};
}
function ownerFixture({queued}={}){
 const a=fakeDb(ownerA,original),b=fakeDb(ownerB,original);
 const ctx={
  captureOperationEpoch:0,db:a.db,window:{closetAuth:{user:{id:ownerA}}},
  queued:queued||((fn)=>fn()),
 };
 context(ctx);
 return {ctx,a,b,switchOwner(){
  ctx.captureOperationEpoch++;
  ctx.db=b.db;
  ctx.window.closetAuth.user.id=ownerB;
 }};
}
test('a queued old weekly write cannot mutate the new owner even when ID and JPEG match',async()=>{
 const hold=deferred(),f=ownerFixture({queued:async fn=>{await hold.promise;return fn();}});
 const pending=f.ctx.saveMemoryReview({...original,recognitionMemory:memory(),learningReviewedWeek:'2026-11-09'});
 f.switchOwner();hold.resolve();const result=await pending;
 assert.equal(f.b.puts,baseline?1:0);
 assert.equal(f.b.transactions,baseline?1:0);
 assert.equal(Boolean(f.b.data.get(original.id).recognitionMemory),baseline);
 if(!baseline)assert.equal(result,null);
});
test('read callback after sign-out aborts the old-owner transaction rather than storing old model result',async()=>{
 const a=fakeDb(ownerA,original,{deferRead:true}),b=fakeDb(ownerB,original);
 const ctx={captureOperationEpoch:0,db:a.db,window:{closetAuth:{user:{id:ownerA}}},queued:fn=>fn()};
 context(ctx);
 const pending=ctx.saveMemoryReview({...original,recognitionMemory:memory(),learningReviewedWeek:'2026-11-09'});
 ctx.captureOperationEpoch++;ctx.db=b.db;ctx.window.closetAuth.user.id=ownerB;
 assert.equal(a.pending.length,1);
 a.pending[0]();await pending;
 assert.equal(a.puts,baseline?1:0);
 assert.equal(a.aborts,baseline?0:1);
 assert.equal(b.puts,0);
});
test('current owner weekly save preserves latest human category/color and stores tentative features',async()=>{
 const f=ownerFixture();
 f.a.data.set(original.id,{...original,category:'Outerwear',itemType:'Jacket',color:'Green',notes:'Owner corrected details'});
 const result=await f.ctx.saveMemoryReview({...original,recognitionMemory:memory(),learningReviewedWeek:'2026-11-09'});
 assert.equal(f.a.puts,1);
 assert.equal(result.itemType,'Jacket');
 assert.equal(result.color,'Green');
 assert.equal(result.notes,'Owner corrected details');
 assert.equal(result.recognitionMemory.modelKey,'owner-A-private-features');
});
function reviewerFixture(){
 const hold=deferred(),events=[],a=fakeDb(ownerA,original),b=fakeDb(ownerB,original);
 const ctx={
  captureOperationEpoch:0,db:a.db,window:{closetAuth:{user:{id:ownerA}}},
  items:[structuredClone(original)],batch:[],
  ClothingMemory:{week:()=> '2026-11-09',valid:()=>true},
  localReady:true,localPending:new Set(),busy:false,automaticRunning:false,
  document:{hidden:false,querySelector:()=>null},
  localRequest:()=>hold.promise,
  render:()=>events.push('render'),
  saveMemoryReview:async row=>{events.push('save:'+ctx.window.closetAuth.user.id);return row;},
  setTimeout:()=>123,clearTimeout:()=>{},Date
 };
 context(ctx);
 return {ctx,hold,events,switchOwner(){
  ctx.captureOperationEpoch++;ctx.db=b.db;ctx.window.closetAuth.user.id=ownerB;
  ctx.items=[structuredClone(original)];
  vm.runInContext('memoryReviewRunning=false;',ctx);
  vm.runInContext('memoryReviewRunning=true;',ctx);
 }};
}
test('stale weekly model result cannot cross accounts even with identical backup ID and JPEG',async()=>{
 const f=reviewerFixture(),pending=f.ctx.reviewRecognitionMemory();
 f.switchOwner();const start=f.events.length;
 f.hold.resolve({strong:false,recognitionMemory:memory()});
 await pending;
 assert.equal(f.events.slice(start).some(x=>x.startsWith('save:')),baseline);
 assert.equal(f.events.slice(start).includes('render'),baseline);
 assert.equal(vm.runInContext('memoryReviewRunning',f.ctx),!baseline);
 assert.equal(Boolean(f.ctx.items[0].recognitionMemory),baseline);
});
test('owner switch while model setup is pending does not start old weekly features or reset new review',async()=>{
 const f=reviewerFixture(),load=deferred(),requests=[];
 f.ctx.localReady=false;f.ctx.enableLocal=()=>load.promise;f.ctx.localRequest=()=>{requests.push('features');return f.hold.promise;};
 const pending=f.ctx.reviewRecognitionMemory();
 f.switchOwner();load.resolve(true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests.length,baseline?1:0);
 f.hold.resolve({strong:false,recognitionMemory:memory()});await pending;
 assert.equal(vm.runInContext('memoryReviewRunning',f.ctx),!baseline);
});
test('previous-owner delayed weekly timer cannot clear a newer owner timer or start its review',()=>{
 const tasks=new Map(),calls=[],a=fakeDb(ownerA,original),b=fakeDb(ownerB,original);
 let id=0;
 const ctx={
  captureOperationEpoch:0,db:a.db,window:{closetAuth:{user:{id:ownerA}}},
  ClothingMemory:{},setTimeout:fn=>{tasks.set(++id,fn);return id;},clearTimeout:()=>{},
  reviewRecognitionMemory:()=>{calls.push('review');return Promise.resolve();}
 };
 context(ctx);
 ctx.reviewRecognitionMemory=()=>{calls.push('review');return Promise.resolve();};
 ctx.scheduleMemoryReview();const stale=tasks.get(1);
 assert.equal(typeof stale,'function');
 ctx.captureOperationEpoch++;ctx.db=b.db;ctx.window.closetAuth.user.id=ownerB;
 vm.runInContext('memoryReviewTimer=null;',ctx);
 ctx.scheduleMemoryReview();const next=tasks.get(2);
 assert.equal(typeof next,'function');
 stale();
 assert.equal(calls.length,baseline?1:0);
 assert.equal(vm.runInContext('memoryReviewTimer',ctx),baseline?null:2);
 next();assert.equal(calls.length,baseline?2:1);
});
