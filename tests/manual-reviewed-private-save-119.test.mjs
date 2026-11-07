import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';

const originalBytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const sourceJPEG='data:image/jpeg;base64,'+originalBytes.toString('base64');
const SHA=createHash('sha256').update(originalBytes).digest('hex');
const cutoutOne=Buffer.from([255,216,10,20,30,40,255,217]);
const cutoutTwo=Buffer.from([255,216,11,21,31,41,255,217]);
const hex=b=>createHash('sha256').update(b).digest('hex');
const cutimg=b=>'data:image/jpeg;base64,'+b.toString('base64');
const other=()=>({id:'keep-this-dress',name:'Never drop existing draft',
  category:'Dresses',itemType:'Casual dress',color:'Pink'});
const piece=(ownerId,id='capture-1')=>({
 id,ownerId,image:sourceJPEG,
 originalPhoto:{image:sourceJPEG,sha256:SHA},
 sourceSHA256:SHA,sourceHashVerified:true,
 category:'Uncategorized',itemType:'Unknown',
 color:'Unknown',singleGarmentVerified:false
});
const review=(record,color='Blue',more={})=>({
 confirmed:true,recordId:record.id,originalSHA256:SHA,
 category:'Bottoms',itemType:'Jeans',color,
 singleGarmentConfirmed:true,...more
});
function open(ownerId){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+ownerId,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error);
 });
}
async function put(db,store,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(value);
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
 });
}
async function snapshot(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readonly');
  let items,draft;
  tx.objectStore('items').getAll().onsuccess=e=>items=e.target.result;
  tx.objectStore('state').get('draft').onsuccess=e=>draft=e.target.result;
  tx.oncomplete=()=>resolve({items,draft});tx.onabort=()=>reject(tx.error);
 });
}
async function env(fn,options={}){
 const ownerId='owner-'+randomUUID();
 const db=await open(ownerId),record=piece(ownerId);
 let current=ownerId;
 const more=other();
 const draft={id:'draft',batch:[structuredClone(record),more],
  unknownFuture:{keep:true},lastSourceDraftVersion:7};
 await put(db,'state',draft);
 const e={ownerId,db,record,more,
  review:review(record),
  owner:()=>current,setOwner:v=>{current=v;},
  args(){return {db,ownerId,currentOwner:()=>current,record,review:e.review,
   cryptoProvider:webcrypto};},
  async replaceDraft(){const d=(await snapshot(db)).draft;d.batch[0]=structuredClone(record);await put(db,'state',d);}
 };
 try{return await fn(e);}finally{db.close();}
}
function cutout(e,bytes=cutoutOne){
 const h=hex(bytes);
 e.record.outfitSourceId='whole-outfit-photo';
 e.record.segmentHint={
  verified:true,ownerReviewedInstance:true,clipped:false,
  originalSHA256:SHA,cutoutSHA256:h,cutoutImage:cutimg(bytes)
 };
 e.review={
  ...e.review,singleGarmentConfirmed:false,instanceConfirmed:true,
  cutoutSHA256:h,category:'Bottoms',itemType:'Skirt',color:'Cream'
 };
}
const holdDigest=()=>{
 let unblock;
 const provider={subtle:{digest:()=>new Promise(resolve=>{
  unblock=()=>webcrypto.subtle.digest('SHA-256',originalBytes).then(resolve);
 })}};
 return {provider,
  async awaitHash(){
   for(let i=0;i<120&&!unblock;i++)await new Promise(ok=>setImmediate(ok));
   assert.equal(typeof unblock,'function');
  },
  release(){return unblock();}
 };
};
test('PHOTO119 genuinely hashed original JPEG human-corrected jeans color saved with one atomic real IndexedDB transaction',()=>env(async e=>{
 const response=await commitHumanReviewedPhoto119(e.args());
 assert.equal(response.saved,true);
 assert.equal(response.sourceKind,'human-reviewed-original-single');
 assert.equal(response.familyAlpha,'HOLD');
 assert.equal(response.independentPhotoAccuracyProven,false);
 assert.equal(response.productionAppIntegrated,false);
 assert.equal(Object.isFrozen(response),true);
 const state=await snapshot(e.db);
 assert.equal(state.items.length,1);
 assert.equal(state.items[0].category,'Bottoms');
 assert.equal(state.items[0].itemType,'Jeans');
 assert.equal(state.items[0].color,'Blue');
 assert.equal(state.items[0].colorSource,'user');
 assert.equal(state.items[0].userAdjusted,true);
 assert.equal(state.items[0].ownerReviewed,true);
 assert.equal(state.items[0].sourceSHA256,SHA);
 assert.equal(state.items[0].originalPhoto.image,sourceJPEG);
 assert.equal(state.items[0].image,sourceJPEG);
 assert.equal(state.items[0].reviewProvenance,'explicit-owner-claim-not-independent-review-evidence');
 assert.equal(state.draft.batch.length,1);
 assert.deepEqual(state.draft.batch[0],e.more);
 assert.deepEqual(state.draft.unknownFuture,{keep:true});
 assert.equal(state.draft.lastSourceDraftVersion,7);
 const text=JSON.stringify(response);
 for(const privateValue of [e.ownerId,sourceJPEG,SHA,'capture-1'])assert.equal(text.includes(privateValue),false);
}));
test('PHOTO119 category/subtype and user color corrections win over unreviewed source metadata',()=>env(async e=>{
 e.review={...e.review,category:'Bottoms',itemType:'Skirt',color:'Navy'};
 const r=await commitHumanReviewedPhoto119(e.args());
 assert.equal(r.saved,true);
 const x=(await snapshot(e.db)).items[0];
 assert.equal(x.category,'Bottoms');assert.equal(x.itemType,'Skirt');
 assert.equal(x.color,'Navy');assert.equal(x.confirmedCategory,true);
 assert.equal(x.confirmedColor,true);assert.equal(x.indexingLevel,'human-reviewed-specific-type');
}));
test('PHOTO119 incomplete review/category-color mismatches never save automatically',()=>env(async e=>{
 const variants=[
  r=>{r.confirmed=false;},r=>{r.recordId='other';},
  r=>{r.originalSHA256='f'.repeat(64);},
  r=>{r.category='Dresses';r.itemType='Jeans';},
  r=>{r.category='Shoes';r.itemType='Unknown';},
  r=>{r.color='Unknown';},r=>{r.color='Blue  ';},
  r=>{r.color='<script>';},r=>{r.color='a'.repeat(49);},
  r=>{r.singleGarmentConfirmed=false;},
  r=>{r.instanceConfirmed=true;}
 ];
 for(const mutate of variants){
  const next=structuredClone(e.review);mutate(next);e.review=next;
  const result=await commitHumanReviewedPhoto119(e.args());
  assert.equal(result.saved,false,mutate.toString());
  assert.equal(result.status,'review-required');
  assert.equal((await snapshot(e.db)).items.length,0);
 }
}));
test('PHOTO119 inaccurate original-photo SHA or marker never becomes a wardrobe item',()=>env(async e=>{
 for(const change of [
  ()=>{e.record.sourceSHA256='0'.repeat(64);e.record.originalPhoto.sha256='0'.repeat(64);e.review.originalSHA256='0'.repeat(64);},
  ()=>{e.record.originalPhoto.image='data:image/jpeg;base64,SGVsbG8=';}
 ]){
  const old=structuredClone(e.record),rv=structuredClone(e.review);
  change();await e.replaceDraft();
  const r=await commitHumanReviewedPhoto119(e.args());
  assert.equal(r.saved,false);
  assert.equal((await snapshot(e.db)).items.length,0);
  Object.assign(e.record,old);e.review=rv;await e.replaceDraft();
 }
}));
test('PHOTO119 owner-reviewed SHA-proven independent cutout may be saved without claiming learned mask accuracy',()=>env(async e=>{
 cutout(e);await e.replaceDraft();
 const r=await commitHumanReviewedPhoto119(e.args());
 assert.equal(r.saved,true);
 assert.equal(r.sourceKind,'human-reviewed-source-bound-cutout');
 const row=(await snapshot(e.db)).items[0];
 assert.equal(row.category,'Bottoms');assert.equal(row.itemType,'Skirt');
 assert.equal(row.color,'Cream');assert.equal(row.singleGarmentVerified,false);
 assert.equal(row.cutoutSHA256,hex(cutoutOne));
 assert.equal(row.segmentHint.cutoutImage,cutimg(cutoutOne));
 assert.equal(row.originalPhoto.image,sourceJPEG);
}));
test('PHOTO119 no cutout byte proof, false review or clipped segment means no automatic save',()=>env(async e=>{
 const cases=[
  ({record})=>delete record.segmentHint.cutoutImage,
  ({record})=>{record.segmentHint.cutoutSHA256='0'.repeat(64);},
  ({record})=>{record.segmentHint.ownerReviewedInstance=false;},
  ({record})=>{record.segmentHint.clipped=true;},
  ({review})=>{review.instanceConfirmed=false;},
  ({review})=>{review.cutoutSHA256='1'.repeat(64);},
  ({record})=>{record.segmentHint.cutoutImage=sourceJPEG;
    record.segmentHint.cutoutSHA256=SHA;},
  ({record})=>{record.segmentHint.originalSHA256='2'.repeat(64);},
 ];
 for(const mutate of cases){
  cutout(e);
  mutate(e);
  await e.replaceDraft();
  const result=await commitHumanReviewedPhoto119(e.args());
  assert.equal(result.saved,false,mutate.toString());
  assert.equal((await snapshot(e.db)).items.length,0);
 }
}));
test('PHOTO119 distinct source-bound cutouts same original remain separate, identical cutouts are rejected',()=>env(async e=>{
 cutout(e,cutoutOne);await e.replaceDraft();
 assert.equal((await commitHumanReviewedPhoto119(e.args())).saved,true);
 const second=piece(e.ownerId,'capture-2');
 const originalReview=e.review;
 Object.assign(e.record,second);
 cutout(e,cutoutTwo);
 e.review.recordId=e.record.id;
 const d=(await snapshot(e.db)).draft;
 d.batch.unshift(structuredClone(e.record));
 await put(e.db,'state',d);
 const saved=await commitHumanReviewedPhoto119(e.args());
 assert.equal(saved.saved,true);
 const now=await snapshot(e.db);assert.equal(now.items.length,2);
 assert.notEqual(now.items[0].cutoutSHA256,now.items[1].cutoutSHA256);
 const third=piece(e.ownerId,'capture-3');
 Object.assign(e.record,third);cutout(e,cutoutOne);
 e.review.recordId=e.record.id;
 const d2=(await snapshot(e.db)).draft;
 d2.batch.unshift(structuredClone(e.record));
 await put(e.db,'state',d2);
 await assert.rejects(commitHumanReviewedPhoto119(e.args()),/PHOTO119 reviewed source, owner or draft commit rejected/);
 assert.equal((await snapshot(e.db)).items.length,2);
 assert.equal((await snapshot(e.db)).draft.batch.length,2);
}));
test('PHOTO119 exact same verified original photograph cannot be saved twice after user re-review',()=>env(async e=>{
 assert.equal((await commitHumanReviewedPhoto119(e.args())).saved,true);
 const second=piece(e.ownerId,'another-id');
 Object.assign(e.record,second);e.review=review(e.record);
 const d=(await snapshot(e.db)).draft;d.batch.unshift(structuredClone(e.record));await put(e.db,'state',d);
 await assert.rejects(commitHumanReviewedPhoto119(e.args()),/PHOTO119 reviewed source, owner or draft commit rejected/);
 assert.equal((await snapshot(e.db)).items.length,1);
}));
test('PHOTO119 concurrently submitted owner confirmations commit at most one garment',()=>env(async e=>{
 const result=await Promise.allSettled([
  commitHumanReviewedPhoto119(e.args()),
  commitHumanReviewedPhoto119(e.args())
 ]);
 const now=await snapshot(e.db);
 assert.equal(now.items.length,1);
 assert.equal(now.draft.batch.length,1);
 assert.equal(result.filter(x=>x.status==='fulfilled'&&x.value.saved).length,1);
 assert.equal(result.filter(x=>x.status==='rejected').length,1);
}));
test('PHOTO119 changing owner or corrected review while source hashing rejects without writes',()=>env(async e=>{
 const h=holdDigest();
 const pending=commitHumanReviewedPhoto119({...e.args(),cryptoProvider:h.provider});
 await h.awaitHash();e.setOwner('other-owner');await h.release();
 await assert.rejects(pending,/PHOTO119 live signed-owner|PHOTO119/);
 assert.equal((await snapshot(e.db)).items.length,0);
}));
test('PHOTO119 corrected category mutation mid-SHA fails closed and preserves saved draft',()=>env(async e=>{
 const h=holdDigest(),pending=commitHumanReviewedPhoto119({...e.args(),cryptoProvider:h.provider});
 await h.awaitHash();e.review.itemType='Skirt';await h.release();
 await assert.rejects(pending,/PHOTO119 photograph, category, subtype or reviewed color changed/);
 assert.equal((await snapshot(e.db)).items.length,0);
 assert.equal((await snapshot(e.db)).draft.batch.length,2);
}));
test('PHOTO119 saved wardrobe changes mid-SHA => reject stale owner snapshot without deleting other garments',()=>env(async e=>{
 const h=holdDigest(),pending=commitHumanReviewedPhoto119({...e.args(),cryptoProvider:h.provider});
 await h.awaitHash();
 const saved={id:'another-source',ownerId:e.ownerId,category:'Shoes',
  itemType:'Sneakers',color:'White'};
 await put(e.db,'items',saved);await h.release();
 await assert.rejects(pending,/PHOTO119 reviewed source, owner or draft commit rejected/);
 assert.deepEqual((await snapshot(e.db)).items,[saved]);
}));
test('PHOTO119 unsaved other garment edit during SHA is never overwritten by stale draft',()=>env(async e=>{
 const h=holdDigest(),pending=commitHumanReviewedPhoto119({...e.args(),cryptoProvider:h.provider});
 await h.awaitHash();
 const d=(await snapshot(e.db)).draft;d.batch[1].name='Updated by another edit';
 await put(e.db,'state',d);await h.release();
 await assert.rejects(pending,/PHOTO119 reviewed source, owner or draft commit rejected/);
 assert.equal((await snapshot(e.db)).draft.batch[1].name,'Updated by another edit');
 assert.equal((await snapshot(e.db)).items.length,0);
}));
test('PHOTO119 late lease revoke after queued add and before draft commit ABORTS both stores',()=>env(async e=>{
 let calls=0;
 await assert.rejects(commitHumanReviewedPhoto119({
  ...e.args(),assertLease:()=>++calls<6
 }),/PHOTO119 reviewed source, owner or draft commit rejected/);
 const after=await snapshot(e.db);
 assert.equal(after.items.length,0);
 assert.equal(after.draft.batch.length,2);
 assert.ok(calls>=6);
}));
test('PHOTO119 foreign owner or wrong database cannot access another user contents',()=>env(async e=>{
 await assert.rejects(commitHumanReviewedPhoto119({
  ...e.args(),ownerId:'owner-other',currentOwner:()=> 'owner-other'
 }),/PHOTO119 live signed-owner/);
 const foreign={id:'foreign-private-item',ownerId:'owner-B',category:'Shoes',
  itemType:'Sneakers',color:'Black'};
 await put(e.db,'items',foreign);
 await assert.rejects(commitHumanReviewedPhoto119(e.args()),/cross-owner-record/);
 assert.deepEqual((await snapshot(e.db)).items,[foreign]);
}));
test('PHOTO119 deleted draft or changed original photo while editing cannot be resaved',()=>env(async e=>{
 const d=(await snapshot(e.db)).draft;
 d.batch[0].originalPhoto.sha256='f'.repeat(64);await put(e.db,'state',d);
 await assert.rejects(commitHumanReviewedPhoto119(e.args()),/source JPEG or cutout identity differs/);
 assert.equal((await snapshot(e.db)).items.length,0);
}));
test('PHOTO119 explicit review only; no untrusted classifier, personal photo transmission, default app or cloud',()=>{
 const s=readFileSync('research/manual-reviewed-private-save-119/reviewed-source-commit.mjs','utf8');
 for(const word of [
  'verifyOriginalSourceBytes',
  "const stores=['items','state',...(db.objectStoreNames.contains('wardrobeIndex')?['wardrobeIndex']:[]),...(db.objectStoreNames.contains('wardrobeThumbs')?['wardrobeThumbs']:[])]",
  "tx.objectStore('items').add(value)",
  "tx.objectStore('state').put({...draft,batch:remaining})",
  "ownerReviewed:true,sourcePhotoOriginal:true",
  'previewOwnerWardrobeAddition',
  'draftSourceMatches(draft,record,ownerId)'
 ])assert.ok(s.includes(word),word);
 assert.doesNotMatch(s,/fetch\s*\(|XMLHttpRequest|localStorage|sendBeacon|supabase|cloudSync|navigator\.serviceWorker/);
});
