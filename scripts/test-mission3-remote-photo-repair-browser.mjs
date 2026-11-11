// Real Chromium/WebKit 320/390/430 owner-private cloud restore with a
// missing or SHA-corrupted remote original. The built app must retain the
// current wardrobe, not automatically retry a broken cloud revision on full
// reload, then safely restore after owner-initiated Sync and source repair.
// All accounts, photographs and cloud HTTP are synthetic.
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/mission3-remote-photo-recovery');
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),p=decodeURIComponent(url.pathname);
  const path=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!path.startsWith(root+'/')||p.includes('\\'))throw Error('Invalid local path');
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,
 cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const original=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480">'+
 '<rect width="360" height="480" fill="#d5dfe5"/>'+
 '<path d="M115 45L153 20H207L245 45L318 137L270 178L239 124L239 425H121V124L90 178L42 137Z" fill="#245b8b"/>'+
 '</svg>')).jpeg({quality:83}).toBuffer();
const corrupted=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480">'+
 '<rect width="360" height="480" fill="#d5dfe5"/>'+
 '<rect x="60" y="55" width="230" height="350" fill="#8b244d"/>'+
 '</svg>')).jpeg({quality:83}).toBuffer();
const image='data:image/jpeg;base64,'+original.toString('base64');
const sha=createHash('sha256').update(original).digest('hex');
const axeSource=await readFile('node_modules/axe-core/axe.min.js','utf8');
const reports=[],errors=[];

async function scenario(engine,browserType,width){
 const owner=(engine==='chromium'?'c':'d')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 const modeInitial=width===430?'corrupt':'missing';
 let mode=modeInitial;
 const remote={revision:2,document:{schemaVersion:1,
  items:[{id:'owner-cloud-shirt',ownerId:owner,category:'Tops',color:'Blue',
   originalPhoto:{image:'closet-photo:'+owner+'/'+sha+'.jpg',sha256:sha}}],
  state:{'outfit-board':{id:'outfit-board',current:{slots:{top:'owner-cloud-shirt'}},
   saved:[{id:'owner-cloud-outfit',slots:{top:'owner-cloud-shirt'}}]}}}};
 const requests=[];
 const browser=await browserType.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 try{
  await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${owner}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`}));
  await context.route(cloud+'/**',async route=>{
   const req=route.request(),u=new URL(req.url()),method=req.method(),
    bearer=req.headers().authorization?.slice(7);
   requests.push({path:u.pathname,verb:method,select:u.searchParams.get('select')});
   const json=(body,status=200)=>route.fulfill({status,
    contentType:'application/json',body:JSON.stringify(body)});
   if(bearer!==owner)return json({error:'synthetic bearer rejected'},403);
   if(u.pathname==='/rest/v1/closet_backups'){
    assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
    return json(u.searchParams.get('select')==='revision'?
     [{revision:2}]:[remote]);
   }
   if(u.pathname.startsWith('/storage/v1/object/closet-private/')){
    assert.equal(method,'GET');
    assert.equal(u.pathname.slice('/storage/v1/object/closet-private/'.length),
     owner+'/'+sha+'.jpg');
    if(mode==='missing')return json({error:'synthetic object missing'},404);
    return route.fulfill({status:200,contentType:'image/jpeg',
     body:mode==='corrupt'?corrupted:original});
   }
   return json({error:'unexpected owner-private cloud call'},404);
  });
  const seed=await context.newPage();
  await seed.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await seed.evaluate(async({owner,image,sha})=>{
   const db=await new Promise((resolve,reject)=>{
    const q=indexedDB.open('closet-current-user-'+owner,2);
    q.onupgradeneeded=()=>{
     if(!q.result.objectStoreNames.contains('items'))
      q.result.createObjectStore('items',{keyPath:'id'});
     if(!q.result.objectStoreNames.contains('state'))
      q.result.createObjectStore('state',{keyPath:'id'});
    };
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put({id:'owner-private-original',ownerId:owner,
    category:'Tops',color:'Red',image,originalPhoto:{image,sha256:sha},
    sourceSHA256:sha,sourceHashVerified:true,userAdjusted:true});
   tx.objectStore('state').put({id:'outfit-board',
    current:{slots:{top:'owner-private-original'}},
    saved:[{id:'original-outfit',slots:{top:'owner-private-original'}}]});
   tx.objectStore('state').put({id:'cloud-sync',baseVersion:1,dirty:false,
    localRevision:7,baseDocument:{schemaVersion:1,items:[],state:{}}});
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
  },{owner,image,sha});
  await seed.close();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine,width,error:e.message}));
  const read=()=>page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const q=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const tx=db.transaction(['items','state'],'readonly'),
    i=tx.objectStore('items').getAll(),
    m=tx.objectStore('state').get('cloud-sync'),
    o=tx.objectStore('state').get('outfit-board');
   const [items,marker,board]=await Promise.all([
    new Promise(resolve=>i.onsuccess=()=>resolve(i.result)),
    new Promise(resolve=>m.onsuccess=()=>resolve(m.result)),
    new Promise(resolve=>o.onsuccess=()=>resolve(o.result))
   ]);db.close();return {items,marker,board};
  });
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  const phrase=modeInitial==='missing'?'A photograph is missing':'failed integrity verification';
  await page.waitForFunction(s=>document.getElementById('cloudStatus')?.textContent.includes(s),phrase);
  const failed=await read();
  assert.equal(failed.marker.remotePhotoPause.reason,
   modeInitial==='missing'?'REMOTE_PHOTO_MISSING':'REMOTE_PHOTO_INTEGRITY');
  assert.equal(failed.marker.remotePhotoPause.revision,2);
  assert.equal(failed.marker.baseVersion,1);
  assert.deepEqual(failed.items.map(x=>x.id),['owner-private-original']);
  assert.equal(failed.items[0].image,image);
  assert.equal(failed.board.saved[0].id,'original-outfit');
  const before=requests.length;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(s=>document.getElementById('cloudStatus')?.textContent.includes(s),phrase);
  assert.equal(requests.length,before,'broken remote backup must not redownload after reload');
  assert.equal((await read()).items[0].image,image);
  await page.locator('.account-menu > summary').click();
  const screenshot=`${engine}-${width}-remote-${modeInitial}-HOLD.png`;
  const png=await page.screenshot({path:resolve(output,screenshot),fullPage:false});
  assert.equal((await sharp(png).metadata()).width,width);
  await page.addScriptTag({content:axeSource});
  const axe=await page.evaluate(()=>axe.run(document,{
   runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  }));
  assert.deepEqual(axe.violations.map(v=>v.id),[]);
  mode='valid';await page.locator('#syncCloset').click();
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent==='Cloud backup up to date');
  const saved=await read();
  assert.equal(saved.marker.remotePhotoPause,null);
  assert.equal(saved.marker.baseVersion,2);
  assert.deepEqual(saved.items.map(x=>x.id),['owner-cloud-shirt']);
  assert.equal(saved.items[0].originalPhoto.image,image);
  assert.equal(saved.items[0].originalPhoto.sha256,sha);
  assert.equal(saved.board.saved[0].id,'owner-cloud-outfit');
  return {engine,width,modeInitial,originalOwnerPhotoPreserved:true,
   noCloudRequestsAfterBlockedReload:true,manualRepairRestored:true,
   originalSHA256Verified:sha,syntheticOwner:true,screenshot,
   screenshotSHA256:createHash('sha256').update(png).digest('hex'),
   axeViolations:axe.violations.length,hostedRealJWT_RLS:false,
   physicalDevice:false};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,type]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])reports.push(await scenario(name,type,width));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'results.json'),JSON.stringify({
  mission:3,scenario:'missing or SHA-tampered cloud original photo',
  results:reports,errors,limitations:{syntheticCloud:true,
   hostedSignedAccount:false,physicalAndroid:false,physicalIPhone:false,
   familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:reports.length,errors:errors.length,output}));
}finally{await new Promise(done=>server.close(done));}
