// Mission 3 lossless v4 owner-acceptance, actual unmodified app handlers.
// Native Chromium + WebKit 320/390/430, signed synthetic owners, JPEG/SHA.
// NO physical device, hosted cloud, private wardrobes or deploy.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const out=resolve(process.argv[2]||'benchmark/mission3-lossless-v4-owner-acceptance-browser');
await mkdir(out,{recursive:true});
const create=async r=>sharp({create:{width:144,height:108,channels:3,
 background:{r,g:105,b:143}}}).jpeg({quality:86}).toBuffer();
const originals=await Promise.all([75,140,200].map(create)).then(bytes=>
 bytes.map(raw=>({image:'data:image/jpeg;base64,'+raw.toString('base64'),
 sha:createHash('sha256').update(raw).digest('hex') })));
const root=resolve('.'),publicRoot=resolve('public');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=pathname.startsWith('/research/')
   ?resolve(root,'.'+pathname):
    resolve(publicRoot,'.'+(pathname==='/'?'/index.html':pathname));
  if(pathname.includes('\\')||pathname.split('/').includes('..')||
    (!file.startsWith(publicRoot+'/')&&
     !file.startsWith(resolve(root,'research')+'/')))
   throw Error('Invalid path');
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'0000-3333-4333-8333-888888888888';
   const foreignOwner='b'+width+'0000-4444-4444-8444-999999999999';
   const browser=await runner.launch({headless:true,
    args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},
    hasTouch:true,isMobile:true,acceptDownloads:true,serviceWorkers:'block'});
   const errors=[],offHost=[];
   async function setup(ctx,id){
    await ctx.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+id+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await ctx.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
     body:"window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{window.__cloudLocalChanged=(window.__cloudLocalChanged||0)+1;}};"}));
    await ctx.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(url.hostname==='127.0.0.1'||['blob:','data:'].includes(url.protocol))
      return route.fallback();
     offHost.push({method:route.request().method(),path:url.pathname,blocked:true});
     return route.abort();
    });
    await ctx.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.stopped=false;}
      postMessage(m){queueMicrotask(()=>{
       if(!this.stopped)this.onmessage?.({data:{
        id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}
       }});});}
      terminate(){this.stopped=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
   }
   async function openPage(ctx){
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(base+'/?losslessV4M3=research',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    return page;
   }
   async function snap(page){
    return page.evaluate(()=>new Promise((ok,fail)=>{
     const tx=db.transaction(['items','state'],'readonly'),
      a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
     tx.oncomplete=()=>ok({items:a.result,state:b.result});
     tx.onerror=tx.onabort=()=>fail(tx.error);
    }));
   }
   async function change(page,work){
    return page.evaluate(work);
   }
   async function chooseFile(page,backup){
    return page.evaluate(async backup=>{
     const content=JSON.stringify(backup);
     await $('import').onchange({target:{files:[{size:content.length,
      text:async()=>content}],value:'owner-backup-v4'}});
     return $('message').textContent;
    },backup);
   }
   try{
    await setup(context,owner);
    const page=await openPage(context);
    // Seed the native IndexedDB of the actual signed owner. Include a
    // genuinely pending photographed original, not only saved wardrobe items.
    await page.evaluate(async({owner,originals})=>{
     const [saved,pending]=originals;
     const garment={id:'owner-saved-shirt',ownerId:owner,category:'Tops',
      itemType:'T-shirt',color:'Blue owner-corrected',userAdjusted:true,
      sourceSHA256:saved.sha,sourceHashVerified:true,image:saved.image,
      originalPhoto:{image:saved.image,sha256:saved.sha},
      correctionHistory:['user-approved-blue'],
      futureRecognition:{model:'provenance-preserved'}};
     const draft={id:'pending-original-jacket',ownerId:owner,
      category:'Outerwear',itemType:'Jacket',color:'Unknown',
      localAnalyzed:false,image:pending.image,
      sourceSHA256:pending.sha,sourceHashVerified:true,
      originalPhoto:{image:pending.image,sha256:pending.sha}};
     await new Promise((ok,fail)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put(garment);
      tx.objectStore('state').put({id:'draft',batch:[draft]});
      tx.objectStore('state').put({id:'looks',
       looks:[{id:'my-style',title:'Inspiration',pieces:[]}]});
      tx.objectStore('state').put({id:'outfit-board',
       current:{name:'Tomorrow outfit',slots:{top:'owner-saved-shirt'}},
       saved:[{id:'outfit1',ownerId:owner,name:'Blue ensemble',
        slots:{top:'owner-saved-shirt',layer3:'missing-coat'}}]});
      tx.objectStore('state').put({id:'cloud-sync',
       localRevision:6,dirty:false,baseVersion:2,baseDocument:null});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
    },{owner,originals});
    // Unreviewed draft lives in native device storage. v3 refuses this; v4
    // must prove source-preserving download including the complete draft.
    const downloadPromise=page.waitForEvent('download',{timeout:15000}).catch(()=>null);
    const message=await page.evaluate(async()=>{
     await $('export').onclick();
     return $('message').textContent;
    });
    assert.match(message,/Complete private v4 backup exported/);
    const download=await downloadPromise;
    assert.ok(download,'lossless v4 must create a real owner-bound JSON download');
    assert.match(download.suggestedFilename(),/owner-backup-v4\.json/);
    const backup=JSON.parse(await readFile(await download.path(),'utf8'));
    assert.equal(backup.version,4);
    assert.equal(backup.ownerId,owner);
    assert.deepEqual(backup.items.map(x=>x.originalPhoto.image),[originals[0].image]);
    assert.deepEqual(backup.state.draft.batch.map(x=>x.originalPhoto.image),
     [originals[1].image]);
    assert.equal(backup.items[0].color,'Blue owner-corrected');
    assert.equal(backup.items[0].futureRecognition.model,'provenance-preserved');
    assert.equal(backup.state['outfit-board'].saved[0].slots.layer3,'missing-coat');
    assert.match(await page.evaluate(()=>$('message').textContent),/1 unfinished photographs/);
    const before=await snap(page);
    // Validation must reject tampered pending owner-original hash, with
    // zero changes to local originals.
    const tampered=structuredClone(backup);
    tampered.state.draft.batch[0].originalPhoto.sha256='f'.repeat(64);
    const tamperedMessage=await chooseFile(page,tampered);
    assert.match(tamperedMessage,/source|SHA|JPEG|identity|M3_V4/i);
    assert.deepEqual(await snap(page),before);
    // An owner-bound backup cannot be imported by another signed owner.
    const foreign=structuredClone(backup);foreign.ownerId=foreignOwner;
    const foreignMsg=await chooseFile(page,foreign);
    assert.match(foreignMsg,/OWNER_BOUND|owner/i);
    assert.deepEqual(await snap(page),before);
    // An exact explicit owner cancellation leaves saved originals and
    // unfinished private draft untouched.
    await page.evaluate(()=>window.confirm=()=>false);
    const cancelled=await chooseFile(page,backup);
    assert.match(cancelled,/canceled/i);
    assert.deepEqual(await snap(page),before);

    // Corrupt local saved metadata and remove draft, then restore from the
    // downloaded v4 backup. Both owner originals must come back, atomically.
    await page.evaluate(async({owner,originals})=>{
     await new Promise((ok,fail)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      tx.objectStore('items').put({id:'owner-saved-shirt',ownerId:owner,
       name:'Temporary edit',category:'Tops',itemType:'T-shirt',
       color:'Wrong changed color',image:originals[2].image});
      tx.objectStore('state').put({id:'draft',batch:[]});
      tx.objectStore('state').put({id:'looks',looks:[]});
      tx.oncomplete=ok;tx.onerror=tx.onabort=()=>fail(tx.error);
     });
     window.confirm=()=>true;
    },{owner,originals});
    const restoredMessage=await chooseFile(page,backup);
    assert.match(restoredMessage,/restored.*v4|v4 backup restored|restored atomically/i);
    const state=await snap(page);
    const byId=Object.fromEntries(state.state.map(row=>[row.id,row]));
    assert.equal(state.items[0].color,'Blue owner-corrected');
    assert.equal(state.items[0].originalPhoto.image,originals[0].image);
    assert.equal(byId.draft.batch[0].originalPhoto.image,originals[1].image);
    assert.equal(byId.draft.batch[0].sourceSHA256,originals[1].sha);
    assert.equal(byId.looks.looks[0].title,'Inspiration');
    assert.equal(byId['outfit-board'].saved[0].slots.layer3,'missing-coat');
    assert.equal(byId['cloud-sync'].dirty,true);
    assert.equal(byId['cloud-sync'].localRevision,7);

    // Inject a native IDB failure AFTER clearing items & staging state.
    // No partially imported outfits, pending photos or lost saved JPEGs.
    const preFailure=await snap(page);
    const reduced=structuredClone(backup);
    reduced.items=[];reduced.state.draft.batch=[];
    await page.evaluate(()=>{
     window.confirm=()=>true;
     const old=IDBObjectStore.prototype.put;
     window.__originalIDBPut=old;
     IDBObjectStore.prototype.put=function(value,...args){
      if(value?.id==='outfit-board')throw Error('SYNTHETIC_V4_WRITE_FAILURE');
      return old.call(this,value,...args);
     };
    });
    const errorNotice=await chooseFile(page,reduced);
    await page.evaluate(()=>IDBObjectStore.prototype.put=window.__originalIDBPut);
    assert.match(errorNotice,/SYNTHETIC_V4_WRITE_FAILURE|transaction|rollback/i);
    assert.deepEqual(await snap(page),preFailure);

    // A post-download file read from the previous account cannot reach a
    // new owner after logout, even with the SAME owner ID on re-login.
    const previous=await page.evaluate(async backup=>{
     let unblock;const held=new Promise(r=>unblock=r);
     const text=JSON.stringify(backup),previousOwner=window.closetAuth.user.id;
     const pending=$('import').onchange({target:{files:[{size:text.length,
      text:()=>held}],value:'delayed-v4'}});
     await Promise.resolve();
     captureOperationEpoch++;
     window.closetAuth.user={id:previousOwner};
     unblock(text);await pending;
     return $('message').textContent;
    },backup);
    assert.ok(previous.length>0);
    assert.deepEqual(await snap(page),preFailure);
    const stranger=await browser.newContext({viewport:{width,height:844},
     hasTouch:true,isMobile:true,serviceWorkers:'block'});
    try{
     await setup(stranger,foreignOwner);
     const p=await openPage(stranger);
     const separate=await snap(p);
     assert.equal(separate.items.length,0);
     assert.equal(separate.state.some(x=>x.id==='draft'&&x.batch.length>0),false);
    }finally{await stranger.close();}
    assert.equal(errors.length,0,errors.join('\n'));
    assert.equal(offHost.some(x=>x.method!=='GET'),false);
    results.push({engine,width,fullV4Export:true,
     originalSavedJPEGRetained:true,pendingDraftJPEGIncluded:true,
     browserJSONDownload:true,tamperedDraftRejected:true,
     foreignOwnerRejected:true,ownerCancellationUntouched:true,
     originalOwnerV4AtomicRestore:true,cloudRevisionDirty:true,
     failedMidTransactionRollback:true,
     revokedPreviousOwnerRejected:true,crossOwnerIsolated:true,
     realNativeIndexedDB:true,syntheticOriginals:true,
     realPhysicalPhone:false,hostedCloud:false,
     blockedOffHostRequests:offHost.length});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(results.length,6);
 const result={status:'PASS',kind:'mission3-lossless-v4-owner-acceptance',
  familyAlpha:'HOLD',realChromiumWebKit:true,realDevice:false,
  realHostedCloud:false,independentPhotoAccuracy:false,cases:results};
 const json=JSON.stringify(result,null,2)+'\n';
 await writeFile(resolve(out,'results.json'),json);
 await writeFile(resolve(out,'sha256.txt'),
  createHash('sha256').update(json).digest('hex')+'  results.json\n');
 console.log('PASS: 6 real Chromium/WebKit lossless saved+draft original export / atomic rollback owner acceptance');
}finally{await new Promise(ok=>server.close(ok));}
