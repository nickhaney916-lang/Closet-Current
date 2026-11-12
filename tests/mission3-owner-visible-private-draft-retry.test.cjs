'use strict';
// Execute the ACTUAL source-extracted app.js retry function + candidate, not a
// copied implementation. Baseline mode demonstrates the absent UI/retry action.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {randomUUID}=require('node:crypto');
const vm=require('node:vm');
const source=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const retryStart=source.indexOf('async function retryUncommittedCapture(item){');
const retryEnd=source.indexOf('function renderPhotoResults(grid,results){',retryStart);
const candidateStart=source.indexOf('function candidate(image,options={}){');
const candidateEnd=source.indexOf('function queueAutomatic(item){',candidateStart);
assert.ok(candidateStart>=0&&candidateEnd>candidateStart);
const image='data:image/jpeg;base64,/9j/';
const sha='a'.repeat(64),ownerA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',ownerB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const proof={sourceHashVerified:true,sourceSHA256:sha,image,originalPhoto:{image,sha256:sha}};
const options={sourceProof:proof,requireDraftCommit:true};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function fixture(){
 const db={name:'closet-current-user-'+ownerA},batch=[],items=[],failedDraftCaptures=new Set(),
  sessionCapturedIds=new Set(),pending=new Set(),calls=[],messages=[],queued=[];
 let owner=ownerA,mode='quota',integrity=true,hold=null;
 const context={db,batch,items,failedDraftCaptures,sessionCapturedIds,
  nativeCanonical167Active:true,captureProof01Active:true,session:0,localPending:pending,
  crypto:{randomUUID},structuredClone,normalizeClothing:x=>({...x}),
  captureProofOwner:()=>owner,
  message:text=>messages.push(text),recordDeviceEvent:()=>{},$:(id)=>({textContent:'',hidden:false,src:''}),
  persistDraft({required}){
   assert.equal(required,true);calls.push('write:'+owner);
   return mode==='quota'?Promise.reject(Object.assign(Error('Device quota'),{code:'CAPTURE_STORAGE_FAILED'})):Promise.resolve();
  },
  async captureProof01Module(){return {async verifyStoredCanonical(input){
   calls.push('verify');if(hold)await hold;return integrity&&input.originalPhoto?.sha256===sha&&input.image===image;
  }};},
  queueAutomatic:item=>queued.push(item.id),render:()=>calls.push('render'),
  console
 };
 vm.createContext(context);
 vm.runInContext(source.slice(candidateStart,candidateEnd),context);
 vm.runInContext(source.slice(retryStart,retryEnd),context);
 return {context,db,batch,items,calls,messages,queued,failedDraftCaptures,
  setMode:x=>mode=x,setOwner:x=>owner=x,setIntegrity:x=>integrity=x,setHold:x=>hold=x};
}
if(baseline){
 test('green parent has no visible owner-private draft retry control',()=>{
  assert.equal(retryStart,-1);
  assert.ok(!source.includes("node('button','Retry saving photo'"));
 });
}else{
 test('current review exposes an accessible retry button only for failed original drafts',()=>{
  assert.ok(retryStart>0&&retryEnd>retryStart);
  assert.match(source,/node\('button','Retry saving photo','secondary retry-private-draft'\)/);
  assert.match(source,/retry\.setAttribute\('aria-label','Retry saving this unsaved original photograph privately'\)/);
  assert.match(source,/needsDraftRetry&&item\.ownerId===captureProofOwner\(\)/);
 });
 test('owner can save original in-place from review, no recapture, one draft ID',async()=>{
  const f=fixture();
  await assert.rejects(f.context.candidate(image,options),/Device quota/);
  assert.equal(f.batch.length,1);assert.equal(f.queued.length,0);
  const id=f.batch[0].id;assert.equal(f.failedDraftCaptures.has(id),true);
  f.setMode('success');
  assert.equal(await f.context.retryUncommittedCapture(f.batch[0]),true);
  assert.equal(f.batch.length,1);assert.equal(f.batch[0].id,id);
  assert.equal(f.calls.filter(x=>x.startsWith('write:')).length,2);
  assert.equal(f.calls.filter(x=>x==='verify').length,1);
  assert.equal(f.context.session,1);
  assert.equal(f.queued.length,1);
  assert.equal(f.failedDraftCaptures.has(id),false);
  assert.equal(f.context.candidate(image,options),false,'saved photo remains normal duplicate');
  assert.match(f.messages.at(-1),/saved privately on this device/);
 });
 test('invalid original SHA verifier refuses retry without any storage write',async()=>{
  const f=fixture();
  await assert.rejects(f.context.candidate(image,options),/Device quota/);
  f.setMode('success');f.setIntegrity(false);
  await assert.rejects(f.context.retryUncommittedCapture(f.batch[0]),/integrity/);
  assert.equal(f.calls.filter(x=>x.startsWith('write:')).length,1);
  assert.equal(f.queued.length,0);
  assert.equal(f.failedDraftCaptures.size,1);
 });
 test('owner switch during async SHA verification cannot write foreign draft',async()=>{
  const f=fixture();await assert.rejects(f.context.candidate(image,options),/Device quota/);
  const hold=deferred();f.setHold(hold.promise);f.setMode('success');
  const operation=f.context.retryUncommittedCapture(f.batch[0]);
  for(let i=0;i<8;i++)await Promise.resolve();
  f.setOwner(ownerB);hold.resolve();
  await assert.rejects(operation,/integrity|account/);
  assert.equal(f.calls.filter(x=>x.startsWith('write:')).length,1);
  assert.equal(f.queued.length,0);
 });
 test('owner must still have failed unsaved record, no saved or absent retry',async()=>{
  const f=fixture();await assert.rejects(f.context.candidate(image,options),/Device quota/);
  f.setMode('success');const item=f.batch[0];
  f.items.push(item);
  await assert.rejects(f.context.retryUncommittedCapture(item),/unsaved photograph/);
  f.items.pop();f.batch.pop();
  await assert.rejects(f.context.retryUncommittedCapture(item),/unsaved photograph/);
  assert.equal(f.calls.filter(x=>x.startsWith('write:')).length,1);
 });
 test('second device quota failure leaves retry eligibility and preserved review',async()=>{
  const f=fixture();await assert.rejects(f.context.candidate(image,options),/Device quota/);
  await assert.rejects(f.context.retryUncommittedCapture(f.batch[0]),/Device quota/);
  assert.equal(f.failedDraftCaptures.size,1);
  assert.equal(f.batch.length,1);assert.equal(f.queued.length,0);
  f.setMode('success');assert.equal(await f.context.retryUncommittedCapture(f.batch[0]),true);
  assert.equal(f.failedDraftCaptures.size,0);
 });
}
