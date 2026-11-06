import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import 'fake-indexeddb/auto';
import {commitOriginalPhotoToPrivateCloset117} from '../research/owner-indexeddb-commit-117/atomic-reviewed-save.mjs';

// Genuine public-licensed JPEG source bytes; category guesses below are
// synthetic testing inputs, NOT model execution or scientific color truth.
const originalBytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const photo='data:image/jpeg;base64,'+originalBytes.toString('base64');
const originalSHA=createHash('sha256').update(originalBytes).digest('hex');
const model=()=>({
 strong:true,choices:[{category:'Bottoms',itemType:'Jeans',score:0.99}],
 details:{color:'Blue'}
});
const candidate=ownerId=>({
 id:'incoming-photo',ownerId,image:photo,sourceSHA256:originalSHA,
 sourceHashVerified:true,singleGarmentVerified:true,
 category:'Uncategorized',itemType:'Unknown',
 color:'Blue',confirmedColor:true,originalPhoto:{image:photo,sha256:originalSHA}
});
const otherDraft=()=>({id:'keep-unsaved-dress',category:'Dresses',itemType:'Casual dress',
 color:'Purple',name:'Do not lose this draft',localStatus:'Review later'});
function dbFor(ownerId){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+ownerId,2);
  r.onupgradeneeded=()=>{
   const db=r.result;
   db.createObjectStore('items',{keyPath:'id'});
   db.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error);
 });
}
function write(db,table,record){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(table,'readwrite');
  tx.objectStore(table).put(record);
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);
 });
}
async function rows(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  let items,draft;
  tx.objectStore('items').getAll().onsuccess=e=>items=e.target.result;
  tx.objectStore('state').get('draft').onsuccess=e=>draft=e.target.result;
  tx.oncomplete=()=>resolve({items,draft});tx.onerror=()=>reject(tx.error);
 });
}
async function setup(){
 const ownerId='synthetic-owner-'+randomUUID();
 const db=await dbFor(ownerId);
 const record=candidate(ownerId);
 const extra=otherDraft();
 await write(db,'state',{id:'draft',batch:[structuredClone(record),extra],
  unknownFutureState:{important:'preserve'},someOtherFutureSetting:47});
 let current=ownerId;
 const live=()=>current;
 const args={db,ownerId,currentOwner:live,record,recognition:model(),
  cryptoProvider:webcrypto};
 return {db,ownerId,record,extra,args,setOwner:v=>{current=v;}};
}
async function withEnv(fn){
 const e=await setup();
 try{return await fn(e);}finally{e.db.close();}
}
async function holdDigest(){
 let release;
 const cryptoProvider={subtle:{digest:()=>new Promise(resolve=>{
  release=()=>webcrypto.subtle.digest('SHA-256',originalBytes).then(resolve);
 })}};
 return {cryptoProvider,unblock:async()=>release?.(),
  wait:async()=>{
   for(let i=0;i<80&&!release;i++)
    await new Promise(resolve=>setImmediate(resolve));
   assert.equal(typeof release,'function','must reach real async SHA-256 proof');
  }};
}
test('PHOTO117 actual signed-owner-scoped IndexedDB original JPEG save and draft removal commit atomically',()=>withEnv(async e=>{
 const result=await commitOriginalPhotoToPrivateCloset117(e.args);
 assert.equal(result.status,'saved');
 assert.equal(result.saved,true);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
 assert.equal(Object.isFrozen(result),true);
 const next=await rows(e.db);
 assert.equal(next.items.length,1);
 const item=next.items[0];
 assert.equal(item.id,e.record.id);
 assert.equal(item.category,'Bottoms');
 assert.equal(item.itemType,'Jeans');
 assert.equal(item.color,'Blue');
 assert.equal(item.ownerId,e.ownerId);
 assert.equal(item.image,photo);
 assert.equal(item.originalPhoto.image,photo);
 assert.equal(item.sourceSHA256,originalSHA);
 assert.equal(next.draft.batch.length,1);
 assert.deepEqual(next.draft.batch[0],e.extra);
 assert.deepEqual(next.draft.unknownFutureState,{important:'preserve'});
 assert.equal(next.draft.someOtherFutureSetting,47);
 const response=JSON.stringify(result);
 assert.ok(!response.includes(photo));
 assert.ok(!response.includes(originalSHA));
 assert.ok(!response.includes(e.ownerId));
}));
test('PHOTO117 unconfirmed primary color requires visible review, never writes any garment',()=>withEnv(async e=>{
 e.record.confirmedColor=false;
 const draft=(await rows(e.db)).draft;draft.batch[0]=structuredClone(e.record);
 await write(e.db,'state',draft);
 const verdict=await commitOriginalPhotoToPrivateCloset117(e.args);
 assert.equal(verdict.status,'review-required');
 assert.equal(verdict.saved,false);
 assert.equal((await rows(e.db)).items.length,0);
 assert.equal((await rows(e.db)).draft.batch.length,2);
}));
test('PHOTO117 whole-outfit or multi-garment source without per-piece classification remains draft-only',()=>withEnv(async e=>{
 e.record.singleGarmentVerified=false;
 e.record.outfitSourceId='multi-outfit-photo';
 const draft=(await rows(e.db)).draft;draft.batch[0]=structuredClone(e.record);
 await write(e.db,'state',draft);
 const verdict=await commitOriginalPhotoToPrivateCloset117(e.args);
 assert.equal(verdict.status,'review-required');
 assert.equal((await rows(e.db)).items.length,0);
}));
test('PHOTO117 existing original-source duplicate forbids second saved item, preserves original record',()=>withEnv(async e=>{
 const already={...e.record,id:'already-saved-original',category:'Bottoms',
  itemType:'Jeans',color:'Blue'};
 await write(e.db,'items',already);
 const verdict=await commitOriginalPhotoToPrivateCloset117(e.args);
 assert.equal(verdict.status,'review-required');
 assert.deepEqual((await rows(e.db)).items,[already]);
}));
test('PHOTO117 existing saved item ID cannot silently be overwritten by source hash',()=>withEnv(async e=>{
 const already={...e.record,id:e.record.id,category:'Tops',
  itemType:'T-shirt',color:'Black',sourceSHA256:'a'.repeat(64)};
 await write(e.db,'items',already);
 const verdict=await commitOriginalPhotoToPrivateCloset117(e.args);
 assert.equal(verdict.saved,false);
 assert.deepEqual((await rows(e.db)).items,[already]);
}));
test('PHOTO117 account switched during actual async JPEG SHA => zero writes',()=>withEnv(async e=>{
 const latch=await holdDigest();
 const pending=commitOriginalPhotoToPrivateCloset117({...e.args,cryptoProvider:latch.cryptoProvider});
 await latch.wait();e.setOwner('different-user');await latch.unblock();
 await assert.rejects(pending,/INDEX-04 owner changed|PHOTO117 signed owner/);
 const next=await rows(e.db);
 assert.equal(next.items.length,0);
 assert.equal(next.draft.batch.length,2);
}));
test('PHOTO117 capture color manually corrected during async source proof => transaction never starts',()=>withEnv(async e=>{
 const latch=await holdDigest();
 const pending=commitOriginalPhotoToPrivateCloset117({...e.args,cryptoProvider:latch.cryptoProvider});
 await latch.wait();e.record.color='Red';await latch.unblock();
 await assert.rejects(pending,/INDEX-04 source|PHOTO117 original/);
 assert.equal((await rows(e.db)).items.length,0);
}));
test('PHOTO117 saved closet changes after initial owner snapshot reject stale write atomically',()=>withEnv(async e=>{
 const latch=await holdDigest();
 const pending=commitOriginalPhotoToPrivateCloset117({...e.args,cryptoProvider:latch.cryptoProvider});
 await latch.wait();
 const other={id:'inserted-while-photo-checking',ownerId:e.ownerId,
  category:'Tops',itemType:'T-shirt',color:'Green'};
 await write(e.db,'items',other);
 await latch.unblock();
 await assert.rejects(pending,/PHOTO117 owner source\/draft atomic save rejected/);
 const now=await rows(e.db);
 assert.deepEqual(now.items,[other]);
 assert.equal(now.draft.batch.length,2);
}));
test('PHOTO117 newer owner draft/correction during JPEG proof cannot be overwritten',()=>withEnv(async e=>{
 const latch=await holdDigest();
 const pending=commitOriginalPhotoToPrivateCloset117({...e.args,cryptoProvider:latch.cryptoProvider});
 await latch.wait();
 const draft=(await rows(e.db)).draft;
 draft.batch[1].name='Corrected unsaved dress';
 await write(e.db,'state',draft);
 await latch.unblock();
 await assert.rejects(pending,/PHOTO117 owner source\/draft atomic save rejected/);
 assert.equal((await rows(e.db)).items.length,0);
 assert.equal((await rows(e.db)).draft.batch[1].name,'Corrected unsaved dress');
}));
test('PHOTO117 late capture lease revoke after item add aborts BOTH item and draft writes',()=>withEnv(async e=>{
 let count=0;
 const assertLease=()=>++count<3;
 await assert.rejects(commitOriginalPhotoToPrivateCloset117({...e.args,assertLease}),
  /PHOTO117 owner source\/draft atomic save rejected/);
 const next=await rows(e.db);
 assert.equal(next.items.length,0);
 assert.equal(next.draft.batch.length,2);
 assert.equal(next.draft.batch[0].image,photo);
 assert.equal(count,3);
}));
test('PHOTO117 concurrent authorized identical original saves commit at most once',()=>withEnv(async e=>{
 const [a,b]=await Promise.allSettled([
  commitOriginalPhotoToPrivateCloset117(e.args),
  commitOriginalPhotoToPrivateCloset117(e.args)
 ]);
 const now=await rows(e.db);
 assert.equal(now.items.length,1,'readwrite transactions must serialize and reject stale second write');
 assert.equal(now.draft.batch.length,1);
 assert.equal([a,b].filter(x=>x.status==='fulfilled'&&x.value.saved===true).length,1);
 assert.equal([a,b].filter(x=>x.status==='rejected'||x.value.saved===false).length,1);
}));
test('PHOTO117 cross-owner saved wardrobe metadata forces fail-closed, no changes',()=>withEnv(async e=>{
 const foreign={id:'foreign',ownerId:'other-owner',category:'Shoes',
  itemType:'Sneakers',color:'White'};
 await write(e.db,'items',foreign);
 await assert.rejects(commitOriginalPhotoToPrivateCloset117(e.args),/cross-owner-record/);
 assert.deepEqual((await rows(e.db)).items,[foreign]);
}));
test('PHOTO117 detached different-owner DB name is refused before any photo hash or write',()=>withEnv(async e=>{
 await assert.rejects(commitOriginalPhotoToPrivateCloset117({
  ...e.args,ownerId:'other-owner',currentOwner:()=>'other-owner'
 }),/PHOTO117 signed owner-bound IndexedDB/);
 assert.equal((await rows(e.db)).items.length,0);
}));
test('PHOTO117 stale or missing source-bound draft cannot be silently saved',()=>withEnv(async e=>{
 const draft=(await rows(e.db)).draft;
 draft.batch[0].originalPhoto.image='source-changed';
 await write(e.db,'state',draft);
 await assert.rejects(commitOriginalPhotoToPrivateCloset117(e.args),
  /PHOTO117 draft original JPEG/);
 assert.equal((await rows(e.db)).items.length,0);
}));
test('PHOTO117 no production app, cloud or private image IO in isolated source, status-only response',()=>{
 const source=readFileSync('research/owner-indexeddb-commit-117/atomic-reviewed-save.mjs','utf8');
 for(const term of [
  "evaluateOwnerSavedRecognition04",
  "db.transaction(['items','state'],'readwrite')",
  "tx.objectStore('items').add(value)",
  "tx.objectStore('state').put({...liveDraft,batch:remaining})",
  "previewOwnerWardrobeAddition",
  "assertDraft(liveDraft,record,ownerId)",
  "assertLive({ownerId,currentOwner,assertLease",
  "tx.onabort=()=>reject("
 ])assert.ok(source.includes(term),term);
 assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|localStorage|navigator|sendBeacon|supabase/);
});
