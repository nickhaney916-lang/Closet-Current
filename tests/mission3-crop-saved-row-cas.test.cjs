'use strict';
// Exercise the exact shipped app.js crop -> saved-garment CAS path, not a
// reimplementation of the production crop logic. Synthetic evidence only.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
function section(begin,end){
 const a=source.indexOf(begin),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Required actual app.js source section missing: '+begin);
 return source.slice(a,b);
}
const runtime=[
 section('function ownerWardrobeMutationLease(){','function writeAll(values){'),
 section('function saveEditedGarment(updated,expected){','function removeItem(id,expected){'),
 section('function cropClothingPhoto(item){','function cropButton(item){')
].join('\n');
const original='data:image/jpeg;base64,/9j/';
function fixture(){
 const row={id:'shared-garment',ownerId:'owner-a',color:'Blue',category:'Tops',
  name:'Blue shirt',image:original,sourceSHA256:'a'.repeat(64),
  originalPhoto:{image:original,sha256:'a'.repeat(64)}};
 const stored=new Map([[row.id,structuredClone(row)]]);
 const auth={user:{id:'owner-a'},assertCurrent(){}};
 const messages=[],events=[];
 let cropConfig=null;
 const database={name:'closet-current-user-owner-a',transaction(name,mode){
  assert.equal(name,'items');assert.equal(mode,'readwrite');
  let aborted=false,completed=false;const staged=[];
  const tx={oncomplete:null,onerror:null,onabort:null,error:null,
   abort(){aborted=true;queueMicrotask(()=>tx.onabort?.());},
   objectStore(store){
    assert.equal(store,'items');
    return {
     get(id){
      const request={result:undefined,onsuccess:null};
      queueMicrotask(()=>{
       if(aborted)return;
       request.result=stored.has(id)?structuredClone(stored.get(id)):undefined;
       request.onsuccess?.();
      });
      return request;
     },
     put(value){
      staged.push(structuredClone(value));events.push('attempted-cas-write');
      queueMicrotask(()=>{
       if(aborted||completed)return;
       completed=true;
       for(const next of staged)stored.set(next.id,structuredClone(next));
       tx.oncomplete?.();
      });
     }
    };
   }
  };
  return tx;
 }};
 const ctx={window:{closetAuth:auth},db:database,captureOperationEpoch:0,
  localPending:new Set(),busy:false,items:[row],batch:[],stream:null,cameraOpening:false,
  stopCamera(){},structuredClone,JSON,location:{search:''},
  queued:fn=>Promise.resolve().then(fn),
  openPhotoCrop(_item,config){cropConfig=config;return Promise.resolve();},
  checkPhoto:async()=>({colorEstimate:null,signature:'test-crop',aspect:1}),
  ClothingDetails:{fillColor:value=>value},
  normalizeClothing:value=>value,
  nativeIndex07Refresh:async()=>{events.push('refresh');},
  message:text=>messages.push(String(text)),render(){events.push('render');}
 };
 vm.createContext(ctx);vm.runInContext(runtime,ctx);
 function open(){ctx.cropClothingPhoto(row);assert.ok(cropConfig?.save);return cropConfig;}
 async function save(config){
  return config.save({image:'data:image/jpeg;base64,/9j/AA==',
   cropBounds:{x:0,y:0,width:1,height:1}},null);
 }
 return {row,stored,events,messages,open,save,ctx};
}

test('the real saved-crop branch demands row CAS, never blind writeAll',()=>{
 const crop=section('function cropClothingPhoto(item){','function cropButton(item){');
 assert.match(crop,/const expectedSavedCropRow=items\.includes\(item\)\?structuredClone\(item\):null/);
 assert.match(crop,/if\(expectedSavedCropRow\)await saveEditedGarment\(value,expectedSavedCropRow\)/);
 assert.doesNotMatch(crop,/await writeAll\(\[value\]\)/);
});

test('a crop opened before a second tab edits garment color cannot overwrite it',async()=>{
 const f=fixture(),dialog=f.open();
 f.stored.get(f.row.id).color='Red';
 await assert.rejects(f.save(dialog),/CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
 assert.equal(f.stored.get(f.row.id).color,'Red');
 assert.equal(f.stored.get(f.row.id).image,original);
 assert.equal(f.events.includes('attempted-cas-write'),false);
 assert.equal(f.events.includes('refresh'),false);
});

test('a crop opened before a second tab replaces source JPEG cannot revert the source',async()=>{
 const f=fixture(),dialog=f.open(),replacement='b'.repeat(64);
 f.stored.get(f.row.id).sourceSHA256=replacement;
 f.stored.get(f.row.id).originalPhoto.sha256=replacement;
 await assert.rejects(f.save(dialog),/CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
 assert.equal(f.stored.get(f.row.id).originalPhoto.sha256,replacement);
 assert.equal(f.events.includes('attempted-cas-write'),false);
});

test('a crop cannot resurrect a garment removed by another same-owner tab',async()=>{
 const f=fixture(),dialog=f.open();f.stored.delete(f.row.id);
 await assert.rejects(f.save(dialog),/CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
 assert.equal(f.stored.has(f.row.id),false);
 assert.equal(f.events.includes('attempted-cas-write'),false);
});

test('a fresh saved crop commits only to its owning private DB and preserves original',async()=>{
 const f=fixture(),dialog=f.open();await f.save(dialog);
 const saved=f.stored.get(f.row.id);
 assert.equal(saved.cropBounds.width,1);
 assert.equal(saved.originalPhoto.image,original);
 assert.equal(saved.originalPhoto.sha256,'a'.repeat(64));
 assert.deepEqual(f.events,['attempted-cas-write','refresh','render']);
});

test('an already-open crop cannot commit after owner logout or same-id relogin',async()=>{
 const f=fixture(),dialog=f.open();f.ctx.captureOperationEpoch++;
 await assert.rejects(f.save(dialog),/Private wardrobe changed accounts/);
 assert.equal(f.stored.get(f.row.id).image,original);
 assert.equal(f.events.includes('attempted-cas-write'),false);
});
