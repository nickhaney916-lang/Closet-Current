// Mission 3: actual Chromium and WebKit browser validation that a cloud
// document served from the current synthetic owner's REST row cannot import
// a garment or private camera draft explicitly tagged for another account.
// Cloud and Auth are synthetic; production/staging are never contacted.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';

const root=resolve('dist');
const output=resolve(process.argv[2]||'benchmark/mission3-signed-owner-document-browser');
await mkdir(output,{recursive:true});
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost'),p=decodeURIComponent(u.pathname);
  const file=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!file.startsWith(root+'/')||p.includes('\\'))throw Error('Invalid path');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const jpeg=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="420">'+
 '<rect width="320" height="420" fill="#d8dadc"/>'+
 '<path d="M100 44L142 27H178L220 44L280 116L233 152L208 112L208 376H112V112L87 152L40 116Z" fill="#346b85"/>'+
 '</svg>')).jpeg({quality:82}).toBuffer();
const dataURL='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
const axeSource=await readFile('node_modules/axe-core/axe.min.js','utf8');
const results=[],errors=[];
async function check(name,browserType,width){
 const ownerA=(name==='chromium'?'a':'b')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 const ownerB=(name==='chromium'?'b':'a')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 const ownerRow=(id,ownerId)=>({id,category:'Tops',itemType:'T-shirt',
  color:'Navy',...(ownerId?{ownerId}:{})});
 let revision=5,doc={schemaVersion:1,
  items:[ownerRow('foreign-B-piece',ownerB)],state:{}};
 const requests=[];
 const browser=await browserType.launch({headless:true,
  ...(name==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
  hasTouch:true,serviceWorkers:'block'});
 try{
  await context.route('**/auth.js*',route=>route.fulfill({
   contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${ownerA}'},ready:Promise.resolve(),getAccessToken:async()=> '${ownerA}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`
  }));
  await context.route(cloud+'/**',route=>{
   const req=route.request(),u=new URL(req.url()),actor=req.headers().authorization?.slice(7);
   requests.push({path:u.pathname,select:u.searchParams.get('select')});
   const reply=(value,status=200)=>route.fulfill({
    status,contentType:'application/json',body:JSON.stringify(value)});
   if(actor!==ownerA)return reply({message:'foreign credentials rejected'},403);
   if(u.pathname==='/rest/v1/closet_backups'){
    assert.equal(u.searchParams.get('owner_id'),'eq.'+ownerA);
    const select=u.searchParams.get('select');
    assert.ok(['revision','revision,document'].includes(select));
    return reply(select==='revision'?[{revision}]:[{revision,document:doc}]);
   }
   return reply({message:'synthetic backend refuses writes'},403);
  });
  const seed=await context.newPage();
  await seed.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await seed.evaluate(async({ownerA,dataURL,sha})=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+ownerA,2);
    r.onupgradeneeded=()=>{
     if(!r.result.objectStoreNames.contains('items'))
      r.result.createObjectStore('items',{keyPath:'id'});
     if(!r.result.objectStoreNames.contains('state'))
      r.result.createObjectStore('state',{keyPath:'id'});
    };
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readwrite');
   tx.objectStore('items').put({
    id:'owner-A-original',ownerId:ownerA,category:'Tops',color:'Blue',
    image:dataURL,originalPhoto:{image:dataURL,sha256:sha},
    sourceSHA256:sha,sourceHashVerified:true
   });
   tx.objectStore('state').put({id:'cloud-sync',baseVersion:4,
    baseDocument:{schemaVersion:1,items:[],state:{}},localRevision:9,
    dirty:false,needsRestore:false});
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
  },{ownerA,dataURL,sha});
  await seed.close();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine:name,width,error:e.message}));
  const read=()=>page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const tx=db.transaction(['items','state'],'readonly');
   const get=(store,id)=>new Promise((resolve,reject)=>{
    const r=tx.objectStore(store).get(id);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const all=()=>new Promise((resolve,reject)=>{
    const r=tx.objectStore('items').getAll();
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   const [items,marker,draft]=await Promise.all([
    all(),get('state','cloud-sync'),get('state','draft')
   ]);db.close();return {items,marker,draft};
  });
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent.includes('Local items are kept'));
  const rejected=await read();
  assert.deepEqual(rejected.items.map(x=>x.id),['owner-A-original']);
  assert.equal(rejected.items[0].ownerId,ownerA);
  assert.equal(rejected.items[0].image,dataURL);
  assert.equal(rejected.marker.baseVersion,4);
  assert.equal(rejected.draft,undefined);
  assert.equal(requests.filter(x=>x.select==='revision,document').length,1,
   'foreign tagged item must be inspected only after mismatch');
  await page.locator('.account-menu > summary').click();
  const rejectScreenshot=`${name}-${width}-foreign-owner-rejected.png`;
  const png=await page.screenshot({path:resolve(output,rejectScreenshot),fullPage:false});
  assert.equal((await sharp(png).metadata()).width,width);
  await page.addScriptTag({content:axeSource});
  const access=await page.evaluate(()=>axe.run(document,{
   runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  }));
  assert.deepEqual(access.violations.map(v=>v.id),[]);
  // A newer same-auth-owner record is allowed and actually restores.
  revision=6;doc={schemaVersion:1,items:[ownerRow('signed-A-cloud-piece',ownerA)],state:{}};
  await page.evaluate(()=>closetCloud.sync());
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  const recovered=await read();
  assert.deepEqual(recovered.items.map(x=>x.id),['signed-A-cloud-piece']);
  assert.equal(recovered.items[0].ownerId,ownerA);
  assert.equal(recovered.marker.baseVersion,6);
  // A camera draft explicitly tagged for B is also rejected.
  revision=7;doc={schemaVersion:1,items:[ownerRow('signed-A-cloud-piece',ownerA)],
   state:{draft:{id:'draft',batch:[ownerRow('foreign-owner-draft',ownerB)]}}};
  await page.evaluate(()=>closetCloud.sync());
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent.includes('Local items are kept'));
  const draftRefused=await read();
  assert.equal(draftRefused.marker.baseVersion,6);
  assert.deepEqual(draftRefused.items.map(x=>x.id),['signed-A-cloud-piece']);
  assert.equal(draftRefused.draft,undefined);
  // Historical garments with no owner tag remain recoverable without
  // manufacturing source attestations or an owner approval.
  revision=8;doc={schemaVersion:1,items:[ownerRow('untagged-legacy-piece',undefined)],state:{}};
  await page.evaluate(()=>closetCloud.sync());
  await page.waitForFunction(()=>document.getElementById('cloudStatus')?.textContent==='Cloud backup up to date');
  const legacy=await read();
  assert.deepEqual(legacy.items.map(x=>x.id),['untagged-legacy-piece']);
  assert.equal(legacy.items[0].ownerId,undefined);
  assert.equal(legacy.marker.baseVersion,8);
  return {engine:name,width,originalPreservedOnForeignOwner:true,
   foreignDraftRefused:true,signedOwnerRestored:true,legacyOwnerlessSupported:true,
   finalPrivateRevision:legacy.marker.baseVersion,
   screenshot:rejectScreenshot,sha256:createHash('sha256').update(png).digest('hex'),
   axeViolations:access.violations.length,syntheticOwner:true,
   physicalAndroid:false,physicalIPhone:false,hostedSignedSupabase:false};
 }finally{await context.close();await browser.close();}
}
try{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])results.push(await check(name,engine,width));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'results.json'),JSON.stringify({
  mission:3,scenario:'reject foreign ownerId from same-owner cloud REST row and preserve private originals',
  cases:results,errors,limitations:{syntheticBackend:true,physicalPhone:false,
   hostedRealAuth:false,releaseReady:false,familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,errors:errors.length,
  result:resolve(output,'results.json')}));
}finally{await new Promise(done=>server.close(done));}
