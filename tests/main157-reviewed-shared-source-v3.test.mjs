// M157: real default v3 export + atomic import, owner-private IndexedDB.
// Synthetic JPEG bytes and owners ONLY; no physical-device/independent label claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {distinctReviewedSharedOriginal157} from '../public/native-reviewed-shared-original-157.mjs';
import {exportDurableOwnerBackupM3} from '../public/native-default-verified-backup-export-m3.mjs';
import {prepareDefaultAtomicM3,commitDefaultAtomicM3} from '../public/native-default-atomic-import-m3.mjs';
const require=createRequire(import.meta.url);
const {indexedDB}=require('fake-indexeddb');
globalThis.crypto??=webcrypto;
const fixtureJPEG=bytes=>'data:image/jpeg;base64,'+Buffer.from(bytes).toString('base64');
const original=fixtureJPEG([255,216,255,217]);
const firstCutout=fixtureJPEG([255,216,11,12,255,217]);
const nextCutout=fixtureJPEG([255,216,21,22,255,217]);
const digest=image=>createHash('sha256').update(Buffer.from(image.slice(image.indexOf(',')+1),'base64')).digest('hex');
const sourceSHA=digest(original);
const native=runInNewContext(
 readFileSync('public/taxonomy.js','utf8')+'\n'+
 readFileSync('public/outfit-board-engine.js','utf8').split('function boardGaps(')[0]+'\n'+
 readFileSync('public/trends.js','utf8').split('function validLook(value){')[1].split('function storeLooks(')[0].replace(/^/,'function validLook(value){')+
 '\n({normalizeClothing,cleanOutfitBoard,validLook})',
 {categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  safeInspirationUrl:()=>'',structuredClone,crypto:globalThis.crypto}
);
const piece=(owner,id,category,itemType,color,cutout,number)=>({
 id,ownerId:owner,name:color+' '+itemType,image:original,
 originalPhoto:{ownerId:owner,image:original,sha256:sourceSHA},
 sourceSHA256:sourceSHA,sourceHashVerified:true,
 singleGarmentVerified:false,sourcePieceKey:sourceSHA+'/manual-'+number,
 outfitSourceId:sourceSHA,cutoutSHA256:digest(cutout),
 segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
  originalSHA256:sourceSHA,cutoutSHA256:digest(cutout),cutoutImage:cutout},
 ownerReviewed:true,humanReviewedSource:true,confirmedCategory:true,
 confirmedColor:true,colorSource:'user',category,itemType,color,
 confirmedDetails:{category,itemType,color},
 confirmedDetailsSource31:{ownerId:owner,itemId:id,sourceSHA256:sourceSHA,
  basis:'PHOTO119-explicit-owner-confirmation'},
 reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
 threeDReady:false,photoOnly:true
});
const pair=owner=>[
 piece(owner,'reviewed-top','Tops','T-shirt','Blue',firstCutout,1),
 piece(owner,'reviewed-bottom','Bottoms','Jeans','Black',nextCutout,2)
];
let serial=0;
async function openFixture(){
 const owner='m157-synthetic-'+(++serial);
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 let active=true;
 return {owner,db,assertLease:()=>{if(!active)throw Error('M157_LEASE_REVOKED');},
  revoke:()=>{active=false;},close:()=>db.close()};
}
function transact(db,run){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  run(tx.objectStore('items'),tx.objectStore('state'));
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function seed(f,items=pair(f.owner)){
 await transact(f.db,(saved,state)=>{
  for(const row of items)saved.put(row);
  state.put({id:'looks',looks:[]});
  state.put({id:'draft',batch:[]});
  state.put({id:'outfit-board',current:{name:'Pair',slots:{top:items[0].id,bottom:items[1].id}},
   saved:[{name:'Saved pair',slots:{top:items[0].id,bottom:items[1].id}}]});
  state.put({id:'cloud-sync',baseVersion:4,baseDocument:null,localRevision:1,dirty:false});
 });
}
async function snapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  tx.oncomplete=()=>resolve({items:a.result,state:b.result});
  tx.onerror=()=>reject(tx.error);
 });
}
const exported=f=>exportDurableOwnerBackupM3({
 ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease});
const prepare=(f,data)=>prepareDefaultAtomicM3({
 data,ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,...native});
const commit=(f,prepared)=>commitDefaultAtomicM3({
 ownerDB:f.db,ownerId:f.owner,assertLease:f.assertLease,prepared,confirmed:true});

test('M157 signed separate PHOTO119 same-source original cutouts are not a duplicated garment',async()=>{
 const [top,bottom]=pair('synthetic-owner');
 assert.equal(await distinctReviewedSharedOriginal157(top,bottom,'synthetic-owner'),true);
 assert.equal(await distinctReviewedSharedOriginal157(top,{...bottom,cutoutSHA256:top.cutoutSHA256},'synthetic-owner'),false);
 assert.equal(await distinctReviewedSharedOriginal157(top,{...bottom,segmentHint:{...bottom.segmentHint,cutoutImage:top.segmentHint.cutoutImage}},'synthetic-owner'),false);
 assert.equal(await distinctReviewedSharedOriginal157(top,{...bottom,confirmedDetails:{...bottom.confirmedDetails,color:'Red'}},'synthetic-owner'),false);
 assert.equal(await distinctReviewedSharedOriginal157(top,{...bottom,ownerReviewed:false},'synthetic-owner'),false);
 assert.equal(await distinctReviewedSharedOriginal157(top,bottom,'different-owner'),false);
});

test('M157 real default v3 backup and atomic restore preserve two separately reviewed pieces and exact shared-original JPEG',async()=>{
 const f=await openFixture();
 try{
  await seed(f);
  const backup=await exported(f);
  assert.equal(backup.data.version,3);
  assert.equal(backup.data.items.length,2);
  assert.equal(backup.data.outfitBoard.saved[0].slots.bottom,'reviewed-bottom');
  await transact(f.db,(items,state)=>{items.clear();state.clear();});
  const prepared=await prepare(f,structuredClone(backup.data));
  const result=await commit(f,prepared);
  assert.equal(result.committed,true);
  const snap=await snapshot(f.db),byId=new Map(snap.items.map(row=>[row.id,row]));
  assert.equal(byId.size,2);
  assert.equal(byId.get('reviewed-top').originalPhoto.image,original);
  assert.equal(byId.get('reviewed-bottom').originalPhoto.image,original);
  assert.equal(byId.get('reviewed-top').sourceSHA256,sourceSHA);
  assert.equal(byId.get('reviewed-bottom').sourceSHA256,sourceSHA);
  assert.notEqual(byId.get('reviewed-top').cutoutSHA256,byId.get('reviewed-bottom').cutoutSHA256);
  const board=snap.state.find(x=>x.id==='outfit-board');
  assert.equal(board.current.slots.top,'reviewed-top');
  assert.equal(board.current.slots.bottom,'reviewed-bottom');
  assert.equal(board.saved[0].slots.bottom,'reviewed-bottom');
  const again=await exported(f);
  assert.deepEqual(again.data.items.map(x=>x.id).sort(),['reviewed-bottom','reviewed-top']);
 }finally{f.close();}
});

test('M157 unreviewed same-original duplicate remains rejected at export without mutation',async()=>{
 const f=await openFixture();
 try{
  const items=pair(f.owner);
  delete items[1].confirmedDetailsSource31;
  await seed(f,items);
  const before=await snapshot(f.db);
  await assert.rejects(exported(f),/SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});

test('M157 same-cutout duplicate stays refused even with different IDs, reviewed labels and piece keys',async()=>{
 const f=await openFixture();
 try{
  const items=pair(f.owner);
  items[1].cutoutSHA256=items[0].cutoutSHA256;
  items[1].segmentHint={...items[0].segmentHint};
  await seed(f,items);
  await assert.rejects(exported(f),/SHARED_ORIGINAL_RESTORE_UNSUPPORTED/);
 }finally{f.close();}
});

test('M157 v3 preflight rejects forged second instance and leaves existing closet untouched',async()=>{
 const f=await openFixture();
 try{
  await seed(f);
  const backup=(await exported(f)).data;
  backup.items[1].segmentHint.cutoutSHA256='f'.repeat(64);
  await transact(f.db,(items,state)=>{items.clear();state.clear();});
  const before=await snapshot(f.db);
  await assert.rejects(prepare(f,backup),/DUPLICATE_ORIGINAL_REQUIRES_OWNER_REVIEW/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});

test('M157 existing ID cannot silently switch cutout SHA or instance review evidence',async()=>{
 const f=await openFixture();
 try{
  await seed(f);
  const backup=(await exported(f)).data;
  backup.items[0].cutoutSHA256=backup.items[1].cutoutSHA256;
  await assert.rejects(prepare(f,backup),/EXISTING_ORIGINAL_CONFLICT/);
 }finally{f.close();}
});

test('M157 original bytes tamper aborts export and never declares source-safe backup',async()=>{
 const f=await openFixture();
 try{
  const items=pair(f.owner);items[1].originalPhoto.image=firstCutout;
  await seed(f,items);
  await assert.rejects(exported(f),/PHOTO_SHA_MISMATCH/);
 }finally{f.close();}
});

test('M157 owner lease revocation between preflight and commit causes zero atomic writes',async()=>{
 const f=await openFixture();
 try{
  await seed(f);
  const backup=(await exported(f)).data;
  const prepared=await prepare(f,backup);
  const before=await snapshot(f.db);
  f.revoke();
  await assert.rejects(commit(f,prepared),/M157_LEASE_REVOKED/);
  assert.deepEqual(await snapshot(f.db),before);
 }finally{f.close();}
});

test('M157 legacy same-ID import cannot mint owner-reviewed cutout proof onto formerly ambiguous saved original',async()=>{
 const f=await openFixture();
 try{
  await seed(f);
  const valid=(await exported(f)).data;
  const before=await snapshot(f.db);
  const prior={...before.items.find(x=>x.id==='reviewed-top')};
  for(const key of ['segmentHint','cutoutSHA256','confirmedDetailsSource31',
   'confirmedDetails','reviewProvenance'])delete prior[key];
  prior.ownerReviewed=false;prior.humanReviewedSource=false;
  await transact(f.db,(items,state)=>items.put(prior));
  const current=await snapshot(f.db);
  await assert.rejects(prepare(f,valid),/LEGACY_ATOMIC_EXISTING_ORIGINAL_CONFLICT/);
  assert.deepEqual(await snapshot(f.db),current);
 }finally{f.close();}
});
