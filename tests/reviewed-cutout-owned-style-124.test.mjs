import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {reviewedSourceBoundCutout124,reviewedVisiblePiece12,verifiedPrivateStyleRoster03}
 from '../research/style-owned-live-03/native-style-panel.mjs';
import {suggestThreeNativeOwned03} from '../research/style-owned-live-03/three-owned-looks-native.mjs';

const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
const originalImage='data:image/jpeg;base64,'+original.toString('base64');
const sourceSHA=createHash('sha256').update(original).digest('hex');
const sha=b=>createHash('sha256').update(b).digest('hex');
const jpeg=b=>'data:image/jpeg;base64,'+b.toString('base64');
const meta=await sharp(original).metadata();
const cutoutBytes=await sharp(original).extract({
 left:0,top:0,width:Math.max(10,Math.floor(meta.width*.55)),
 height:Math.max(10,Math.floor(meta.height*.65))
}).jpeg({quality:88}).toBuffer();
assert.ok(cutoutBytes.length>1000,'a real public-license JPEG cutout is required');
const cutoutImage=jpeg(cutoutBytes),cutoutSHA=sha(cutoutBytes);
const tamperedBytes=await sharp(original).extract({
 left:Math.floor(meta.width*.12),top:Math.floor(meta.height*.12),
 width:Math.max(10,Math.floor(meta.width*.5)),
 height:Math.max(10,Math.floor(meta.height*.5))
}).jpeg({quality:79}).toBuffer();
assert.notEqual(sha(tamperedBytes),cutoutSHA);
const app=readFileSync('public/app.js','utf8');
const style=readFileSync('research/style-owned-live-03/native-style-panel.mjs','utf8');

const candidate=(ownerId,id='reviewed-individual-piece')=>({
 id,ownerId,image:originalImage,
 originalPhoto:{image:originalImage,sha256:sourceSHA},
 sourceSHA256:sourceSHA,sourceHashVerified:true,
 singleGarmentVerified:false,
 outfitSourceId:'human-reviewed-multiple-items-public-test-image',
 segmentHint:{
  verified:true,ownerReviewedInstance:true,clipped:false,
  originalSHA256:sourceSHA,cutoutSHA256:cutoutSHA,cutoutImage
 },
 category:'Uncategorized',itemType:'Unknown',color:'Unknown'
});
function dbOpen(ownerId){return new Promise((resolve,reject)=>{
 const q=indexedDB.open('closet-current-user-'+ownerId,2);
 q.onupgradeneeded=()=>{
  q.result.createObjectStore('items',{keyPath:'id'});
  q.result.createObjectStore('state',{keyPath:'id'});
 };
 q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
});}
async function write(db,table,row){return new Promise((resolve,reject)=>{
 const tx=db.transaction(table,'readwrite');
 tx.objectStore(table).put(row);
 tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
});}
async function read(db,table){return new Promise((resolve,reject)=>{
 const q=db.transaction(table,'readonly').objectStore(table).getAll();
 q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
});}
async function setup(callback){
 const ownerId='P124-'+randomUUID(),db=await dbOpen(ownerId),record=candidate(ownerId);
 await write(db,'state',{id:'draft',batch:[structuredClone(record),{
  id:'keep-other-unsaved-review',name:'Preserve this other draft'
 }]});
 const confirmation={
  confirmed:true,recordId:record.id,originalSHA256:sourceSHA,
  category:'Tops',itemType:'T-shirt',color:'Red',
  singleGarmentConfirmed:false,instanceConfirmed:true,cutoutSHA256:cutoutSHA
 };
 const admitted=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>ownerId,record,
  review:confirmation,cryptoProvider:webcrypto
 });
 assert.equal(admitted.saved,true,'P119 must independently hash BOTH JPEG byte arrays');
 const items=await read(db,'items');
 const row=items.find(x=>x.id===record.id);
 assert.ok(row);
 let active=true,generation=1;
 const board={
  readOnlyWardrobe:()=>({ownerId,generation,items:structuredClone(items),
   boardFingerprint:'P124-owner-source-snapshot',releaseAuthorized:false}),
  sessionLease:()=>({ownerId,generation}),
  status:()=>({active})
 };
 try{return await callback({db,ownerId,row,board,items,
  revoke(){active=false;generation++}});
 }finally{db.close();}
}
test('PHOTO124 actual P119 source+cutout hashes produce separate source-honest reviewed metadata',()=>setup(async e=>{
 assert.equal(e.row.sourceSHA256,sourceSHA);
 assert.equal(e.row.originalPhoto.image,originalImage);
 assert.equal(e.row.cutoutSHA256,cutoutSHA);
 assert.equal(e.row.segmentHint.cutoutImage,cutoutImage);
 assert.equal(e.row.ownerReviewed,true);
 assert.equal(e.row.singleGarmentVerified,false);
 assert.equal(reviewedVisiblePiece12(e.row),false,
  'new P119 cutouts must not masquerade as legacy crop protocol');
 assert.equal(reviewedSourceBoundCutout124(e.row),true);
 const [draft]=await read(e.db,'state');
 assert.deepEqual(draft.batch,[{id:'keep-other-unsaved-review',name:'Preserve this other draft'}]);
}));
test('PHOTO124 owner cutout is INELIGIBLE by default without explicit research flag; no false one-item original confirmation',()=>setup(async e=>{
 const no=await verifiedPrivateStyleRoster03(e.board,{subtle:webcrypto.subtle});
 assert.equal(no.items.length,0);
 assert.equal(no.pending.length,0,'multi-garment source must never be described as one original item');
 assert.equal(no.rejected.length,1);
 assert.equal(no.releaseAuthorized,false);
}));
test('PHOTO124 real original and actual second cutout JPEG digests admit only 2D photo for owner styles',()=>setup(async e=>{
 const roster=await verifiedPrivateStyleRoster03(e.board,{allowCutout124:true,subtle:webcrypto.subtle});
 assert.equal(roster.items.length,1);
 const item=roster.items[0];
 assert.equal(item.id,e.row.id);
 assert.equal(item.sourceSHA256,sourceSHA);
 assert.equal(item.genuinePhoto,cutoutImage,'only distinct reviewed crop may be displayed');
 assert.notEqual(item.genuinePhoto,originalImage,'never show an entire outfit as individual garment');
 assert.equal(item.sourceCutoutSHA256,cutoutSHA);
 assert.equal(item.cutoutSHA256Verified,true);
 assert.equal(item.visibleCropPhotoOnly,true);
 assert.equal(item.sourcePhotoFallbackRequired,true);
 assert.equal(item.threeDReady,false);
 assert.equal(item.releaseAuthorized,undefined);
 assert.equal(roster.releaseAuthorized,false);
 assert.equal(roster.pending.length,0);
 assert.equal(roster.rejected.length,0);
}));
test('PHOTO124 real cutout source can participate in 3 distinct pinned owner-owned looks without any invented 3D garment',()=>setup(async e=>{
 const verified=await verifiedPrivateStyleRoster03(e.board,{allowCutout124:true,subtle:webcrypto.subtle});
 const roster=[...verified.items,...[
  ['pants-blue','Bottoms','Jeans','Blue'],
  ['pants-black','Bottoms','Trousers','Black'],
  ['sneaker-white','Shoes','Sneakers','White'],
  ['sneaker-black','Shoes','Sneakers','Black']
 ].map(([id,category,itemType,color])=>({
  id,ownerId:e.ownerId,category,itemType,color,
  sourceVerified:true,categoryConfirmed:true,sourceSHA256:sourceSHA
 }))];
 const looks=suggestThreeNativeOwned03(roster,{ownerId:e.ownerId,pinnedId:e.row.id});
 assert.equal(looks.combinations.length,3);
 assert.equal(new Set(looks.combinations.map(x=>x.signature)).size,3);
 for(const x of looks.combinations){
  assert.equal(x.slots.top,e.row.id);
  assert.equal(x.sourceSHA256ById[e.row.id],sourceSHA);
  assert.equal(x.certified3D,false);
 }
 assert.equal((await read(e.db,'items')).length,1,'generating looks never writes more garments');
}));
test('PHOTO124 tampered valid JPEG cutout bytes are rejected by independent SHA-256, not image marker check only',()=>setup(async e=>{
 const bad=structuredClone(e.row);
 bad.segmentHint.cutoutImage=jpeg(tamperedBytes);
 e.items[0]=bad;
 assert.equal(reviewedSourceBoundCutout124(bad),true,'metadata could lie, digest must reject');
 const check=await verifiedPrivateStyleRoster03(e.board,{allowCutout124:true,subtle:webcrypto.subtle});
 assert.equal(check.items.length,0);
 assert.equal(check.pending.length,0);
 assert.equal(check.rejected.length,1);
 assert.match(check.rejected[0].reason,/SHA-256/);
}));
test('PHOTO124 malformed or missing cutout review fields reject without inviting false single-garment review',()=>setup(async e=>{
 for(const mutate of [
  r=>{r.segmentHint.ownerReviewedInstance=false;},
  r=>{r.segmentHint.clipped=true;},
  r=>{r.cutoutSHA256='0'.repeat(64);},
  r=>{r.segmentHint.cutoutSHA256='1'.repeat(64);},
  r=>{r.segmentHint.originalSHA256='2'.repeat(64);},
  r=>{r.segmentHint.cutoutImage=r.originalPhoto.image;},
  r=>{r.originalPhoto.sha256='3'.repeat(64);},
  r=>{r.confirmedColor=false;},
  r=>{r.color='Unknown';},
  r=>{r.ownerReviewed=false;},
  r=>{r.multipleGarments=true;}
 ]){
  const bad=structuredClone(e.row);mutate(bad);e.items[0]=bad;
  assert.equal(reviewedSourceBoundCutout124(bad),false,mutate.toString());
  const v=await verifiedPrivateStyleRoster03(e.board,{allowCutout124:true,subtle:webcrypto.subtle});
  assert.equal(v.items.length,0,mutate.toString());
  assert.equal(v.pending.length,0,mutate.toString());
 }
}));
test('PHOTO124 owner/sign-out rotation while secondary SHA digest pending fails closed',()=>setup(async e=>{
 let call=0,release,started;
 const start=new Promise(r=>{started=r;});
 const digest={digest:async(algorithm,bytes)=>{
  call++;
  if(call===2){
   started();
   await new Promise(r=>{release=r;});
  }
  return webcrypto.subtle.digest(algorithm,bytes);
 }};
 const pending=verifiedPrivateStyleRoster03(e.board,{allowCutout124:true,subtle:digest});
 await start;
 e.revoke();
 release();
 await assert.rejects(pending,/STYLE03 authentication revoked during source verification|STYLE03 wardrobe\/owner changed|STYLE03 owner changed|STYLE03 signed-in owner changed/);
}));
test('PHOTO124 one owner cannot read a second owner cutout even with spoofed review metadata',()=>setup(async e=>{
 const foreign={...e.row,id:'foreign',ownerId:'a-different-owner'};
 e.items.push(foreign);
 await assert.rejects(verifiedPrivateStyleRoster03(e.board,{
  allowCutout124:true,subtle:webcrypto.subtle
 }),/STYLE03 private wardrobe ID or account mismatch/);
}));
test('PHOTO124 source checks and screenshot labels never claim a learned mask or an approved 3D garment',()=>{
 for(const fragment of [
  'reviewedSourceBoundCutout124(row)',
  'strictJPEGBytes01(row.segmentHint.cutoutImage)',
  "subtle.digest('SHA-256',cutoutBytes)",
  "actual!==row.cutoutSHA256||actual!==row.segmentHint.cutoutSHA256",
  "cutoutSHA256Verified=true",
  'threeDReady:cropped||cutoutSHA256Verified?false:row.threeDReady',
  'sourcePhotoFallbackRequired:cropped||cutoutSHA256Verified||row.photoOnly===true',
  "new URLSearchParams(win.location.search).get('reviewedCutout124')==='research'",
  'await verifiedPrivateStyleRoster03(board,{singleItemReviews,allowCutout124})'
 ])assert.ok(style.includes(fragment),fragment);
 for(const fragment of [
  "const reviewedCutout124Active=reviewedCloset123Active&&",
  "get('reviewedCutout124')==='research';",
  "reviewedStored123=isReviewedSource123",
  "if(reviewedCutoutStored124){",
  "im.src=item.segmentHint.cutoutImage",
  'Owner-reviewed visible cutout · 2D photo only',
  'cutout124:reviewedCutoutStored124',
  'persisted.segmentHint.cutoutImage'
 ])assert.ok(app.includes(fragment),fragment);
 assert.ok(app.includes('get 3 outfits')||app.includes('Get 3 outfits'));
});
