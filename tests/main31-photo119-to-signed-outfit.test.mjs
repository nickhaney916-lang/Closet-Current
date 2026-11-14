import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {createNativeCatalogCrosswalk} from '../research/p87-catalog-crosswalk/crosswalk.mjs';
import {preflightOwnedOutfit1054} from '../research/main-thread-integration-1054/source-to-outfit.mjs';

// Real, legally licensed public test photograph; no owner photos or hosted data.
const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const image='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
const engine={URL,encodeURIComponent};
vm.createContext(engine);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),engine);
const cleanBoard=(board,rows)=>engine.cleanOutfitBoard(board,rows);
const fieldReceipt='PHOTO119-explicit-owner-confirmation';
const photoReview='explicit-owner-claim-not-independent-review-evidence';

function open(ownerId){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('closet-current-user-'+ownerId,2);
  req.onupgradeneeded=()=>{
   req.result.createObjectStore('items',{keyPath:'id'});
   req.result.createObjectStore('state',{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function put(db,store,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(value);
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(tx.error);
 });
}
async function allRows(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readonly');
  const request=tx.objectStore('items').getAll();
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function withNativeSource(fn){
 const ownerId='m31-'+randomUUID();
 const db=await open(ownerId),id='saved-1';
 const record={id,ownerId,category:'Uncategorized',itemType:'Unknown',color:'Unknown',
  sourceSHA256:sha,sourceHashVerified:true,image,
  originalPhoto:{image,sha256:sha},singleGarmentVerified:false};
 const review={confirmed:true,recordId:id,originalSHA256:sha,
  category:'Bottoms',itemType:'Jeans',color:'Blue',singleGarmentConfirmed:true};
 await put(db,'state',{id:'draft',batch:[structuredClone(record)]});
 let revision=1;
 let authRef={user:{id:ownerId},assertCurrent(){}};
 let session={authenticated:true,ownerId,epoch:3,operationEpoch:7,
  authRef,privateDbRef:db,privateDbName:db.name};
 const getSession=()=>({...session});
 const getRevision=()=>revision;
 const readOwnerItems=async scope=>{
  scope?.assertCurrent?.();
  const rows=await allRows(scope?.privateDbRef??db);
  scope?.assertCurrent?.();
  return rows;
 };
 const api=createNativeCatalogCrosswalk({getSession,getRevision,readOwnerItems,cryptoProvider:webcrypto});
 const commit=()=>commitHumanReviewedPhoto119({db,ownerId,currentOwner:()=>session.authenticated?session.ownerId:null,record,
  review,cryptoProvider:webcrypto,assertLease:()=>session.authenticated&&session.authRef===authRef});
 try{return await fn({db,id,ownerId,record,review,getSession,readOwnerItems,api,commit,
  nextRevision(){revision++;},
  replaceAuth(){authRef={user:{id:ownerId},assertCurrent(){}};session={...session,authRef};},
  logout(){session={...session,authenticated:false};}
 });}finally{db.close();}
}

test('M31 actual PHOTO119 app source commits confirmed fields atomically and authentic signed outfit 2D chain succeeds',()=>withNativeSource(async e=>{
 const result=await e.commit();
 assert.equal(result.saved,true);
 const rows=await allRows(e.db),row=rows[0];
 assert.equal(rows.length,1);
 assert.deepEqual(row.confirmedDetails,{category:'Bottoms',itemType:'Jeans',color:'Blue'});
 assert.deepEqual(row.confirmedDetailsSource31,{ownerId:e.ownerId,itemId:e.id,
  sourceSHA256:sha,basis:fieldReceipt});
 assert.equal(row.reviewProvenance,photoReview);
 assert.equal(row.originalPhoto.image,image);
 assert.equal(row.image,image);
 const matching=await e.api.query({category:'Bottoms',itemType:'Jeans',slot:'bottom',color:'blue'});
 assert.deepEqual(matching.ids,[e.id]);
 const board={name:'Source-verified owner outfit',slots:{bottom:e.id}};
 assert.deepEqual((await e.api.board(board)).slots,{bottom:e.id});
 const item=await e.api.item(e.id);
 assert.equal(item.fallback.image,image);
 assert.equal(item.fallback.sourceSHA256,sha);
 assert.equal(item.consumer3D,false);
 const plan=await preflightOwnedOutfit1054({getSession:e.getSession,
  readOwnerItems:()=>e.readOwnerItems(),cleanBoard,board});
 assert.equal(plan.status,'source-verified-2d-only');
 assert.equal(plan.renderAuthorized3D,false);
 assert.equal(plan.slots.length,1);
 assert.equal(plan.slots[0].sourceSHA256,sha);
 assert.equal(JSON.stringify(plan).includes(image),false);
 const draft=await new Promise((resolve,reject)=>{
  const tx=e.db.transaction('state','readonly');const q=tx.objectStore('state').get('draft');
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 });
 assert.equal(draft.batch.length,0,'original pending capture removed only after atomic save');
}));

test('M31 old PHOTO119 saved booleans without source-bound field receipt are review-only, not outfit material',()=>withNativeSource(async e=>{
 await e.commit();const row=(await allRows(e.db))[0];
 delete row.confirmedDetailsSource31;
 await put(e.db,'items',row);e.nextRevision();
 const item=await e.api.item(e.id);
 assert.equal(item.category,'Uncategorized');
 assert.deepEqual(item.slotIds,[]);
 assert.deepEqual((await e.api.board({slots:{bottom:e.id}})).slots,{});
 assert.equal(item.consumer3D,false);
 assert.equal((await allRows(e.db))[0].category,'Bottoms','raw saved category unchanged');
}));

test('M31 user changes saved subtype without a renewed field receipt, never inherits earlier approval',()=>withNativeSource(async e=>{
 await e.commit();const row=(await allRows(e.db))[0];
 row.category='Shoes';row.itemType='Sneakers';
 await put(e.db,'items',row);e.nextRevision();
 assert.equal((await e.api.item(e.id)).category,'Uncategorized');
 assert.deepEqual((await e.api.query({slot:'shoes'})).ids,[]);
 assert.deepEqual((await e.api.board({slots:{shoes:e.id}})).slots,{});
}));

test('M31 injected foreign owner or original digest forgery cannot produce saved outfit or original fallback',()=>withNativeSource(async e=>{
 await e.commit();const original=(await allRows(e.db))[0];
 const foreign={...original,ownerId:'other'};
 await put(e.db,'items',foreign);e.nextRevision();
 await assert.rejects(e.api.board({slots:{bottom:e.id}}),/record-owner-mismatch/);
 await put(e.db,'items',{...original,originalPhoto:{image,sha256:'0'.repeat(64)}});
 e.nextRevision();
 const row=await e.api.item(e.id);
 assert.equal(row.fallback,null);
 assert.deepEqual(row.slotIds,[]);
 assert.deepEqual((await e.api.board({slots:{bottom:e.id}})).slots,{});
}));

test('M31 same-owner auth replacement and logout reject current native reads without sharing private originals',()=>withNativeSource(async e=>{
 await e.commit();await e.api.item(e.id);
 e.replaceAuth();
 await assert.rejects(e.api.query({slot:'bottom'}),/native-signed-session-required|native-session-changed|native-session-or-content-changed/);
 // New sign-in is allowed to initiate its own fresh read, but cannot use old
 // in-flight owner leases. Explicit logout always fails before reading photos.
 e.logout();
 await assert.rejects(e.api.item(e.id),/native-signed-session-required/);
}));

test('M31 source-bound receipt cannot be forged by changing item ID, owner ID, source SHA or basis',()=>withNativeSource(async e=>{
 await e.commit();const original=(await allRows(e.db))[0];
 for(const field of ['itemId','ownerId','sourceSHA256','basis']){
  const altered=structuredClone(original);
  altered.confirmedDetailsSource31[field]='forged';
  await put(e.db,'items',altered);e.nextRevision();
  const item=await e.api.item(e.id);
  assert.equal(item.category,'Uncategorized',field);
  assert.deepEqual(item.slotIds,[],field);
 }
}));
