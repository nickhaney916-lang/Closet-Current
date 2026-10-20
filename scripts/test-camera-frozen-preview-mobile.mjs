// Controlled delivered-frame simulation in actual mobile-size Chromium/WebKit
// browser engines. No hardware camera, permission or real customer media used.
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=await readFile('public/app.js','utf8');
const source=app.slice(app.indexOf('let manualStillShot=null;'),app.indexOf('function waitEvent('));
const cadence=await readFile('public/capture.js','utf8');
const results=[];
for(const [browserName,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true,...(browserName==='Android Chromium'?{args:['--no-sandbox']}: {})});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('about:blank');
  await page.addScriptTag({content:`
   var stream=null,cameraMode=null,cameraOpening=false,cameraRequest=0,timer=null,busy=false,audio=null,
    session=0,batch=[],previousQualityFrame=null,cadence,messageText='';
   let clockNow=0;
   Date.now=()=>clockNow;
   const video=document.createElement('video');document.body.append(video);
   const nodes=new Map(), $=id=>{if(!nodes.has(id)){const node=document.createElement('button');node.id=id;node.value=id==='interval'?'5':'';nodes.set(id,node);document.body.append(node);}return nodes.get(id);};
   function message(value){messageText=value;}function switchView(){}function beep(){}
   function cameraFrameQuality(){return {usable:true};}
   function cameraStability(){return {stable:true,lowTexture:false};}
   function snap(){return 'fake-full-scene-jpeg';}
   function candidate(image){batch.push(image);session++;}
   const realInterval=window.setInterval.bind(window);
   window.setInterval=(fn,ms,...args)=>realInterval(fn,ms===1000?30:ms,...args);
   const driver={stream:null,frame:null};
   function newMedia(){
    const track=new EventTarget();track.muted=false;track.readyState='live';track.stops=0;
    track.stop=()=>{track.readyState='ended';track.stops++;};
    const s={track,getVideoTracks:()=>[track],getTracks:()=>[track]};
    driver.stream=s;return s;
   }
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>newMedia()}});
   // Fake media drivers do not attach a real sensor stream, so explicitly
   // model the HAVE_CURRENT_DATA and nonzero dimensions supplied by hardware.
   Object.defineProperty(video,'readyState',{configurable:true,get:()=>2});
   Object.defineProperty(video,'videoWidth',{configurable:true,get:()=>1280});
   Object.defineProperty(video,'videoHeight',{configurable:true,get:()=>720});
   Object.defineProperty(video,'srcObject',{configurable:true,writable:true,value:null});
   Object.defineProperty(video,'requestVideoFrameCallback',{configurable:true,value:fn=>{driver.frame=fn;return 1;}});
   Object.defineProperty(video,'cancelVideoFrameCallback',{configurable:true,value:()=>{driver.frame=null;}});
   video.play=()=>Promise.resolve();
   function deliver(ms){clockNow=ms;const frame=driver.frame;if(!frame)throw Error('frame callback not queued');driver.frame=null;frame();}
   window.AudioContext=class{resume(){return Promise.resolve();}};
   function check(truth,why){if(!truth)throw Error(why);}
   ${cadence}
   ${source}
  `});
  const r=await page.evaluate(async()=>{
   await startCamera('auto');
   check(!!stream&&cameraMode==='auto','automatic camera failed to start');
   for(const time of [1000,2500,5000])deliver(time);
   captureTick(5000);
   check(batch.length===1,'identical stationary garment cannot be captured');
   clockNow=10500;
   await new Promise(resolve=>setTimeout(resolve,110));
   check(stream===null&&cameraMode===null,'frozen driver did not release camera');
   check(batch.length===1,'frozen preview wiped already collected photos');
   check(/preview froze/i.test(messageText),'frozen recovery message absent');
   check(!$('start').disabled,'camera retries remained disabled');
   await startCamera('manual');
   check(!!stream,'manual restart after freeze failed');
   driver.stream.track.muted=true;
   takePhoto();
   check(batch.length===1&&/stopped delivering/i.test(messageText),'muted track saved a photo');
   driver.stream.track.muted=false;
   deliver(11000);
   takePhoto();
   check(batch.length===2,'healthy resumed driver could not capture a new photo');
   const oldWatch=cameraPreviewWatch;const oldStream=stream;
   stopCamera();await startCamera('manual');
   check(cameraPreviewWatch!==oldWatch&&stream!==oldStream,'old preview watch reused');
   const oldCallback=oldWatch; // Captured prior monitor identity.
   clockNow=12000;
   check(cameraPreviewWatch!==oldCallback&&stream!=null,'old camera state affected new capture');
   deliver(12000);takePhoto();
   check(batch.length===3,'new healthy session could not capture');
   stopCamera();
   return {stationaryOriginalCapture:true,frozenAutoStopped:true,
    photosPreservedAfterRestart:true,mutedTrackBlocked:true,
    noStaleSessionReuse:true,cameraRetriable:true,hardwareVerified:false};
  });
  assert.deepEqual(errors,[]);
  results.push({browser:browserName,...r});
  await ctx.close();
 }finally{await browser.close();}
}
console.log('FROZEN_CAMERA_MOBILE '+JSON.stringify(results));
