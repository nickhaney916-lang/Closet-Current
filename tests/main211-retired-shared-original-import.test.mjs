/**
 * M211 — a retired same-owner source must NOT be counted as an active
 * independently reviewed sibling to justify importing a new-ID crop from
 * that JPEG. Original source is synthetic minimal valid JPEG, no real owner
 * photographs, network, app deploy, or 3D permission.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import {distinctReviewedSharedOriginal157}
 from '../public/native-reviewed-shared-original-157.mjs';
import {prepareDefaultAtomicM3}
 from '../public/native-default-atomic-import-m3.mjs';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;

const owner='main211-synthetic-signed-owner';
const photo=bytes=>'data:image/jpeg;base64,'+Buffer.from(bytes).toString('base64');
const digest=bytes=>createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const raw=[255,216,17,34,255,217],a=[255,216,51,1,255,217],
 b=[255,216,51,2,255,217],c=[255,216,91,92,255,217];
const original=photo(raw),sourceSHA=digest(raw),other=photo(c);
function verified(id,cutoutBytes,overrides={}){
 const crop=digest(cutoutBytes);
 return {
  id,ownerId:owner,name:'Owner reviewed cutout '+id,category:'Tops',
  itemType:'Blouse',color:'Blue',colorSource:'user',
  image:original,sourceSHA256:sourceSHA,sourceHashVerified:true,
  singleGarmentVerified:false,ownerReviewed:true,humanReviewedSource:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  originalPhoto:{ownerId:owner,image:original,sha256:sourceSHA},
  cutoutSHA256:crop,
  segmentHint:{originalSHA256:sourceSHA,cutoutSHA256:crop,
   cutoutImage:photo(cutoutBytes),verified:true,
   ownerReviewedInstance:true,clipped:false},
  confirmedDetails:{category:'Tops',itemType:'Blouse',color:'Blue'},
  confirmedDetailsSource31:{basis:'PHOTO119-explicit-owner-confirmation',
   ownerId:owner,itemId:id,sourceSHA256:sourceSHA},
  confirmedCategory:true,confirmedColor:true,
  ...overrides
 };
}
async function fixture(saved){
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner,1);
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('items',{keyPath:'id'});
   request.result.createObjectStore('state',{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put(saved);
  tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,
   baseDocument:null,localRevision:3,dirty:false});
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
 return db;
}
async function snapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const i=tx.objectStore('items').getAll(),s=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:i.result,state:s.result});
  tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
const prepare=(db,record)=>prepareDefaultAtomicM3({
 data:{format:'closet-current',version:3,items:[record]},
 ownerDB:db,ownerId:owner,assertLease:()=>{},
 normalizeClothing:x=>x,validLook:x=>x,cleanOutfitBoard:()=>({})
});
test('M211 control: active independently owner-reviewed distinct cutouts may coexist',async()=>{
 assert.equal(await distinctReviewedSharedOriginal157(
  verified('saved',a),verified('incoming',b),owner),true);
});
test('M211 control: matching cutout and unreviewed sibling remain ambiguous',async()=>{
 assert.equal(await distinctReviewedSharedOriginal157(
  verified('saved',a),verified('incoming',a),owner),false);
 assert.equal(await distinctReviewedSharedOriginal157(
  verified('saved',a),verified('incoming',b,{ownerReviewed:false}),owner),false);
});
for(const flag of ['deleted','sourceRevoked']){
 test('M211 retired '+flag+' prior row must NOT grant independent sibling cutout approval',async()=>{
  const saved=verified('saved',a,{[flag]:true}),incoming=verified('incoming',b);
  assert.equal(await distinctReviewedSharedOriginal157(saved,incoming,owner),false);
  assert.equal(await distinctReviewedSharedOriginal157(incoming,saved,owner),false);
 });
 test('M211 old v3 backup cannot import a new-ID reviewed crop using '+flag+
      ' original as the only sibling proof',async()=>{
  const db=await fixture(verified('saved',a,{[flag]:true}));
  try{
   const before=await snapshot(db);
   await assert.rejects(prepare(db,verified('incoming',b)),
    /LEGACY_ATOMIC_DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
   assert.deepEqual(await snapshot(db),before,
    'failed authorization must not mutate private wardrobe or revision');
  }finally{db.close();}
 });
}
test('M211 active source with verified independent cutout remains importable',async()=>{
 const db=await fixture(verified('saved',a));
 try{
  const plan=await prepare(db,verified('incoming',b));
  assert.equal(plan.counts.garments,1);
  assert.equal(plan.ownerId,owner);
  assert.equal(plan.releaseAuthorized,false);
 }finally{db.close();}
});
test('M211 unrelated original remains separately importable after source retirement',async()=>{
 const db=await fixture(verified('saved',a,{deleted:true}));
 try{
  const next={...verified('incoming',b),image:other,originalPhoto:{
   ownerId:owner,image:other,sha256:digest(c)},
   sourceSHA256:digest(c),singleGarmentVerified:true,
   cutoutSHA256:undefined,segmentHint:undefined,
   confirmedDetailsSource31:{basis:'PHOTO119-explicit-owner-confirmation',
    ownerId:owner,itemId:'incoming',sourceSHA256:digest(c)}};
  const plan=await prepare(db,next);
  assert.equal(plan.counts.garments,1);
 }finally{db.close();}
});
