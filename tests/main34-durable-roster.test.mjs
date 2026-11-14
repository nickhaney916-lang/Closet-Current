import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {sealDurablePrivateWardrobe34} from '../research/main1054-revision34/durable-roster.mjs';
import {createNativeOutfitPicker33} from '../research/main1054-picker33/native-picker-bridge.mjs';

const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');

async function open(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function all(db){
 return new Promise((resolve,reject)=>{
  const r=db.transaction('items','readonly').objectStore('items').getAll();
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function put(db,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(row);
  tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function del(db,id){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').delete(id);
  tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function state(db){
 return new Promise((resolve,reject)=>{
  const r=db.transaction('state','readonly').objectStore('state').get('outfit-board');
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function commitGuarded(db,proof){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite'),items=tx.objectStore('items');
  let error=null;
  const req=items.getAll();
  req.onsuccess=()=>{
   try{
    proof.assertCurrent();
    if(!proof.matchesRoster(req.result))throw Error('M34_ROSTER_CHANGED');
    tx.objectStore('state').put({id:'outfit-board',current:{slots:{bottom:'source'}},saved:[]});
   }catch(e){error=e;tx.abort();}
  };
  tx.oncomplete=()=>resolve(true);
  tx.onerror=tx.onabort=()=>reject(error||tx.error||Error('M34_ATOMIC_ABORT'));
 });
}

async function fixture(callback){
 const ownerId='m34-'+randomUUID(),db=await open(ownerId),id='source';
 let auth={user:{id:ownerId},assertCurrent(){}};
 let session={authenticated:true,ownerId,epoch:4,operationEpoch:6,
  authRef:auth,privateDbRef:db,privateDbName:db.name};
 let revision=1,board={name:'Safe outfit',slots:{bottom:id}};
 const getSession=()=>({...session}),getRevision=()=>revision;
 const readOwnerItems=async scope=>{
  scope?.assertCurrent?.();
  const records=await all(scope?.privateDbRef||db);
  scope?.assertCurrent?.();
  return records;
 };
 const seal=async(records=await all(db))=>sealDurablePrivateWardrobe34({
  getSession,getRevision,readOwnerItems,records,cryptoProvider:webcrypto
 });
 const picker=()=>createNativeOutfitPicker33({
  getSession,getRevision,readOwnerItems,getBoard:()=>board,
  cryptoProvider:webcrypto,durableRoster34:true
 });
 const draft={id,ownerId,category:'Uncategorized',itemType:'Unknown',
  color:'Unknown',sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{image:photo,sha256:sha},image:photo};
 const review={confirmed:true,recordId:id,originalSHA256:sha,
  category:'Bottoms',itemType:'Jeans',color:'Blue',singleGarmentConfirmed:true};
 await new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite');
  tx.objectStore('state').put({id:'draft',batch:[structuredClone(draft)]});
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
 const result=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>session.authenticated?ownerId:null,
  record:draft,review,cryptoProvider:webcrypto,
  assertLease:()=>session.authenticated&&session.authRef===auth
 });
 assert.equal(result.saved,true);
 const h={db,ownerId,id,readOwnerItems,getSession,getRevision,picker,seal,
  async another(row){await put(db,{id:'other',ownerId,...row});},
  async amend(id,transform){
   const records=await all(db),record=records.find(x=>x.id===id);
   transform(record);await put(db,record);
  },
  async delete(id){await del(db,id);},
  replaceLogin(){auth={user:{id:ownerId},assertCurrent(){}};session={...session,authRef:auth};},
  logout(){session={...session,authenticated:false};},
  advance(){revision++;},
  clearBoard(){board={name:'Safe outfit',slots:{}};}
 };
 try{await callback(h);}finally{db.close();}
}
test('M34 licensed actual owner PHOTO119 saved roster yields content-derived SHA-256 durable revision, no photo leakage',()=>fixture(async h=>{
 const receipt=await h.seal();
 assert.match(receipt.revision,/^sha256:[a-f0-9]{64}$/);
 assert.equal(receipt.itemCount,1);
 assert.equal(JSON.stringify(receipt).includes(photo),false);
 assert.equal(await receipt.verify(),true);
 assert.equal(receipt.matchesRows(await all(h.db)),true);
 receipt.dispose();
 assert.throws(()=>receipt.assertCurrent(),/disposed/);
}));
test('M34 unrelated owner garment edit in another tab invalidates full private roster revision',()=>fixture(async h=>{
 await h.another({category:'Tops',color:'Red'});
 const receipt=await h.seal();
 await h.amend('other',r=>r.notes='changed by other tab');
 assert.equal(receipt.matchesRows(await all(h.db)),false);
 await assert.rejects(receipt.verify(),/private-roster-changed/);
}));
test('M34 deletion after source verification rejects transaction without a partial outfit state write',()=>fixture(async h=>{
 const receipt=await h.seal();
 await h.delete(h.id);
 await assert.rejects(commitGuarded(h.db,receipt),/M34_ROSTER_CHANGED/);
 assert.equal(await state(h.db),undefined);
}));
test('M34 cloud-style restore replacing an item invalidates source-bound native revision',()=>fixture(async h=>{
 const receipt=await h.seal();
 await h.amend(h.id,r=>{r.category='Shoes';r.itemType='Sneakers';});
 await assert.rejects(receipt.verify(),/private-roster-changed/);
 assert.equal(receipt.matchesRows(await all(h.db)),false);
}));
test('M34 same-owner re-login, logout and local epoch change revoke old private roster proof',()=>fixture(async h=>{
 let receipt=await h.seal();
 h.replaceLogin();
 assert.throws(()=>receipt.matchesRows([]),/session-or-roster-revision-changed/);
 receipt=await h.seal();
 h.advance();
 await assert.rejects(receipt.verify(),/session-or-roster-revision-changed/);
 receipt=await h.seal();
 h.logout();
 assert.throws(()=>receipt.assertCurrent(),/signed-owner-unavailable/);
}));
test('M34 foreign account items fail closed, even when they arrive inside correct IDB name',()=>fixture(async h=>{
 await put(h.db,{id:'foreign',ownerId:'another-signed-owner',category:'Tops'});
 await assert.rejects(h.seal(),/private-roster-invalid/);
}));
test('M34 same set in a different IndexedDB order has exactly the same content identity',()=>fixture(async h=>{
 await h.another({category:'Tops',color:'Blue'});
 const rows=await all(h.db);
 const receipt=await h.seal(rows);
 assert.equal(receipt.matchesRows(rows.slice().reverse()),true);
}));
test('M34 actual integrated M33 preflight binds ALL selected item receipts to one durable entire-roster CAS',()=>fixture(async h=>{
 const p=h.picker(),proof=await p.prepareWrite({name:'Safe outfit',slots:{bottom:h.id}});
 assert.equal(proof.durableContentChecked,true);
 assert.equal(proof.matchesRoster(await all(h.db)),true);
 assert.equal(proof.matches(h.id,(await all(h.db))[0]),true);
 await h.another({category:'Shoes',color:'Black'});
 assert.equal(proof.matchesRoster(await all(h.db)),false);
 assert.equal(proof.matches(h.id,(await all(h.db)).find(x=>x.id===h.id)),true,
  'existing M33 selected-item CAS alone cannot see unrelated new entries');
 await assert.rejects(commitGuarded(h.db,proof),/M34_ROSTER_CHANGED/);
 assert.equal(await state(h.db),undefined);
 p.dispose();
}));
test('M34 integrated preflight detects a same-account unrelated edit before any outfit write',()=>fixture(async h=>{
 let once=true;
 const gate=createNativeOutfitPicker33({
  getSession:h.getSession,getRevision:h.getRevision,
  getBoard:()=>({name:'Safe outfit',slots:{bottom:h.id}}),
  cryptoProvider:webcrypto,durableRoster34:true,
  readOwnerItems:async scope=>{
   const rows=await h.readOwnerItems(scope);
   if(once){once=false;await h.another({category:'Tops',color:'Purple'});}
   return rows;
  }
 });
 await assert.rejects(gate.prepareWrite({name:'Safe outfit',slots:{bottom:h.id}}),
  /native-session-or-content-changed|private-roster-changed|ambiguous-or-incompatible-outfit/);
 gate.dispose();
}));
test('M34 opt-in source path and same atomic state-plus-items transaction contain full-roster CAS',()=>{
 const app=readFileSync('public/outfit-board.js','utf8');
 assert.match(app,/ownerRevision34.*research/);
 assert.match(app,/durableRoster34:ownerRevision34Active/);
 assert.match(app,/if\(proof33\?\.durableContentChecked\)/);
 assert.match(app,/if\(!proof33\.matchesRoster\(roster\.result\)\)throw outfitWardrobeChanged/);
 assert.match(app,/candidate\|\|proof33\?\['state','items'\]/);
});
