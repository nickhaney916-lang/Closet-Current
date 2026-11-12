'use strict';
// Mission 3 — exact app.js owner-private startup + garment save; run against
// pinned parent (known-bad) AND patched candidate with identical fixtures.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'App source section missing: '+start);
 return source.slice(a,b);
}
const saveSource=extract('function savePiece(value,nextBatch','function node(tag');
const readAllSource=extract('function readAll(', '// NATIVE-INDEX-07 opt-in only:');
const readDraftSource=extract('function readDraft(', 'async function captureProofVerifyBeforeSave(');
const readySource=extract('const closetReady=(async()=>','/**');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function bind(ctx,script){vm.createContext(ctx);vm.runInContext(script,ctx);return ctx;}
const a='owner-a',b='owner-b',photo='data:image/jpeg;base64,/9j/';
const oldRow={id:'same-id',ownerId:a,category:'Tops',itemType:'Shirt',image:photo};
const newRow={id:'same-id',ownerId:b,category:'Shoes',itemType:'Boots',image:photo};
function fakeDB(owner,{items=[owner===a?oldRow:newRow],draft=[{...items[0],id:'draft-'+owner}],holdItems=false,holdDraft=false,holdCommit=false}={}){
 const itemsGate=deferred(),draftGate=deferred(),commitGate=deferred();
 let closes=0,transactionCount=0;
 const writes=[],data={items:structuredClone(items),draft:structuredClone(draft)};
 const db={name:'closet-current-user-'+owner,close(){closes++;},
  transaction(type){
   transactionCount++;
   const storeName=Array.isArray(type)?null:type;
   const transaction={oncomplete:null,onerror:null,onabort:null,
    objectStore(store){
     const id=store||storeName;
     return {
      getAll(){
       const req={};
       queueMicrotask(async()=>{
        itemsGate.resolve();
        if(holdItems)await itemsGate.release;
        req.result=structuredClone(data.items);req.onsuccess?.();
       });
       return req;
      },
      get(){
       const req={};
       queueMicrotask(async()=>{
        draftGate.resolve();
        if(holdDraft)await draftGate.release;
        req.result={id:'draft',batch:structuredClone(data.draft)};req.onsuccess?.();
       });
       return req;
      },
      put(value){writes.push({store:id,value:structuredClone(value)});}
     };
    }
   };
   // readwrite tx completion in a later microtask; optionally postpone.
   if(Array.isArray(type))queueMicrotask(async()=>{
    if(holdCommit)await commitGate.release;
    for(const w of writes){
     if(w.store==='items')data.items=[w.value];
     if(w.store==='state')data.draft=w.value.batch;
    }
    transaction.oncomplete?.();
   });
   return transaction;
  }
 };
 const releaseItems=()=>{itemsGate.releaseResolve?.();},releaseDraft=()=>{draftGate.releaseResolve?.();},releaseCommit=()=>{commitGate.releaseResolve?.();};
 if(holdItems){const g=deferred();itemsGate.release=g.promise;itemsGate.releaseResolve=g.resolve;}
 if(holdDraft){const g=deferred();draftGate.release=g.promise;draftGate.releaseResolve=g.resolve;}
 if(holdCommit){const g=deferred();commitGate.release=g.promise;commitGate.releaseResolve=g.resolve;}
 return {db,data,writes,itemsGate,draftGate,commitGate,releaseItems,releaseDraft,releaseCommit,
 get closes(){return closes;},get transactionCount(){return transactionCount;}};
}
function saveFixture({holdProof=true,holdQueue=false,holdCommit=false}={}){
 const initial=fakeDB(a,{holdCommit}),next=fakeDB(b);
 const proof=deferred(),queue=deferred(),events=[];
 const auth={user:{id:a},assertCurrent(){}};
 const ctx={
  db:initial.db,window:{closetAuth:auth},
  captureOperationEpoch:0,
  captureProofVerifyBeforeSave:()=>holdProof?proof.promise:Promise.resolve(),
  queued:fn=>holdQueue?queue.promise.then(fn):fn(),
  nativeIndex07Refresh:async()=>{events.push('refresh:'+ctx.window.closetAuth.user.id);},
  URLSearchParams,location:{search:''},structuredClone
 };
 bind(ctx,saveSource);
 return {ctx,initial,next,events,proof,queue,switchOwner({sameOwner=false}={}){
  ctx.captureOperationEpoch++;
  ctx.db=sameOwner?initial.db:next.db;ctx.window.closetAuth.user.id=sameOwner?a:b;
 }};
}
function savedValue(){return {id:'same-id',ownerId:a,name:'Blue shirt',image:photo};}
test('delayed owner-A source verification never inserts shirt or draft into owner-B wardrobe',async()=>{
 const f=saveFixture(),pending=f.ctx.savePiece(savedValue(),[oldRow]).then(()=> 'saved',()=> 'rejected');
 f.switchOwner();f.proof.resolve();
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.next.writes.length,baseline?2:0);
 assert.equal(f.initial.writes.length,0);
 assert.equal(f.events.includes('refresh:'+b),baseline);
});
test('old queued garment save cannot open new owner DB after sign out before starting',async()=>{
 const f=saveFixture({holdProof:false,holdQueue:true});
 const pending=f.ctx.savePiece(savedValue(),[oldRow]).then(()=> 'saved',()=> 'rejected');
 f.switchOwner();f.queue.resolve();
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.next.writes.length,baseline?2:0);
});
test('relogin as identical owner ID still revokes old async garment save',async()=>{
 const f=saveFixture(),pending=f.ctx.savePiece(savedValue(),[]).then(()=> 'saved',()=> 'rejected');
 f.switchOwner({sameOwner:true});f.proof.resolve();
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.initial.writes.length,baseline?2:0);
});
test('old pending IDB commit cannot report a saved garment to the next account',async()=>{
 const f=saveFixture({holdProof:false,holdCommit:true}),pending=f.ctx.savePiece(savedValue(),[]).then(()=> 'saved',()=> 'rejected');
 // The queued async proof await must finish and open the transaction.
 for(let i=0;i<10&&!f.initial.writes.length;i++)await Promise.resolve();
 assert.equal(f.initial.writes.length,2,'Save reached original owner transaction before revocation');
 f.switchOwner();f.initial.releaseCommit();
 assert.equal(await pending,baseline?'saved':'rejected');
 assert.equal(f.events.includes('refresh:'+b),baseline);
 assert.equal(f.next.writes.length,0);
});
test('valid current-owner garment + draft save still commits atomically',async()=>{
 const f=saveFixture({holdProof:false});
 await f.ctx.savePiece(savedValue(),[]);
 assert.equal(f.initial.writes.length,2);
 assert.equal(f.initial.data.items[0].name,'Blue shirt');
 assert.equal(f.initial.data.draft.length,0);
 assert.deepEqual(f.events,['refresh:'+a]);
});
test('same-owner verified source does not mutate garment before integrity promise succeeds',async()=>{
 const f=saveFixture();
 const pending=f.ctx.savePiece(savedValue(),[]);
 assert.equal(f.initial.writes.length,0);
 f.proof.resolve();await pending;
 assert.equal(f.initial.writes.length,2);
});
function readyFixture({itemsHold=false,draftHold=false}={}){
 const initial=fakeDB(a,{holdItems:itemsHold,holdDraft:draftHold}),next=fakeDB(b);
 const calls=[],auth={user:{id:a},ready:Promise.resolve(),assertCurrent(){
  if(auth.user?.id!==a)throw Error('Account session ended');
 }};
 const ctx={
  captureOperationEpoch:0,db:null,items:[],batch:[],
  window:{closetAuth:auth},
  openDB:async()=>initial.db,
  normalizeClothing:item=>item,
  message:txt=>calls.push('message:'+txt),
  render:()=>calls.push('render:'+ctx.items.map(x=>x.ownerId)),
  queueAutomatic:item=>calls.push('scan:'+item.ownerId)
 };
 bind(ctx,readAllSource+'\n'+readDraftSource+'\n'+readySource);
 ctx.closetReady=vm.runInContext('closetReady',ctx);
 return {ctx,initial,next,calls,switchOwner({sameOwner=false}={}){
  ctx.captureOperationEpoch++;
  if(!sameOwner)ctx.window.closetAuth.user.id=b;
  ctx.db=next.db;ctx.items=[structuredClone(newRow)];ctx.batch=[{...newRow,id:'new-owner-draft'}];
 }};
}
test('old startup items.getAll completion after account switch cannot expose former owner garment',async()=>{
 const f=readyFixture({itemsHold:true});
 await f.initial.itemsGate.promise;f.switchOwner();f.initial.releaseItems();
 await f.ctx.closetReady;
 assert.equal(f.ctx.items[0].ownerId,baseline?a:b);
 assert.equal(f.ctx.batch[0].ownerId,b);
 assert.equal(f.calls.filter(x=>x.startsWith('render:')).length,baseline?1:0);
 assert.equal(f.initial.closes,baseline?0:1);
});
test('old startup after draft read begins cannot reassign shared items or draft to new owner',async()=>{
 const f=readyFixture({draftHold:true});
 await f.initial.draftGate.promise;f.switchOwner();f.initial.releaseDraft();
 await f.ctx.closetReady;
 assert.equal(f.ctx.items[0].ownerId,baseline?a:b);
 assert.equal(f.ctx.batch[0].ownerId,baseline?a:b);
 assert.equal(f.initial.closes,baseline?0:1);
});
test('old startup read is revoked even after sign-in to same account ID',async()=>{
 const f=readyFixture({itemsHold:true});await f.initial.itemsGate.promise;
 f.switchOwner({sameOwner:true});f.initial.releaseItems();
 await f.ctx.closetReady;
 assert.equal(f.ctx.items[0].ownerId,baseline?a:b);
 assert.equal(f.initial.closes,baseline?0:1);
});
test('uninterrupted startup loads only signed owner private roster + review draft',async()=>{
 const f=readyFixture();
 await f.ctx.closetReady;
 assert.equal(f.ctx.db,f.initial.db);
 assert.equal(f.ctx.items.length,1);
 assert.equal(f.ctx.items[0].ownerId,a);
 assert.equal(f.ctx.batch.length,1);
 assert.equal(f.ctx.batch[0].ownerId,a);
 assert.ok(f.calls.some(x=>x.startsWith('render:')));
 assert.ok(f.calls.some(x=>x==='scan:'+a));
 assert.equal(f.initial.closes,0);
});
