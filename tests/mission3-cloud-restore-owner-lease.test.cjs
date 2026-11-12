'use strict';
// Exact runtime cloud-backup-bridge.js and app.js owner lease, not duplicated
// implementation. Pure synthetic owner IDs, no network or hosted wardrobes.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const root='public/';
const bridge=fs.readFileSync(root+'cloud-backup-bridge.js','utf8');
const app=fs.readFileSync(root+'app.js','utf8');
const trends=fs.readFileSync(root+'trends.js','utf8');
const outfit=fs.readFileSync(root+'outfit-board.js','utf8');
function section(src,a,b){
 const start=src.indexOf(a),end=src.indexOf(b,start);
 assert.ok(start>=0&&end>start,'Missing source section '+a);
 return src.slice(start,end);
}
const appLease=section(app,'function ownerWardrobeMutationLease(){','function writeAll(values){');
const looksReload=trends.slice(trends.indexOf('async function reloadCloudLooks('));
const boardReload=outfit.slice(outfit.indexOf('async function reloadCloudBoard('));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});promise.catch(()=>{});return {promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve();};
const row=(id,color)=>({id,ownerId:id,color,category:'Tops',image:'data:image/jpeg;base64,/9j/',localAnalyzed:false});
function fixture({hold='',ready=true,failStart=false}={}){
 const first={name:'closet-current-user-A'},second={name:'closet-current-user-B'};
 const auth={user:{id:'A'},assertCurrent(){}};
 const gates={readAll:deferred(),readDraft:deferred(),looks:deferred(),board:deferred(),ready:deferred()};
 let callbacks=null,started=0,rendered=0,queued=0,indexRefresh=0,looksCalled=0,boardCalled=0,workRan=0;
 const label={hidden:true,textContent:''};
 const ctx={
  window:{closetAuth:auth,closetIndex02:{refresh:async()=>{indexRefresh++;}},
   closetCloud:{start:async (_db,options)=>{if(failStart)throw Error('cloud unavailable');callbacks=options;started++;}}},
  db:first,captureOperationEpoch:0,Promise,
  closetReady:ready?Promise.resolve():gates.ready.promise,
  outfitBoardReady:Promise.resolve(),inspirationReady:Promise.resolve(),
  ownerWardrobeMutationLease:undefined,
  URLSearchParams,location:{search:'',protocol:'https:',hostname:'example.test'},
  busy:false,automaticRunning:false,memoryReviewRunning:false,
  document:{querySelector:()=>null,getElementById:()=>label},
  writes:Promise.resolve(),normalizeClothing:x=>x,
  items:[],batch:[],render:()=>{rendered++;},
  queueAutomatic:()=>{queued++;},
  nativeLossless04RestoreSafe:undefined,
  readAllFrom:async db=>{
   if(db===first&&hold==='readAll')return gates.readAll.promise;
   return db===first?[row('A','Blue')]:[row('B','Red')];
  },
  readDraftFrom:async db=>{
   if(db===first&&hold==='readDraft')return gates.readDraft.promise;
   return db===first?[row('A-draft','Blue')]:[row('B-draft','Red')];
  },
  reloadCloudLooks:async()=>{
   looksCalled++;if(hold==='looks')await gates.looks.promise;
  },
  reloadCloudBoard:async()=>{
   boardCalled++;if(hold==='board')await gates.board.promise;
  }
 };
 vm.createContext(ctx);
 vm.runInContext(appLease+'\n'+bridge,ctx);
 const current=async()=>{await flush();assert.ok(callbacks,'Cloud start should register callbacks');return callbacks;};
 return {ctx,gates,first,second,current,
  get callbacks(){return callbacks;},get started(){return started;},
  get rendered(){return rendered;},get queued(){return queued;},
  get indexRefresh(){return indexRefresh;},get looksCalled(){return looksCalled;},
  get boardCalled(){return boardCalled;},get label(){return label;},
  switchOwner({sameId=false}={}){ctx.captureOperationEpoch++;ctx.items=[];ctx.batch=[];
   if(!sameId){auth.user.id='B';ctx.db=second;ctx.items=[row('B','Red')];}
  },
  runWork:()=>{workRan++;},get workRan(){return workRan}
 };
}
test('normal owner restore reads the same owner database and renders private closet, looks and board',async()=>{
 const f=fixture(),cb=await f.current();
 assert.equal(cb.canRestore(),true);
 await cb.restored();
 assert.deepEqual(f.ctx.items.map(x=>x.ownerId),['A']);
 assert.deepEqual(f.ctx.batch.map(x=>x.ownerId),['A-draft']);
 assert.equal(f.rendered,1);assert.equal(f.indexRefresh,1);
 assert.equal(f.looksCalled,1);assert.equal(f.boardCalled,1);assert.equal(f.queued,1);
});
for(const stage of ['readAll','readDraft','looks','board']){
 test('revoked owner restore stopped after deferred '+stage+' without cross-account screen changes',async()=>{
  const f=fixture({hold:stage}),cb=await f.current();
  const promise=cb.restored();await flush();
  f.switchOwner();f.gates[stage].resolve(stage==='readAll'?[row('A','Blue')]:stage==='readDraft'?[row('A-draft','Blue')]:undefined);
  await assert.rejects(promise,/Private wardrobe changed accounts/);
  assert.deepEqual(f.ctx.items.map(x=>x.ownerId),['B']);
  assert.equal(f.rendered,0);assert.equal(f.indexRefresh,0);assert.equal(f.queued,0);
  assert.equal(cb.canRestore(),false);
 });
}
test('same owner ID relogin revokes a cloud callback while draft read is pending',async()=>{
 const f=fixture({hold:'readDraft'}),cb=await f.current();
 const pending=cb.restored();await flush();f.switchOwner({sameId:true});
 f.gates.readDraft.resolve([row('A-draft','Blue')]);
 await assert.rejects(pending,/Private wardrobe changed accounts/);
 assert.equal(f.rendered,0);assert.equal(f.queued,0);
});
test('queued cloud capture does not execute an old-owner transaction after logout',async()=>{
 const f=fixture(),cb=await f.current();const gate=deferred();
 f.ctx.writes=gate.promise;const pending=cb.capture(()=>{f.runWork();return 5;});
 await flush();f.switchOwner();gate.resolve();
 await assert.rejects(pending,/Private wardrobe changed accounts/);
 assert.equal(f.workRan,0);
});
test('old restore callback cannot start after owner switches',async()=>{
 const f=fixture(),cb=await f.current();f.switchOwner();
 await assert.rejects(cb.restored(),/Private wardrobe changed accounts/);
 assert.equal(f.rendered,0);
});
test('revoked startup leaves next owner cloud callback and status untouched',async()=>{
 const f=fixture({ready:false});f.switchOwner();f.gates.ready.resolve();
 await flush();assert.equal(f.started,0);assert.equal(f.label.hidden,true);
});
test('cloud startup failure shows pending notice only to the still-current signed-in user',async()=>{
 const f=fixture({failStart:true});await flush();
 assert.equal(f.started,0);assert.equal(f.label.hidden,false);
 assert.match(f.label.textContent,/cloud backup pending/);
});
test('exact inspiration reload rejects stale owner before publishing or rendering looks',async()=>{
 const gate=deferred(),oldDB={name:'closet-current-user-A',transaction:()=>({objectStore:()=>({
  get:()=>{const r={};queueMicrotask(async()=>{await gate.promise;r.result={looks:[{id:'A'}]};r.onsuccess?.();});return r;}
 })})};
 let current=true,render=0;
 const ctx={db:oldDB,inspirationLooks:[{id:'B'}],validLook:x=>x,renderSavedLooks:()=>{render++;}};
 vm.createContext(ctx);vm.runInContext(looksReload,ctx);
 const p=ctx.reloadCloudLooks({ownerDB:oldDB,assertLease:()=>{if(!current)throw Error('revoked');}});
 current=false;gate.resolve();await assert.rejects(p,/revoked/);
 assert.deepEqual(ctx.inspirationLooks,[{id:'B'}]);assert.equal(render,0);
});
test('exact outfit-board reload rejects owner switch during IDB load before updating outfit UI',async()=>{
 const gate=deferred(),oldDB={name:'closet-current-user-A',transaction:()=>({objectStore:()=>({
  get:()=>{const r={};queueMicrotask(async()=>{await gate.promise;r.result={current:{name:'A'}};r.onsuccess?.();});return r;}
 })})};
 let current=true,render=0;
 const ctx={db:oldDB,nativeLossless04Active:false,window:{closetAuth:{user:{id:'A'}}},
  items:[],syncBoardInputs:()=>{render++;},renderOutfitBoard:()=>{render++;},
  cleanOutfitBoard:x=>x,currentBoard:{name:'B'},savedOutfitBoards:[],
  boardHasUnsavedDraft:()=>false};
 vm.createContext(ctx);vm.runInContext(boardReload,ctx);
 const p=ctx.reloadCloudBoard({ownerDB:oldDB,assertLease:()=>{if(!current)throw Error('revoked');}});
 current=false;gate.resolve();await assert.rejects(p,/revoked/);
 assert.equal(ctx.currentBoard.name,'B');assert.equal(render,0);
});
