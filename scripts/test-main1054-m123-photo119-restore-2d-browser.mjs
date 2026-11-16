// M123 MAIN: source-pinned opt-in acceptance adaptation of P93 draft test-only browser harness.
// Tests actual app review, export/UI restore and original-photo 2D, NEVER synthetic recognition accuracy, 3D fit, or hosted identity.
// Main M123 signed-owner native PHOTO119 reviewed small original ->
// actual v3 export/import -> original-only 2D (large separate-preview refused).
// Uses only public JPEG and synthetic account metadata,
// synthetic owner account; no genuine model, hosted keys or remote writes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const originBytes=await readFile('benchmark/fixtures/commons-0003.jpg');
assert(originBytes[0]===255&&originBytes[1]===216);
const chunks=[originBytes.subarray(0,2)];
for(let n=0;n<56;n++){
 const size=48000;
 chunks.push(Buffer.from([255,239,(size+2)>>8,(size+2)&255]),Buffer.alloc(size,n%197));
}
chunks.push(originBytes.subarray(2));
const full=Buffer.concat(chunks);
const largeOriginalJPEG='data:image/jpeg;base64,'+full.toString('base64');
const largeOriginalSHA=createHash('sha256').update(full).digest('hex');
// PHOTO119 review has a smaller contract than the new M101 legacy importer.
assert(largeOriginalJPEG.length>3_000_000&&largeOriginalJPEG.length<11_200_000);
const originalJPEG='data:image/jpeg;base64,'+originBytes.toString('base64');
const originalSHA=createHash('sha256').update(originBytes).digest('hex');
// M130: a genuine display thumbnail is derived from the same public
// photographed source; its independently computed SHA is only a display
// receipt, NEVER proof of a physical segment or an independently fitted 3D.
const displayBytes=await sharp(originBytes).resize({width:160}).jpeg({quality:70}).toBuffer();
const largeDisplayJPEG='data:image/jpeg;base64,'+displayBytes.toString('base64');
const largeDisplaySHA=createHash('sha256').update(displayBytes).digest('hex');
assert(originalJPEG.length<=3_000_000);
// A second independently sourced PUBLIC JPEG, distinct from the first,
// proves two actual PHOTO119 owner review commits and both outfit slots.
// These fixture labels are synthetic, NOT independent classification truth.
const secondBytes=await readFile('benchmark/fixtures/commons-0002.jpg');
assert(secondBytes[0]===255&&secondBytes[1]===216);
const secondJPEG='data:image/jpeg;base64,'+secondBytes.toString('base64');
const secondSHA=createHash('sha256').update(secondBytes).digest('hex');
assert(secondSHA!==originalSHA&&secondJPEG.length<=3_000_000);
const previewJPEG='data:image/jpeg;base64,'+(await sharp({create:{
 width:160,height:160,channels:3,background:{r:88,g:125,b:189}
}}).jpeg().toBuffer()).toString('base64');
const output=resolve(process.argv[2]||'benchmark/main123-reviewed-owner-v3-restored-2d');
await mkdir(output,{recursive:true});
const root=resolve('.'),pub=resolve('public');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const absolute=p.startsWith('/research/')?resolve(root,'.'+p):
   p.startsWith('/public/')?resolve(pub,'.'+p.slice('/public'.length)):
   resolve(pub,'.'+(p==='/'?'/index.html':p));
  if(p.includes('\\')||
     (!absolute.startsWith(pub+'/')&&!absolute.startsWith(resolve(root,'research')+'/')))
   throw Error('Outside local source');
  const bytes=await readFile(absolute);
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('P93 source unavailable');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[];
try{
 const selectedEngine=process.env.M123_ENGINE;
assert(['chromium','webkit'].includes(selectedEngine),'M123_ENGINE must select native Chromium or WebKit');
for(const [engine,type] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>name===selectedEngine)){
  for(const width of [320,390,430]){
   const owner='a'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,
    args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const outbound=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({
     contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+owner+
      "'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};"+
      "document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
    }));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({
     contentType:'text/javascript',
     body:"window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{window.__p93CloudChanged=(window.__p93CloudChanged||0)+1;}};"
    }));
    await context.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(['blob:','data:'].includes(url.protocol)||url.hostname==='127.0.0.1')
      return route.fallback();
     outbound.push({method:route.request().method(),blocked:true});
     return route.abort();
    });
    await context.addInitScript(()=>{
     // Synthetic local auth epoch matches the actual source-preflight shape.
     // Never impersonates hosted JWT/RLS, only test browser local metadata.
     localStorage.setItem('closet-current-auth-v1',
      JSON.stringify({epoch:'p93-synthetic-owner-epoch-20261115'}));
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
    page.on('pageerror',e=>errors.push({engine,width,kind:String(e.name||'page-error')}));
    await page.goto(local+'/?mission4Preview=research',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    const result=await page.evaluate(async({owner,previewJPEG,originalJPEG,originalSHA,secondJPEG,secondSHA,largeOriginalJPEG,largeOriginalSHA,largeDisplayJPEG,largeDisplaySHA})=>{
     const readRows=()=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['items','state'],'readonly');
      const i=tx.objectStore('items').getAll(),s=tx.objectStore('state').getAll();
      tx.oncomplete=()=>resolve({items:i.result,state:s.result});
      tx.onerror=()=>reject(tx.error);
     });
     const update=({items,states,clear=false})=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      if(clear){tx.objectStore('items').clear();tx.objectStore('state').clear();}
      else{
       for(const row of items||[])tx.objectStore('items').put(row);
       for(const row of states||[])tx.objectStore('state').put(row);
      }
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     });
     const {commitHumanReviewedPhoto119}=await import('./native-reviewed-private-save-167.mjs');
     const review={confirmed:true,recordId:'p93-original',
      originalSHA256:originalSHA,category:'Tops',itemType:'T-shirt',
      color:'Blue',singleGarmentConfirmed:true};
     const lease=()=>window.closetAuth?.user?.id===owner&&
      db?.name==='closet-current-user-'+owner;
     // Negative original+thumbnail proof. A >3M canonical original is
     // importable in M101, but PHOTO119 must refuse to silently save its
     // separate preview as an independently reviewed full original.
     const largeRecord={
      id:'p93-large-review-veto',ownerId:owner,
      category:'Uncategorized',itemType:'Unknown',color:'Unknown',
      singleGarmentVerified:false,
      sourceSHA256:largeOriginalSHA,sourceHashVerified:true,
      image:previewJPEG,
      originalPhoto:{image:largeOriginalJPEG,sha256:largeOriginalSHA,ownerId:owner}
     };
     await update({states:[{id:'draft',batch:[structuredClone(largeRecord)]}]});
     const largeReview={...review,recordId:largeRecord.id,
      originalSHA256:largeOriginalSHA};
     const beforeLarge=await readRows();
     const largeDenied=await commitHumanReviewedPhoto119({
      db,ownerId:owner,currentOwner:()=>window.closetAuth?.user?.id,
      record:largeRecord,review:largeReview,cryptoProvider:crypto,assertLease:lease
     });
     if(largeDenied.saved!==false||largeDenied.needsReview!==true||
        largeDenied.sourceKind!=='original-source-unverified'||
        JSON.stringify(await readRows())!==JSON.stringify(beforeLarge))
      throw Error('PHOTO119 incorrectly accepted large source/thumbnail or changed owner DB');
     // M130: unlike the negative unrelated preview, this owner explicitly
     // confirms a separately SHA-verified display-only preview of the full
     // >3M encoded camera JPEG. Keep it distinct from cutout/3D geometry.
     const largeConfirmedRecord={...largeRecord,image:largeDisplayJPEG,
      displayPreviewReceipt:{schema:'photo119-owner-display-preview/v1',
       ownerId:owner,originalSHA256:largeOriginalSHA,
       previewSHA256:largeDisplaySHA,displayOnly:true}};
     await update({states:[{id:'draft',batch:[structuredClone(largeConfirmedRecord)]}]});
     const largeConfirmed=await commitHumanReviewedPhoto119({
      db,ownerId:owner,currentOwner:()=>window.closetAuth?.user?.id,
      record:largeConfirmedRecord,
      review:{...largeReview,previewConfirmed:true,previewSHA256:largeDisplaySHA},
      cryptoProvider:crypto,assertLease:lease
     });
     if(largeConfirmed.saved!==true||
        largeConfirmed.sourceKind!=='human-reviewed-original-single-display-preview'||
        largeConfirmed.releaseAuthorized!==false)
      throw Error('M130 distinct display preview with owner SHA confirmation refused');
     const confirmedLargeRow=(await readRows()).items.find(x=>x.id===largeRecord.id);
     if(confirmedLargeRow?.originalPhoto?.image!==largeOriginalJPEG||
        confirmedLargeRow?.image!==largeDisplayJPEG||
        confirmedLargeRow?.sourceSHA256!==largeOriginalSHA||
        confirmedLargeRow?.displayPreviewReceipt?.previewSHA256!==largeDisplaySHA||
        confirmedLargeRow?.singleGarmentVerified!==true)
      throw Error('M130 original or display SHA lost after atomic owner review');
     const {exportDurableOwnerBackupM3:exportLarge}=await import('./native-default-verified-backup-export-m3.mjs');
     const largeExport=await exportLarge({ownerDB:db,ownerId:owner,
      assertLease:lease,assertIdle:()=>{}});
     if(largeExport.data.items.length!==1||
        largeExport.data.items[0].originalPhoto.image!==largeOriginalJPEG||
        largeExport.data.items[0].image!==largeDisplayJPEG)
      throw Error('M130 v3 backup lost owner-reviewed large original');
     await update({clear:true});
     window.confirm=()=>true;
     await document.getElementById('import').onchange({target:{
      files:[{size:largeExport.json.length,text:async()=>largeExport.json}],
      value:'m130-large-original-backup'}});
     const largeRestored=(await readRows()).items;
     if(largeRestored.length!==1||
        largeRestored[0]?.originalPhoto?.image!==largeOriginalJPEG||
        largeRestored[0]?.image!==largeDisplayJPEG||
        largeRestored[0]?.sourceSHA256!==largeOriginalSHA||
        largeRestored[0]?.displayPreviewReceipt?.previewSHA256!==largeDisplaySHA)
      throw Error('M130 native v3 owner UI restore lost large reviewed source');
     await update({clear:true});
     // Test-only counter scope reset: only the FINAL two-piece import below
     // should count toward the existing exactly-once cloud marker assertion.
     window.__p93CloudChanged=0;
     // Positive control: actual PHOTO119 signed-owner save of one smaller
     // authentic public JPEG. Labels are explicitly SYNTHETIC owner input.
     const record={
      id:'p93-original',ownerId:owner,name:'Owner reviewed original',
      category:'Uncategorized',itemType:'Unknown',color:'Unknown',
      singleGarmentVerified:false,
      image:originalJPEG,sourceSHA256:originalSHA,sourceHashVerified:true,
      originalPhoto:{image:originalJPEG,sha256:originalSHA,ownerId:owner}
     };
     await update({states:[{id:'draft',batch:[structuredClone(record)]}]});
     const saved=await commitHumanReviewedPhoto119({
      db,ownerId:owner,currentOwner:()=>window.closetAuth?.user?.id,
      record,review,cryptoProvider:crypto,assertLease:lease
     });
     if(saved.saved!==true||saved.releaseAuthorized!==false)
      throw Error('PHOTO119 synthetic small original review not saved: '+saved.sourceKind);
     const row=(await readRows()).items.find(x=>x.id==='p93-original');
     if(row?.ownerReviewed!==true||row?.sourceSHA256!==originalSHA||
        row?.originalPhoto?.image!==originalJPEG)
      throw Error('PHOTO119 saved record lacks canonical owner review');
     // M127: independent second real PHOTO119 signed-owner review, not a
     // direct seeded item. The original is preserved and both sources differ.
     const bottom={id:'m127-bottom',ownerId:owner,
      name:'Synthetic confirmed bottom',category:'Uncategorized',
      itemType:'Unknown',color:'Unknown',singleGarmentVerified:false,
      image:secondJPEG,sourceSHA256:secondSHA,sourceHashVerified:true,
      originalPhoto:{image:secondJPEG,sha256:secondSHA,ownerId:owner}};
     await update({states:[{id:'draft',batch:[structuredClone(bottom)]}]});
     const bottomReview={confirmed:true,recordId:bottom.id,
      originalSHA256:secondSHA,category:'Bottoms',itemType:'Jeans',
      color:'Gray',singleGarmentConfirmed:true};
     const secondSaved=await commitHumanReviewedPhoto119({
      db,ownerId:owner,currentOwner:()=>window.closetAuth?.user?.id,
      record:bottom,review:bottomReview,cryptoProvider:crypto,assertLease:lease
     });
     if(secondSaved.saved!==true||secondSaved.releaseAuthorized!==false)
      throw Error('Second PHOTO119 independently sourced synthetic review refused');
     const secondRow=(await readRows()).items.find(x=>x.id===bottom.id);
     if(secondRow?.originalPhoto?.image!==secondJPEG||
        secondRow.sourceSHA256!==secondSHA||secondRow.ownerReviewed!==true)
      throw Error('Second PHOTO119 original review lost durable source');
     const outfit={id:'outfit-board',current:{name:'Owner selected',
      occasion:'Casual',slots:{top:'p93-original',bottom:'m127-bottom'}},
      saved:[{name:'Saved owned outfit',occasion:'Casual',
      slots:{top:'p93-original',bottom:'m127-bottom'}}]};
     await update({states:[outfit,
      {id:'cloud-sync',localRevision:3,baseVersion:1,baseDocument:null,dirty:false}]});
     items=(await readAllFrom(db)).map(normalizeClothing);
     await reloadCloudLooks();await reloadCloudBoard();render();
     // This is the exact native exporter imported by the real app's button.
     const {exportDurableOwnerBackupM3}=await import('./native-default-verified-backup-export-m3.mjs');
     const exported=await exportDurableOwnerBackupM3({ownerDB:db,ownerId:owner,
      assertLease:()=>{if(window.closetAuth?.user?.id!==owner)throw Error('owner revoked');},
      assertIdle:()=>{}});
     const exportedById=new Map(exported.data?.items?.map(x=>[x.id,x]));
     if(exportedById.size!==2||
        exportedById.get('p93-original')?.originalPhoto?.image!==originalJPEG||
        exportedById.get('m127-bottom')?.originalPhoto?.image!==secondJPEG||
        exported.data?.outfitBoard?.current?.slots?.top!=='p93-original'||
        exported.data?.outfitBoard?.current?.slots?.bottom!=='m127-bottom')
      throw Error('Lossless original export invariant failed');
     // Independent large-camera SHA/thumbnail refusal and v3 recovery tests
     // remain in the other, unchanged P93 M101 browser harness.
     // Now emulate a NEW, empty owner's device while retaining the same
     // cryptographically signed synthetic owner and app.
     await update({clear:true});
     const before=await readRows();
     window.confirm=()=>true;
     const payload=exported.json;
     await document.getElementById('import').onchange({target:{
      files:[{size:payload.length,text:async()=>payload}],value:'p93-selected-backup'}});
     const after=await readRows();
     const status=document.getElementById('message')?.textContent||'';
     const state=Object.fromEntries(after.state.map(x=>[x.id,x]));
     return {largePhoto119NotSilentlySaved:largeDenied.saved===false,
      largeExplicitPreviewPhoto119Saved:largeConfirmed.saved===true,
      largeOriginalV3UIRecovered:largeRestored.length===1&&
       largeRestored[0]?.originalPhoto?.image===largeOriginalJPEG,
      reviewedSmallPhoto119Saved:row.ownerReviewed===true,
      exportedSourceExact:exportedById.get('p93-original')?.originalPhoto.image===originalJPEG&&
       exportedById.get('m127-bottom')?.originalPhoto.image===secondJPEG,
      exportedOriginalHashExact:exportedById.get('p93-original')?.sourceSHA256===originalSHA&&
       exportedById.get('m127-bottom')?.sourceSHA256===secondSHA,
      exportedV3:exported.data.version===3,
      beforeEmpty:before.items.length===0,
      restoredOnlyOwnOriginal:after.items.length===2&&
       after.items.every(x=>x.ownerId===owner)&&
       new Set(after.items.map(x=>x.id)).size===2,
      preservedOriginalBytes:after.items.find(x=>x.id==='p93-original')?.originalPhoto?.image===originalJPEG&&
       after.items.find(x=>x.id==='m127-bottom')?.originalPhoto?.image===secondJPEG,
      preservedSHA:after.items.find(x=>x.id==='p93-original')?.sourceSHA256===originalSHA&&
       after.items.find(x=>x.id==='p93-original')?.originalPhoto?.sha256===originalSHA&&
       after.items.find(x=>x.id==='m127-bottom')?.sourceSHA256===secondSHA&&
       after.items.find(x=>x.id==='m127-bottom')?.originalPhoto?.sha256===secondSHA,
      selectedBoardRecovered:state['outfit-board']?.current?.slots?.top==='p93-original'&&
       state['outfit-board']?.current?.slots?.bottom==='m127-bottom'&&
       state['outfit-board']?.saved?.[0]?.slots?.top==='p93-original'&&
       state['outfit-board']?.saved?.[0]?.slots?.bottom==='m127-bottom',
      cloudDirty:state['cloud-sync']?.dirty===true,
      cloudRevision:state['cloud-sync']?.localRevision,
      actualUIImport:status.includes('imported atomically'),
      cloudMarkerChanged:window.__p93CloudChanged||0};
    },{owner,previewJPEG,originalJPEG,originalSHA,secondJPEG,secondSHA,largeOriginalJPEG,largeOriginalSHA,largeDisplayJPEG,largeDisplaySHA});
    for(const [field,value] of Object.entries(result)){
     if(['cloudRevision','cloudMarkerChanged'].includes(field))continue;
     assert.equal(value,true,engine+' width '+width+' lost reviewed native owner source at '+field);
    }
    assert.equal(result.cloudRevision,1);
    assert.equal(result.cloudMarkerChanged,1);
    // Cross-mission native seam: owner-reviewed canonical small original saved,
    // exported and imported, then actual signed Outfit Builder 2D preview.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    await page.waitForFunction(()=>window.closetAuth?.user?.id&&
     currentBoard?.slots?.top==='p93-original'&&currentBoard.slots.bottom==='m127-bottom',null,{timeout:30000});
    await page.evaluate(()=>switchView('builder'));
    await page.locator('#mission4Preview1054Section button').click();
    await page.waitForFunction(()=>{
      const status=document.getElementById('mission4Preview1054Status')?.textContent||'';
      return status.includes('2D only')||status.includes('Preview refused');
    },null,{timeout:20000});
    const previewStatus=await page.locator('#mission4Preview1054Status').innerText();
    if(!/original photo\(s\) verified.*2D only/.test(previewStatus)){
     const context=await page.evaluate(async()=>{
      const row=items.find(x=>x?.id==='p93-original');
      const state={
       boardInitialized:typeof boardInitialized==='boolean'&&boardInitialized,
       selected:currentBoard?.slots?.top==='p93-original',
       ownerReviewed:row?.ownerReviewed===true,
       userAdjusted:row?.userAdjusted===true,
       sourcePhotoOriginal:row?.sourcePhotoOriginal===true,
       sourceHashVerified:row?.sourceHashVerified===true,
       singleGarmentVerified:row?.singleGarmentVerified===true,
       confirmedDetails:!!row?.confirmedDetails,
       confirmedDetailsSource31:!!row?.confirmedDetailsSource31,
       authUser:!!window.closetAuth?.user?.id,
       dbPresent:!!db?.name?.startsWith('closet-current-user-'),
       displayedCount:document.querySelectorAll('#mission4Preview1054Photos img').length,
       viewerPhase:typeof mission4Preview1054Viewer==='undefined'?'absent':
        mission4Preview1054Viewer?.status?.phase||'none',
       preflight:'not-run',category:'not-run',
       sessionEpochPresent:false,signedRead:'not-run',
       errorName:'not-run',errorKind:'not-run'
      };
      try{
       const session=currentPhotoOwnerSession167();
       state.sessionEpochPresent=typeof session?.epoch==='string'&&
        session.epoch.length>=8;
       const rows=await signedOwnerSavedRows167();
       state.signedRead=Array.isArray(rows)?'PASS':'non-array';
      }catch(e){
       state.signedRead='REFUSED';
       const msg=String(e?.message||'');
       state.errorKind=[
        'Private owner session is unavailable',
        'Owner changed while reading private saved garments',
        'currentPhotoOwnerSession167 is not defined',
        'signedOwnerSavedRows167 is not defined'
       ].find(x=>msg.includes(x))||'other';
      }
      try{
       const {preflightOwnedOutfit1054}=await import(
        '/research/main-thread-integration-1054/source-to-outfit.mjs');
       await preflightOwnedOutfit1054({
        getSession:currentPhotoOwnerSession167,
        readOwnerItems:signedOwnerSavedRows167,
        cleanBoard:cleanOutfitBoard,board:structuredClone(currentBoard)
       });
       state.preflight='PASS';
      }catch(e){
       state.preflight='REFUSED';
       state.errorName=['Error','TypeError','ReferenceError','AbortError']
        .includes(e?.name)?e.name:'other';
       const reason=String(e?.message||'');
       // P93 safety: log only an allowlisted source module and static line
       // number, NEVER the stack, message, account, private JPEG or tokens.
       const frame=String(e?.stack||'').split('\n').find(line=>
        /source-to-outfit\.mjs|native-owner-wardrobe-index-167\.mjs|native-canonical-photo-source-167\.mjs|outfit-board-engine\.js/.test(line))||'';
       const site=frame.match(/(source-to-outfit|native-owner-wardrobe-index-167|native-canonical-photo-source-167|outfit-board-engine)\.(?:mjs|js):(\d+):\d+/);
       state.errorSite=site?site[1]+':'+site[2]:'unknown';
       const typeCodes=['Cannot read properties of undefined','Cannot read properties of null',
        'not a function','not iterable','Invalid value','Cannot convert undefined'];
       state.errorType=typeCodes.find(code=>reason.includes(code))||'other';
       const known=[
        'Private owner session is unavailable',
        'Owner changed while reading private saved garments',
        'currentPhotoOwnerSession167 is not defined',
        'signedOwnerSavedRows167 is not defined',
        'original JPEG has no usable source envelope',
        'new ambiguous or duplicate source appeared during verification'
       ];
       state.errorKind=known.find(x=>reason.includes(x))||'other';
       const reasons=[
        'signed owner session and private database required',
        'owner session changed',
        'selected garment lacks confirmed original and review evidence',
        'missing or incompatible owned garment',
        'original JPEG SHA does not match saved source',
        'saved garment changed during source verification',
        'outfit board changed during source verification',
        'native outfit normalization would silently lose selected garment',
        'selected garment has duplicate or ambiguous source identity',
        'invalid or repeated outfit slot identity'
       ];
       // MAIN1054 issue() emits only source-code static reason tokens.
       // Reveal the exact bounded, printable, fixed-prefix reason for debugging
       // but never arbitrary error text, account IDs or JPEG bytes.
       state.category=reasons.find(x=>reason.includes(x))||
        (/^MAIN1054 [A-Za-z0-9 .-]{1,100}$/.test(reason)?
         reason.slice('MAIN1054 '.length):'other');
      }
      return state;
     });
     console.error('M123_NATIVE_RESTORED_2D_REFUSAL',JSON.stringify({
      engine,width,diagnostic:context,releaseAuthorized:false,familyAlpha:'HOLD'}));
    }
    assert.match(previewStatus,/original photo\(s\) verified.*2D only/,
     'Restored original source failed signed-owner source-to-2D preflight: '+previewStatus);
    const imgs=page.locator('#mission4Preview1054Photos img');
    assert.equal(await imgs.count(),2,'Expected two source-verified 2D owner originals');
    const displayed=await imgs.evaluateAll(async imgs=>Promise.all(imgs.map(async im=>{
      await im.decode();return {src:im.getAttribute('src'),w:im.naturalWidth,h:im.naturalHeight};
    })));
    assert.deepEqual(new Set(displayed.map(x=>x.src)),new Set([originalJPEG,secondJPEG]),
     'Native Outfit Builder substituted a preview for restored source JPEGs');
    assert(displayed.every(x=>x.w>0&&x.h>0),'Restored original JPEG failed to decode');
    assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
     'Unfitted restored photo must not authorize 3D');
    assert.deepEqual(errors,[],'Browser application errors');
    assert.equal(outbound.some(x=>x.method!=='GET'),false,
     'Unexpected non-local cloud or account write');
    cases.push({engine,width,actualNativeApp:true,
     originalEncodedLength:originalJPEG.length,canonicalOriginalSHAValid:true,
     actualUIV3RestoreVerified:true,losslessOriginal:true,
     ownerOriginalOutfitRecovered:true,
     restoredPhoto2DVerified:true,restoredOriginalCount:2,independentlyReviewedSyntheticSources:2,
     sourceTo3DAllowed:false,
     realHostedJWT:false,modelAccuracyMeasured:false,physicalDevice:false});
   }finally{
    await context.close();await browser.close();
   }
  }
 }
 assert.equal(cases.length,3);
 const report={schema:'M127-main-two-reviewed-owner-v3-restored-originals-2d/v1',
  familyAlpha:'HOLD',sourcePhotoPublicSyntheticMetadata:true,
  exactSourceSHAVerified:true,releaseAuthorized:false,
  realBrowserEngines:[selectedEngine],cases,errors};
 await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log('M127 MAIN TWO PHOTO119 reviewed distinct-source originals -> owner v3 UI restore -> signed outfit 2D 3/3 PASS; mismatched large preview vetoed; HOLD');
}finally{server.close();}
