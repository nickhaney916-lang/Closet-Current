/** MAIN1054 M12 sampler ablation (stacked on verified P880): measured real dual-model phase and Linux process-tree memory diagnostic, exact P876 policy,
 * GENUINE pretrained two-model q8 WASM inference on original public JPEGs.
 * Calibrated-timeout staged research WebKit response and zero private writes.
 * Not blind recognition accuracy or physical iPhone acceptance.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('public'),out=resolve('benchmark/main1054-webkit-sampler-ablation');
const engineName=process.argv[2]||'webkit',target=Number(process.env.MAIN1054_TARGET||4);
const memoryMode=process.env.MAIN1054_MEMORY_MODE||'none';
assert.ok(['none','rss','pss'].includes(memoryMode),'invalid measured-memory ablation mode');
assert.ok(['webkit','chromium'].includes(engineName),'unsupported engine');
assert.ok([2,4].includes(target),'bounded only 2 or 4 genuine attempts');
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const ids=(process.env.MAIN1054_REAL_IDS||'commons-0035,commons-0062,commons-0078,commons-0059').split(',');
const fixed=['commons-0035','commons-0045','commons-0062','commons-0088','commons-0001','commons-0094','commons-0078','commons-0059'];
assert.ok(ids.length>=2&&ids.length<=8&&ids.every((id,i)=>fixed.includes(id)&&ids.indexOf(id)===i));
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const photos=[];
for(const id of ids){
 const receipt=manifest.find(row=>row.id===id);
 assert.ok(receipt?.verified&&receipt.sha256&&receipt.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 assert.ok(['CC0','Public domain','CC BY 2.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0'].includes(receipt.attribution.license));
 const bytes=await readFile('benchmark/photos/'+receipt.image);
 assert.equal(sha(bytes),receipt.sha256,id+' immutable public JPEG SHA check');
 assert.ok(bytes.length>1000&&bytes.length<8*1024*1024);
 photos.push({id,sourceSHA256:receipt.sha256,license:receipt.attribution.license,
  image:'data:image/jpeg;base64,'+bytes.toString('base64')});
}
const app=await readFile(resolve(root,'app.js'),'utf8');
const start=app.indexOf('function node('),end=app.indexOf('function cropClothingPhoto(');
assert.ok(start>0&&end>start,'true native clothingFields source boundaries absent');
const nativeFields=app.slice(start,end);
assert.match(nativeFields,/function clothingFields\(/);
const taxonomy=await readFile(resolve(root,'taxonomy.js'),'utf8');
const details=await readFile(resolve(root,'clothing-details.js'),'utf8');
const served={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json','.bin':'application/octet-stream','.onnx':'application/octet-stream','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html'});return res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M4 M1 native owner-review test</title><body></body></html>');}
  const p=decodeURIComponent(url.pathname);
  if(req.method!=='GET'||p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))throw Error('bad resource');
  const model=p.startsWith('/_dual82/'),base=model?resolve('benchmark/p82-model-assets'):root,asset=model?p.slice('/_dual82'.length):p;const file=resolve(base,'.'+asset);if(!file.startsWith(base+'/'))throw Error('outside');
  const b=await readFile(file);res.writeHead(200,{'content-type':served[extname(file)]||'application/octet-stream'});res.end(b);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const boot=`
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
${taxonomy}
${details}
${nativeFields}
window.writes1054=0;
window.stage1054=async({hash=true,segmented=false,owned=false,owner='owner-A',mode='joint',onHold=false}={})=>{
 for(const p of document.querySelectorAll('dialog')){p.close();p.remove();}
 window.owner1054=window.owner1054||{id:owner};window.auth1054=window.auth1054||{user:window.owner1054};window.db1054=window.db1054||{name:'closet-current-user-'+owner};
 window.epoch1054='test-epoch-'+crypto.randomUUID();window.writes1054=0;
 window.mode1054=mode;window.hold1054=onHold;window.requests1054=0;window.effects1054=0;window.actual1054=null;window.workerError1054=null;window.stageTrace1054=[];
 const raw=window.publicPhoto1054,sha=window.publicSHA1054;
 const item={
  id:'owner-photo-1',ownerId:owner,image:raw,
  originalPhoto:{image:raw,sha256:sha},sourceSHA256:hash?sha:'f'.repeat(64),
  sourceHashVerified:hash,category:'Bottoms',itemType:'Unknown',
  color:'Blue',colorSource:'user',userAdjusted:true,
  sleeveLength:'Not applicable',seasons:[],notes:''
 };
 if(segmented){item.segmentHint={clipped:true};item.outfitSourceId='different-photo';}
 window.item1054=item;window.items1054=owned?[item]:[];window.batch1054=owned?[]:[item];
 const dialog=document.createElement('dialog'),form=document.createElement('form');
 window.dialog1054=dialog;window.form1054=form;window.draft1054=structuredClone(item);
 clothingFields(form,window.draft1054);
 const ownerAck=document.createElement('input');ownerAck.type='checkbox';ownerAck.setAttribute('aria-label','I verified the garment photo before saving');form.append(ownerAck);window.ack1054=ownerAck;
 dialog.append(form);document.body.append(dialog);dialog.showModal();
 const {mountMission4DualReview1054}=await import('/m4-dual-review-1054.mjs');
 const {VERSION82,MODEL_ASSETS82}=await import('/dual-core-82.mjs');
 const {localCandidates}=await import('/local-catalog.mjs');
 const {observation81}=await import('/model-arbitration-81.mjs');
 const request=async(r,options)=>{
  window.requests1054++;
  try{
   const {browserRequest82}=await import('/dual-core-82.mjs');
   const output=await browserRequest82(r,{
   ...options,timeoutMs:140000,
   onProgress:stage=>{
    window.stageTrace1054.push({stage:String(stage).slice(0,90),ms:Math.round(performance.now())});
    console.log('MAIN1054_REAL_MODEL_STAGE',String(stage).slice(0,90));
    options?.onProgress?.(stage);
   }
  });
   window.actual1054={request:r,output};
   return output;
  }catch(error){window.workerError1054=String(error?.message||error);throw error;}
 };
 try{
  window.mounted1054=await mountMission4DualReview1054({
   form,dialog,item,draft:window.draft1054,
   editorSession:{current:()=>window.auth1054?.user===window.owner1054},
   getItems:()=>window.items1054,getBatch:()=>window.batch1054,
   getDb:()=>window.db1054,getEpoch:()=>window.epoch1054,
   getAuth:()=>window.auth1054,getSchema:()=>clothingSchema,
   saving:()=>false,request,supported:true
  });
  window.error1054=null;
 }catch(e){window.error1054=String(e.message||e);window.mounted1054=null;}
 return {mounted:!!window.mounted1054,error:window.error1054};
};
window.revoke1054=kind=>{
 if(kind==='owner')window.auth1054={user:{id:'owner-B'}};
 if(kind==='relogin')window.epoch1054='replacement-epoch';
 if(kind==='source')window.item1054.sourceSHA256='0'.repeat(64);
 if(kind==='lock')window.dispatchEvent(new Event('closet:session-locked'));
};
window.result1054=()=>({
 writes:window.writes1054,requests:window.requests1054,
 item:window.item1054.itemType,draft:window.draft1054.itemType,
 ack:window.ack1054.checked,photo:window.item1054.originalPhoto.image,
 panel:!!document.querySelector('[data-dual82]'),
 valid:window.mounted1054?.active()||false
});
`;
/** Continuous native editor, REAL pinned q8 models, no private account or save.
 * A crash is a legitimate OBSERVED FAILURE of release acceptance, not an
 * excuse to report a successful 16-photo run. Never infer OOM from a crash. */
const results=[],requests=[],pageErrors=[],consoleErrors=[],modelStages=[];
const events={workerCreated:0,workerTerminated:0,pageCrash:0,pageClosed:0,browserDisconnected:0};
const startTime=Date.now(),failures=[];
let browser,page,context,intentionalShutdown=false;

// Linux /proc telemetry only on the disposable GitHub runner.
// Reduced sampling cadence (3s) limits /proc smaps_rollup page-table walk
// overhead during the genuine CPU-bound WebKit q8 model load; no claim of zero
// profiler distortion or of an observed physical iPhone memory peak.
// RSS sums double count shared pages; summed PSS apportions shared pages when
// readable, but sampling cannot establish an OS-level or physical iPhone peak.
const memory={
 platform:process.platform,sampleCount:0,samplesWithBrowserProcess:0,
 peakBrowserDescendantRssKiB:null,peakBrowserDescendantPssKiB:null,
 processCountAtPeakRss:0,lastBrowserRssKiB:null,lastBrowserPssKiB:null,
 browserPssReadable:false,samplingIntervalMs:3000,mode:memoryMode,
 source:'linux-proc-descendants-of-playwright-runner',
 limitations:'RSS sum can double-count shared pages; sampled PSS is not an OS peak; desktop Linux cannot prove iPhone Safari memory safety',
};
let samplingBusy=false,sampleTimer=null;
const sampleLinuxBrowser=async()=>{
 if(memoryMode==='none'||process.platform!=='linux'||samplingBusy)return;
 samplingBusy=true;
 try{
  const numbers=(await readdir('/proc')).filter(p=>/^[0-9]+$/.test(p));
  const status=await Promise.all(numbers.map(async n=>{
   try{
    const value=await readFile('/proc/'+n+'/status','utf8');
    const ppid=Number(value.match(/^PPid:\s*(\d+)/m)?.[1]);
    const rssKiB=Number(value.match(/^VmRSS:\s*(\d+)\s*kB/m)?.[1]||0);
    if(!Number.isFinite(ppid))return null;
    return {pid:Number(n),ppid,rssKiB};
   }catch{return null;}
  }));
  const allProcesses=status.filter(Boolean),known=new Set([process.pid]),desc=[];
  let changed=true;
  while(changed){changed=false;
   for(const p of allProcesses){
    if(known.has(p.ppid)&&!known.has(p.pid)){
     known.add(p.pid);desc.push(p);changed=true;
    }
   }
  }
  if(!desc.length)return;
  const rssKiB=desc.reduce((n,p)=>n+p.rssKiB,0);
  // RSS mode isolates cheap status sampling from PSS page-table walks.
  const rollups=memoryMode==='pss'?await Promise.all(desc.map(async p=>{
   try{
    const r=await readFile('/proc/'+p.pid+'/smaps_rollup','utf8');
    const m=r.match(/^Pss:\s*(\d+)\s*kB/m);
    return m?Number(m[1]):null;
   }catch{return null;}
  })):[];
  const pssReadable=rollups.some(x=>Number.isFinite(x));
  const pssKiB=pssReadable?rollups.reduce((n,x)=>n+(Number.isFinite(x)?x:0),0):null;
  memory.sampleCount++;
  memory.samplesWithBrowserProcess++;
  memory.lastBrowserRssKiB=rssKiB;
  memory.lastBrowserPssKiB=pssKiB;
  if(memory.peakBrowserDescendantRssKiB===null||rssKiB>memory.peakBrowserDescendantRssKiB){
   memory.peakBrowserDescendantRssKiB=rssKiB;
   memory.processCountAtPeakRss=desc.length;
  }
  if(pssReadable){
   memory.browserPssReadable=true;
   memory.peakBrowserDescendantPssKiB=Math.max(memory.peakBrowserDescendantPssKiB||0,pssKiB);
  }
 }catch(error){
  memory.telemetryFailure=String(error?.code||error?.name||'UNKNOWN').slice(0,50);
 }finally{samplingBusy=false;}
};
const emit=async()=>{
 const completed=results.length;
 const state={
  schema:'main1054-m12-p880-real-webkit-sampler-ablation-v1',
  status:completed===target&&!failures.length?'COMPLETE_OBSERVED':'BLOCKED_INCOMPLETE',
  engine:engineName,browserPlatform:'GitHub Actions ubuntu-24.04 desktop',
  session:'one-continuous-browser-one-page-sequential-disposable-workers',
  modelFamilies:['FashionCLIP q8 WASM','FashionSigLIP q8 WASM'],
  uniquePublicPhotoSources:photos.length,
  photoAttemptsTarget:target,completedPhotos:completed,
  gateCounts:Object.fromEntries([2,4,8,16].map(n=>[String(n),{requested:target>=n,met:completed>=n}])),
  rootCause:'UNDETERMINED',
  perRequestTimeoutMs:140000,browserResponseWaitMs:155000,
  modelStages,
  pageEvents:events,resourceMeasurements:{...memory,
    measuredMemory:memory.samplesWithBrowserProcess>0,
    processTreeIncludesRunner:false,processTreeScope:'descendants of Node PID',
    pssIsComplete:false},
  sourceHashesVerified:true,publicOriginalDiskWrites:0,
  failedAttemptRendererImageIntegrity:failures.length?null:true,autoAdmissions:0,
  ownerAccount:'synthetic-only',ownerSessionIdentityChanged:false,
  persistedPrivateWardrobeWrites:0,authorizedHostedCloud:false,
  independentHumanPhotoLabels:0,blindAccuracy:null,physicalMobileDevices:0,
  officialSafariOnIPhone:false,acceptanceForRelease:false,
  familyAlpha:'HOLD',elapsedMs:Date.now()-startTime,
  rows:results,failures,networkBlocked:requests.filter(x=>x.blocked).length,
  pageErrors:pageErrors.slice(0,6),consoleErrors:consoleErrors.slice(0,6),
 };
 await writeFile(out+'/'+engineName+'-'+target+'-ablation.json',JSON.stringify(state,null,2)+'\n');
 return state;
};
try{
 browser=await ({webkit,chromium}[engineName]).launch({
  headless:true,args:engineName==='chromium'?['--no-sandbox']:[],
 });
 browser.on('disconnected',()=>{if(!intentionalShutdown)events.browserDisconnected++;});
 if(memoryMode!=='none'){
  await sampleLinuxBrowser();
  sampleTimer=setInterval(()=>{void sampleLinuxBrowser();},memory.samplingIntervalMs);
  sampleTimer.unref();
 }
 context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.route('**/*',route=>{
  const url=route.request().url();
  if(route.request().method()==='GET'&&
   (url.startsWith(host+'/')||url.startsWith('blob:'+host+'/')))
   return route.continue(); // WebKit emits legitimate same-origin runtime blob requests
  requests.push({url:url.slice(0,90),method:route.request().method(),blocked:true});
  return route.abort();
 });
 page=await context.newPage();
 page.setDefaultTimeout(300000);
 page.on('pageerror',e=>pageErrors.push(String(e.message).slice(0,180)));
 page.on('console',m=>{
  if(m.type()==='error')consoleErrors.push(m.text().slice(0,180));
  if(m.type()==='log'&&m.text().startsWith('MAIN1054_REAL_MODEL_STAGE '))
   modelStages.push({attempt:results.length+1,stage:m.text().slice(26,120),observedAtMs:Date.now()});
 });
 page.on('crash',()=>{events.pageCrash++;});
 page.on('close',()=>{if(!intentionalShutdown)events.pageClosed++;});
 page.on('worker',worker=>{
  events.workerCreated++;
  worker.on('close',()=>{events.workerTerminated++;});
 });
 await page.goto(host+'/');
 await page.addScriptTag({content:boot});
 // This is the same browser page/context with the same synthetic signed owner,
 // unlike M1's fresh-browser-per-photo WebKit smoke check.
 for(let i=0;i<target;i++){
  const photo=photos[i%photos.length],attempt=i+1;
  let failure=null,info=null;
  try{
   await page.evaluate(p=>{window.publicPhoto1054=p.image;window.publicSHA1054=p.sourceSHA256;},photo);
   const mounted=await page.evaluate(()=>window.stage1054());
   assert.equal(mounted.mounted,true,'native original SHA owner-bound editor unavailable '+JSON.stringify(mounted));
   assert.equal((await page.evaluate(()=>window.result1054())).requests,0);
   await page.getByRole('checkbox',{name:/I consent to a local two-model/}).check();
   await page.getByRole('checkbox',{name:/One garment is isolated/}).check();
   await page.getByRole('button',{name:'Compare with two models'}).click();
   await page.waitForFunction(()=>window.actual1054!==null||window.workerError1054!==null,null,{timeout:155000});
   info=await page.evaluate(async()=>{
    if(window.workerError1054)return {workerFailure:window.workerError1054};
    const {validateResponse82}=await import('/dual-core-82.mjs');
    const {sharedRankChoices82}=await import('/dual-panel-82.mjs');
    const {output,request}=window.actual1054;
    const decision=validateResponse82(output,request);
    const choices=sharedRankChoices82(decision,output.observations);
    return {modelKeys:output.observations.map(o=>o.modelKey),
     status:decision.status,reasons:decision.reasons,
     outputs:output.observations.length,
     candidateCount:choices.length,verifiedAssets:output.verifiedAssets,
     totalMs:output.totalMs,
     autoAdmissions:output.automaticAdmissions,
     rawTop:output.observations.map(o=>({key:o.modelKey,
      category:o.ranking?.[0]?.category,itemType:o.ranking?.[0]?.itemType})),
     buttons:[...document.querySelectorAll('[data-dual82] button')].filter(x=>x.textContent.startsWith('Use ')).length,
     sourceValid:window.item1054.image===window.item1054.originalPhoto.image&&
      window.item1054.sourceSHA256===window.item1054.originalPhoto.sha256,
     itemSavedType:window.item1054.itemType,
     approval:window.ack1054.checked,writes:window.writes1054,
     adapterActive:window.mounted1054.active(),
     memoryUsedJSHeapBytes:performance.memory?.usedJSHeapSize||null,
     workerStageTrace:window.stageTrace1054.slice(0,8),
     phaseTimings:Array.isArray(output.timings)?output.timings.map(t=>({
      modelKey:t.key,loadMs:Math.round(t.loadMs),inferenceMs:Math.round(t.inferenceMs)
     })):[],
     setupMs:Math.round(output.setupMs||0),
     verifiedFetchedBytes:output.fetchedBytes||0,
     estimatedModelWeightsBytes:output.estimatedWeightBytes||null,
    };
   });
   if(info.workerFailure)throw Error('P82_MODEL_WORKER_DECLARED: '+info.workerFailure);
   assert.deepEqual(new Set(info.modelKeys),new Set(['fashionclip','fashionSiglip']));
   assert.equal(info.autoAdmissions,0);
   assert.equal(info.writes,0);
   assert.equal(info.approval,false);
   assert.equal(info.sourceValid,true);
   assert.equal(info.itemSavedType,'Unknown');
   assert.equal(info.buttons,info.candidateCount);
   assert.equal(info.adapterActive,true);
  }catch(error){
   // Deliberately do not interpret a crashed browser as proven OOM.
   const message=String(error?.message||error).slice(0,350);
   const lastModelStage=modelStages.filter(x=>x.attempt===attempt).at(-1)?.stage||null;
   const category=events.pageCrash?'OBSERVED_PAGE_CRASH':
    events.browserDisconnected?'BROWSER_DISCONNECTED':
    page?.isClosed()?'PAGE_CLOSED_CAUSE_UNKNOWN':
    info?.workerFailure?'MODEL_WORKER_DECLARED_ERROR':
    /timeout/i.test(message)?'TIMEOUT_UNCLASSIFIED':'UNCLASSIFIED_EXCEPTION';
   failure={iteration:attempt,id:photo.id,category,message,observedPageCrash:events.pageCrash>0,
    observedBrowserDisconnect:events.browserDisconnected>0,lastModelStage,
    observedProcessRSSBytes:null,rendererImageIntegrityAfterFailure:null};
   failures.push(failure);
   console.log('MAIN1054_WEBKIT_ABLATION_FAILURE',JSON.stringify(failure));
  }
  if(failure){await emit();break;}
  results.push({iteration:attempt,id:photo.id,sourceSHA256:photo.sourceSHA256,
   realModelFamilies:info.modelKeys,verifiedAssets:info.verifiedAssets,
   candidateCount:info.candidateCount,decisionStatus:info.status,
   elapsedInferenceMs:Math.round(info.totalMs),
   sourceValid:true,privateWrites:0,automaticAdmissions:0,
   browserJSHeapBytes:info.memoryUsedJSHeapBytes,
   processRSSBytes:null,
   stages:modelStages.filter(x=>x.attempt===attempt).map(x=>x.stage),
   workerStageTrace:info.workerStageTrace,
   phaseTimings:info.phaseTimings,setupMs:info.setupMs,
   verifiedFetchedBytes:info.verifiedFetchedBytes,
   estimatedModelWeightsBytes:info.estimatedModelWeightsBytes,
   observedBrowserRssAtCompletionKiB:memory.lastBrowserRssKiB,
   observedBrowserPssAtCompletionKiB:memory.lastBrowserPssKiB,
  });
  console.log('MAIN1054_WEBKIT_ABLATION_ROW',JSON.stringify({
   engine:engineName,iteration:attempt,publicSource:photo.id,
   models:info.modelKeys,ms:Math.round(info.totalMs),
   workerEvents:events.workerCreated,workerTerminations:events.workerTerminated,
   memoryMode,
   rssMeasured:memory.samplesWithBrowserProcess>0,
   phaseTimings:info.phaseTimings,
   rssKiB:memory.lastBrowserRssKiB,pssKiB:memory.lastBrowserPssKiB,
   autoSaves:0}));
  if([2,4,8,16].includes(attempt))await emit();
 }
 if(!page?.isClosed()&&!failures.length){
  await page.evaluate(()=>window.revoke1054('lock'));
  assert.equal(await page.locator('[data-dual82]').count(),0);
 }
 if(requests.some(x=>x.blocked)||pageErrors.length)
  failures.push({category:'BROWSER_RESOURCE_OR_JS_ERROR',networkBlocked:requests.filter(x=>x.blocked).length,
   pageErrors:pageErrors.slice(0,4)});
}catch(error){
 failures.push({category:events.pageCrash?'OBSERVED_PAGE_CRASH':
  events.browserDisconnected?'BROWSER_DISCONNECTED':'HARNESS_EXCEPTION',
  message:String(error?.message||error).slice(0,350)});
 console.log('MAIN1054_WEBKIT_HARNESS_FAILURE',JSON.stringify(failures.at(-1)));
}finally{
 // This is a DIAGNOSTIC experiment. Capture incomplete runs as BLOCKED, not
 // a false completed acceptance or a fabricated cause, even when browser dies.
 clearInterval(sampleTimer);
 if(memoryMode!=='none')await sampleLinuxBrowser();
 intentionalShutdown=true; // voluntary shutdown is NOT a browser crash or disconnect
 try{await context?.close();}catch{}
 try{await browser?.close();}catch{}
 const state=await emit();
 console.log('MAIN1054_WEBKIT_ABLATION_SUMMARY',JSON.stringify({
  engine:engineName,completed:state.completedPhotos,target,
  checkpoints:state.gateCounts,failures:state.failures.length,
  status:state.status,releaseReady:false,physicalIPhone:false,
  pageCrashEvents:events.pageCrash,workerEvents:events.workerCreated,
  memoryMode,observedMemoryRSS:state.resourceMeasurements.measuredMemory,
  sampledBrowserRssPeakKiB:state.resourceMeasurements.peakBrowserDescendantRssKiB,
  sampledBrowserPssPeakKiB:state.resourceMeasurements.peakBrowserDescendantPssKiB}));
 await new Promise(resolve=>server.close(resolve));
}
