'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const ClothingMemory=require('../public/clothing-memory.js');
const ClothingDetails=require('../public/clothing-details.js');
const app=fs.readFileSync('public/app.js','utf8');
const taxonomy=fs.readFileSync('public/taxonomy.js','utf8');
const context={};vm.createContext(context);
vm.runInContext(taxonomy+';globalThis.normalized44=normalizeClothing',context);
const normalize=x=>context.normalized44(x);
const start=app.indexOf('f.onsubmit=async e=>{e.preventDefault();ok.disabled=true;');
const stop=app.indexOf('if(nativeCorrection10Active()){',start);
assert.ok(start>0&&stop>start,'must execute real My Closet saved editor submit, not a duplicated algorithm');
const submitCode=app.slice(start,stop);
const base=()=>({
 id:'jacket44',ownerId:'owner44',name:'Jacket',category:'Outerwear',itemType:'Jacket',
 color:'Gray',colorSource:'photo-estimate',notes:'',pattern:'Solid',fit:'Regular',
 sleeveLength:'Long sleeve',seasons:['Winter'],image:'data:image/jpeg;base64,AAAA',
 sourceSHA256:'f'.repeat(64),originalPhoto:{sha256:'f'.repeat(64),image:'locked-original'},
 learningReviewedWeek:'stale-week'
});
const clone=v=>structuredClone(v);
async function open(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
const readOne=(db,id)=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').get(id);
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const putOne=(db,row)=>new Promise((resolve,reject)=>{
 const tx=db.transaction('items','readwrite');tx.objectStore('items').put(row);
 tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});
async function runSavedEdit(before,formData,{cas=false,stale=false}={}){
 const owner='confirm44-'+Math.random().toString(36).slice(2);
 const db=await open(owner),original={...clone(before),ownerId:owner};
 await putOne(db,original);
 const edited={...clone(original),...formData};
 let closed=false,rendered=0,refreshes=0,attempted=0,errors=[];
 const readCurrent=()=>readOne(db,original.id);
 const sandbox={
  f:{},ok:{disabled:false},item:clone(original),draft:clone(edited),
  collect:()=>normalize(clone(edited)),expectedSavedRow:cas?clone(original):null,
  ClothingMemory,queued:work=>work(),
  async commitOwnerCorrection10(next,expected){
   attempted++;
   const current=await readCurrent();
   if(JSON.stringify(current)!==JSON.stringify(expected))throw Error('CORRECTION10_STALE_SAVED_GARMENT');
   await putOne(db,next);
  },
  async writeAll(rows){attempted++;for(const row of rows)await putOne(db,row);},
  nativeIndex07Refresh:async()=>{refreshes++;},
  dialog:{close:()=>{closed=true;}},render:()=>{rendered++;},
  scheduleMemoryReview:()=>{},message:t=>errors.push(t)
 };
 vm.createContext(sandbox);
 vm.runInContext(submitCode,sandbox);
 if(stale)await putOne(db,{...original,notes:'Concurrent edit wins'});
 await sandbox.f.onsubmit({preventDefault(){}});
 const saved=await readCurrent();db.close();
 return {saved,original,edited,closed,rendered,refreshes,attempted,errors};
}
function integrity({saved,original}){
 assert.equal(saved.ownerId,original.ownerId);
 assert.equal(saved.image,original.image);
 assert.equal(saved.sourceSHA256,original.sourceSHA256);
 assert.deepEqual(saved.originalPhoto,original.originalPhoto);
}
for(const cas of [false,true]){
 test('CONFIRM44 saved closet '+(cas?'CAS':'ordinary')+' edit records actual confirmed category/subtype while retaining unedited estimated color',async()=>{
  const result=await runSavedEdit(base(),{itemType:'Coat',notes:'User inspected this coat'},{cas});
  assert.equal(result.closed,true);assert.equal(result.attempted,1);
  assert.equal(result.saved.itemType,'Coat');
  assert.equal(result.saved.notes,'User inspected this coat');
  assert.equal(result.saved.color,'Gray');
  assert.equal(result.saved.colorSource,'photo-estimate');
  assert.equal(result.saved.confirmedDetails.category,'Outerwear');
  assert.equal(result.saved.confirmedDetails.itemType,'Coat');
  assert.equal(result.saved.confirmedDetails.pattern,'Solid');
  assert.equal(result.saved.confirmedDetails.sleeveLength,'Long sleeve');
  assert.equal(Object.hasOwn(result.saved.confirmedDetails,'color'),false);
  assert.equal(result.saved.learningReviewedWeek,undefined);
  integrity(result);
 });
}
test('CONFIRM44 explicitly corrected user color remains authoritative, while confirmedDetails only tracks independently reviewed non-color fields',async()=>{
 const result=await runSavedEdit(base(),{color:'Green',colorSource:'user',itemType:'Blazer',pattern:'Plaid'},{cas:true});
 assert.equal(result.closed,true);
 assert.equal(result.saved.color,'Green');assert.equal(result.saved.colorSource,'user');
 assert.equal(result.saved.confirmedDetails.itemType,'Blazer');
 assert.equal(result.saved.confirmedDetails.pattern,'Plaid');
 assert.equal(Object.hasOwn(result.saved.confirmedDetails,'color'),false);
 assert.equal(ClothingDetails.fill(result.saved,{category:'Outerwear'},{color:'Red'},true).color,'Green');
 integrity(result);
});
test('CONFIRM44 intentional user blank color stays blank after save, no model refill or forged color confirmation',async()=>{
 const result=await runSavedEdit(base(),{color:'',colorSource:'user',notes:'Color intentionally unset'},{cas:false});
 assert.equal(result.closed,true);
 assert.equal(result.saved.color,'');
 assert.equal(result.saved.colorSource,'user');
 assert.equal(result.saved.confirmedDetails.category,'Outerwear');
 assert.equal(Object.hasOwn(result.saved.confirmedDetails,'color'),false);
 assert.equal(ClothingDetails.fillColor(result.saved,{color:'Red',support:1}),result.saved);
 integrity(result);
});
test('CONFIRM44 stale CAS reject cannot mutate confirmed-memory example or color/source fields',async()=>{
 const result=await runSavedEdit(base(),{itemType:'Coat',notes:'Stale edit'},{cas:true,stale:true});
 assert.equal(result.closed,false);
 assert.equal(result.attempted,1);
 assert.equal(result.saved.notes,'Concurrent edit wins');
 assert.equal(result.saved.itemType,'Jacket');
 assert.equal(result.saved.confirmedDetails,undefined);
 assert.equal(result.saved.colorSource,'photo-estimate');
 assert.equal(result.errors.length,1);
 integrity(result);
});
