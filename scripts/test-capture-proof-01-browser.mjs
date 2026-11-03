/** CAPTURE-PROOF-01: actual Chromium/WebKit page+canvas+IndexedDB QA.
 * Camera/recognition/outfit workers are controlled mocks (NO physical phone,
 * NO fresh AI inference). Browser JPEG, hashing, file selection and UI are real.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:public|research)\/[-a-zA-Z0-9_/\.]+$/.test(pathname)||
    pathname.split('/').includes('..'))throw Error('forbidden');
  const file=resolve(root,'.'+pathname);
  if(!file.startsWith(root+'/'))throw Error('escape');
  const body=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(body);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port;
const out='benchmark/capture-proof-01';await mkdir(out,{recursive:true});
const fakeAuth='window.closetAuth={ready:Promise.resolve(),user:{id:"capture-proof-a",email:"fixture@example.invalid"}};document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;';
const fakeCloud='window.closetCloud={beforeWrite:async()=>{},changed:()=>{},start:async()=>{},stop:async()=>{}};';
const preload=()=>{
 window.__mock={denied:true,failPreferred:false,requestCount:0,tracksStopped:0,
  requests:[],workerImages:[],outfitOriginal:null,cameraReady:false,failNextPlay:false};
 const C=CanvasRenderingContext2D.prototype,draw=C.drawImage;
 C.drawImage=function(img,...args){
  if(img instanceof HTMLVideoElement&&img.id==='video'&&window.__cameraFixture)
   return draw.call(this,window.__cameraFixture,...args);
  return draw.call(this,img,...args);
 };
 const getDescriptor=(key)=>Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,key)||
  Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype,key);
 for(const [key,value] of [['readyState',4],['videoWidth',1600],['videoHeight',2400]]){
  const own=Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype,key);
  const native=own?.get;
  try{Object.defineProperty(HTMLVideoElement.prototype,key,{configurable:true,get(){
   if(this.id==='video'&&window.__mock.cameraReady)return value;
   return native?native.call(this):0;
  }});}catch{}
 }
 HTMLMediaElement.prototype.play=function(){
  if(this.id==='video'&&window.__mock.failNextPlay){
   window.__mock.failNextPlay=false;
   return Promise.reject(new DOMException('Simulated video playback failure','AbortError'));
  }
  return Promise.resolve();
 };
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{
  getUserMedia:async constraints=>{
   window.__mock.requestCount++;window.__mock.requests.push(constraints);
   if(window.__mock.denied){
    window.__mock.denied=false;throw new DOMException('permission denied','NotAllowedError');
   }
   if(window.__mock.failPreferred&&constraints.video!==true){
    throw new DOMException('requested camera unavailable','NotFoundError');
   }
   const source=document.createElement('canvas');source.width=1600;source.height=2400;
   const ctx=source.getContext('2d');ctx.fillStyle='#ece5d9';ctx.fillRect(0,0,1600,2400);
   ctx.fillStyle='#2345b7';ctx.fillRect(330,260,970,1800);
   ctx.fillStyle='#d1e0f5';ctx.fillRect(460,365,250,1000);
   ctx.fillStyle='#15255f';ctx.fillRect(1010,380,125,1600);
   ctx.fillStyle='#e6c553';ctx.fillRect(400,1970,640,220);
   window.__cameraFixture=source;window.__mock.cameraReady=true;
   const stream=new MediaStream();
   const track={stop(){window.__mock.tracksStopped++;window.__mock.cameraReady=false;},
    addEventListener(){}};
   stream.getTracks=()=>[track];
   return stream;
  }
 }});
 class ResearchWorker{
  constructor(url){this.url=String(url);this.onmessage=null;this.terminated=false;}
  postMessage(data){
   const report=(msg)=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:msg});},0);
   if(this.url.includes('outfit-worker')){
    window.__mock.outfitOriginal=data.image;
    const piece={image:data.image,hint:{categories:['Tops'],types:['T-shirt']}};
    report({id:data.id,type:'piece',piece});
    setTimeout(()=>report({id:data.id,type:'done'}),30);
    return;
   }
   if(data.type==='load'){report({id:data.id,type:'ready'});return;}
   if(data.type==='classify'){
    window.__mock.workerImages.push(data.image);
    report({id:data.id,type:'result',strong:false,categoryConfirmed:false,
     choices:[{category:'Bottoms',itemType:'Jeans',label:'a pair of jeans',score:.38}],
     details:{color:'Blue'}});
   }else report({id:data.id,type:'ready'});
  }
  terminate(){this.terminated=true;}
 }
 Object.defineProperty(window,'Worker',{configurable:true,value:ResearchWorker});
};
let results=[],errors=[],outbound=[];
try{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='chromium'?['--disable-dev-shm-usage']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:890},
     deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     const page=await context.newPage();
     page.on('pageerror',e=>errors.push(name+'/'+width+': '+e.message));
     await page.addInitScript(preload);
     await page.route('**/*',route=>{
      const url=route.request().url();
      if(url===host+'/public/auth.js')return route.fulfill({status:200,contentType:'text/javascript',body:fakeAuth});
      if(url===host+'/public/cloud-backup.js')return route.fulfill({status:200,contentType:'text/javascript',body:fakeCloud});
      if(url===host+'/public/cloud-backup-bridge.js')return route.fulfill({status:200,contentType:'text/javascript',body:''});
      if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
      if(url.startsWith('https://fonts.googleapis.com/')||
       url.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?'))
       return route.abort();
      outbound.push(name+'/'+width+':'+url);return route.abort();
     });
     await page.goto(host+'/public/index.html?captureProof01=after&index02=after&index04=after',
      {waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,null,{timeout:30000});
     await page.evaluate(()=>switchView('scan'));
     await page.screenshot({path:out+'/'+name+'-'+width+'-01-add-clothes.png',fullPage:true});
     await page.locator('#start').click();
     await page.waitForFunction(()=>document.getElementById('message').textContent.includes('permission was denied'));
     assert.equal(await page.locator('#start').isDisabled(),false,'permission recovery');
     assert.equal(await page.locator('#cameraChoices').isVisible(),true);
     await page.screenshot({path:out+'/'+name+'-'+width+'-02-permission-denied.png',fullPage:true});
     await page.locator('#captureCameraFacing').selectOption('user');
     await page.evaluate(()=>window.__mock.failPreferred=true);
     await page.locator('#start').click();
     await page.waitForFunction(()=>!document.getElementById('cameraActions').hidden);
     const before=await page.evaluate(()=>({calls:window.__mock.requestCount,
      stopped:window.__mock.tracksStopped,choice:window.__mock.requests[1]?.video?.facingMode?.ideal,
      fallback:window.__mock.requests.at(-1)?.video===true,frame:{
       width:document.getElementById('video').videoWidth,
       height:document.getElementById('video').videoHeight}}));
     assert.equal(before.choice,'user');
     assert.equal(before.fallback,true,'camera unsupported facing fallback');
     assert.deepEqual(before.frame,{width:1600,height:2400});
     await page.screenshot({path:out+'/'+name+'-'+width+'-03-camera-active.png',fullPage:true});
     // Rapid tap: only one capture in progress; identical frames never create duplicate items.
     await page.evaluate(()=>{document.getElementById('takePhoto').click();document.getElementById('takePhoto').click();});
     await page.waitForFunction(()=>batch.length===1&&batch[0].sourceHashVerified===true,{timeout:20000});
     await page.waitForFunction(()=>window.__mock.workerImages.length>0,{timeout:25000});
     const capture=await page.evaluate(async()=>{
      const it=batch[0],bytes=Uint8Array.from(atob(it.image.split(',')[1]),x=>x.charCodeAt(0));
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
      return {shaMatch:hash===it.sourceSHA256,
       originalHash:it.originalPhoto.sha256===hash,
       fullWidth:it.originalPhoto.width,fullHeight:it.originalPhoto.height,
       singleVerified:it.singleGarmentVerified,
       modelInputOriginal:window.__mock.workerImages[0]===it.image,
       exactPhotoStored:it.originalPhoto.image===it.image,
       batchCount:batch.length,
       savedCount:(await readAll()).length};
     });
     assert.equal(capture.shaMatch,true);
     assert.equal(capture.originalHash,true);assert.equal(capture.modelInputOriginal,true);
     assert.equal(capture.exactPhotoStored,true);assert.equal(capture.singleVerified,false);
     assert.deepEqual([capture.fullWidth,capture.fullHeight],[1600,2400]);
     assert.equal(capture.savedCount,0,'unproved identity never automatically saved in INDEX-04');
     await page.locator('#stop').click();
     await page.waitForFunction(()=>!document.getElementById('review').hidden);
     await page.waitForFunction(()=>!localPending.size,{timeout:30000});
     assert.equal(await page.locator('#reviewGrid article.photo-result').count(),1);
     await page.screenshot({path:out+'/'+name+'-'+width+'-04-review-original.png',fullPage:true});
     // Real native file chooser: PNG is converted at original dimensions,
     // with separate file and canonical SHA values recorded accurately.
     await page.evaluate(()=>switchView('scan'));
     const png=await page.evaluate(()=>{
      const c=document.createElement('canvas');c.width=768;c.height=1024;
      const g=c.getContext('2d');g.fillStyle='#6837a0';g.fillRect(0,0,768,1024);
      g.fillStyle='#ffbe38';g.fillRect(100,90,450,720);
      return c.toDataURL('image/png').split(',')[1];
     });
     await page.locator('#clothingPhotos').setInputFiles([{
      name:'licensed-fixture.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')}]);
     await page.waitForFunction(()=>batch.length>=2,{timeout:25000});
     const imported=await page.evaluate(async()=>{
      const i=batch.find(x=>x.importFilename==='licensed-fixture.png');
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
       Uint8Array.from(atob(i.image.split(',')[1]),x=>x.charCodeAt(0)))),x=>x.toString(16).padStart(2,'0')).join('');
      return {found:!!i,converted:i.originalPhoto.transformed,
       sourceDiffers:i.originalPhoto.originalFileSha256!==digest,
       shaMatch:i.sourceSHA256===digest,
       resolution:[i.originalPhoto.width,i.originalPhoto.height],
       originalRetained:i.image===i.originalPhoto.image,
       saved:(await readAll()).length};
     });
     assert.equal(imported.found,true);
     assert.equal(imported.converted,true);
     assert.equal(imported.sourceDiffers,true);
     assert.equal(imported.shaMatch,true);
     assert.equal(imported.originalRetained,true);
     assert.deepEqual(imported.resolution,[768,1024]);
     assert.equal(imported.saved,0);
     await page.screenshot({path:out+'/'+name+'-'+width+'-05-import-review.png',fullPage:true});
     await page.evaluate(()=>switchView('review'));
     const adjust=page.locator('#reviewGrid article.photo-result').first().getByRole('button',{name:'Adjust',exact:true});
     await adjust.click();
     await page.waitForFunction(()=>document.querySelector('dialog.photo-adjust[open]')!==null);
     await page.screenshot({path:out+'/'+name+'-'+width+'-06-adjust-original.png',fullPage:true});
     const currentOwner=await page.evaluate(()=>window.closetAuth.user.id);
     // A real human-confirmed category, subtype and color saves through the normal IDB path.
     await page.locator('dialog.photo-adjust select[aria-label="Main category"]').selectOption('Tops');
     await page.locator('dialog.photo-adjust select[aria-label="Item type"]').selectOption('T-shirt');
     await page.locator('dialog.photo-adjust input[aria-label="Color"]').fill('Blue');
     await page.locator('dialog.photo-adjust form').evaluate(node=>node.requestSubmit());
     await page.waitForFunction(()=>items.some(x=>x.itemType==='T-shirt')&&!document.querySelector('dialog.photo-adjust[open]'),null,{timeout:20000});
     const saved=await page.evaluate(async()=>{
      const v=(await readAll()).find(x=>x.itemType==='T-shirt');
      const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
       Uint8Array.from(atob(v.originalPhoto.image.split(',')[1]),x=>x.charCodeAt(0)))),x=>x.toString(16).padStart(2,'0')).join('');
      return {owner:window.closetAuth.user.id,originalShaPreserved:v.sourceSHA256===sha,
       confirmed:v.userAdjusted===true,category:v.category,source:v.originalPhoto.origin,
       imported:v.originalPhoto.originalFileSha256,stored:v.image===v.originalPhoto.image};
     });
     assert.equal(saved.owner,currentOwner);
     assert.equal(saved.originalShaPreserved,true);
     assert.equal(saved.confirmed,true);
     assert.equal(saved.category,'Tops');
     await page.screenshot({path:out+'/'+name+'-'+width+'-07-confirmed-save.png',fullPage:true});
     // Tamper retained original AFTER capture; manual Adjust must not write a
     // photo whose canonical original bytes fail the pre-commit SHA check.
     await page.evaluate(()=>{
      const imported=batch.find(x=>x.importFilename==='licensed-fixture.png');
      imported.originalPhoto.image=items.find(x=>x.itemType==='T-shirt').image;
     });
     await page.locator('#reviewGrid article.photo-result').first().getByRole('button',{name:'Adjust',exact:true}).click();
     await page.locator('dialog.photo-adjust select[aria-label="Main category"]').selectOption('Bottoms');
     await page.locator('dialog.photo-adjust select[aria-label="Item type"]').selectOption('Jeans');
     await page.locator('dialog.photo-adjust input[aria-label="Color"]').fill('Purple');
     await page.locator('dialog.photo-adjust form').evaluate(node=>node.requestSubmit());
     await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Could not save changes.'),null,{timeout:15000});
     assert.equal(await page.evaluate(async()=>(await readAll()).length),1,
      'tampering the original must never create or overwrite saved item');
     assert.equal(await page.locator('dialog.photo-adjust[open]').count(),1,
      'failed tampered input remains reviewable without silent close');
     await page.screenshot({path:out+'/'+name+'-'+width+'-09-source-tamper-refused.png',fullPage:true});
     await page.locator('dialog.photo-adjust button').filter({hasText:'Cancel'}).click();
     // Failed video.play and interrupted visibility must stop tracks, restore
     // controls and leave saved wardrobe untouched.
     await page.evaluate(()=>{switchView('scan');setCaptureMode('single');
      window.__mock.failPreferred=false;window.__mock.failNextPlay=true;});
     const tracksBefore=await page.evaluate(()=>window.__mock.tracksStopped);
     await page.locator('#start').click();
     await page.waitForFunction(()=>document.getElementById('message').textContent.includes('Simulated video playback failure'));
     assert.equal(await page.locator('#start').isDisabled(),false);
     await page.locator('#start').click();
     await page.waitForFunction(()=>!document.getElementById('cameraActions').hidden);
     await page.evaluate(()=>{
      Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
     });
     await page.waitForFunction(()=>document.getElementById('cameraActions').hidden);
     assert.ok(await page.evaluate(()=>window.__mock.tracksStopped)>=tracksBefore+2,
      'both failed playback and background interruption must stop camera tracks');
     await page.screenshot({path:out+'/'+name+'-'+width+'-10-interruption-recovered.png',fullPage:true});
     await page.locator('#start').click();
     await page.waitForFunction(()=>!document.getElementById('cameraActions').hidden);
     const beforeLogout=await page.evaluate(()=>batch.length);
     await page.evaluate(()=>{
      const g=window.__cameraFixture.getContext('2d');
      g.fillStyle='#df722b';g.fillRect(0,0,window.__cameraFixture.width,window.__cameraFixture.height);
      document.getElementById('takePhoto').click();
      window.closetAuth.user=null;
     });
     await page.waitForFunction(()=>!captureProofTaking,null,{timeout:12000});
     const stale=await page.evaluate(async()=>({draftCount:batch.length,
      savedCount:(await readAll()).length}));
     assert.equal(stale.draftCount,beforeLogout,'late camera proof must not enter old account draft');
     assert.equal(stale.savedCount,1,'late camera proof must not save to wardrobe');
     await page.evaluate(()=>{stopCamera();window.closetAuth.user={id:'capture-proof-a'};});
     // Outfit photo handoff is source-bound; output piece cannot assert verified segmentation.
     await page.evaluate(()=>{switchView('scan');setCaptureMode('outfit');});
     const jpg=await page.evaluate(()=>{
      const c=document.createElement('canvas');c.width=750;c.height=1200;
      const g=c.getContext('2d');g.fillStyle='#dde5cb';g.fillRect(0,0,750,1200);
      g.fillStyle='#a84662';g.fillRect(230,200,310,800);
      return c.toDataURL('image/jpeg',.95).split(',')[1];
     });
     await page.locator('#outfitUpload').setInputFiles([{
      name:'outfit-original.jpg',mimeType:'image/jpeg',buffer:Buffer.from(jpg,'base64')}]);
     await page.waitForFunction(()=>batch.some(x=>x.outfitSourceId&&x.sourceHashVerified),null,{timeout:25000});
     const outfit=await page.evaluate(async()=>{
      const piece=batch.find(x=>x.outfitSourceId);
      const image=window.__mock.outfitOriginal;
      const bytes=Uint8Array.from(atob(image.split(',')[1]),x=>x.charCodeAt(0));
      const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
      return {exactOriginal:piece.originalPhoto.image===image,
       sourceHashMatches:piece.sourceSHA256===sha,
       singleVerified:piece.singleGarmentVerified===true,
       ownerCurrent:!!window.closetAuth.user,
       wasSaved:(await readAll()).some(x=>x.id===piece.id)};
     });
     assert.equal(outfit.exactOriginal,true);
     assert.equal(outfit.sourceHashMatches,true);
     assert.equal(outfit.singleVerified,false);
     assert.equal(outfit.wasSaved,false);
     await page.screenshot({path:out+'/'+name+'-'+width+'-08-outfit-handoff.png',fullPage:true});
     // Lifecycle and logout: stop camera, refuse reuse of prior-owner index.
     await page.evaluate(async()=>{
      window.closetAuth.user=null;
      await window.closetIndex02.refresh();
     });
     assert.equal(await page.evaluate(()=>window.closetIndex02.state().ready),false);
     results.push({engine:name,width,realPage:true,realCanvasJPEG:true,
      genuineWebCrypto:true,realIndexedDB:true,simulatedCamera:true,mockedWorkers:true,
      permissionDeniedAndRecovered:true,frontFacingFallback:true,
      originalFullResolution:true,unverifiedNeedsReview:true,
      originalImportConversionHonest:true,manualCorrectionSaved:true,
      tamperedSourceRefused:true,failedPlaybackStopped:true,
      visibilityInterruptStopped:true,logoutDuringPendingHashDiscarded:true,
      outfitOriginalHandoff:true,logoutClearsPrivateIndex:true,
      actualPhysicalPhone:false});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(outbound.length,0,'no unapproved off-host requests');
 assert.equal(errors.length,0,'browser exceptions: '+errors.join(' | '));
 const report={verdict:'PASS',results,errors,outbound,productionDeployed:false,
  physicalAndroidTested:false,physicalIphoneTested:false,
  freshNeuralInference:false,familyAlpha:'HOLD'};
 await writeFile(out+'/results.json',JSON.stringify(report,null,2));
 console.log('CAPTURE-PROOF-01 browser integrity and review PASS',JSON.stringify(results));
}catch(e){
 await writeFile(out+'/failure.json',JSON.stringify({error:String(e),errors,outbound,results},null,2));
 throw e;
}finally{await new Promise(resolve=>server.close(resolve));}
