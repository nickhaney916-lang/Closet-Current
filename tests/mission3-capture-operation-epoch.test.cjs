'use strict';
// Mission 3. Extract the actual current and pinned-parent app.js functions.
// Prove an in-flight old owner must not reset a newly signed-in owner's media
// element, capture controls, camera flag or gallery import result.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const baseline=process.env.EXPECT_BASELINE==='1';
const app=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const extract=(a,b)=>{
 const start=app.indexOf(a),end=app.indexOf(b,start);
 assert.ok(start>=0&&end>start,'actual app function missing: '+a);
 return app.slice(start,end);
};
const videoSource=extract('async function upload(file){',"$('upload').onchange");
const gallerySource=extract('async function importClothingPhotos(files){',"$('clothingPhotos').onchange");
const captureSource=extract('async function captureProofPhoto(){','function reportCaptureCommitFailure(');
const reportSource=extract('function reportCaptureCommitFailure(','function takePhoto(){');
const lockSource=extract("window.addEventListener('closet:session-locked',()=>{",'function message(t){');
const ownerA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ownerB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const image='data:image/jpeg;base64,/9j/';
const proof={image,sourceSHA256:'a'.repeat(64),sourceHashVerified:true,originalPhoto:{image,sha256:'a'.repeat(64)}};
function deferred(){
 let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});return {promise,resolve,reject};
}
function videoFixture({switchOwner=true}={}){
 let owner=ownerA,n=0;
 const calls=[],oldDB={name:'closet-current-user-'+ownerA},nextDB={name:'closet-current-user-'+ownerB};
 const elements=new Map(),el=id=>{
  if(!elements.has(id))elements.set(id,{value:id==='interval'?'5':'',textContent:'',hidden:false,classList:{add(){},remove(){}}});
  return elements.get(id);
 };
 const video={src:'',duration:switchOwner?11:0.3,videoWidth:640,videoHeight:480,
  classList:{add(){}},load(){calls.push('video.load');},
  removeAttribute(name){if(name==='src')this.src='';calls.push('video.remove:'+name);}};
 const ctx={
  busy:false,db:oldDB,batch:[],session:0,captureProof01Active:true,captureOperationEpoch:0,
  captureProofOwner:()=>owner,document:{hidden:false},
  stopCamera(){calls.push('stop')},controls:v=>calls.push('controls:'+v),
  $:el,video,waitEvent:async()=>{},snap:()=>image,
  captureProofFromJPEG:async()=>proof,
  async candidate(){
   n++;
   if(n===2&&switchOwner){
    owner=ownerB;ctx.db=nextDB;ctx.captureOperationEpoch++;
    ctx.busy=true;video.src='blob:next-owner';
    el('captureState').textContent='Next owner recording';
    calls.push('NEXT_OWNER_STARTED');
   }
   else ctx.batch.push({id:'owner-a-'+n});
   return true;
  },
  message:t=>calls.push('message:'+t),switchView:t=>calls.push('view:'+t),
  render:()=>calls.push('render'),
  URL:{createObjectURL:()=> 'blob:old-owner',revokeObjectURL:v=>calls.push('revoke:'+v)}
 };
 vm.createContext(ctx);vm.runInContext(videoSource,ctx);
 return {ctx,video,calls,el,get frames(){return n}};
}
test('old video cannot clear next-owner source or unlock next-owner capture in finally',async()=>{
 const f=videoFixture();
 await f.ctx.upload({size:500});
 assert.equal(f.frames,2,'synthetic second frame triggers owner revocation');
 assert.equal(f.ctx.busy,baseline?false:true);
 assert.equal(f.video.src,baseline?'':'blob:next-owner');
 assert.equal(f.el('captureState').textContent,baseline?'Ready for another batch':'Next owner recording');
 assert.equal(f.calls.includes('revoke:blob:old-owner'),true);
 const after=f.calls.slice(f.calls.indexOf('NEXT_OWNER_STARTED')+1);
 assert.equal(after.includes('controls:false'),baseline);
 assert.equal(after.includes('video.load'),baseline);
});
test('completed video under same owner still releases its controls and media URL',async()=>{
 const f=videoFixture({switchOwner:false});
 await f.ctx.upload({size:500});
 assert.equal(f.frames,1);assert.equal(f.ctx.busy,false);
 assert.equal(f.video.src,'');assert.ok(f.calls.includes('controls:false'));
 assert.ok(f.calls.includes('revoke:blob:old-owner'));
 assert.ok(f.calls.includes('view:review'));
});
function galleryFixture(){
 const hold=deferred(),logs=[],oldDB={name:'closet-current-user-'+ownerA},
  nextDB={name:'closet-current-user-'+ownerB};
 let owner=ownerA;
 const window={__lastPhotoImportResult:'NEXT'};
 const ctx={
  busy:false,captureOperationEpoch:0,db:oldDB,session:0,window,batch:[],
  captureProof01Active:true,mobileCameraToCloset75Active:false,
  captureProofOwner:()=>owner,
  stopCamera(){logs.push('stop')},controls:v=>logs.push('controls:'+v),
  message:v=>logs.push('message:'+v),render(){logs.push('render')},
  switchView:v=>logs.push('view:'+v),
  readPhotoBatch:()=>hold.promise,captureProofFromFile:async()=>proof,
  candidate:async()=>true
 };
 vm.createContext(ctx);vm.runInContext(gallerySource,ctx);
 return {ctx,logs,hold,window,switchOwner(){
  owner=ownerB;ctx.db=nextDB;ctx.captureOperationEpoch++;
  ctx.busy=true;logs.push('NEXT_OWNER_STARTED');
 }};
}
test('late gallery results after owner lock cannot report old photos or unlock new capture',async()=>{
 const f=galleryFixture();
 const work=f.ctx.importClothingPhotos([{name:'original.jpeg',size:123}]);
 await Promise.resolve();f.switchOwner();
 f.hold.resolve({added:1,errors:[]});await work;
 assert.equal(f.ctx.busy,baseline?false:true);
 assert.equal(f.window.__lastPhotoImportResult,baseline?f.window.__lastPhotoImportResult:'NEXT');
 if(baseline)assert.equal(f.window.__lastPhotoImportResult.added,1);
 const after=f.logs.slice(f.logs.indexOf('NEXT_OWNER_STARTED')+1);
 assert.equal(after.includes('view:review'),baseline);
 assert.equal(after.includes('controls:false'),baseline);
 assert.equal(after.includes('render'),baseline);
});
test('normal signed-owner gallery import remains functional',async()=>{
 const f=galleryFixture(),operation=f.ctx.importClothingPhotos([{name:'original.jpeg'}]);
 f.hold.resolve({added:1,errors:[]});await operation;
 assert.equal(f.ctx.busy,false);
 assert.equal(f.window.__lastPhotoImportResult.added,1);
 assert.ok(f.logs.includes('view:review'));
 assert.ok(f.logs.includes('controls:false'));
});
test('late live camera proof cannot clear next owner pending capture flag',async()=>{
 const hold=deferred(),ctx={
  captureOperationEpoch:0,cameraRequest:42,captureProofTaking:false,
  stream:{getTracks(){return []}},cameraMode:'manual',document:{hidden:false},
  video:{videoWidth:640,videoHeight:480},
  captureProofOwner:()=>ownerA,snap:()=>image,
  captureProofFromJPEG:()=>hold.promise,candidateCalls:0,
  candidate:async()=>{ctx.candidateCalls++;return true;}
 };
 vm.createContext(ctx);vm.runInContext(captureSource,ctx);
 const operation=ctx.captureProofPhoto();
 assert.equal(ctx.captureProofTaking,true);
 ctx.captureOperationEpoch++;
 ctx.captureProofTaking=true; // new owner has begun a new captured photo
 hold.resolve(proof);
 assert.equal(await operation,baseline,'old proof can finish after logout; fenced proof must stop');
 assert.equal(ctx.candidateCalls,baseline?1:0);
 assert.equal(ctx.captureProofTaking,baseline?false:true);
});
test('revoked old camera failure cannot show former owner warning',()=>{
 const records=[],ctx={captureOperationEpoch:2,render:()=>records.push('render'),
  $:()=>({textContent:''}),message:t=>records.push(t)};
 vm.createContext(ctx);vm.runInContext(reportSource,ctx);
 ctx.reportCaptureCommitFailure(Object.assign(Error('quota'),{code:'CAPTURE_STORAGE_FAILED'}),1);
 assert.equal(records.length,baseline?2:0);
 ctx.reportCaptureCommitFailure(Object.assign(Error('quota'),{code:'CAPTURE_STORAGE_FAILED'}),2);
 assert.equal(records.filter(x=>/remains visible/.test(x)).length,baseline?2:1,
  'parent reports both former and current owner failures; patched code reports only the current owner');
});
test('session lock revokes old blob and releases controls before the new owner begins',()=>{
 const calls=[],handlers={};
 const video={src:'blob:former-owner',getAttribute:()=>video.src,
  removeAttribute(){video.src='';calls.push('video.remove')},
  load(){calls.push('video.load')}};
 const ctx={
  captureOperationEpoch:0,busy:true,captureProofTaking:true,video,
  window:{addEventListener:(n,cb)=>handlers[n]=cb},
  stopCamera:()=>calls.push('stop'),controls:x=>calls.push('controls:'+x),
  localJobs:new Map(),localWorker:null,
  db:{close(){calls.push('db.close')}},items:[{id:'former'}],batch:[{id:'former'}],
  failedDraftCaptures:new Set(['former']),
  URL:{revokeObjectURL:x=>calls.push('revoke:'+x)},
  document:{querySelectorAll:()=>[]}
 };
 vm.createContext(ctx);vm.runInContext(lockSource,ctx);
 handlers['closet:session-locked']();
 assert.equal(ctx.captureOperationEpoch,baseline?0:1);
 assert.equal(ctx.busy,baseline?true:false);
 assert.equal(ctx.captureProofTaking,baseline?true:false);
 assert.equal(video.src,baseline?'blob:former-owner':'');
 assert.equal(calls.includes('controls:false'),!baseline);
 assert.equal(calls.includes('revoke:blob:former-owner'),!baseline);
 assert.equal(ctx.batch.length,0);
 assert.equal(ctx.failedDraftCaptures.size,0);
});
