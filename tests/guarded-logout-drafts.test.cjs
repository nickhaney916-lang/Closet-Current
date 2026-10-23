'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
const start=source.indexOf('window.closetAuth.beforeSignOut=async()=>{');
const end=source.indexOf('\n// Account-bound file backup',start);
assert.ok(start>=0&&end>start,'expected account-owned pre-logout safety gate');
const code=source.slice(start,end);
function prepared({photo=true,processing=false,owner='A',dbOwner='A',save=async()=>true,queue=Promise.resolve()}={}){
 const texts=[],calls=[],window={closetAuth:{user:{id:owner}}};
 const state={
  window,message:text=>texts.push(text),busy:processing,cameraOpening:false,stream:null,saving:false,
  automaticRunning:false,automaticQueue:[],localPending:new Set(),localJobs:new Map(),
  batch:photo?[{id:'unsaved-picture',image:'synthetic-opaque-test-pixels'}]:[],
  db:dbOwner?{name:'closet-current-user-'+dbOwner}:null,
  persistDraft:async()=>{calls.push('persist');return save();},
  writes:queue
 };
 vm.runInNewContext(code,state);
 return {window,state,texts,calls,signOut:()=>window.closetAuth.beforeSignOut()};
}
test('flushes a pending synthetic photo draft before permitting signout',async()=>{
 let release;
 const deferred=new Promise(resolve=>release=resolve);
 const t=prepared({save:()=>deferred});
 const pending=t.signOut();
 assert.equal(t.calls.length,1);
 assert.equal(t.window.closetAuth.user.id,'A','owner remains active while local write awaits');
 release(true);
 assert.equal(await pending,true);
});
test('quota or transaction failure blocks logout and preserves in-memory draft',async()=>{
 for(const save of [async()=>false,async()=>{throw Error('QuotaExceededError');}]){
  const t=prepared({save});
  assert.equal(await t.signOut(),false);
  assert.equal(t.window.closetAuth.user.id,'A');
  assert.equal(t.state.batch.length,1);
  assert.match(t.texts.join(' '),/Keep this page open/);
 }
});
test('capture or recognition in progress blocks logout without attempting draft flush',async()=>{
 for(const field of ['busy','cameraOpening','stream','saving','automaticRunning','automaticQueue','localPending','localJobs']){
  const t=prepared(); const st=t.state;
  if(field==='automaticQueue')st.automaticQueue.push('task');
  else if(field==='localPending'||field==='localJobs')st[field].add?.('task')||st[field].set?.('task',{});
  else st[field]=field==='stream'?{}:true;
  assert.equal(await t.signOut(),false,field);
  assert.equal(t.calls.length,0,field);
 }
});
test('failed-to-open and different-owner IndexedDB cannot authorize logout with photos',async()=>{
 for(const dbOwner of [null,'B']){
  const t=prepared({dbOwner});
  assert.equal(await t.signOut(),false);
  assert.equal(t.calls.length,0);
 }
});
test('account change while draft is saving never authorizes signing out the new owner',async()=>{
 let release;const t=prepared({save:()=>new Promise(r=>release=r)});
 const pending=t.signOut();
 t.window.closetAuth.user.id='B';
 release(true);
 assert.equal(await pending,false);
 assert.equal(t.state.batch.length,1);
});
test('empty photo batch still waits for prior state writes',async()=>{
 let resolve;const t=prepared({photo:false,queue:new Promise(r=>resolve=r)});
 const pending=t.signOut();
 let settled=false;pending.then(()=>settled=true);
 await Promise.resolve();
 assert.equal(settled,false);
 resolve();
 assert.equal(await pending,true);
});


test('real draft persistence function waits for a synthetic IndexedDB commit',async()=>{
 const from=source.indexOf('function draftMetadataSnapshot(');
 const to=source.indexOf('\nfunction readDraft()',from);
 assert.ok(from>=0&&to>from,'draft snapshot and persistence source must be available');
 const storage=[];
 const database={name:'closet-current-user-A',transaction(name,mode){
  assert.equal(name,'state');assert.equal(mode,'readwrite');
  const tx={error:null,oncomplete:null,onerror:null,onabort:null};
  tx.objectStore=()=>({put(record){storage.push(structuredClone(record));setImmediate(()=>tx.oncomplete());}});
  return tx;
 }};
 const fields={draftSaveStatus:{textContent:''},retryDraftSave:{hidden:true}};
 const window={closetAuth:{user:{id:'A'}},closetCloud:{beforeWrite:async()=>{},changed(){}}};
 const context={window,db:database,batch:[{id:'test-photo',image:'synthetic-not-a-person'}],
  writes:Promise.resolve(),structuredClone,setImmediate,
  $:id=>fields[id],message:()=>{}};
 vm.runInNewContext(source.slice(from,to)+'\nwindow.persistDraftForTest=persistDraft;',context);
 assert.equal(await window.persistDraftForTest(),true);
 assert.equal(storage.length,1);
 assert.equal(storage[0].id,'draft');
 assert.equal(storage[0].batch[0].id,'test-photo');
 assert.equal(window.closetUnsavedDraftOwner,null);
});
test('real draft transaction quota failure returns false and keeps retry visible',async()=>{
 const from=source.indexOf('function draftMetadataSnapshot(');
 const to=source.indexOf('\nfunction readDraft()',from);
 const error=Object.assign(new Error('storage full'),{name:'QuotaExceededError'});
 const database={name:'closet-current-user-A',transaction(){
  const tx={error,oncomplete:null,onerror:null,onabort:null};
  tx.objectStore=()=>({put(){setImmediate(()=>tx.onerror());}});
  return tx;
 }};
 const fields={draftSaveStatus:{textContent:''},retryDraftSave:{hidden:true}};
 const window={closetAuth:{user:{id:'A'}},closetCloud:{beforeWrite:async()=>{},changed(){}}};
 const ctx={window,db:database,batch:[{id:'test-unsaved-photo'}],writes:Promise.resolve(),
  structuredClone,setImmediate,$:id=>fields[id],message:()=>{}};
 vm.runInNewContext(source.slice(from,to)+'\nwindow.persistDraftForTest=persistDraft;',ctx);
 assert.equal(await window.persistDraftForTest(),false);
 assert.equal(fields.retryDraftSave.hidden,false);
 assert.match(fields.draftSaveStatus.textContent,/Device storage is full/);
 assert.equal(ctx.batch.length,1,'unsaved photo remains in the page');
});
