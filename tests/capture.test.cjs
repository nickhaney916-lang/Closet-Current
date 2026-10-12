const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/app.js','utf8');
function setup(ready){
 const els=new Map();const element=id=>{if(!els.has(id))els.set(id,{});return els.get(id);};
 const context={stream:{},video:{readyState:ready?2:0,videoWidth:ready?1280:0},session:0,batch:[],localReady:false,view:'scan',messageText:'',Date,$:element,beep(){},snap(){return 'same garment frame';}};
 context.candidate=image=>{context.batch.push({image});context.session++;};
 context.message=text=>context.messageText=text;
 context.stopCamera=()=>context.stream=null;
 context.switchView=view=>context.view=view;
 vm.createContext(context);vm.runInContext(fs.readFileSync('public/capture.js','utf8')+'\nlet cadence=new CaptureCadence(3000);',context);
 vm.runInContext(source.slice(source.indexOf('function finishScan'),source.indexOf("$('start').onclick=async()=>")),context);
 return context;
}
const scan=setup(true);
for(let t=0;t<=10000;t+=250)scan.captureTick(t);
assert.equal(scan.session,4,'Identical or moving garments must not block timed capture');
scan.finishScan();assert.equal(scan.view,'review');assert.equal(scan.stream,null);
const delayed=setup(false);delayed.captureTick(0);delayed.captureTick(3000);assert.equal(delayed.session,0);
delayed.video.readyState=2;delayed.video.videoWidth=1280;delayed.captureTick(3250);assert.equal(delayed.session,1,'First decoded frame is captured immediately');
const quick=setup(true);quick.finishScan();assert.equal(quick.session,1,'Finish recovers a usable frame before stopping');assert.equal(quick.view,'review');
const unavailable=setup(false);unavailable.captureTick(0);unavailable.finishScan();assert.equal(unavailable.view,'scan');assert.match(unavailable.messageText,/No camera frames/);
console.log('Timed capture, delayed camera, quick finish recovery and no-frame guidance checks passed.');
