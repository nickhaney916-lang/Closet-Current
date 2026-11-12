'use strict';
// Mission 3: regression against extracted, unmodified application functions.
// Baseline comparisons must demonstrate stale account state; patched code
// must preserve only the active owner's scanner and private saved roster.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
function section(a,b){const i=app.indexOf(a),j=app.indexOf(b,i);assert.ok(i>=0&&j>i,'application section '+a);return app.slice(i,j);}
const recognizeSource=section('async function recognizeItem(item){','async function recognizeBatch(){');
const saveSource=section('async function saveIndexed(item,index04ApprovedOwner=null){','async function recognizeItem(item){');
const setupSource=section('async function enableLocal(){','function segmentationAllows(');
const queueSource=section('async function drainAutomatic(){','function stopCamera(){');
const lockSource=section("window.addEventListener('closet:session-locked',()=>{",'function message(t){');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
const old={id:'owner-a-garment',image:'data:image/jpeg;base64,old',name:'Old sweater',category:'Tops',color:'Blue'};
const next={id:'owner-b-garment',image:'data:image/jpeg;base64,next',name:'New shirt',category:'Tops',color:'Red'};
function context(obj){vm.createContext(obj);return obj;}
test('old photo quality completion cannot persist a new account draft or render old analysis',async()=>{
 const quality=deferred(),events=[],ctx=context({
  captureOperationEpoch:0,recognitionState:{activeId:null,phase:'idle'},batch:[old],items:[],
  localPending:new Set([old.id]),recognitionUnavailable:false,
  checkPhoto:()=>quality.promise,Date,render:()=>events.push('render'),
  persistDraft:()=>events.push('persist'),message:v=>events.push('message:'+v)
 });
 vm.runInContext(recognizeSource,ctx);
 const op=ctx.recognizeItem({...old}); // use the exact same row object below
 // Re-run with the correctly matched batch row so this checks the await fence.
 const item=ctx.batch[0],op2=ctx.recognizeItem(item);
 ctx.captureOperationEpoch=1;ctx.batch=[{...next}];ctx.items=[];ctx.localPending=new Set([next.id]);
 const before=events.length;quality.resolve({blank:false,signature:'quality',aspect:1,colorEstimate:null});
 await Promise.all([op,op2]);
 const after=events.slice(before);
 assert.equal(after.includes('persist'),baseline,'former owner cleanup must not write next-owner draft');
 assert.equal(after.includes('render'),baseline,'former owner scanner must not repaint next-owner UI');
 assert.equal(ctx.localPending.has(next.id),true);
});
test('old worker load completing after logout cannot mark next owner scanner ready',async()=>{
 const hold=deferred(),events=[],ctx=context({
  captureOperationEpoch:0,localReady:false,localLoadPromise:null,
  recognitionUnavailable:false,recognitionState:{phase:'idle',percent:null},
  localRequest:()=>hold.promise,render:()=>events.push('render'),
  renderRecognitionNotice:()=>events.push('notice'),
  scheduleMemoryReview:()=>events.push('memory'),Date
 });
 vm.runInContext(setupSource,ctx);
 const first=ctx.enableLocal().catch(e=>e);
 ctx.captureOperationEpoch=1;ctx.localReady=false;ctx.localLoadPromise=null;
 ctx.recognitionState.phase='next-owner';
 const begin=events.length;hold.resolve({type:'ready'});
 const result=await first;
 assert.equal(ctx.localReady,baseline?true:false);
 assert.equal(ctx.recognitionState.phase,baseline?'ready':'next-owner');
 assert.equal(events.slice(begin).includes('memory'),baseline);
 if(!baseline)assert.match(String(result.message),/session ended/i);
});
test('old recognition queue finalizer cannot clear next owner active running flag',async()=>{
 const hold=deferred(),events=[];
 const ctx=context({captureOperationEpoch:0,automaticQueue:[{id:'old'}],automaticRunning:false,
  batch:[{id:'old'}],localPending:new Set(['old']),recognizeItem:()=>hold.promise,
  render:()=>events.push('render'),scheduleMemoryReview:()=>events.push('memory')});
 vm.runInContext(queueSource,ctx);
 const running=ctx.drainAutomatic();
 ctx.captureOperationEpoch=1;ctx.automaticRunning=true;ctx.batch=[{id:'new'}];
 const before=events.length;hold.resolve();await running;
 assert.equal(ctx.automaticRunning,!baseline);
 assert.equal(events.length-before,baseline?2:0);
});
test('old successful private IndexedDB save must not add prior owner garment to next owner memory',async()=>{
 const hold=deferred(),oldDB={name:'closet-current-user-owner-a'},newDB={name:'closet-current-user-owner-b'};
 const ctx=context({captureOperationEpoch:0,db:oldDB,batch:[old],items:[],
  window:{closetAuth:{user:{id:'owner-a'}}},Date,
  normalizeClothing:item=>item,queued:()=>hold.promise,
  persistDraft(){},nativeIndex07Refresh:async()=>{},structuredClone});
 vm.runInContext(saveSource,ctx);
 const pending=ctx.saveIndexed(old);
 ctx.captureOperationEpoch=1;ctx.db=newDB;ctx.batch=[next];ctx.items=[];ctx.window.closetAuth.user.id='owner-b';
 hold.resolve(true);const returned=await pending;
 assert.equal(returned,baseline);
 assert.equal(ctx.items.length,baseline?1:0);
 if(baseline)assert.equal(ctx.items[0].id,old.id);
 assert.equal(ctx.batch.length,1);
 assert.equal(ctx.batch[0].id,next.id);
});
test('current owner saved recognition still updates private in-memory roster after commit',async()=>{
 const db={name:'closet-current-user-owner-a'},events=[];
 const ctx=context({captureOperationEpoch:0,db,batch:[old],items:[],
  window:{closetAuth:{user:{id:'owner-a'}}},Date,
  normalizeClothing:item=>item,queued:async()=>true,
  persistDraft:()=>events.push('persist'),nativeIndex07Refresh:async()=>events.push('index'),structuredClone});
 vm.runInContext(saveSource,ctx);
 const saved=await ctx.saveIndexed(old);
 assert.equal(saved,true);assert.equal(ctx.items.length,1);
 assert.equal(ctx.items[0].id,old.id);assert.equal(ctx.batch.length,0);
 assert.deepEqual(events,['persist','index']);
});
test('session lock clears previous scanner jobs, queue and loading state before owner changes',()=>{
 const events=[],handlers={};
 const worker={terminate:()=>events.push('terminated')};
 const ctx=context({
  window:{addEventListener:(name,handler)=>handlers[name]=handler},
  captureOperationEpoch:0,videoImportSerial:0,videoImportActive:false,
  photoImportSerial:0,photoImportActive:false,automaticQueue:[old],localPending:new Set([old.id]),
  automaticRunning:true,localBatch:true,localLoadPromise:Promise.resolve(),
  localReady:true,recognitionUnavailable:true,
  recognitionState:{phase:'loading',percent:64,activeId:old.id},
  sessionCapturedIds:new Set([old.id]),memoryReviewTimer:null,memoryReviewRunning:false,
  localJobs:new Map(),localWorker:worker,
  stopCamera:()=>events.push('camera stop'),busy:true,captureProofTaking:true,
  controls:()=>{},video:{getAttribute:()=>null},
  db:{close(){events.push('closed');}},items:[old],batch:[old],
  failedDraftCaptures:new Set([old.id]),
  document:{querySelectorAll:()=>[]},URL:{revokeObjectURL:()=>{}}
 });
 vm.runInContext(lockSource,ctx);
 handlers['closet:session-locked']();
 assert.equal(ctx.captureOperationEpoch,1);
 assert.equal(ctx.automaticQueue.length,baseline?1:0);
 assert.equal(ctx.localPending.size,baseline?1:0);
 assert.equal(ctx.automaticRunning,baseline?true:false);
 assert.equal(ctx.localReady,baseline?true:false);
 assert.equal(ctx.localLoadPromise===null,!baseline);
 assert.equal(ctx.recognitionState.phase,baseline?'loading':'idle');
 assert.equal(ctx.sessionCapturedIds.size,baseline?1:0);
 assert.deepEqual(events,['camera stop','terminated','closed']);
});
