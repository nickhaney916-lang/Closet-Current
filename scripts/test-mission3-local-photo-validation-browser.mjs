// Actual Chromium/WebKit 320/390/430 owner-local unbackuppable photo
// handling: unsupported JPEG format must persist an owner-only backup pause
// across reload without altering the saved local photo or contacting cloud.
// A genuine new local revision with a valid JPEG resumes authenticated sync.
// Backend owner IDs and photographs are synthetic; no hosted account writes.
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/mission3-local-photo-validation');
await mkdir(output,{recursive:true});
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.json':'application/json','.html':'text/html','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!full.startsWith(root+'/')||p.includes('\\'))throw Error('invalid path');
  const bytes=await readFile(full);
  res.writeHead(200,{'Content-Type':types[extname(full)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,
 cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const jpg=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="440">'+
 '<rect width="320" height="440" fill="#e4e6e7"/>'+
 '<path d="M97 46L139 25H180L223 46L278 120L233 158L211 108L211 388H110V108L88 158L42 120Z" fill="#285c81"/>'+
 '</svg>')).jpeg({quality:82}).toBuffer();
const jpeg='data:image/jpeg;base64,'+jpg.toString('base64'),
 sha=createHash('sha256').update(jpg).digest('hex'),
 invalid='data:image/png;base64,iVBORw0KGgo=';
const axeSource=await readFile('node_modules/axe-core/axe.min.js','utf8');
const results=[],errors=[];
async function scenario(engine,browserType,width){
 const owner=(engine==='chromium'?'c':'d')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 let revision=0,remote=null;const requests=[];
 const browser=await browserType.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${owner}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`}));
  await context.route(cloud+'/**',async route=>{
   const req=route.request(),url=new URL(req.url()),verb=req.method(),
    actor=req.headers().authorization?.slice(7);
   requests.push({path:url.pathname,verb});
   const json=(body,status=200)=>route.fulfill({
    status,contentType:'application/json',body:JSON.stringify(body)});
   if(actor!==owner)return json({error:'unauthorized synthetic owner'},403);
   if(url.pathname==='/rest/v1/closet_backups'){
    assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);
    const rows=revision?[{revision,...(url.searchParams.get('select')==='revision'
     ?{}:{document:remote})}]:[];
    return json(rows);
   }
   const prefix='/storage/v1/object/closet-private/';
   if(url.pathname.startsWith(prefix)){
    assert.equal(verb,'POST');
    assert.equal(url.pathname.slice(prefix.length),owner+'/'+sha+'.jpg');
    const bytes=req.postDataBuffer();
    assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
    return json({});
   }
   if(url.pathname==='/rest/v1/rpc/save_closet_backup'){
    const body=req.postDataJSON();assert.equal(body.p_expected_revision,revision);
    remote=body.p_document;revision++;
    return json(revision);
   }
   return json({error:'synthetic unknown endpoint'},404);
  });
  const seed=await context.newPage();
  await seed.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await seed.evaluate(async({owner,invalid})=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+owner,2);
    r.onupgradeneeded=()=>{
     if(!r.result.objectStoreNames.contains('items'))
      r.result.createObjectStore('items',{keyPath:'id'});
     if(!r.result.objectStoreNames.contains('state'))
      r.result.createObjectStore('state',{keyPath:'id'});
    };
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put({id:'saved-local-original',ownerId:owner,
    category:'Tops',itemType:'T-shirt',color:'Blue',
    image:invalid,userAdjusted:true});
   tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,dirty:true,
    baseDocument:null,localRevision:1});
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
  },{owner,invalid});
  await seed.close();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine,width,error:e.message}));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent.includes('not a supported JPEG'));
  const read=()=>page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readonly'),
    r=tx.objectStore('items').getAll(),
    s=tx.objectStore('state').get('cloud-sync');
   const [items,marker]=await Promise.all([
    new Promise(resolve=>r.onsuccess=()=>resolve(r.result)),
    new Promise(resolve=>s.onsuccess=()=>resolve(s.result))
   ]);
   db.close();return {items,marker};
  });
  const before=await read();
  assert.equal(before.marker.localPhotoPause.reason,'LOCAL_PHOTO_FORMAT');
  assert.equal(before.marker.localPhotoPause.revision,1);
  assert.equal(before.items.length,1);
  assert.equal(before.items[0].image,invalid);
  assert.equal(revision,0);
  const priorRequests=requests.length;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent.includes('not a supported JPEG'));
  assert.equal(requests.length,priorRequests,
   'persisted local-photo rejection must stop new remote requests on reload');
  assert.equal((await read()).items[0].image,invalid);
  await page.locator('.account-menu > summary').click();
  const screenshot=`${engine}-${width}-unsupported-source-HOLD.png`;
  const png=await page.screenshot({path:resolve(output,screenshot),fullPage:false});
  assert.equal((await sharp(png).metadata()).width,width);
  await page.addScriptTag({content:axeSource});
  const access=await page.evaluate(()=>axe.run(document,{
   runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  }));
  assert.deepEqual(access.violations.map(x=>x.id),[]);
  // A genuine revised source (not a silent re-encode of the old original)
  // gets a new localRevision and can resume cloud backup normally.
  await page.evaluate(async({jpeg})=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readwrite');
   const photo=tx.objectStore('items').get('saved-local-original');
   photo.onsuccess=()=>{
    tx.objectStore('items').put({...photo.result,image:jpeg});
    const st=tx.objectStore('state'),m=st.get('cloud-sync');
    m.onsuccess=()=>st.put({...m.result,dirty:true,
     localRevision:m.result.localRevision+1});
   };
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
   await closetCloud.sync();
  },{jpeg});
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent==='Cloud backup up to date');
  assert.equal(revision,1);assert.equal(remote.items.length,1);
  assert.ok(remote.items[0].image.startsWith('closet-photo:'+owner+'/'));
  assert.equal(JSON.stringify(remote).includes('data:image'),false);
  const done=await read();
  assert.equal(done.items[0].image,jpeg);
  assert.equal(done.marker.localPhotoPause,null);
  assert.equal(done.marker.dirty,false);
  return {engine,width,syntheticOwner:true,localInvalidSourceUnchanged:true,
   restartDidNotRetry:true,correctedPhotoUploaded:true,cloudRevision:revision,
   originalSHA:sha,screenshot,
   sha256:createHash('sha256').update(png).digest('hex'),
   accessibilityViolations:access.violations.length,
   hostedSignedJWT_RLS:false,physicalDevice:false};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,browser]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])results.push(await scenario(name,browser,width));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'results.json'),JSON.stringify({
  mission:3,case:'owner-local unsupported JPEG durable manual edit recovery',
  results,errors,claims:{syntheticOnly:true,
   hostedSupabase:false,physicalDevices:false,familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,errors:errors.length,
  output:resolve(output,'results.json')}));
}finally{await new Promise(done=>server.close(done));}
