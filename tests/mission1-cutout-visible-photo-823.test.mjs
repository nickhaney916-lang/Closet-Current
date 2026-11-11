import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119 as researchWriter} from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {commitHumanReviewedPhoto119 as nativeWriter} from '../public/native-reviewed-private-save-167.mjs';

const original=readFileSync('benchmark/fixtures/commons-0053.jpg');
const image=bytes=>'data:image/jpeg;base64,'+bytes.toString('base64');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=image(original),sourceSHA=sha(original);
const cutoutA=Buffer.from([255,216,1,2,3,4,255,217]);
const cutoutB=Buffer.from([255,216,11,12,13,14,255,217]);
function open(owner){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+owner,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
function put(db,store,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(row);
  tx.oncomplete=resolve;
  tx.onabort=()=>reject(tx.error);
  tx.onerror=()=>reject(tx.error);
 });
}
function snapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  let saved,draft;
  tx.objectStore('items').getAll().onsuccess=e=>saved=e.target.result;
  tx.objectStore('state').get('draft').onsuccess=e=>draft=e.target.result;
  tx.oncomplete=()=>resolve({saved,draft});
  tx.onabort=()=>reject(tx.error);
 });
}
async function withOwner(write,visible,expectedSaved){
 const ownerId='source-owner-'+randomUUID(),db=await open(ownerId);
 const record={id:'owner-cutout-1',ownerId,
  image:visible==='original'?source:image(visible==='match'?cutoutA:cutoutB),
  sourceSHA256:sourceSHA,sourceHashVerified:true,
  originalPhoto:{image:source,sha256:sourceSHA},
  outfitSourceId:'original-outfit',
  category:'Uncategorized',itemType:'Unknown',color:'',
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:sourceSHA,cutoutSHA256:sha(cutoutA),cutoutImage:image(cutoutA)}
 };
 const review={confirmed:true,recordId:record.id,originalSHA256:sourceSHA,
  category:'Bottoms',itemType:'Jeans',color:'Blue',
  singleGarmentConfirmed:false,instanceConfirmed:true,cutoutSHA256:sha(cutoutA)};
 const draft={id:'draft',batch:[structuredClone(record)],
  futureOwnerMetadata:{keep:true}};
 await put(db,'state',draft);
 try{
  const response=await write({db,ownerId,currentOwner:()=>ownerId,
   record,review,cryptoProvider:webcrypto,assertLease:()=>true});
  assert.equal(response.saved,expectedSaved);
  assert.equal(response.familyAlpha,'HOLD');
  const after=await snapshot(db);
  assert.equal(after.saved.length,expectedSaved?1:0);
  assert.equal(after.draft.batch.length,expectedSaved?0:1);
  assert.deepEqual(after.draft.futureOwnerMetadata,{keep:true});
  if(expectedSaved){
   assert.equal(response.sourceKind,'human-reviewed-source-bound-cutout');
   assert.equal(after.saved[0].image,record.image);
   assert.equal(after.saved[0].segmentHint.cutoutImage,image(cutoutA));
   assert.equal(after.saved[0].originalPhoto.image,source);
   assert.equal(after.saved[0].cutoutSHA256,sha(cutoutA));
  }else{
   assert.equal(response.sourceKind,'cutout-source-unverified');
   assert.equal(after.draft.batch[0].image,record.image,
    'failed source identity admission keeps the exact private unsaved crop');
  }
 }finally{db.close();}
}

for(const [label,writer] of [['research PHOTO119',researchWriter],
 ['bundled native P167',nativeWriter]]){
 test('P823 '+label+': changed visible crop cannot reuse verified SHA for an older cutout',async()=>{
  await withOwner(writer,'mismatch',false);
 });
 test('P823 '+label+': a visible photo identical to the verified cutout is accepted after owner review',async()=>{
  await withOwner(writer,'match',true);
 });
 test('P823 '+label+': full-original preview still permits separately verified owner-reviewed cutout',async()=>{
  await withOwner(writer,'original',true);
 });
}
