// MAIN1054 M104 — exact native v3 signed-owner exporter receipts.
// Real IndexedDB transaction semantics, synthetic owner/photo bytes only.
// This does not authorize physical photo-fitting, cloud access or release.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';
import {prepareDefaultAtomicM3,commitDefaultAtomicM3} from '../public/native-default-atomic-import-m3.mjs';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
const mime='data:image/jpeg;base64,';
const originalBytes=Buffer.alloc(2_300_000,0x3b);
originalBytes.set([255,216,255,0],0);
originalBytes.set([255,217],originalBytes.length-2);
const original=mime+originalBytes.toString('base64');
const sha=createHash('sha256').update(originalBytes).digest('hex');
assert(original.length>3_000_000&&original.length<11_200_000);
const thumbnail=mime+Buffer.from([255,216,255,217]).toString('base64');
const row=owner=>({
 id:'shirt-1',ownerId:owner,category:'Tops',itemType:'T-shirt',
 color:'Blue',image:thumbnail,sourceSHA256:sha,
 sourceHashVerified:true,ownerReviewed:true,
 originalPhoto:{image:original,sha256:sha,ownerId:owner}
});
let serial=0;
async function fixture(mutator=()=>{}){
 const owner='m104-synthetic-'+(++serial);
 const db=await new Promise((resolve,reject)=>{
  const q=indexedDB.open('closet-current-user-'+owner,1);
  q.onupgradeneeded=()=>{
   q.result.createObjectStore('items',{keyPath:'id'});
   q.result.createObjectStore('state',{keyPath:'id'});
  };
  q.onsuccess=()=>resolve(q.result);
  q.onerror=()=>reject(q.error);
 });
 const item=row(owner);
 mutator(item);
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(item);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  tx.onabort=()=>reject(tx.error);
 });
 let live=true;
 return {owner,db,item,
  revoke:()=>{live=false;},
  export:()=>exportDurableOwnerBackupM3({
   ownerDB:db,ownerId:owner,assertLease(){if(!live)throw Error('owner lease revoked');}
  }),
  close:()=>db.close()
 };
}
async function withFixture(change,fn){
 const f=await fixture(change);
 try{await fn(f);}finally{f.close();}
}
test('large signed SHA-verified original exports losslessly without enlarging thumbnail',async()=>{
 await withFixture(()=>{},async f=>{
  const result=await f.export();
  assert.equal(result.data.version,3);
  assert.equal(result.data.items.length,1);
  assert.equal(result.data.items[0].image,thumbnail);
  assert.equal(result.data.items[0].originalPhoto.image,original);
  assert.equal(result.data.items[0].sourceSHA256,sha);
  assert.equal(result.counts.garments,1);
  assert.equal(result.releaseAuthorized,false);
  assert.equal(result.data.items[0].ownerId,f.owner);
 });
});
test('large original without trusted SHA fails closed, not a partial backup',async()=>{
 await withFixture(item=>{
  delete item.sourceSHA256;delete item.originalPhoto.sha256;
  item.sourceHashVerified=false;
 },async f=>assert.rejects(f.export(),/M3_EXPORT_SOURCE_SHA_REQUIRED/));
});
test('contradictory original and row SHA receipts are rejected',async()=>{
 await withFixture(item=>{item.originalPhoto.sha256='a'.repeat(64);},
  async f=>assert.rejects(f.export(),/M3_EXPORT_SOURCE_SHA_CLAIM_CONFLICT/));
});
test('matching but incorrect receipt still fails actual JPEG digest',async()=>{
 await withFixture(item=>{
  item.sourceSHA256='b'.repeat(64);item.originalPhoto.sha256='b'.repeat(64);
 },async f=>assert.rejects(f.export(),/M3_EXPORT_PHOTO_SHA_MISMATCH/));
});
test('source SHA verified without an actual original cannot create trustworthy v3',async()=>{
 await withFixture(item=>{delete item.originalPhoto.image;},
  async f=>assert.rejects(f.export(),/M3_EXPORT_/));
});
test('preview remains capped independently of original size',async()=>{
 await withFixture(item=>{item.image=original;},
  async f=>assert.rejects(f.export(),/M3_EXPORT_INVALID_JPEG/));
});
test('revoked signed-owner lease blocks export before it reads private rows',async()=>{
 await withFixture(()=>{},async f=>{
  f.revoke();
  await assert.rejects(f.export(),/owner lease revoked/);
 });
});
test('small legacy unverified originals still export unchanged',async()=>{
 await withFixture(item=>{
  item.image=thumbnail;
  item.originalPhoto={image:thumbnail,ownerId:item.ownerId};
  delete item.sourceSHA256;delete item.sourceHashVerified;
 },async f=>{
  const result=await f.export();
  assert.equal(result.data.items[0].originalPhoto.image,thumbnail);
  assert.equal(result.data.items[0].sourceSHA256,undefined);
 });
});


async function addSavedRow(db,value){
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(value);
  tx.oncomplete=resolve;
  tx.onabort=tx.onerror=()=>reject(tx.error);
 });
}
test('v3 export refuses two owner-reviewed garment instances with a shared canonical original',async()=>{
 await withFixture(()=>{},async f=>{
  const second={...structuredClone(f.item),id:'pants-from-same-photo',
   category:'Bottoms',itemType:'Jeans',sourcePieceKey:'instance-2'};
  // Distinct reviewed/cropped item ID and category do NOT grant a v3
  // restore permission for two pieces sharing the same source SHA.
  await addSavedRow(f.db,second);
  const before=await new Promise((resolve,reject)=>{
   const tx=f.db.transaction('items','readonly'),q=tx.objectStore('items').getAll();
   tx.oncomplete=()=>resolve(q.result);
   tx.onerror=tx.onabort=()=>reject(tx.error);
  });
  await assert.rejects(f.export(),/M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
  const after=await new Promise((resolve,reject)=>{
   const tx=f.db.transaction('items','readonly'),q=tx.objectStore('items').getAll();
   tx.oncomplete=()=>resolve(q.result);
   tx.onerror=tx.onabort=()=>reject(tx.error);
  });
  assert.deepEqual(after,before,'refused export must not mutate private original items');
  assert.equal(after.length,2);
 });
});
test('two independent original SHA identities remain exportable together',async()=>{
 await withFixture(()=>{},async f=>{
  const bytes=Buffer.from([255,216,42,43,44,255,217]);
  const otherSHA=createHash('sha256').update(bytes).digest('hex');
  const otherOriginal=mime+bytes.toString('base64');
  const otherThumbnail=mime+Buffer.from([255,216,99,98,255,217]).toString('base64');
  await addSavedRow(f.db,{
   ...structuredClone(f.item),id:'other-source',image:otherThumbnail,
   category:'Bottoms',itemType:'Jeans',
   originalPhoto:{image:otherOriginal,sha256:otherSHA,ownerId:f.owner},
   sourceSHA256:otherSHA,sourcePieceKey:'different-original'
  });
  const result=await f.export();
  assert.equal(result.data.items.length,2);
  assert.deepEqual(new Set(result.data.items.map(x=>x.sourceSHA256)),
   new Set([sha,otherSHA]));
  assert.equal(result.releaseAuthorized,false);
 });
});

test('native signed-owner UI explains that an unrestorable multi-piece v3 backup was not downloaded',()=>{
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(app,/M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
 assert.match(app,/share original or display photograph content/);
 assert.match(app,/backup format cannot safely restore them as separate pieces/);
 assert.match(app,/Your originals and saved clothing remain on this device/);
 assert.match(app,/Do not delete or reset this closet/);
});


const rawSingle=(item)=>({format:'closet-current',version:3,items:[item],looks:[]});
const importerOptions=(f,backup)=>({
 data:backup,ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},
 normalizeClothing:row=>row,validLook:row=>row,
 cleanOutfitBoard:board=>board
});
test('real v3 importer and exporter both refuse different originals sharing only a preview',async()=>{
 await withFixture(()=>{},async f=>{
  const otherBytes=Buffer.from([255,216,2,3,255,217]);
  const otherSHA=createHash('sha256').update(otherBytes).digest('hex');
  const second={...structuredClone(f.item),id:'other-original-same-preview',
   category:'Bottoms',itemType:'Jeans',sourceSHA256:otherSHA,
   originalPhoto:{image:mime+otherBytes.toString('base64'),
    sha256:otherSHA,ownerId:f.owner}};
  await assert.rejects(
   prepareDefaultAtomicM3(importerOptions(f,rawSingle(second))),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  await addSavedRow(f.db,second);
  await assert.rejects(f.export(),/M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
 });
});
test('equivalent padded Base64 spelling of shared preview cannot bypass v3 duplicate refusal',async()=>{
 await withFixture(()=>{},async f=>{
  const otherBytes=Buffer.from([255,216,9,10,255,217]);
  const otherSHA=createHash('sha256').update(otherBytes).digest('hex');
  assert.match(thumbnail,/Q==$/);
  const alias=thumbnail.replace(/Q==$/,'R==');
  assert.notEqual(alias,thumbnail);
  assert.deepEqual(Buffer.from(alias.slice(mime.length),'base64'),
   Buffer.from(thumbnail.slice(mime.length),'base64'));
  const second={...structuredClone(f.item),id:'same-preview-pad-bits',
   category:'Bottoms',itemType:'Jeans',image:alias,
   sourceSHA256:otherSHA,
   originalPhoto:{image:mime+otherBytes.toString('base64'),
    sha256:otherSHA,ownerId:f.owner}};
  await assert.rejects(
   prepareDefaultAtomicM3(importerOptions(f,rawSingle(second))),
   /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  await addSavedRow(f.db,second);
  await assert.rejects(f.export(),/M3_EXPORT_SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
 });
});

async function ownerRows(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const items=tx.objectStore('items').getAll(),state=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:items.result,state:state.result});
  tx.onabort=tx.onerror=()=>reject(tx.error);
 });
}
test('large original plus distinct-source garment v3 export restores atomically after explicit owner confirmation',async()=>{
 await withFixture(()=>{},async f=>{
  const bytes=Buffer.from([255,216,10,20,30,255,217]);
  const otherSHA=createHash('sha256').update(bytes).digest('hex');
  const otherPreview=mime+Buffer.from([255,216,50,60,255,217]).toString('base64');
  const otherOriginal=mime+bytes.toString('base64');
  await addSavedRow(f.db,{...structuredClone(f.item),id:'pants-2',
   category:'Bottoms',itemType:'Jeans',image:otherPreview,
   originalPhoto:{image:otherOriginal,sha256:otherSHA,ownerId:f.owner},
   sourceSHA256:otherSHA});
  const exported=await f.export();
  assert.equal(exported.data.items.length,2);
  const expected=structuredClone(exported.data.items);
  assert.equal(expected.find(x=>x.id==='shirt-1').originalPhoto.image,original);
  await new Promise((resolve,reject)=>{
   const tx=f.db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').clear();
   tx.objectStore('state').clear();
   tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(tx.error);
  });
  const clean=await ownerRows(f.db);
  assert.equal(clean.items.length,0);
  const prepared=await prepareDefaultAtomicM3(importerOptions(f,exported.data));
  assert.equal(prepared.counts.garments,2);
  assert.equal((await ownerRows(f.db)).items.length,0,'preflight may not mutate owner items');
  await assert.rejects(commitDefaultAtomicM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},prepared,confirmed:false
  }),/LEGACY_ATOMIC_OWNER_CONFIRMATION_REQUIRED/);
  assert.equal((await ownerRows(f.db)).items.length,0,'denied confirmation may not write');
  const result=await commitDefaultAtomicM3({
   ownerDB:f.db,ownerId:f.owner,assertLease:()=>{},prepared,confirmed:true
  });
  assert.equal(result.committed,true);
  assert.equal(result.atomic,true);
  assert.equal(result.cloudDirty,true);
  const restored=await ownerRows(f.db);
  assert.equal(restored.items.length,2);
  assert.deepEqual(new Set(restored.items.map(x=>x.id)),
   new Set(['shirt-1','pants-2']));
  for(const item of restored.items){
   const before=expected.find(x=>x.id===item.id);
   assert.equal(item.originalPhoto.image,before.originalPhoto.image,
    'clean restore must preserve each exact original JPEG');
   assert.equal(item.sourceSHA256,before.sourceSHA256);
   assert.equal(item.originalPhoto.sha256,before.originalPhoto.sha256);
   assert.equal(item.image,before.image);
  }
  const cloud=restored.state.find(x=>x.id==='cloud-sync');
  assert.equal(cloud.localRevision,1);
  assert.equal(cloud.dirty,true);
 });
});
