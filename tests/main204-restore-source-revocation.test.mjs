/**
 * MAIN204: a same-ID v1-v3 restore may not silently resurrect or revoke
 * a locally saved original's owner-source lifecycle. Genuine IndexedDB
 * transactions with synthetic owner and minimal JPEG, no hosted writes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import {prepareDefaultAtomicM3,commitDefaultAtomicM3}
 from '../public/native-default-atomic-import-m3.mjs';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
const text=path=>readFileSync(path,'utf8');
const exact=runInNewContext(
 text('public/taxonomy.js')+'\n'+
 text('public/outfit-board-engine.js').slice(0,text('public/outfit-board-engine.js').indexOf('function boardGaps('))+'\n'+
 text('public/trends.js').slice(text('public/trends.js').indexOf('function validLook(value){'),
   text('public/trends.js').indexOf('function storeLooks('))+
 '\n({normalizeClothing,cleanOutfitBoard,validLook})',
 {categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  safeInspirationUrl:()=>'',structuredClone,crypto:globalThis.crypto}
);
const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,217]).toString('base64');
const sha=createHash('sha256').update(Buffer.from([255,216,255,217])).digest('hex');
const garment=(owner,flags={})=>({
 id:'source-garment',ownerId:owner,name:'Reviewed shirt',category:'Tops',
 itemType:'T-shirt',color:'Blue',colorSource:'user',image:jpeg,
 sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:true,
 ownerReviewed:true,userAdjusted:true,sourcePhotoOriginal:true,
 originalPhoto:{ownerId:owner,image:jpeg,sha256:sha},...flags
});
const backup=(row,version=3)=>({format:'closet-current',version,items:[row]});
let sequence=0;
async function fixture(flags={}){
 const owner='main204-synthetic-owner-'+(++sequence);
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,1);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 const stored=garment(owner,flags);
 await write(db,'items',stored);
 await write(db,'state',{id:'outfit-board',
  current:{slots:{top:stored.id}},saved:[{name:'Saved',slots:{top:stored.id}}]});
 await write(db,'state',{id:'cloud-sync',baseVersion:4,baseDocument:null,
  localRevision:8,dirty:false});
 let active=true;
 const assertLease=()=>{if(!active)throw Error('M204_OWNER_REVOKED');};
 return {owner,db,stored,assertLease,revoke:()=>{active=false;},close:()=>db.close()};
}
async function write(db,store,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(value);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
  tx.onabort=()=>reject(tx.error);
 });
}
async function snapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
const prepare=(f,b)=>prepareDefaultAtomicM3({
 data:b,ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,...exact
});
const commit=(f,plan)=>commitDefaultAtomicM3({
 ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,
 prepared:plan,confirmed:true
});
for(const flag of ['deleted','sourceRevoked']){
 test('M204 stale v3 restore cannot clear existing '+flag+' via missing flag',async()=>{
  const f=await fixture({[flag]:true});
  try{
   const before=await snapshot(f.db);
   const older=structuredClone(f.stored);
   delete older[flag];older.color='Green';
   await assert.rejects(prepare(f,backup(older)),
    /LEGACY_ATOMIC_EXISTING_SOURCE_LIFECYCLE_CONFLICT/);
   assert.deepEqual(await snapshot(f.db),before,'no private rows or cloud marker changed');
  }finally{f.close();}
 });
 test('M204 v1/v3 cannot explicitly clear '+flag+' or introduce it on live source',async()=>{
  for(const priorValue of [false,true]){
   const f=await fixture({[flag]:priorValue});
   try{
    const before=await snapshot(f.db);
    const old={...f.stored,[flag]:!priorValue,color:'Purple'};
    await assert.rejects(prepare(f,backup(old,priorValue?3:1)),
     /LEGACY_ATOMIC_EXISTING_SOURCE_LIFECYCLE_CONFLICT/);
    assert.deepEqual(await snapshot(f.db),before);
   }finally{f.close();}
  }
 });
 test('M204 matching '+flag+' lifecycle permits same-original metadata correction',async()=>{
  const f=await fixture({[flag]:true});
  try{
   const approved={...f.stored,color:'Orange'};
   const plan=await prepare(f,backup(approved));
   await commit(f,plan);
   const result=await snapshot(f.db);
   assert.equal(result.items[0][flag],true);
   assert.equal(result.items[0].color,'Orange');
   assert.equal(result.items[0].originalPhoto.image,jpeg);
   assert.equal(result.state.find(x=>x.id==='cloud-sync').localRevision,9);
  }finally{f.close();}
 });
}
test('M204 current signed owner ordinary same-ID metadata restore is preserved',async()=>{
 const f=await fixture();
 try{
  const approved={...f.stored,color:'Green'};
  const plan=await prepare(f,backup(approved));
  await commit(f,plan);
  const result=await snapshot(f.db);
  assert.equal(result.items[0].color,'Green');
  assert.equal(result.state.find(x=>x.id==='outfit-board').current.slots.top,
   'source-garment');
 }finally{f.close();}
});
test('M204 revocation after preflight but before atomic commit aborts all writes',async()=>{
 const f=await fixture();
 try{
  const plan=await prepare(f,backup({...f.stored,color:'Green'}));
  await write(f.db,'items',{...f.stored,sourceRevoked:true});
  const before=await snapshot(f.db);
  await assert.rejects(commit(f,plan),/LEGACY_ATOMIC_CONFLICT/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
