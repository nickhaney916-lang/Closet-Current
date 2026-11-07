import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119} from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {readOwnerSnapshot01,exportBackup01} from '../research/restore-atomic-01/atomic-restore.mjs';
import {createNativeRestore01} from '../research/restore-atomic-01/native-restore-bridge.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
const sha=b=>createHash('sha256').update(b).digest('hex');
const img=b=>'data:image/jpeg;base64,'+b.toString('base64');
const meta=await sharp(original).metadata();
const crop=await sharp(original).extract({
 left:0,top:0,width:Math.max(10,Math.floor(meta.width*.55)),
 height:Math.max(10,Math.floor(meta.height*.65))
}).jpeg({quality:87}).toBuffer();
const open=owner=>new Promise((resolve,reject)=>{
 const r=indexedDB.open('closet-current-user-'+owner,2);
 r.onupgradeneeded=()=>{
  r.result.createObjectStore('items',{keyPath:'id'});
  r.result.createObjectStore('state',{keyPath:'id'});
 };
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
function put(db,store,item){return new Promise((resolve,reject)=>{
 const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put(item);
 tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
});}
const snapshot=async db=>readOwnerSnapshot01(db,()=>{});
function fakeNative(owner){
 const listeners=new Map();
 const elements=new Map([
  ['logout',{addEventListener(){},removeEventListener(){}}],
  ['authGate',{hidden:true}],['appShell',{hidden:false}]
 ]);
 let token='research-token-A',refresh='research-refresh-A',changed=0;
 const expires=Math.floor(Date.now()/1000)+3600;
 const session=()=>JSON.stringify({access_token:token,refresh_token:refresh,expires_at:expires});
 let stored=session();
 const native={
  ready:Promise.resolve(),user:{id:owner},
  async getAccessToken(){return token;}
 };
 const win={
  location:{search:'?restoreAtomic01=research&nativeLossless04=research'},
  document:{getElementById:id=>elements.get(id)||null},
  localStorage:{getItem:k=>k==='closet-current-auth-v1'?stored:null},
  addEventListener:(k,f)=>listeners.set(k,f),
  removeEventListener:(k,f)=>{if(listeners.get(k)===f)listeners.delete(k);},
  closetAuth:native,closetCloud:{changed:()=>{changed++;}},
  confirm:()=>true,
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  dispatchEvent(){}
 };
 return {win,native,get cloudChanged(){return changed;},
  rotateToken(){token='rotated-token-'+randomUUID();stored=session();},
  switchOwner(other){native.user={id:other};},
  logout(){elements.get('logout').addEventListener=()=>{};native.user=null;},
  restoreSameOwnerToken(){token='research-token-A';stored=session();}
 };
}
async function scenario(run){
 const owner='RESTORE127-'+randomUUID(),db=await open(owner);
 const record={id:'photo-cutout-127',ownerId:owner,sourceSHA256:sha(original),
  sourceHashVerified:true,image:img(original),
  originalPhoto:{image:img(original),sha256:sha(original)},
  singleGarmentVerified:false,outfitSourceId:'original-multiple-pieces',
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:sha(original),cutoutSHA256:sha(crop),cutoutImage:img(crop)},
  category:'Uncategorized',itemType:'Unknown',color:'Unknown'};
 await put(db,'state',{id:'draft',batch:[structuredClone(record)]});
 const saved=await commitHumanReviewedPhoto119({
  db,ownerId:owner,currentOwner:()=>owner,record,
  review:{confirmed:true,recordId:record.id,originalSHA256:sha(original),
   category:'Tops',itemType:'T-shirt',color:'Red',
   singleGarmentConfirmed:false,instanceConfirmed:true,cutoutSHA256:sha(crop)},
  cryptoProvider:webcrypto
 });
 assert.equal(saved.saved,true);
 await put(db,'state',{id:'outfit-board',current:{name:'Working',slots:{}},
  saved:[{id:'saved-look-127',ownerId:owner,name:'Must survive',
   slots:{top:'photo-cutout-127'},future:{keep:true}}]});
 const originalSnapshot=await snapshot(db),backup=exportBackup01({ownerId:owner,rows:originalSnapshot.rows});
 const auth=fakeNative(owner),board={status:()=>({active:true,dirty:false})};
 try{return await run({owner,db,backup,auth,board,originalSnapshot});}
 finally{db.close();}
}
test('PHOTO127 awaited Promise resolving false NEVER authorizes V4 restore',()=>scenario(async e=>{
 const bridge=await createNativeRestore01({win:e.auth.win,db:e.db,board:e.board});
 try{
  const before=await snapshot(e.db);
  const r=await bridge.importBackup(e.backup,{confirm:async()=>false});
  assert.equal(r.cancelled,true);
  assert.equal(r.originalUntouched,true);
  assert.deepEqual((await snapshot(e.db)).rows,before.rows);
  assert.equal(e.auth.cloudChanged,0);
 }finally{bridge.dispose();}
}));
test('PHOTO127 nonboolean approval objects and numbers must not authorize restore',()=>scenario(async e=>{
 const bridge=await createNativeRestore01({win:e.auth.win,db:e.db,board:e.board});
 try{
  for(const val of [1,{approved:true},'yes',null,undefined]){
   const before=await snapshot(e.db);
   const r=await bridge.importBackup(e.backup,{confirm:async()=>val});
   assert.equal(r.cancelled,true);
   assert.deepEqual((await snapshot(e.db)).rows,before.rows);
  }
  assert.equal(e.auth.cloudChanged,0);
 }finally{bridge.dispose();}
}));
test('PHOTO127 explicit awaited true restores original+cutout and notifies owner cloud once',()=>scenario(async e=>{
 const bridge=await createNativeRestore01({win:e.auth.win,db:e.db,board:e.board});
 try{
  const before=await snapshot(e.db);
  const reply=await bridge.importBackup(e.backup,{confirm:async()=>true});
  assert.equal(reply.restored,true);
  assert.equal(reply.receipt.reviewedCutoutJPEGsVerified,1);
  assert.equal(e.auth.cloudChanged,1);
  const after=(await snapshot(e.db)).rows;
  const row=after.items[0];
  assert.equal(row.originalPhoto.image,img(original));
  assert.equal(row.segmentHint.cutoutImage,img(crop));
  assert.equal(row.reviewProvenance,'explicit-owner-claim-not-independent-review-evidence');
  assert.equal(after.state.find(x=>x.id==='outfit-board').saved[0].future.keep,true);
  assert.equal(after.state.find(x=>x.id==='cloud-sync').dirty,true);
  assert.notDeepEqual(after.state,before.rows.state);
 }finally{bridge.dispose();}
}));
test('PHOTO127 changing native owner while asynchronous confirmation pending rejects without a single write',()=>scenario(async e=>{
 let openConfirm,signal;
 const entered=new Promise(r=>{signal=r;});
 const hold=new Promise(r=>{openConfirm=r;});
 const bridge=await createNativeRestore01({win:e.auth.win,db:e.db,board:e.board});
 try{
  const before=await snapshot(e.db);
  const pending=bridge.importBackup(e.backup,{confirm:async()=>{signal();await hold;return true;}});
  await entered;
  e.auth.switchOwner('OTHER-'+randomUUID());
  openConfirm();
  await assert.rejects(pending,/RESTORE01 authenticated owner\/session changed/);
  assert.deepEqual((await snapshot(e.db)).rows,before.rows);
  assert.equal(e.auth.cloudChanged,0);
 }finally{bridge.dispose();}
}));
test('PHOTO127 refreshed auth token during pending async confirmation aborts before commit',()=>scenario(async e=>{
 let signal,release;
 const entered=new Promise(r=>{signal=r;});
 const hold=new Promise(r=>{release=r;});
 const bridge=await createNativeRestore01({win:e.auth.win,db:e.db,board:e.board});
 try{
  const before=await snapshot(e.db);
  const pending=bridge.importBackup(e.backup,{confirm:async()=>{signal();await hold;return true;}});
  await entered;
  e.auth.rotateToken();
  release();
  await assert.rejects(pending,/RESTORE01 authenticated owner\/session changed/);
  assert.deepEqual((await snapshot(e.db)).rows,before.rows);
  assert.equal(e.auth.cloudChanged,0);
 }finally{bridge.dispose();}
}));
test('PHOTO127 callback sign-out after atomic commit blocks wrong-owner cloud changed notification',()=>scenario(async e=>{
 let resolved=false;
 const bridge=await createNativeRestore01({win:e.auth.win,db:e.db,board:e.board,
  onRestored:async()=>{
   await Promise.resolve();
   e.auth.switchOwner('OTHER-'+randomUUID());
   resolved=true;
  }});
 try{
  await assert.rejects(bridge.importBackup(e.backup,{confirm:async()=>true}),
   /RESTORE01 authenticated owner\/session changed/);
  assert.equal(resolved,true);
  assert.equal(e.auth.cloudChanged,0,'sign-out during async onRestored cannot publish to the next account');
  const row=(await snapshot(e.db)).rows.items[0];
  assert.equal(row.originalPhoto.image,img(original));
  assert.equal(row.segmentHint.cutoutImage,img(crop));
  // The already-committed atomic restore cannot be rolled back after oncomplete.
  // This test does NOT claim no database write for post-commit sign-out.
 }finally{bridge.dispose();}
}));
test('PHOTO127 refuses invisible 3D preview changes during owner approval without writes',()=>scenario(async e=>{
 const bridge=await createNativeRestore01({win:e.auth.win,db:e.db,board:e.board});
 try{
  const before=await snapshot(e.db);
  const r=bridge.importBackup(e.backup,{confirm:async()=>{
   e.auth.win.native3D05Bridge={state:()=>({active:true})};
   return true;
  }});
  await assert.rejects(r,/RESTORE01 close the active 3D preview/);
  assert.deepEqual((await snapshot(e.db)).rows,before.rows);
  assert.equal(e.auth.cloudChanged,0);
 }finally{bridge.dispose();}
}));
test('PHOTO127 source contract requires explicit async approval and last owner recheck',()=>{
 const source=readFileSync('research/restore-atomic-01/native-restore-bridge.mjs','utf8');
 for(const part of [
  'const approved=await confirm(',
  'if(approved!==true)return {cancelled:true,originalUntouched:true};',
  'await onRestored();',
  'assertLease();\n   win.closetCloud?.changed?.();',
  "productionAuthorized:false,familyAlpha:'HOLD'"
 ])assert.ok(source.includes(part),part);
});
