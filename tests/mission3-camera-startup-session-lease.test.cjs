'use strict';
// MISSION 3: execute the actual startCamera function in a restricted VM.
// A revoked owner's pending AudioContext, getUserMedia, or video.play promise
// must not touch the next owner's active capture state or controls.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const baseline=process.env.EXPECT_BASELINE==='1';
const app=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const start=app.indexOf('async function startCamera(mode){');
const end=app.indexOf("if(typeof captureProof01Active!=='undefined'&&captureProof01Active)$('captureCameraFacingWrap')",start);
assert.ok(start>=0&&end>start,'real camera startup source must be present');
const source=app.slice(start,end);
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});
 return {promise,resolve,reject};
}
function fixture(){
 const audioHold=deferred(),permission=deferred(),playHold=deferred(),playEntered=deferred();
 const events=[],elements=new Map();
 let cameraRequests=0,stops=0;
 const $=id=>{
  if(!elements.has(id))elements.set(id,{
   value:id==='captureCameraFacing'?'environment':'5',textContent:'',hidden:false,
   classList:{add(){},remove(){}}
  });
  return elements.get(id);
 };
 const track={stop(){stops++;},addEventListener(){}};
 const acquired={getTracks:()=>[track]};
 const video={
  srcObject:null,classList:{add(){},remove(){}},removeAttribute(){},
  play(){playEntered.resolve();return playHold.promise;}
 };
 class AudioContext {resume(){return audioHold.promise;}}
 const ctx={
  busy:false,stream:null,cameraMode:null,cameraOpening:false,cameraRequest:0,
  captureOperationEpoch:0,captureProof01Active:true,
  timer:null,session:5,audio:null,cadence:null,
  video,document:{hidden:false},navigator:{mediaDevices:{
   getUserMedia(){cameraRequests++;return permission.promise;}
  }},
  window:{AudioContext},$,message:v=>events.push('message:'+v),
  controls:v=>events.push('controls:'+v),
  stopCamera(){this.cameraRequest++;this.cameraOpening=false;this.stream=null;this.busy=false;},
  CaptureCadence:class{},setInterval:()=>1,clearInterval:()=>{},Date,Math,Number,Error
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 function switchOwner(){
  ctx.captureOperationEpoch++;
  ctx.cameraRequest++;
  ctx.cameraOpening=false;ctx.stream=null;ctx.cameraMode=null;
  video.srcObject=null;ctx.busy=true;ctx.session=9;
  $('sessionCount').textContent='9';
  $('captureState').textContent='New owner is capturing';
  $('lastCaptureImage').hidden=false;
  events.push('NEXT_OWNER_STARTED');
 }
 return {ctx,$,events,video,acquired,audioHold,permission,playHold,playEntered,
  switchOwner,get cameraRequests(){return cameraRequests;},get stops(){return stops;}};
}
test('late old video.play result cannot reset next owner camera counters or controls',async()=>{
 const f=fixture();
 const opening=f.ctx.startCamera('manual');
 f.audioHold.resolve();await Promise.resolve();
 f.permission.resolve(f.acquired);await f.playEntered.promise;
 f.switchOwner();f.playHold.resolve();await opening;
 assert.equal(f.ctx.session,baseline?0:9);
 assert.equal(f.$('sessionCount').textContent,baseline?'0':'9');
 assert.equal(f.$('captureState').textContent,'New owner is capturing');
 assert.equal(f.$('lastCaptureImage').hidden,baseline?true:false);
 assert.equal(f.ctx.busy,baseline?false:true);
 assert.equal(f.events.slice(f.events.indexOf('NEXT_OWNER_STARTED')+1).includes('controls:false'),baseline);
});
test('late old camera permission finalizer cannot unlock newer owner video import',async()=>{
 const f=fixture();
 const opening=f.ctx.startCamera('manual');
 f.audioHold.resolve();await Promise.resolve();
 f.switchOwner();f.permission.resolve(f.acquired);await opening;
 assert.equal(f.stops,1,'revoked tracks must be stopped');
 assert.equal(f.ctx.busy,baseline?false:true);
 assert.equal(f.events.slice(f.events.indexOf('NEXT_OWNER_STARTED')+1).includes('controls:false'),baseline);
});
test('delayed AudioContext.resume never requests camera permission after logout',async()=>{
 const f=fixture(),opening=f.ctx.startCamera('manual');
 f.switchOwner();f.audioHold.resolve();
 await Promise.resolve();await Promise.resolve();
 assert.equal(f.cameraRequests,baseline?1:0);
 if(baseline)f.permission.resolve(f.acquired);
 await opening;
 assert.equal(f.ctx.busy,baseline?false:true);
});
test('ordinary same-owner start still resets session and enables manual shutter',async()=>{
 const f=fixture(),opening=f.ctx.startCamera('manual');
 f.audioHold.resolve();await Promise.resolve();
 f.permission.resolve(f.acquired);await f.playEntered.promise;
 f.playHold.resolve();await opening;
 assert.equal(f.cameraRequests,1);
 assert.equal(f.ctx.session,0);
 assert.equal(f.ctx.busy,false);
 assert.equal(f.ctx.cameraOpening,false);
 assert.equal(f.ctx.stream,f.acquired);
 assert.equal(f.$('cameraActions').hidden,false);
 assert.equal(f.$('takePhoto').hidden,false);
 assert.ok(f.events.includes('controls:true'));
 assert.ok(f.events.includes('message:Take each photo at your own pace. Tap Done when you are finished.'));
});
