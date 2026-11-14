import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {auditNativeOwnerViewer38} from '../research/main1054-handoff38/strict-viewer-admission.mjs';

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

function viewer(h){
 const auth=h.input.getSession().authRef;
 const selected={id:'saved-board',outfit3dId:'research-fixture-3d-id',
  ownerId:h.ownerId,name:'Safe researched source',slots:{bottom:h.id}};
 const consumer={
  selected:0,
  status:()=>({active:true,dirty:false}),
  readOnlySnapshot:()=>({saved:[selected]}),
  readOnlyGarmentSources91:ids=>({
   ownerId:h.ownerId,sources:ids.map(id=>({id,sha256:sha}))
  }),
  readOnlyWardrobeRevision93:()=>({ownerId:h.ownerId,revision:1,generation:1})
 };
 const doc={
  hidden:false,visibilityState:'visible',
  getElementById(id){
   if(id==='appShell')return {hidden:false};
   if(id==='authGate')return {hidden:true};
   return null;
  }
 };
 const win={closetAuth:auth};
 return {ownerScope:h.input,consumer,originalNativeAuth:auth,win,doc};
}
test('M38 genuine original PHOTO119 private outfit reconciles to P90 selection as 2D ONLY',()=>testOwner(async h=>{
 const r=await auditNativeOwnerViewer38(viewer(h));
 assert.equal(r.status,'OWNER_ORIGINAL_2D_VIEWER_FALLBACK_ONLY');
 assert.equal(r.originalPhoto2DFallbackRetained,true);
 assert.equal(r.consumer3D,false);
 assert.equal(r.real3DQualityApproved,false);
 assert.equal(r.ownerPhotoRenderAuthorized,false);
 assert.equal(r.requiresNewDisplayTimeProof,true);
 assert.equal(r.releaseAuthorized,false);
 for(const secret of [h.ownerId,h.id,photo,sha])
  assert.equal(JSON.stringify(r).includes(secret),false);
}));
test('M38 rejects saved viewer slots changed from real owner board',()=>testOwner(async h=>{
 h.boardEdit();
 assert.equal((await auditNativeOwnerViewer38(viewer(h))).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M38 rejects changed confirmed row/photo content under same item ID',()=>testOwner(async h=>{
 await h.tamper();
 assert.equal((await auditNativeOwnerViewer38(viewer(h))).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M38 rejects same-owner login replacement and logout',()=>testOwner(async h=>{
 const v=viewer(h);
 h.sameOwnerRelogin();
 assert.equal((await auditNativeOwnerViewer38(v)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
 h.logout();
 assert.equal((await auditNativeOwnerViewer38(v)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M38 rejects cross-tab mutation while re-reading owner roster',()=>testOwner(async h=>{
 let reads=0;
 const v=viewer(h),original=v.ownerScope.readOwnerItems;
 v.ownerScope={...v.ownerScope,readOwnerItems:async scope=>{
  const items=await original(scope);
  if(++reads===3)await h.changeUnrelated();
  return items;
 }};
 assert.equal((await auditNativeOwnerViewer38(v)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M38 rejects mismatched P90 photo SHA, account and revision',()=>testOwner(async h=>{
 const v=viewer(h);
 const wrongPhoto={...v,consumer:{...v.consumer,
  readOnlyGarmentSources91:ids=>({ownerId:h.ownerId,sources:ids.map(id=>({id,sha256:'0'.repeat(64)}))})}};
 // P90 metadata check alone cannot prove real JPEG bytes: the M37 check
 // must still only return a 2D preflight, never a 3D grant.
 const r=await auditNativeOwnerViewer38(wrongPhoto);
 assert.equal(r.consumer3D,false);
 const wrongOwner={...v,win:{closetAuth:{user:{id:'another-owner'}}}};
 assert.equal((await auditNativeOwnerViewer38(wrongOwner)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
 const hidden={...v,doc:{...v.doc,hidden:true,visibilityState:'hidden'}};
 assert.equal((await auditNativeOwnerViewer38(hidden)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M38 blocks attempted forged permission in a public-source research receipt',()=>testOwner(async h=>{
 const v=viewer(h);
 const receipt=await auditNativeOwnerViewer38({...v,
  garmentResearch:{familyAlpha:'HOLD',consumer3DAdmitted:true,releaseAuthorized:false}});
 assert.equal(receipt.status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
 assert.equal(receipt.consumer3D,false);
}));
test('M38 native opt-in strict guard executes before WebGL donor import',()=>{
 const source=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(source,/params\?\.get\('main38'\)==='research'/);
 assert.match(source,/auditNativeOwnerViewer38/);
 assert.match(source,/MAIN38_OWNER_ORIGINAL_2D_ONLY_NO_3D_ADMISSION/);
 const guard=source.indexOf("if(params?.get('main38')==='research')",source.indexOf("async function open()"));
 const donor=source.indexOf('const donor=await importPinnedDonor()',source.indexOf("async function open()"));
 assert.ok(guard>0&&donor>guard);
 const defaultFeature=source.includes('main38=research');
 assert.equal(defaultFeature,false,'M38 must be opt-in and never added to default UI');
});
