// Mission 3: 1,000 visually distinct high-resolution synthetic garment JPEGs.
// Tests actual browser IndexedDB first-login metadata probe, full-photo clone
// count, bounded browser heap observations and reload pause. No user photos,
// hosted Auth/Storage/JWT or deployment; FAMILY ALPHA HOLD #255.
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,extname} from 'node:path';

const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/mission3-cold-login-photo-browser');
await mkdir(out,{recursive:true});
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.html':'text/html','.json':'application/json','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>Mission 3 browser memory test</title></head><body>'+
 '<h1>Private closet cloud recovery</h1><p id="cloudStatus" role="status"></p>'+
 '<button id="syncCloset">Sync closet</button><button id="resolveCloudConflict" hidden>Keep both</button>'+
 '<div id="cloudBanner" role="status"></div>'+
 '<script src="/cloud-backup-engine.js"></script><script src="/cloud-backup.js"></script>'+
 '</body></html>';
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/__seed'||pathname==='/__probe'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
   res.end(pathname==='/__seed'?'<html><title>Seed</title></html>':html);return;
  }
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(root+'/')||pathname.includes('\\'))throw Error('Unsafe file path');
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const originals=[],sourceHashes=new Set(),pixels={width:1280,height:1680};
try{
 // Each source has a different rendered silhouette/pattern, rather than
 // reusing one JPEG and falsely counting it as 1,000 separate photos.
 for(let i=0;i<1000;i++){
  const hue=(i*137)%360;
  let weave='';
  for(let stripe=0;stripe<42;stripe++){
   const shade=(hue+(stripe*11+i%37))%360;
   weave+='<rect x="'+(300+stripe*16)+'" y="270" width="8" height="1180" '+
    'fill="hsl('+shade+',45%,48%)" opacity="'+(0.18+(stripe%5)*0.1)+'"/>';
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1680">'+
   '<rect width="1280" height="1680" fill="hsl('+(hue+170)%360+',15%,91%)"/>'+
   '<path d="M420 210 L520 150 H760 L860 210 L1070 480 L900 610 L815 460 '+ 
   'L815 1460 H465 V460 L380 610 L210 480 Z" fill="hsl('+hue+',53%,45%)"/>'+
   weave+'<path d="M520 150 Q640 315 760 150" fill="none" stroke="white" '+
   'stroke-width="15"/><text x="570" y="900" font-size="70" fill="#222">'+
   String(i).padStart(4,'0')+'</text></svg>';
  const bytes=await sharp(Buffer.from(svg)).jpeg({quality:68}).toBuffer();
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.ok(!sourceHashes.has(hash),'1000 sources must have different visible pixels and SHA');
  sourceHashes.add(hash);
  originals.push('data:image/jpeg;base64,'+bytes.toString('base64'));
 }
 const sourceBytes=originals.reduce((n,s)=>n+Buffer.byteLength(s.slice('data:image/jpeg;base64,'.length),'base64'),0);
 const results=[],pageErrors=[];
 async function one(engine,factory,width){
  const owner=randomUUID(),requests=[];
  const browser=await factory.launch({headless:true,
   ...(engine==='chromium'?{args:['--no-sandbox','--enable-precise-memory-info']}: {})});
  const context=await browser.newContext({viewport:{width,height:844},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   await context.route(cloud+'/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    const verb=request.method();
    const authorization=request.headers().authorization?.slice('Bearer '.length);
    assert.equal(authorization,owner,'mock cloud transport must be owner-scoped');
    requests.push({path,verb});
    if(path==='/rest/v1/closet_backups'){
     const q=new URL(request.url()).searchParams;
     assert.equal(q.get('owner_id'),'eq.'+owner);
     assert.equal(q.get('select'),'revision');
     return route.fulfill({status:200,contentType:'application/json',body:'[]'});
    }
    if(path.startsWith('/storage/v1/object/closet-private/')&&verb==='POST'){
     assert.ok(path.startsWith('/storage/v1/object/closet-private/'+owner+'/'));
     // Deliberate remote 413 prevents 1,000 unrelated network writes after
     // we exercise the actual full-photo encode and single owner snapshot.
     return route.fulfill({status:413,contentType:'application/json',body:'{}'});
    }
    throw Error('Unexpected synthetic cloud endpoint '+verb+' '+path);
   });
   const seed=await context.newPage();
   await seed.goto(origin+'/__seed',{waitUntil:'domcontentloaded'});
   for(let offset=0;offset<1000;offset+=100){
    await seed.evaluate(async({owner,part,offset})=>{
     const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('closet-current-user-'+owner,2);
      r.onupgradeneeded=()=>{
       r.result.createObjectStore('items',{keyPath:'id'});
       r.result.createObjectStore('state',{keyPath:'id'});
      };
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     await new Promise((resolve,reject)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      for(let j=0;j<part.length;j++)tx.objectStore('items').put({
       id:'first-login-original-'+String(offset+j).padStart(4,'0'),
       ownerId:owner,category:'Tops',color:'Navy',image:part[j]});
      if(offset===0)tx.objectStore('state').put({
       id:'cloud-sync',baseVersion:0,localRevision:10,dirty:false,baseDocument:null});
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
     });db.close();
    },{owner,part:originals.slice(offset,offset+100),offset});
   }
   await seed.close();
   const page=await context.newPage();
   page.on('pageerror',e=>pageErrors.push({engine,width,message:e.message}));
   await page.addInitScript(()=>{
    const proto=IDBObjectStore.prototype,all=proto.getAll,count=proto.count;
    window.__photoReads={getAll:0,count:0};
    proto.getAll=function(...args){if(this.name==='items')window.__photoReads.getAll++;return all.apply(this,args);};
    proto.count=function(...args){if(this.name==='items')window.__photoReads.count++;return count.apply(this,args);};
   });
   await page.goto(origin+'/__probe',{waitUntil:'domcontentloaded'});
   let cdp=null,peakHeap=null,interval=null,metrics=[];
   if(engine==='chromium'){
    cdp=await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    interval=setInterval(async()=>{
     try{
      const stats=await cdp.send('Performance.getMetrics');
      const mem=stats.metrics.find(x=>x.name==='JSHeapUsedSize')?.value;
      if(mem!==undefined)metrics.push(mem);
     }catch{}
    },70);
   }
   try{
    await page.evaluate(async owner=>{
     window.closetAuth={user:{id:owner},ready:Promise.resolve(),
      getAccessToken:async()=>owner,assertCurrent(){}};
     const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('closet-current-user-'+owner,2);
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     window.__ownerDB=db;
     await closetCloud.start(db,{capture:fn=>fn(),canRestore:()=>true,async restored(){}});
    },owner);
   }finally{if(interval)clearInterval(interval);}
   peakHeap=metrics.length?Math.max(...metrics):null;
   await page.waitForFunction(()=>document.getElementById('cloudStatus')
    ?.textContent.includes('Cloud rejected a photograph as too large'),null,{timeout:30000});
   const measured=await page.evaluate(async()=>{
    const tx=window.__ownerDB.transaction(['items','state'],'readonly');
    const request=tx.objectStore('state').get('cloud-sync');
    const cnt=tx.objectStore('items').count();
    const [marker,total]=await Promise.all([
     new Promise(resolve=>request.onsuccess=()=>resolve(request.result)),
     new Promise(resolve=>cnt.onsuccess=()=>resolve(cnt.result))
    ]);
    return {reads:{...window.__photoReads},marker,total,status:document.getElementById('cloudStatus').textContent};
   });
   assert.equal(measured.reads.getAll,1,'must not clone every full-res JPEG twice on cold login');
   assert.ok(measured.reads.count>=1,'metadata count must precede first full snapshot');
   assert.equal(measured.total,1000);
   assert.equal(measured.marker.dirty,true);
   assert.equal(measured.marker.baseVersion,0);
   assert.equal(measured.marker.capacityPause,413);
   assert.equal(requests.filter(x=>x.path.endsWith('/save_closet_backup')).length,0);
   if(peakHeap!==null)assert.ok(peakHeap<768*1024*1024,'synthetic peak Chromium JS heap exceeded 768 MiB');
   const before=requests.length;
   await page.reload({waitUntil:'domcontentloaded'});
   await page.evaluate(async owner=>{
    window.closetAuth={user:{id:owner},ready:Promise.resolve(),
     getAccessToken:async()=>owner,assertCurrent(){}};
    const db=await new Promise((resolve,reject)=>{
     const r=indexedDB.open('closet-current-user-'+owner,2);
     r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    window.__ownerDB=db;
    await closetCloud.start(db,{capture:fn=>fn(),canRestore:()=>true,async restored(){}});
   },owner);
   assert.equal(requests.length,before,'blocked 413 must survive reload without downloading JPEGs');
   assert.equal(await page.evaluate(()=>window.__photoReads.getAll),0);
   const png=await page.screenshot({path:resolve(out,engine+'-'+width+'-cold-owned-photos.png')});
   assert.equal((await sharp(png).metadata()).width,width);
   return {engine,width,syntheticOnly:true,distinctVisibleJPEGSources:1000,
    jpegPixelDimensions:pixels,sourceBytes,localGetAllCalls:measured.reads.getAll,
    metadataCountCalls:measured.reads.count,firstLoginInitialRevision:0,
    jpegCapacityStopSurvivesReload:true,peakChromiumJSHeapBytes:peakHeap,
    screenshotSha256:createHash('sha256').update(png).digest('hex'),
    genuineOwnerPhotos:false,hostedSupabase:false,physicalDevice:false};
  }finally{await context.close();await browser.close();}
 }
 for(const [name,factory] of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])results.push(await one(name,factory,width));
 assert.deepEqual(pageErrors,[]);
 await writeFile(resolve(out,'results.json'),JSON.stringify({
  mission:3,scenario:'1000 distinct rendered high-resolution synthetic garment JPEG cold login',
  cases:results,errors:pageErrors,
  limitations:{syntheticDrawnSourcesNotActualPhotographs:true,
   browserSyntheticCloud:true,realPhonesUntested:true,
   chromiumJSHeapSamplingOnly:true,physicalOwnerPhotoHeapNotAccepted:true,
   familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,uniquePhotos:sourceHashes.size,
  bytes:sourceBytes,errors:pageErrors.length,output:out}));
}finally{await new Promise(r=>server.close(r));}
