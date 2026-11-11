// Genuine Chromium/WebKit proof: the current owner's authenticated cloud
// row must NOT import or publish an image pointing into another private
// Storage namespace, even when item.ownerId matches the current owner.
// All HTTP, owner IDs, garments and photographs below are synthetic.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/mission3-owner-photo-ref-browser');
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
const server=createServer(async(request,response)=>{
 try{
  const p=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const path=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!path.startsWith(root+'/')||p.includes('\\'))throw Error('Bad local path');
  const bytes=await readFile(path);
  response.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'});response.end(bytes);
 }catch{response.writeHead(404);response.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const photo=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480">'+
 '<rect width="360" height="480" fill="#c4d4df"/>'+
 '<path d="M113 48L150 24H210L247 48L315 133L267 170L239 123L239 424H121V123L93 170L45 133Z" fill="#295477"/>'+
 '</svg>')).jpeg({quality:85}).toBuffer();
const sha=createHash('sha256').update(photo).digest('hex'),
 dataURL='data:image/jpeg;base64,'+photo.toString('base64');
const axeSource=await readFile('node_modules/axe-core/axe.min.js','utf8');
const results=[],errors=[];

async function caseRun(engine,browserType,width){
 const ownerA=(engine==='chromium'?'a':'b')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 const ownerB=(engine==='chromium'?'b':'a')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 const foreign='closet-photo:'+ownerB+'/'+sha+'.jpg';
 const correct='closet-photo:'+ownerA+'/'+sha+'.jpg';
 let revision=5,remote={
  schemaVersion:1,items:[{id:'forged-photo-link',ownerId:ownerA,
   category:'Tops',originalPhoto:{image:foreign,sha256:sha}}],state:{}};
 let published=0;const requests=[];
 const browser=await browserType.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  await context.route('**/auth.js*',route=>route.fulfill({
   contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${ownerA}'},ready:Promise.resolve(),getAccessToken:async()=> '${ownerA}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`
  }));
  await context.route(cloud+'/**',async route=>{
   const req=route.request(),u=new URL(req.url()),verb=req.method(),
    bearer=req.headers().authorization?.slice(7);
   requests.push({path:u.pathname,verb,select:u.searchParams.get('select')});
   const json=(v,status=200)=>route.fulfill({
    contentType:'application/json',status,body:JSON.stringify(v)});
   if(bearer!==ownerA)return json({error:'synthetic wrong owner'},403);
   if(u.pathname==='/rest/v1/closet_backups'){
    assert.equal(u.searchParams.get('owner_id'),'eq.'+ownerA);
    return json(u.searchParams.get('select')==='revision'
     ?[{revision}]:[{revision,document:remote}]);
   }
   if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
    const payload=req.postDataJSON();assert.equal(payload.p_expected_revision,revision);
    const text=JSON.stringify(payload.p_document);
    assert.ok(!text.includes(foreign),'foreign private Storage photo must never be published');
    published++;revision++;remote=payload.p_document;
    return json(revision);
   }
   if(u.pathname.startsWith('/storage/v1/object/closet-private/')){
    assert.equal(u.pathname.slice('/storage/v1/object/closet-private/'.length),
     ownerA+'/'+sha+'.jpg','never access owner B private Storage objects');
    if(verb==='POST'){
     const bytes=req.postDataBuffer();
     assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
     return json({path:ownerA+'/'+sha+'.jpg'});
    }
    assert.equal(verb,'GET');
    return route.fulfill({status:200,contentType:'image/jpeg',body:photo});
   }
   return json({},404);
  });
  const seed=await context.newPage();
  await seed.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await seed.evaluate(async({ownerA,dataURL,sha})=>{
   const db=await new Promise((resolve,reject)=>{
    const q=indexedDB.open('closet-current-user-'+ownerA,2);
    q.onupgradeneeded=()=>{
     if(!q.result.objectStoreNames.contains('items'))
      q.result.createObjectStore('items',{keyPath:'id'});
     if(!q.result.objectStoreNames.contains('state'))
      q.result.createObjectStore('state',{keyPath:'id'});
    };
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put({id:'original-local-A',ownerId:ownerA,
    category:'Tops',color:'Blue',image:dataURL,
    originalPhoto:{image:dataURL,sha256:sha},
    sourceSHA256:sha,sourceHashVerified:true});
   tx.objectStore('state').put({id:'cloud-sync',baseVersion:4,dirty:true,
    localRevision:12,baseDocument:{schemaVersion:1,items:[],state:{}}});
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
  },{ownerA,dataURL,sha});
  await seed.close();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine,width,error:e.message}));
  const read=()=>page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const q=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const tx=db.transaction(['items','state'],'readonly'),
    a=tx.objectStore('items').getAll(),
    b=tx.objectStore('state').get('cloud-sync');
   const [items,marker]=await Promise.all([
    new Promise(resolve=>a.onsuccess=()=>resolve(a.result)),
    new Promise(resolve=>b.onsuccess=()=>resolve(b.result))
   ]);
   db.close();return {items,marker};
  });
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent.includes('backup pending'));
  assert.equal(published,0,'foreign reference must be rejected before save RPC');
  const before=await read();
  assert.deepEqual(before.items.map(x=>x.id),['original-local-A']);
  assert.equal(before.items[0].image,dataURL);
  assert.equal(before.marker.baseVersion,4);
  assert.equal(before.marker.dirty,true);
  assert.ok(requests.some(x=>x.select==='revision,document'));
  assert.equal(requests.filter(x=>x.path.startsWith('/storage/')).length,0);
  await page.locator('.account-menu > summary').click();
  const screenshot=`${engine}-${width}-cross-owner-ref-rejected.png`;
  const png=await page.screenshot({path:resolve(output,screenshot),fullPage:false});
  assert.equal((await sharp(png).metadata()).width,width);
  await page.addScriptTag({content:axeSource});
  const access=await page.evaluate(()=>axe.run(document,{
   runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  }));
  assert.deepEqual(access.violations.map(x=>x.id),[]);
  // The same owner A can now merge the correctly scoped remote photo,
  // using a real SHA-checking private Storage download and a genuine RPC.
  remote={schemaVersion:1,items:[{id:'valid-owner-A-photo',ownerId:ownerA,
   category:'Tops',originalPhoto:{image:correct,sha256:sha}}],state:{}};
  await page.evaluate(()=>closetCloud.sync());
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent==='Cloud backup up to date');
  assert.equal(published,1);
  const done=await read();
  assert.deepEqual(done.items.map(x=>x.id).sort(),
   ['original-local-A','valid-owner-A-photo']);
  assert.equal(done.marker.baseVersion,6);
  assert.equal(done.marker.dirty,false);
  const original=done.items.find(x=>x.id==='original-local-A');
  const restored=done.items.find(x=>x.id==='valid-owner-A-photo');
  assert.equal(original.image,dataURL);
  assert.equal(restored.originalPhoto.sha256,sha);
  assert.equal(restored.originalPhoto.image,dataURL);
  // Incoming newly published document must not overwrite a valid wardrobe
  // with a foreign nested reviewed cutout in the same owner's JSON row.
  revision=7;remote={schemaVersion:1,items:[{
   id:'foreign-cutout-newer',ownerId:ownerA,category:'Tops',
   segmentHint:{cutoutImage:foreign,cutoutSHA256:sha,verified:false}
  }],state:{}};
  await page.evaluate(()=>closetCloud.sync());
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent.includes('Local items are kept'));
  const refused=await read();
  assert.deepEqual(refused.items.map(x=>x.id).sort(),
   ['original-local-A','valid-owner-A-photo']);
  assert.equal(refused.marker.baseVersion,6);
  return {engine,width,syntheticOwner:true,foreignPhotoNeverPublished:true,
   crossOwnerObjectNeverFetched:true,originalJPEGPreserved:true,
   validOriginalSHARecovered:true,foreignCutoutRejected:true,
   screenshot,sha256:createHash('sha256').update(png).digest('hex'),
   accessibilityViolations:access.violations.length,
   hostedJWT_RLS:false,physicalDevice:false};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,type]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])results.push(await caseRun(name,type,width));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'results.json'),JSON.stringify({
  mission:3,case:'Current owner cloud REST row with another account Storage object path',
  results,errors,limitations:{syntheticBackend:true,hostedRealJWT_RLS:false,
   physicalAndroid:false,physicalIPhone:false,familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,errors:errors.length,
  output:resolve(output,'results.json')}));
}finally{await new Promise(done=>server.close(done));}
