import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119}
 from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {sourceReviewUnchanged125,verifiedPrivateStyleRoster03,reviewedSourceBoundCutout124}
 from '../research/style-owned-live-03/native-style-panel.mjs';

const b=readFileSync('benchmark/fixtures/commons-0002.jpg');
const sourceImage='data:image/jpeg;base64,'+b.toString('base64');
const sha=x=>createHash('sha256').update(x).digest('hex');
const sourceSHA=sha(b);
const meta=await sharp(b).metadata();
const crop=await sharp(b).extract({
 left:0,top:0,width:Math.max(10,Math.floor(meta.width*.55)),
 height:Math.max(10,Math.floor(meta.height*.65))
}).jpeg({quality:88}).toBuffer();
const cropImage='data:image/jpeg;base64,'+crop.toString('base64');
const cropSHA=sha(crop);

async function scenario(run){
 const ownerId='PHOTO125-'+randomUUID();
 const request=indexedDB.open('closet-current-user-'+ownerId,2);
 const db=await new Promise((resolve,reject)=>{
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('items',{keyPath:'id'});
   request.result.createObjectStore('state',{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
 const source={id:'p125-reviewed-cutout',ownerId,
  image:sourceImage,originalPhoto:{image:sourceImage,sha256:sourceSHA},
  sourceSHA256:sourceSHA,sourceHashVerified:true,singleGarmentVerified:false,
  outfitSourceId:'owner-claimed-group-image',
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:sourceSHA,cutoutSHA256:cropSHA,cutoutImage:cropImage},
  category:'Uncategorized',itemType:'Unknown',color:'Unknown'};
 // PHOTO119 must atomically remove the reviewed source from the owner's
 // previously captured private draft. A guessed unsaved row is not enough.
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite');
  tx.objectStore('state').put({id:'draft',batch:[structuredClone(source)]});
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
 });
 const saved=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>ownerId,record:source,
  review:{confirmed:true,recordId:source.id,originalSHA256:sourceSHA,
   category:'Tops',itemType:'T-shirt',color:'Red',
   singleGarmentConfirmed:false,instanceConfirmed:true,cutoutSHA256:cropSHA},
  cryptoProvider:webcrypto
 });
 assert.equal(saved.saved,true);
 const rows=await new Promise((resolve,reject)=>{
  const q=db.transaction('items','readonly').objectStore('items').getAll();
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 });
 assert.equal(rows.length,1);
 let generation=1,active=true,reads=0;
 const board={
  readOnlyWardrobe:()=>{
   reads++;
   return {ownerId,generation,items:structuredClone(rows),
    boardFingerprint:'SAME-FINGERPRINT-DESPITE-REVIEW-EDIT'};
  },
  sessionLease:()=>({ownerId,generation}),
  status:()=>({active})
 };
 try{return await run({ownerId,row:rows[0],rows,board,
  get reads(){return reads;},
  revoke(){generation++;active=false;}});}
 finally{db.close();}
}

test('PHOTO125 direct lease predicate rejects altered review, color, source, cutout, and category evidence',()=>scenario(async e=>{
 assert.ok(reviewedSourceBoundCutout124(e.row));
 assert.equal(sourceReviewUnchanged125(e.row,structuredClone(e.row)),true);
 const bad=[
  r=>{r.color='Blue';},
  r=>{r.colorSource='model';},
  r=>{r.confirmedColor=false;},
  r=>{r.confirmedCategory=false;},
  r=>{r.ownerReviewed=false;},
  r=>{r.humanReviewedSource=false;},
  r=>{r.userAdjusted=false;},
  r=>{r.reviewProvenance='untrusted';},
  r=>{r.sourceHashVerified=false;},
  r=>{r.image=r.segmentHint.cutoutImage;},
  r=>{r.segmentHint.ownerReviewedInstance=false;},
  r=>{r.segmentHint.clipped=true;},
  r=>{r.segmentHint.cutoutImage='data:image/jpeg;base64,AA==';},
  r=>{r.originalPhoto.image='data:image/jpeg;base64,AA==';},
  r=>{r.singleGarmentVerified=true;},
  r=>{r.multipleGarments=true;},
  r=>{r.sourcePhotoOriginal=false;},
  r=>{r.threeDReady=true;},
  r=>{r.requiresOwnershipConfirmation=true;},
  r=>{r.possibleDuplicate=true;},
  r=>{r.ownerId='other-owner';},
  r=>{r.category='Bottoms';},
  r=>{r.itemType='Jeans';}
 ];
 for(const mutate of bad){
  const row=structuredClone(e.row);mutate(row);
  assert.equal(sourceReviewUnchanged125(e.row,row),false,mutate.toString());
 }
}));

test('PHOTO125 intact reviewed bytes and unchanged owner lease remain eligible 2D only',()=>scenario(async e=>{
 const v=await verifiedPrivateStyleRoster03(e.board,{allowCutout124:true,subtle:webcrypto.subtle});
 assert.equal(v.items.length,1);
 assert.equal(v.rejected.length,0);
 assert.equal(v.items[0].genuinePhoto,cropImage);
 assert.equal(v.items[0].sourceCutoutSHA256,cropSHA);
 assert.equal(v.items[0].threeDReady,false);
 assert.equal(v.releaseAuthorized,false);
 assert.equal(e.reads,2);
}));

test('PHOTO125 changed color while second snapshot is read fails closed even if fingerprint never changes',()=>scenario(async e=>{
 const get=e.board.readOnlyWardrobe;
 e.board.readOnlyWardrobe=()=>{
  const snap=get();
  if(e.reads===2){snap.items[0].color='Blue';}
  return snap;
 };
 await assert.rejects(verifiedPrivateStyleRoster03(e.board,{
  allowCutout124:true,subtle:webcrypto.subtle
 }),/STYLE03 wardrobe photo or category changed during verification/);
}));

test('PHOTO125 revoked human review during final snapshot cannot reuse already hashed cutout',()=>scenario(async e=>{
 for(const mutate of [
  r=>{r.ownerReviewed=false;},
  r=>{r.confirmedColor=false;},
  r=>{r.segmentHint.ownerReviewedInstance=false;},
  r=>{r.sourceHashVerified=false;},
  r=>{r.image=r.segmentHint.cutoutImage;}
 ]){
  const get=e.board.readOnlyWardrobe;
  let seen=0;
  e.board.readOnlyWardrobe=()=>{
   const snap=get();
   if(++seen===2)mutate(snap.items[0]);
   return snap;
  };
  try{
   await assert.rejects(verifiedPrivateStyleRoster03(e.board,{
    allowCutout124:true,subtle:webcrypto.subtle
   }),/STYLE03 wardrobe photo or category changed during verification/,mutate.toString());
  }finally{e.board.readOnlyWardrobe=get;}
 }
}));

test('PHOTO125 sign-out triggered during final wardrobe read must not authorize old owner',()=>scenario(async e=>{
 const get=e.board.readOnlyWardrobe;
 e.board.readOnlyWardrobe=()=>{
  const snap=get();
  if(e.reads===2)e.revoke();
  return snap;
 };
 await assert.rejects(verifiedPrivateStyleRoster03(e.board,{
  allowCutout124:true,subtle:webcrypto.subtle
 }),/STYLE03 authentication\/owner changed at final review lease/);
}));

test('PHOTO125 proof is scoped to research-only source logic, not release authorization',()=>{
 const code=readFileSync('research/style-owned-live-03/native-style-panel.mjs','utf8');
 for(const required of [
  'export function sourceReviewUnchanged125(initial,current)',
  'sourceReviewUnchanged125(initialById.get(item.id),fresh)',
  'const finalLease=board.sessionLease()',
  "throw Error('STYLE03 authentication/owner changed at final review lease')",
  'reviewedSourceBoundCutout124',
  'cutoutSHA256Verified=true',
  'threeDReady:cropped||cutoutSHA256Verified?false:row.threeDReady',
  'releaseAuthorized:false'
 ])assert.ok(code.includes(required),required);
});
