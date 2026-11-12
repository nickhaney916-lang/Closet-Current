// Mission 3: genuine IndexedDB transactions (fake-indexeddb) run the exact
// research atomic import module with actual taxonomy and outfit cleaning.
// Only synthetic photo bytes and owner IDs, never a private/hosted account.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
import {prepareLegacyAtomicM3,commitLegacyAtomicM3}
 from '../research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs';
const text=(path)=>readFileSync(path,'utf8');
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
const row=(owner,id='shirt',category='Tops')=>({
 id,ownerId:owner,name:id,image:jpeg,category,itemType:category==='Shoes'?'Sneakers':'T-shirt',
 color:'Blue',colorSource:'user'
});
const look=(id)=>({id,title:id,sourceUrl:'',pieces:[]});
const board=(id)=>({current:{slots:{top:id}},saved:[{name:'Saved look',slots:{top:id}}]});
const backup=(owner)=>({format:'closet-current',version:3,items:[row(owner,'new-top')],
 looks:[look('new-look')],outfitBoard:board('new-top')});
const clone=x=>structuredClone(x);
const pause=()=>{let resume;const promise=new Promise(r=>resume=r);return {promise,resume};};
async function dbFor(owner){
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner,2);
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('items',{keyPath:'id'});
   request.result.createObjectStore('state',{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
 return db;
}
async function replace(db,store,row){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(row);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function snapshot(db){
 return await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=()=>reject(tx.error);
 });
}
let seq=0;
async function fixture(){
 const owner='synthetic-'+(++seq),db=await dbFor(owner);
 await replace(db,'items',row(owner,'shirt'));
 await replace(db,'state',{id:'looks',looks:[look('existing-look')]});
 await replace(db,'state',{id:'outfit-board',current:{name:'Existing',
  slots:{top:'shirt'}},saved:[{name:'Existing',slots:{top:'shirt'}}]});
 await replace(db,'state',{id:'draft',batch:[{id:'draft-1',ownerId:owner,image:jpeg}]});
 await replace(db,'state',{id:'cloud-sync',baseVersion:4,
  baseDocument:null,localRevision:7,dirty:false});
 let active=true;
 const assertLease=()=>{if(!active)throw Error('revoked owner session');};
 return {owner,db,assertLease,revoke:()=>active=false,close:()=>db.close()};
}
const prep=(f,data)=>prepareLegacyAtomicM3({
 data,ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,...exact
});
const commit=(f,prepared,extra={})=>commitLegacyAtomicM3({
 ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,
 prepared,confirmed:true,...extra
});
test('legacy import saves merge-clothes, merged inspiration, outfits, and cloud dirty revision atomically',async()=>{
 const f=await fixture();
 try{
  const p=await prep(f,backup(f.owner)),result=await commit(f,p),s=await snapshot(f.db);
  assert.equal(result.committed,true);assert.equal(result.atomic,true);
  assert.deepEqual(new Set(s.items.map(x=>x.id)),new Set(['shirt','new-top']));
  const state=Object.fromEntries(s.state.map(x=>[x.id,x]));
  assert.equal(state.looks.looks.length,2);
  assert.deepEqual(state['outfit-board'].current.slots,{top:'new-top'});
  assert.deepEqual(state['outfit-board'].saved[0].slots,{top:'new-top'});
  assert.equal(state.draft.batch[0].id,'draft-1');
  assert.equal(state['cloud-sync'].localRevision,8);
  assert.equal(state['cloud-sync'].dirty,true);
  assert.equal(state['cloud-sync'].baseVersion,4);
 }finally{f.close();}
});
test('injecting an error after all proposed puts rolls back items, looks, outfit board AND cloud marker',async()=>{
 const f=await fixture();
 try{
  const before=await snapshot(f.db),p=await prep(f,backup(f.owner));
  await assert.rejects(commit(f,p,{onStage:()=>{throw Error('injected quota exhaustion');}}),/quota exhaustion/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('revoking owner session during the write aborts the full transaction',async()=>{
 const f=await fixture();
 try{
  const before=await snapshot(f.db),p=await prep(f,backup(f.owner));
  await assert.rejects(commit(f,p,{onStage:f.revoke}),/revoked owner session/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('concurrent other-tab change between preflight and commit refuses stale import without partial changes',async()=>{
 const f=await fixture();
 try{
  const p=await prep(f,backup(f.owner));
  await replace(f.db,'items',{...row(f.owner),color:'Green'});
  const before=await snapshot(f.db);
  await assert.rejects(commit(f,p),/LEGACY_ATOMIC_CONFLICT/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('owner confirmation must be explicitly true before any database write',async()=>{
 const f=await fixture();
 try{
  const before=await snapshot(f.db),p=await prep(f,backup(f.owner));
  await assert.rejects(commitLegacyAtomicM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,prepared:p,confirmed:false
  }),/OWNER_CONFIRMATION_REQUIRED/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('owner switch with same db after preflight blocks commit even for same owner id',async()=>{
 const f=await fixture();
 try{
  const before=await snapshot(f.db),p=await prep(f,backup(f.owner));f.revoke();
  await assert.rejects(commit(f,p),/revoked owner session/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('no looks or outfit board in a legacy backup preserves originals while adding clothing',async()=>{
 const f=await fixture();
 try{
  const raw={format:'closet-current',version:1,items:[row(f.owner,'new-top')]};
  const p=await prep(f,raw);await commit(f,p);
  const state=Object.fromEntries((await snapshot(f.db)).state.map(x=>[x.id,x]));
  assert.deepEqual(state.looks.looks,[look('existing-look')]);
  assert.equal(state['outfit-board'].current.slots.top,'shirt');
 }finally{f.close();}
});
test('duplicate clothing IDs block preflight without touching wardrobe',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);raw.items.push(clone(raw.items[0]));
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,raw),/INVALID_GARMENT/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('foreign owner metadata in backup is denied even when top-level owner field missing',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);raw.items[0].ownerId='other-account';
  await assert.rejects(prep(f,raw),/FOREIGN_OWNER/);
 }finally{f.close();}
});
test('dangerous prototype keys inside legacy backup are rejected before IDB writes',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);raw.items[0].metadata=JSON.parse('{"__proto__":{"admin":true}}');
  await assert.rejects(prep(f,raw),/UNSAFE_KEY/);
 }finally{f.close();}
});
test('a board referencing unavailable clothing is rejected rather than silently losing the outfit',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);raw.outfitBoard.saved[0].slots.top='not-in-closet';
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,raw),/MISSING_OUTFIT_PIECE/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('an outfit referring to an existing garment in the wrong slot fails before writes',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);raw.outfitBoard.current.slots={shoes:'new-top'};
  await assert.rejects(prep(f,raw),/OUTFIT_CATEGORY_REVIEW_REQUIRED/);
 }finally{f.close();}
});
test('invalid inspiration data is rejected before any garment writes',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);raw.looks=[{id:'bad',pieces:'wrong-type'}];
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,raw),/Invalid inspiration look/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('pinned original JPEG SHA mismatch blocks unverified legacy source substitution',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);
  raw.items[0].originalPhoto={image:jpeg,sha256:'a'.repeat(64)};
  raw.items[0].sourceSHA256='a'.repeat(64);
  await assert.rejects(prep(f,raw),/JPEG_SHA_MISMATCH/);
 }finally{f.close();}
});
test('a valid pinned original JPEG remains exactly preserved through the atomic commit',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);raw.items[0].sourceSHA256=sha;
  raw.items[0].originalPhoto={image:jpeg,sha256:sha};
  const p=await prep(f,raw);await commit(f,p);
  const after=(await snapshot(f.db)).items.find(x=>x.id==='new-top');
  assert.equal(after.originalPhoto.image,jpeg);
  assert.equal(after.sourceSHA256,sha);
 }finally{f.close();}
});
