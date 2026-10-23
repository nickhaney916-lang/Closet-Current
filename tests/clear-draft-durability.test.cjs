'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
const start=source.indexOf('async function clearUnfinishedPhotosSafely(){');
const end=source.indexOf('\n// A sign-out must never silently discard',start);
assert.ok(start>=0&&end>start,'Safely committed clear implementation required');
const clearCode=source.slice(start,end);

function fixture({mode='complete',confirmed=true,owner='owner-A',dbOwner='owner-A',
                 busy=false,automaticRunning=false,photoCount=2,delay=false}={}){
 const messages=[],saved=[],rendered=[],buttons={
  discard:{disabled:false},
  draftSaveStatus:{textContent:''},
  retryDraftSave:{hidden:false}
 };
 const ownerDatabase=dbOwner?{name:'closet-current-user-'+dbOwner}:null;
 let finish;
 if(ownerDatabase)ownerDatabase.transaction=(store,access)=>{
  assert.equal(store,'state');assert.equal(access,'readwrite');
  const tx={error:Object.assign(new Error('Device quota exceeded'),{name:'QuotaExceededError'}),oncomplete:null,onerror:null,onabort:null};
  tx.objectStore=()=>({put(v){
   const settle=()=>{
    if(mode==='complete')saved.push(structuredClone(v));
    if(mode==='complete')tx.oncomplete();
    else if(mode==='abort')tx.onabort();
    else tx.onerror();
   };
   if(delay)finish=settle;
   else setImmediate(settle);
  }});
  return tx;
 };
 const initial=Array.from({length:photoCount},(_,i)=>({id:'photo-'+i,image:'synthetic-photo-'+i}));
 const ctx={
  batch:initial,session:5,clearingDraft:false,db:ownerDatabase,busy,cameraOpening:false,
  stream:null,saving:false,automaticRunning,automaticQueue:[],localPending:new Set(),localJobs:new Map(),
  window:{closetAuth:{user:{id:owner}},closetUnsavedDraftOwner:owner},confirm:()=>confirmed,
  message:t=>messages.push(t),render:()=>rendered.push('render'),
  $:id=>buttons[id],queued:work=>Promise.resolve().then(work)
 };
 vm.runInNewContext(clearCode,ctx);
 return {ctx,messages,saved,rendered,buttons,initial,
  clear:()=>ctx.clearUnfinishedPhotosSafely(),finish:()=>{assert.ok(finish,'expected a delayed transaction');finish();}
 };
}

test('successful clear waits for actual account-owned device transaction before changing UI',async()=>{
 const a=fixture({delay:true});
 const pending=a.clear();await new Promise(setImmediate);
 assert.equal(a.buttons.discard.disabled,true);
 assert.equal(a.ctx.batch.length,2,'the review list remains until transaction commits');
 assert.equal(a.saved.length,0);
 assert.equal(a.ctx.clearingDraft,true);
 a.finish();
 assert.equal(await pending,true);
 assert.equal(a.saved.length,1);
 assert.equal(a.saved[0].id,'draft');
 assert.equal(a.saved[0].batch.length,0);
 assert.equal(a.ctx.batch.length,0);
 assert.equal(a.ctx.session,0);
 assert.equal(a.ctx.window.closetUnsavedDraftOwner,null);
 assert.equal(a.buttons.discard.disabled,false);
 assert.equal(a.buttons.retryDraftSave.hidden,true);
 assert.equal(a.rendered.length,1);
 assert.match(a.messages.join(' '),/Cloud photo files and old backups may remain/);
});

for(const mode of ['error','abort']){
 test('failed '+mode+' clear keeps all original photos visible and retries enabled',async()=>{
  const a=fixture({mode});
  const prior=a.ctx.batch;
  assert.equal(await a.clear(),false);
  assert.equal(a.saved.length,0);
  assert.equal(a.ctx.batch,prior,'same owner review list retained');
  assert.equal(a.ctx.batch.length,2);
  assert.equal(a.ctx.session,5,'capture session unchanged');
  assert.equal(a.buttons.discard.disabled,false);
  assert.equal(a.ctx.clearingDraft,false);
  assert.equal(a.rendered.length,0,'no false empty UI');
  assert.match(a.buttons.draftSaveStatus.textContent,/Your photos are still here/);
 });
}
test('cancel means nothing is written or cleared',async()=>{
 const a=fixture({confirmed:false});
 assert.equal(await a.clear(),false);
 assert.equal(a.saved.length,0);
 assert.equal(a.ctx.batch.length,2);
});
test('processing in progress blocks removal rather than disrupting recognition',async()=>{
 for(const flags of [{busy:true},{automaticRunning:true}]){
  const a=fixture(flags);
  assert.equal(await a.clear(),false);
  assert.equal(a.saved.length,0);
  assert.equal(a.ctx.batch.length,2);
  assert.match(a.messages.join(' '),/Finish or stop photo processing/);
 }
});
test('missing or wrong-account device database blocks removal',async()=>{
 for(const dbOwner of [null,'owner-B']){
  const a=fixture({dbOwner});
  assert.equal(await a.clear(),false);
  assert.equal(a.ctx.batch.length,2);
  assert.equal(a.saved.length,0);
 }
});
test('two rapid Clear clicks cannot enqueue duplicate transactions',async()=>{
 const a=fixture({delay:true});
 const first=a.clear(),second=a.clear();
 assert.equal(await second,false);
 await new Promise(setImmediate);
 a.finish();
 assert.equal(await first,true);
 assert.equal(a.saved.length,1);
});
test('newly appended photograph during pending transaction cannot be hidden by stale Clear',async()=>{
 const a=fixture({delay:true});
 const first=a.clear();await new Promise(setImmediate);
 a.ctx.batch.push({id:'new-photo',image:'synthetic'});
 a.finish();
 assert.equal(await first,false);
 assert.equal(a.ctx.batch.length,3);
 assert.match(a.messages.join(' '),/review queue changed/);
});
test('persistDraft refuses to resurrect old photo metadata during explicit clear',async()=>{
 const begin=source.indexOf('function persistDraft(){');
 const stop=source.indexOf('\nfunction readDraft()',begin);
 assert.ok(begin>=0&&stop>begin);
 const ctx={clearingDraft:true,db:{name:'closet-current-user-owner-A'}};
 vm.runInNewContext(source.slice(begin,stop)+'\nthis.probe=persistDraft;',ctx);
 assert.equal(await ctx.probe(),false);
});
test('candidate refuses new photos during the explicit clear barrier',()=>{
 assert.match(source,/function candidate\(image,options=\{\}\)\{\s*if\(clearingDraft\)/);
});
