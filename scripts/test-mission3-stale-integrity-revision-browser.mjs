// Native Chromium/WebKit: stale malformed owner REST response must not quarantine a newer garment revision.\n// Real Chromium/WebKit owner-private cloud backup: if a user edits/deletes
// a garment while its previous photo POST is blocked, the old snapshot must
// never reach the cloud CAS endpoint. Only the updated local wardrobe may be
// published; data and backend are synthetic, no hosted accounts.
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

const root=resolve('dist'),out=resolve(process.argv[2]||'benchmark/mission3-stale-integrity-revision-browser');
await mkdir(out,{recursive:true});
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.json':'application/json','.html':'text/html','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(p==='/'?'/index.html':p));
  if(!file.startsWith(root+'/')||p.includes('\\'))throw Error('invalid test path');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
   'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,
 cloud='https://hlkgymugtfbirlpunsra.supabase.co';
const jpg=await sharp(Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480">'+
 '<rect width="360" height="480" fill="#d5e0e7"/>'+
 '<path d="M108 44L148 25H211L251 44L315 138L260 177L239 118L239 429H121V118L100 177L45 138Z" fill="#27658a"/>'+
 '</svg>')).jpeg({quality:84}).toBuffer();
const dataURL='data:image/jpeg;base64,'+jpg.toString('base64');
const sha=createHash('sha256').update(jpg).digest('hex');
const axeSource=await readFile('node_modules/axe-core/axe.min.js','utf8');
const results=[],errors=[];
async function run(engine,type,width){
 const owner=(engine==='chromium'?'c':'d')+String(width).padStart(3,'0')+
  '0000-0000-4000-8000-000000000000';
 const mode=width===390?'edit':'delete';
 let release,entered;
 const gate=new Promise(resolve=>release=resolve),
  reached=new Promise(resolve=>entered=resolve);
 let version=0,firstRevisionRequest=true;
 const published=[],requests=[];
 const browser=await type.launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}: {})});
 const context=await browser.newContext({viewport:{width,height:844},
  isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  await context.route('**/auth.js*',route=>route.fulfill({
   contentType:'text/javascript',
   body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${owner}',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`
  }));
  await context.route(cloud+'/**',async route=>{
   const req=route.request(),u=new URL(req.url()),method=req.method();
   const actor=req.headers().authorization?.slice(7);
   requests.push({path:u.pathname,method});
   const reply=(body,status=200)=>route.fulfill({
    status,contentType:'application/json',body:JSON.stringify(body)});
   if(actor!==owner)return reply({error:'synthetic wrong account'},403);
   if(u.pathname==='/rest/v1/closet_backups'){
    assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
    if(firstRevisionRequest){
     firstRevisionRequest=false;entered();await gate;
     return reply([{revision:2},{revision:3}]);
    }
    return reply(version?[{revision:version}]:[]);
   }
   const prefix='/storage/v1/object/closet-private/';
   if(u.pathname.startsWith(prefix)){
    assert.equal(method,'POST');
    assert.equal(u.pathname.slice(prefix.length),owner+'/'+sha+'.jpg');
    assert.equal(createHash('sha256').update(req.postDataBuffer()).digest('hex'),sha);
    return reply({});
   }
   if(u.pathname==='/rest/v1/rpc/save_closet_backup'){
    const body=req.postDataJSON();
    assert.equal(body.p_expected_revision,version);
    version++;published.push(body.p_document);
    return reply(version);
   }
   return reply({error:'unsupported synthetic API path'},404);
  });
  const seed=await context.newPage();
  await seed.goto(origin+'/phone-photo-check.html',{waitUntil:'domcontentloaded'});
  await seed.evaluate(async({owner,dataURL,sha})=>{
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
   tx.objectStore('items').put({id:'old-saved-owner-garment',ownerId:owner,
    category:'Tops',color:'Blue',image:dataURL,
    originalPhoto:{image:dataURL,sha256:sha},
    sourceSHA256:sha,sourceHashVerified:true,userAdjusted:true});
   tx.objectStore('state').put({id:'cloud-sync',baseVersion:0,dirty:true,
    localRevision:1,baseDocument:null});
   await new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });db.close();
  },{owner,dataURL,sha});
  await seed.close();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine,width,error:e.message}));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>closetReady);
  await Promise.race([reached,new Promise((_,reject)=>
   setTimeout(()=>reject(Error('Owner cloud revision request did not reach blocking test gate')),18000))]);
  const before=()=>page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const q=indexedDB.open('closet-current-user-'+closetAuth.user.id,2);
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const tx=db.transaction(['items','state'],'readonly'),
    a=tx.objectStore('items').getAll(),m=tx.objectStore('state').get('cloud-sync');
   const [items,marker]=await Promise.all([
    new Promise(resolve=>a.onsuccess=()=>resolve(a.result)),
    new Promise(resolve=>m.onsuccess=()=>resolve(m.result))
   ]);db.close();return {items,marker};
  });
  // This is the actual native app's owner-session guarded write hook,
  // followed by a committed real IndexedDB edit in the same app connection.
  await page.evaluate(async mode=>{
   await closetCloud.beforeWrite(db);
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('items','readwrite');
    if(mode==='delete')tx.objectStore('items').delete('old-saved-owner-garment');
    else{
     const r=tx.objectStore('items').get('old-saved-owner-garment');
     r.onsuccess=()=>tx.objectStore('items').put({...r.result,color:'Teal'});
    }
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
   });
   closetCloud.changed();
  },mode);
  const changed=await before();
  assert.equal(changed.marker.localRevision,2);
  assert.equal(changed.marker.dirty,true);
  // changed() already showed "pending" while the upload was held, so
  // waiting for a matching string alone would be an invalid race test.
  // Wait for the NEXT actual DOM status mutation from the completed in-flight
  // sync after releasing its Storage POST, before inspecting cloud RPCs.
  const finished=page.evaluate(()=>new Promise(resolve=>{
   const status=document.getElementById('cloudStatus');
   const observer=new MutationObserver(()=>{
    if(status.textContent.includes('backup pending')){
     observer.disconnect();resolve(true);
    }
   });
   observer.observe(status,{subtree:true,childList:true,characterData:true});
  }));
  release();
  assert.equal(await Promise.race([finished,new Promise((_,reject)=>
   setTimeout(()=>reject(Error('Stale cloud revision request did not finish')),15000))]),true);
  const afterStale=await before();
  assert.equal(afterStale.marker.integrityPause,undefined,
   'old malformed cloud reply must not quarantine a newer owner edit');
  assert.equal(afterStale.marker.localRevision,2);
  assert.equal(afterStale.marker.dirty,true);
  assert.equal(published.length,0,
   'deleted/revised garment must not be published from stale malformed cloud revision');
  await page.locator('.account-menu > summary').click();
  const screenshot=`${engine}-${width}-${mode}-stale-integrity-HOLD.png`;
  const png=await page.screenshot({path:resolve(out,screenshot),fullPage:false});
  assert.equal((await sharp(png).metadata()).width,width);
  await page.addScriptTag({content:axeSource});
  const access=await page.evaluate(()=>axe.run(document,{
   runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  }));
  assert.deepEqual(access.violations.map(x=>x.id),[]);
  await page.locator('#syncCloset').click();
  await page.waitForFunction(()=>document.getElementById('cloudStatus')
   ?.textContent==='Cloud backup up to date');
  assert.equal(published.length,1);
  assert.equal(version,1);
  const final=await before();
  assert.equal(final.marker.baseVersion,1);
  assert.equal(final.marker.dirty,false);
  if(mode==='delete'){
   assert.deepEqual(published[0].items,[]);
   assert.deepEqual(final.items,[]);
  }else{
   assert.deepEqual(published[0].items.map(x=>x.color),['Teal']);
   assert.deepEqual(final.items.map(x=>x.color),['Teal']);
   assert.equal(final.items[0].image,dataURL);
  }
  return {engine,width,mode,syntheticOwner:true,
   staleMalformedCloudDidNotQuarantineNewerOwnerEdit:true,
   ownerLocalRevisionAdvanced:2,correctFinalCloudVersion:version,
   sourceSHA256:sha,screenshot,
   sha256:createHash('sha256').update(png).digest('hex'),
   axeViolations:access.violations.length,
   physicalDevice:false,hostedSupabase:false};
 }finally{release();await context.close();await browser.close();}
}
try{
 for(const [name,type]of [['chromium',chromium],['webkit',webkit]])
  for(const width of [320,390,430])results.push(await run(name,type,width));
 assert.deepEqual(errors,[]);
 await writeFile(resolve(out,'results.json'),JSON.stringify({
  mission:3,scenario:'owner edit or deletion while older malformed cloud REST response in flight',
  cases:results,errors,limitations:{syntheticOnly:true,
   actualHostSignedSupabase:false,physicalDevice:false,familyAlphaHold:255}
 },null,2)+'\n');
 console.log(JSON.stringify({cases:results.length,errors:errors.length,output:out}));
}finally{await new Promise(done=>server.close(done));}
