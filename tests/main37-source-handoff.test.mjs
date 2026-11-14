import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {auditReadOnlyHandoff37} from '../research/main1054-handoff37/safe-readonly-handoff.mjs';

const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
async function dbFor(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,2);
  r.onupgradeneeded=()=>{
   r.result.createObjectStore('items',{keyPath:'id'});
   r.result.createObjectStore('state',{keyPath:'id'});
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function rows(db){
 return new Promise((resolve,reject)=>{
  const r=db.transaction('items','readonly').objectStore('items').getAll();
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function add(db,row){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readwrite');
  tx.objectStore('items').put(row);
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
 });
}
async function testOwner(callback){
 const ownerId='m37-'+randomUUID(),db=await dbFor(ownerId),id='licensed-owner-item';
 let authRef={user:{id:ownerId},assertCurrent(){}};
 let session={ownerId,authenticated:true,epoch:2,operationEpoch:3,
  authRef,privateDbRef:db,privateDbName:db.name};
 let revision=1,board={name:'Safe researched source',slots:{bottom:id}};
 const getSession=()=>({...session}),getRevision=()=>revision,getBoard=()=>board;
 const readOwnerItems=async scope=>{
  scope?.assertCurrent?.();
  const x=await rows(scope?.privateDbRef||db);
  scope?.assertCurrent?.();
  return x;
 };
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
 const receipt=await commitHumanReviewedPhoto119({
  db,ownerId,currentOwner:()=>session.authenticated?ownerId:null,
  record:draft,review,cryptoProvider:webcrypto,
  assertLease:()=>session.authenticated&&session.authRef===authRef
 });
 assert.equal(receipt.saved,true);
 const input={getSession,getRevision,readOwnerItems,getBoard,cryptoProvider:webcrypto};
 try{await callback({
  input,db,id,ownerId,async tamper(){const x=(await rows(db))[0];x.color='Red';await add(db,x);},
  async changeUnrelated(){await add(db,{id:'new-old-tab',ownerId,category:'Shoes'});},
  sameOwnerRelogin(){authRef={user:{id:ownerId},assertCurrent(){}};session={...session,authRef};},
  logout(){session={...session,authenticated:false};},
  boardEdit(){board={name:'Revised',slots:{top:id}};},
  setRevision(){revision++;}
 });}finally{db.close();}
}
const recognition=Object.freeze({requiresReview:true,
 instanceMethod:'connected_semantic_component_unverified',
 componentReviewStatus:'owner_must_confirm_garment_units'});
const garment=Object.freeze({schema:'M2-P89-public-original-jpeg-attestation-v1',
 familyAlpha:'HOLD',photoIsPublicBenchmark:true,ownerApproved:false,
 consumer3DAdmitted:false,releaseAuthorized:false});
const viewer=Object.freeze({requestedMode:'3d',context:'research-only'});
test('M37 genuine Commons original owner PHOTO119 + durable M34 yields 2D preflight ONLY with no photo bytes',()=>testOwner(async h=>{
 const r=await auditReadOnlyHandoff37({...h.input,
  recognitionResearch:recognition,garmentResearch:garment,viewerResearch:viewer});
 assert.equal(r.status,'OWNER_ORIGINAL_2D_PREFLIGHT_ONLY');
 assert.equal(r.slotCount,1);
 assert.equal(r.privateRosterCASInspected,true);
 assert.equal(r.sourceVerifiedAtPreflight,true);
 assert.equal(r.ownerConfirmedAtPreflight,true);
 assert.equal(r.viewer3DRequested,true);
 assert.equal(r.originalPhoto2DPreflight,true);
 assert.equal(r.displayApproved,false);
 assert.equal(r.consumer3D,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(r.mustRevalidateAtDisplay,true);
 assert.equal(JSON.stringify(r).includes(photo),false);
 assert.equal(JSON.stringify(r).includes(h.ownerId),false);
 assert.equal(JSON.stringify(r).includes(h.id),false);
 assert.equal(JSON.stringify(r).includes(sha),false);
}));
test('M37 unsaved research instance is never owner confirmation or automatic save',()=>testOwner(async h=>{
 for(const x of [{...recognition,requiresReview:false},{...recognition,autoSave:true},
  {...recognition,ownerApproved:true},{...recognition,releaseAuthorized:true}]){
  const r=await auditReadOnlyHandoff37({...h.input,recognitionResearch:x});
  assert.equal(r.status,'BLOCKED_RECHECK_OWNER_OR_SOURCE');
  assert.equal(r.originalPhoto2DPreflight,false);
  assert.equal(r.consumer3D,false);
 }
}));
test('M37 public-only source mesh and viewer cannot grant private consumer 3D',()=>testOwner(async h=>{
 for(const x of [{...garment,consumer3DAdmitted:true},
  {...garment,safeToRenderPhotorealistic3D:true},
  {...garment,ownerApproved:true},{...garment,familyAlpha:'GO'}]){
  const r=await auditReadOnlyHandoff37({...h.input,garmentResearch:x});
  assert.equal(r.status,'BLOCKED_RECHECK_OWNER_OR_SOURCE');
  assert.equal(r.releaseAuthorized,false);
 }
 const badViewer=await auditReadOnlyHandoff37({...h.input,viewerResearch:{requestedMode:'3d',consumer3D:true}});
 assert.equal(badViewer.status,'BLOCKED_RECHECK_OWNER_OR_SOURCE');
}));
test('M37 exact saved original source tamper forces blocked preflight',()=>testOwner(async h=>{
 await h.tamper();
 const r=await auditReadOnlyHandoff37(h.input);
 assert.equal(r.status,'BLOCKED_RECHECK_OWNER_OR_SOURCE');
 assert.equal(r.displayApproved,false);
}));
test('M37 cross-tab mutation during full-roster reread forces blocked result',()=>testOwner(async h=>{
 let count=0;
 const old=h.input.readOwnerItems;
 const input={...h.input,readOwnerItems:async scope=>{
  const x=await old(scope);
  if(++count===3)await h.changeUnrelated();
  return x;
 }};
 const r=await auditReadOnlyHandoff37(input);
 assert.equal(r.status,'BLOCKED_RECHECK_OWNER_OR_SOURCE');
}));
test('M37 after owner logout and board change fails closed without leaking photo',()=>testOwner(async h=>{
 h.logout();
 let r=await auditReadOnlyHandoff37(h.input);
 assert.equal(r.status,'BLOCKED_RECHECK_OWNER_OR_SOURCE');
 assert.equal(JSON.stringify(r).includes(photo),false);
}));
test('M37 mismatched garment slots and nonexistent saved photo fail closed',()=>testOwner(async h=>{
 h.boardEdit();
 const r=await auditReadOnlyHandoff37(h.input);
 assert.equal(r.status,'BLOCKED_RECHECK_OWNER_OR_SOURCE');
}));
test('M37 never saves new outfits during its read-only owner preflight',()=>testOwner(async h=>{
 const r=await auditReadOnlyHandoff37(h.input);
 assert.equal(r.status,'OWNER_ORIGINAL_2D_PREFLIGHT_ONLY');
 const tx=h.db.transaction('state','readonly');
 const saved=await new Promise((resolve,reject)=>{
  const q=tx.objectStore('state').get('outfit-board');
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 });
 assert.equal(saved,undefined);
}));
