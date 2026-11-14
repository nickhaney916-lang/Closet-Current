import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../public/native-reviewed-private-save-167.mjs';
import {auditNativeOwnerViewer38} from '../research/main1054-handoff38/strict-viewer-admission.mjs';
import {createTrustedNativeOwnerScope39} from '../research/main1054-handoff39/trusted-native-owner-scope.mjs';

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
  // Independent real source-byte SHA, not a reused trusted metadata string.
  attestOriginalPhotoBytes92:async ids=>{
   const actual=await rows(h.db);
   return {ownerId:h.ownerId,sources:ids.map(id=>{
    const row=actual.find(x=>x.id===id);
    const bytes=Buffer.from((row?.originalPhoto?.image||'').split(',')[1]||'','base64');
    return {id,sha256:createHash('sha256').update(bytes).digest('hex')};
   })};
  },
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

function actualProvider(h){
 const v=viewer(h);
 const board=v.consumer;
 board.view=()=>h.input.getBoard();
 board.readOnlyWardrobeRevision93=()=>({ownerId:h.ownerId,generation:1,revision:1});
 let opEpoch=2;
 const ownerScope=createTrustedNativeOwnerScope39({
  consumer:board,authRef:v.originalNativeAuth,privateDbRef:h.db,
  getActualOperationEpoch:()=>opEpoch,
  readActualOwnerItems:async proof=>h.input.readOwnerItems(proof),
  assertOwnerLive:()=>{
   const s=h.input.getSession();
   if(!s.authenticated||s.authRef!==v.originalNativeAuth||s.privateDbRef!==h.db)
    throw Error('synthetic-test-original-owner-revoked');
  }
 });
 return {...v,ownerScope,expireEpoch(){opEpoch++}};
}
test('M39 trusted original auth+private IDB+real M34 provider yields M38 2D only',()=>testOwner(async h=>{
 const p=actualProvider(h),result=await auditNativeOwnerViewer38(p);
 assert.equal(result.status,'OWNER_ORIGINAL_2D_VIEWER_FALLBACK_ONLY');
 assert.equal(result.consumer3D,false);
 assert.equal(result.originalPhoto2DFallbackRetained,true);
 assert.equal(result.ownerPhotoRenderAuthorized,false);
 for(const secret of [h.ownerId,h.id,photo,sha])assert.equal(JSON.stringify(result).includes(secret),false);
}));
test('M39 original private roster is re-read; color/source tampering blocks',()=>testOwner(async h=>{
 const p=actualProvider(h);
 await h.tamper();
 assert.equal((await auditNativeOwnerViewer38(p)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M39 same owner re-login cannot reanimate captured auth or operation epoch',()=>testOwner(async h=>{
 const p=actualProvider(h);
 p.expireEpoch();
 assert.equal((await auditNativeOwnerViewer38(p)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
 const other=actualProvider(h);
 h.sameOwnerRelogin();
 assert.equal((await auditNativeOwnerViewer38(other)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M39 missing owner/private identity, fake DB or no selected outfit fail closed',()=>testOwner(async h=>{
 const p=actualProvider(h);
 assert.throws(()=>createTrustedNativeOwnerScope39({
  consumer:p.consumer,authRef:p.originalNativeAuth,
  privateDbRef:{name:'closet-current-user-not-original'},
  getActualOperationEpoch:()=>2,
  readActualOwnerItems:async()=>[],assertOwnerLive(){} 
 }),/MAIN39 initial-original-session-invalid/);
 p.consumer.selected=-1;
 assert.equal((await auditNativeOwnerViewer38(p)).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M39 owner roster cannot leak foreign owner records into M34 proof',()=>testOwner(async h=>{
 const p=actualProvider(h);
 const mutated=createTrustedNativeOwnerScope39({
  consumer:p.consumer,authRef:p.originalNativeAuth,privateDbRef:h.db,
  getActualOperationEpoch:()=>2,
  assertOwnerLive(){},
  readActualOwnerItems:async proof=>[...(await h.input.readOwnerItems(proof)),{
   id:'foreign-row',ownerId:'not-current-owner',color:'Red'
  }]
 });
 assert.equal((await auditNativeOwnerViewer38({...p,ownerScope:mutated})).status,'BLOCKED_OWNER_OR_SOURCE_RECHECK');
}));
test('M39 real public application makes adapter only under both extra research gates',()=>{
 const s=readFileSync('public/outfit-board.js','utf8');
 const start=s.indexOf("if(mode39.get('main39')==='research'&&");
 const end=s.indexOf('const viewer=await mountNative3D05',start);
 assert.ok(start>0&&end>start);
 const guarded=s.slice(start,end);
 assert.match(guarded,/mode39.get\('main38'\)==='research'/);
 assert.match(guarded,/originalAuth39=window.closetAuth,ownerDb39=db/);
 assert.match(guarded,/privateDbRef:ownerDb39/);
 assert.match(guarded,/readAllFrom\(scope.privateDbRef\)/);
 assert.match(s.slice(end,end+180),/ownerScope38/);
});
