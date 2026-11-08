/**
 * P170 actual native <video> canvas frame captured via real browser MediaStream
 * API; getUserMedia acquisition is injected from a synthetic canvas source.
 * Source and stream are REAL live browser video frames, not a mocked video
 * readyState/drawImage or pre-injected garment candidate. NOT physical phones.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
const root=resolve('.'),out='benchmark/native-mobile-camera-session-170';
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/public\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))
   throw Error('Forbidden path');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/public/'))throw Error('Forbidden directory');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+'/public/index.html';
const owner='synthetic-camera-170-owner';
const results=[],errors=[],screens=[];
function setup(){
 const camera={calls:0,trackStop:0,started:0,denials:0,hold:false,queued:[],frames:0};
 window.__camera170=camera;
 const getUserMedia=async()=>{
  camera.calls++;
  if(camera.denyOnce){camera.denyOnce=false;camera.denials++;
   throw new DOMException('Permission denied','NotAllowedError');}
  const source=document.createElement('canvas');
  source.width=640;source.height=480;
  const ctx=source.getContext('2d');
  const draw=()=>{
   camera.frames++;
   ctx.fillStyle='#e9e5de';ctx.fillRect(0,0,640,480);
   ctx.fillStyle='#187a55';ctx.fillRect(180,80,275,310);
   ctx.fillStyle='#b7d1a2';ctx.fillRect(303,82,15,300);
   ctx.fillStyle='#187a55';ctx.fillRect(135,125,65,145);
   ctx.fillStyle='#187a55';ctx.fillRect(432,125,65,145);
   ctx.fillStyle=camera.frames%2?'#a3b3cf':'#d4d9e5';ctx.fillRect(304,140,12,6);
  };
  draw();
  if(typeof source.captureStream!=='function')throw new DOMException(
   'This browser does not support synthetic canvas captureStream','NotSupportedError');
  const media=source.captureStream(20);
  const anim=setInterval(draw,75);
  for(const track of media.getTracks()){
   const stop=track.stop.bind(track);track.stop=()=>{
    camera.trackStop++;clearInterval(anim);stop();
   };
  }
  camera.started++;
  if(camera.hold){return new Promise(resolve=>camera.queued.push(()=>resolve(media)));}
  return media;
 };
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia}});
 class ReviewOnlyWorker{
  constructor(){this.onmessage=null;this.terminated=false;}
  postMessage(data){
   const respond=payload=>setTimeout(()=>{
    if(!this.terminated)this.onmessage?.({data:{id:data.id,...payload}});
   },0);
   if(data.type==='load')respond({type:'ready'});
   else if(data.type==='classify')respond({type:'result',strong:false,
    categoryConfirmed:false,choices:[],details:{}});
  }
  terminate(){this.terminated=true;}
 }
 Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
}
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true,args:engine==='chromium'?
   ['--disable-dev-shm-usage','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
     deviceScaleFactor:1,hasTouch:true,serviceWorkers:'block'});
    await context.addInitScript(()=>{
     localStorage.setItem('closet-current-auth-v1',JSON.stringify({
      epoch:'synthetic-170-epoch',access_token:'synthetic-access',
      refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600
     }));
    });
    await context.addInitScript(setup);
    await context.route('**/*',route=>{
     const req=route.request().url(),u=new URL(req);
     if(u.protocol==='blob:'||u.protocol==='data:'||u.hostname==='127.0.0.1')
      return route.continue();
     if(u.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&
        u.pathname==='/auth/v1/token')
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
       access_token:'synthetic-access',refresh_token:'synthetic-refresh',
       expires_in:3600,user:{id:owner,email:'p170@example.invalid',
        user_metadata:{username:'Camera P170'}}
      })});
     return route.abort();
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(engine+'/'+width+':'+String(error)));
    try{
     await page.goto(host,{waitUntil:'domcontentloaded'});
     await page.evaluate(async()=>{await window.closetAuth.ready;await closetReady;});
     await page.evaluate(()=>switchView('scan'));
     // Refused camera permission is recoverable; no permission retry bypass.
     await page.evaluate(()=>{window.__camera170.denyOnce=true;});
     await page.locator('#start').click();
     await page.waitForFunction(()=>document.getElementById('message')
      .textContent.includes('permission was denied'));
     assert.equal(await page.locator('#start').isDisabled(),false);
     assert.equal(await page.locator('#cameraChoices').isVisible(),true);
     // This is a genuine browser MediaStream captureStream feeding <video>.
     await page.locator('#start').click();
     await page.waitForFunction(()=>stream&&video.srcObject===stream&&
       video.readyState>=2&&video.videoWidth===640&&video.videoHeight===480,
      null,{timeout:25000});
     const active=await page.evaluate(()=>({
      ready:video.readyState,width:video.videoWidth,height:video.videoHeight,
      mode:cameraMode,hasMediaStream:stream instanceof MediaStream,
      liveTracks:stream.getVideoTracks().filter(x=>x.readyState==='live').length,
      frames:window.__camera170.frames
     }));
     assert.equal(active.hasMediaStream,true);assert.equal(active.liveTracks,1);
     assert.equal(active.mode,'manual');
     const camPath=out+'/'+engine+'-'+width+'-camera-active.png';
     await page.screenshot({path:camPath});
     screens.push(camPath);
     await page.locator('#takePhoto').click();
     await page.waitForFunction(()=>batch.length===1&&batch[0].sourceHashVerified===true,
       null,{timeout:20000});
     const source=await page.evaluate(async()=>{
      const photo=batch[0],bytes=new Uint8Array(await(await fetch(photo.image)).arrayBuffer());
      const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
       .map(x=>x.toString(16).padStart(2,'0')).join('');
      return {digest,sourceSHA:photo.sourceSHA256,storedSHA:photo.originalPhoto?.sha256,
       ownerId:photo.ownerId,original:photo.originalPhoto?.image===photo.image,
       dimensions:[photo.originalPhoto?.width,photo.originalPhoto?.height],
       origin:photo.originalPhoto?.origin,reviewed:photo.singleGarmentVerified,
       admitted:photo.sourceHashVerified};
     });
     assert.equal(source.digest,source.sourceSHA);
     assert.equal(source.digest,source.storedSHA);
     assert.equal(source.original,true);
     assert.equal(source.ownerId,owner);
     assert.equal(source.reviewed,false);
     assert.deepEqual(source.dimensions,[640,480]);
     assert.equal(source.origin,'camera');
     await page.locator('#stop').click();
     await page.waitForFunction(()=>document.getElementById('review').hidden===false);
     const reviewPath=out+'/'+engine+'-'+width+'-verified-review.png';
     await page.screenshot({path:reviewPath});
     screens.push(reviewPath);
     const stopped=await page.evaluate(()=>window.__camera170.trackStop);
     assert.ok(stopped>=1,'camera tracks must release on Done');
     // Complete real human-review UI and owner-private commit.
     await page.locator('#reviewGrid article.photo-result')
      .getByRole('button',{name:'Adjust',exact:true}).click();
     await page.waitForFunction(()=>document.querySelector('dialog.photo-adjust[open]')!==null);
     await page.locator('dialog.photo-adjust input[aria-label="Item name"]').fill('P170 camera shirt');
     await page.locator('dialog.photo-adjust select[aria-label="Main category"]').selectOption('Tops');
     await page.locator('dialog.photo-adjust select[aria-label="Item type"]').selectOption('T-shirt');
     await page.locator('dialog.photo-adjust input[aria-label="Color"]').fill('Green');
     await page.locator('dialog.photo-adjust input[aria-label="I verified the category, clothing type and color"]').check();
     await page.locator('dialog.photo-adjust input[aria-label="I confirmed this photo shows one garment"]').check();
     await page.locator('dialog.photo-adjust form').evaluate(form=>form.requestSubmit());
     await page.waitForFunction(()=>items.some(x=>x.name==='P170 camera shirt')&&
       !document.querySelector('dialog.photo-adjust[open]'),null,{timeout:20000});
     const saved=await page.evaluate(async()=>{
      const item=(await readAll()).find(x=>x.name==='P170 camera shirt');
      return {sourceSHA:item?.sourceSHA256,reviewed:item?.ownerReviewed,
       owner:item?.ownerId,original:item?.originalPhoto?.image===item?.image,
       count:(await readAll()).length};
     });
     assert.equal(saved.sourceSHA,source.digest);
     assert.equal(saved.owner,owner);
     assert.equal(saved.original,true);
     assert.equal(saved.count,1);
     // The actual freeze event must release camera; saved original remains.
     await page.evaluate(()=>switchView('scan'));
     await page.locator('#start').click();
     await page.waitForFunction(()=>stream&&video.readyState>=2&&video.videoWidth===640);
     const beforeFreeze=await page.evaluate(()=>window.__camera170.trackStop);
     await page.evaluate(()=>document.dispatchEvent(new Event('freeze')));
     await page.waitForFunction(()=>stream===null&&!cameraOpening);
     const afterFreeze=await page.evaluate(async()=>({
      stopped:window.__camera170.trackStop,owned:(await readAll()).length
     }));
     assert.ok(afterFreeze.stopped>beforeFreeze);
     assert.equal(afterFreeze.owned,1);
     // Late getUserMedia resolves AFTER leaving camera page. Its real track
     // must be stopped and its frame must not enter a foreign scan.
     await page.evaluate(()=>{window.__camera170.hold=true;});
     await page.locator('#start').click();
     await page.waitForFunction(()=>cameraOpening&&window.__camera170.queued.length>0);
     const beforeLate=await page.evaluate(()=>window.__camera170.trackStop);
     await page.evaluate(()=>switchView('closet'));
     await page.evaluate(()=>{window.__camera170.queued.splice(0).forEach(fn=>fn());});
     await page.waitForFunction(previous=>window.__camera170.trackStop>previous&&
       !cameraOpening&&stream===null,beforeLate,{timeout:20000});
     const final=await page.evaluate(async()=>({
      saved:(await readAll()).length,owner:window.closetAuth.user.id,
      stopped:window.__camera170.trackStop,queued:window.__camera170.queued.length,
      cameraOpen:!!stream,reviewed:items.some(x=>x.name==='P170 camera shirt')
     }));
     assert.equal(final.cameraOpen,false);
     assert.equal(final.saved,1);
     assert.equal(final.reviewed,true);
     assert.equal(final.owner,owner);
     results.push({engine,width,originalSHA:source.digest,validFrame:true,
      permissionDeniedRecovered:true,freezeTrackStopped:true,
      latePermissionTrackReleased:final.stopped>beforeLate,
      originalOwnerPrivate:true,physicalPhone:false});
     assert.equal(results.at(-1).latePermissionTrackReleased,true);
     console.log('P170_REAL_MEDIASTREAM_CAMERA_OWNED_SHA_PASS '+JSON.stringify({engine,width}));
    }catch(e){throw Error(engine+'/'+width+': '+String(e?.stack||e));}
    finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(results.length,6);
 assert.equal(screens.length,12);
 assert.equal(errors.length,0,'No unresolved browser page errors');
 const digests=new Set();
 for(const png of screens)digests.add(createHash('sha256').update(await readFile(png)).digest('hex'));
 assert.equal(digests.size,12);
 const result={priority:170,verdict:'PASS',results,realVideoElements:true,
  realCanvasMediaStreamTracks:true,fakeCameraMediaSource:true,
  actualPhysicalAndroidIPhone:false,actualHardwareCamera:false,
  completeThreeOutfitStylingVerifiedHere:false,
  inheritedP167StyleBrowserSeparatelyRequired:true,
  originalSourceSHA256Preserved:results.every(x=>x.originalOwnerPrivate),
  screenshotSHA256Count:digests.size,engines:['chromium','webkit'],
  widths:[320,390,430],familyAlpha:'HOLD',releaseAuthorized:false};
 await writeFile(out+'/camera-lifecycle-acceptance.json',JSON.stringify(result,null,2));
 console.log('P170_REAL_SIX_CAMERA_MOBILE_CASES_12_SCREENSHOTS_PASS '+JSON.stringify({
  cases:results.length,screens:digests.size,hardware:result.actualHardwareCamera}));
}catch(e){
 await writeFile(out+'/failure.json',JSON.stringify({
  error:String(e?.stack||e),results,errors},null,2));
 throw e;
}finally{await new Promise(resolve=>server.close(resolve));}
