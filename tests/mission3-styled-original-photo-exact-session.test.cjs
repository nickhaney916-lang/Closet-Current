'use strict';
// Mission 3: run actual native Style saved-photo lookup plus the P165 real
// original SHA/owner-approved photo verification module. All data synthetic.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createHash,webcrypto}=require('node:crypto');
const vm=require('node:vm');
const {verifyOwnerSavedPhoto165,verifyLegacySavedPhoto165}=
 await import('../public/style-photo-preview-gate-165.mjs');
globalThis.crypto??=webcrypto;
const source=readFileSync('public/closet-stylist.js','utf8');
const previewSource=readFileSync('public/style-photo-preview-gate-165.mjs','utf8');
const i=source.indexOf('function currentPhotoOwnerSession167(){');
const j=source.indexOf('async function mountOriginalPhotoPreview167(){',i);
assert.ok(i>=0&&j>i,'Missing source of signed owner photo-reader adapter');
const readerSource=source.slice(i,j);
const jpeg=Buffer.concat([Buffer.from([255,216]),Buffer.alloc(180,58),Buffer.from([255,217])]);
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
function deferred(){let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
const makeOwner=(id='owner-A')=>({user:{id},assertCurrent(){}});
function reader(){
 const auth=makeOwner(),db={name:'closet-current-user-owner-A'};
 const nodes={authGate:{hidden:true},appShell:{hidden:false}};
 let token='unchanged-local-token',onRead=async()=>[{id:'A'}];
 const ctx={window:{closetAuth:auth},db,captureOperationEpoch:7,
  localStorage:{getItem(){return JSON.stringify({epoch:token})}},
  $(name){return nodes[name]},
  readAll(){return onRead()}};
 vm.createContext(ctx);vm.runInContext(readerSource,ctx);
 return {ctx,auth,db,nodes,run:()=>ctx.signedOwnerSavedRows167(),
  setRead(fn){onRead=fn},
  swap(){ctx.window.closetAuth=makeOwner('owner-B');ctx.db={name:'closet-current-user-owner-B'};ctx.captureOperationEpoch++},
  relogin(){ctx.window.closetAuth=makeOwner('owner-A');ctx.db={name:'closet-current-user-owner-A'};ctx.captureOperationEpoch++},
  authRef(){ctx.window.closetAuth=makeOwner('owner-A')},
  dbRef(){ctx.db={name:'closet-current-user-owner-A'}},
  rotate(){ctx.captureOperationEpoch++},
  changeToken(){token='new-token'},
  signOut(){nodes.authGate.hidden=false}
 };
}
test('current native Style session includes exact signed auth and database handles',()=>{
 const f=reader(),s=f.ctx.currentPhotoOwnerSession167();
 assert.equal(s.authenticated,true);assert.equal(s.authRef,f.auth);
 assert.equal(s.privateDbRef,f.db);assert.equal(s.operationEpoch,7);
 assert.equal(s.privateDbName,'closet-current-user-owner-A');
});
test('normal signed-owner original photo reader waits for persisted clothes',async()=>{
 const f=reader(),wait=deferred();f.setRead(()=>wait.promise);
 const job=f.run();wait.resolve([{id:'owner-A-clothing'}]);const result=await job;
 assert.equal(result[0].id,'owner-A-clothing');
});
for(const [name,change] of [
 ['account switch',f=>f.swap()],
 ['same-ID relogin',f=>f.relogin()],
 ['auth object replacement with same ID and unchanged token',f=>f.authRef()],
 ['private DB object replacement with same name',f=>f.dbRef()],
 ['capture epoch rotation',f=>f.rotate()],
 ['local token epoch replacement',f=>f.changeToken()],
 ['sign out while original photo read pending',f=>f.signOut()]
]){
 test('inflight private closet photo read refuses '+name,async()=>{
  const f=reader(),gate=deferred(),began=deferred();
  f.setRead(()=>{began.resolve();return gate.promise});
  const run=f.run();await began.promise;change(f);gate.resolve([{id:'old-garment-A'}]);
  await assert.rejects(run,/Owner changed/);
 });
}
test('private photo lookup rejects missing DB and visible signed-out gate',async()=>{
 const f=reader();f.db.name='wrong-db';
 await assert.rejects(f.run(),/Private owner session is unavailable/);
 f.db.name='closet-current-user-owner-A';f.signOut();
 await assert.rejects(f.run(),/Private owner session is unavailable/);
});
test('private photo lookup checks revoked auth even when owner identity unchanged',async()=>{
 const f=reader(),gate=deferred(),start=deferred();
 f.setRead(()=>{start.resolve();return gate.promise});
 const run=f.run();await start.promise;
 f.auth.assertCurrent=()=>{throw Error('revoked')};
 gate.resolve([{id:'A'}]);await assert.rejects(run,/revoked/);
});
function verifiedRecord(ownerId='owner-A'){
 return {id:'real-synthetic-jpeg',ownerId,name:'Test synthetic blouse',itemType:'Blouse',
  category:'Tops',image:photo,originalPhoto:{image:photo,sha256:sha},
  sourceSHA256:sha,sourcePhotoOriginal:true,sourceHashVerified:true,
  userAdjusted:true,ownerReviewed:true};
}
function verificationSession(){
 const authRef=makeOwner(),privateDbRef={name:'closet-current-user-owner-A'};
 const state={authenticated:true,ownerId:'owner-A',epoch:'same-token',
  privateDbName:'closet-current-user-owner-A',
  authRef,privateDbRef,operationEpoch:14};
 return {state,get:()=>({...state})};
}
test('canonical SHA verified original photo stays 2D and privately owner reviewed',async()=>{
 const f=verificationSession(),row=verifiedRecord();
 const value=await verifyOwnerSavedPhoto165({
  item:row,getSession:f.get,readOwnerItems:async()=>[row]
 });
 assert.equal(value.sourceSHA256,sha);
 assert.equal(value.presentationMode,'verified-original-photo-2d');
 assert.equal(value.garmentActuallyFittedIn3D,false);
 assert.equal(value.originalPhotoStillPrivate,true);
});
for(const [label,change] of [
 ['same-user login auth replacement',s=>s.authRef=makeOwner()],
 ['same-named database connection replacement',s=>s.privateDbRef={name:'closet-current-user-owner-A'}],
 ['same-account capture epoch rotation',s=>s.operationEpoch++],
 ['owner account changed',s=>s.ownerId='owner-B'],
 ['persisted epoch changed',s=>s.epoch='different'],
 ['owner-private DB name changed',s=>s.privateDbName='wrong-db']
]){
 test('canonical original digest rejects '+label+' during in-flight private saved read',async()=>{
  const f=verificationSession(),row=verifiedRecord(),gate=deferred(),started=deferred();
  const job=verifyOwnerSavedPhoto165({item:row,getSession:f.get,
   readOwnerItems:()=>{started.resolve();return gate.promise}});
  await started.promise;change(f.state);gate.resolve([row]);
  await assert.rejects(job,/Account changed|Sign in to your current private wardrobe/);
 });
}
test('legacy photo remains unverified source but same-session private saved',async()=>{
 const f=verificationSession(),row={id:'legacy-photo',ownerId:'owner-A',image:photo,
  userAdjusted:true,category:'Tops',itemType:'Blouse'};
 const value=await verifyLegacySavedPhoto165({
  item:row,getSession:f.get,readOwnerItems:async()=>[row]});
 assert.equal(value.presentationMode,'saved-photo-unverified-original-2d');
 assert.equal(value.originalSourceIndependentlyVerified,false);
 assert.equal(value.garmentActuallyFittedIn3D,false);
});
test('legacy unverified photo rejects same-ID relogin during saved read',async()=>{
 const f=verificationSession(),row={id:'legacy-photo',ownerId:'owner-A',image:photo,
  userAdjusted:true,category:'Tops',itemType:'Blouse'};
 const gate=deferred(),started=deferred();
 const run=verifyLegacySavedPhoto165({item:row,getSession:f.get,
  readOwnerItems:()=>{started.resolve();return gate.promise}});
 await started.promise;f.state.authRef=makeOwner();gate.resolve([row]);
 await assert.rejects(run,/Account changed/);
});
test('owner review is still mandatory for canonical original preview',async()=>{
 const f=verificationSession(),row=verifiedRecord();row.ownerReviewed=false;
 await assert.rejects(verifyOwnerSavedPhoto165({
  item:row,getSession:f.get,readOwnerItems:async()=>[row]}),/owner review/);
});
test('an original JPEG whose saved source identity changed is refused',async()=>{
 const f=verificationSession(),row=verifiedRecord();
 row.sourceSHA256='e'.repeat(64);
 await assert.rejects(verifyOwnerSavedPhoto165({
  item:row,getSession:f.get,readOwnerItems:async()=>[row]}),/Original source identity|source changed/);
});
test('source contains lease checks and generic-only visible errors/button cleanup',()=>{
 for(const marker of ['authRef:s.authRef||null','privateDbRef:s.privateDbRef||null',
  'a.authRef===b.authRef','a.privateDbRef===b.privateDbRef',
  'a.operationEpoch===b.operationEpoch','originalOwnerStillCurrent',
  'Could not verify this saved photo. Reopen My Closet and try again.',
  'same(ownerAtClick,requireLive(getSession))'])
  assert.ok(previewSource.includes(marker),'missing original-photo same-owner source guard: '+marker);
 for(const marker of ['authRef:a,privateDbRef:db,operationEpoch:captureOperationEpoch',
  'now.authRef===start.authRef','now.privateDbRef===start.privateDbRef',
  'now.operationEpoch===start.operationEpoch'])
  assert.ok(source.includes(marker),'missing native saved-read exact session guard: '+marker);
 assert.ok(!previewSource.includes("createAlert(String(error?.message"));
});
