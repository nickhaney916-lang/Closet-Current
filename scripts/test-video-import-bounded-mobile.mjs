// Real customer uploader source in Android Chromium and iPhone WebKit emulation.
// Browser video metadata/seeks and frame bytes are synthetic; NOT physical phone footage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const app=fs.readFileSync('public/app.js','utf8');
const source=app.slice(app.indexOf('function waitEvent('),app.indexOf("$('discard').onclick="));
const setup=[
 'window.closetAuth={user:{id:"owner-a"}};',
 'let busy=false,session=0,batch=[];',
 'const els={};const $=id=>els[id]||(els[id]={value:id==="interval"?"5":"",textContent:"",hidden:false,classList:{add(){},remove(){}}});',
 'window.__events=[];window.__frames=[];window.__seekTimes=[];',
 'function stopCamera(){}',
 'function controls(v){}',
 'function candidate(frame){batch.push({image:frame});session++;window.__frames.push(frame);return true;}',
 'function snap(){return "frame:"+video.currentTime;}',
 'function message(msg){window.__events.push("message:"+msg);}',
 'function switchView(v){window.__events.push("view:"+v);}',
 'function render(){}',
 'const video=document.createElement("video");let durationValue=180;',
 'Object.defineProperty(video,"duration",{configurable:true,get(){return durationValue;}});',
 'Object.defineProperty(video,"currentTime",{configurable:true,get(){return video._seek||0;},set(v){video._seek=v;window.__seekTimes.push(v);queueMicrotask(()=>{if(window.__switchAtSeek===window.__seekTimes.length)window.closetAuth.user.id="owner-b";video.dispatchEvent(new Event("seeked"));});}});',
 'video.load=()=>{if(video.getAttribute("src"))queueMicrotask(()=>video.dispatchEvent(new Event("loadedmetadata")));};',
 'video.pause=()=>{};',
 source
].join('\n');
const results=[];
for(const [name,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('about:blank');
  await page.addScriptTag({content:setup});
  const run=await page.evaluate(async()=>{
   const file=new File([new Uint8Array(16)],'synthetic-closet.mp4',{type:'video/mp4'});
   await upload(file);
   const full={count:window.__frames.length,times:window.__seekTimes.slice(),message:window.__events.slice()};
   durationValue=30;window.__seekTimes.length=0;window.__frames.length=0;
   window.__events.length=0;session=0;batch=[];
   await upload(file);
   const short={count:window.__frames.length,times:window.__seekTimes.slice()};
   durationValue=30;window.__seekTimes.length=0;window.__frames.length=0;
   window.__events.length=0;session=0;batch=[];window.__switchAtSeek=2;
   await upload(file);
   const switched={count:window.__frames.length,times:window.__seekTimes.slice(),events:window.__events.slice()};
   return {full,short,switched,busy};
  });
  assert.equal(run.full.count,20);
  assert.ok(run.full.times[19]>=171);
  assert.equal(run.short.count,6);
  assert.deepEqual(run.short.times,[.1,5.1,10.1,15.1,20.1,25.1]);
  assert.equal(run.switched.count,1);
  assert.equal(run.switched.times.length,2);
  assert.ok(run.switched.events.some(s=>s.includes('account change')));
  assert.equal(run.busy,false);
  assert.deepEqual(errors,[]);
  results.push({browser:name,synthetic180sSourceFrames:20,synthetic30sSourceFrames:6,
   switchAfterSecondSeekQueuedFrames:1,sourceRuntimeVerified:true,
   physicalCameraFootage:false,accountDatabaseOrCloudNotTested:true});
  await context.close();
 }finally{await browser.close();}
}
console.log(JSON.stringify({status:'PASS',results,realPhoneHardwareValidated:false,realGarmentAccuracy:null,productionApproved:false}));
