/**
 * MAIN229 (HOLD): deterministically adversarial v4 source/owner integration.
 * Source: genuine licensed public JPEG, real fake-indexeddb transactions and
 * SHA256; no synthetic model positives, family accounts or hosted storage.
 * This is a no-deploy integration regression for the already accepted M228.
 * It does NOT claim to repair intermittent WebKit v3 or P94 model loads.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import {exportLosslessV4M3,restoreLosslessV4M3} from '../public/native-lossless-v4-owner-acceptance-m3.mjs';

const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
const bytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
assert.ok(bytes.length>128&&bytes[0]===255&&bytes[1]===216);
const photo='data:image/jpeg;base64,'+bytes.toString('base64');
const sourceSHA=createHash('sha256').update(bytes).digest('hex');

function item(owner){
 return {id:'owned-top',ownerId:owner,image:photo,
  originalPhoto:{ownerId:owner,image:photo,sha256:sourceSHA},
  sourceSHA256:sourceSHA,sourceHashVerified:true,ownerReviewed:true,
  category:'Tops',itemType:'T-shirt',color:'Blue'};
}
function board(){
 return {id:'outfit-board',
  current:{name:'Owner selected source',slots:{top:'owned-top'}},
  saved:[{name:'Saved original-photo outfit',slots:{top:'owned-top'}}]};
}
function incoming(owner){
 return {format:'closet-current',version:4,ownerId:owner,
  items:[item(owner)],
  state:{draft:{id:'draft',batch:[]},looks:{id:'looks',looks:[]},
   'outfit-board':board()}};
}
async function fixture(withExisting=false){
 const owner='m229-'+randomUUID();
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,1);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 await write(db,'state',{id:'cloud-sync',localRevision:1,dirty:false});
 if(withExisting){
  await write(db,'items',item(owner));
  for(const state of Object.values(incoming(owner).state))
   await write(db,'state',state);
 }
 return {owner,db,close:()=>db.close()};
}
function write(db,store,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(row);
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
function snapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
const cloud=rows=>rows.state.find(x=>x.id==='cloud-sync');

test('M229 export refuses stale signed original when another tab commits during SHA verification',async()=>{
 const f=await fixture(true);
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 const native=globalThis.crypto;
 let injected=0;
 try{
  const before=await snapshot(f.db);
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{
   subtle:{digest:async(...args)=>{
    if(injected++===0)
     await write(f.db,'state',{...cloud(before),localRevision:2,dirty:true});
    return native.subtle.digest(...args);
   }}
  }});
  await assert.rejects(exportLosslessV4M3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{}
  }),/M3_V4_SNAPSHOT_CHANGED_RETRY/);
  assert.ok(injected>=1,'adversarial write did not race SHA verification');
  const after=await snapshot(f.db);
  assert.deepEqual(after.items,before.items,'export mutated owner original JPEG');
  assert.equal(cloud(after).localRevision,2,'concurrent tab change was overwritten');
  assert.equal(cloud(after).dirty,true);
 }finally{
  if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);
  else delete globalThis.crypto;
  f.close();
 }
});

test('M229 v4 import CAS refuses another tab revision while owner reads confirmation',async()=>{
 const f=await fixture(false);
 try{
  let confirmations=0;
  await assert.rejects(restoreLosslessV4M3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},data:incoming(f.owner),
   confirm:async()=>{
    confirmations++;
    await write(f.db,'state',{id:'cloud-sync',localRevision:2,dirty:true});
    return true;
   }
  }),/RESTORE01 CONFLICT/);
  assert.equal(confirmations,1);
  const after=await snapshot(f.db);
  assert.deepEqual(after.items,[],'stale restore unexpectedly wrote garment');
  assert.equal(cloud(after).localRevision,2);
  assert.equal(after.state.some(x=>x.id==='outfit-board'),false,
   'stale restore unexpectedly wrote outfit');
 }finally{f.close();}
});

test('M229 signed owner lease revoked during v4 consent refuses all writes',async()=>{
 const f=await fixture(false);
 let valid=true;
 try{
  const before=await snapshot(f.db);
  await assert.rejects(restoreLosslessV4M3({
   ownerDB:f.db,ownerId:f.owner,
   assertLease:()=>{if(!valid)throw Error('M229_OWNER_LEASE_REVOKED');},
   data:incoming(f.owner),
   confirm:async()=>{valid=false;return true;}
  }),/M229_OWNER_LEASE_REVOKED/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});

test('M229 cancelled v4 import leaves existing source and saved outfit unchanged',async()=>{
 const f=await fixture(true);
 try{
  const before=await snapshot(f.db);
  const result=await restoreLosslessV4M3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},
   data:incoming(f.owner),confirm:async()=>false
  });
  assert.equal(result.cancelled,true);
  assert.equal(result.releaseAuthorized,false);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});

test('M229 uncontended explicit consent restores byte-identical source to saved 2D slots',async()=>{
 const f=await fixture(false);
 try{
  const result=await restoreLosslessV4M3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},
   data:incoming(f.owner),confirm:async()=>true
  });
  assert.equal(result.restored,true);
  assert.equal(result.atomic,true);
  assert.equal(result.releaseAuthorized,false);
  const after=await snapshot(f.db);
  assert.equal(after.items.length,1);
  assert.equal(after.items[0].originalPhoto.image,photo);
  assert.equal(after.items[0].sourceSHA256,sourceSHA);
  assert.equal(after.state.find(x=>x.id==='outfit-board').saved[0].slots.top,
   after.items[0].id);
  assert.equal(cloud(after).dirty,true);
 }finally{f.close();}
});
