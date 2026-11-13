'use strict';
// Execute the ACTUAL app.js automatic indexing transaction against a
// transactionally faithful synthetic owner-private IndexedDB. No real photos,
// accounts, hosted Supabase, staging, or deployments.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
const start=source.indexOf('async function saveIndexed(item,index04ApprovedOwner=null){');
const end=source.indexOf('async function recognizeItem(item){',start);
assert.ok(start>=0&&end>start,'Missing actual auto-index implementation');
const implementation=source.slice(start,end);
const owner='signed-owner-a',photo='data:image/jpeg;base64,/9j/';
const original={image:photo,sha256:'a'.repeat(64)};
const row={
 id:'capture-a',ownerId:owner,image:photo,originalPhoto:original,
 sourceSHA256:'a'.repeat(64),category:'Uncategorized',color:'Blue',
 itemType:'Unknown',name:'',userAdjusted:false,requiresOwnershipConfirmation:false
};
const foreignDraft={
 id:'capture-from-second-tab',ownerId:owner,
 image:'data:image/jpeg;base64,/9j/AA==',originalPhoto:{image:'data:image/jpeg;base64,/9j/AA==',sha256:'b'.repeat(64)},
 sourceSHA256:'b'.repeat(64),category:'Uncategorized'
};
function fixture({draft=[row,foreignDraft],savedItems=[],holdQueue=false}={}){
 const stored=new Map(savedItems.map(x=>[x.id,structuredClone(x)]));
 let draftState=structuredClone(draft),commits=0,aborts=0,ownerId=owner,epoch=0;
 const calls=[];
 const db={name:'closet-current-user-'+owner,transaction(stores,mode){
  assert.deepEqual(Array.from(stores),['items','state']);
  assert.equal(mode,'readwrite');
  let aborted=false,scheduled=false;
  const pending=[];
  const tx={oncomplete:null,onerror:null,onabort:null,error:null,
   abort(){if(aborted)return;aborted=true;aborts++;queueMicrotask(()=>tx.onabort?.());},
   objectStore(name){assert.ok(['items','state'].includes(name));return {
    get(id){
     const req={result:undefined,onsuccess:null,onerror:null};
     queueMicrotask(()=>{
      if(aborted)return;
      req.result=name==='items'?(stored.has(id)?structuredClone(stored.get(id)):undefined)
       :id==='draft'?{id:'draft',batch:structuredClone(draftState)}:undefined;
      req.onsuccess?.();
     });return req;
    },
    add(value){assert.equal(name,'items');calls.push('add');pending.push({name,value:structuredClone(value),add:true});schedule();},
    put(value){calls.push('put:'+name);pending.push({name,value:structuredClone(value)});schedule();}
   };},
  };
  function schedule(){
   if(scheduled)return;
   scheduled=true;queueMicrotask(()=>{
    if(aborted)return;
    if(pending.some(x=>x.add&&stored.has(x.value.id))){
     tx.error=Error('ConstraintError');aborted=true;aborts++;tx.onabort?.();return;
    }
    for(const item of pending){
     if(item.name==='items')stored.set(item.value.id,item.value);
     else draftState=structuredClone(item.value.batch);
    }
    commits++;tx.oncomplete?.();
   });
  }
  return tx;
 }};
 const auth={user:{id:owner},assertCurrent(){if(ownerId!==owner)throw Error('Revoked session');}};
 let release;
 const hold=new Promise(r=>release=r);
 const ctx={
  window:{closetAuth:auth},db,batch:[structuredClone(row)],items:[],
  captureOperationEpoch:0,index04ResearchActive:true,
  structuredClone,JSON,Date,Error,
  normalizeClothing:x=>structuredClone(x),
  queued:fn=>holdQueue?hold.then(fn):Promise.resolve().then(fn),
  nativeIndex07Refresh:async()=>{calls.push('refresh');},
  persistDraft:()=>{throw Error('Blind draft rewrite is forbidden after auto-index commit');}
 };
 vm.createContext(ctx);vm.runInContext(implementation,ctx);
 return {
  ctx,stored,calls,release,
  get draft(){return structuredClone(draftState);},
  get commits(){return commits;},get aborts(){return aborts;},
  get ownerId(){return ownerId;},
  setOwner(v){ownerId=v;ctx.window.closetAuth.user.id=v;},
  setEpoch(v){ctx.captureOperationEpoch=v;},
  index:()=>ctx.saveIndexed(ctx.batch[0],owner)
 };
}
test('eligible auto-index adds exactly one garment and preserves other tab original draft',async()=>{
 const f=fixture();assert.equal(await f.index(),true);
 assert.equal(f.stored.size,1);assert.equal(f.stored.get(row.id).originalPhoto.sha256,original.sha256);
 assert.deepEqual(f.draft,[foreignDraft]);assert.equal(f.commits,1);
 assert.equal(f.ctx.batch.length,0);
 assert.deepEqual(f.calls,['add','put:state','refresh']);
});
test('saved item ID from second tab blocks auto-index and keeps all drafts',async()=>{
 const saved={...row,color:'Purple',originalPhoto:{...original,sha256:'c'.repeat(64)}};
 const f=fixture({savedItems:[saved]});
 await assert.rejects(f.index(),/CLOSET_AUTO_INDEX_STALE_REVIEW/);
 assert.equal(f.stored.get(row.id).color,'Purple');
 assert.equal(f.commits,0);assert.equal(f.draft.length,2);
});
test('second tab deleted the original draft; stale automatic analysis cannot recreate it',async()=>{
 const f=fixture({draft:[foreignDraft]});
 await assert.rejects(f.index(),/CLOSET_AUTO_INDEX_STALE_REVIEW/);
 assert.equal(f.stored.size,0);assert.deepEqual(f.draft,[foreignDraft]);assert.equal(f.commits,0);
});
test('second tab replaced original source JPEG; original hash and photo are untouched',async()=>{
 const changed={...row,image:foreignDraft.image,sourceSHA256:foreignDraft.sourceSHA256,
  originalPhoto:foreignDraft.originalPhoto};
 const f=fixture({draft:[changed,foreignDraft]});
 await assert.rejects(f.index(),/CLOSET_AUTO_INDEX_STALE_REVIEW/);
 assert.equal(f.stored.size,0);assert.deepEqual(f.draft,[changed,foreignDraft]);
});
test('a saved user correction in the draft wins over stale automatic recognition',async()=>{
 for(const change of [{userAdjusted:true,color:'Red'},{requiresOwnershipConfirmation:true},
  {colorSource:'user',color:'Red'}]){
  const f=fixture({draft:[{...row,...change},foreignDraft]});
  await assert.rejects(f.index(),/CLOSET_AUTO_INDEX_STALE_REVIEW/);
  assert.equal(f.stored.size,0);assert.equal(f.commits,0);
 }
});
test('duplicated source IDs in persisted draft must be reviewed rather than consumed',async()=>{
 const f=fixture({draft:[row,{...row,color:'Green'},foreignDraft]});
 await assert.rejects(f.index(),/CLOSET_AUTO_INDEX_STALE_REVIEW/);
 assert.equal(f.stored.size,0);assert.equal(f.draft.length,3);
});
test('sign-out and sign-in with the same owner ID revokes queued analysis',async()=>{
 const f=fixture({holdQueue:true}),pending=f.index();
 f.setEpoch(1);f.release();
 assert.equal(await pending,false);assert.equal(f.commits,0);assert.equal(f.draft.length,2);
});
test('owner switch during a queued transaction does not modify foreign owner storage',async()=>{
 const f=fixture({holdQueue:true}),pending=f.index();
 f.setOwner('signed-owner-b');f.release();
 await assert.rejects(pending,/Revoked session/);
 assert.equal(f.commits,0);assert.equal(f.stored.size,0);
});
test('second-tab draft records are removed only by their verified own transaction',()=>{
 assert.match(implementation,/savedStore\.add\(value\)/);
 assert.match(implementation,/rows\.filter\(row=>row\.id!==value\.id\)/);
 assert.doesNotMatch(implementation,/persistDraft\(/);
 assert.match(source,/if\(!savingIndexed\)persistDraft\(\)/);
});

test('rejected automatic indexing never triggers a whole-draft cleanup write',()=>{
 assert.match(source,/savingIndexed=true;\s*const wasSaved=await saveIndexed/);
 assert.match(source,/if\(!savingIndexed\)persistDraft\(\)/);
 assert.doesNotMatch(implementation,/persistDraft\(/);
});
