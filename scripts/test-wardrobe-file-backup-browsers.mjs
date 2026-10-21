// Actual file input, downloads, photo decoding and IndexedDB transactions.
// Synthetic local photos/accounts only; no hosted customer data or paid calls.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const filename=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!filename.startsWith(root+'/'))throw Error('Disallowed asset');
  const bytes=await readFile(filename);
  res.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const results=[];
try{
 for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block',acceptDownloads:true});
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
    "window.closetAuth={user:{id:'backup-alice',email:'alice@example.test'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await context.route('**/cloud-backup-bridge.js*',route=>route.fulfill({contentType:'text/javascript',body:'// Cloud provider disabled for local file-restore fixtures.'}));
   await context.route('https://raw.githubusercontent.com/**',route=>route.abort('internetdisconnected'));
   const errors=[],dialogs=[];let page;
   const open=async()=>{
    page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.accept();});
    await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    await page.evaluate(()=>{window.closetCloud={beforeWrite:async()=>{},changed(){}};switchView('closet');document.querySelector('.closet-backup').open=true;});
   };
   await open();
   const fixture=await page.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=768;c.height=1024;const x=c.getContext('2d');
    x.fillStyle='#24567a';x.fillRect(0,0,c.width,c.height);x.fillStyle='#d4a023';for(let i=30;i<720;i+=55)x.fillRect(i,50,12,900);
    const image=c.toDataURL('image/jpeg',.94),item=normalizeClothing({id:'shirt',name:'Restored blue correction',category:'Tops',itemType:'T-shirt',color:'Blue',colorSource:'manual',notes:'User corrected this detail',seasons:['Fall'],image,recognitionPhoto:{image},originalPhoto:{image}});
    const own=normalizeClothing({...item,name:'Existing red correction',color:'Red'});
    await writeAll([own]);items=[own];
    await new Promise((r,j)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'backup-test-sentinel',keep:'unrelated state'});tx.oncomplete=r;tx.onerror=()=>j(tx.error);});
    inspirationLooks=[validLook({id:'look',title:'Existing inspiration',image,pieces:[]})];await storeLooks(inspirationLooks);
    currentBoard=cleanOutfitBoard({name:'Existing selection',slots:{top:'shirt'}},items);savedOutfitBoards=[structuredClone(currentBoard)];await persistBoardState();render();
    return {format:'closet-current',version:4,ownerId:'backup-alice',items:[item],looks:[validLook({id:'look',title:'Restored inspiration',image,pieces:[]})],outfitBoard:{current:cleanOutfitBoard({name:'Restored selection',slots:{top:'shirt'}},[item]),saved:[cleanOutfitBoard({name:'Restored saved',slots:{top:'shirt'}},[item])]}};
   });
   const restore=async data=>{
    await page.locator('#import').setInputFiles({name:'closet-backup.json',mimeType:'application/json',buffer:Buffer.from(typeof data==='string'?data:JSON.stringify(data))});
    await page.waitForFunction(()=>!document.getElementById('import').disabled);
    return page.locator('#backupStatus').innerText();
   };
   const disk=()=>page.evaluate(async()=>({items:await readAll(),looks:await new Promise((r,j)=>{const q=db.transaction('state').objectStore('state').getAll();q.onsuccess=()=>r(q.result.filter(x=>['looks','outfit-board','draft','backup-test-sentinel'].includes(x.id)));q.onerror=()=>j(q.error);})}));
   assert.match(await restore(fixture),/^Restored 1/);
   const once=await disk();assert.equal(once.items.length,2);
   const imported=once.items.find(x=>x.color==='Blue');assert.ok(imported&&imported.id!=='shirt');assert.equal(imported.image,fixture.items[0].image);assert.equal(imported.recognitionPhoto.image,fixture.items[0].recognitionPhoto.image);assert.equal(imported.notes,fixture.items[0].notes);
   const state=once.looks.find(x=>x.id==='outfit-board');assert.equal(state.current.slots.top,'shirt');assert.equal(state.saved.length,3);assert.ok(state.saved.filter(x=>x.name.startsWith('Restored')).every(x=>x.slots.top===imported.id));assert.equal(once.looks.find(x=>x.id==='looks').looks.length,2);
   assert.match(await restore(fixture),/^Restored 0/);assert.deepEqual(await disk(),once);
   // Browser download contains a consistent durable snapshot and no resampling.
   const exportBackup=async()=>{
    const waiting=page.waitForEvent('download');await page.locator('#export').tap();const download=await waiting;
    return JSON.parse(await readFile(await download.path(),'utf8'));
   };
   const exported=await exportBackup();assert.equal(exported.version,4);assert.equal(exported.ownerId,'backup-alice');assert.equal(exported.items.find(x=>x.color==='Blue').image,fixture.items[0].image);assert.equal(exported.outfitBoard.saved.length,3);
   await page.close();await open();assert.deepEqual(await disk(),once);assert.equal(await page.evaluate(()=>savedOutfitBoards.length),3);
   // Every invalid file must leave all durable collections unchanged.
   for(const bad of ['{broken', {...fixture,ownerId:'backup-bob'}, {...fixture,items:[fixture.items[0],fixture.items[0]]}, {...fixture,outfitBoard:{current:{slots:{top:'missing'}},saved:[]}}, {...fixture,items:[{...fixture.items[0],image:'data:image/jpeg;base64,AAAA'}]}]){
    assert.doesNotMatch(await restore(bad),/^Restored/);assert.deepEqual(await disk(),once);
   }
   // Abort only after garments and both state rows have been queued in the
   // actual IndexedDB transaction; no partial rows may survive.
   await page.evaluate(()=>{
    window.nativeTransaction=IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction=function(...args){
     const tx=window.nativeTransaction.apply(this,args);if(args[1]!=='readwrite')return tx;
     const objectStore=tx.objectStore.bind(tx);tx.objectStore=name=>{
      const store=objectStore(name),put=store.put.bind(store);
      store.put=value=>{const request=put(value);if(name==='state'&&value.id==='outfit-board')tx.abort();return request;};return store;
     };return tx;
    };
   });
   const third=structuredClone(fixture);third.items[0].id='third';third.items[0].name='Third distinct garment';third.items[0].color='Green';third.outfitBoard.current.slots.top='third';third.outfitBoard.saved[0].slots.top='third';
   assert.doesNotMatch(await restore(third),/^Restored/);await page.evaluate(()=>{IDBDatabase.prototype.transaction=window.nativeTransaction;});assert.deepEqual(await disk(),once);
   assert.match(await restore(third),/^Restored 1/);const beforeSwitch=await disk();
   // Switch accounts while File.text() is pending. The UI must neither ask
   // for old-user consent nor enter the cloud/write path under the new user.
   const confirmations=dialogs.length;
   await page.evaluate(()=>{
    window.nativeText=File.prototype.text;File.prototype.text=async function(){const text=await window.nativeText.call(this);window.closetAuth.user={id:'backup-bob'};return text;};
   });
   assert.match(await restore(fixture),/account changed/);assert.equal(dialogs.length,confirmations);assert.deepEqual(await disk(),beforeSwitch);
   await page.evaluate(()=>{File.prototype.text=window.nativeText;window.closetAuth.user={id:'backup-alice',email:'alice@example.test'};});
   // Legacy files require explicit target-account confirmation.
   const legacy=structuredClone(fixture);legacy.version=3;delete legacy.ownerId;await restore(legacy);assert.match(dialogs.at(-1),/older backup.*alice@example.test/);
   for(const width of [320,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
   await mkdir('artifacts/wardrobe-backup',{recursive:true});await page.screenshot({path:'artifacts/wardrobe-backup/'+(engine===chromium?'android':'iphone')+'.png',fullPage:true});
   // Export an outfit-only saved collection: old export incorrectly refused it.
   await page.evaluate(async()=>{
    await new Promise((r,j)=>{const tx=db.transaction(['items','state'],'readwrite');tx.objectStore('items').clear();tx.objectStore('state').put({id:'looks',looks:[]});tx.objectStore('state').put({id:'outfit-board',current:cleanOutfitBoard({},[]),saved:[cleanOutfitBoard({name:'Planned outfit',slots:{},ideas:{top:{type:'T-shirt',color:'Blue'}}},[])]});tx.oncomplete=r;tx.onerror=()=>j(tx.error);});
    items=[];inspirationLooks=[];await reloadCloudBoard();
   });
   const outfitOnly=await exportBackup();assert.equal(outfitOnly.items.length,0);assert.equal(outfitOnly.outfitBoard.saved.length,1);
   assert.deepEqual(errors,[]);
   results.push({browser:label,additiveConflictCopies:true,originalPhotoBytesPreserved:true,outfitReferencesRemapped:true,repeatRestoreNoDuplicates:true,downloadAndReopen:true,corruptFilesRejected:5,lateTransactionAbortRolledBack:true,retry:true,accountSwitchDuringFileReadBlocked:true,legacyTargetConfirmed:true,outfitOnlyExport:true,mobileWidths:[320,390,430],pageErrors:0,physicalPhone:false,liveSupabase:false});
   await context.close();
  }finally{await browser.close();}
 }
 console.log('WARDROBE_FILE_RESTORE_MOBILE '+JSON.stringify(results));
}finally{await new Promise(ok=>server.close(ok));}
