import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {createPickerAdmission32} from '../research/main1054-picker32/picker-admission.mjs';

const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const original='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');

async function open(owner){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner,2);
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('items',{keyPath:'id'});
   request.result.createObjectStore('state',{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function put(db,store,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(value);
  tx.oncomplete=()=>resolve();
  tx.onerror=tx.onabort=()=>reject(tx.error||Error('test transaction aborted'));
 });
}
async function all(db){
 return new Promise((resolve,reject)=>{
  const req=db.transaction('items','readonly').objectStore('items').getAll();
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function fixture(fn){
 const ownerId='m32-'+randomUUID(),db=await open(ownerId);
 const id='garment-1';
 const record={id,ownerId,category:'Uncategorized',itemType:'Unknown',
  color:'Unknown',sourceSHA256:sha,sourceHashVerified:true,image:original,
  originalPhoto:{image:original,sha256:sha},singleGarmentVerified:false};
 const review={confirmed:true,recordId:id,originalSHA256:sha,
  category:'Bottoms',itemType:'Jeans',color:'Blue',singleGarmentConfirmed:true};
 await put(db,'state',{id:'draft',batch:[structuredClone(record)]});
 let authRef={user:{id:ownerId},assertCurrent(){}};
 let session={authenticated:true,ownerId,epoch:8,operationEpoch:3,authRef,
  privateDbRef:db,privateDbName:db.name};
 let revision=1,board={name:'Source-bound outfit',slots:{}};
 const getSession=()=>({...session}),getRevision=()=>revision,getBoard=()=>board;
 const readOwnerItems=async scope=>{
  scope.assertCurrent();
  const rows=await all(scope.privateDbRef);
  scope.assertCurrent();return rows;
 };
 const make=(overrides={})=>createPickerAdmission32({
  getSession,getRevision,getBoard,readOwnerItems,cryptoProvider:webcrypto,...overrides
 });
 const freshAuth=()=>({user:{id:ownerId},assertCurrent(){}});
 const harness={db,id,ownerId,getSession,getRevision,getBoard,
  readOwnerItems,make,nextRevision(){revision++;},
  setBoard(v){board=v;},relogin(){
   authRef=freshAuth();session={...session,authRef};
  },logout(){session={...session,authenticated:false};}};
 try{
  const verdict=await commitHumanReviewedPhoto119({db,ownerId,
   currentOwner:()=>session.authenticated?session.ownerId:null,
   record,review,cryptoProvider:webcrypto,
   assertLease:()=>session.authenticated&&session.authRef===authRef});
  assert.equal(verdict.saved,true);
  return await fn(harness);
 }finally{db.close();}
}
const allowed=r=>assert.equal(r.status,'authorized-for-immediate-2d-selection-only');
const blocked=r=>assert.deepEqual(r,{
 status:'blocked-review-or-refresh-required',
 consumer3D:false,persisted:false,releaseAuthorized:false
});

test('M32 licensed original + real PHOTO119 saved receipt admits immediate 2D picker but not a persistent/3D claim',()=>fixture(async e=>{
 const gate=e.make(),decision=await gate.authorize('bottom',e.id);
 allowed(decision);
 assert.equal(decision.itemId,e.id);
 assert.equal(decision.slot,'bottom');
 assert.equal(decision.sourceSHA256,sha);
 assert.equal(decision.consumer3D,false);
 assert.equal(decision.persisted,false);
 assert.equal(JSON.stringify(decision).includes('data:image'),false);
 blocked(await gate.authorize('shoes',e.id));
 gate.dispose();
}));

test('M32 old broad reviewed flags lacking M31 field receipt must not authorize outfit picker',()=>fixture(async e=>{
 const row=(await all(e.db))[0];
 delete row.confirmedDetailsSource31;
 await put(e.db,'items',row);
 e.nextRevision();
 blocked(await e.make().authorize('bottom',e.id));
 assert.equal((await all(e.db))[0].category,'Bottoms','raw owner record untouched');
}));

test('M32 changed original JPEG receipt loses picker source eligibility',()=>fixture(async e=>{
 const row=(await all(e.db))[0];
 row.originalPhoto.sha256='0'.repeat(64);
 await put(e.db,'items',row);e.nextRevision();
 blocked(await e.make().authorize('bottom',e.id));
}));

test('M32 same-owner relogin during live private source read cancels former picker action',()=>fixture(async e=>{
 let once=true;
 const gate=e.make({readOwnerItems:async scope=>{
  const rows=await e.readOwnerItems(scope);
  if(once){once=false;e.relogin();}
  return rows;
 }});
 blocked(await gate.authorize('bottom',e.id));
 allowed(await gate.authorize('bottom',e.id));
}));

test('M32 same-session edit/restore content revision during await blocks old picker',()=>fixture(async e=>{
 let once=true;
 const gate=e.make({readOwnerItems:async scope=>{
  const rows=await e.readOwnerItems(scope);
  if(once){once=false;e.nextRevision();}
  return rows;
 }});
 blocked(await gate.authorize('bottom',e.id));
 allowed(await gate.authorize('bottom',e.id));
}));

test('M32 board mutation while original JPEG hash awaits must not grant stale selection',()=>fixture(async e=>{
 let once=true;
 const gate=e.make({readOwnerItems:async scope=>{
  const rows=await e.readOwnerItems(scope);
  if(once){once=false;e.setBoard({name:'Owner changed look',slots:{}});}
  return rows;
 }});
 blocked(await gate.authorize('bottom',e.id));
 allowed(await gate.authorize('bottom',e.id));
}));

test('M32 invalidate and dispose fail closed, never emit authenticated photo data',()=>fixture(async e=>{
 let release;
 const entered=new Promise(resolve=>{
  const gate=e.make({readOwnerItems:async scope=>{
   release=resolve;
   return e.readOwnerItems(scope);
  }});
  // The admission may be invalidated even while its first async source read
  // is queued; no callback can retroactively persist or admit the stale row.
  const pending=gate.authorize('bottom',e.id);
  Promise.resolve().then(()=>gate.invalidate());
  pending.then(blocked).then(()=>gate.dispose());
 });
 await entered;
 // Separate explicit disposal test avoids relying on private error text.
 const gate=e.make();gate.dispose();
 blocked(await gate.authorize('bottom',e.id));
}));
