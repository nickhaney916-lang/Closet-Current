'use strict';
// Source-extracted Mission 3 exact owner-private queued garment DELETE.
// Simulate two browser tabs sharing one record and a single readwrite
// transaction. Actual browser tests separately use native IndexedDB.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const extract=(start,end)=>{
 const i=app.indexOf(start),j=app.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Missing exact application source '+start);
 return app.slice(i,j);
};
const exact=[
 extract('function queued(work){','let db,items='),
 extract('function ownerWardrobeMutationLease(){','function writeAll(values){'),
 extract('function removeItem(id,expected){','function persistDraft(')
].join('\n');
const flush=async()=>{for(let i=0;i<35;i++)await Promise.resolve();};
const initial={id:'garment-one',name:'Original blue shirt',ownerId:'synthetic-A',
 category:'Tops',color:'Blue',sourceSHA256:'synthetic-photo-hash',
 originalPhoto:{sha256:'synthetic-photo-hash'}};
const clone=structuredClone;
function mockDB(owner,records){
 const db={name:'closet-current-user-'+owner};
 db.transaction=()=>{
  let tx,done=false,aborted=false;
  const store={
   get(id){
    const request={result:undefined,onsuccess:null};
    queueMicrotask(()=>{
     if(aborted)return;
     request.result=records.has(id)?clone(records.get(id)):undefined;
     request.onsuccess?.();
     if(!aborted&&!done)queueMicrotask(()=>{if(!done&&!aborted){done=true;tx.oncomplete?.();}});
    });
    return request;
   },
   delete(id){
    queueMicrotask(()=>{
     if(aborted||done)return;
     records.delete(id);done=true;tx.oncomplete?.();
    });
   }
  };
  tx={
   objectStore:()=>store,abort(){
    if(aborted||done)return;
    aborted=true;queueMicrotask(()=>tx.onabort?.());
   },
   oncomplete:null,onerror:null,onabort:null,error:null
  };
  return tx;
 };
 return db;
}
function fixture(){
 const A='synthetic-A',B='synthetic-B',rows=new Map([[initial.id,clone(initial)]]);
 const events=[],auth={user:{id:A},assertCurrent(){}};
 const aDB=mockDB(A,rows),bDB=mockDB(B,new Map());
 const ctx={db:aDB,window:{
  closetAuth:auth,
  closetCloud:{beforeWrite:async db=>events.push('before:'+db.name),
   changed:()=>events.push('cloud:'+ctx.window.closetAuth.user?.id)},
  closetIndex02:{refresh:()=>events.push('index:'+ctx.window.closetAuth.user?.id)}
 },captureOperationEpoch:0,writes:Promise.resolve(),structuredClone,
 Promise,Error,JSON,queueMicrotask,normalizeClothing:x=>x,
 nativeIndex07Refresh:async()=>events.push('nativeIndex'),
 message:s=>events.push('message:'+s)};
 vm.createContext(ctx);vm.runInContext(exact,ctx);
 return {ctx,auth,rows,events,A,B,aDB,bDB,
  switchOwner(){ctx.captureOperationEpoch++;auth.user={id:B};ctx.db=bDB;ctx.writes=Promise.resolve();},
  sameOwnerRelogin(){ctx.captureOperationEpoch++;ctx.db=mockDB(A,rows);ctx.writes=Promise.resolve();}
 };
}
test('deletion of the exact owner-reviewed saved row commits and refreshes the index',async()=>{
 const f=fixture();await f.ctx.removeItem(initial.id,clone(initial));await flush();
 assert.equal(f.rows.has(initial.id),false);
 assert.ok(f.events.includes('nativeIndex'));assert.ok(f.events.includes('cloud:'+f.A));
});
test('another tab editing a saved color prevents a stale tab from deleting it',async()=>{
 const f=fixture();const expected=clone(initial);
 f.rows.set(initial.id,{...clone(initial),color:'Red',name:'Updated in tab B'});
 await assert.rejects(f.ctx.removeItem(initial.id,expected),/CLOSET_STALE_DELETE_REOPEN_EDITOR/);
 assert.equal(f.rows.get(initial.id).color,'Red');await flush();
 assert.ok(!f.events.includes('nativeIndex'));
 assert.ok(!f.events.includes('cloud:'+f.A));
});
test('another tab changing source SHA blocks deletion even with same category and name',async()=>{
 const f=fixture();f.rows.set(initial.id,{...clone(initial),sourceSHA256:'updated-original'});
 await assert.rejects(f.ctx.removeItem(initial.id,clone(initial)),/CLOSET_STALE_DELETE_REOPEN_EDITOR/);
 assert.equal(f.rows.get(initial.id).sourceSHA256,'updated-original');
});
test('deleted from another tab can never be treated as a successful owner deletion',async()=>{
 const f=fixture();f.rows.delete(initial.id);
 await assert.rejects(f.ctx.removeItem(initial.id,clone(initial)),/CLOSET_STALE_DELETE_REOPEN_EDITOR/);
 assert.equal(f.rows.size,0);
});
test('delete without exact reviewed row is denied before any owner cloud preflight',async()=>{
 const f=fixture();
 await assert.rejects(f.ctx.removeItem(initial.id),/CLOSET_STALE_DELETE_REOPEN_EDITOR/);
 assert.equal(f.rows.has(initial.id),true);assert.deepEqual(f.events,[]);
});
test('delete of mismatched garment ID cannot silently remove different saved record',async()=>{
 const f=fixture();
 await assert.rejects(f.ctx.removeItem(initial.id,{...clone(initial),id:'not-the-same'}),/CLOSET_STALE_DELETE_REOPEN_EDITOR/);
 assert.equal(f.rows.has(initial.id),true);
});
test('after explicit reread, latest owner row can be deleted with confirmation',async()=>{
 const f=fixture();const obsolete=clone(initial);
 f.rows.set(initial.id,{...clone(initial),color:'Purple'});
 await assert.rejects(f.ctx.removeItem(initial.id,obsolete),/CLOSET_STALE_DELETE_REOPEN_EDITOR/);
 const refreshed=clone(f.rows.get(initial.id));
 await f.ctx.removeItem(initial.id,refreshed);
 assert.equal(f.rows.has(initial.id),false);
});
test('old owner queued work never deletes garments after switching to new owner',async()=>{
 const f=fixture();let release;
 f.ctx.window.closetCloud.beforeWrite=async()=>new Promise(r=>{release=r;});
 const pending=f.ctx.removeItem(initial.id,clone(initial));
 await flush();assert.equal(typeof release,'function');
 f.switchOwner();release();
 await assert.rejects(pending,/changed|ended/);
 assert.equal(f.rows.has(initial.id),true);
});
test('same owner relogin also invalidates a queued stale delete',async()=>{
 const f=fixture();let release;
 f.ctx.window.closetCloud.beforeWrite=async()=>new Promise(r=>{release=r;});
 const pending=f.ctx.removeItem(initial.id,clone(initial));
 await flush();f.sameOwnerRelogin();release();
 await assert.rejects(pending,/changed|ended/);
 assert.equal(f.rows.has(initial.id),true);
});
