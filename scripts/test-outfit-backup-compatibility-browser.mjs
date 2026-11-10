// Bounded saved-outfit migration/backup regression from run-cloud-backup-flow.mjs.
import {chromium} from 'playwright';import {createServer} from 'node:http';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=resolve('dist'),output=resolve(process.argv[2]||'benchmark/outfit-backup-compatibility'),owners=['a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222'];
const records=new Map(),photos=new Map(),errors=[],types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};let offline=false,blockSave=false,releaseSave=null,loseSaveResponse=false,loseSaveResponseApplied=null;
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
    const next={revision:(previous?.revision||0)+1,document:clone(data.p_document)};records.set(actor,next);if(loseSaveResponse){loseSaveResponse=false;loseSaveResponseApplied?.();loseSaveResponseApplied=null;return route.abort('failed');}return json(next.revision);
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
 await two.page.evaluate(async()=>{currentBoard=cleanOutfitBoard({name:'Recovered outfit',slots:{top:items[0].id}},items);savedOutfitBoards=[structuredClone(currentBoard)];await persistBoardState({replaceSaved:savedOutfitBoards});inspirationLooks=[validLook({id:'look-test',title:'Test look',pieces:[],image:items[0].image})];await storeLooks(inspirationLooks);batch=[{...items[0],id:'draft-test',name:'Unfinished photo',category:'Uncategorized',itemType:'Unknown',localAnalyzed:true}];await persistDraft();await closetCloud.sync();});
 await two.page.waitForFunction(()=>document.getElementById('cloudStatus').textContent==='Cloud backup up to date');await one.page.evaluate(()=>closetCloud.sync());await one.page.waitForFunction(()=>savedOutfitBoards.length===1&&inspirationLooks.length===1&&batch.length===1);

 assert.equal(await two.page.evaluate(()=>savedOutfitBoards[0].name),'Recovered outfit');
 assert.equal(await one.page.evaluate(()=>savedOutfitBoards[0].name),'Recovered outfit');
 assert.deepEqual(errors,[]);
 const result={legacyMigration:9,sameOwnerTwoBrowsersRestore:true,savedOutfitRestored:true,unrelatedOwnerEmpty:true,photosStoredByReference:true,syntheticBackend:true,hostedSupabase:false,physicalPhone:false,familyAlpha:'HOLD'};
 await writeFile(output+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 await two.page.screenshot({path:output+'/restored-outfit.png',fullPage:true});
 for(const context of browser.contexts())await context.close();
}finally{await browser?.close();await new Promise(r=>server.close(r));}
