'use strict';
// Mission 3 — execute the exact app.js private mutation functions against
// the pinned parent and candidate in restricted VMs. No mirrored algorithm.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const get=(from,to)=>{
 const a=source.indexOf(from),b=source.indexOf(to,a);
 assert.ok(a>=0&&b>a,'Actual app function not found: '+from);
 return source.slice(a,b);
};
const header=baseline?'':get('function ownerWardrobeMutationLease(){','function writeAll(values){');
const write=get('function writeAll(values){','// Compare the persisted garment inside the same transaction');
const remove=get(baseline?'function removeItem(id){':'function removeItem(id,expected){','function persistDraft(');
const mutators=header+write+'\n'+remove;
const oldId='garment-shared-id';
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});
 return {promise,resolve,reject};
}
function privateDB(owner,{holdCommit=false}={}){
 const rows=new Map([[oldId,{id:oldId,ownerId:owner,color:owner==='owner-A'?'Blue':'Red'}]]);
 const txGate=deferred();
 const actions=[],events=[];
 const db={name:'closet-current-user-'+owner,transaction(store,mode){
  assert.equal(store,'items');assert.equal(mode,'readwrite');
  const pending=[];
  let aborted=false,scheduled=false;
  const commit=async()=>{
   if(holdCommit)await txGate.promise;
   if(aborted)return;
   for(const w of pending){
    if(w.op==='put')rows.set(w.value.id,w.value);
    else rows.delete(w.id);
   }
   events.push('commit');tx.oncomplete?.();
  };
  const schedule=()=>{if(scheduled||aborted)return;scheduled=true;queueMicrotask(commit);};
  const tx={
   oncomplete:null,onerror:null,onabort:null,error:null,
   abort(){aborted=true;queueMicrotask(()=>tx.onabort?.());},
   objectStore(name){
    assert.equal(name,'items');
    return {
     get(id){
      const request={result:null,onsuccess:null};
      queueMicrotask(()=>{
       if(aborted)return;
       request.result=structuredClone(rows.get(id));
       request.onsuccess?.();
       if(!aborted&&!scheduled)schedule();
      });
      return request;
     },
     put(value){pending.push({op:'put',value:structuredClone(value)});actions.push('put:'+value.id);schedule();},
     delete(id){pending.push({op:'delete',id});actions.push('delete:'+id);schedule();}
    };
   }
  };
  return tx;
 }};
 return {db,rows,actions,events,releaseCommit:()=>txGate.resolve()};
}
function fixture({holdQueue=false,holdCommit=false,holdRefresh=false}={}){
 const a=privateDB('owner-A',{holdCommit}),b=privateDB('owner-B');
 const gate=deferred(),refresh=deferred(),actions=[],auth={user:{id:'owner-A'},assertCurrent(){}};
 let current=a.db,epoch=0;
 const ctx={
  db:current,captureOperationEpoch:epoch,window:{closetAuth:auth},
  queued:fn=>holdQueue?gate.promise.then(fn):fn(),
  nativeIndex07Refresh:()=>{actions.push('refresh:'+auth.user?.id);return holdRefresh?refresh.promise:Promise.resolve();},
  structuredClone,normalizeClothing:x=>x
 };
 vm.createContext(ctx);vm.runInContext(mutators,ctx);
 return {ctx,a,b,actions,releaseQueue:()=>gate.resolve(),releaseRefresh:()=>refresh.resolve(),
 switchOwner({sameOwner=false}={}){
  ctx.captureOperationEpoch++;if(!sameOwner){auth.user.id='owner-B';ctx.db=b.db;}
 }};
}
const newRow={id:oldId,ownerId:'owner-A',color:'Purple'};
const status=promise=>promise.then(()=> 'resolved',()=> 'rejected');

test('queued old owner delete must not remove same ID in newly signed in owner B',async()=>{
 const f=fixture({holdQueue:true});
 const promise=status(f.ctx.removeItem(oldId,{...f.a.rows.get(oldId)}));
 f.switchOwner();f.releaseQueue();
 assert.equal(await promise,baseline?'resolved':'rejected');
 assert.equal(f.b.rows.has(oldId),!baseline);
 assert.equal(f.a.rows.has(oldId),true);
 assert.deepEqual(f.actions,baseline?['refresh:owner-B']:[]);
});
test('queued old owner photo correction bulk write cannot overwrite owner B matching ID',async()=>{
 const f=fixture({holdQueue:true});
 const promise=status(f.ctx.writeAll([newRow]));
 f.switchOwner();f.releaseQueue();
 assert.equal(await promise,baseline?'resolved':'rejected');
 assert.equal(f.b.rows.get(oldId).color,baseline?'Purple':'Red');
 assert.equal(f.a.rows.get(oldId).color,'Blue');
});
test('same-owner logout and re-login epoch revokes previously queued delete',async()=>{
 const f=fixture({holdQueue:true});
 const promise=status(f.ctx.removeItem(oldId,{...f.a.rows.get(oldId)}));
 f.switchOwner({sameOwner:true});f.releaseQueue();
 assert.equal(await promise,baseline?'resolved':'rejected');
 assert.equal(f.a.rows.has(oldId),!baseline);
});
test('same-owner logout and re-login epoch revokes previously queued bulk write',async()=>{
 const f=fixture({holdQueue:true});
 const promise=status(f.ctx.writeAll([newRow]));
 f.switchOwner({sameOwner:true});f.releaseQueue();
 assert.equal(await promise,baseline?'resolved':'rejected');
 assert.equal(f.a.rows.get(oldId).color,baseline?'Purple':'Blue');
});
test('old owner delete completed after different owner login cannot report success or refresh their index',async()=>{
 const f=fixture({holdCommit:true});
 const p=status(f.ctx.removeItem(oldId,{...f.a.rows.get(oldId)}));
 for(let n=0;n<8&&f.a.actions.length===0;n++)await Promise.resolve();
 assert.equal(f.a.actions.length,1);
 f.switchOwner();f.a.releaseCommit();
 assert.equal(await p,baseline?'resolved':'rejected');
 assert.deepEqual(f.actions,baseline?['refresh:owner-B']:[]);
 assert.equal(f.b.rows.has(oldId),true);
});
test('old owner bulk update completed after different owner login cannot refresh new owner UI',async()=>{
 const f=fixture({holdCommit:true});
 const p=status(f.ctx.writeAll([newRow]));
 for(let n=0;n<8&&f.a.actions.length===0;n++)await Promise.resolve();
 assert.equal(f.a.actions.length,1);
 f.switchOwner();f.a.releaseCommit();
 assert.equal(await p,baseline?'resolved':'rejected');
 assert.deepEqual(f.actions,baseline?['refresh:owner-B']:[]);
 assert.equal(f.b.rows.get(oldId).color,'Red');
});
test('previous owner native index refresh completion cannot turn into successful new-owner deletion',async()=>{
 const f=fixture({holdRefresh:true}),p=status(f.ctx.removeItem(oldId,{...f.a.rows.get(oldId)}));
 for(let k=0;k<12&&f.actions.length===0;k++)await Promise.resolve();
 assert.deepEqual(f.actions,['refresh:owner-A']);
 f.switchOwner();f.releaseRefresh();
 assert.equal(await p,baseline?'resolved':'rejected');
 assert.equal(f.b.rows.has(oldId),true);
});
test('same signed in owner deletion retains prior stored behavior',async()=>{
 const f=fixture();
 await f.ctx.removeItem(oldId,{...f.a.rows.get(oldId)});
 assert.equal(f.a.rows.has(oldId),false);
 assert.deepEqual(f.actions,['refresh:owner-A']);
 assert.equal(f.b.rows.has(oldId),true);
});
test('same signed in owner bulk update retains prior stored behavior',async()=>{
 const f=fixture();
 await f.ctx.writeAll([newRow]);
 assert.equal(f.a.rows.get(oldId).color,'Purple');
 assert.equal(f.b.rows.get(oldId).color,'Red');
 assert.deepEqual(f.actions,['refresh:owner-A']);
});
