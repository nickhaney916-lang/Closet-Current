'use strict';
// Mission 3: execute exact unchanged app.js handlers, against synthetic local
// owner databases. No hosted cloud, owner photos, account IDs or deployments.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
function extract(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start);
 assert.ok(start>=0&&end>start,'Missing exact runtime section: '+a);
 return source.slice(start,end);
}
const lease=extract('function ownerWardrobeMutationLease(){','function writeAll(values){');
const edit=extract('function saveEditedGarment(updated,expected){','function removeItem(id){');
const backup=extract("$('import').onchange=async e=>","window.addEventListener('beforeunload'");
const jpeg='data:image/jpeg;base64,/9j/';
const piece={id:'shared-row',image:jpeg,category:'Tops',color:'Blue',name:'Blue shirt'};
const backupData={format:'closet-current',version:3,items:[piece]};
const pause=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function backupHarness({mode='',approve=true,holdFile=false,withLooks=false}={}){
 const messages=[],writes=[],looks=[],boards=[],readGate=pause(),importInput={value:''};
 const a={name:'closet-current-user-A'},b={name:'closet-current-user-B'};
 const auth={user:{id:'A'},assertCurrent(){}};
 let confirmed=0,bridgeCalls=0;
 const result={importInput,messages,writes,looks,boards,readGate};
 const ctx={
  window:{closetAuth:auth,restoreAtomic01Bridge:{importBackup:async(data,{confirm})=>{
   bridgeCalls++;const accepted=confirm({incoming:{itemCount:1,savedCount:0},existing:0,savedExisting:0});
   return accepted?{cancelled:false}:{cancelled:true};
  }}},
  db:a,captureOperationEpoch:0,
  $:id=>{assert.equal(id,'import');return importInput;},URLSearchParams,
  location:{search:mode},categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  normalizeClothing:value=>value,validLook:value=>value,
  readAllFrom:async()=>writes.flat(),
  writeAll:async values=>{writes.push(values);},importLooks:async values=>looks.push(values),
  importBoardBackup:async value=>boards.push(value),render(){},
  confirm:()=>{confirmed++;if(typeof approve==='function')return approve(result);return approve;},
  message:value=>messages.push(String(value))
 };
 vm.createContext(ctx);
 vm.runInContext(lease+'\n'+backup,ctx);
 const file={size:20,text:()=>holdFile?readGate.promise:Promise.resolve(JSON.stringify(
  withLooks?{...backupData,looks:[],outfitBoard:{saved:[]}}:backupData))};
 result.ctx=ctx;
 result.trigger=()=>importInput.onchange({target:{files:[file],value:'chosen'}});
 result.switchOwner=({sameId=false}={})=>{
  ctx.captureOperationEpoch++;
  if(!sameId){auth.user.id='B';ctx.db=b;}
 };
 Object.defineProperties(result,{confirmed:{get:()=>confirmed},bridgeCalls:{get:()=>bridgeCalls}});
 return result;
}
test('stale legacy backup file read never imports into the next owner same-id wardrobe',async()=>{
 const f=backupHarness({holdFile:true});
 const pending=f.trigger();await flush();f.switchOwner();
 f.readGate.resolve(JSON.stringify(backupData));await pending;
 assert.equal(f.writes.length,0);assert.equal(f.confirmed,0);
 assert.deepEqual(f.messages,[]);
});
test('logging out and back in as the SAME owner revokes a delayed legacy backup file',async()=>{
 const f=backupHarness({holdFile:true});
 const pending=f.trigger();f.switchOwner({sameId:true});
 f.readGate.resolve(JSON.stringify(backupData));await pending;
 assert.equal(f.writes.length,0);assert.equal(f.confirmed,0);
});
test('owner switching inside legacy backup confirmation fails closed before any write',async()=>{
 const f=backupHarness({approve:r=>{r.switchOwner();return true;}});
 await f.trigger();
 assert.equal(f.confirmed,1);assert.equal(f.writes.length,0);
 assert.deepEqual(f.messages,[]);
});
test('current owner can still import clothing, looks and outfit references',async()=>{
 const f=backupHarness({withLooks:true});
 await f.trigger();
 assert.equal(f.writes.length,1);
 assert.equal(f.writes[0][0].id,'shared-row');
 assert.equal(f.looks.length,1);assert.equal(f.boards.length,1);
 assert.equal(f.messages.at(-1),'Backup imported.');
});
test('stale native atomic-import file read cannot call restore bridge',async()=>{
 const f=backupHarness({mode:'?restoreAtomic01=research&nativeLossless04=research',holdFile:true});
 const p=f.trigger();f.switchOwner();
 f.readGate.resolve(JSON.stringify(backupData));await p;
 assert.equal(f.bridgeCalls,0);assert.deepEqual(f.messages,[]);
});
test('native atomic-import confirmation owner-switch cannot authorize a restore',async()=>{
 const f=backupHarness({mode:'?restoreAtomic01=research&nativeLossless04=research',
  approve:r=>{r.switchOwner();return true;}});
 await f.trigger();
 assert.equal(f.bridgeCalls,1);assert.deepEqual(f.messages,[]);
});
test('current owner retains native atomic restore confirmation and completion',async()=>{
 const f=backupHarness({mode:'?restoreAtomic01=research&nativeLossless04=research'});
 await f.trigger();
 assert.equal(f.bridgeCalls,1);
 assert.equal(f.messages.at(-1),'All clothing photos, category corrections and outfits restored together.');
});
function savedHarness({holdGet=false,holdCommit=false}={}){
 const writesA=[],writesB=[],getGate=pause(),commitGate=pause();
 let refresh=0;
 function ownerDB(id,writes){
  return {name:'closet-current-user-'+id,transaction(store,mode){
   assert.equal(store,'items');assert.equal(mode,'readwrite');
   const tx={oncomplete:null,onerror:null,onabort:null,error:null,
    abort(){queueMicrotask(()=>tx.onabort?.());},
    objectStore(){return {
      get(){const request={result:null,onsuccess:null};
       queueMicrotask(async()=>{
        if(holdGet&&id==='A')await getGate.promise;
        request.result={...piece};
        request.onsuccess?.();
       });return request;
      },
      put(value){writes.push({...value});queueMicrotask(async()=>{
       if(holdCommit&&id==='A')await commitGate.promise;
       tx.oncomplete?.();
      });}
     };}
   };return tx;
  }};
 }
 const a=ownerDB('A',writesA),b=ownerDB('B',writesB);
 const auth={user:{id:'A'},assertCurrent(){}};
 const ctx={
  window:{closetAuth:auth},db:a,captureOperationEpoch:0,
  queued:fn=>Promise.resolve().then(fn),normalizeClothing:x=>x,
  nativeIndex07Refresh:async()=>{refresh++;},JSON
 };
 vm.createContext(ctx);
 vm.runInContext(lease+'\n'+edit,ctx);
 return {ctx,writesA,writesB,getGate,commitGate,
  save:()=>ctx.saveEditedGarment({...piece,color:'Yellow'},{...piece}),
  switchOwner:({sameId=false}={})=>{ctx.captureOperationEpoch++;if(!sameId){auth.user.id='B';ctx.db=b;}},
  get refresh(){return refresh}
 };
}
test('queued saved edit cannot bind the next owner database',async()=>{
 const f=savedHarness();const promise=f.save();f.switchOwner();
 await assert.rejects(promise,/Private wardrobe changed accounts/);
 assert.equal(f.writesA.length,0);assert.equal(f.writesB.length,0);
});
test('re-login with the same owner ID rejects a pending saved-garment read',async()=>{
 const f=savedHarness({holdGet:true});const p=f.save();
 await flush();f.switchOwner({sameId:true});f.getGate.resolve();
 await assert.rejects(p,/Private wardrobe changed accounts/);
 assert.equal(f.writesA.length,0);
});
test('post-commit stale saved editor cannot refresh the next owner screen',async()=>{
 const f=savedHarness({holdCommit:true});const p=f.save();
 await flush();assert.equal(f.writesA.length,1);
 f.switchOwner();f.commitGate.resolve();
 await assert.rejects(p,/Private wardrobe changed accounts/);
 assert.equal(f.writesB.length,0);assert.equal(f.refresh,0);
});
test('valid saved editor mutation persists to the signed owner and refreshes the index',async()=>{
 const f=savedHarness();await f.save();
 assert.equal(f.writesA.length,1);assert.equal(f.writesA[0].color,'Yellow');
 assert.equal(f.writesB.length,0);assert.equal(f.refresh,1);
});
