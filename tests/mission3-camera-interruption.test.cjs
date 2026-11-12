'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync((process.env.CAMERA_SOURCE_ROOT||'.')+'/public/app.js','utf8');
const baseline=process.env.EXPECT_BASELINE==='1';
const one=source.slice(source.indexOf('function stopCamera(){'),source.indexOf('function controls(disabled)'));
const two=source.slice(source.indexOf('async function startCamera(mode){'),source.indexOf("$('start').onclick"));
const three=source.slice(source.indexOf('function captureTick(now=Date.now()){'),source.indexOf('async function captureProofPhoto(){'));
const pauseStart=source.indexOf('function pauseCameraOnInterruption(){');
const pause=pauseStart<0?'':source.slice(pauseStart,source.indexOf('function saveMemoryReview(value)',pauseStart));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};};
function media(){let stops=0;const track={stop(){stops++;},addEventListener(){}};return {getTracks(){return [track];},get stops(){return stops;}};}
function harness(grants=[]){
 const elements=new Map(),listeners={document:new Map(),window:new Map()},messages=[];
 const get=id=>{
  if(!elements.has(id))elements.set(id,{value:id==='captureCameraFacing'?'environment':'4',
   hidden:false,disabled:false,textContent:'',classList:{add(){},remove(){}},
   setAttribute(){},removeAttribute(){}});
  return elements.get(id);
 };
 let played=0,controls=[];
 const video={readyState:3,videoWidth:1200,videoHeight:900,srcObject:null,
  classList:{add(){},remove(){}},removeAttribute(){},
  play:async()=>{played++;}};
 const document={hidden:false,addEventListener:(name,fn)=>listeners.document.set(name,fn)};
 const window={addEventListener:(name,fn)=>listeners.window.set(name,fn)};
 const navigator={mediaDevices:{getUserMedia(){const next=grants.shift();if(!next)throw Error('unexpected camera request');return next.promise;}}};
 const context={$,video,document,window,navigator,stream:null,timer:null,busy:false,cameraOpening:false,cameraRequest:0,
  cameraMode:null,session:0,captureOperationEpoch:0,captureProofTaking:false,captureProof01Active:true,mobileCameraToCloset75Active:false,
  canvas:{},audio:null,stable:0,cadence:null,items:[{id:'private-saved'}],batch:[{id:'private-draft'}],
  message:value=>messages.push(value),controls:value=>controls.push(value),
  crypto:{},Date,Number,Math,Error,clearInterval,setInterval};
 function $(id){return get(id);}
 vm.createContext(context);
 vm.runInContext(one+two+three+pause,context);
 return {context,document,window,video,elements,listeners,messages,controls,
  get played(){return played;},
  trigger(type,target='document'){listeners[target].get(type)?.();}
 };
}
test('background interruption stops an active video stream without dropping reviewed or draft pieces',async()=>{
 const grant=deferred(),f=harness([grant]),stream=media();
 const pending=f.context.startCamera('manual');
 assert.equal(f.context.cameraOpening,true);
 f.context.stopCamera();
 grant.resolve(stream);await pending;
 assert.equal(stream.stops,1);
 assert.equal(f.context.stream,null);
 assert.deepEqual(f.context.batch.map(x=>x.id),['private-draft']);
 assert.deepEqual(f.context.items.map(x=>x.id),['private-saved']);
});
test('hidden visibility revokes active track, releases controls, and preserves private items',async()=>{
 const grant=deferred(),f=harness([grant]),stream=media();
 const opening=f.context.startCamera('manual');grant.resolve(stream);await opening;
 assert.equal(f.context.stream,stream);f.document.hidden=true;f.trigger('visibilitychange');
 if(baseline){
  assert.equal(f.context.stream,stream,'baseline lacks camera visibility shutdown');
 }else{
  assert.equal(f.context.stream,null);
  assert.equal(stream.stops,1);assert.equal(f.context.busy,false);
  assert.match(f.elements.get('captureState').textContent,/Camera paused/);
  assert.deepEqual(f.context.batch.map(x=>x.id),['private-draft']);
  assert.ok(f.messages.some(x=>x.includes('background')));
 }
});
test('camera permission granted after page is hidden never exposes a background stream',async()=>{
 const grant=deferred(),f=harness([grant]),stream=media();
 const opening=f.context.startCamera('manual');
 f.document.hidden=true;f.trigger('visibilitychange');
 grant.resolve(stream);await opening;
 if(baseline){
  assert.equal(f.context.stream,stream);
  assert.equal(stream.stops,0);
 }else{
  assert.equal(f.context.stream,null);
  assert.equal(stream.stops,1);
  assert.equal(f.played,0);
  assert.equal(f.context.busy,false);
  assert.deepEqual(f.context.batch.map(x=>x.id),['private-draft']);
 }
});
test('late old permission response cannot unlock a newer pending camera request',async()=>{
 if(baseline)return;
 const first=deferred(),second=deferred(),f=harness([first,second]),oldStream=media(),newStream=media();
 const stale=f.context.startCamera('manual');
 f.document.hidden=true;f.trigger('visibilitychange');
 f.document.hidden=false;
 const fresh=f.context.startCamera('manual');
 assert.equal(f.context.cameraOpening,true);
 first.resolve(oldStream);await stale;
 assert.equal(oldStream.stops,1);
 assert.equal(f.context.busy,true);
 assert.equal(f.context.cameraOpening,true);
 second.resolve(newStream);await fresh;
 assert.equal(f.context.stream,newStream);
 assert.equal(f.context.cameraMode,'manual');
 assert.equal(f.context.busy,false);
 assert.equal(newStream.stops,0);
 f.trigger('pagehide','window');
 assert.equal(newStream.stops,1);
 assert.equal(f.context.stream,null);
});
test('auto-capture timer refuses to capture a hidden frame',()=>{
 if(baseline)return;
 const f=harness([]);
 f.context.stream=media();f.context.cameraMode='auto';
 f.context.cadence={due(){throw Error('capture timer entered hidden page');}};
 f.document.hidden=true;
 assert.doesNotThrow(()=>f.context.captureTick());
});
