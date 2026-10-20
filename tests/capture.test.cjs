const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const source=fs.readFileSync('public/app.js','utf8');
function setup({ready=true,getUserMedia,frameCallbacks=false}={}){
 const els=new Map(),clock={now:0},intervals=new Map();let intervalId=0,stopped=0;const timeouts=new Map();
 const element=id=>{if(!els.has(id))els.set(id,{hidden:false,disabled:false,value:id==='interval'?'5':'',checked:false,classList:{add(){},remove(){}}});return els.get(id);};
 const track={stop(){stopped++;},addEventListener(type,fn){this[type]=fn;}},media={getTracks:()=>[track]};
 const context={stream:null,cameraMode:null,cameraOpening:false,cameraRequest:0,timer:null,busy:false,audio:null,video:{readyState:ready?2:0,videoWidth:ready?1280:0,srcObject:null,removeAttribute(){},classList:{add(){},remove(){}},play:async()=>{}},session:0,batch:[],localReady:false,view:'scan',messageText:'',Date:{now:()=>clock.now},$:element,window:{},navigator:{mediaDevices:{getUserMedia:getUserMedia||(async()=>media)}},setTimeout:fn=>{const id=++intervalId;timeouts.set(id,fn);return id;},clearTimeout:id=>timeouts.delete(id),setInterval:fn=>{intervals.set(++intervalId,fn);return intervalId;},clearInterval:id=>intervals.delete(id),beep(){},snap(){if(!context.video.videoWidth||context.video.readyState<2)throw Error('not ready');return 'same garment frame';}};
 let nextFrame=null,frameId=0;
 if(frameCallbacks){
  context.video.requestVideoFrameCallback=fn=>{nextFrame=fn;return ++frameId;};
  context.video.cancelVideoFrameCallback=id=>{if(id===frameId)nextFrame=null;};
 }
 context.candidate=image=>{context.batch.push({image});context.session++;};
 context.message=text=>context.messageText=text;
 context.switchView=view=>context.view=view;
 vm.createContext(context);vm.runInContext(fs.readFileSync('public/capture.js','utf8')+'\nlet cadence;',context);
 vm.runInContext('function cameraFrameQuality(){return {usable:true};} function cameraStability(){return {stable:true,lowTexture:false};} let previousQualityFrame=null;',context);
 vm.runInContext(source.slice(source.indexOf('let manualStillShot=null'),source.indexOf('function waitEvent')),context);
 return {context,element,clock,intervals,media,track,timeouts,deliverFrame(){if(!nextFrame)throw Error('No pending browser video-frame callback');const frame=nextFrame;nextFrame=null;frame();},poll(){for(const tick of [...intervals.values()])tick();},expire(){for(const [id,fn] of timeouts){timeouts.delete(id);fn();}},stopped:()=>stopped};
}
test('manual camera takes photos only on shutter taps',async()=>{
 const {context:c,clock,intervals}=setup();await c.startCamera('manual');
 assert.equal(intervals.size,0);
 clock.now=20000;c.captureTick();assert.equal(c.session,0);
 c.takePhoto();c.takePhoto();assert.equal(c.session,2);
 c.finishScan();assert.equal(c.view,'review');assert.equal(c.stream,null);
});
test('finishing an empty manual session does not take an unrequested photo',async()=>{
 const {context:c}=setup();await c.startCamera('manual');c.finishScan();
 assert.equal(c.session,0);assert.equal(c.view,'scan');assert.match(c.messageText,/No photos taken/);
});
test('automatic scan waits five seconds and captures even identical garments',async()=>{
 const {context:c,clock,element}=setup();await c.startCamera('auto');
 assert.equal(c.session,0);assert.match(element('captureState').textContent,/5 seconds/);
 for(let t=250;t<=20000;t+=250){clock.now=t;c.captureTick();}
 assert.equal(c.session,4);c.finishScan();assert.equal(c.view,'review');
});
test('automatic interval respects the slower ten-second setting',async()=>{
 const {context:c,clock,element}=setup();element('interval').value='10';await c.startCamera('auto');
 clock.now=9999;c.captureTick();assert.equal(c.session,0);
 clock.now=10000;c.captureTick();assert.equal(c.session,1);
 clock.now=19999;c.captureTick();assert.equal(c.session,1);
 clock.now=20000;c.captureTick();assert.equal(c.session,2);
});
test('delayed camera frames and early shutter taps do not create blank images',async()=>{
 const {context:c,clock}=setup({ready:false});await c.startCamera('auto');clock.now=5000;c.captureTick();assert.equal(c.session,0);
 c.video.readyState=2;c.video.videoWidth=1280;c.captureTick();assert.equal(c.session,1);
 const manual=setup({ready:false}).context;await manual.startCamera('manual');manual.takePhoto();assert.equal(manual.session,0);assert.match(manual.messageText,/still getting ready/);
});
test('quick automatic finish recovers a frame and unavailable video stays on camera page',async()=>{
 const {context:c}=setup();await c.startCamera('auto');c.finishScan();assert.equal(c.session,1);assert.equal(c.view,'review');
 const missing=setup({ready:false}).context;await missing.startCamera('auto');missing.finishScan();assert.equal(missing.view,'scan');assert.match(missing.messageText,/No camera frames/);
});
test('camera denial restores both camera choices',async()=>{
 const {context:c,element}=setup({getUserMedia:async()=>{const e=Error('denied');e.name='NotAllowedError';throw e;}});
 await c.startCamera('manual');assert.equal(c.stream,null);assert.equal(c.busy,false);assert.equal(element('startAuto').disabled,false);assert.equal(element('cameraChoices').hidden,false);assert.match(c.messageText,/permission was denied/);
});
test('stop releases tracks and cancels automatic timer',async()=>{
 const {context:c,intervals,stopped}=setup();await c.startCamera('auto');assert.equal(intervals.size,1);c.stopCamera();assert.equal(intervals.size,0);assert.equal(stopped(),1);assert.equal(c.video.srcObject,null);
});
test('leaving during permission prompt stops a late camera stream',async()=>{
 let grant;const {context:c,media,stopped}=setup({getUserMedia:()=>new Promise(resolve=>grant=resolve)});
 const opening=c.startCamera('manual');c.stopCamera();grant(media);await opening;
 assert.equal(c.stream,null);assert.equal(stopped(),1);assert.equal(c.busy,false);
});

test('the eight-second option and all four camera buttons use their intended actions',async()=>{
 const {context:c,clock,element}=setup();element('interval').value='8';await element('startAuto').onclick();clock.now=7999;c.captureTick();assert.equal(c.session,0);clock.now=8000;c.captureTick();assert.equal(c.session,1);element('stop').onclick();assert.equal(c.view,'review');await element('start').onclick();assert.equal(c.cameraMode,'manual');element('takePhoto').onclick();assert.equal(c.session,1);element('stop').onclick();assert.equal(c.stream,null);
});

const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
test('camera permission timeout releases controls and stops a late grant',async()=>{
 let grant;const h=setup({getUserMedia:()=>new Promise(resolve=>grant=resolve)}),c=h.context;
 const opening=c.startCamera('manual');await flush();h.expire();await flush();
 assert.equal(c.busy,false);assert.equal(c.cameraOpening,false);assert.equal(h.element('start').disabled,false);
 assert.match(c.messageText,/timed out/i);await opening;
 grant(h.media);await flush();assert.equal(h.stopped(),1);assert.equal(c.stream,null);
});
test('hung optional audio never delays camera permission or preview',async()=>{
 const h=setup(),c=h.context;
 c.window.AudioContext=class{resume(){return new Promise(()=>{});}};
 const opening=c.startCamera('manual');await flush();
 assert.equal(c.stream,h.media);assert.equal(c.cameraOpening,false);await opening;c.stopCamera();
});
test('stopping a pending permission request allows immediate retry and isolates old cleanup',async()=>{
 const requests=[];const h=setup({getUserMedia:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}),c=h.context;
 const old=c.startCamera('manual');await flush();c.stopCamera();
 assert.equal(c.busy,false);
 const retry=c.startCamera('auto');await flush();assert.equal(requests.length,2);
 requests[0].reject(Error('old denial'));await old;
 assert.equal(c.busy,true);assert.equal(c.cameraOpening,true);assert.equal(h.element('start').disabled,true);
 requests[1].resolve(h.media);await retry;assert.equal(c.cameraMode,'auto');c.stopCamera();
});
test('preview playback timeout releases acquired tracks and offers retry',async()=>{
 const h=setup(),c=h.context;c.video.play=()=>new Promise(()=>{});
 const opening=c.startCamera('manual');await flush();assert.equal(c.stream,h.media);
 h.expire();await flush();assert.equal(c.busy,false);await opening;
 assert.equal(c.stream,null);assert.equal(c.video.srcObject,null);assert.equal(h.stopped(),1);
 c.video.play=async()=>{};await c.startCamera('manual');assert.equal(c.cameraMode,'manual');c.stopCamera();
});
test('late playback from a stopped camera cannot reset newer capture counters',async()=>{
 const h=setup(),c=h.context;let play;
 c.video.play=()=>new Promise(resolve=>play=resolve);
 const old=c.startCamera('manual');await flush();c.stopCamera();
 c.video.play=async()=>{};await c.startCamera('manual');c.session=3;h.element('sessionCount').textContent='3';
 play();await old;assert.equal(c.session,3);assert.equal(h.element('sessionCount').textContent,'3');c.stopCamera();
});
test('unexpected track ending restores camera choices without losing photos',async()=>{
 const h=setup(),c=h.context;await c.startCamera('manual');c.takePhoto();
 assert.equal(typeof h.track.ended,'function');h.track.ended();
 assert.equal(c.stream,null);assert.equal(c.batch.length,1);assert.equal(h.element('start').disabled,false);
 assert.match(c.messageText,/interrupted/i);
});

test('cancelling between grant fulfillment and preview attachment releases the acquired stream',async()=>{
 let grant;const h=setup({getUserMedia:()=>new Promise(resolve=>grant=resolve)}),c=h.context;
 const opening=c.startCamera('manual');grant(h.media);queueMicrotask(()=>c.stopCamera());await opening;
 assert.equal(c.stream,null);assert.equal(h.stopped(),1);assert.equal(c.busy,false);
});

test('muted video track blocks both manual and automatic captures without touching saved photos',async()=>{
 const h=setup(),c=h.context;await c.startCamera('manual');
 h.track.muted=true;c.takePhoto();assert.equal(c.session,0);
 assert.match(c.messageText,/stopped delivering video/i);
 h.track.muted=false;c.takePhoto();assert.equal(c.session,1);
 c.stopCamera();assert.equal(c.batch.length,1);
 await c.startCamera('auto');h.clock.now=5000;h.track.muted=true;
 c.captureTick();assert.equal(c.session,0);
 h.track.muted=false;c.captureTick();assert.equal(c.session,1);c.stopCamera();
});
test('real delivered video frames may remain visually identical yet not count as frozen',async()=>{
 const h=setup({frameCallbacks:true}),c=h.context;
 await c.startCamera('auto');assert.equal(h.intervals.size,2);
 for(const time of [1000,2500,5000]){
  h.clock.now=time;h.deliverFrame();
 }
 c.captureTick();assert.equal(c.session,1);
 assert.equal(c.cameraPreviewHealth().live,true);
 c.stopCamera();assert.equal(h.intervals.size,0);
});
test('frozen preview cannot silently accumulate photos; watchdog preserves collected garments and frees retry',async()=>{
 const h=setup({frameCallbacks:true}),c=h.context;
 await c.startCamera('auto');
 h.clock.now=5000;h.deliverFrame();c.captureTick();assert.equal(c.session,1);
 h.clock.now=10000;h.poll();
 assert.equal(c.stream,null);assert.equal(c.cameraMode,null);
 assert.equal(c.batch.length,1);assert.equal(c.session,1);
 assert.equal(h.element('start').disabled,false);
 assert.match(c.messageText,/preview froze/i);
 await c.startCamera('manual');assert.equal(c.cameraMode,'manual');
 h.deliverFrame();c.takePhoto();assert.equal(c.session,1);c.stopCamera();
});
test('preview frame callbacks owned by a stopped session cannot disturb the next camera',async()=>{
 const h=setup({frameCallbacks:true}),c=h.context;await c.startCamera('manual');
 const first=c.cameraPreviewWatch,oldCallback=c.video.requestVideoFrameCallback;
 h.clock.now=2000;h.deliverFrame();c.stopCamera();
 await c.startCamera('manual');const current=c.cameraPreviewWatch;
 assert.notEqual(current,first);
 h.clock.now=3000;
 // Simulate an already-queued old browser callback even though canceled.
 oldCallback(()=>{if(c.cameraPreviewWatch===first)c.stopCamera();});
 h.deliverFrame();
 assert.equal(c.cameraPreviewWatch,current);assert.ok(c.stream);
 c.stopCamera();
});
