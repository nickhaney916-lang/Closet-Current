/**
 * MAIN1054 M58: actual unmodified P88 module Worker, browser WASM fp32
 * SegFormer, SHA-locked public original JPEG, and native MULTI24 owner review.
 * NO mock Worker, NO fake logits, NO synthetic model replies.
 * Signed auth HTTP is deliberately synthetic; hosted RLS is NOT tested.
 *
 * Required CI scratch: git-show exact immutable P88 worker/segmentation/
 * component review/photo color blobs into .m57-exact-p88-donor/public/.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,extname} from 'node:path';
import {performance} from 'node:perf_hooks';
import {chromium} from 'playwright';
const file=await readFile('benchmark/fixtures/commons-0003.jpg');
const sha=createHash('sha256').update(file).digest('hex');
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0003');
assert.ok(locked?.verified&&locked.sha256===sha);
assert.equal(file[0],255);assert.equal(file[1],216);
const engine='chromium';
const out=resolve('benchmark/main58-real-p88-browser-worker');
await mkdir(out,{recursive:true});
const root=resolve('.');
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.css':'text/css','.json':'application/json','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||!['/public/','/research/','/benchmark/','/node_modules/','/.m57-exact-p88-donor/'].some(prefix=>path.startsWith(prefix))||
     path.includes(String.fromCharCode(92))||path.includes(String.fromCharCode(0))||path.split('/').includes('..'))
   throw Error('not a source-only local asset');
  const absolute=resolve(root,'.'+path);
  if(!absolute.startsWith(root+'/'))throw Error('path escaped repository');
  const body=await readFile(absolute);
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('M58 fixture asset not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const auth='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
const external=[],rejected=[],issues=[],modelResponses=[];
let browser,stage='startup';
const started=performance.now();
function authFixture(route){
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  const info=JSON.parse(req.postData()||'{}');
  const owner=url.searchParams.get('grant_type')==='password'&&
   info.email==='m58-A@example.test'?'m58-A':null;
  if(!owner)return route.fulfill({status:401,contentType:'application/json',body:'{"error":"fixture-only"}'});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   user:{id:owner,email:'m58-A@example.test'},access_token:'synthetic-m58-A',
   refresh_token:'synthetic-m58-refresh-A',expires_in:3600
  })});
 }
 issues.push('unexpected-auth-endpoint');return route.abort();
}
const countRows=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const req=db.transaction('items','readonly').objectStore('items').count();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
}));
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({
  viewport:{width:390,height:920},isMobile:true,hasTouch:true,
  serviceWorkers:'block'
 });
 await context.route('**/*',route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.href===origin+'/public/cloud-backup.js')
   return route.fulfill({status:200,contentType:'text/javascript',body:cloudStub});
  if(url.origin===origin||url.protocol==='blob:'||url.protocol==='data:')
   return route.continue();
  if(url.origin===auth&&url.pathname.startsWith('/auth/v1/'))
   return authFixture(route);
  // Strict public model asset egress only, and NEVER a POST from original.
  const h=url.hostname;
  const lib=h==='cdn.jsdelivr.net'&&
   url.pathname.startsWith('/npm/@huggingface/transformers@3.8.1/dist/')&&
   ['.js','.mjs','.wasm'].some(ext=>url.pathname.endsWith(ext));
  const hub=h==='huggingface.co'&&
   url.pathname.startsWith('/Xenova/segformer_b0_clothes/');
  const weights=h==='cdn-lfs.huggingface.co'||h.endsWith('.hf.co')||
   h==='cas-bridge.xethub.hf.co';
  if(req.method()==='GET'&&(lib||hub||weights)){
   external.push({host:h,type:lib?'pinned-browser-library':hub?'pinned-model-hub':'model-binary-cdn'});
   return route.continue();
  }
  // Third-party styles, analytics and all unrelated hosts cannot fetch originals.
  if(req.method()==='GET'&&
     ['fonts.googleapis.com','fonts.gstatic.com','raw.githubusercontent.com'].includes(h))
   return route.abort();
  rejected.push({host:h,method:req.method(),path:url.pathname.slice(0,100)});
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>issues.push('pageerror-'+String(e.message).slice(0,120)));
 page.on('crash',()=>issues.push('browser-crash'));
 context.on('response',res=>{
  const u=new URL(res.url());
  if(u.hostname==='cdn.jsdelivr.net'||u.hostname==='huggingface.co'||u.hostname.endsWith('.hf.co')){
   modelResponses.push({host:u.hostname,status:res.status()});
  }
 });
 stage='sign-in';
 const params='multi24=research&p88Transport57=research&captureProof01=after&index04=after&nativeLossless04=research&nativeIndex07=research&index02=after&restoreAtomic01=research&styleOwned03=research&nativeCorrection10=research';
 await page.goto(origin+'/public/index.html?'+params,{waitUntil:'domcontentloaded'});
 await page.locator('#authEmail').fill('m58-A@example.test');
 await page.locator('#authPassword').fill('fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(()=>window.closetAuth?.user?.id==='m58-A'&&
  db?.name==='closet-current-user-m58-A',null,{timeout:45000});
 await page.waitForFunction(()=>window.multi24Research?.active===true&&
  window.multi24Research.debug().p88Transport57===true,null,{timeout:45000});
 stage='genuine worker original JPEG and live SegFormer';
 await page.evaluate(()=>switchView('scan'));
 await page.locator('#captureOutfit').click();
 await page.locator('#outfitUpload').setInputFiles({
  name:'commons-0003.jpg',mimeType:'image/jpeg',buffer:file
 });
 await page.waitForFunction(expected=>
   window.multi24Research?.debug().sourceSHA256===expected,
   sha,{timeout:45000});
 await page.waitForFunction(()=>{
  const d=window.multi24Research?.debug();
  return d&&!d.working&&(/unverified region|Automatic extraction unavailable|could not start|timed out/i.test(
   document.getElementById('multi24Status')?.textContent||''));
 },null,{timeout:420000});
 const state=await page.evaluate(()=>({
  debug:window.multi24Research?.debug(),
  status:document.getElementById('multi24Status')?.textContent||'',
  cards:document.querySelectorAll('#multi24Grid .multi24-card').length
 }));
 assert.ok(external.some(x=>x.type==='pinned-browser-library'),
  'No real worker attempted the pinned CDN import');
 assert.ok(external.some(x=>x.type==='pinned-model-hub')||
  modelResponses.some(x=>x.host==='huggingface.co'),
  'No genuine model hub request was attempted');
 assert.ok(modelResponses.some(x=>x.status>=200&&x.status<300),
  'No pinned model/library network resource succeeded');
 assert.equal(state.debug.sourceSHA256,sha);
 assert.equal(state.debug.p88Transport57,true);
 assert.equal(state.debug.working,false);
 assert.ok(state.cards>0&&state.cards<=12,
  'Genuine P88 browser worker did not produce a bounded actual model proposal');
 assert.ok(/unverified region/.test(state.status),'Never call the proposals confirmed');
 assert.equal(await countRows(page),0,'A genuine worker auto-saved an unconfirmed garment');
 assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
 assert.deepEqual(rejected,[],'unexpected outbound request may leak source image');
 assert.deepEqual(issues,[],'actual native browser errors');
 const receipt={
  schema:'MAIN1054_M58_UNMODIFIED_P88_REAL_BROWSER_WASM_OWNER_REVIEW/v1',
  source:'commons-0003',sourceSHA256:sha,originalJPEGBytes:file.length,
  sourceLicense:locked.attribution?.license,sourceVerified:true,
  actualBrowser:'chromium',viewportWidth:390,actualNativeApp:true,
  actualP88ModuleWorkerExecuted:true,noSyntheticWorker:true,
  actualModel:'Xenova/segformer_b0_clothes',modelRevision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
  browserModelRuntime:'wasm-fp32',
  modelWeightSHA256IndependentlyVerified:false,
  actualWorkerSourceBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f',
  sourceGroupsUnverified:state.cards,reviewStatus:state.status,
  modelHosts:[...new Set(external.map(x=>x.host))],
  modelHttpStatusSummary:Object.fromEntries([...new Set(modelResponses.map(x=>x.status))]
   .map(code=>[code,modelResponses.filter(x=>x.status===code).length])),
  unexpectedOutbound:rejected,
  elapsedWallMs:Math.round(performance.now()-started),
  syntheticLogin:true,localIndexedDBOnly:true,ownerPrivateSaves:0,
  humanAccuracyMeasured:false,independentSealedBlindHumanLabels:false,
  physicalDevice:false,hostedSignedRLS:false,full3DReady:false,
  familyAlpha:'HOLD',releaseAllowed:false
 };
 await writeFile(join(out,'M58-ACTUAL-P88-BROWSER-NO-SILENT-SAVE.json'),
  JSON.stringify(receipt,null,2)+'\n');
 console.log('M58_GENUINE_BROWSER_WASM_SOURCE_TO_NATIVE_REVIEW',JSON.stringify({
  engine,sourceSHA256:sha,groups:state.cards,realWorker:true,
  modelRequests:modelResponses.length,elapsedMs:receipt.elapsedWallMs,
  saved:0,hold:true
 }));
 await context.close();
}catch(e){
 console.error('M58_REAL_P88_WORKER_FAIL',JSON.stringify({
  stage,error:String(e?.stack||e).slice(0,950),
  external:external.slice(0,15),rejected:rejected.slice(0,15),issues:issues.slice(0,10),
  modelStatuses:modelResponses.slice(0,12)
 }));
 process.exitCode=1;
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
}
