import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119}
 from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {packageOwnerCloudCutouts128,reopenOwnerCloudCutouts128}
 from '../research/two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs';
import {exportBackup01,restoreOwner01,readOwnerSnapshot01}
 from '../research/restore-atomic-01/atomic-restore.mjs';
import {verifiedPrivateStyleRoster03}
 from '../research/style-owned-live-03/native-style-panel.mjs';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
const locks=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const originalHash=createHash('sha256').update(original).digest('hex');
assert.equal(locks.find(x=>x.id==='commons-0002').sha256,originalHash);
const data=b=>'data:image/jpeg;base64,'+b.toString('base64');
const sha=b=>createHash('sha256').update(b).digest('hex');
const meta=await sharp(original).metadata();
const cutout=await sharp(original).extract({left:0,top:0,
 width:Math.max(10,Math.floor(meta.width*.55)),
 height:Math.max(10,Math.floor(meta.height*.65))
}).jpeg({quality:88}).toBuffer();
const alternate=await sharp(original).extract({left:Math.floor(meta.width*.12),
 top:Math.floor(meta.height*.08),width:Math.max(10,Math.floor(meta.width*.48)),
 height:Math.max(10,Math.floor(meta.height*.46))
}).jpeg({quality:82}).toBuffer();
const cropHash=sha(cutout);
const deep=x=>structuredClone(x);
const open=owner=>new Promise((resolve,reject)=>{
 const r=indexedDB.open('closet-current-user-'+owner,2);
 r.onupgradeneeded=()=>{
  r.result.createObjectStore('items',{keyPath:'id'});
  r.result.createObjectStore('state',{keyPath:'id'});
 };
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
function put(db,store,item){return new Promise((resolve,reject)=>{
 const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put(item);
 tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});}
async function scenario(run){
 const owner=randomUUID(),db=await open(owner);
 const record={id:'genuine-128-reviewed-piece',ownerId:owner,
  image:data(original),originalPhoto:{image:data(original),sha256:originalHash},
  sourceSHA256:originalHash,sourceHashVerified:true,singleGarmentVerified:false,
  outfitSourceId:'manually-reviewed-group-image',
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:originalHash,cutoutSHA256:cropHash,cutoutImage:data(cutout)},
  category:'Uncategorized',itemType:'Unknown',color:'Unknown'};
 await put(db,'state',{id:'draft',batch:[deep(record)]});
 const saved=await commitHumanReviewedPhoto119({db,ownerId:owner,currentOwner:()=>owner,
  record,cryptoProvider:webcrypto,review:{
   confirmed:true,recordId:record.id,originalSHA256:originalHash,
   category:'Tops',itemType:'T-shirt',color:'Green',
   singleGarmentConfirmed:false,instanceConfirmed:true,cutoutSHA256:cropHash}});
 assert.equal(saved.saved,true);
 await put(db,'state',{id:'outfit-board',current:{name:'Owned look',slots:{}},
  saved:[{id:owner+'-look',ownerId:owner,name:'P128 source look',
   slots:{top:record.id,bottom:'known-missing-jeans'},future:{keep:true}}]});
 const before=await readOwnerSnapshot01(db,()=>{});
 const backup=exportBackup01({ownerId:owner,rows:before.rows});
 let currentOwner=owner,active=true;
 const lease=()=>{
  if(!active||currentOwner!==owner)throw Error('PHOTO128 owner session revoked');
 };
 const env={owner,db,before,backup,lease,
  switchOwner(x){currentOwner=x;},revoke(){active=false;},
  restoreOwner(){currentOwner=owner;active=true;}};
 try{return await run(env);}finally{db.close();}
}
const pack=async e=>packageOwnerCloudCutouts128({
 backup:e.backup,ownerId:e.owner,assertLease:e.lease,subtle:webcrypto.subtle
});
async function reopen(e,packed,fetch){
 return reopenOwnerCloudCutouts128({document:packed.document,ownerId:e.owner,
  assertLease:e.lease,subtle:webcrypto.subtle,
  fetchPrivateJPEG:fetch|| (async key=>packed.assets.get(key))});
}
test('PHOTO128 real P119 original and secondary cutout get two separately SHA-addressed private cloud objects',()=>scenario(async e=>{
 const packed=await pack(e);
 assert.equal(packed.jpgObjectCount,2);
 assert.equal(packed.document.ownerId,e.owner);
 const row=packed.document.items[0];
 assert.equal(row.originalPhoto.image,'closet-photo:'+e.owner+'/'+originalHash+'.jpg');
 assert.equal(row.segmentHint.cutoutImage,'closet-photo:'+e.owner+'/'+cropHash+'.jpg');
 assert.notEqual(row.originalPhoto.image,row.segmentHint.cutoutImage);
 assert.equal(row.image,row.originalPhoto.image);
 assert.equal(row.color,'Green');assert.equal(row.colorSource,'user');
 assert.equal(row.ownerReviewed,true);assert.equal(row.confirmedColor,true);
 const encoded=JSON.stringify(packed.document);
 assert.equal(encoded.includes('data:image/jpeg;base64,'),false);
 assert.equal(encoded.includes(data(cutout)),false);
 assert.equal(packed.productionAuthorized,false);assert.equal(packed.realSignedJWTVerified,false);
}));
test('PHOTO128 genuine private cloud double-JPEG round trip recovers exact owner reviewed metadata and saved outfit references',()=>scenario(async e=>{
 const packed=await pack(e),opened=await reopen(e,packed);
 assert.equal(opened.verifiedObjectCount,2);
 assert.equal(opened.ownerPrivate,true);
 assert.equal(opened.originalAndCutoutJPEGSHAValid,true);
 assert.deepEqual(opened.document.items,e.backup.items);
 assert.deepEqual(opened.document.state,e.backup.state);
 const empty=await new Promise((resolve,reject)=>{
  const tx=e.db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').clear();
  tx.objectStore('state').delete('outfit-board');
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 });
 const before=await readOwnerSnapshot01(e.db,()=>{});
 const restorePayload={format:'closet-current',version:4,ownerId:e.owner,
  items:opened.document.items,state:opened.document.state};
 const reply=await restoreOwner01({db:e.db,backup:restorePayload,ownerId:e.owner,
  expectedFingerprint:before.fingerprint,confirmed:true,assertLease:e.lease});
 assert.equal(reply.restored,true);
 const after=await readOwnerSnapshot01(e.db,()=>{});
 assert.deepEqual(after.rows.items,e.before.rows.items);
 const restoredBoard=after.rows.state.find(x=>x.id==='outfit-board');
 assert.deepEqual(restoredBoard,e.before.rows.state.find(x=>x.id==='outfit-board'));
 const board={
  readOnlyWardrobe:()=>({ownerId:e.owner,generation:1,boardFingerprint:'same',
   items:deep(after.rows.items)}),
  sessionLease:()=>({ownerId:e.owner,generation:1}),
  status:()=>({active:true})
 };
 const roster=await verifiedPrivateStyleRoster03(board,{allowCutout124:true,subtle:webcrypto.subtle});
 assert.equal(roster.items.length,1);
 assert.equal(roster.items[0].genuinePhoto,data(cutout));
 assert.equal(roster.items[0].threeDReady,false);
 assert.equal(opened.realSignedJWTVerified,false);
}));
test('PHOTO128 wrong-owner cloud payload or foreign object path blocked before private fetch',()=>scenario(async e=>{
 const packed=await pack(e),other=randomUUID();
 let called=0;
 await assert.rejects(reopenOwnerCloudCutouts128({
  document:packed.document,ownerId:other,subtle:webcrypto.subtle,
  assertLease:()=>{},fetchPrivateJPEG:async()=>{called++;return original;}
 }),/owner|PHOTO128/);
 const broken=deep(packed.document);
 broken.items[0].segmentHint.cutoutImage=
  'closet-photo:'+other+'/'+cropHash+'.jpg';
 await assert.rejects(reopen(e,{document:broken},async()=>{called++;return cutout;}),/foreign/);
 assert.equal(called,0);
}));
test('PHOTO128 actual JPEG replacement under matching owner path rejected by independently computed source hash',()=>scenario(async e=>{
 const packed=await pack(e);
 const cropped=packed.document.items[0].segmentHint.cutoutImage;
 const bad=async path=>path===cropped?alternate:packed.assets.get(path);
 await assert.rejects(reopen(e,packed,bad),/SHA mismatch/);
 assert.deepEqual((await readOwnerSnapshot01(e.db,()=>{})).rows,e.before.rows);
}));
test('PHOTO128 forgery of cutout review, owner color, and source hash fails closed after remote fetch and before restore',()=>scenario(async e=>{
 const packed=await pack(e);
 for(const mutate of [
  x=>{x.items[0].ownerReviewed=false;},
  x=>{x.items[0].confirmedColor=false;},
  x=>{x.items[0].segmentHint.cutoutSHA256='0'.repeat(64);},
  x=>{x.items[0].sourceSHA256='0'.repeat(64);},
  x=>{x.items[0].threeDReady=true;},
  x=>{x.items[0].ownerId=randomUUID();}
 ]){
  const doc=deep(packed.document);mutate(doc);
  await assert.rejects(reopen(e,{document:doc}),undefined,mutate.toString());
 }
}));
test('PHOTO128 token/session rotation during private remote JPEG fetch revokes prior cloud read',()=>scenario(async e=>{
 const packed=await pack(e);
 let calls=0;
 await assert.rejects(reopen(e,packed,async path=>{
  calls++;if(calls===1)e.switchOwner(randomUUID());
  return packed.assets.get(path);
 }),/session revoked/);
 assert.equal(calls,1);
}));
test('PHOTO128 mutable caller file backup cannot change after source SHA verification begins',()=>scenario(async e=>{
 const orig=deep(e.backup);
 const packed=await pack(e);
 e.backup.items[0].segmentHint.cutoutImage=data(alternate);
 e.backup.items[0].color='Blue';
 assert.equal(packed.document.items[0].color,'Green');
 assert.equal(packed.document.items[0].segmentHint.cutoutImage,
  'closet-photo:'+e.owner+'/'+cropHash+'.jpg');
 assert.equal(orig.items[0].color,'Green');
}));
test('PHOTO128 source paths and review proof remain research only and no signed JWT claims',()=>{
 const source=readFileSync('research/two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs','utf8');
 for(const part of [
  "const imageKey=k=>k==='image'||k==='cutoutImage'",
  "await validateRestore01(snapshot,{ownerId,mode:'file'})",
  "await validateRestore01(restored,{ownerId,mode:'cloud'})",
  "assertLease();",
  "realSignedJWTVerified:false",
  "productionAuthorized:false",
  "familyAlpha:'HOLD'"
 ])assert.ok(source.includes(part),part);
});
