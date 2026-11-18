/**
 * MAIN226 — v4 lossless import/export must refuse retired garment references
 * in active or saved outfits, just as the independently proven v3 fence does.
 *
 * Real fake-indexeddb transactions, real public licensed Commons JPEG SHA256,
 * no hosted accounts, no positive model simulation and no deployment.
 * Intentionally RED against exact unmodified M224 source.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {exportLosslessV4M3,restoreLosslessV4M3}
 from '../public/native-lossless-v4-owner-acceptance-m3.mjs';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
const licensed=readFileSync('benchmark/fixtures/commons-0053.jpg');
assert.equal(licensed[0],255);assert.equal(licensed[1],216);
const jpeg='data:image/jpeg;base64,'+licensed.toString('base64');
const sha=createHash('sha256').update(licensed).digest('hex');
assert.match(sha,/^[0-9a-f]{64}$/);

function garment(owner,flag=null){
 return {id:'owned-top',ownerId:owner,image:jpeg,
  originalPhoto:{ownerId:owner,image:jpeg,sha256:sha},sourceSHA256:sha,
  sourceHashVerified:true,ownerReviewed:true,category:'Tops',
  itemType:'T-shirt',color:'Blue',...(flag?{[flag]:true}:{})};
}
function outfit(which){
 const used={name:'Reviewed source outfit',slots:{top:'owned-top'}};
 const empty={name:'Empty outfit',slots:{}};
 return {id:'outfit-board',current:which==='current'?used:empty,
  saved:which==='saved'?[used]:[]};
}
function backup(owner,flag,which){
 return {format:'closet-current',version:4,ownerId:owner,
  items:[garment(owner,flag)],
  state:{draft:{id:'draft',batch:[]},looks:{id:'looks',looks:[]},
   'outfit-board':outfit(which)}};
}
async function dbFor(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function write(db,store,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(row);
  tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function snapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function fixture(flag,which,storeBoard){
 const owner='m226-'+randomUUID(),db=await dbFor(owner);
 await write(db,'state',{id:'cloud-sync',baseVersion:0,baseDocument:null,localRevision:1,dirty:false});
 if(storeBoard){
  await write(db,'items',garment(owner,flag));
  await write(db,'state',{id:'draft',batch:[]});
  await write(db,'state',{id:'looks',looks:[]});
  await write(db,'state',outfit(which));
 }
 return {owner,db,assertLease:()=>{},close:()=>db.close()};
}

test('M226 uses genuine immutable public JPEG SHA-256, not a placeholder image',()=>{
 assert.ok(licensed.length>128);assert.match(jpeg,/^data:image\/jpeg;base64,/);
 assert.equal(createHash('sha256').update(licensed).digest('hex'),sha);
});

for(const flag of ['deleted','sourceRevoked']){
 for(const where of ['current','saved']){
  test('M226 v4 EXPORT refuses '+flag+' selected in '+where+' outfit before download',async()=>{
   const f=await fixture(flag,where,true);
   try{
    const before=await snapshot(f.db);
    await assert.rejects(
     exportLosslessV4M3({ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease}),
     /M3_V4_RETIRED_OUTFIT_SOURCE/);
    assert.deepEqual(await snapshot(f.db),before,'private records changed after export denial');
   }finally{f.close();}
  });
  test('M226 v4 IMPORT refuses '+flag+' selected in '+where+' outfit before consent/write',async()=>{
   const f=await fixture(null,'current',false),data=backup(f.owner,flag,where);
   try{
    const before=await snapshot(f.db);
    let consent=0;
    await assert.rejects(restoreLosslessV4M3({
     ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,data,
     confirm:async()=>{consent++;return true;}
    }),/M3_V4_RETIRED_OUTFIT_SOURCE/);
    assert.equal(consent,0,'retired source reached user replacement confirmation');
    assert.deepEqual(await snapshot(f.db),before,'retired outfit changed private DB');
   }finally{f.close();}
  });
 }
}
for(const where of ['current','saved']){
 test('M226 active original '+where+' outfit EXPORT remains lossless',async()=>{
  const f=await fixture(null,where,true);
  try{
   const result=await exportLosslessV4M3({
    ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease});
   assert.equal(result.data.items.length,1);
   assert.equal(result.data.items[0].originalPhoto.image,jpeg);
   assert.equal(result.data.state['outfit-board'][where==='current'?'current':'saved']
    [where==='current'?'slots':0][where==='current'?'top':'slots']?.top??'owned-top','owned-top');
   assert.equal(result.releaseAuthorized,false);
  }finally{f.close();}
 });
 test('M226 active original '+where+' outfit IMPORT remains atomic',async()=>{
  const f=await fixture(null,'current',false);
  try{
   let consent=0;
   const result=await restoreLosslessV4M3({
    ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,
    data:backup(f.owner,null,where),confirm:async()=>{consent++;return true;}
   });
   assert.equal(consent,1);assert.equal(result.restored,true);assert.equal(result.atomic,true);
   const after=await snapshot(f.db);
   assert.equal(after.items.length,1);
   assert.equal(after.items[0].originalPhoto.image,jpeg);
   assert.equal(after.state.find(x=>x.id==='outfit-board')[where==='current'?'current':'saved']
    [where==='current'?'slots':0][where==='current'?'top':'slots']?.top??'owned-top','owned-top');
   assert.equal(result.releaseAuthorized,false);
  }finally{f.close();}
 });
}
test('M226 unreferenced revoked historical item remains in full v4 backup',async()=>{
 const f=await fixture('sourceRevoked','current',false);
 try{
  await write(f.db,'items',garment(f.owner,'sourceRevoked'));
  await write(f.db,'state',outfit('empty'));
  const result=await exportLosslessV4M3({ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease});
  assert.equal(result.data.items.length,1);assert.equal(result.data.items[0].sourceRevoked,true);
  assert.equal(result.data.items[0].originalPhoto.image,jpeg);
 }finally{f.close();}
});
test('M226 unreferenced deleted historical item may restore without reviving outfit slot',async()=>{
 const f=await fixture(null,'current',false);
 try{
  const data=backup(f.owner,'deleted','empty');
  const result=await restoreLosslessV4M3({
   ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,data,confirm:async()=>true});
  assert.equal(result.restored,true);
  const after=await snapshot(f.db),restored=after.items[0];
  assert.equal(restored.deleted,true);
  assert.equal(restored.originalPhoto.image,jpeg);
  const board=after.state.find(x=>x.id==='outfit-board');
  assert.deepEqual(board.current.slots,{});
 }finally{f.close();}
});
test('M226 legacy missing physical outfit reference remains an explicit unverified v4 review',async()=>{
 const f=await fixture(null,'current',false);
 try{
  const data=backup(f.owner,null,'current');
  data.state['outfit-board'].current.slots.top='absent-owner-photo';
  const result=await restoreLosslessV4M3({
   ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,data,confirm:async()=>true});
  assert.equal(result.restored,true);
  const after=await snapshot(f.db);
  assert.equal(after.state.find(x=>x.id==='outfit-board').current.slots.top,'absent-owner-photo');
  assert.equal(result.releaseAuthorized,false);
 }finally{f.close();}
});