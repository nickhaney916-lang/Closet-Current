// Genuine Chromium/WebKit browser verification of durable, owner-local
// 413/507 cloud capacity pause across a full page reload. All accounts,
// photographs and cloud endpoints are synthetic; no real Supabase requests.
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/mission3-durable-capacity-mobile');
await mkdir(output,{recursive:true});
const jpg=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="440">'+
 '<rect width="320" height="440" fill="#c1d9dd"/>'+
 '<path d="M100 40L140 20H180L220 40L275 115L232 147L206 103L206 385L114 385L114 103L88 147L45 115Z" fill="#21527a"/>'+
 '</svg>')).jpeg({quality:85}).toBuffer();
const dataURL='data:image/jpeg;base64,'+jpg.toString('base64');
const photoSHA=createHash('sha256').update(jpg).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!full.startsWith(root+'/')||p.includes('\\'))throw Error('invalid path');
  const data=await readFile(full);
  res.writeHead(200,{'Content-Type':types[extname(full)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const engines=[['chromium',chromium],['webkit',webkit]];
const runs=[],errors=[];
const axeSource=await readFile(resolve('node_modules/axe-core/axe.min.js'),'utf8');

async function testCase(engine,browserType,width,status){
 const owner=(engine==='chromium'?'c':'d')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 const requests=[],objects=new Map();
 let refusal=status,revision=0,remote=null;
 const browser=await browserType.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 try{
  await context.route('**/auth.js*',route=>route.fulfill({
   contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${owner}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`
  }));
  await context.route(cloud+'/**',async route=>{
   const request=route.request(),url=new URL(request.url());
   requests.push({path:url.pathname,verb:request.method()});
   const actor=request.headers().authorization?.slice(7);
   const json=(body,code=200)=>route.fulfill({status:code,
    contentType:'application/json',body:JSON.stringify(body)});
   if(actor!==owner)return json({message:'owner mismatch'},403);
   if(url.pathname==='/rest/v1/closet_backups'){
    assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);
    return json(revision?[{revision,document:remote}]:[]);
   }
   if(url.pathname==='/rest/v1/rpc/save_closet_backup'){
    const body=request.postDataJSON();
    assert.equal(body.p_expected_revision,revision);
    remote=body.p_document;revision++;return json(revision);
   }
   const pre='/storage/v1/object/closet-private/';
   if(url.pathname.startsWith(pre)){
    const key=url.pathname.slice(pre.length);
    assert.ok(key.startsWith(owner+'/'));
    if(request.method()==='POST'){
     if(refusal)return json({message:'synthetic capacity failure'},refusal);
     if(objects.has(key))return json({},409);
     objects.set(key,request.postDataBuffer());return json({});
    }
    if(!objects.has(key))return json({},404);
    return route.fulfill({contentType:'image/jpeg',body:objects.get(key)});
   }
   return json({},404);
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push({engine,width,message:e.message}));
  await page.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(async({owner,dataURL,photoSHA})=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+owner,2);
    r.onupgradeneeded=()=>{
     if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});
     if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});
    };
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put({
    id:'private-blue-shirt',ownerId:owner,category:'Tops',itemType:'T-shirt',
    name:'Synthetic blue shirt',color:'Blue',image:dataURL,
    sourceSHA256:photoSHA,sourceHashVerified:true,
    originalPhoto:{image:dataURL,sha256:photoSHA},userAdjusted:true
   });
   tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,
    dirty:true,localRevision:1,baseDocument:null});
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
  },{owner,dataURL,photoSHA});
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  const statusPhrase=status===413?'too large':'capacity is full';
  await page.waitForFunction(phrase=>document.getElementById('cloudStatus')?.textContent.includes(phrase),statusPhrase);
  const read=()=>page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+window.closetAuth.user.id,2);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readonly');
   const get=k=>new Promise((resolve,reject)=>{
    const r=tx.objectStore('state').get(k);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const all=()=>new Promise((resolve,reject)=>{
    const r=tx.objectStore('items').getAll();
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const [marker,items]=await Promise.all([get('cloud-sync'),all()]);
   db.close();return {marker,items:items.map(x=>({id:x.id,image:x.image,sourceSHA256:x.sourceSHA256}))};
  });
  const first=await read();
  assert.equal(first.marker.capacityPause,status);
  assert.equal(first.items.length,1);assert.equal(first.items[0].image,dataURL);
  const before=requests.length,postBefore=requests.filter(x=>x.verb==='POST').length;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(phrase=>document.getElementById('cloudStatus')?.textContent.includes(phrase),statusPhrase);
  assert.equal(requests.length,before,'reload must not issue cloud reads or JPEG uploads');
  assert.equal(requests.filter(x=>x.verb==='POST').length,postBefore);
  const restored=await read();assert.equal(restored.marker.capacityPause,status);
  assert.equal(restored.items[0].sourceSHA256,photoSHA);
  await page.locator('.account-menu > summary').click();
  await page.locator('#syncCloset').waitFor({state:'visible'});
  const capture=`${engine}-${width}-capacity-${status}.png`;
  const screenshot=await page.screenshot({path:resolve(output,capture),fullPage:false});
  const meta=await sharp(screenshot).metadata();assert.equal(meta.width,width);
  await page.addScriptTag({content:axeSource});
  const access=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
  assert.deepEqual(access.violations.map(v=>v.id),[],'accessible persistent capacity status');
  refusal=null;
  await page.locator('#syncCloset').click();
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  assert.equal(revision,1);assert.equal(objects.size,1);
  assert.equal(remote.items.length,1);
  assert.equal(remote.items[0].sourceSHA256,photoSHA);
  assert.equal(remote.items[0].originalPhoto.sha256,photoSHA);
  const done=await read();
  assert.equal(done.marker.capacityPause,null);
  assert.equal(done.marker.dirty,false);
  assert.equal(done.items[0].image,dataURL);
  const posts=requests.filter(x=>x.verb==='POST').length;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  assert.equal(requests.filter(x=>x.verb==='POST').length,posts,'recovered clean reload must not resend original bytes');
  return {engine,width,status,ownerSynthetic:true,requestsBlockedAcrossReload:true,
   ownerJPEGSHAVerified:true,photoPreserved:true,manualSyncRestored:true,
   remoteRevision:revision,accessibilityViolations:access.violations.length,
   screenshot:capture,sha256:createHash('sha256').update(screenshot).digest('hex'),
   physicalDevice:false,hostedSupabase:false};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [engine,browserType]of engines)for(const width of [320,390,430]){
  const status=width===430?507:413;
  runs.push(await testCase(engine,browserType,width,status));
 }
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'results.json'),JSON.stringify({
  mission:3,scenario:'durable owner-private cloud 413/507 across full browser reload',
  cases:runs,errors,claims:{syntheticBackend:true,physicalAndroid:false,physicalIPhone:false,
   hostedSignedOwnerAcceptance:false,releaseReady:false,familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:runs.length,errors:errors.length,results:resolve(output,'results.json')}));
}finally{await new Promise(r=>server.close(r));}
