const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const source=fs.readFileSync('public/app.js','utf8');
async function fixture(){
 const owner='side-'+Math.random(),db=await new Promise((resolve,reject)=>{const r=indexedDB.open('closet-current-user-'+owner,1);r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const auth={user:{id:owner},assertCurrent(){}};
 const ctx={window:{closetAuth:auth},db,captureOperationEpoch:0,queued:fn=>fn(),nativeIndex07Refresh:async()=>{}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/taxonomy.js','utf8'),ctx);
 vm.runInContext(source.slice(source.indexOf('function ownerWardrobeMutationLease(){'),source.indexOf('function writeAll(values){')),ctx);
 vm.runInContext(source.slice(source.indexOf('function saveEditedGarment('),source.indexOf('function removeItem(')),ctx);
 const write=row=>new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');if(row)tx.objectStore('items').put(row);else tx.objectStore('items').delete('shirt');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
 const read=()=>new Promise(resolve=>{const r=db.transaction('items').objectStore('items').get('shirt');r.onsuccess=()=>resolve(r.result);});
 const original={id:'shirt',name:'Blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue',seasons:[],image:'original-photo',sourceSHA256:'a'.repeat(64),originalPhoto:{image:'original-photo'}};
 await write(original);return {ctx,db,original,write,read};
}
test('ordinary editor atomically persists changed details while retaining original photo',async()=>{const f=await fixture();try{await f.ctx.saveEditedGarment({...f.original,name:'Updated'},f.original);assert.deepEqual(await f.read(),{...f.original,name:'Updated'});}finally{f.db.close();}});
test('ordinary stale editor rejects a newer persisted row',async()=>{const f=await fixture();try{await f.write({...f.original,name:'Other tab'});await assert.rejects(f.ctx.saveEditedGarment({...f.original,name:'Stale'},f.original),/STALE_SAVED_GARMENT/);assert.equal((await f.read()).name,'Other tab');}finally{f.db.close();}});
test('ordinary editor cannot resurrect a deleted row',async()=>{const f=await fixture();try{await f.write(null);await assert.rejects(f.ctx.saveEditedGarment(f.original,f.original),/STALE_SAVED_GARMENT/);assert.equal(await f.read(),undefined);}finally{f.db.close();}});
test('queued edit rejects account replacement before opening its write transaction',async()=>{const f=await fixture();try{f.ctx.queued=async work=>{f.ctx.window.closetAuth={user:{id:'other'}};return work();};await assert.rejects(f.ctx.saveEditedGarment({...f.original,name:'Wrong owner'},f.original),/Private wardrobe changed accounts|owner changed/);assert.deepEqual(await f.read(),f.original);}finally{f.db.close();}});
