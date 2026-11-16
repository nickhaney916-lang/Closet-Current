// MAIN M132 — actual PHOTO119 signed-owner large original and separately
// owner-confirmed display-only JPEG. Synthetic review and private fake IDB;
// never independent garment accuracy, hosted identity or 3D authorization.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';
import {prepareDefaultAtomicM3,commitDefaultAtomicM3} from '../public/native-default-atomic-import-m3.mjs';
const {indexedDB}=createRequire(import.meta.url)('fake-indexeddb');
globalThis.crypto??=webcrypto;
const mime='data:image/jpeg;base64,',sha=b=>createHash('sha256').update(b).digest('hex');
const large=Buffer.alloc(2_300_000,0x3b);
large.set([255,216,255,0],0);large.set([255,217],large.length-2);
const original=mime+large.toString('base64'),originalSHA=sha(large);
assert(original.length>3_000_000&&original.length<11_200_000);
const previewBytes=Buffer.from([255,216,0,1,2,255,217]);
const thumbnail=mime+previewBytes.toString('base64'),thumbnailSHA=sha(previewBytes);
let serial=0;
async function ownerFixture({recordEdit=()=>{},reviewEdit=()=>{}}={}){
 const owner='m132-synthetic-'+(++serial),id='camera-source';
 const q=indexedDB.open('closet-current-user-'+owner,1);
 q.onupgradeneeded=()=>{
  q.result.createObjectStore('items',{keyPath:'id'});
  q.result.createObjectStore('state',{keyPath:'id'});
 };
 const db=await new Promise((resolve,reject)=>{
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 });
 const record={id,ownerId:owner,category:'Uncategorized',itemType:'Unknown',
  color:'Unknown',sourceSHA256:originalSHA,sourceHashVerified:true,
  singleGarmentVerified:false,image:thumbnail,
  originalPhoto:{image:original,sha256:originalSHA,ownerId:owner},
  displayPreviewReceipt:{schema:'photo119-owner-display-preview/v1',
   ownerId:owner,originalSHA256:originalSHA,
   previewSHA256:thumbnailSHA,displayOnly:true}};
 const review={confirmed:true,recordId:id,originalSHA256:originalSHA,
  category:'Tops',itemType:'T-shirt',color:'Blue',
  singleGarmentConfirmed:true,previewConfirmed:true,previewSHA256:thumbnailSHA};
 recordEdit(record);reviewEdit(review);
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite');
  tx.objectStore('state').put({id:'draft',batch:[structuredClone(record)]});
  tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error);
 });
 let valid=true;
 const lease=()=>valid,commit=(cryptoProvider=webcrypto)=>commitHumanReviewedPhoto119({
  db,ownerId:owner,currentOwner:()=>owner,record,review,
  cryptoProvider,assertLease:lease
 });
 const read=()=>new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const items=tx.objectStore('items').getAll(),state=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:items.result,state:state.result});
  tx.onabort=tx.onerror=()=>reject(tx.error);
 });
 return {owner,id,db,record,review,commit,read,revoke:()=>{valid=false;},lease,
  close:()=>db.close()};
}
async function withOwner(spec,fn){
 const f=await ownerFixture(spec);
 try{await fn(f);}finally{f.close();}
}
test('explicit owner-confirmed preview preserves 3MB+ SHA original and distinct small JPEG in one atomic PHOTO119 save',async()=>{
 await withOwner({},async f=>{
  const result=await f.commit();
  assert.equal(result.saved,true);
  assert.equal(result.sourceKind,'human-reviewed-original-single-display-preview');
  assert.equal(result.releaseAuthorized,false);
  assert.equal(result.independentPhotoAccuracyProven,false);
  const state=await f.read();
  assert.equal(state.items.length,1);
  assert.equal(state.state.find(x=>x.id==='draft').batch.length,0);
  const saved=state.items[0];
  assert.equal(saved.image,thumbnail);
  assert.equal(saved.originalPhoto.image,original);
  assert.equal(saved.sourceSHA256,originalSHA);
  assert.equal(saved.originalPhoto.sha256,originalSHA);
  assert.equal(saved.displayPreviewReceipt.previewSHA256,thumbnailSHA);
  assert.equal(saved.confirmedDetailsSource31.sourceSHA256,originalSHA);
  assert.equal(saved.singleGarmentVerified,true);
  assert.equal(saved.ownerReviewed,true);
 });
});
test('SHA-signed large original and owner-confirmed preview also round-trip v3 importer without photo substitution',async()=>{
 await withOwner({},async f=>{
  assert.equal((await f.commit()).saved,true);
  const exported=await exportDurableOwnerBackupM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:f.lease});
  assert.equal(exported.data.items.length,1);
  assert.equal(exported.data.items[0].originalPhoto.image,original);
  assert.equal(exported.data.items[0].image,thumbnail);
  await new Promise((resolve,reject)=>{
   const tx=f.db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').clear();tx.objectStore('state').clear();
   tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error);
  });
  const prepared=await prepareDefaultAtomicM3({
   data:exported.data,ownerDB:f.db,ownerId:f.owner,assertLease:f.lease,
   normalizeClothing:x=>x,validLook:x=>x,cleanOutfitBoard:x=>x
  });
  assert.equal((await f.read()).items.length,0);
  await assert.rejects(commitDefaultAtomicM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:f.lease,prepared
  }),/LEGACY_ATOMIC_OWNER_CONFIRMATION_REQUIRED/);
  const saved=await commitDefaultAtomicM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:f.lease,prepared,confirmed:true
  });
  assert.equal(saved.committed,true);assert.equal(saved.releaseAuthorized,false);
  const restored=(await f.read()).items[0];
  assert.equal(restored.originalPhoto.image,original);
  assert.equal(restored.image,thumbnail);
  assert.equal(restored.displayPreviewReceipt.previewSHA256,thumbnailSHA);
 });
});
async function denied(spec,kind){
 await withOwner(spec,async f=>{
  const before=await f.read();
  const response=await f.commit();
  assert.equal(response.saved,false);
  assert.equal(response.needsReview,true);
  assert.equal(response.sourceKind,kind);
  assert.equal(response.releaseAuthorized,false);
  assert.deepEqual(await f.read(),before,
   'preview/original rejection must not alter the private durable record or draft');
 });
}
test('large original with unrelated preview and NO owner preview receipt remains blocked',async()=>{
 await denied({recordEdit:r=>delete r.displayPreviewReceipt},
  'display-preview-unverified');
});
test('source-labeled preview without separate owner confirmation remains blocked',async()=>{
 await denied({reviewEdit:r=>delete r.previewConfirmed},'display-preview-unverified');
});
test('owner preview receipt from different owner is rejected without writes',async()=>{
 await denied({recordEdit:r=>r.displayPreviewReceipt.ownerId='different-owner'},
  'display-preview-unverified');
});
test('preview receipt tied to different original SHA is rejected without writes',async()=>{
 await denied({recordEdit:r=>r.displayPreviewReceipt.originalSHA256='a'.repeat(64)},
  'display-preview-unverified');
});
test('false SHA claim about preview bytes cannot save the original or draft',async()=>{
 await denied({recordEdit:r=>{
  r.displayPreviewReceipt.previewSHA256='b'.repeat(64);
 },reviewEdit:r=>r.previewSHA256='b'.repeat(64)},
 'display-preview-unverified');
});
test('stale owner preview confirmation SHA cannot authorize a new thumbnail',async()=>{
 await denied({reviewEdit:r=>r.previewSHA256='c'.repeat(64)},
  'display-preview-unverified');
});
test('oversized saved display cannot be mislabeled as a valid separate thumbnail',async()=>{
 const different=Buffer.from(large);different[100]=0x55;
 await denied({recordEdit:r=>{
  r.image=mime+different.toString('base64');
  r.displayPreviewReceipt.previewSHA256=sha(different);
 },reviewEdit:r=>r.previewSHA256=sha(different)},
 'display-preview-unverified');
});
test('oversized original without separate display preview cannot be exported as a safe saved garment',async()=>{
 await denied({recordEdit:r=>r.image=original},'display-preview-required');
});
test('tampered full original digest is refused even when preview has valid owner SHA',async()=>{
 await denied({recordEdit:r=>{
  r.sourceSHA256='f'.repeat(64);
  r.originalPhoto.sha256='f'.repeat(64);
  r.displayPreviewReceipt.originalSHA256='f'.repeat(64);
 },reviewEdit:r=>r.originalSHA256='f'.repeat(64)},
 'original-source-unverified');
});
test('owner generation revocation prevents atomic reviewed large-source save',async()=>{
 await withOwner({},async f=>{
  const before=await f.read();f.revoke();
  await assert.rejects(f.commit(),/PHOTO119 capture owner review lease revoked/);
  assert.deepEqual(await f.read(),before);
 });
});

function heldSecondDigest(){
 let release,seen;
 const gate=new Promise(resolve=>release=resolve);
 const reached=new Promise(resolve=>seen=resolve);
 let calls=0;
 return {reached,release,cryptoProvider:{
  subtle:{digest:async(algorithm,bytes)=>{
   calls++;
   // The original-source digest occurs first, then preview-source digest.
   if(calls===2){seen();await gate;}
   return webcrypto.subtle.digest(algorithm,bytes);
  }}
 },calls:()=>calls};
}
test('changing display bytes while awaiting its SHA aborts before any private write',async()=>{
 await withOwner({},async f=>{
  const hold=heldSecondDigest(),pending=f.commit(hold.cryptoProvider);
  await hold.reached;
  const before=await f.read();
  f.record.image=mime+Buffer.from([255,216,44,43,255,217]).toString('base64');
  hold.release();
  await assert.rejects(pending,/PHOTO119 photograph, category, subtype or reviewed color changed/);
  assert.equal(hold.calls(),2);
  assert.deepEqual(await f.read(),before,'changed display must not consume private draft');
 });
});
test('revoking owner session while preview SHA awaits cannot save a stale photo',async()=>{
 await withOwner({},async f=>{
  const hold=heldSecondDigest(),pending=f.commit(hold.cryptoProvider);
  await hold.reached;
  const before=await f.read();
  f.revoke();
  hold.release();
  await assert.rejects(pending,/PHOTO119 capture owner review lease revoked/);
  assert.equal(hold.calls(),2);
  assert.deepEqual(await f.read(),before,'revoked owner cannot mutate private wardrobe');
 });
});
