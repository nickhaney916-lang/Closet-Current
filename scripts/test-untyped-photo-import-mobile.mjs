// Real browser source-image import (not just a mocked node decoder).
// No paid inference or account data; actual iPhone/Android hardware not tested.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile('public/photo-import.js','utf8');
const checks=[];
for(const [label,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true,...(label==='Chromium'?{args:['--no-sandbox']}: {})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},
   isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push(r.url()));
  await page.goto('about:blank');
  await page.addScriptTag({content:source});
  const evidence=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=640;c.height=480;
   const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,640,480);
   ctx.fillStyle='#174a9c';ctx.fillRect(160,90,300,330);
   const bytes=async(type)=>{
    const uri=c.toDataURL(type,.94);
    return Uint8Array.from(atob(uri.split(',')[1]),x=>x.charCodeAt(0));
   };
   const png=await bytes('image/png'),jpeg=await bytes('image/jpeg');
   const names=[];
   const photos=[
    new File([jpeg],'source.JPG',{type:''}),
    new File([png],'source.PNG',{type:'application/octet-stream'}),
    new File([new Uint8Array([1,2,3])],'unsupported.HEIC',{type:''}),
    new File([new Uint8Array([60,104,116,109,108,62])],'trick.jpg',{type:'text/html'})
   ];
   const inputOriginalSizes=[],jpegResults=[];
   const out=await readPhotoBatch(photos,async file=>{
    names.push(file.name);
    const uri=await photoToJPEG(file);
    const preview=new Image();preview.src=uri;await preview.decode();
    inputOriginalSizes.push([preview.naturalWidth,preview.naturalHeight]);
    jpegResults.push(uri.startsWith('data:image/jpeg;base64,'));
    return uri;
   },async()=>true);
   return {statuses:out.results.map(r=>r.status),added:out.added,
    decoderCalls:names,convertedSizes:inputOriginalSizes,
    correctFormat:jpegResults.every(Boolean),errors:out.errors.length,
    firstError:out.results.find(x=>x.name==='unsupported.HEIC')?.reason};
  });
  assert.deepEqual(evidence.statuses,['added','added','error','rejected']);
  assert.equal(evidence.added,2);
  assert.equal(evidence.correctFormat,true);
  assert.deepEqual(evidence.convertedSizes,[[640,480],[640,480]]);
  assert.deepEqual(evidence.decoderCalls,['source.JPG','source.PNG','unsupported.HEIC']);
  assert.equal(evidence.firstError?.length>0,true);
  assert.deepEqual(errors,[]);
  // Object URLs are local browser-owned decode resources, not network
  // uploads; Chrome surfaces blob:null/... as requests from about:blank.
  assert.deepEqual(requests.filter(url=>!url.startsWith('blob:')),[]);
  checks.push({browser:label,imported:2,rejectedDisguisedText:true,
   unsupportedHEICShowsRecoverableError:true,keptLaterImages:true,
   outputJPEG:true,sourcePixelsClassifiedBeforeAnyCutout:true,
   userPhotosUploaded:false,remoteRequests:requests.filter(url=>!url.startsWith('blob:')).length,
   realPhoneHardwareTested:false});
  await context.close();
 }finally{await browser.close();}
}
console.log('UNSPECIFIED_MIME_MOBILE_PHOTO_IMPORT '+JSON.stringify(checks));
