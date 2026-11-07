import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119}
 from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {validateRestore01,readOwnerSnapshot01,exportBackup01,restoreOwner01,
 verifyReviewedCutouts126} from '../research/restore-atomic-01/atomic-restore.mjs';
import {verifiedPrivateStyleRoster03,reviewedSourceBoundCutout124}
 from '../research/style-owned-live-03/native-style-panel.mjs';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const bytes=readFileSync('benchmark/fixtures/commons-0002.jpg');
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0002');
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(bytes),locked.sha256,'licensed original JPEG must match locked source');
const originalImage='data:image/jpeg;base64,'+bytes.toString('base64'),originalSHA=sha(bytes);
const meta=await sharp(bytes).metadata();
const cutoutBytes=await sharp(bytes).extract({
 left:0,top:0,width:Math.max(10,Math.floor(meta.width*.55)),
 height:Math.max(10,Math.floor(meta.height*.65))
}).jpeg({quality:88}).toBuffer();
const cutoutImage='data:image/jpeg;base64,'+cutoutBytes.toString('base64'),cutoutSHA=sha(cutoutBytes);
const badBytes=await sharp(bytes).extract({
 left:Math.floor(meta.width*.12),top:Math.floor(meta.height*.12),
 width:Math.max(10,Math.floor(meta.width*.5)),
 height:Math.max(10,Math.floor(meta.height*.5))
}).jpeg({quality:84}).toBuffer();
const badImage='data:image/jpeg;base64,'+badBytes.toString('base64');
assert.notEqual(sha(badBytes),cutoutSHA);
const ownerA=()=>('RESTORE126-'+randomUUID()),deep=x=>structuredClone(x);

function open(name){return new Promise((resolve,reject)=>{
 const r=indexedDB.open(name,2);
 r.onupgradeneeded=()=>{
  r.result.createObjectStore('items',{keyPath:'id'});
  r.result.createObjectStore('state',{keyPath:'id'});
 };
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});}
function put(db,table,row){return new Promise((resolve,reject)=>{
 const tx=db.transaction(table,'readwrite');tx.objectStore(table).put(row);
 tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});}
function clear(db){return new Promise((resolve,reject)=>{
 const tx=db.transaction(['items','state'],'readwrite');
 tx.objectStore('items').clear();
 tx.objectStore('state').delete('draft');
 tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});}
const board=owner=>({id:'outfit-board',current:{name:'My saved work',slots:{}},
 saved:[{id:owner+'-saved-look',ownerId:owner,name:'Original look',
  slots:{top:'reviewed-piece-126',bottom:'missing-still-preserved'},
  future:{keep:true}}],future:{keepAll:true}});
async function scenario(run){
 const owner=ownerA(),dbname='closet-current-user-'+owner;
 let db=await open(dbname);
 const record={
  id:'reviewed-piece-126',ownerId:owner,image:originalImage,
  originalPhoto:{image:originalImage,sha256:originalSHA},
  sourceSHA256:originalSHA,sourceHashVerified:true,singleGarmentVerified:false,
  outfitSourceId:'multi-piece-original-owner-confirmed',
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:originalSHA,cutoutSHA256:cutoutSHA,cutoutImage},
  category:'Uncategorized',itemType:'Unknown',color:'Unknown'
 };
 await put(db,'state',{id:'draft',batch:[deep(record)]});
 const receipt=await commitHumanReviewedPhoto119({db,ownerId:owner,currentOwner:()=>owner,
  record,review:{confirmed:true,recordId:record.id,originalSHA256:originalSHA,
   category:'Tops',itemType:'T-shirt',color:'Red',
   singleGarmentConfirmed:false,instanceConfirmed:true,cutoutSHA256:cutoutSHA},
  cryptoProvider:webcrypto});
 assert.equal(receipt.saved,true);
 await put(db,'state',board(owner));
 await put(db,'state',{id:'looks',looks:[]});
 const snap=await readOwnerSnapshot01(db,()=>{});
 const backup=exportBackup01({ownerId:owner,rows:snap.rows});
 const env={owner,dbname,db,backup,
  async reopen(){db.close();db=await open(dbname);env.db=db;return db;}};
 try{return await run(env);}finally{db.close();}
}
const inspect=async db=>readOwnerSnapshot01(db,()=>{});

test('PHOTO126 P119 genuine original+separate cutout SHA owner review passes V4 preflight and does not certify 3D',()=>scenario(async e=>{
 const row=e.backup.items[0];
 assert.equal(reviewedSourceBoundCutout124(row),true);
 const result=await validateRestore01(e.backup,{ownerId:e.owner});
 assert.equal(result.valid,true);
 assert.equal(result.reviewedCutoutJPEGsVerified,1);
 assert.ok(result.photoFieldsVerified>=2);
 assert.equal(await verifyReviewedCutouts126(e.backup,{ownerId:e.owner}),1);
 assert.equal(row.segmentHint.cutoutImage,cutoutImage);
 assert.equal(row.originalPhoto.image,originalImage);
 assert.notEqual(cutoutImage,originalImage);
 assert.notEqual(row.threeDReady,true);
 assert.equal(result.originalRecordsUnmodified,true);
}));

test('PHOTO126 any forged/missing review evidence or secondary cutout hash cannot pass full restore validation',()=>scenario(async e=>{
 const changes=[
  r=>{r.segmentHint.cutoutImage=badImage;},
  r=>{r.segmentHint.cutoutImage='data:image/jpeg;base64,AA==';},
  r=>{r.segmentHint.cutoutSHA256='0'.repeat(64);},
  r=>{r.cutoutSHA256='0'.repeat(64);},
  r=>{delete r.cutoutSHA256;},
  r=>{delete r.segmentHint.cutoutImage;},
  r=>{r.segmentHint.ownerReviewedInstance=false;},
  r=>{r.segmentHint.clipped=true;},
  r=>{r.segmentHint.verified=false;},
  r=>{r.ownerReviewed=false;},
  r=>{r.humanReviewedSource=false;},
  r=>{r.confirmedColor=false;},
  r=>{r.confirmedCategory=false;},
  r=>{r.reviewProvenance='unknown';},
  r=>{r.color='Unknown';},
  r=>{r.colorSource='model';},
  r=>{r.category='Uncategorized';},
  r=>{r.originalPhoto.sha256='0'.repeat(64);},
  r=>{r.threeDReady=true;},
  r=>{r.singleGarmentVerified=true;},
  r=>{r.multipleGarments=true;},
  r=>{r.outfitSourceId='';}
 ];
 for(const change of changes){
  const payload=deep(e.backup);change(payload.items[0]);
  await assert.rejects(validateRestore01(payload,{ownerId:e.owner}),undefined,change.toString());
 }
}));

test('PHOTO126 valid byte-cutout corruption or missing provenance aborts before any IndexedDB restore change',()=>scenario(async e=>{
 const before=await inspect(e.db);
 for(const change of [
  r=>{r.segmentHint.cutoutImage=badImage;},
  r=>{r.segmentHint.ownerReviewedInstance=false;},
  r=>{r.cutoutSHA256='f'.repeat(64);}
 ]){
  const backup=deep(e.backup);change(backup.items[0]);
  await assert.rejects(restoreOwner01({db:e.db,ownerId:e.owner,backup,
   expectedFingerprint:before.fingerprint,confirmed:true,assertLease:()=>{}}));
  const after=await inspect(e.db);
  assert.deepEqual(after.rows,before.rows,'failed cutout restore must preserve all items and saved outfits');
 }
}));

test('PHOTO126 atomically restore lost cutout+original after real P119 capture and reopened local database',()=>scenario(async e=>{
 const expected=deep(e.backup.items[0]);
 await clear(e.db);
 const lost=await inspect(e.db);
 assert.equal(lost.rows.items.length,0);
 const status=await restoreOwner01({
  db:e.db,ownerId:e.owner,backup:e.backup,confirmed:true,
  expectedFingerprint:lost.fingerprint,assertLease:()=>{}
 });
 assert.equal(status.restored,true);
 assert.equal(status.atomic,true);
 await e.reopen();
 const after=await inspect(e.db);
 assert.equal(after.rows.items.length,1);
 const persisted=after.rows.items[0];
 assert.deepEqual(persisted,expected,'original JPEG, cutout JPEG and full review/provenance restored byte-for-byte');
 assert.equal(persisted.segmentHint.cutoutImage,cutoutImage);
 assert.equal(persisted.originalPhoto.image,originalImage);
 assert.equal(after.rows.state.find(x=>x.id==='outfit-board').saved[0].future.keep,true);
 assert.equal(after.rows.state.find(x=>x.id==='cloud-sync').dirty,true);
 const board={
  readOnlyWardrobe:()=>({ownerId:e.owner,generation:1,
   boardFingerprint:'RESTORED-SOURCE-REOPENED-126',items:[deep(persisted)]}),
  sessionLease:()=>({ownerId:e.owner,generation:1}),
  status:()=>({active:true})
 };
 const roster=await verifiedPrivateStyleRoster03(board,{allowCutout124:true,subtle:webcrypto.subtle});
 assert.equal(roster.items.length,1);
 assert.equal(roster.items[0].genuinePhoto,cutoutImage);
 assert.equal(roster.items[0].cutoutSHA256Verified,true);
 assert.equal(roster.items[0].threeDReady,false);
 assert.equal(roster.releaseAuthorized,false);
}));

test('PHOTO126 restore cannot import a different owner cutout even when source images and hashes are valid',()=>scenario(async e=>{
 const other='OTHER-'+randomUUID();
 await assert.rejects(validateRestore01(e.backup,{ownerId:other}),/owner/);
 const forged=deep(e.backup);forged.ownerId=other;
 await assert.rejects(validateRestore01(forged,{ownerId:other}),/foreign owner/);
 const before=await inspect(e.db);
 await assert.rejects(restoreOwner01({db:e.db,backup:forged,ownerId:e.owner,
  expectedFingerprint:before.fingerprint,confirmed:true,assertLease:()=>{}}));
 assert.deepEqual((await inspect(e.db)).rows,before.rows);
}));

test('PHOTO126 asynchronous preflight verifies the same cloned bytes eventually committed; caller mutation cannot change reviewed restored cutout',()=>scenario(async e=>{
 const backup=deep(e.backup),expected=deep(backup.items[0]);
 // Break the target DB before the valid restore so the source must be copied.
 await clear(e.db);
 const before=await inspect(e.db);
 const originalCryptoDescriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 let unblock,notify;
 const entered=new Promise(resolve=>{notify=resolve;});
 const gate=new Promise(resolve=>{unblock=resolve;});
 let started=false;
 Object.defineProperty(globalThis,'crypto',{configurable:true,writable:true,
  value:{subtle:{digest:async (algorithm,raw)=>{
   if(!started){started=true;notify();await gate;}
   return webcrypto.subtle.digest(algorithm,raw);
  }}}});
 try{
  const pending=restoreOwner01({db:e.db,backup,ownerId:e.owner,
   expectedFingerprint:before.fingerprint,confirmed:true,assertLease:()=>{}});
  await entered;
  backup.items[0].color='Changed after cloning';
  backup.items[0].segmentHint.cutoutImage=badImage;
  backup.items[0].cutoutSHA256='0'.repeat(64);
  unblock();
  const finished=await pending;
  assert.equal(finished.restored,true);
  const after=(await inspect(e.db)).rows.items[0];
  assert.deepEqual(after,expected);
  assert.equal(after.segmentHint.cutoutImage,cutoutImage);
 }finally{
  if(unblock)unblock();
  if(originalCryptoDescriptor)Object.defineProperty(globalThis,'crypto',originalCryptoDescriptor);
  else delete globalThis.crypto;
 }
}));

test('PHOTO126 legacy non-cutout records remain supported, but cannot inherit a fake cutout badge',async()=>{
 const owner=ownerA(),source={format:'closet-current',version:4,ownerId:owner,
  items:[{id:'legacy',ownerId:owner,image:originalImage,originalPhoto:{
   image:originalImage,sha256:originalSHA},sourceSHA256:originalSHA,
   category:'Tops',itemType:'T-shirt',color:'Red'}],
  state:{'outfit-board':{id:'outfit-board',current:{name:'New',slots:{}},saved:[]}}};
 const ok=await validateRestore01(source,{ownerId:owner});
 assert.equal(ok.valid,true);
 assert.equal(ok.reviewedCutoutJPEGsVerified,0);
 const forged=deep(source);
 forged.items[0].segmentHint={cutoutSHA256:cutoutSHA,cutoutImage};
 await assert.rejects(validateRestore01(forged,{ownerId:owner}),/PHOTO126/);
});

test('PHOTO126 source hardening remains isolated and Family Alpha held',()=>{
 const src=readFileSync('research/restore-atomic-01/atomic-restore.mjs','utf8');
 for(const term of [
  'export async function verifyReviewedCutouts126(value,{ownerId}={})',
  'reviewedSourceBoundCutout124(row)',
  'await photoProof(hint.cutoutImage,{hash:row.cutoutSHA256})',
  'const reviewedCutoutJPEGsVerified=await verifyReviewedCutouts126(value,{ownerId})',
  'assertLease();const target=clone(backup);',
  'await validateRestore01(target,{ownerId});',
  "productionAuthorized:false",
  "familyAlpha:'HOLD'"
 ])assert.ok(src.includes(term),term);
});
