/**
 * M226 — lossless V4 RESTORE01 must never admit a deleted/sourceRevoked
 * owner garment into a current/saved outfit, even with a valid original JPEG.
 * Independent of already-fixed legacy V3 and honest about temporarily
 * missing (rather than retired) outfit references.
 *
 * Real fake-indexeddb transactions, public licensed JPEG bytes and real
 * SHA-256. No model, hosted users, network, phones, private data or release.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {
 validateRestore01,readOwnerSnapshot01,exportBackup01,restoreOwner01
} from '../research/restore-atomic-01/atomic-restore.mjs';
import {
 exportLosslessV4M3,restoreLosslessV4M3
} from '../public/native-lossless-v4-owner-acceptance-m3.mjs';

globalThis.crypto??=webcrypto;
const jpg=readFileSync('benchmark/fixtures/commons-0053.jpg');
assert.equal(jpg[0],0xff);assert.equal(jpg[1],0xd8);
const sha=createHash('sha256').update(jpg).digest('hex');
const image='data:image/jpeg;base64,'+jpg.toString('base64');
const flagNames=['deleted','sourceRevoked'];
const whereNames=['current','saved'];
const refusal=/RESTORE01_RETIRED_OUTFIT_SOURCE/;
const newOwner=()=>('m226-'+randomUUID());
function piece(owner,flag=null){
 return {id:'photo-piece',ownerId:owner,category:'Tops',itemType:'T-shirt',
  color:'Blue',colorSource:'user',ownerReviewed:true,singleGarmentVerified:true,
  image,sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{image,sha256:sha,ownerId:owner},
  ...(flag?{[flag]:true}:{})};
}
function board(where='current',ref='photo-piece',owner=null){
 const used={id:'used-outfit',name:'Preserved look',slots:{top:ref},
  ...(owner?{ownerId:owner}:{})};
 const empty={name:'Empty look',slots:{}};
 return {id:'outfit-board',
  current:where==='current'?used:empty,
  saved:where==='saved'?[used]:[],
  futureBoardField:{leaveUnchanged:true}};
}
function v4(owner,flag,where='current',ref='photo-piece'){
 return {format:'closet-current',version:4,ownerId:owner,
  items:[piece(owner,flag)],
  state:{'outfit-board':board(where,ref,owner),
   draft:{id:'draft',batch:[]},
   looks:{id:'looks',looks:[]}}};
}
async function open(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function put(db,store,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(row);
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function withDb(fn){
 const owner=newOwner(),db=await open(owner),assertLease=()=>{};
 await put(db,'state',{id:'cloud-sync',localRevision:2,dirty:false});
 try{return await fn({owner,db,assertLease});}finally{db.close();}
}
function sig(rows){return JSON.stringify(rows);}
test('M226 exact original licensed JPEG is a SHA-pinned source',()=>{
 assert.match(sha,/^[0-9a-f]{64}$/);
 assert.ok(jpg.byteLength>100);
});
for(const flag of flagNames){
 for(const where of whereNames){
  test('M226 V4 validate refuses '+flag+' referenced in '+where,async()=>{
   const owner=newOwner(),incoming=v4(owner,flag,where);
   await assert.rejects(validateRestore01(incoming,{ownerId:owner}),refusal);
   assert.equal(incoming.items[0][flag],true);
   const selected=where==='current'?
    incoming.state['outfit-board'].current:incoming.state['outfit-board'].saved[0];
   assert.equal(selected.slots.top,'photo-piece');
  });
  test('M226 V4 export refuses '+flag+' referenced in '+where+' without private write',async()=>{
   await withDb(async({owner,db,assertLease})=>{
    const incoming=v4(owner,flag,where);
    await put(db,'items',incoming.items[0]);
    for(const row of Object.values(incoming.state))await put(db,'state',row);
    const before=await readOwnerSnapshot01(db,assertLease);
    assert.throws(()=>exportBackup01({ownerId:owner,rows:before.rows}),refusal);
    await assert.rejects(exportLosslessV4M3({ownerDB:db,ownerId:owner,assertLease}),refusal);
    const after=await readOwnerSnapshot01(db,assertLease);
    assert.equal(sig(after.rows),sig(before.rows));
   });
  });
  test('M226 signed V4 restore refuses '+flag+' referenced in '+where+' BEFORE consent or transaction',async()=>{
   await withDb(async({owner,db,assertLease})=>{
    const before=await readOwnerSnapshot01(db,assertLease);
    let confirmedCalled=false;
    const incoming=v4(owner,flag,where);
    await assert.rejects(restoreLosslessV4M3({
     ownerDB:db,ownerId:owner,assertLease,data:incoming,
     confirm:async()=>{confirmedCalled=true;return true;}
    }),refusal);
    assert.equal(confirmedCalled,false,'retired outfit must be rejected before consent prompt');
    const after=await readOwnerSnapshot01(db,assertLease);
    assert.equal(sig(after.rows),sig(before.rows),'retired v4 refusal cannot change owner items/state');
    await assert.rejects(restoreOwner01({db,assertLease,backup:incoming,
     ownerId:owner,expectedFingerprint:before.fingerprint,confirmed:true}),refusal);
    assert.equal(sig((await readOwnerSnapshot01(db,assertLease)).rows),sig(before.rows));
   });
  });
 }
}
for(const where of whereNames){
 test('M226 active owner-reviewed '+where+' V4 outfit still validates, exports and restores',async()=>{
  await withDb(async({owner,db,assertLease})=>{
   const incoming=v4(owner,null,where);
   assert.equal((await validateRestore01(incoming,{ownerId:owner})).valid,true);
   await put(db,'items',incoming.items[0]);
   for(const row of Object.values(incoming.state))await put(db,'state',row);
   const result=await exportLosslessV4M3({ownerDB:db,ownerId:owner,assertLease});
   assert.equal(result.data.items[0].originalPhoto.sha256,sha);
   assert.equal(result.data.state['outfit-board'].futureBoardField.leaveUnchanged,true);
   const restored=await restoreLosslessV4M3({
    ownerDB:db,ownerId:owner,assertLease,data:result.data,confirm:async()=>true
   });
   assert.equal(restored.restored,true);
   const restoredBoard=(await readOwnerSnapshot01(db,assertLease)).restore.state['outfit-board'];
   const selected=where==='current'?restoredBoard.current:restoredBoard.saved[0];
   assert.equal(selected.slots.top,'photo-piece');
  });
 });
}
test('M226 original archived retired garment WITHOUT an outfit reference remains losslessly recoverable',async()=>{
 const owner=newOwner();
 const incoming=v4(owner,'sourceRevoked','current','temporarily-missing');
 incoming.state['outfit-board'].current.slots={};
 incoming.state['outfit-board'].saved=[];
 assert.equal((await validateRestore01(incoming,{ownerId:owner})).valid,true);
 await withDb(async({owner:dbOwner,db,assertLease})=>{
  const archived=v4(dbOwner,'deleted');archived.state['outfit-board'].current.slots={};
  const before=await readOwnerSnapshot01(db,assertLease);
  const receipt=await restoreLosslessV4M3({
   ownerDB:db,ownerId:dbOwner,assertLease,data:archived,confirm:async()=>true
  });
  assert.equal(receipt.restored,true);
  const after=await readOwnerSnapshot01(db,assertLease);
  assert.equal(after.restore.items.length,1);
  assert.equal(after.restore.items[0].deleted,true);
  assert.notEqual(sig(after.rows),sig(before.rows));
 });
});
test('M226 missing original outfit reference stays visible for explicit reattachment; not conflated with retired present item',async()=>{
 const owner=newOwner();
 const incoming=v4(owner,null,'saved','known-missing-coat');
 incoming.state['outfit-board'].saved[0].slots={layer3:'known-missing-coat'};
 const receipt=await validateRestore01(incoming,{ownerId:owner});
 assert.equal(receipt.valid,true);
 assert.equal(receipt.missingOutfitReferencesAllowed,true);
 assert.equal(incoming.state['outfit-board'].saved[0].slots.layer3,'known-missing-coat');
});
