const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const source=fs.readFileSync('public/app.js','utf8');
function setup({ready=true,getUserMedia}={}){
 const els=new Map(),clock={now:0},intervals=new Map();let intervalId=0,stopped=0;
 const element=id=>{if(!els.has(id))els.set(id,{hidden:false,disabled:false,value:id==='interval'?'5':'',checked:false,classList:{add(){},remove(){}}});return els.get(id);};
 const track={stop(){stopped++;}},media={getTracks:()=>[track]};
 const context={stream:null,cameraMode:null,cameraOpening:false,cameraRequest:0,timer:null,busy:false,audio:null,video:{readyState:ready?2:0,videoWidth:ready?1280:0,srcObject:null,removeAttribute(){},classList:{add(){},remove(){}},play:async()=>{}},session:0,batch:[],localReady:false,view:'scan',messageText:'',Date:{now:()=>clock.now},$:element,window:{},navigator:{mediaDevices:{getUserMedia:getUserMedia||(async()=>media)}},setInterval:fn=>{intervals.set(++intervalId,fn);return intervalId;},clearInterval:id=>intervals.delete(id),beep(){},snap(){if(!context.video.videoWidth||context.video.readyState<2)throw Error('not ready');return 'same garment frame';}};
 context.candidate=image=>{context.batch.push({image});context.session++;};
 context.message=text=>context.messageText=text;
 context.switchView=view=>context.view=view;
 vm.createContext(context);vm.runInContext(fs.readFileSync('public/capture.js','utf8')+'\nlet cadence;',context);
 vm.runInContext(source.slice(source.indexOf('function stopCamera'),source.indexOf('function waitEvent')),context);
 return {context,element,clock,intervals,media,stopped:()=>stopped};
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
