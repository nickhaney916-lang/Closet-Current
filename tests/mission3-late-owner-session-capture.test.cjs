'use strict';
// Mission 3: execute exact production candidate, persistDraft, and upload
// functions against the green parent and patched code in a controlled VM.
// No private customer data, cloud writes, hosted auth or browser permissions.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {randomUUID}=require('node:crypto');
const vm=require('node:vm');
const baseline=process.env.EXPECT_BASELINE==='1';
const source=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const extract=(a,b)=>{
 const start=source.indexOf(a),end=source.indexOf(b,start);
 assert.ok(start>=0&&end>start,'actual application function unavailable: '+a);
 return source.slice(start,end);
};
const candidateCode=extract('function candidate(image,options={}){','function queueAutomatic(item){');
const persistCode=extract('function persistDraft({required=false}={}){','function readDraft(){');
const uploadCode=extract('async function upload(file){',"$('upload').onchange");
const img='data:image/jpeg;base64,/9j/',sha='a'.repeat(64);
const ownerA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ownerB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const proof={image:img,sourceHashVerified:true,sourceSHA256:sha,
 originalPhoto:{image:img,sha256:sha}};
const opts={sourceProof:proof,requireDraftCommit:true};
function deferred(){
 let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});return {resolve,reject,promise};
}
function candidateFixture({existing=false}={}){
 const deferredCommit=deferred(),batch=[],items=[],failedDraftCaptures=new Set();
 const db={name:'closet-current-user-'+ownerA},session={owner:ownerA};
 const ctx={
  nativeCanonical167Active:true,captureProof01Active:true,
  batch,items,failedDraftCaptures,sessionCapturedIds:new Set(),
  db,crypto:{randomUUID},structuredClone,session:0,
  $:()=>({textContent:'',hidden:false,src:''}),message(){},
  normalizeClothing:x=>({...x}),recordDeviceEvent(){},
  queueAutomatic(){},persistDraft(){return deferredCommit.promise;},
  captureProofOwner:()=>session.owner
 };
 vm.createContext(ctx);vm.runInContext(candidateCode,ctx);
 if(existing){
  const record={id:randomUUID(),image:img,sourceSHA256:sha,ownerId:ownerA,
   sourceHashVerified:true,originalPhoto:structuredClone(proof.originalPhoto)};
  batch.push(record);failedDraftCaptures.add(record.id);
 }
 return {ctx,db,batch,items,failedDraftCaptures,commit:deferredCommit,
  logout(){
   session.owner=ownerB;ctx.db={name:'closet-current-user-'+ownerB};
   ctx.batch=[];failedDraftCaptures.clear();
  }
 };
}
test('late initial owner JPEG save rejection cannot revive retry marker after signout',async()=>{
 const f=candidateFixture();
 const result=f.ctx.candidate(img,opts);
 assert.equal(f.batch.length,1);const savedId=f.batch[0].id;
 f.logout();
 f.commit.reject(Error('late owner write failed'));
 await assert.rejects(result,/late owner write failed/);
 assert.equal(f.failedDraftCaptures.has(savedId),baseline,
  'old implementation revives the cleared marker; new implementation must not');
 assert.equal(f.ctx.batch.length,0);
});
test('late failed retry after owner revocation cannot repopulate any old marker',async()=>{
 const f=candidateFixture({existing:true}),savedId=f.batch[0].id;
 const result=f.ctx.candidate(img,opts);assert.equal(typeof result?.then,'function');
 f.logout();f.commit.reject(Error('late retry failed'));
 await assert.rejects(result,/late retry failed/);
 assert.equal(f.failedDraftCaptures.has(savedId),baseline);
});
test('a same-owner quota error still exposes a safe retry marker',async()=>{
 const f=candidateFixture(),result=f.ctx.candidate(img,opts);
 const id=f.batch[0].id;f.commit.reject(Error('device quota exceeded'));
 await assert.rejects(result,/device quota exceeded/);
 assert.equal(f.failedDraftCaptures.has(id),true);
 assert.equal(f.batch.length,1);
});

test('old delayed private transaction failure does not display warning in next owner session',async()=>{
 const hold=deferred(),previous={name:'closet-current-user-'+ownerA},
  currentOwner={user:{id:ownerA},assertCurrent(){}}, messages=[];
 const ctx={db:previous,batch:[],structuredClone,window:{closetAuth:currentOwner},
  queued:()=>hold.promise,message:text=>messages.push(text)};
 vm.createContext(ctx);vm.runInContext(persistCode,ctx);
 const result=ctx.persistDraft({required:true});
 currentOwner.user={id:ownerB};ctx.db={name:'closet-current-user-'+ownerB};
 hold.reject(Error('old queue failed after user signed out'));
 await assert.rejects(result,/Capture photo is in review but not saved/);
 assert.equal(messages.length,baseline?1:0,'no stale owner warning in the next session');
});
test('current signed-in owner retains actionable device-storage warning',async()=>{
 const hold=deferred(),previous={name:'closet-current-user-'+ownerA},
  currentOwner={user:{id:ownerA},assertCurrent(){}},messages=[];
 const ctx={db:previous,batch:[],structuredClone,window:{closetAuth:currentOwner},
  queued:()=>hold.promise,message:text=>messages.push(text)};
 vm.createContext(ctx);vm.runInContext(persistCode,ctx);
 const result=ctx.persistDraft({required:true});
 hold.reject(Error('device storage full'));
 await assert.rejects(result,/Capture photo is in review but not saved/);
 assert.equal(messages.length,1);
 assert.match(messages[0],/could not be backed up/);
});
function videoFixture(){
 const calls=[],ownerDB={name:'closet-current-user-'+ownerA},els=new Map();
 const elem=id=>{
  if(!els.has(id))els.set(id,{value:id==='interval'?'5':'',textContent:'',
   hidden:false,classList:{add(){}},set src(x){},removeAttribute(){}});
  return els.get(id);
 };
 let owner=ownerA,processed=0;
 const ctx={
  busy:false,db:ownerDB,batch:[],session:0,captureProof01Active:true,
  document:{hidden:false},captureProofOwner:()=>owner,
  $:elem,stopCamera(){calls.push('stop')},controls:x=>calls.push('controls:'+x),
  video:{duration:11,videoWidth:320,videoHeight:240,src:'',
   classList:{add(){}},removeAttribute(){},load(){}},
  waitEvent:async()=>{},snap:()=>img,
  captureProofFromJPEG:async()=>proof,
  async candidate(){
   processed++;
   if(processed===2){owner=ownerB;ctx.db={name:'closet-current-user-'+ownerB};ctx.batch=[];}
   else ctx.batch.push({id:'old-frame'});
   return true;
  },
  message:text=>calls.push('message:'+text),
  switchView:x=>calls.push('view:'+x),render:()=>calls.push('render'),
  URL:{createObjectURL:()=> 'blob:video',revokeObjectURL:()=>calls.push('revoke')},
  console
 };
 vm.createContext(ctx);vm.runInContext(uploadCode,ctx);
 return {ctx,calls,get processed(){return processed}};
}
test('revoked video lease never navigates or echoes former owner frames into next owner UI',async()=>{
 const f=videoFixture();
 await f.ctx.upload({size:100});
 assert.equal(f.processed,2);
 assert.equal(f.calls.includes('revoke'),true);
 const crossOwnerMessages=f.calls.filter(x=>x.startsWith('message:'));
 assert.equal(f.calls.includes('view:review'),baseline);
 assert.equal(crossOwnerMessages.length>0,baseline);
});
