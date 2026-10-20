// Browser event/promise recovery with simulated media drivers; no physical-phone claims.
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=await readFile('public/app.js','utf8');
const camera=app.slice(app.indexOf('let manualStillShot=null;'),app.indexOf('function waitEvent('));
const cadence=await readFile('public/capture.js','utf8');
for(const [name,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('about:blank');
  await page.addScriptTag({content:`
   var stream=null,cameraMode=null,cameraOpening=false,cameraRequest=0,timer=null,busy=false,audio=null,
    session=0,batch=[],previousQualityFrame=null,cadence,messageText='';
   const video=document.createElement('video');document.body.append(video);
   const nodes=new Map();const $=id=>{if(!nodes.has(id)){const el=document.createElement('button');el.id=id;el.value='5';nodes.set(id,el);document.body.append(el);}return nodes.get(id);};
   function message(text){messageText=text;}function switchView(){}function beep(){}
   function cameraFrameQuality(){return {usable:true};}function cameraStability(){return {stable:true};}
   function snap(){return 'simulated-frame';}function candidate(image){batch.push({image});session++;}
   // Accelerate only the camera's 15s startup deadline; test browser scheduling.
   const realTimeout=window.setTimeout.bind(window);
   window.setTimeout=(fn,ms,...args)=>realTimeout(fn,ms===15000?80:ms,...args);
   window.AudioContext=class{resume(){return new Promise(()=>{});}};
   const requests=[];
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}});
   // A fake driver stream lets both engines exercise identical lifecycle faults.
   Object.defineProperty(video,'srcObject',{configurable:true,writable:true,value:null});
   let playResolve;video.play=()=>Promise.resolve();
   function media(){const track=new EventTarget();track.stops=0;track.stop=()=>track.stops++;return {track,getTracks:()=>[track]};}
   function check(value,why){if(!value)throw Error(why);}
   ${cadence}
   ${camera}
  `});
  const result=await page.evaluate(async()=>{
   const initial=startCamera('manual');
   check(requests.length===1,'hung audio delayed permission');
   await initial;
   check(!busy&&!cameraOpening&&!$('start').disabled&&/timed out/i.test(messageText),'permission timeout did not recover');
   const late=media();requests[0].resolve(late);await Promise.resolve();await Promise.resolve();
   check(late.track.stops===1&&stream===null,'late grant leaked');
   const retry=startCamera('manual'),good=media();requests[1].resolve(good);await retry;
   check(stream===good&&!busy,'retry failed');takePhoto();
   good.track.dispatchEvent(new Event('ended'));
   check(stream===null&&batch.length===1&&/interrupted/i.test(messageText),'ended track did not preserve photos');
   video.play=()=>new Promise(resolve=>playResolve=resolve);
   const pending=startCamera('manual'),old=media();requests[2].resolve(old);
   for(let i=0;i<10;i++)await Promise.resolve();
   check(typeof playResolve==='function','old playback not reached');stopCamera();
   check(!busy&&old.track.stops===1,'stop failed to release preview');
   video.play=()=>Promise.resolve();const newer=startCamera('manual'),next=media();requests[3].resolve(next);await newer;
   session=4;$('sessionCount').textContent='4';playResolve();await pending;
   check(session===4&&$('sessionCount').textContent==='4'&&stream===next,'stale playback changed new session');stopCamera();
   video.play=()=>new Promise(()=>{});
   const hung=startCamera('manual'),stalled=media();requests[4].resolve(stalled);await hung;
   check(stream===null&&!busy&&stalled.track.stops===1,'hung preview did not recover');
   return {permissionTimeout:true,lateGrantStopped:true,audioNonblocking:true,retry:true,
    interruptedTrackKeepsPhotos:true,stalePlayIsolated:true,previewTimeout:true,physicalPhoneTested:false};
  });
  assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:name,...result}));
  await context.close();
 }finally{await browser.close();}
}
