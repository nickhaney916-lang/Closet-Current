// Mission 3: actual Chromium/WebKit proof that ordinary owner cloud checks
// fetch revision-only metadata, never a 1,000-item private wardrobe document,
// and still restore changed revisions and publish owner-local dirty edits.
// All accounts, garment photos, HTTP and cloud RPCs are synthetic.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';

const root=resolve('dist');
const destination=resolve(process.argv[2]||'benchmark/mission3-revision-first-cloud-browser');
await mkdir(destination,{recursive:true});
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.json':'application/json','.css':'text/css','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const path=decodeURIComponent(url.pathname);
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+'/')||path.includes('\\'))throw Error('Invalid file path');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const photo=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320">'+
 '<rect width="240" height="320" fill="#dfe4e8"/>'+
 '<path d="M75 35L105 20H135L165 35L209 85L173 109L161 89L161 280H79V89L67 109L31 85Z" fill="#476f8a"/>'+
 '</svg>')).jpeg({quality:78}).toBuffer();
const img='data:image/jpeg;base64,'+photo.toString('base64');
const sha=createHash('sha256').update(photo).digest('hex');
const axeSource=await readFile('node_modules/axe-core/axe.min.js','utf8');
const results=[],errors=[];

async function run(engine,engineFactory,width){
 const owner=(engine==='chromium'?'a':'b')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 let revision=4,doc={schemaVersion:1,
  items:Array.from({length:1000},(_,i)=>({
   id:'remote-private-'+i,category:'Tops',description:'owner-cloud-photo-metadata-'.repeat(28)
  })),state:{}};
 const requests=[];let rpcs=0;
 const browser=await engineFactory.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 const routeJson=(route,data,status=200)=>route.fulfill({
  status,contentType:'application/json',body:JSON.stringify(data)});
 try{
  await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${owner}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`}));
  await context.route(cloud+'/**',async route=>{
   const req=route.request(),url=new URL(req.url()),method=req.method();
   const id=req.headers().authorization?.slice(7);
   if(id!==owner)return routeJson(route,{error:'cross-owner token rejected'},403);
   if(url.pathname==='/rest/v1/closet_backups'){
    assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);
    const select=url.searchParams.get('select');
    assert.ok(select==='revision'||select==='revision,document');
    const body=select==='revision'?[{revision}]:[{revision,document:doc}];
    requests.push({select,bytes:JSON.stringify(body).length});
    return routeJson(route,body);
   }
   if(url.pathname==='/rest/v1/rpc/save_closet_backup'){
    const payload=req.postDataJSON();
    assert.equal(payload.p_expected_revision,revision);
    assert.equal(payload.p_document.schemaVersion,1);
    assert.ok(payload.p_document.items.some(x=>x.id==='local-new-piece'));
    rpcs++;revision++;doc=payload.p_document;
    return routeJson(route,revision);
   }
   return routeJson(route,{error:'mock remote path not permitted'},404);
  });
  const seed=await context.newPage();
  await seed.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await seed.evaluate(async({owner,img,sha})=>{
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
   for(let i=0;i<1000;i++)tx.objectStore('items').put({
    id:'owner-local-'+String(i).padStart(4,'0'),category:'Tops',color:'Blue',
    image:img,originalPhoto:{image:img,sha256:sha},
    sourceSHA256:sha,sourceHashVerified:true
   });
   tx.objectStore('state').put({id:'cloud-sync',
    baseVersion:4,baseDocument:{schemaVersion:1,items:[],state:{}},
    localRevision:11,dirty:false,needsRestore:false});
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
  },{owner,img,sha});
  await seed.close();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine,width,message:e.message}));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  // Routine focus/sync probes should not retrieve cloud JSON or clone it
  // merely because 1,000 original-photo pieces are already saved locally.
  await page.evaluate(()=>closetCloud.sync());
  assert.ok(requests.length>=2);
  assert.equal(requests.filter(x=>x.select==='revision,document').length,0,
   'unchanged remote 1,000-garment JSON must never transfer');
  assert.ok(requests.every(x=>x.bytes<200),
   'metadata-only requests must stay tiny, independent of wardrobe size');
  const initialChecks=requests.length;
  revision=5;doc={schemaVersion:1,items:[{
   id:'latest-remote-piece',category:'Tops',color:'Navy'
  }],state:{}};
  await page.evaluate(()=>closetCloud.sync());
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  const changed=requests.slice(initialChecks);
  assert.deepEqual(changed.map(x=>x.select),['revision','revision,document'],
   'a changed cloud revision needs an owner-scoped complete document');
  const state=()=>page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readonly');
   const a=tx.objectStore('items').getAll();
   const b=tx.objectStore('state').get('cloud-sync');
   const [items,marker]=await Promise.all([
    new Promise(resolve=>a.onsuccess=()=>resolve(a.result)),
    new Promise(resolve=>b.onsuccess=()=>resolve(b.result))
   ]);
   db.close();return {items:items.map(x=>x.id),marker};
  });
  const restored=await state();
  assert.deepEqual(restored.items,['latest-remote-piece']);
  assert.equal(restored.marker.baseVersion,5);
  const beforeDirty=requests.length;
  await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   // The app's beforeWrite lease intentionally rejects a second IndexedDB
   // connection. Simulate a committed owner edit using the same atomic local
   // state marker mutation that the real app's write controller performs.
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put({id:'local-new-piece',category:'Tops',color:'Teal'});
   const state=tx.objectStore('state'),request=state.get('cloud-sync');
   request.onsuccess=()=>{
    const marker=request.result;
    state.put({...marker,dirty:true,localRevision:marker.localRevision+1});
   };
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
   await closetCloud.sync();
  });
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  assert.equal(rpcs,1);
  assert.deepEqual(requests.slice(beforeDirty).map(x=>x.select),['revision'],
   'dirty owner backup with matching revision does not require full remote JSON');
  assert.equal(revision,6);
  const saved=await state();
  assert.deepEqual(saved.items.sort(),['latest-remote-piece','local-new-piece']);
  assert.equal(saved.marker.baseVersion,6);
  assert.equal(saved.marker.dirty,false);
  await page.locator('.account-menu > summary').click();
  const screenshot=`${engine}-${width}-remote-revision-only.png`;
  const png=await page.screenshot({path:resolve(destination,screenshot),fullPage:false});
  assert.equal((await sharp(png).metadata()).width,width);
  await page.addScriptTag({content:axeSource});
  const access=await page.evaluate(()=>axe.run(document,{
   runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  }));
  assert.deepEqual(access.violations.map(v=>v.id),[]);
  return {engine,width,metadataOnlyClean:true,metadataOnlyDirty:true,
   changedRemoteFullDocument:true,localRestoreAndCloudWrite:true,
   ownerPrivateRevision:revision,fullDocumentFetches:requests.filter(x=>x.select==='revision,document').length,
   normalCheckBytes:requests[0].bytes,remoteDocBytes:JSON.stringify(doc).length,
   screenshot,sha256:createHash('sha256').update(png).digest('hex'),
   axeViolations:access.violations.length,syntheticOwner:true,
   physicalDevice:false,hostedSignedSupabase:false};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,factory]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])results.push(await run(name,factory,width));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(destination,'results.json'),JSON.stringify({
  mission:3,scenario:'revision-first owner private cloud metadata and full remote fallback',
  cases:results,errors,limitations:{syntheticCloud:true,hostedSignedOwner:false,
   physicalDevice:false,fullRealWardrobeHeap:false,familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,errors:errors.length,output:destination}));
}finally{await new Promise(resolve=>server.close(resolve));}
