/** Actual browser decode/encode tests of source-pinned still-photo function.
 * Camera driver is synthetic; physical Android/iOS and sensor quality remain HOLD.
 */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist-family-alpha-43-high-detail-still-HOLD');
const artifact='benchmark/family-alpha-43-camera-SYNTHETIC-HOLD';
await mkdir(artifact,{recursive:true});
const app=await readFile(join(root,'app.js'),'utf8');
const start=app.indexOf('async function captureCameraStill(track,StillCapture,isCurrent=()=>true){');
const end=app.indexOf('\nfunction beep(){',start);
if(start<0||end<start||app.indexOf('async function captureCameraStill(',start+1)!==-1)
 throw Error('Actual compiled still-photo function not uniquely found');
const functionSource=app.slice(start,end);
const server=createServer((_req,res)=>{
 res.writeHead(200,{'content-type':'text/html'});
 res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>Closet Current — Synthetic camera evidence</title>'+
 '<style>body{font:16px/1.5 system-ui;padding:12px;background:#fafafa;color:#222}'+
 '.card{max-width:430px;padding:12px;border:1px solid #ddd;border-radius:14px;margin:auto}img{width:100%;height:auto}h1{font-size:1.2rem}</style>'+
 '<div class="card"><h1>Full-detail original still — SYNTHETIC</h1>'+
 '<p>Original camera frame: 3400 × 2300. Normal auto frame remains capped at 2048px.</p>'+
 '<p>Development-only simulation. No account, live camera, network upload, or user photos.</p>'+
 '<img id="proof" alt="Synthetic garment texture sample"><p id="result"></p></div>');
});
await new Promise(resolveListen=>server.listen(0,'127.0.0.1',resolveListen));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const errors=[],external=[];
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(url.startsWith(origin+'/')||url.startsWith('blob:')||url.startsWith('data:'))return route.continue();
     external.push(url);return route.abort();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto(origin+'/');
     const result=await page.evaluate(async source=>{
      const c=document.createElement('canvas');c.width=3400;c.height=2300;
      const ctx=c.getContext('2d');
      ctx.fillStyle='#eee8dd';ctx.fillRect(0,0,c.width,c.height);
      for(let y=100;y<2200;y+=14){ctx.fillStyle=y%28===0?'#254159':'#7194ad';ctx.fillRect(120,y,3160,4);}
      ctx.fillStyle='#242b39';ctx.font='72px system-ui';
      ctx.fillText('SYNTHETIC GARMENT DETAIL — NOT A PERSON',90,850);
      const jpeg=await new Promise(resolveBlob=>c.toBlob(resolveBlob,'image/jpeg',.90));
      const bytes=new Uint8Array(await jpeg.arrayBuffer());
      const exif=new TextEncoder().encode('Exif\0\0GPS-INJECTED-TEST');
      const app1=new Uint8Array(4+exif.length);
      app1[0]=255;app1[1]=225;app1[2]=0;app1[3]=exif.length+2;app1.set(exif,4);
      const syntheticSource=new Blob([bytes.subarray(0,2),app1,bytes.subarray(2)],{type:'image/jpeg'});
      const captured=[];
      const factory=new Function('const canvas=document.createElement("canvas");'+source+';return captureCameraStill');
      const fn=factory();
      const Track={readyState:'live'};
      class Camera{constructor(t){if(t!==Track)throw Error('Wrong track');}
       async takePhoto(){return syntheticSource;}
      }
      const value=await fn(Track,Camera,()=>true);
      if(!value.startsWith('data:image/jpeg;base64,'))throw Error('Converted JPEG missing');
      const view=new Image();view.src=value;await view.decode();
      const plain=new TextDecoder('latin1').decode(Uint8Array.from(atob(value.split(',')[1]),x=>x.charCodeAt(0)));
      if(plain.includes('GPS-INJECTED-TEST'))throw Error('GPS metadata leaked from captured still');
      if(view.naturalWidth!==3400||view.naturalHeight!==2300)
       throw Error('Full authentic capture was reduced to legacy 3072/2048 cap');
      if(value.length>5_600_000)throw Error('Storage URI cap exceeded');
      document.getElementById('proof').src=value;
      document.getElementById('result').textContent='PASS: '+view.naturalWidth+' × '+view.naturalHeight+
       ' genuine decoded JPEG. Metadata stripped. Source pixels are not AI-upscaled.';
      let active=true;
      class InterruptedCamera{async takePhoto(){active=false;return syntheticSource;}}
      let lateRejected=false;
      try{await fn(Track,InterruptedCamera,()=>active);}
      catch(error){lateRejected=/session ended/i.test(error.message);}
      if(!lateRejected)throw Error('Late camera session cannot save photo');
      return {width:view.naturalWidth,height:view.naturalHeight,sourceWidth:3400,
       encodedLength:value.length,gpsStripped:true,lateCaptureRejected:true,
       realCameraUsed:false,photoUploaded:false};
     },functionSource);
     assert.equal(result.width,3400);assert.ok(result.gpsStripped);
     assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
     await page.screenshot({path:artifact+'/'+name+'-'+width+'-CAMERA-SYNTHETIC-HOLD.png',fullPage:true,animations:'disabled'});
     results.push({engine:name,viewport:width,status:'PASS',...result});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
await writeFile(artifact+'/results.json',JSON.stringify(results,null,2)+'\n');
console.log('FAMILY_ALPHA_43_STILL_CAMERA_BROWSER_PASS',JSON.stringify(results));
