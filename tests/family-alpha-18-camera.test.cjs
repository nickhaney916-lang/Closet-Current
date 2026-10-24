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

test('family-alpha-18: two interrupted batches retain all 20 pending garments',async()=>{
 const {context:c}=setup();
 await c.startCamera('manual');for(let i=0;i<10;i++)c.takePhoto();c.stopCamera();
 assert.equal(c.batch.length,10);
 await c.startCamera('manual');for(let i=0;i<10;i++)c.takePhoto();c.finishScan();
 assert.equal(c.batch.length,20);assert.equal(c.view,'review');
});
test('family-alpha-18: denied permission can be retried without deleting pending photos',async()=>{
 let attempts=0;const media={getTracks:()=>[{stop(){}}]};
 const {context:c}=setup({getUserMedia:async()=>{if(++attempts===1)throw Object.assign(Error('denied'),{name:'NotAllowedError'});return media;}});
 c.batch.push({image:'synthetic-existing'});await c.startCamera('manual');
 assert.equal(c.batch.length,1);assert.equal(c.busy,false);
 await c.startCamera('manual');c.takePhoto();assert.equal(c.batch.length,2);c.stopCamera();
});
test('family-alpha-18: stale permission resolution cannot reopen camera after navigation',async()=>{
 let grant;const {context:c,media,stopped}=setup({getUserMedia:()=>new Promise(r=>grant=r)});
 c.batch.push({image:'synthetic-existing'});const pending=c.startCamera('auto');
 c.stopCamera();c.view='closet';grant(media);await pending;
 assert.equal(c.view,'closet');assert.equal(c.batch.length,1);assert.equal(stopped(),1);assert.equal(c.stream,null);
});
test('family-alpha-18: auto interruption cancels scheduled capture without adding blank frames',async()=>{
 const {context:c,clock,intervals}=setup();await c.startCamera('auto');
 clock.now=5000;c.captureTick();assert.equal(c.batch.length,1);c.stopCamera();
 clock.now=20000;c.captureTick();assert.equal(c.batch.length,1);assert.equal(intervals.size,0);
});
