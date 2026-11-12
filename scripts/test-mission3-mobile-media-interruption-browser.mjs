// Real Chromium/WebKit + native IndexedDB Mobile Mission 3 interruption.
// Browser video metadata is deterministically held; galleries use REAL JPEG
// decoding + original-SHA verification and real owner-private IndexedDB.
// No physical camera, hosted Supabase, private photos or external writes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const out=resolve(process.argv[2]||'benchmark/mission3-mobile-media-interruption-browser');
await mkdir(out,{recursive:true});
const jpeg=async color=>'data:image/jpeg;base64,'+(await sharp({
 create:{width:320,height:240,channels:3,background:color}
}).jpeg({quality:88}).toBuffer()).toString('base64');
const sourceA=await jpeg({r:70,g:129,b:178}),
 sourceB=await jpeg({r:169,g:88,b:115}),
 sourceC=await jpeg({r:100,g:185,b:99});
const root=resolve('public'),types={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!path.startsWith(root+'/')||p.includes('\\'))throw Error('Invalid local path');
  const bytes=await readFile(path);
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]])
 for(const width of [320,390,430]){
  const ownerA='a'+width+'0000-0000-4000-8000-000000000000',
   ownerB='b'+width+'0000-0000-4000-8000-000000000000';
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
   hasTouch:true,serviceWorkers:'block'});
  const external=[];
  try{
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'"+ownerA+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{}};"}));
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(['blob:','data:'].includes(url.protocol)||url.hostname==='127.0.0.1')return route.fallback();
    external.push({method:route.request().method(),urlPath:url.pathname});
    return route.abort();
   });
   await context.addInitScript(()=>{
    class OfflineWorker{
     constructor(){this.onmessage=null;this.terminated=false;}
     postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
      id:m.id,type:m.type==='load'?'ready':'result',strong:false,choices:[],details:{}
     }});},0);}
     terminate(){this.terminated=true;}
    }
    Object.defineProperty(window,'Worker',{value:OfflineWorker,configurable:true});
   });
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push({engine,width,error:String(error)}));
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>closetReady);
   const result=await page.evaluate(async({ownerA,ownerB,sourceA,sourceB,sourceC})=>{
    const bytes=image=>Uint8Array.from(atob(image.slice('data:image/jpeg;base64,'.length)),
     x=>x.charCodeAt(0));
    const sha=image=>crypto.subtle.digest('SHA-256',bytes(image)).then(b=>
     [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''));
    const file=(image,name)=>new File([bytes(image)],name,{type:'image/jpeg'});
    const draft=async ownerDB=>await new Promise((resolve,reject)=>{
     const req=ownerDB.transaction('state','readonly').objectStore('state').get('draft');
     req.onsuccess=()=>resolve(req.result?.batch||[]);
     req.onerror=()=>reject(req.error);
    });
    const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
    // Prevent unrelated recognition from auto-moving an unreviewed fixture
    // into saved items. This test measures committed review original bytes.
    const oldQueue=queueAutomatic;queueAutomatic=()=>{};
    const shaA=await sha(sourceA);
    const a=normalizeClothing({
     id:'durable-A',ownerId:ownerA,name:'Owner A original',
     category:'Tops',itemType:'T-shirt',image:sourceA,
     originalPhoto:{image:sourceA,sha256:shaA,origin:'photo-file',width:320,height:240},
     sourceSHA256:shaA,sourceHashVerified:true,
     singleGarmentVerified:false,localAnalyzed:false
    });
    batch=[a];await persistDraft({required:true});
    const initiallySaved=(await draft(db)).map(x=>x.id);
    // Hold the actual upload handler at the real video element's
    // loadedmetadata wait. The media itself is synthetic invalid bytes,
    // and MUST never reach seek/decode after pagehide.
    const originalWait=waitEvent;
    let releaseMetadata,metadataEntered=false;
    waitEvent=(target,name)=>name==='loadedmetadata'?
     new Promise(resolve=>{releaseMetadata=resolve;metadataEntered=true;}):
     originalWait(target,name);
    const oldVideo=upload(new File([new Uint8Array([1,2,3,4])],
     'synthetic-video.webm',{type:'video/webm'}));
    for(let i=0;i<40&&!metadataEntered;i++)await tick();
    if(!metadataEntered)throw Error('Old video did not suspend at metadata');
    const sourceBefore=document.getElementById('video').getAttribute('src');
    window.dispatchEvent(new Event('pagehide'));
    const afterPagehide={backgroundEpoch:mediaLifecycleEpoch,busy,
     videoImportActive,videoSrc:document.getElementById('video').getAttribute('src'),
     label:document.getElementById('captureState').textContent};
    const originalDecoder=captureProofFromFile;
    let releaseFirstGallery,decodeStarted=false;
    captureProofFromFile=async(f,o)=>{
     decodeStarted=true;await new Promise(resolve=>{releaseFirstGallery=resolve;});
     return originalDecoder(f,o);
    };
    const newGallery=importClothingPhotos([file(sourceB,'after-video.jpeg')]);
    for(let i=0;i<40&&!decodeStarted;i++)await tick();
    if(!decodeStarted)throw Error('Fresh gallery did not suspend on actual decoded photo');
    releaseMetadata();await oldVideo;
    const afterOldVideo={busy,photoImportActive,videoImportActive};
    releaseFirstGallery();await newGallery;
    captureProofFromFile=originalDecoder;waitEvent=originalWait;
    const afterGallery=await draft(db),shaB=await sha(sourceB);
    // Quick hidden->visible lifecycle test: no stale old photo can
    // resume even though document.hidden is already false at decode.
    let releaseHiddenGallery,hiddenEntered=false;
    captureProofFromFile=async(f,o)=>{
     hiddenEntered=true;await new Promise(resolve=>{releaseHiddenGallery=resolve;});
     return originalDecoder(f,o);
    };
    const oldGallery=importClothingPhotos([file(sourceC,'backgrounded.jpeg')]);
    for(let i=0;i<40&&!hiddenEntered;i++)await tick();
    if(!hiddenEntered)throw Error('Gallery did not suspend at decode');
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'hidden',{configurable:true,value:false});
    const afterHidden={busy,photoImportActive,label:document.getElementById('captureState').textContent};
    releaseHiddenGallery();await oldGallery;
    captureProofFromFile=originalDecoder;
    const afterAbort=await draft(db);
    // The owner can retry the same original and commit it normally.
    await importClothingPhotos([file(sourceC,'retry-backgrounded.jpeg')]);
    const afterRetry=await draft(db),shaC=await sha(sourceC);
    // A delayed gallery decode from A must never import to B after logout.
    let releasePreviousOwner,oldOwnerEntered=false;
    captureProofFromFile=async(f,o)=>{
     oldOwnerEntered=true;await new Promise(resolve=>{releasePreviousOwner=resolve;});
     return originalDecoder(f,o);
    };
    const oldOwnerGallery=importClothingPhotos([file(sourceB,'old-owner.jpeg')]);
    for(let i=0;i<40&&!oldOwnerEntered;i++)await tick();
    if(!oldOwnerEntered)throw Error('Old owner did not start decode');
    window.dispatchEvent(new Event('closet:session-locked'));
    window.closetAuth.user={id:ownerB};
    db=await openDB();
    releasePreviousOwner();await oldOwnerGallery;
    const afterOwnerChange=await draft(db);
    return {
     sourceBefore,initiallySaved,
     afterPagehide,afterOldVideo,
     afterGallery:afterGallery.map(x=>({id:x.id,owner:x.ownerId,sha:x.sourceSHA256,
      originalHash:x.originalPhoto?.sha256})),shaA,shaB,
     afterHidden,afterAbort:afterAbort.map(x=>x.id),
     afterRetry:afterRetry.map(x=>({id:x.id,sha:x.sourceSHA256,owner:x.ownerId})),
     shaC,afterOwnerChange:afterOwnerChange.map(x=>x.id),
     currentOwner:window.closetAuth.user.id,
     currentMediaBusy:busy,videoImportActive,photoImportActive
    };
   },{ownerA,ownerB,sourceA,sourceB,sourceC});
   assert.match(result.sourceBefore,/^blob:/);
   assert.deepEqual(result.initiallySaved,['durable-A']);
   assert.equal(result.afterPagehide.videoSrc,null);
   assert.equal(result.afterPagehide.videoImportActive,false);
   assert.equal(result.afterPagehide.busy,false);
   assert.match(result.afterPagehide.label,/Video import interrupted/);
   assert.equal(result.afterOldVideo.busy,true);
   assert.equal(result.afterOldVideo.photoImportActive,true);
   assert.equal(result.afterOldVideo.videoImportActive,false);
   assert.equal(result.afterGallery.length,2);
   assert.equal(result.afterGallery[0].id,'durable-A');
   assert.equal(result.afterGallery[0].sha,result.shaA);
   assert.equal(result.afterGallery[1].sha,result.shaB);
   assert.equal(result.afterGallery[1].originalHash,result.shaB);
   assert.equal(result.afterHidden.busy,false);
   assert.equal(result.afterHidden.photoImportActive,false);
   assert.match(result.afterHidden.label,/Photo import paused/);
   assert.equal(result.afterAbort.length,2);
   assert.equal(result.afterRetry.length,3);
   assert.ok(result.afterRetry.some(x=>x.sha===result.shaC&&x.owner===ownerA));
   assert.deepEqual(result.afterOwnerChange,[]);
   assert.equal(result.currentOwner,ownerB);
   assert.equal(result.currentMediaBusy,false);
   assert.equal(result.videoImportActive,false);
   assert.equal(result.photoImportActive,false);
   assert.equal(external.some(x=>x.method!=='GET'),false,'No remote media or cloud mutation');
   const screenshot=await page.screenshot({path:resolve(out,engine+'-'+width+'-interrupt.png')});
   assert.equal((await sharp(screenshot).metadata()).width,width);
   cases.push({engine,width,realChromiumWebKit:true,
    quickForegroundVideoCancellation:true,oldFinalizerCannotUnlockNewGallery:true,
    committedDraftPreserved:true,quickForegroundGalleryCancellation:true,
    retryAfterInterruption:true,oldOwnerDecodeRevoked:true,
    nativeIndexedDB:true,actualJPEGDecoding:true,realOriginalSHA:true,
    hostedSupabase:false,physicalPhone:false,
    screenshotSHA256:createHash('sha256').update(screenshot).digest('hex')});
  }finally{await context.close();await browser.close();}
 }
 assert.equal(cases.length,6);assert.deepEqual(errors,[]);
 const receipt={kind:'mission3-mobile-media-interruption',
  familyAlpha:'HOLD',hostedSupabase:false,physicalPhones:false,
  syntheticMediaOnly:true,cases,errors};
 const data=JSON.stringify(receipt,null,2)+'\n';
 await writeFile(resolve(out,'results.json'),data);
 await writeFile(resolve(out,'sha256.txt'),
  createHash('sha256').update(data).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit 320/390/430 browser media cancellation, private JPEG retry and account-switch cases');
}finally{server.close();}
