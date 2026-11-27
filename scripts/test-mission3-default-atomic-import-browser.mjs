// Mission 3 default native Chromium/WebKit backup atomic merge and original-collision integration.
// Public app.js + private native IndexedDB + gated source module.
// Synthetic owners/photos; blocks every external host request.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const output=resolve(process.argv[2]||'benchmark/mission3-default-atomic-import-browser');
await mkdir(output,{recursive:true});
const jpeg='data:image/jpeg;base64,'+(await sharp({create:{
 width:320,height:240,channels:3,background:{r:101,g:150,b:188}
}}).jpeg().toBuffer()).toString('base64');
const differentJPEG='data:image/jpeg;base64,'+(await sharp({create:{
 width:320,height:240,channels:3,background:{r:225,g:89,b:58}
}}).jpeg().toBuffer()).toString('base64');
const thirdJPEG='data:image/jpeg;base64,'+(await sharp({create:{
 width:320,height:240,channels:3,background:{r:23,g:218,b:97}
}}).jpeg().toBuffer()).toString('base64');
const jpegSHA=createHash('sha256').update(Buffer.from(jpeg.slice(jpeg.indexOf(',')+1),'base64')).digest('hex');
// Real sharp-generated JPEG with intact image pixels and benign APP15 metadata.
const baseJPEG=Buffer.from(jpeg.slice(jpeg.indexOf(',')+1),'base64');
const largeParts=[];
for(let i=0;i<56;i++){
 const size=48000;
 largeParts.push(Buffer.from([255,239,(size+2)>>8,(size+2)&255]),Buffer.alloc(size,i&255));
}
const largeBytes=Buffer.concat([baseJPEG.subarray(0,2),...largeParts,baseJPEG.subarray(2)]);
const largeOriginal='data:image/jpeg;base64,'+largeBytes.toString('base64');
const largeSHA=createHash('sha256').update(largeBytes).digest('hex');
assert(largeOriginal.length>3_000_000&&largeOriginal.length<=11_200_000);
const largePreview='data:image/jpeg;base64,'+(await sharp({create:{
 width:120,height:90,channels:3,background:{r:192,g:84,b:131}
}}).jpeg().toBuffer()).toString('base64');
const root=resolve('.'),pub=resolve(process.env.CLOSET_IMPORT_BUILD_DIR||'public'),
 types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=p.startsWith('/research/')?resolve(root,'.'+p):
   resolve(pub,'.'+(p==='/'?'/index.html':p));
  if(p.includes('\\')||(!full.startsWith(pub+'/')&&!full.startsWith(resolve(root,'research')+'/')))
   throw Error('Outside test root');
  let data=await readFile(full);
  // The harness intercepts only these two scripts. Keep built-app SRI for
  // the actual importer and all other application scripts.
  if(full===resolve(pub,'index.html'))
   data=data.toString('utf8').replace(
    /(<script src="(?:auth|cloud-backup)\.js[^"]*") integrity="[^"]*"/g,'$1');
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const ownerA='a'+width+'0000-0000-4000-8000-000000000000';
   const ownerB='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   const external=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'"+ownerA+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{window.__cloudLocalChanged=(window.__cloudLocalChanged||0)+1;}};"}));
    await context.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(['blob:','data:'].includes(url.protocol)||url.hostname==='127.0.0.1')return route.fallback();
     external.push({method:route.request().method(),path:url.pathname,blocked:true});
     return route.abort();
    });
    await context.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
       id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}
      }});},0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push({engine,width,error:String(e)}));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    const result=await page.evaluate(async({ownerA,ownerB,jpeg,differentJPEG,thirdJPEG,jpegSHA,largeOriginal,largeSHA,largePreview})=>{
     const idbRead=()=>new Promise((done,reject)=>{
      const tx=db.transaction(['items','state'],'readonly');
      const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
      tx.oncomplete=()=>done({items:a.result,state:b.result});
      tx.onerror=()=>reject(tx.error);
     });
     const idbWrite=rows=>new Promise((done,reject)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      for(const item of rows.items)tx.objectStore('items').put(item);
      for(const state of rows.state)tx.objectStore('state').put(state);
      tx.oncomplete=done;tx.onerror=()=>reject(tx.error);
     });
     const old=normalizeClothing({id:'kept-original',ownerId:ownerA,
      name:'Owner A original',category:'Tops',itemType:'T-shirt',color:'Blue',image:jpeg});
     await idbWrite({items:[old],state:[
      {id:'looks',looks:[{id:'old-look',title:'Old look',pieces:[]}]},
      {id:'outfit-board',current:{name:'Existing',slots:{top:'kept-original'}},
       saved:[{name:'Existing',slots:{top:'kept-original'}}]},
      {id:'cloud-sync',baseVersion:3,baseDocument:null,localRevision:5,dirty:false}
     ]});
     items=(await readAllFrom(db)).map(normalizeClothing);
     await reloadCloudLooks();await reloadCloudBoard();render();
     const first=normalizeClothing({id:'new-top',ownerId:ownerA,
      name:'New owner A garment',category:'Tops',itemType:'T-shirt',color:'Green',image:differentJPEG});
     const makeBackup=(opts={})=>({format:'closet-current',version:3,items:[first],
      looks:[{id:'new-look',title:'New inspiration',pieces:[]}],
      outfitBoard:{current:{name:'Imported',slots:{top:opts.badRef?'unknown-photo':'new-top'}},
       saved:[{name:'Imported outfit',slots:{top:'new-top'}}]}});
     window.confirm=()=>true;
     const select=async value=>{
      const json=JSON.stringify(value);
      await document.getElementById('import').onchange({target:{
       files:[{size:json.length,text:async()=>json}],value:'selected'}});
     };
     await select(makeBackup());
     const committed=await idbRead();
     const after=Object.fromEntries(committed.state.map(x=>[x.id,x]));
     const outcome={
      mergedItems:committed.items.map(x=>({id:x.id,ownerId:x.ownerId})),
      mergedLooks:after.looks?.looks?.map(x=>x.id)||[],
      boardTop:after['outfit-board']?.current?.slots?.top,
      savedBoardTop:after['outfit-board']?.saved?.[0]?.slots?.top,
      cloudRevision:after['cloud-sync']?.localRevision,
      cloudDirty:after['cloud-sync']?.dirty,
      originalExists:committed.items.some(x=>x.id==='kept-original'&&x.image===jpeg),
      newExists:committed.items.some(x=>x.id==='new-top'&&x.image===differentJPEG),
      notice:document.getElementById('message').textContent,
      screenCount:document.getElementById('closetCount').textContent,
      cloudChanged:window.__cloudLocalChanged||0
     };
     await select(makeBackup());
     const repeated=await idbRead();
     const repeatPreserved=JSON.stringify(repeated.items)===JSON.stringify(committed.items)&&
      JSON.stringify(repeated.state.filter(row=>row.id!=='cloud-sync'))===
       JSON.stringify(committed.state.filter(row=>row.id!=='cloud-sync'));
     // M98 P93 native camera-original contract: preserve SHA+full JPEG, not just thumbnail.
     let largeAccepted=true,largeTamperedNoWrite=true,largePreviewTooBigDenied=true,
      largeWithoutReceiptDenied=true,largeConflictingReceiptsDenied=true;
     if(largeOriginal){
      const raw={format:'closet-current',version:3,items:[{
       ...first,id:'large-camera-original',image:largePreview,
       sourceSHA256:largeSHA,sourceHashVerified:true,
       originalPhoto:{image:largeOriginal,sha256:largeSHA,ownerId:ownerA}
      }]};
      await select(raw);
      const afterLarge=await idbRead();
      const entry=afterLarge.items.find(x=>x.id==='large-camera-original');
      largeAccepted=!!entry&&entry.ownerId===ownerA&&entry.image===largePreview&&
       entry.originalPhoto?.image===largeOriginal&&entry.originalPhoto?.sha256===largeSHA&&
       entry.sourceSHA256===largeSHA;
      const positiveSnapshot=JSON.stringify(afterLarge);
      const missingReceipt=structuredClone(raw);
      missingReceipt.items[0].id='large-no-receipt';
      delete missingReceipt.items[0].sourceSHA256;
      delete missingReceipt.items[0].originalPhoto.sha256;
      missingReceipt.items[0].sourceHashVerified=false;
      await select(missingReceipt);
      largeWithoutReceiptDenied=JSON.stringify(await idbRead())===positiveSnapshot&&
       document.getElementById('message').textContent.includes('original photo without a verification checksum')&&
       document.getElementById('message').textContent.includes('Nothing was imported')&&
       document.getElementById('message').textContent.includes('Export a fresh backup');
      const conflictingReceipts=structuredClone(raw);
      conflictingReceipts.items[0].id='large-two-source-hashes';
      conflictingReceipts.items[0].sourceSHA256='a'.repeat(64);
      await select(conflictingReceipts);
      largeConflictingReceiptsDenied=JSON.stringify(await idbRead())===positiveSnapshot&&
       document.getElementById('message').textContent.includes('conflicting verification checksums for one original photo')&&
       document.getElementById('message').textContent.includes('Nothing was imported')&&
       document.getElementById('message').textContent.includes('Re-export from the original signed-in closet');
      const tampered=structuredClone(raw);
      tampered.items[0].originalPhoto.sha256='a'.repeat(64);
      await select(tampered);
      largeTamperedNoWrite=JSON.stringify(await idbRead())===positiveSnapshot;
      const giantPreview=structuredClone(raw);
      giantPreview.items[0].id='giant-display-preview';
      giantPreview.items[0].image=largeOriginal;
      await select(giantPreview);
      largePreviewTooBigDenied=JSON.stringify(await idbRead())===positiveSnapshot;
     }
     const fingerprint=JSON.stringify(await idbRead());
     // Default legacy v1-v3 importer must also block a same-byte JPEG alias
     // when NEITHER the stored nor incoming original is source-verified.
     const unverifiedAlias=makeBackup();
     unverifiedAlias.items[0]={...first,id:'unverified-original-alias',image:jpeg};
     await select(unverifiedAlias);
     const unverifiedAliasUnchanged=JSON.stringify(await idbRead())===fingerprint;
     const unverifiedAliasMessage=document.getElementById('message').textContent;
     const unverifiedAliasExplained=unverifiedAliasMessage.includes('original photo already linked')&&
      unverifiedAliasMessage.includes('Nothing was imported');
     // M91 actual signed-owner default import: same JPEG, new ID, no write.
     const duplicateOriginal=makeBackup();
     duplicateOriginal.items[0]={...first,id:'same-original-new-id',
      sourceHashVerified:true,sourceSHA256:jpegSHA,
      originalPhoto:{image:jpeg,sha256:jpegSHA}};
     await select(duplicateOriginal);
     const originalAliasUnchanged=JSON.stringify(await idbRead())===fingerprint;
     const originalAliasNotice=document.getElementById('message').textContent;
     const originalAliasExplained=originalAliasNotice.includes('original photo already linked')&&
      originalAliasNotice.includes('Nothing was imported')&&
      originalAliasNotice.includes('Open My Closet');
     // A collided ID with a DIFFERENT full original JPEG must never overwrite
     // the older physical garment, regardless of bulk owner confirmation.
     const collision=makeBackup();
     collision.items[0]={...collision.items[0],id:'kept-original',image:differentJPEG};
     await select(collision);
     const collidedUnchanged=JSON.stringify(await idbRead())===fingerprint;
     const duplicateIds=makeBackup();
     duplicateIds.items.push({...duplicateIds.items[0]});
     await select(duplicateIds);
     const duplicateIdsUnchanged=JSON.stringify(await idbRead())===fingerprint;
     // Invalid foreign-account photo metadata must fail BEFORE writing.
     const foreign=makeBackup();
     foreign.items[0]={...foreign.items[0],ownerId:ownerB};
     await select(foreign);
     const foreignUnchanged=JSON.stringify(await idbRead())===fingerprint;
     // Refuse importing while an owner's canonical source only exists in the
     // live retry buffer after a failed device write.
     failedDraftCaptures.add('unsaved-original-in-review');
     await select(makeBackup());
     const unsavedBlocked=JSON.stringify(await idbRead())===fingerprint;
     failedDraftCaptures.clear();
     // Force a staged outfit-store exception after clothing and looks put()
     // have been requested. Native IDB abort must roll ALL of them back.
     const rollback=makeBackup();
     rollback.items[0]={...rollback.items[0],id:'rollback-top',image:thirdJPEG};
     rollback.outfitBoard.current.slots.top='rollback-top';
     rollback.outfitBoard.saved[0].slots.top='rollback-top';
     const oldPut=IDBObjectStore.prototype.put;
     IDBObjectStore.prototype.put=function(value,...rest){
      if(value?.id==='outfit-board')throw Error('SYNTHETIC_ATOMIC_OUTFIT_WRITE_FAILURE');
      return oldPut.call(this,value,...rest);
     };
     try{await select(rollback);}
     finally{IDBObjectStore.prototype.put=oldPut;}
     const stagedRollbackUnchanged=JSON.stringify(await idbRead())===fingerprint;

     // Abort after the last staged store write succeeds but before completion.
     let interrupted=false;
     IDBObjectStore.prototype.put=function(value,...rest){
      const request=oldPut.call(this,value,...rest);
      if(value?.id==='cloud-sync'&&value.localRevision>6)
       request.addEventListener('success',()=>{
        interrupted=true;
        this.transaction.abort();
       },{once:true});
      return request;
     };
     try{await select(rollback);}
     finally{IDBObjectStore.prototype.put=oldPut;}
     const interruptedUnchanged=interrupted&&JSON.stringify(await idbRead())===fingerprint;
     await document.getElementById('import').onchange({target:{
      files:[{size:1,text:async()=>'{'}],value:'selected'}});
     const malformedUnchanged=JSON.stringify(await idbRead())===fingerprint;
     await select(makeBackup({badRef:true}));
     const badRefUnchanged=JSON.stringify(await idbRead())===fingerprint;
     window.confirm=()=>false;
     await select(makeBackup());
     const cancelledUnchanged=JSON.stringify(await idbRead())===fingerprint;
     window.confirm=()=>true;
     const oldFile={size:5000,text:()=>new Promise(resolve=>{
      window.__resumeOldFile=()=>resolve(JSON.stringify(makeBackup()));
     })};
     const oldPending=document.getElementById('import').onchange({target:{
      files:[oldFile],value:'selected'}});
     for(let i=0;i<6;i++)await Promise.resolve();
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:ownerB};
     db=await openDB();
     const b=normalizeClothing({id:'only-B',ownerId:ownerB,name:'Owner B jacket',
      category:'Outerwear',itemType:'Jacket',image:jpeg,color:'Red'});
     await idbWrite({items:[b],state:[]});
     items=[b];batch=[];render();
     window.__resumeOldFile();
     await oldPending;
     const second=await idbRead();
     return {...outcome,largeAccepted,largeTamperedNoWrite,largePreviewTooBigDenied,
      largeWithoutReceiptDenied,largeConflictingReceiptsDenied,
      unverifiedAliasUnchanged,unverifiedAliasExplained,
      originalAliasUnchanged,originalAliasExplained,collidedUnchanged,duplicateIdsUnchanged,
      foreignUnchanged,unsavedBlocked,stagedRollbackUnchanged,
      repeatPreserved,interruptedUnchanged,malformedUnchanged,
      badRefUnchanged,cancelledUnchanged,
      afterAccountSwitch:second.items.map(x=>({id:x.id,ownerId:x.ownerId})),
      currentOwner:window.closetAuth.user.id,currentScreenCount:document.getElementById('closetCount').textContent};
    },{ownerA,ownerB,jpeg,differentJPEG,thirdJPEG,jpegSHA,
     largeOriginal:width===320?largeOriginal:null,largeSHA,largePreview});
    assert.deepEqual(result.mergedItems,[{id:'kept-original',ownerId:ownerA},{id:'new-top',ownerId:ownerA}]);
    assert.deepEqual(result.mergedLooks,['old-look','new-look']);
    assert.equal(result.boardTop,'new-top');
    assert.equal(result.savedBoardTop,'new-top');
    assert.equal(result.cloudRevision,6);assert.equal(result.cloudDirty,true);
    assert.equal(result.originalExists,true);assert.equal(result.newExists,true);
    assert.equal(result.cloudChanged,1);
    assert.match(result.notice,/imported atomically/i);
    assert.equal(result.screenCount,'2');
    if(width===320){
     assert.equal(result.largeAccepted,true,
      'M98 real browser failed to restore SHA-verified >3M original');
     assert.equal(result.largeWithoutReceiptDenied,true,
      'M99 missing large original SHA did not fail closed with its exact reason');
     assert.equal(result.largeConflictingReceiptsDenied,true,
      'M99 inconsistent SHA claims did not fail closed with exact reason');
     assert.equal(result.largeTamperedNoWrite,true);
     assert.equal(result.largePreviewTooBigDenied,true);
    }
    assert.equal(result.unverifiedAliasUnchanged,true);
    assert.equal(result.unverifiedAliasExplained,true);
    assert.equal(result.originalAliasUnchanged,true);
    assert.equal(result.originalAliasExplained,true);
    assert.equal(result.collidedUnchanged,true);
    assert.equal(result.duplicateIdsUnchanged,true);
    assert.equal(result.foreignUnchanged,true);
    assert.equal(result.unsavedBlocked,true);
    assert.equal(result.stagedRollbackUnchanged,true);
    assert.equal(result.repeatPreserved,true,'Repeated import added or changed wardrobe records');
    assert.equal(result.interruptedUnchanged,true,'Native interruption left a partial import');
    assert.equal(result.malformedUnchanged,true,'Malformed JSON changed the wardrobe');
    assert.equal(result.badRefUnchanged,true);
    assert.equal(result.cancelledUnchanged,true);
    assert.deepEqual(result.afterAccountSwitch,[{id:'only-B',ownerId:ownerB}]);
    assert.equal(result.currentScreenCount,'1');
    assert.equal(result.currentOwner,ownerB);
    assert.equal(external.some(x=>x.method!=='GET'),false,'External write attempted');
    assert.equal(external.every(x=>x.blocked),true);
    cases.push({engine,width,defaultV3NativeAtomic:true,
     largeCameraOriginalVerified:width===320?result.largeAccepted:null,
     largeOriginalRequiresReceipt:width===320?result.largeWithoutReceiptDenied:null,
     largeConflictingReceiptsDenied:width===320?result.largeConflictingReceiptsDenied:null,
     largeOriginalTamperBlocked:width===320?result.largeTamperedNoWrite:null,
     overlongDisplayPreviewBlocked:width===320?result.largePreviewTooBigDenied:null,
     originalIdCollisionBlocked:true,unverifiedLegacyJPEGAliasBlocked:true,
     originalAliasSourceBlocked:true,
     ownerFacingDuplicateRecoveryVerified:true,foreignOwnerBlocked:true,
     duplicateIdsBlocked:true,unsavedCaptureBlocked:true,
     syntheticStageRollback:true,interruptedTransactionRolledBack:true,
     malformedJSONBlocked:true,repeatPreserved:true,mergePreservesItems:true,
     looksOutfitsOneCommit:true,cloudRevisionAtomic:true,badRefRollback:true,
     cancellationPreserves:true,oldOwnerReject:true,nativeIndexedDB:true,
     syntheticOwners:true,hostedSupabase:false,physicalPhone:false});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);assert.deepEqual(errors,[]);
 const receipt={kind:'mission3-default-atomic-import-browser',
  familyAlpha:'HOLD',realChromiumWebKit:true,nativeIndexedDB:true,
  hostedCloud:false,physicalDevices:false,cases,errors};
 const data=JSON.stringify(receipt,null,2)+'\n';
 await writeFile(resolve(output,'results.json'),data);
 await writeFile(resolve(output,'sha256.txt'),
  createHash('sha256').update(data).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit native private multi-store atomic import and account switch cases');
}finally{server.close();}
