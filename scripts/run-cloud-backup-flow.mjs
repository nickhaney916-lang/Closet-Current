import {chromium} from 'playwright';import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/cloud-backup'),owners=['a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222'];
const records=new Map(),photos=new Map(),errors=[],types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};let offline=false,blockSave=false,releaseSave=null,loseSaveResponse=false;
const server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+decodeURIComponent(p==='/'?'/index.html':p));if(!file.startsWith(root+'/'))throw Error('Invalid path');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
const clone=x=>JSON.parse(JSON.stringify(x));
try{
 await mkdir(output,{recursive:true});browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 async function device(owner,seedLegacy=false){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/auth.js*',r=>r.fulfill({contentType:'text/javascript',body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getAccessToken:async()=> '${owner}'};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`}));
  // Requests use the production cloud client; backend failures and revision races are controlled here.
  await context.route('https://hlkgymugtfbirlpunsra.supabase.co/**',async route=>{
   if(offline)return route.abort('failed');const request=route.request(),url=new URL(request.url()),actor=request.headers().authorization?.slice(7),json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   if(!owners.includes(actor))return json({error:'unauthorized'},401);
   if(url.pathname==='/rest/v1/closet_backups'){const requested=url.searchParams.get('owner_id')?.slice(3);return json(requested!==actor?[]:records.has(actor)?[clone(records.get(actor))]:[]);}
   if(url.pathname==='/rest/v1/rpc/save_closet_backup'){
    const data=request.postDataJSON();if(blockSave){blockSave=false;await new Promise(r=>releaseSave=r);}
    const previous=records.get(actor);if((previous?.revision||0)!==data.p_expected_revision)return json(null);
    const next={revision:(previous?.revision||0)+1,document:clone(data.p_document)};records.set(actor,next);if(loseSaveResponse){loseSaveResponse=false;return route.abort('failed');}return json(next.revision);
   }
   const prefix='/storage/v1/object/closet-private/';if(url.pathname.startsWith(prefix)){const path=url.pathname.slice(prefix.length);if(!path.startsWith(actor+'/'))return json({},403);
    if(request.method()==='POST'){if(photos.has(path))return json({},409);photos.set(path,request.postDataBuffer());return json({});}
    if(!photos.has(path))return json({},404);return route.fulfill({contentType:'image/jpeg',body:photos.get(path)});
   }
   return json({},404);
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  if(seedLegacy){await page.addInitScript(({owner,image})=>{
   window.closetLegacyReady=new Promise((resolve,reject)=>{const request=indexedDB.open('closet-current-user-'+owner,2);request.onupgradeneeded=()=>{request.result.createObjectStore('items',{keyPath:'id'});request.result.createObjectStore('state',{keyPath:'id'});};request.onsuccess=()=>{const database=request.result,tx=database.transaction('items','readwrite');for(let i=0;i<9;i++)tx.objectStore('items').put({id:'legacy-'+i,name:'Saved garment '+(i+1),category:'Tops',itemType:'T-shirt',image,seasons:['Fall'],userAdjusted:true});tx.oncomplete=()=>{database.close();resolve();};tx.onerror=()=>reject(tx.error);};});
  },{owner,image:'data:image/jpeg;base64,'+(await readFile('benchmark/photos/commons-0002.jpg')).toString('base64')});
   await page.goto('http://127.0.0.1:'+server.address().port+'/phone-photo-check.html');await page.evaluate(()=>window.closetLegacyReady);
   await page.close();
  }
  const app=seedLegacy?await context.newPage():page;app.on('pageerror',e=>errors.push(e.message));
  await app.goto('http://127.0.0.1:'+server.address().port+'/');await app.evaluate(()=>closetReady);await app.waitForFunction(()=>!document.getElementById('syncCloset').hidden);return {page:app,context};
 }
 const one=await device(owners[0],true);await one.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');assert.equal(records.get(owners[0]).document.items.length,9);assert.equal(await one.page.evaluate(()=>items.length),9);
 assert.ok(!JSON.stringify(records.get(owners[0])).includes('data:image'),'Cloud JSON must store photo references, not base64');
 const two=await device(owners[0]);await two.page.waitForFunction(()=>items.length===9);assert.equal(await two.page.evaluate(()=>items[0].image.startsWith('data:image/jpeg;base64,')),true);
 const other=await device(owners[1]);assert.equal(await other.page.evaluate(()=>items.length),0);
 await two.page.evaluate(async()=>{currentBoard=cleanOutfitBoard({name:'Recovered outfit',slots:{top:items[0].id}},items);savedOutfitBoards=[structuredClone(currentBoard)];await persistBoardState();inspirationLooks=[validLook({id:'look-test',title:'Test look',pieces:[],image:items[0].image})];await storeLooks(inspirationLooks);batch=[{...items[0],id:'draft-test',name:'Unfinished photo',category:'Uncategorized',itemType:'Unknown',localAnalyzed:true}];await persistDraft();await closetCloud.sync();});
 await two.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>savedOutfitBoards.length===1&&inspirationLooks.length===1&&batch.length===1);
 offline=true;await two.page.evaluate(async()=>{const value={...items[0],name:'Offline edit'};await writeAll([value]);Object.assign(items[0],value);await closetCloud.sync();});assert.match(await two.page.locator('#cloudStatus').textContent(),/pending/);await two.page.reload();await two.page.evaluate(()=>closetReady);assert.equal(await two.page.evaluate(()=>items.find(x=>x.name==='Offline edit')?.name),'Offline edit');offline=false;await two.page.evaluate(()=>closetCloud.sync());await two.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
 // A local edit while upload is in flight must remain pending and be saved by the next pass.
 blockSave=true;await two.page.evaluate(async()=>{const value={...items[0],color:'Blue'};await writeAll([value]);Object.assign(items[0],value);void closetCloud.sync();});
 for(let i=0;i<100&&!releaseSave;i++)await new Promise(r=>setTimeout(r,50));assert.ok(releaseSave,'Expected blocked revision write');
 await two.page.evaluate(async()=>{const value={...items[0],notes:'Changed during upload'};await writeAll([value]);Object.assign(items[0],value);});releaseSave();await two.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');assert.equal(records.get(owners[0]).document.items.find(x=>x.notes==='Changed during upload')?.notes,'Changed during upload');
 // Delete is a saved operation and must survive restoration on another device.
 await two.page.evaluate(async()=>{const id=items[1].id;await removeItem(id);items=items.filter(x=>x.id!==id);await closetCloud.sync();});await two.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>items.length===8);
 offline=true;
 await one.page.evaluate(async()=>{const value={...items[0],id:'new-left',name:'New on first device'};await writeAll([value]);items.push(value);});
 await two.page.evaluate(async()=>{const value={...items[0],id:'new-right',name:'New on second device'};await writeAll([value]);items.push(value);});offline=false;
 await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
 await two.page.evaluate(()=>closetCloud.sync());await two.page.waitForFunction(()=>items.length===10&&document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
 await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>items.length===10);
 // Same-field edits stop safely until the owner chooses to preserve both copies.
 offline=true;
 for(const [device,name]of [[one,'First conflicting shirt'],[two,'Second conflicting shirt']])await device.page.evaluate(async name=>{const value={...items.find(x=>x.id==='legacy-0'),name};await writeAll([value]);Object.assign(items.find(x=>x.id===value.id),value);},name);
 offline=false;await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
 await two.page.evaluate(()=>closetCloud.sync());await two.page.waitForFunction(()=>!document.getElementById('resolveCloudConflict').hidden);
 assert.equal(records.get(owners[0]).document.items.length,10);assert.equal(await two.page.evaluate(()=>items.find(x=>x.id==='legacy-0').name),'Second conflicting shirt');
 await two.page.locator('.account-menu summary').click();loseSaveResponse=true;await two.page.locator('#resolveCloudConflict').click();await two.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('pending'));assert.equal(records.get(owners[0]).document.items.length,11);
 await two.page.evaluate(()=>closetCloud.sync());await two.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('choose Keep both'));await two.page.locator('#resolveCloudConflict').click();await two.page.waitForFunction(()=>items.length===11&&document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
 assert.ok(records.get(owners[0]).document.items.some(x=>x.name==='First conflicting shirt'));assert.ok(records.get(owners[0]).document.items.some(x=>x.name==='Second conflicting shirt (saved copy)'));
 // A corrupt cloud image must not replace any local photos or acknowledge restoration.
 await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>items.length===11);
 const target=records.get(owners[0]);target.revision++;target.document.items[0].notes='Cloud-only recovery edit';const photoPath=target.document.items[0].image.slice('closet-photo:'.length),originalPhoto=photos.get(photoPath);photos.set(photoPath,Buffer.from('corrupt'));
 await one.page.evaluate(()=>closetCloud.sync());assert.equal(await one.page.evaluate(()=>items.length),11);assert.equal(await one.page.evaluate(()=>items.some(x=>x.notes==='Cloud-only recovery edit')),false);assert.match(await one.page.locator('#cloudStatus').textContent(),/unavailable/);
 photos.set(photoPath,originalPhoto);await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>items.some(x=>x.notes==='Cloud-only recovery edit')&&document.getElementById('cloudStatus').textContent==='Cloud backup up to date');
 const clean=await device(owners[0]);await clean.page.waitForFunction(()=>items.length===11&&savedOutfitBoards.length===1&&inspirationLooks.length===1&&batch.length===1);await clean.page.locator('.tab[data-view="closet"]').click();await clean.page.screenshot({path:output+'/restored-closet.png',fullPage:true});
 // Exercise the crop editor itself, including cancel, exact indexing input and private recovery.
 const cropItem=await clean.page.evaluate(()=>({id:items[0].id,image:items[0].image}));
 await clean.page.getByRole('button',{name:'Crop photo',exact:true}).first().click();await clean.page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await clean.page.evaluate(id=>items.find(x=>x.id===id).image,cropItem.id),cropItem.image);
 await clean.page.evaluate(()=>{localReady=true;localRequest=async(type,image)=>{window.lastCropRecognitionImage=image;return {strong:true,choices:[{category:'Bottoms',itemType:'Jeans',sleeveLength:'Not applicable',label:'Jeans'}]};};});
 await clean.page.getByRole('button',{name:'Crop photo',exact:true}).first().click();
 const corner=clean.page.locator('.crop-handle.nw');await corner.focus();await corner.press('Shift+ArrowRight');await corner.press('Shift+ArrowDown');
 await clean.page.getByRole('button',{name:'Check recognition',exact:true}).click();await clean.page.getByText('Suggested: Bottoms · Jeans',{exact:true}).waitFor();await clean.page.getByLabel('Use suggested category and item type').check();
 await clean.page.screenshot({path:output+'/crop-editor.png',fullPage:true});
 await clean.page.evaluate(()=>{window.cropOriginalWrite=writeAll;writeAll=async()=>{throw Error('Simulated storage failure');};});await clean.page.getByRole('button',{name:'Save crop',exact:true}).click();await clean.page.getByText('Crop could not be saved. Your previous photo is kept. Try again.',{exact:true}).waitFor();assert.equal(await clean.page.evaluate(id=>items.find(x=>x.id===id).image,cropItem.id),cropItem.image);await clean.page.evaluate(()=>{writeAll=window.cropOriginalWrite;delete window.cropOriginalWrite;});await clean.page.getByRole('button',{name:'Save crop',exact:true}).click();await clean.page.waitForFunction(()=>!document.querySelector('.photo-crop-editor'));
 const cropped=await clean.page.evaluate(id=>({item:items.find(x=>x.id===id),indexed:window.lastCropRecognitionImage}),cropItem.id);assert.equal(cropped.item.image,cropped.indexed);assert.notEqual(cropped.item.image,cropItem.image);assert.equal(cropped.item.originalPhoto.image,cropItem.image);assert.equal(cropped.item.itemType,'Jeans');assert.ok(cropped.item.cropBounds.x>0);
 await clean.page.evaluate(()=>closetCloud.sync());await clean.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');assert.ok(!JSON.stringify(records.get(owners[0])).includes('data:image'));
 const cropRestore=await device(owners[0]);await cropRestore.page.waitForFunction(id=>items.some(x=>x.id===id&&x.originalPhoto),cropItem.id);const restoredCrop=await cropRestore.page.evaluate(id=>items.find(x=>x.id===id),cropItem.id);assert.equal(restoredCrop.image,cropped.item.image);assert.equal(restoredCrop.originalPhoto.image,cropItem.image);
 await clean.page.getByRole('button',{name:'Crop photo',exact:true}).first().click();assert.equal(await clean.page.locator('.crop-stage>img').getAttribute('src'),cropItem.image);await clean.page.getByRole('button',{name:'Whole photo',exact:true}).click();await clean.page.getByRole('button',{name:'Save crop',exact:true}).click();await clean.page.waitForFunction(()=>!document.querySelector('.photo-crop-editor'));assert.equal(await clean.page.evaluate(id=>items.find(x=>x.id===id).cropBounds.width,cropItem.id),1);
 assert.deepEqual(errors,[]);const result={legacyNineMigrated:true,secondDeviceRestore:true,accountIsolation:true,outfitsAndInspirationRestored:true,unfinishedPhotosRestored:true,offlineReloadAndRetry:true,editsDuringUploadPreserved:true,deletionSynced:true,emptyBrowserRestore:true,independentOfflineEditsMerged:true,conflictingVersionsPreserved:true,lostSaveResponseDoesNotDuplicateCopies:true,corruptRestoreKeepsLocalPhotos:true,cropCancelPreservesPhoto:true,cropSaveFailurePreservesPhoto:true,cropRecognitionUsesSavedPixels:true,cropOriginalPrivatelyRestored:true,cropCanResetToOriginal:true,pageErrors:errors,backend:'Controlled HTTP backend with production browser client; actual Supabase auth/storage/RLS verified separately'};await writeFile(output+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 for(const context of browser.contexts())await context.close();
}finally{await browser?.close();await new Promise(r=>server.close(r));}
