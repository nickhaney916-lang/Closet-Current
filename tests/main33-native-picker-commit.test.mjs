import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {createNativeOutfitPicker33} from '../research/main1054-picker33/native-picker-bridge.mjs';

const jpg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const image='data:image/jpeg;base64,'+jpg.toString('base64');
const sha=createHash('sha256').update(jpg).digest('hex');

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
function get(db,id){
 return new Promise((resolve,reject)=>{
  const req=db.transaction('items','readonly').objectStore('items').get(id);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
function put(db,item){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(item);
  tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function fixture(fn){
 const ownerId='m33-'+randomUUID(),id='owner-jeans';
 const db=await open(ownerId);
 let authRef={user:{id:ownerId},assertCurrent(){}};
 let session={authenticated:true,ownerId,epoch:2,operationEpoch:6,
  authRef,privateDbRef:db,privateDbName:db.name};
 let board={name:'Testing live picker',slots:{bottom:id}};
 let revision=1;
 const getSession=()=>({...session});
 const getRevision=()=>revision;
 const readOwnerItems=async scope=>{
  scope.assertCurrent();
  const records=await new Promise((resolve,reject)=>{
   const q=scope.privateDbRef.transaction('items','readonly').objectStore('items').getAll();
   q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
  });
  scope.assertCurrent();return records;
 };
 const gate=()=>createNativeOutfitPicker33({
  getSession,getRevision,readOwnerItems,getBoard:()=>board,cryptoProvider:webcrypto
 });
 const record={id,ownerId,category:'Uncategorized',itemType:'Unknown',
  color:'Unknown',sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{sha256:sha,image},image};
 const review={confirmed:true,recordId:id,originalSHA256:sha,category:'Bottoms',
  itemType:'Jeans',color:'Blue',singleGarmentConfirmed:true};
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite');
  tx.objectStore('state').put({id:'draft',batch:[structuredClone(record)]});
  tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
 });
 const saved=await commitHumanReviewedPhoto119({db,ownerId,
  currentOwner:()=>session.authenticated?ownerId:null,
  record,review,assertLease:()=>session.authenticated&&session.authRef===authRef,
  cryptoProvider:webcrypto});
 assert.equal(saved.saved,true);
 try{
  await fn({db,id,ownerId,gate,getSession,
   clear(){board={name:'Testing live picker',slots:{}};},
   restore(){board={name:'Testing live picker',slots:{bottom:id}};},
   relogin(){authRef={user:{id:ownerId},assertCurrent(){}};session={...session,authRef};},
   logout(){session={...session,authenticated:false};},
   revision(){revision++;},
   async mutate(edit){const row=await get(db,id);edit(row);await put(db,row);}
  });
 }finally{db.close();}
}

test('M33 real licensed original and committed PHOTO119 receipt produces one-use, exact owner/row 2D write check',()=>fixture(async e=>{
 const gate=e.gate(),proof=await gate.prepareWrite({name:'Testing live picker',slots:{bottom:e.id}});
 assert.deepEqual(proof.itemIds,[e.id]);
 const row=await get(e.db,e.id);
 assert.equal(proof.matches(e.id,row),true);
 assert.equal(proof.matches('unknown',row),false);
 assert.equal(proof.consumer3D,false);
 assert.equal(JSON.stringify(proof).includes(image),false);
 proof.assertCurrent();
 proof.consume();
 assert.throws(()=>proof.assertCurrent(),/consumed/);
 gate.dispose();
}));

test('M33 write gate rejects in-transaction row edited AFTER valid source verification',()=>fixture(async e=>{
 const proof=await e.gate().prepareWrite({name:'Testing live picker',slots:{bottom:e.id}});
 await e.mutate(row=>{row.notes='Other tab edited after source SHA';});
 const fresh=await get(e.db,e.id);
 assert.equal(proof.matches(e.id,fresh),false);
}));

test('M33 forged owner-confirmed field receipt blocks write despite nominally compatible category',()=>fixture(async e=>{
 await e.mutate(row=>{row.confirmedDetailsSource31.basis='forged';});
 await assert.rejects(e.gate().prepareWrite({name:'Testing live picker',slots:{bottom:e.id}}),/ambiguous-or-incompatible-outfit/);
}));

test('M33 original JPEG hash claim cannot grant picker or write',()=>fixture(async e=>{
 await e.mutate(row=>{row.originalPhoto.sha256='f'.repeat(64);});
 await assert.rejects(e.gate().prepareWrite({name:'Testing live picker',slots:{bottom:e.id}}),/ambiguous-or-incompatible-outfit/);
 e.clear();
 const empty=await e.gate().prepareWrite({name:'Testing live picker',slots:{}});
 assert.deepEqual(empty.itemIds,[]);
}));

test('M33 same-owner re-login or logout invalidates private write proof',()=>fixture(async e=>{
 const proof=await e.gate().prepareWrite({name:'Testing live picker',slots:{bottom:e.id}});
 e.relogin();
 assert.throws(()=>proof.assertCurrent(),/owner-or-content-changed/);
 const renewed=await e.gate().prepareWrite({name:'Testing live picker',slots:{bottom:e.id}});
 assert.equal(renewed.matches(e.id,await get(e.db,e.id)),true);
 e.logout();
 assert.throws(()=>renewed.assertCurrent(),/signed-owner-unavailable/);
}));

test('M33 local revision, board edit, and explicit invalidation revoke retained proof',()=>fixture(async e=>{
 const g=e.gate();
 let proof=await g.prepareWrite({name:'Testing live picker',slots:{bottom:e.id}});
 e.revision();
 assert.throws(()=>proof.assertCurrent(),/owner-or-content-changed/);
 proof=await g.prepareWrite({name:'Testing live picker',slots:{bottom:e.id}});
 e.clear();
 assert.throws(()=>proof.assertCurrent(),/outfit-edited/);
 e.restore();
 proof=await g.prepareWrite({name:'Testing live picker',slots:{bottom:e.id}});
 g.invalidate();
 assert.throws(()=>proof.assertCurrent(),/revoked/);
 g.dispose();
}));

test('M33 impossible dress or wrong slot cannot silently delete an earlier board selection',()=>fixture(async e=>{
 const verdict=await e.gate().authorize('shoes',e.id);
 assert.equal(verdict.status,'blocked-review-or-refresh-required');
 await assert.rejects(e.gate().prepareWrite({name:'Testing live picker',slots:{shoes:e.id}}),/outfit-edited/);
}));

test('M33 test suite also asserts research-only opt-in native UI and transaction wiring',()=>{
 const code=readFileSync('public/outfit-board.js','utf8');
 assert.match(code,/ownerPicker33\W.*research/);
 assert.match(code,/ownerPicker33Choose\(slotId,item.id,b,pickerLease/);
 assert.match(code,/ownerPicker33Choose\(target,item.id,b,suggestionLease/);
 assert.match(code,/proof33\?\.matches\(id,row\)/);
 assert.match(code,/ownerDB\.transaction\(candidate\|\|proof33\?\['state','items'\]/);
 assert.doesNotMatch(code,/\bconsumer3D\s*:\s*true\b/);
});