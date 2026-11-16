// MAIN1054 M104 — exact native v3 signed-owner exporter receipts.
// Real IndexedDB transaction semantics, synthetic owner/photo bytes only.
// This does not authorize physical photo-fitting, cloud access or release.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';
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
