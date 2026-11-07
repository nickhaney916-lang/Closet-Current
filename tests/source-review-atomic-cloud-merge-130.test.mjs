import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import cloudEngine from '../public/cloud-backup-engine.js';
import {commitHumanReviewedPhoto119}
 from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {reconcileReviewedCloud130,REVIEWED_SOURCE_CLOUD_MERGE_130}
 from '../research/source-review-atomic-cloud-merge-130/reviewed-source-merge.mjs';
import {validateRestore01}
 from '../research/restore-atomic-01/atomic-restore.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sourceIds=['commons-0002','commons-0040'];
const sources={};
for(const id of sourceIds){
 const original=readFileSync('benchmark/fixtures/'+id+'.jpg');
 const pin=createHash('sha256').update(original).digest('hex');
 assert.equal(locked.find(x=>x.id===id).sha256,pin,'genuine locked license source '+id);
 const meta=await sharp(original).metadata();
 const cutout=await sharp(original).extract({
  left:0,top:0,width:Math.max(10,Math.floor(meta.width*.55)),
  height:Math.max(10,Math.floor(meta.height*.65))
 }).jpeg({quality:87}).toBuffer();
 const hash=b=>createHash('sha256').update(b).digest('hex');
 sources[id]={image:'data:image/jpeg;base64,'+original.toString('base64'),
  sourceSHA256:pin,cutoutImage:'data:image/jpeg;base64,'+cutout.toString('base64'),
  cutoutSHA256:hash(cutout)};
}
const deep=x=>structuredClone(x);
const owner=()=>randomUUID();
async function dbOpen(id){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+id,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
function put(db,table,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(table,'readwrite');
  tx.objectStore(table).put(value);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
function get(db,id){return new Promise((resolve,reject)=>{
 const q=db.transaction('items','readonly').objectStore('items').get(id);
 q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
});}
async function reviewedSource(db,ownerId,fixtureId,id,color='Red'){
 const src=sources[fixtureId];
 const record={
  id,ownerId,image:src.image,
  originalPhoto:{image:src.image,sha256:src.sourceSHA256},
  sourceSHA256:src.sourceSHA256,sourceHashVerified:true,
  singleGarmentVerified:false,
  outfitSourceId:'reviewed-multi-source-'+fixtureId,
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:src.sourceSHA256,cutoutSHA256:src.cutoutSHA256,
   cutoutImage:src.cutoutImage},
  category:'Uncategorized',itemType:'Unknown',color:'Unknown'
 };
 await put(db,'state',{id:'draft',batch:[deep(record)]});
 const saved=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>ownerId,record,cryptoProvider:webcrypto,
  review:{confirmed:true,recordId:id,originalSHA256:src.sourceSHA256,
   category:'Tops',itemType:'T-shirt',color,
   singleGarmentConfirmed:false,instanceConfirmed:true,
   cutoutSHA256:src.cutoutSHA256}
 });
 assert.equal(saved.saved,true);
 const row=await get(db,id);
 assert.equal(row.cutoutSHA256,src.cutoutSHA256);
 return row;
}
async function scene(run){
 const ownerId=owner(),db=await dbOpen(ownerId);
 try{
  const a=await reviewedSource(db,ownerId,'commons-0002','shirt-130');
  const b=await reviewedSource(db,ownerId,'commons-0040','other-original-130');
  const saved={id:ownerId+'-saved',ownerId,name:'Owned shirt',
   slots:{top:a.id,bottom:'historic-missing-jeans'},
   future:{preserveUnresolved:true}};
  const baseline={
   schemaVersion:1,ownerId,
   items:[deep(a)],
   state:{'outfit-board':{id:'outfit-board',
    current:{name:'My current outfit',slots:{}},
    saved:[saved],future:{doNotDrop:true}}}
  };
  assert.equal((await validateRestore01(baseline,{ownerId,mode:'cloud'})).valid,true);
  return await run({ownerId,a,b,baseline,db,
   alternate:()=>({...deep(b),id:a.id}),
   lease:()=>true});
 }finally{db.close();}
}
const merge=(s,local,remote,params={})=>
 reconcileReviewedCloud130({
  base:s.baseline,local,remote,ownerId:s.ownerId,
  assertLease:s.lease,...params
 });

test('PHOTO130 original field-level merger permits a falsely re-bound human color on another genuine JPEG; gated merger rejects',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 // Local owner confirms Blue for photograph A. Another device independently
 // replaces the same item ID with a separate genuine reviewed photograph B,
 // still Red. All SHA, crop and review evidence for B remain internally valid.
 local.items[0].color='Blue';
 remote.items[0]=s.alternate();
 assert.equal((await validateRestore01(remote,{ownerId:s.ownerId,mode:'cloud'})).valid,true);
 const unsafe=cloudEngine.mergeDocuments(s.baseline,local,remote);
 assert.equal(unsafe.items[0].color,'Blue','existing merge transplanted A\'s Blue onto B');
 assert.equal(unsafe.items[0].sourceSHA256,s.b.sourceSHA256);
 // Both bytes pass SHA validation, so the bug is semantic, not cryptographic.
 assert.equal((await validateRestore01({...unsafe,ownerId:s.ownerId},
  {ownerId:s.ownerId,mode:'cloud'})).valid,true);
 await assert.rejects(merge(s,local,remote),e=>
  e.code==='source-review-conflict'&&
  e.conflictingItemIds.includes(s.a.id)&&
  !String(e.message).includes('data:image'));
}));

test('PHOTO130 independent non-provenance notes, season and occasion edits on the same photograph preserve both',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 local.items[0].notes='Casual Friday';
 remote.items[0].occasion='Weekend';
 const result=await merge(s,local,remote);
 assert.equal(result.applied,false);
 assert.equal(result.requiresRemoteRevisionCAS,true);
 assert.equal(result.realSignedJWTVerified,false);
 assert.equal(result.candidate.items[0].notes,'Casual Friday');
 assert.equal(result.candidate.items[0].occasion,'Weekend');
 assert.equal(result.candidate.items[0].sourceSHA256,s.a.sourceSHA256);
 assert.equal(result.candidate.items[0].segmentHint.cutoutImage,s.a.segmentHint.cutoutImage);
 assert.deepEqual(result.candidate.state['outfit-board'],s.baseline.state['outfit-board']);
}));

test('PHOTO130 independent owner-reviewed color correction and unrelated note retains same exact JPEG+review source',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 local.items[0].color='Blue';
 remote.items[0].notes='Bought at mall';
 const result=await merge(s,local,remote);
 assert.equal(result.candidate.items[0].color,'Blue');
 assert.equal(result.candidate.items[0].notes,'Bought at mall');
 assert.equal(result.candidate.items[0].segmentHint.cutoutSHA256,s.a.cutoutSHA256);
 assert.equal(result.photoBytesIndependentlyVerified,true);
}));

test('PHOTO130 concurrent category/subtype and color re-review of same source must not become an unreviewed hybrid',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 local.items[0].color='Blue';
 remote.items[0].itemType='Polo shirt';
 await assert.rejects(merge(s,local,remote),e=>e.code==='source-review-conflict');
}));

test('PHOTO130 changing the original source while another device edits metadata is a conflict, not silent photo replacement',()=>scene(async s=>{
 for(const field of ['notes','color','name']){
  const local=deep(s.baseline),remote=deep(s.baseline);
  local.items[0][field]='Local-annotation';
  remote.items[0]=s.alternate();
  await assert.rejects(merge(s,local,remote),e=>e.code==='source-review-conflict',field);
 }
}));

test('PHOTO130 a complete human-reviewed new photo succeeds if the other device did not edit that item',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 remote.items[0]=s.alternate();
 const result=await merge(s,local,remote);
 const piece=result.candidate.items[0];
 assert.equal(piece.originalPhoto.image,s.b.originalPhoto.image);
 assert.equal(piece.segmentHint.cutoutImage,s.b.segmentHint.cutoutImage);
 assert.equal(piece.color,s.b.color);
 assert.equal(piece.sourceSHA256,s.b.sourceSHA256);
 assert.notEqual(piece.threeDReady,true);
 assert.equal(result.applied,false);
}));

test('PHOTO130 concurrent additions to different garment IDs preserve both and old saved-board IDs',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 local.items[0].notes='Local text';
 remote.items.push({...deep(s.b),id:'new-remote-reviewed'});
 const result=await merge(s,local,remote);
 assert.equal(result.candidate.items.length,2);
 assert.deepEqual(new Set(result.candidate.items.map(x=>x.id)),
  new Set(['shirt-130','new-remote-reviewed']));
 assert.equal(result.candidate.state['outfit-board'].saved[0].slots.bottom,
  'historic-missing-jeans');
}));

test('PHOTO130 duplicate newly created item ID with incompatible original sources fails closed',()=>scene(async s=>{
 const base=deep(s.baseline),local=deep(base),remote=deep(base);
 local.items.push({...deep(s.a),id:'same-new-id'});
 remote.items.push({...deep(s.b),id:'same-new-id'});
 await assert.rejects(merge(s,local,remote),e=>
  e.code==='source-review-conflict'&&e.conflictingItemIds.includes('same-new-id'));
}));

test('PHOTO130 tampered SHA or review metadata fails before the generic cloud merger',()=>scene(async s=>{
 const tests=[
  x=>x.segmentHint.cutoutImage=s.b.segmentHint.cutoutImage,
  x=>x.originalPhoto.sha256='0'.repeat(64),
  x=>x.confirmedColor=false,
  x=>x.ownerReviewed=false,
  x=>x.segmentHint.ownerReviewedInstance=false,
  x=>x.threeDReady=true
 ];
 for(const mutate of tests){
  const local=deep(s.baseline),remote=deep(s.baseline);
  mutate(remote.items[0]);
  await assert.rejects(merge(s,local,remote),undefined,mutate.toString());
 }
}));

test('PHOTO130 cross-owner document or nested owner spoof cannot enter a merge',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 remote.ownerId=randomUUID();
 await assert.rejects(merge(s,local,remote),/foreign|unowned/);
 remote.ownerId=s.ownerId;
 remote.items[0].ownerId=randomUUID();
 await assert.rejects(merge(s,local,remote),/foreign owner/);
}));

test('PHOTO130 revoked session before or during photo proof must not produce a merge candidate',()=>scene(async s=>{
 const local=deep(s.baseline),remote=deep(s.baseline);
 await assert.rejects(merge(s,local,remote,{assertLease:()=>false}),/lease/);
 const originalDesc=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 let release,entered,started=false;
 const paused=new Promise(resolve=>{release=resolve;});
 const reached=new Promise(resolve=>{entered=resolve;});
 let active=true;
 Object.defineProperty(globalThis,'crypto',{configurable:true,writable:true,
  value:{subtle:{digest:async (...args)=>{
   if(!started){started=true;entered();await paused;}
   return webcrypto.subtle.digest(...args);
  }}}});
 try{
  const pending=merge(s,local,remote,{assertLease:()=>active});
  await reached;
  active=false;
  local.items[0].color='Changed after source verification';
  release();
  await assert.rejects(pending,/lease/);
 }finally{
  if(release)release();
  if(originalDesc)Object.defineProperty(globalThis,'crypto',originalDesc);
  else delete globalThis.crypto;
 }
}));

test('PHOTO130 decoded only, no cloud HTTP/remote write, physical phone or Family Alpha release claim',()=>{
 const code=readFileSync('research/source-review-atomic-cloud-merge-130/reviewed-source-merge.mjs','utf8');
 for(const term of [
  'export async function reconcileReviewedCloud130({',
  'await validateRestore01(part,{ownerId,mode:',
  "photoBytesIndependentlyVerified:true",
  "sourceReviewAtomic:true",
  "noRemoteWrite:true",
  "familyAlpha:'HOLD'"
 ])assert.ok(code.includes(term),term);
 assert.equal(REVIEWED_SOURCE_CLOUD_MERGE_130.productionAuthorized,false);
 assert.equal(REVIEWED_SOURCE_CLOUD_MERGE_130.noRemoteWrite,true);
});
