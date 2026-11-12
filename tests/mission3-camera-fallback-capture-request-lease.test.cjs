'use strict';
// Mission 3: extract the exact deployed-app controller source, not a mirror.
// Both the verified parent and fixed branch are executed in sandboxed Node VMs.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
function source(a,b){
 const i=app.indexOf(a),j=app.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Required actual app function missing: '+a);
 return app.slice(i,j);
}
const startSource=source('async function startCamera(mode){',"if(typeof captureProof01Active!=='undefined'&&captureProof01Active)$('captureCameraFacingWrap').hidden=false;");
const captureSource=source('async function captureProofPhoto(){','function reportCaptureCommitFailure(');
const stopSource=source('function stopCamera(){','function controls(disabled){');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
const error=name=>Object.assign(Error('Camera unavailable'),{name});
function cameraFixture({permission,waitAudio}={}){
 const els=new Map(),events=[];
 const $=id=>{
  if(!els.has(id))els.set(id,{textContent:'',hidden:false,disabled:false,value:id==='interval'?'5':'environment',classList:{add(){},remove(){}}});
  return els.get(id);
 };
 const first=deferred(),entered=deferred();
 let calls=0,stopped=0;
 const media={getTracks:()=>[{stop(){stopped++;}}]};
 class AudioContext{resume(){return waitAudio?.promise||Promise.resolve();}}
 const ctx={
  cameraRequest:0,captureOperationEpoch:0,cameraOpening:false,busy:false,stream:null,
  cameraMode:null,session:3,captureProof01Active:true,audio:null,
  document:{hidden:false},window:{AudioContext},
  navigator:{mediaDevices:{getUserMedia(constraints){
   calls++;events.push(constraints.video===true?'fallback':'preferred');
   if(permission)return permission(constraints,calls,media,first,entered);
   if(calls===1){entered.resolve();return first.promise;}
   return Promise.resolve(media);
  }}},
  video:{srcObject:null,removeAttribute(){},classList:{add(){},remove(){}},play:()=>Promise.resolve()},
  $,
  controls:disabled=>events.push('controls:'+disabled),
  message:t=>events.push('message:'+t),
  stopCamera(){events.push('stopCamera');ctx.cameraRequest++;ctx.cameraOpening=false;ctx.stream=null;ctx.busy=false;ctx.controls(false);},
 };
 vm.createContext(ctx);
 vm.runInContext(startSource,ctx);
 return {ctx,events,media,entered,first,els,get calls(){return calls;},get stopped(){return stopped;}};
}
test('old preferred-camera rejection after logout never issues fallback permission request',async()=>{
 const f=cameraFixture(),opening=f.ctx.startCamera('manual');
 await f.entered.promise;
 f.ctx.captureOperationEpoch++;f.ctx.cameraRequest++;
 f.first.reject(error('OverconstrainedError'));
 await opening;
 assert.deepEqual(f.events.filter(x=>x==='fallback'),baseline?['fallback']:[]);
 assert.equal(f.calls,baseline?2:1);
 assert.equal(f.ctx.stream,null);
});
test('Stop/Done before preferred-camera rejection cannot reopen a camera under the old request',async()=>{
 const f=cameraFixture(),opening=f.ctx.startCamera('manual');
 await f.entered.promise;
 f.ctx.cameraRequest++;f.ctx.cameraOpening=false;
 f.first.reject(error('NotFoundError'));
 await opening;
 assert.equal(f.calls,baseline?2:1);
 assert.equal(f.ctx.stream,null);
});
test('backgrounding during preferred-camera rejection does not attempt a second camera request',async()=>{
 const f=cameraFixture(),opening=f.ctx.startCamera('manual');
 await f.entered.promise;f.ctx.document.hidden=true;
 f.first.reject(error('NotReadableError'));
 await opening;
 assert.equal(f.calls,baseline?2:1);
 assert.equal(f.ctx.cameraOpening,false,'active hidden start must release opening flag');
 assert.equal(f.ctx.busy,false);
 assert.ok(f.events.some(v=>v==='controls:false'));
});
test('backgrounded while optional AudioContext resumes never requests camera permission',async()=>{
 const audio=deferred(),f=cameraFixture({waitAudio:audio,permission:(_options,_n,media)=>Promise.resolve(media)});
 const opening=f.ctx.startCamera('manual');
 f.ctx.document.hidden=true;
 audio.resolve();
 await opening;
 assert.equal(f.calls,baseline?1:0);
 assert.equal(f.ctx.cameraOpening,false);
 assert.equal(f.ctx.busy,false);
});
test('legitimate unsupported facing camera still falls back and starts manual mode',async()=>{
 const f=cameraFixture({permission:(_options,n,media)=>{
  if(n===1)return Promise.reject(error('OverconstrainedError'));
  return Promise.resolve(media);
 }});
 await f.ctx.startCamera('manual');
 assert.equal(f.calls,2);
 assert.equal(f.ctx.cameraMode,'manual');
 assert.equal(f.ctx.cameraOpening,false);
 assert.equal(f.ctx.busy,false);
 assert.equal(f.ctx.stream,f.media);
});
test('actual denied camera permission never triggers fallback on either version',async()=>{
 const f=cameraFixture({permission:()=>Promise.reject(error('NotAllowedError'))});
 await f.ctx.startCamera('manual');
 assert.equal(f.calls,1);
 assert.equal(f.ctx.stream,null);
 assert.ok(f.events.some(v=>v.includes('permission was denied')));
});
function captureFixture(){
 const proof1=deferred(),proof2=deferred(),events=[];
 const els=new Map(),$=id=>{
  if(!els.has(id))els.set(id,{textContent:'',hidden:false,disabled:false,classList:{add(){},remove(){}}});
  return els.get(id);
 };
 let calls=0,candidateCalls=0;
 const makeStream=()=>({getTracks:()=>[{stop(){events.push('track.stop');}}]});
 const ctx={
  captureOperationEpoch:0,cameraRequest:0,cameraOpening:false,
  captureProofTaking:false,cameraMode:'manual',stream:makeStream(),
  captureProofOwner:()=> 'owner-A',document:{hidden:false},
  $,
  video:{videoWidth:640,videoHeight:480,srcObject:null,classList:{remove(){}},removeAttribute(){}},
  snap:()=> 'data:image/jpeg;base64,fixture',
  captureProofFromJPEG:()=>{calls++;return calls===1?proof1.promise:proof2.promise;},
  candidate:async()=>{candidateCalls++;return true;},
  controls:disabled=>events.push('controls:'+disabled),
  message:t=>events.push('message:'+t),
  cameraChoices:{hidden:false},timer:null,
  clearInterval:()=>{},
  session:0,
 };
 vm.createContext(ctx);
 vm.runInContext(stopSource+'\n'+captureSource,ctx);
 return {ctx,proof1,proof2,events,makeStream,get proofCalls(){return calls;},get candidates(){return candidateCalls;}};
}
const photo={image:'data:image/jpeg;base64,fixture',sourceSHA256:'a'.repeat(64),sourceHashVerified:true,originalPhoto:{sha256:'a'.repeat(64)}};
test('stopping while original JPEG verifies immediately releases camera capture guard',async()=>{
 const f=captureFixture(),old=f.ctx.captureProofPhoto();
 assert.equal(f.ctx.captureProofTaking,true);
 f.ctx.stopCamera();
 assert.equal(f.ctx.captureProofTaking,baseline?true:false);
 f.proof1.resolve(photo);assert.equal(await old,false);
 assert.equal(f.candidates,0);
});
test('restarted camera captures immediately while previous original is still verifying',async()=>{
 const f=captureFixture(),old=f.ctx.captureProofPhoto();
 f.ctx.stopCamera();
 f.ctx.stream=f.makeStream();f.ctx.cameraMode='manual';
 const next=f.ctx.captureProofPhoto();
 assert.equal(f.proofCalls,baseline?1:2);
 f.proof1.resolve(photo);
 assert.equal(await old,false);
 assert.equal(f.ctx.captureProofTaking,baseline?false:true,'old finalizer cannot release newer active capture');
 f.proof2.resolve(photo);
 assert.equal(await next,baseline?false:true);
 assert.equal(f.ctx.captureProofTaking,false);
 assert.equal(f.candidates,baseline?0:1);
});
test('same-camera successful JPEG capture returns true and unlocks shutter after durable review',async()=>{
 const f=captureFixture(),p=f.ctx.captureProofPhoto();
 f.proof1.resolve(photo);assert.equal(await p,true);
 assert.equal(f.candidates,1);
 assert.equal(f.ctx.captureProofTaking,false);
});
test('same-camera failed JPEG verification releases the active shutter lock',async()=>{
 const f=captureFixture(),p=f.ctx.captureProofPhoto().catch(e=>e);
 f.proof1.reject(Error('SHA verification failed'));
 const err=await p;
 assert.match(err.message,/SHA verification failed/);
 assert.equal(f.ctx.captureProofTaking,false);
 assert.equal(f.candidates,0);
});
