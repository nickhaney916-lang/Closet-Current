// Actual Chromium/WebKit owner-private syntactically valid but malformed REST row quarantine across
// a fresh page load, retaining old outfit and JPEG until deliberate owner Sync.
// Only synthetic garment pixels/accounts and a fully mocked cloud endpoint.
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/mission3-malformed-cloud-reply-browser');
await mkdir(out,{recursive:true});
const original=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560">'+
 '<rect width="420" height="560" fill="#d8e0d8"/>'+
 '<path d="M130 70L165 42H255L290 70L358 170L300 205L280 154L280 490H140V154L120 205L62 170Z" fill="#2d5f79"/>'+
 '</svg>')).jpeg({quality:85}).toBuffer();
const sha=createHash('sha256').update(original).digest('hex');
// Three semantically malformed successful HTTP 200 replies: duplicate private
// backup rows, null row and a nonnumeric cloud revision.
const dataURL='data:image/jpeg;base64,'+original.toString('base64');
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.html':'text/html','.json':'application/json','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.glb':'model/gltf-binary','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!full.startsWith(root+'/')||path.includes('\\'))throw Error('Invalid path');
  const bytes=await readFile(full);
  res.writeHead(200,{'Content-Type':types[extname(full)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port,cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const axeSource=await readFile('node_modules/axe-core/axe.min.js','utf8');
const result=[],errors=[];
async function run(engine,browserType,width){
 const owner=(engine==='chromium'?'a':'b')+String(width).padStart(3,'0')+'0000-0000-4000-8000-000000000000';
 const ref='closet-photo:'+owner+'/'+sha+'.jpg';
 const remoteItem=(id)=>({id,ownerId:owner,category:'Tops',itemType:'T-shirt',
  name:id,color:'Blue',image:ref,sourceHashVerified:true,
  sourceSHA256:sha,originalPhoto:{image:ref,sha256:sha},userAdjusted:true});
 const remote={revision:2,document:{schemaVersion:1,
  items:[remoteItem('remote-one'),remoteItem('remote-two')],
  state:{'outfit-board':{id:'outfit-board',current:{slots:{top:'remote-one'}},
   saved:[{id:'remote-saved-look',name:'Restored outfit',slots:{top:'remote-one'}}]}}
 }};
 const browser=await browserType.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const requests=[];let repaired=false;
 try{
  await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${owner}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`}));
  await context.route(cloud+'/**',async route=>{
   const req=route.request(),parsed=new URL(req.url()),actor=req.headers().authorization?.slice(7);
   requests.push({path:parsed.pathname,method:req.method()});
   const json=(body,code=200)=>route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(body)});
   if(actor!==owner)return json({},403);
   if(parsed.pathname==='/rest/v1/closet_backups'){
    assert.equal(parsed.searchParams.get('owner_id'),'eq.'+owner);
    if(parsed.searchParams.get('select')==='revision'){
     if(repaired)return json([{revision:2}]);
     if(width===320)return json([{revision:2},{revision:3}]);
     if(width===390)return json([null]);
     return json([{revision:'2'}]);
    }
    if(!repaired)throw Error('Invalid private REST row must not fetch full document');
    return json([remote]);
   }
   const prefix='/storage/v1/object/closet-private/';
   if(parsed.pathname.startsWith(prefix)){
    assert.equal(parsed.pathname.slice(prefix.length),owner+'/'+sha+'.jpg');
    assert.equal(req.method(),'GET');
    return route.fulfill({status:200,contentType:'image/jpeg',body:original});
   }
   return json({},404);
  });
  const seed=await context.newPage();
  await seed.goto(url+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await seed.evaluate(async({owner,dataURL})=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+owner,2);
    r.onupgradeneeded=()=>{
     if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});
     if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});
    };
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put({id:'old-private-photo',category:'Tops',name:'Original owner shirt',
    itemType:'T-shirt',color:'Red',image:dataURL,userAdjusted:true});
   tx.objectStore('state').put({id:'outfit-board',current:{slots:{top:'old-private-photo'}},
    saved:[{id:'old-private-look',name:'Original saved outfit',slots:{top:'old-private-photo'}}]});
   tx.objectStore('state').put({id:'cloud-sync',baseVersion:1,dirty:false,localRevision:7,
    baseDocument:{schemaVersion:1,items:[],state:{}}});
   await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
   db.close();
  },{owner,dataURL});
  await seed.close();
  const page=await context.newPage();page.on('pageerror',err=>errors.push({engine,width,error:err.message}));
  await page.goto(url+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent.includes('Cloud photograph integrity check failed'),null,{timeout:30000});
  const read=()=>page.evaluate(async()=>{
   const owner=window.closetAuth.user.id;
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+owner,2);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readonly');
   const req=(store,method,key)=>new Promise((resolve,reject)=>{
    const q=method==='getAll'?tx.objectStore(store).getAll():tx.objectStore(store).get(key);
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const [items,board,marker]=await Promise.all([
    req('items','getAll'),req('state','get','outfit-board'),req('state','get','cloud-sync')]);
   db.close();
   return {items:items.map(x=>({id:x.id,image:x.image})),board,marker};
  });
  const failed=await read();
  assert.ok(requests.some(x=>x.path==='/rest/v1/closet_backups'),
   'must exercise invalid 200 owner-private revision response');
  assert.equal(requests.filter(x=>x.path.startsWith('/storage/')).length,0,
   'invalid owner revision must fail before any private JPEG download');
  assert.deepEqual(failed.items.map(x=>x.id),['old-private-photo']);
  assert.equal(failed.items[0].image,dataURL);
  assert.equal(failed.board.saved[0].id,'old-private-look');
  assert.equal(failed.marker.baseVersion,1);
  assert.equal(failed.marker.dirty,false);
  assert.equal(failed.marker.integrityPause,true);
  const count=requests.length;
  await page.evaluate(()=>window.closetCloud.sync());
  assert.equal(requests.length,count,'integrity quarantine prevents repeated corrupt JPEG downloads');
  // New JS realm after reload must read the owner-specific IndexedDB integrity marker
  // before touching any private cloud HTTP endpoints.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent.includes('Cloud photograph integrity check failed'),null,{timeout:30000});
  assert.equal(requests.length,count,'reloaded browser must NOT download corrupt cloud wardrobe');
  const reloaded=await read();
  assert.deepEqual(reloaded.items.map(x=>x.id),['old-private-photo']);
  assert.equal(reloaded.board.saved[0].id,'old-private-look');
  assert.equal(reloaded.marker.baseVersion,1);
  await page.locator('.account-menu > summary').click();
  await page.locator('#syncCloset').waitFor({state:'visible'});
  const screenshot=`${engine}-${width}-malformed-row-before.png`;
  const png=await page.screenshot({path:resolve(out,screenshot),fullPage:false});
  const meta=await sharp(png).metadata();assert.equal(meta.width,width);
  await page.addScriptTag({content:axeSource});
  const access=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
  assert.deepEqual(access.violations.map(x=>x.id),[]);
  repaired=true;
  await page.locator('#syncCloset').click();
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  const recovered=await read();
  assert.deepEqual(recovered.items.map(x=>x.id),['remote-one','remote-two']);
  assert.equal(recovered.board.saved[0].id,'remote-saved-look');
  assert.equal(recovered.marker.baseVersion,2);
  assert.equal(recovered.marker.dirty,false);
  assert.equal(recovered.marker.integrityPause,false,'manual SHA-verifiable success clears quarantine');
  for(const entry of recovered.items){
   assert.ok(entry.image.startsWith('data:image/jpeg;base64,'));
   const bytes=Buffer.from(entry.image.split(',')[1],'base64');
   assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
  }
  return {engine,width,rollbackPreservedOriginal:true,oldOutfitPreserved:true,
   manualRetryRestored:true,blockedReloadMadeZeroCloudRequests:true,originalSHA:sha,malformedRowQuarantined:true,noPrivatePhotoDownloadBeforeManualRepair:true,
   malformedType:width===320?'duplicateRows':width===390?'nullRow':'invalidRevisionType',
   screenshot,sha256:createHash('sha256').update(png).digest('hex'),
   axeViolations:access.violations.length,syntheticOwner:true,physicalDevice:false};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [engine,browserType]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])result.push(await run(engine,browserType,width));
 assert.deepEqual(errors,[]);
 const output={scenario:'actual browser valid JSON invalid owner cloud REST row refusal, durable quarantine and manual SHA-photo restore',
  cases:result,errors,claims:{syntheticAccount:true,hostedSupabase:false,
   physicalAndroid:false,physicalIPhone:false,familyAlphaHold:255,syntacticallyValidJSON:true}};
 await writeFile(resolve(out,'results.json'),JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({cases:result.length,errors:errors.length,malformedRESTRows:true,results:resolve(out,'results.json')}));
}finally{await new Promise(resolve=>server.close(resolve));}
