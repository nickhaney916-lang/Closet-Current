// Mission 3: genuine IndexedDB transactions (fake-indexeddb) run the exact
// public default atomic import module with actual taxonomy and outfit cleaning.
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
import {prepareDefaultAtomicM3,commitDefaultAtomicM3}
 from '../public/native-default-atomic-import-m3.mjs';
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
// Distinct fixture photography for different legacy garments. Reusing one
// synthetic JPEG across independent IDs would be correctly refused by M92.
const anotherJpeg='data:image/jpeg;base64,'+Buffer.from([255,216,21,22,255,217]).toString('base64');
const anotherSha=createHash('sha256').update(Buffer.from([255,216,21,22,255,217])).digest('hex');
const row=(owner,id='shirt',category='Tops')=>({
 id,ownerId:owner,name:id,image:id==='shirt'?jpeg:anotherJpeg,
 category,itemType:category==='Shoes'?'Sneakers':'T-shirt',
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
const prep=(f,data)=>prepareDefaultAtomicM3({
 data,ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,...exact
});
const commit=(f,prepared,extra={})=>commitDefaultAtomicM3({
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
  await assert.rejects(commitDefaultAtomicM3({
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
  const raw=backup(f.owner);raw.items[0].sourceSHA256=anotherSha;
  raw.items[0].originalPhoto={image:anotherJpeg,sha256:anotherSha};
  const p=await prep(f,raw);await commit(f,p);
  const after=(await snapshot(f.db)).items.find(x=>x.id==='new-top');
  assert.equal(after.originalPhoto.image,anotherJpeg);
  assert.equal(after.sourceSHA256,anotherSha);
 }finally{f.close();}
});

// A backup ID collision must not replace a different canonical source JPEG
// even when the owner has opted into a bulk merge.
test('different original photo with matching garment ID aborts before any private write',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);
  const old=row(f.owner,'new-top');
  old.image='data:image/jpeg;base64,'+Buffer.from([255,216,11,22,255,217]).toString('base64');
  await replace(f.db,'items',old);
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,raw),/ORIGINAL_COLLISION_REVIEW_REQUIRED/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('a matching original can update owned metadata without overwriting photo bytes',async()=>{
 const f=await fixture();
 try{
  const old=row(f.owner,'new-top');old.color='Original blue';
  await replace(f.db,'items',old);
  const raw=backup(f.owner);raw.items[0].color='New green';
  const prepared=await prep(f,raw);
  await commit(f,prepared);
  const after=(await snapshot(f.db)).items.find(x=>x.id==='new-top');
  assert.equal(after.image,old.image);
  assert.equal(after.ownerId,f.owner);
  assert.equal(after.color,'New green');
 }finally{f.close();}
});
test('legacy backup without owner ID is stamped only into the current signed owner-private database',async()=>{
 const f=await fixture();
 try{
  const raw=backup(f.owner);delete raw.items[0].ownerId;
  const plan=await prep(f,raw);
  await commit(f,plan);
  const after=(await snapshot(f.db)).items.find(x=>x.id==='new-top');
  assert.equal(after.ownerId,f.owner);
 }finally{f.close();}
});

// MAIN1054 M87: native legacy import must not silently downgrade a signed
// original's owner receipt, genuine source-review provenance, or saved slots.
test('M87 legacy same-ID import cannot erase an existing owner or camera-original claim',async()=>{
 const f=await fixture();
 try{
  const protectedRow={...row(f.owner,'shirt'),sourceSHA256:sha,sourceHashVerified:true,
   originalPhoto:{ownerId:f.owner,image:jpeg,sha256:sha}};
  await replace(f.db,'items',protectedRow);
  const before=await snapshot(f.db);
  const noOwner={...protectedRow,color:'Purple'};delete noOwner.ownerId;
  await assert.rejects(prep(f,{format:'closet-current',version:3,items:[noOwner]}),
   /LEGACY_ATOMIC_EXISTING_OWNER_CLAIM_CONFLICT/);
  const noCameraOwner={...protectedRow,color:'Purple',
   originalPhoto:{image:jpeg,sha256:sha}};
  await assert.rejects(prep(f,{format:'closet-current',version:3,items:[noCameraOwner]}),
   /LEGACY_ATOMIC_EXISTING_OWNER_CLAIM_CONFLICT/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M87 verified same-source owner-preserving metadata merge remains accepted',async()=>{
 const f=await fixture();
 try{
  const protectedRow={...row(f.owner,'shirt'),sourceSHA256:sha,sourceHashVerified:true,
   originalPhoto:{ownerId:f.owner,image:jpeg,sha256:sha}};
  await replace(f.db,'items',protectedRow);
  const approved={...protectedRow,color:'Purple'};
  const plan=await prep(f,{format:'closet-current',version:3,items:[approved]});
  await commit(f,plan);
  const result=(await snapshot(f.db)).items.find(x=>x.id==='shirt');
  assert.equal(result.color,'Purple');
  assert.equal(result.ownerId,f.owner);
  assert.equal(result.originalPhoto.ownerId,f.owner);
  assert.equal(result.originalPhoto.image,jpeg);
  assert.equal(result.sourceSHA256,sha);
 }finally{f.close();}
});
test('M87 same original cannot downgrade a verified SHA or source-review receipt',async()=>{
 const f=await fixture();
 try{
  const protectedRow={...row(f.owner,'shirt'),sourceSHA256:sha,sourceHashVerified:true,
   sourcePieceKey:'original-01',ownerSourceReview88:{verified:true,instance:'one'},
   originalPhoto:{ownerId:f.owner,image:jpeg,sha256:sha}};
  await replace(f.db,'items',protectedRow);
  const before=await snapshot(f.db);
  for(const change of [
   {sourceHashVerified:false},
   {sourcePieceKey:null},
   {ownerSourceReview88:null}
  ]){
   const incoming={...protectedRow,...change};
   await assert.rejects(prep(f,{format:'closet-current',version:3,items:[incoming]}),
    /LEGACY_ATOMIC_EXISTING_ORIGINAL_CONFLICT/);
   assert.deepEqual(await snapshot(f.db),before);
  }
 }finally{f.close();}
});
test('M87 no-replacement-board import refuses same-ID slot category drift',async()=>{
 const f=await fixture();
 try{
  const before=await snapshot(f.db);
  const changed={format:'closet-current',version:3,
   items:[row(f.owner,'shirt','Shoes')]};
  await assert.rejects(prep(f,changed),/LEGACY_ATOMIC_EXISTING_OUTFIT_CONFLICT/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M87 compatible same-ID metadata import retains existing saved outfit',async()=>{
 const f=await fixture();
 try{
  const updated={...row(f.owner,'shirt'),color:'Orange'};
  const plan=await prep(f,{format:'closet-current',version:3,items:[updated]});
  await commit(f,plan);
  const snapshotAfter=await snapshot(f.db);
  const saved=snapshotAfter.state.find(x=>x.id==='outfit-board');
  assert.equal(snapshotAfter.items.find(x=>x.id==='shirt').color,'Orange');
  assert.equal(saved.current.slots.top,'shirt');
  assert.equal(saved.saved[0].slots.top,'shirt');
 }finally{f.close();}
});

// M90: default legacy import must share the normal saved-original fence.
// A new ID is not evidence of a distinct physical garment when original SHA
// or bytes belong to an existing owner-reviewed saved garment.
test('M90 same verified JPEG under a new ID cannot bypass original-source ownership',async()=>{
 const f=await fixture();
 try{
  const saved={...row(f.owner,'shirt'),sourceSHA256:sha,
   sourceHashVerified:true,originalPhoto:{image:jpeg,sha256:sha}};
  await replace(f.db,'items',saved);
  const incoming={...row(f.owner,'different-id'),sourceSHA256:sha,
   sourceHashVerified:true,originalPhoto:{image:jpeg,sha256:sha}};
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,{format:'closet-current',version:3,items:[incoming]}),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M90 a cropped preview or missing incoming SHA cannot relabel a verified original',async()=>{
 const f=await fixture();
 try{
  await replace(f.db,'items',{...row(f.owner,'shirt'),sourceSHA256:sha,
   sourceHashVerified:true,originalPhoto:{image:jpeg,sha256:sha}});
  const crop='data:image/jpeg;base64,'+Buffer.from([255,216,42,43,255,217]).toString('base64');
  const alias={...row(f.owner,'new-crop'),image:crop,
   originalPhoto:{image:jpeg}};
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,{format:'closet-current',version:3,items:[alias]}),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M90 two colliding verified originals in same incoming backup fail atomically',async()=>{
 const f=await fixture();
 try{
  // Distinct from fixture shirt: prove two INCOMING new IDs collide.
  const sourceBytes=Buffer.from([255,216,14,15,255,217]);
  const sourceImage='data:image/jpeg;base64,'+sourceBytes.toString('base64');
  const sourceHash=createHash('sha256').update(sourceBytes).digest('hex');
  const first={...row(f.owner,'first-import'),image:sourceImage,
   sourceSHA256:sourceHash,sourceHashVerified:true,
   originalPhoto:{image:sourceImage,sha256:sourceHash}};
  const second={...first,id:'second-import'};
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,{format:'closet-current',version:3,items:[first,second]}),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M90 a genuinely different verified owner original remains importable',async()=>{
 const f=await fixture();
 try{
  await replace(f.db,'items',{...row(f.owner,'shirt'),sourceSHA256:sha,
   sourceHashVerified:true,originalPhoto:{image:jpeg,sha256:sha}});
  const bytes=Buffer.from([255,216,11,12,255,217]);
  const different='data:image/jpeg;base64,'+bytes.toString('base64');
  const differentSha=createHash('sha256').update(bytes).digest('hex');
  const incoming={...row(f.owner,'genuinely-new'),image:different,
   sourceSHA256:differentSha,sourceHashVerified:true,
   originalPhoto:{image:different,sha256:differentSha}};
  const plan=await prep(f,{format:'closet-current',version:3,items:[incoming]});
  await commit(f,plan);
  const s=await snapshot(f.db);
  assert.equal(s.items.find(x=>x.id==='genuinely-new').originalPhoto.image,different);
  assert.equal(s.items.find(x=>x.id==='shirt').sourceSHA256,sha);
 }finally{f.close();}
});

test('M91 native import explains duplicate original without a partial write',()=>{
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const start=app.indexOf("$('import').onchange=async e=>{");
 const end=app.indexOf("window.addEventListener('beforeunload'",start);
 assert.ok(start>=0&&end>start);
 const handler=app.slice(start,end);
 assert.match(handler,/LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
 assert.match(handler,/This backup repeats an original photo already linked to a saved closet piece/);
 assert.match(handler,/Nothing was imported/);
 assert.match(handler,/Open My Closet to review the saved piece/);
});

// M92: don't downgrade original-source matching when old backups lack SHA proof.
test('M92 distinct IDs for one unverified legacy JPEG are refused without changing owner IDB',async()=>{
 const f=await fixture();
 try{
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,{format:'closet-current',version:1,
   items:[{...row(f.owner,'unverified-alias'),image:jpeg}]}),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M92 two unverified different crops sharing one original in a backup are refused',async()=>{
 const f=await fixture();
 try{
  const original='data:image/jpeg;base64,'+Buffer.from([255,216,90,91,255,217]).toString('base64');
  const one={...row(f.owner,'crop-one'),image:'data:image/jpeg;base64,'+
   Buffer.from([255,216,90,1,255,217]).toString('base64'),originalPhoto:{image:original}};
  const two={...row(f.owner,'crop-two'),image:'data:image/jpeg;base64,'+
   Buffer.from([255,216,90,2,255,217]).toString('base64'),originalPhoto:{image:original}};
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,{format:'closet-current',version:2,items:[one,two]}),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M92 two distinct unverified original JPEGs can still be imported',async()=>{
 const f=await fixture();
 try{
  const different='data:image/jpeg;base64,'+Buffer.from([255,216,95,96,255,217]).toString('base64');
  const plan=await prep(f,{format:'closet-current',version:1,items:[
   {...row(f.owner,'new-distinct'),image:different}]});
  await commit(f,plan);
  const rows=(await snapshot(f.db)).items;
  assert.equal(rows.length,2);
  assert.equal(rows.find(x=>x.id==='shirt').image,jpeg);
  assert.equal(rows.find(x=>x.id==='new-distinct').image,different);
 }finally{f.close();}
});
test('M92 same-ID owner metadata edit is still accepted for an unverified original',async()=>{
 const f=await fixture();
 try{
  const plan=await prep(f,{format:'closet-current',version:1,
   items:[{...row(f.owner,'shirt'),color:'Purple'}]});
  await commit(f,plan);
  const saved=(await snapshot(f.db)).items.find(x=>x.id==='shirt');
  assert.equal(saved.color,'Purple');assert.equal(saved.image,jpeg);
 }finally{f.close();}
});

// M94: textual Base64 padding bits are not physical-original evidence.
// Browser atob accepts these different spellings as EXACTLY the same JPEG.
test('M94 noncanonical padded Base64 alias cannot duplicate an unverified old original',async()=>{
 const f=await fixture();
 try{
  const alias=jpeg.slice(0,-3)+'R==';
  assert.notEqual(alias,jpeg);
  assert.deepEqual(Buffer.from(alias.split(',')[1],'base64'),
   Buffer.from(jpeg.split(',')[1],'base64'));
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,{format:'closet-current',version:1,
   items:[{...row(f.owner,'different-base64-text'),image:alias}]}),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M94 genuinely different JPEG bytes of the same Base64 length remain importable',async()=>{
 const f=await fixture();
 try{
  const distinct='data:image/jpeg;base64,'+Buffer.from([255,216,254,217]).toString('base64');
  assert.equal(distinct.length,jpeg.length);
  assert.notDeepEqual(Buffer.from(distinct.split(',')[1],'base64'),
   Buffer.from(jpeg.split(',')[1],'base64'));
  const plan=await prep(f,{format:'closet-current',version:1,
   items:[{...row(f.owner,'same-length-distinct'),image:distinct}]});
  await commit(f,plan);
  const rows=(await snapshot(f.db)).items;
  assert.equal(rows.length,2);
  assert.equal(rows.find(x=>x.id==='shirt').image,jpeg);
  assert.equal(rows.find(x=>x.id==='same-length-distinct').image,distinct);
 }finally{f.close();}
});

// M98: P93-proven camera original/preview size mismatch. All fixtures use
// checked-in licensed JPEG pixels and synthetic APP15 camera metadata only.
function cameraOriginalM98(){
 const licensed=readFileSync('benchmark/fixtures/commons-0003.jpg');
 assert.equal(licensed[0],255);assert.equal(licensed[1],216);
 assert.equal(licensed.at(-2),255);assert.equal(licensed.at(-1),217);
 const segments=[];
 for(let i=0;i<56;i++){
  const size=48000;
  segments.push(Buffer.from([255,239,(size+2)>>8,(size+2)&255]),
   Buffer.alloc(size,i&255));
 }
 const bytes=Buffer.concat([licensed.subarray(0,2),...segments,licensed.subarray(2)]);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 assert(image.length>3_000_000&&image.length<=11_200_000);
 return {bytes,image,sha:createHash('sha256').update(bytes).digest('hex')};
}
function cameraBackupM98(f,photo){
 return {format:'closet-current',version:3,items:[{
  ...row(f.owner,'camera-original'),image:anotherJpeg,
  sourceSHA256:photo.sha,sourceHashVerified:true,
  originalPhoto:{image:photo.image,sha256:photo.sha,ownerId:f.owner}
 }]};
}
test('M98 signed owner restores a SHA-verified >3M original atomically while preserving small preview',async()=>{
 const f=await fixture();
 try{
  const photo=cameraOriginalM98(),before=await snapshot(f.db);
  const prepared=await prep(f,cameraBackupM98(f,photo));
  assert.deepEqual(await snapshot(f.db),before,'preflight has no writes');
  await commit(f,prepared);
  const after=await snapshot(f.db),saved=after.items.find(x=>x.id==='camera-original');
  assert(saved);assert.equal(saved.ownerId,f.owner);
  assert.equal(saved.image,anotherJpeg);
  assert.equal(saved.originalPhoto.image,photo.image);
  assert.equal(saved.originalPhoto.sha256,photo.sha);
  assert.equal(saved.sourceSHA256,photo.sha);
  assert.equal(after.items.find(x=>x.id==='shirt').image,jpeg);
  assert.equal(after.state.find(x=>x.id==='cloud-sync').localRevision,8);
 }finally{f.close();}
});
test('M98 oversize original cannot masquerade as a 3M preview, with no private writes',async()=>{
 const f=await fixture();
 try{
  const photo=cameraOriginalM98(),backup=cameraBackupM98(f,photo);
  backup.items[0].image=photo.image;
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,backup),/LEGACY_ATOMIC_INVALID_GARMENT/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M98 decoded camera source over 8MiB is refused even when encoded under 11.2M',async()=>{
 const f=await fixture();
 try{
  const tooBig=Buffer.alloc(8*1024*1024+1,7);
  tooBig[0]=255;tooBig[1]=216;tooBig[tooBig.length-2]=255;tooBig[tooBig.length-1]=217;
  const image='data:image/jpeg;base64,'+tooBig.toString('base64');
  assert(image.length<11_200_000);
  const backup=cameraBackupM98(f,{
   image,sha:createHash('sha256').update(tooBig).digest('hex')});
  const before=await snapshot(f.db);
  await assert.rejects(prep(f,backup),/LEGACY_ATOMIC_INVALID_JPEG_BYTES/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
test('M98 large original rejects tampered SHA, malformed Base64 and nested foreign owner atomically',async()=>{
 const f=await fixture();
 try{
  const photo=cameraOriginalM98(),before=await snapshot(f.db);
  const badHash=cameraBackupM98(f,photo);
  badHash.items[0].originalPhoto.sha256='a'.repeat(64);
  await assert.rejects(prep(f,badHash),/LEGACY_ATOMIC_JPEG_SHA_MISMATCH/);
  const malformed=cameraBackupM98(f,photo);
  malformed.items[0].originalPhoto.image=photo.image.slice(0,-4)+'####';
  await assert.rejects(prep(f,malformed),/LEGACY_ATOMIC_INVALID_JPEG/);
  const foreign=cameraBackupM98(f,photo);
  foreign.items[0].originalPhoto.ownerId='foreign-owner';
  await assert.rejects(prep(f,foreign),/LEGACY_ATOMIC_FOREIGN_OWNER/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});
