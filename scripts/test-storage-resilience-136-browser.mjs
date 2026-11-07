import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('.'),out=resolve('benchmark/storage-resilience-136');
await mkdir(out,{recursive:true});
const PARENT=process.env.P136_PARENT_SHA||'59ec81353d03a6a5443c9370f209d7e367456e26';
const baselineApp=execFileSync('git',['show',`${PARENT}:public/app.js`],{encoding:'utf8'});
const imageBytes=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100"><defs><linearGradient id="g"><stop stop-color="#174f42"/><stop offset=".5" stop-color="#d6c7a7"/><stop offset="1" stop-color="#284453"/></linearGradient><pattern id="p" width="17" height="17" patternUnits="userSpaceOnUse"><path d="M0 0h8v8H0z" fill="#fff" opacity=".2"/><path d="M8 8h9v9H8z" fill="#111" opacity=".12"/></pattern></defs><rect width="900" height="1100" fill="#ddd"/><path d="M245 160l120-80h170l120 80 110 260-120 70-70-130v570H325V360l-70 130-120-70z" fill="url(#g)"/><path d="M245 160l120-80h170l120 80 110 260-120 70-70-130v570H325V360l-70 130-120-70z" fill="url(#p)"/></svg>')).jpeg({quality:84}).toBuffer();
const cutoutBytes=await sharp(imageBytes).extract({left:100,top:120,width:680,height:850}).jpeg({quality:82}).toBuffer();
const sourceURI='data:image/jpeg;base64,'+imageBytes.toString('base64');
const cutoutURI='data:image/jpeg;base64,'+cutoutBytes.toString('base64');
const backupSerialization=[];
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.bin':'application/octet-stream','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public|research|benchmark|node_modules)\//.test(path)||path.split('/').includes('..')||path.includes('\\'))throw Error('invalid path');
  const body=await readFile(resolve(root,'.'+path));
  res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,authBase='https://hlkgymugtfbirlpunsra.supabase.co';
const cases=[],screenshots=[],errors=[];
async function serveApp(page,engine,width,baseline){
 await page.route('**/*',route=>{
  const request=route.request(),url=request.url();
  if(baseline&&url===origin+'/public/app.js')return route.fulfill({status:200,contentType:'text/javascript',body:baselineApp});
  if(url===origin+'/public/cloud-backup.js')return route.fulfill({status:200,contentType:'text/javascript',body:'window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};'});
  if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:'+origin))return route.continue();
  if(url.startsWith(authBase+'/auth/v1/')){
   const u=new URL(url);
   if(u.pathname==='/auth/v1/token'){
    const data=JSON.parse(request.postData()||'{}');
    if(u.searchParams.get('grant_type')==='password'&&data.email==='storage136@example.test'||
       u.searchParams.get('grant_type')==='refresh_token'&&data.refresh_token==='synthetic-refresh-136')
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:{id:'synthetic-storage136'},access_token:'synthetic-token-136',refresh_token:'synthetic-refresh-136',expires_in:3600})});
   }
   if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
  }
  if(request.method()!=='GET')errors.push({engine,width,method:request.method(),host:new URL(url).host});
  return route.abort();
 });
 await page.goto(origin+'/public/index.html',{waitUntil:'domcontentloaded'});
 await page.locator('#authEmail').fill('storage136@example.test');await page.locator('#authPassword').fill('test-password');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>window.closetAuth?.user?.id==='synthetic-storage136'&&db?.name==='closet-current-user-synthetic-storage136');
}
async function seedAndOpen(page,count){
 const bulkWriteMs=await page.evaluate(async ({count,sourceURI,cutoutURI,sourceBytes,cutoutBytes})=>{
  const started=performance.now();
  const tx=db.transaction(['items','state'],'readwrite'),items=tx.objectStore('items');
  items.clear();
  for(let i=0;i<count;i++){
   const row={id:'p136-'+String(i).padStart(4,'0'),ownerId:'synthetic-storage136',name:'Synthetic garment '+i,
    category:['Tops','Bottoms','Shoes','Dresses'][i%4],itemType:['T-shirt','Jeans','Sneakers','Dress'][i%4],color:['Green','Blue','Black','Red'][i%4],
    image:cutoutURI,sourceSHA256:'a'.repeat(64),originalPhoto:{image:sourceURI,sha256:'a'.repeat(64)},
    sourcePhotoId:'shared-source-'+Math.floor(i/2),outfitSourceId:'shared-source-'+Math.floor(i/2),cutoutSHA256:'b'.repeat(64),
    segmentHint:{cutoutImage:cutoutURI,cutoutSHA256:'b'.repeat(64)},userAdjusted:true,seasons:['All seasons'],notes:'Synthetic benchmark metadata'};
   items.put(row);
  }
  tx.objectStore('state').put({id:'outfit-board',current:{slots:{top:'p136-0000',bottom:'p136-'+String(count-1).padStart(4,'0')}},saved:[{id:'p136-saved-look',name:'Synthetic saved outfit',slots:{top:'p136-0000'}}]});
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});
  return performance.now()-started;
 },{count,sourceURI,cutoutURI,sourceBytes:imageBytes.length,cutoutBytes:cutoutBytes.length});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(n=>document.querySelector('#closetCount')?.textContent===String(n),count,{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#savedBoards')?.textContent.includes('Synthetic saved outfit'),null,{timeout:30000});
 const saved=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result?.saved?.[0]||null);r.onerror=()=>reject(r.error);}));
 assert.equal(saved.id,'p136-saved-look');assert.equal(saved.slots.top,'p136-0000');
 return {bulkWriteMs:+bulkWriteMs.toFixed(3),reloadToClosetReadyMs:+(await page.evaluate(()=>performance.now())).toFixed(3)};
}
async function measure(engine,browserType,width,count,baseline,repeat,screenshot=false){
 const browser=await browserType.launch({headless:true,...engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {}});
 const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push({engine,width,baseline,error:String(e)}));
 await serveApp(page,engine,width,baseline);const storageTimes=await seedAndOpen(page,count);
 const allCardsBefore=await page.locator('#closetGrid .card').count();
 await page.locator('.tab[data-view="closet"]').click();
 await page.evaluate(()=>{window.__p136Start=performance.now();});
 await page.locator('#closetAllPieces').click();
 await page.waitForFunction(({expected,baseline})=>{
  const n=document.querySelectorAll('#closetGrid .card').length;
  return n===(baseline||expected<=100?expected:48);
 },{expected:count,baseline},{timeout:30000});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const elapsed=await page.evaluate(()=>performance.now()-window.__p136Start);
 const cards=await page.locator('#closetGrid .card').count();
 assert.equal(await page.locator('#closetCount').textContent(),String(count));
 let screenshotFile=null;
 if(screenshot){
  assert.equal(await page.locator('#closetCollection').isVisible(),true,'closet collection must be open in screenshot');
  await page.locator('#closetGrid .card').first().scrollIntoViewIfNeeded();
  screenshotFile=`${engine}-${width}-500-browse.png`;
  const png=await page.screenshot({path:resolve(out,screenshotFile),fullPage:false,animations:'disabled'});
  const meta=await sharp(png).metadata();assert.equal(meta.width,width);assert.ok(png.length>3000);
  screenshots.push({file:screenshotFile,engine,width,sha256:await import('node:crypto').then(({createHash})=>createHash('sha256').update(png).digest('hex')),cardsVisible:cards});
 }
 if(!baseline&&count>100){
  await context.setOffline(true);
  await page.getByRole('button',{name:'Show more clothing'}).click();
  await page.waitForFunction(expected=>document.querySelectorAll('#closetGrid .card').length===Math.min(expected,96),count);
  assert.equal(await page.locator('#closetGrid .card').count(),Math.min(count,96));
  await page.locator('#search').fill(`Synthetic garment ${count-1}`);
  await page.waitForFunction(()=>document.querySelectorAll('#closetGrid .card').length===1);
  assert.equal(await page.locator('#closetGrid h3').textContent(),`Synthetic garment ${count-1}`);
  await page.locator('#search').fill('');
  await page.waitForFunction(()=>document.querySelectorAll('#closetGrid .card').length===48);
  await context.setOffline(false);
 }
 const measure={engine,width,count,baseline,repeat,screenshot,bulkWriteMs:storageTimes.bulkWriteMs,reloadToClosetReadyMs:storageTimes.reloadToClosetReadyMs,elapsedMs:+elapsed.toFixed(3),cardsVisible:cards,initialCards:allCardsBefore,
  sourceJPEGBytes:imageBytes.length,cutoutJPEGBytes:cutoutBytes.length,recordPhotoPayloadBytes:count*(2*sourceURI.length+2*cutoutURI.length),
  jsHeapBytes:await page.evaluate(()=>performance.memory?.usedJSHeapSize??null),storageEstimate:await page.evaluate(()=>navigator.storage?.estimate?.().then(x=>({usage:x.usage,quota:x.quota})).catch(()=>null)??null)};
 if(engine==='chromium'&&width===390&&repeat===1&&baseline){
  const serial=await page.evaluate(({count,sourceURI,cutoutURI})=>{
   const rows=Array.from({length:count},(_,i)=>({id:'backup-'+i,ownerId:'synthetic-storage136',category:'Tops',itemType:'T-shirt',color:'Green',
    image:cutoutURI,sourceSHA256:'a'.repeat(64),originalPhoto:{image:sourceURI,sha256:'a'.repeat(64)},cutoutSHA256:'b'.repeat(64),
    segmentHint:{cutoutImage:cutoutURI,cutoutSHA256:'b'.repeat(64)},userAdjusted:true}));
   const before=performance.now(),json=JSON.stringify({format:'closet-current',version:4,items:rows,state:{'outfit-board':{saved:[{id:'backup-look',slots:{top:'backup-0'}}]}}});
   return {durationMs:+(performance.now()-before).toFixed(3),bytes:json.length};
  },{count,sourceURI,cutoutURI});
  backupSerialization.push({count,...serial,engine:'Chromium',where:'browser JSON serialization only; no cloud request'});
 }
 cases.push(measure);await context.close();await browser.close();return measure;
}
try{
 const repeats=Number(process.env.P136_REPEATS||3),sizes=[25,100,250,500,1000];
 const selectedEngines=(process.env.P136_ENGINES||'chromium,webkit').split(',').filter(x=>['chromium','webkit'].includes(x));
 for(const size of sizes)for(let repeat=1;repeat<=repeats;repeat++){
  await measure('chromium',chromium,390,size,true,repeat);
  await measure('chromium',chromium,390,size,false,repeat);
 }
 for(const [engine,browserType]of [['chromium',chromium],['webkit',webkit]].filter(([name])=>selectedEngines.includes(name)))for(const width of [320,390,430])
  await measure(engine,browserType,width,500,false,1,true);
 assert.deepEqual(errors,[]);assert.equal((await Promise.resolve(errors)).length,0);
 const percentile=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];};
 const summary=sizes.map(count=>{
  const entries=cases.filter(x=>x.engine==='chromium'&&x.width===390&&x.count===count&&!x.screenshot);
  const series=(baseline,key)=>{const values=entries.filter(x=>x.baseline===baseline).map(x=>x[key]);return {repeats:values.length,p50Ms:+percentile(values,.5).toFixed(3),p95Ms:+percentile(values,.95).toFixed(3)};};
  return {garments:count,baseline:{cardRender:series(true,'elapsedMs'),bulkWrite:series(true,'bulkWriteMs'),reloadToReady:series(true,'reloadToClosetReadyMs')},
   optimized:{cardRender:series(false,'elapsedMs'),bulkWrite:series(false,'bulkWriteMs'),reloadToReady:series(false,'reloadToClosetReadyMs')},
   note:'p95 is the nearest-rank maximum for three repeats; interpret as observed tail, not a stable population estimate'};
 });
 const result={priority:136,parent:PARENT,environment:{node:process.version,platform:process.platform,arch:process.arch,engines:selectedEngines,viewports:[320,390,430],repeats,sizes},
  syntheticJPEG:{generated:true,originalBytes:imageBytes.length,cutoutBytes:cutoutBytes.length,sharedOriginalPerTwoGarments:true},cases,summary,backupSerialization,screenshots,errors,
  claims:{physicalAndroid:false,physicalIPhone:false,liveCloud:false,customerData:false,quotaFailureRealDevice:false}};
 await writeFile(resolve(out,'results.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({output:resolve(out,'results.json'),cases:cases.length,screenshots:screenshots.length,errors:errors.length}));
}finally{server.close();}
