'use strict';
// Source-executed app.js saved-photo commit owner/private IndexedDB CAS tests.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
const a=source.indexOf('function savePiece(value,nextBatch,{expectedSavedRow=null}={}){');
const b=source.indexOf('function node(tag,text,className){',a);
assert.ok(a>=0&&b>a,'Missing real saved photo writer');
const saveSource=source.slice(a,b);
const original='data:image/jpeg;base64,/9j/';
const old={id:'same-piece',ownerId:'owner-a',image:original,color:'Blue',
 originalPhoto:{image:original,sha256:'a'.repeat(64)},sourceSHA256:'a'.repeat(64)};
function fixture({exists=true}={}){
 const saved=new Map(exists?[[old.id,structuredClone(old)]]:[]);
 const state=new Map([['draft',{id:'draft',batch:[{id:'pending-source'}]}]]);
 const calls=[],auth={user:{id:'owner-a'},assertCurrent(){}};
 const db={name:'closet-current-user-owner-a',transaction(names,mode){
  assert.deepEqual(Array.from(names),['items','state']);assert.equal(mode,'readwrite');
  const pending=[],tx={oncomplete:null,onerror:null,onabort:null,error:null};
  let aborted=false,scheduled=false;
  const schedule=()=>{
   if(scheduled)return;scheduled=true;
   queueMicrotask(()=>{
    if(aborted)return;
    for(const [name,value] of pending){
     if(name==='items')saved.set(value.id,structuredClone(value));
     else state.set(value.id,structuredClone(value));
    }
    tx.oncomplete?.();
   });
  };
  tx.abort=()=>{aborted=true;queueMicrotask(()=>tx.onabort?.());};
  tx.objectStore=name=>{
   assert.ok(['items','state'].includes(name));
   return {
    get(id){
     assert.equal(name,'items');
     const q={result:undefined,onsuccess:null};
     queueMicrotask(()=>{
      if(aborted)return;
      q.result=saved.has(id)?structuredClone(saved.get(id)):undefined;
      q.onsuccess?.();
     });return q;
    },
    put(value){
     calls.push(name+':put');pending.push([name,structuredClone(value)]);schedule();
    }
   };
  };
  return tx;
 }};
 const ctx={
  window:{closetAuth:auth},db,captureOperationEpoch:0,structuredClone,JSON,
  URLSearchParams,location:{search:''},
  normalizeClothing:value=>value,
  queued:fn=>Promise.resolve().then(fn),
  captureProofVerifyBeforeSave:async()=>{},
  nativeIndex07Refresh:async()=>{calls.push('refresh');}
 };
 vm.createContext(ctx);vm.runInContext(saveSource,ctx);
 const attempt=({expected=exists?structuredClone(old):null,value={...old,color:'Purple'}}={})=>
  ctx.savePiece(value,[{id:'retained-draft'}],{expectedSavedRow:expected});
 return {ctx,saved,state,calls,attempt};
}

test('an ordinary already-saved Adjust modal captures row even outside research flag',()=>{
 assert.match(source,/const expectedSavedRow=items\.some\(x=>x\.id===item\.id\)\?structuredClone\(item\):null/);
 assert.match(saveSource,/const expected=expectedSavedRow\?structuredClone\(expectedSavedRow\):null/);
 assert.match(saveSource,/const request=store\.get\(value\.id\)/);
});

test('saved photo change accepted only against exact existing owner row',async()=>{
 const f=fixture();await f.attempt();
 assert.equal(f.saved.get(old.id).color,'Purple');
 assert.deepEqual(f.calls,['items:put','state:put','refresh']);
 assert.deepEqual(f.state.get('draft').batch,[{id:'retained-draft'}]);
 assert.equal(f.saved.get(old.id).originalPhoto.sha256,'a'.repeat(64));
});

test('two-tab color correction conflicts without modifying clothing or capture draft',async()=>{
 const f=fixture();f.saved.get(old.id).color='Red';
 await assert.rejects(f.attempt(),/CLOSET_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
 assert.equal(f.saved.get(old.id).color,'Red');
 assert.deepEqual(f.calls,[]);
 assert.equal(f.state.get('draft').batch[0].id,'pending-source');
});

test('second tab replacing source JPEG is not reverted by a delayed first-tab save',async()=>{
 const f=fixture();f.saved.get(old.id).sourceSHA256='b'.repeat(64);
 await assert.rejects(f.attempt(),/CLOSET_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
 assert.equal(f.saved.get(old.id).sourceSHA256,'b'.repeat(64));
 assert.equal(f.calls.length,0);
});

test('existing saved garment removed elsewhere is not resurrected',async()=>{
 const f=fixture();f.saved.delete(old.id);
 await assert.rejects(f.attempt(),/CLOSET_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
 assert.equal(f.saved.has(old.id),false);
 assert.equal(f.calls.length,0);
});

test('new photograph ID colliding with an existing row cannot silently overwrite it',async()=>{
 const f=fixture();
 await assert.rejects(f.attempt({expected:null}),/CLOSET_ALREADY_SAVED_RELOAD_WARDROBE/);
 assert.equal(f.saved.get(old.id).color,'Blue');
 assert.equal(f.calls.length,0);
});

test('genuinely new original is atomically inserted with its draft state',async()=>{
 const f=fixture({exists:false});await f.attempt({expected:null});
 assert.equal(f.saved.get(old.id).color,'Purple');
 assert.deepEqual(f.calls,['items:put','state:put','refresh']);
});

test('frozen expected snapshot ignores caller changes made during asynchronous work',async()=>{
 const f=fixture(),expected=structuredClone(old);
 const pending=f.attempt({expected});
 expected.color='Yellow';
 await pending;assert.equal(f.saved.get(old.id).color,'Purple');
});

test('logout and same-owner relogin cancel queued writes before starting a transaction',async()=>{
 const f=fixture(),p=f.attempt();
 f.ctx.captureOperationEpoch++;
 await assert.rejects(p,/Saved clothing account session changed/);
 assert.deepEqual(f.calls,[]);
});
