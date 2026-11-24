/** Normal outfit UI and concurrent owner-private IndexedDB with synthetic auth. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const root=resolve(process.env.APP_SOURCE_ROOT||'.'),out=process.env.CONFLICT_OUT||'benchmark/outfit-draft-conflicts';
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/public\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');
  const file=resolve(root,'.'+path),bytes=await readFile(file);
  if(!file.startsWith(root+'/public/'))throw Error('outside public app');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+'/public/index.html'; // P167 no research URL flags
const jpg=await sharp({create:{width:24,height:32,channels:3,background:'#426f54'}}).jpeg().toBuffer();
const dataURL='data:image/jpeg;base64,'+jpg.toString('base64');
const sha=()=>createHash('sha256').update(jpg).digest('hex');
const owner='synthetic-style-owner-a';
const fixtures=[
 ['tee','Tops','T-shirt','Blue'],['polo','Tops','Polo','White'],
 ['jeans','Bottoms','Jeans','Blue'],['trousers','Bottoms','Trousers','Black'],['shorts','Bottoms','Shorts','Tan'],
 ['sneakers','Shoes','Sneakers','White'],['loafers','Shoes','Loafers','Brown'],['flats','Shoes','Flats','Black']
].map(([id,category,itemType,color])=>({id,ownerId:owner,name:id==='new-blouse'?'New reviewed blouse':itemType,
 category,itemType,color,colorSource:'user',pattern:'Solid',sleeveLength:'Unknown',seasons:[],image:dataURL,
 sourceSHA256:sha(),sourceHashVerified:true,sourcePhotoOriginal:true,userAdjusted:true,
 confirmedDetails:{category,itemType},localAnalyzed:true,indexingLevel:'specific-type',savedAt:new Date().toISOString()}));
const concurrentPhotos=await Promise.all(['#c64242','#4242c6','#c68442'].map(async(background,index)=>{
 const bytes=await sharp({create:{width:24,height:32,channels:3,background}}).jpeg().toBuffer();
 const hash=createHash('sha256').update(bytes).digest('hex');
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {...fixtures[0],id:'concurrent-'+index,image,sourceSHA256:hash,originalPhoto:{image,sha256:hash}};
}));
const results=[],errors=[];
const axe=(await import('axe-core')).default;
async function audit(page,label){await page.addScriptTag({content:axe.source});const report=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));await writeFile(out+'/'+label+'-axe.json',JSON.stringify(report,null,2));assert.deepEqual(report.violations.map(v=>v.id),[],label+' accessibility');}
async function layout(page){const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,dialog:[...document.querySelectorAll('dialog[open]')].map(d=>({width:d.getBoundingClientRect().width,left:d.getBoundingClientRect().left}))}));assert.ok(size.scroll<=size.width,JSON.stringify(size));assert.ok(size.dialog.every(d=>d.left>=0&&d.width<=size.width),JSON.stringify(size));}

try{
 const engines=process.env.STYLE_FOCUSED_ENGINE==='chromium'?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];
 for(const [engine,type] of engines){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     // Native File/Blob image decoding stays browser-local; these are not
     // external requests and must not be blocked by test-only HTTPS isolation.
     if(url.protocol==='blob:'||url.protocol==='data:')return route.continue();
     if(url.hostname==='127.0.0.1'||url.hostname==='localhost')return route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'){
      const fixture=route.request().postDataJSON();
      const second=fixture?.email==='other@example.invalid'||fixture?.refresh_token==='synthetic-other-refresh';
      return route.fulfill({json:{
       access_token:second?'synthetic-other-access':'synthetic-access',
       refresh_token:second?'synthetic-other-refresh':'synthetic-refresh',
       expires_in:3600,user:{id:second?'synthetic-style-owner-b':owner,email:second?'other@example.invalid':'fixture@example.invalid'}
      }});
     }
     return route.abort();
    });
    await context.addInitScript(()=>{
     // A stable shared expiration keeps fixture refreshes from rotating the
     // serialized credential and locking the other tab between assertions.
     Date.now=()=>1700000000000;
     if(localStorage.getItem('p1603-fixture-initialized'))return;
     localStorage.setItem('p1603-fixture-initialized','true');
     localStorage.setItem('closet-current-auth-v1',JSON.stringify({
      epoch:'synthetic-epoch',access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600
     }));
    });
    await context.addInitScript(()=>{
     class ReviewOnlyWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(data){const reply=value=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,...value}});},0);
       if(data.type==='load')reply({type:'ready'});
       else if(data.type==='classify')reply({type:'result',strong:false,categoryConfirmed:false,choices:[],details:{}});
      }
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(String(error)));
    try{
     await page.goto(host,{waitUntil:'domcontentloaded'});
     await page.evaluate(async()=>{await window.closetAuth.ready;await closetReady;await outfitBoardReady;});
     await page.evaluate(async rows=>{
      await writeAll(rows);items=(await readAll()).map(normalizeClothing);render();
      window.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
     },fixtures);




     await page.evaluate(()=>switchView('builder'));
     await page.locator('#boardSlots .board-slot-top').click();await page.locator('#boardPickerItems .board-pick').first().click();await page.evaluate(()=>writes);
     const other=await context.newPage();
     try{
      await other.goto(host);await other.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
      await page.locator('#boardName').fill('Newer draft from first tab');await page.locator('#boardName').press('Tab');await page.evaluate(()=>writes);
      await other.locator('#boardName').fill('Stale second-tab draft');await other.locator('#boardName').press('Tab');await other.evaluate(()=>writes);
      const storedName=await page.evaluate(()=>new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.current.name);}));
      const baseline=process.env.EXPECT_BASELINE==='1';
      if(baseline){assert.equal(storedName,'Stale second-tab draft');results.push({engine,width,baseline:true,silentOverwrite:true});}
      else{
       assert.equal(storedName,'Newer draft from first tab');assert.equal(await other.locator('#boardName').inputValue(),'Stale second-tab draft');
       await other.getByRole('button',{name:'Load latest draft',exact:true}).waitFor();await other.getByRole('button',{name:'Save my draft instead',exact:true}).waitFor();
       for(const name of ['Load latest draft','Save my draft instead']){const box=await other.getByRole('button',{name,exact:true}).boundingBox();assert.ok(box.width>=180&&box.height>=44,'conflict resolution target must stay readable on phones');}
       await other.evaluate(()=>reloadCloudBoard());assert.equal(await other.locator('#boardName').inputValue(),'Stale second-tab draft','automatic refresh must retain local input');
       assert.equal(await other.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),true);
       await audit(other,engine+'-'+width+'-conflict');await layout(other);await other.screenshot({path:out+'/'+engine+'-'+width+'-conflict.png',fullPage:true});
       // Save a separate outfit while stale: preserve the newer shared draft.
       await other.locator('#saveBoard').click();await other.waitForFunction(()=>savedOutfitBoards.length===1);
       assert.equal(await other.evaluate(()=>new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.current.name);})), 'Newer draft from first tab');
       await other.getByRole('button',{name:'Load latest draft',exact:true}).click();
       await other.waitForFunction(()=>document.getElementById('boardName').value==='Newer draft from first tab');
       assert.equal(await other.evaluate(()=>savedOutfitBoards.length),1);
       // Explicit overwrite is bound to the latest version actually observed.
       await page.locator('#boardName').fill('Third version');await page.locator('#boardName').press('Tab');await page.evaluate(()=>writes);
       await other.locator('#boardName').fill('Local version to keep');await other.locator('#boardName').press('Tab');await other.evaluate(()=>writes);
       await page.locator('#boardName').fill('Fourth version');await page.locator('#boardName').press('Tab');await page.evaluate(()=>writes);
       await other.getByRole('button',{name:'Save my draft instead',exact:true}).click();
       await other.evaluate(()=>writes);
       assert.equal(await other.evaluate(()=>new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.current.name);})), 'Fourth version','stale override cannot erase unseen version');
       await other.getByRole('button',{name:'Save my draft instead',exact:true}).click();
       await other.waitForFunction(()=>/changes saved/.test(document.getElementById('boardSaveStatus').textContent));
       await other.reload();await other.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
       assert.equal(await other.locator('#boardName').inputValue(),'Local version to keep');assert.equal(await other.evaluate(()=>savedOutfitBoards.length),1);
       await audit(other,engine+'-'+width+'-resolved');await other.screenshot({path:out+'/'+engine+'-'+width+'-resolved.png',fullPage:true});
       // A queued local save cannot undo an explicit Load latest choice.
       await page.evaluate(()=>loadLatestBoardDraft());
       await page.locator('#boardName').fill('Remote after resolution');await page.locator('#boardName').press('Tab');await page.evaluate(()=>writes);
       await other.locator('#boardName').fill('Local conflict before pause');await other.locator('#boardName').press('Tab');await other.evaluate(()=>writes);
       await other.evaluate(()=>{window.savedCloud=window.closetCloud;window.conflictWriteCalls=0;window.closetCloud={beforeWrite:async()=>{if(++window.conflictWriteCalls===1)await new Promise(resolve=>window.releaseQueuedConflict=resolve);}};});
       await other.locator('#boardName').fill('Queued draft to discard');await other.locator('#boardName').press('Tab');await other.waitForFunction(()=>Boolean(window.releaseQueuedConflict));
       await other.getByRole('button',{name:'Load latest draft',exact:true}).click();
       await other.evaluate(()=>window.releaseQueuedConflict());
       await other.waitForFunction(()=>document.getElementById('boardName').value==='Remote after resolution');
       await other.evaluate(()=>writes);
       assert.equal(await other.evaluate(()=>new Promise(resolve=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result.current.name);})), 'Remote after resolution');
       assert.equal(await other.evaluate(()=>savedOutfitBoards.length),1);
       await other.evaluate(()=>window.closetCloud=window.savedCloud);

       // Hold the stale tab's real autosave before its IndexedDB transaction.
       // Delete the selected garment in the other tab before releasing it.
       await other.locator('#clearBoard').click();
       await other.evaluate(()=>writes);
       const beforeDeletion=await other.locator('#boardName').inputValue();
       const deletedId=await other.evaluate(()=>{
        const used=new Set(savedOutfitBoards.flatMap(board=>Object.values(board.slots)));
        return items.find(row=>row.category==='Tops'&&!used.has(row.id))?.id;
       });
       assert.ok(deletedId);
       await other.evaluate(()=>{
        window.savedCloud=window.closetCloud;
        window.closetCloud={beforeWrite:()=>new Promise(resolve=>window.releaseDeletedDraft=resolve)};
       });
       await other.evaluate(()=>{
        currentBoard.name='Unsaved draft after garment removal';
        syncBoardInputs();
       });
       await other.locator('#boardSlots .board-slot-top').click();
       await other.locator('#boardPickerItems .board-pick').filter({hasText:fixtures.find(row=>row.id===deletedId).name}).click();
       await other.waitForFunction(()=>Boolean(window.releaseDeletedDraft));
       await page.evaluate(async id=>removeItem(id,normalizeClothing((await readAll()).find(row=>row.id===id))),deletedId);
       await other.evaluate(()=>{
        window.closetCloud=window.savedCloud;
        window.releaseDeletedDraft();
        return writes;
       });
       const durable=await other.evaluate(()=>new Promise((resolve,reject)=>{
        const request=db.transaction('state').objectStore('state').get('outfit-board');
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
       }));
       if(process.env.P1603_EXPECT_RED==='1'){
        assert.equal(durable.current.name,'Unsaved draft after garment removal');
        assert.equal(durable.current.slots.top,deletedId);
       }else{
        assert.equal(durable.current.name,beforeDeletion);
        assert.equal(durable.current.slots.top,undefined);
        assert.equal(await other.locator('#boardName').inputValue(),'Unsaved draft after garment removal');
        await other.getByRole('button',{name:'Refresh my closet',exact:true}).waitFor();
       }

       if(process.env.P1603_EXPECT_RED!=='1'){
        // Refresh after the refused autosave, preserve text, and retry without
        // the deleted reference. Verify the durable result after reload.
        await other.getByRole('button',{name:'Refresh my closet',exact:true}).click();
        await other.waitForFunction(()=>document.querySelector('#refreshOutfitWardrobe').hidden);
        assert.equal(await other.locator('#boardName').inputValue(),'Unsaved draft after garment removal');
        await other.evaluate(async()=>{if(!await storeBoard())throw Error('Reviewed retry declined');});
        await other.reload();
        await other.evaluate(async()=>{await closetReady;await outfitBoardReady;switchView('builder');});
        assert.equal(await other.locator('#boardName').inputValue(),'Unsaved draft after garment removal');
        assert.equal(await other.evaluate(()=>currentBoard.slots.top),undefined);
       }

       // Two independent draft inserts and reviewed promotions start from the
       // same cached wardrobe. Both tabs use the app's real write functions.
       const add=(tab,row)=>tab.evaluate(async record=>{
        await persistDraft({required:true,mode:'insert',record});
        await savePiece({...record,ownerReviewed:true},[],{expectedDraftRow:record});
       },row);
       await Promise.all([add(page,concurrentPhotos[0]),add(other,concurrentPhotos[1])]);
       const [first,second,revoked]=concurrentPhotos;
       const edit=(tab,row,name)=>tab.evaluate(async({row,name})=>{
        try{await saveEditedGarment({...row,name},row);return 'committed';}
        catch(error){return error.message;}
       },{row,name});
       assert.equal(await edit(page,{...first,ownerReviewed:true},'Acknowledged first edit'),'committed');
       assert.match(await edit(other,{...first,ownerReviewed:true},'Stale competing edit'),/STALE_SAVED_GARMENT/);
       await page.evaluate(row=>removeItem(row.id,{...row,ownerReviewed:true}),second);
       assert.match(await edit(other,{...second,ownerReviewed:true},'Stale edit after delete'),/STALE_SAVED_GARMENT/);
       const kept=await page.evaluate(async id=>(await readAll()).find(row=>row.id===id),first.id);
       assert.equal(kept.name,'Acknowledged first edit');
       assert.equal(createHash('sha256').update(Buffer.from(kept.originalPhoto.image.split(',')[1],'base64')).digest('hex'),first.sourceSHA256);
       assert.equal(await page.evaluate(async id=>(await readAll()).some(row=>row.id===id),second.id),false);
       await assert.rejects(add(other,{...first,id:'duplicate-source'}),/IDENTICAL_SAVED_PHOTO/);

       await other.evaluate(record=>{
        window.closetCloud={beforeWrite:()=>new Promise(resolve=>window.releaseRevokedWrite=resolve)};
        window.revokedWrite=persistDraft({required:true,mode:'insert',record})
         .then(()=>false,error=>error.code==='CAPTURE_STORAGE_FAILED');
       },revoked);
       await other.waitForFunction(()=>Boolean(window.releaseRevokedWrite));
       const signOut=async tab=>{
        await tab.locator('.account-menu summary').click();
        await tab.locator('#logout').click();
        await tab.locator('#authSubmit').waitFor();
       };
       const signIn=async(tab,email)=>{
        await tab.locator('#authEmail').fill(email);
        await tab.locator('#authPassword').fill('test-only-password');
        await tab.locator('#authSubmit').click();
        await tab.evaluate(async()=>{await closetReady;await outfitBoardReady;});
       };
       await signOut(page);
       await signIn(page,'other@example.invalid');
       assert.deepEqual(await page.evaluate(()=>readAll()),[]);
       assert.equal(await other.evaluate(()=>{window.releaseRevokedWrite();return window.revokedWrite;}),true);
       await signOut(page);
       await signIn(page,'fixture@example.invalid');
       assert.equal(await page.evaluate(async id=>(await readDraftFrom(db)).some(row=>row.id===id),revoked.id),false);
       assert.equal(await page.evaluate(async id=>(await readAll()).find(row=>row.id===id)?.name,first.id),'Acknowledged first edit');

       results.push({engine,width,baseline:process.env.P1603_EXPECT_RED==='1',staleDraftRefused:true,localInputRetained:true,appendPreservesRemoteDraft:true,loadLatest:true,automaticRefreshPreserved:true,queuedLoadLatest:true,unseenVersionOverrideRefused:true,explicitOverrideReload:true,savedOutfitsRetained:true,deletedDraftReferenceRejected:process.env.P1603_EXPECT_RED!=='1',independentAdds:true,competingEditRejected:true,deletedGarmentNotResurrected:true,originalShaPreserved:true,duplicateRejected:true,oldSessionWriteRejected:true,otherOwnerIsolated:true});
      }
     }finally{await other.close();}
    }catch(error){await page.screenshot({path:out+'/'+engine+'-'+width+'-FAIL.png',fullPage:true});throw error;}
    finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/results.json',JSON.stringify({cases:results,errors,syntheticAuth:true,physicalPhones:false,familyAlpha:'HOLD'},null,2));console.log(JSON.stringify(results));
}finally{server.close();}
