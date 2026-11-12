'use strict';
// Mission 3 — run actual application queued() and exact session-lock handler.
// Synthetic signed users, delayed device/cloud promises, no hosted writes.
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const between=(a,b)=>{
 const from=app.indexOf(a),to=app.indexOf(b,from);
 assert.ok(from>=0&&to>from,'Missing app source: '+a);
 return app.slice(from,to);
};
const queueSource=between('function queued(work){','let db,items=');
const lockSource=between("window.addEventListener('closet:session-locked',()=>{",'function message(t){');
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const ticks=async()=>{for(let i=0;i<35;i++)await Promise.resolve();};
function fixture(){
 const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const oldDB={name:'closet-current-user-'+A,close(){}},nextDB={name:'closet-current-user-'+B,close(){}};
 const records=[],listeners={};
 const auth={user:{id:A},assertCurrent(){}};
 const ctx={
  captureOperationEpoch:0,videoImportSerial:0,videoImportActive:false,
  photoImportSerial:0,photoImportActive:false,db:oldDB,writes:Promise.resolve(),
  window:{
   closetAuth:auth,
   closetCloud:{
    async beforeWrite(database){records.push('before:'+database.name);},
    changed(){records.push('changed:'+ctx.window.closetAuth?.user?.id);}
   },
   closetIndex02:{refresh(){records.push('index:'+ctx.window.closetAuth?.user?.id);}},
   addEventListener(name,fn){listeners[name]=fn;}
  },
  message(x){records.push('warning:'+x);},
  busy:false,captureProofTaking:false,controls(){},
  stopCamera(){},video:{getAttribute(){return null;}},
  localJobs:new Map(),localWorker:null,automaticQueue:[],
  localPending:new Set(),automaticRunning:false,
  localBatch:false,localLoadPromise:null,localReady:false,
  recognitionUnavailable:false,recognitionState:{phase:'idle'},
  sessionCapturedIds:new Set(),memoryReviewTimer:null,
  memoryReviewRunning:false,items:[],batch:[],failedDraftCaptures:new Set(),
  document:{querySelectorAll:()=>[]},
  URL:{revokeObjectURL(){}},Promise,Error,Date,clearTimeout,
 };
 vm.createContext(ctx);
 vm.runInContext(queueSource+'\n'+lockSource,ctx);
 return {ctx,records,listeners,A,B,oldDB,nextDB,
  reset:BUser=>{ctx.window.closetAuth.user={id:BUser?B:A};ctx.db=BUser?nextDB:{name:oldDB.name,close(){}};},
  lock(){listeners['closet:session-locked']();},
  get changed(){return records.filter(x=>x.startsWith('changed:'));},
  get refreshes(){return records.filter(x=>x.startsWith('index:'));}
 };
}
test('current signed owner work runs and only their cloud/index gets notified',async()=>{
 const f=fixture(),writes=[];
 const result=await f.ctx.queued(async()=>{writes.push('A');return 'persisted';});
 assert.equal(result,'persisted');await ticks();
 assert.deepEqual(writes,['A']);
 assert.deepEqual(f.changed,['changed:'+f.A]);
 assert.deepEqual(f.refreshes,['index:'+f.A]);
 assert.deepEqual(f.records.filter(x=>x.startsWith('before:')),['before:'+f.oldDB.name]);
});
test('account switch while old cloud beforeWrite awaits must never execute old work under B',async()=>{
 const f=fixture(),wait=deferred(),entered=deferred(),changes=[];
 f.ctx.window.closetCloud.beforeWrite=async db=>{
  f.records.push('before:'+db.name);if(db===f.oldDB){entered.resolve();await wait.promise;}
 };
 const old=f.ctx.queued(async()=>{changes.push('stale-write');});
 await entered.promise;
 f.lock();f.reset(true);
 const current=f.ctx.queued(async()=>{changes.push('B-write');return true;});
 assert.equal(await current,true,'B write must not wait for old cloud request');
 wait.resolve();await assert.rejects(old,/account session changed/);await ticks();
 assert.deepEqual(changes,['B-write']);
 assert.deepEqual(f.changed,['changed:'+f.B]);
 assert.deepEqual(f.refreshes,['index:'+f.B]);
 assert.deepEqual(f.records.filter(x=>x.startsWith('before:')),
  ['before:'+f.oldDB.name,'before:'+f.nextDB.name]);
});
test('old queued task waiting behind blocked owner A operation cannot reach B beforeWrite',async()=>{
 const f=fixture(),hold=deferred(),started=deferred(),work=[];
 const first=f.ctx.queued(async()=>{started.resolve();await hold.promise;work.push('old-first');});
 await started.promise;
 const second=f.ctx.queued(async()=>{work.push('old-second');});
 f.lock();f.reset(true);
 const current=f.ctx.queued(async()=>{work.push('B');});
 await current;
 hold.resolve();
 await assert.rejects(first,/account session changed/);
 await assert.rejects(second,/account session changed/);
 await ticks();
 assert.deepEqual(work,['B','old-first']);
 assert.equal(f.records.filter(x=>x==='before:'+f.nextDB.name).length,1);
 assert.deepEqual(f.changed,['changed:'+f.B]);
});
test('late successful old work cannot mark B cloud dirty or refresh B native index',async()=>{
 const f=fixture(),hold=deferred(),started=deferred();
 const pending=f.ctx.queued(async()=>{started.resolve();await hold.promise;return 'old-committed';});
 await started.promise;f.lock();f.reset(true);
 const current=await f.ctx.queued(async()=>true);assert.equal(current,true);
 hold.resolve();await assert.rejects(pending,/account session changed/);await ticks();
 assert.deepEqual(f.changed,['changed:'+f.B]);
 assert.deepEqual(f.refreshes,['index:'+f.B]);
});
test('a same-ID logout/relogin with new DB invalidates prior pending cloud result',async()=>{
 const f=fixture(),hold=deferred(),started=deferred();
 const pending=f.ctx.queued(async()=>{started.resolve();await hold.promise;});
 await started.promise;f.lock();f.reset(false);
 await f.ctx.queued(async()=>true);
 hold.resolve();await assert.rejects(pending,/account session changed/);await ticks();
 assert.deepEqual(f.changed,['changed:'+f.A]);
 assert.deepEqual(f.refreshes,['index:'+f.A]);
});
test('rejected old owner quota error does not overwrite new owner warning',async()=>{
 const f=fixture(),hold=deferred(),started=deferred(),quota=Error('old storage full');quota.name='QuotaExceededError';
 const pending=f.ctx.queued(async()=>{started.resolve();await hold.promise;throw quota;});
 await started.promise;f.lock();f.reset(true);hold.resolve();
 await assert.rejects(pending,/old storage full/);await ticks();
 assert.equal(f.records.filter(x=>x.startsWith('warning:')).length,0);
 assert.equal(f.changed.length,0);
});
test('current owner quota error remains visible and never signals cloud success',async()=>{
 const f=fixture(),quota=Error('current storage full');quota.name='QuotaExceededError';
 await assert.rejects(f.ctx.queued(async()=>{throw quota;}),/current storage full/);
 await ticks();
 assert.match(f.records.find(x=>x.startsWith('warning:')),/Browser storage is full/);
 assert.deepEqual(f.changed,[]);
});
test('new user queue remains responsive when a former cloud beforeWrite never resolves',async()=>{
 const f=fixture(),hold=deferred(),entered=deferred();
 f.ctx.window.closetCloud.beforeWrite=async db=>{if(db===f.oldDB){entered.resolve();await hold.promise;}};
 const old=f.ctx.queued(async()=>{throw Error('former owner must not write');});
 await entered.promise;f.lock();f.reset(true);
 assert.equal(await f.ctx.queued(async()=>42),42);
 hold.resolve();await assert.rejects(old,/account session changed/);
 await ticks();assert.deepEqual(f.changed,['changed:'+f.B]);
});
