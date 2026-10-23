/**
 * Issue #240 standalone local Chromium/WebKit browser QA: real board+stylist
 * engines, true IndexedDB stores, synthetic sources, account-safe lifecycle.
 * No app mutation, provider requests, customer photographs or paid tokens.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('public');
const server=createServer(async(req,res)=>{
 try{
  const route=new URL(req.url,'http://127.0.0.1').pathname;
  if(route==='/issue240'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none';script-src 'self';style-src 'unsafe-inline';img-src data:;connect-src 'self'"});
   res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic owned outfit QA</title><main><h1>Owned outfits</h1><div id="outfits"></div><div id="status"></div></main><script src="/outfit-matcher.js"></script><script src="/outfit-board-engine.js"></script><script src="/closet-stylist-engine.js"></script>');
   return;
  }
  if(route==='/issue240-lifecycle.mjs'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(await readFile('research/issue240/outfit-lifecycle.mjs'));return;}
  const path=resolve(root,'.'+decodeURIComponent(route));
  if(!path.startsWith(root+sep))throw Error('Local fixture route violation');
  res.writeHead(200,{'Content-Type':extname(path)==='.json'?'application/json':'text/javascript','Cache-Control':'no-store'});res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('missing');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port+'/issue240',rows=[];
try{
 for(const [name,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:768},hasTouch:true,isMobile:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],outgoing=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith('http://127.0.0.1:')){outgoing.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(url);
    const result=await page.evaluate(async()=>{
     const {createOutfitLifecycle}=await import('/issue240-lifecycle.mjs');
     const ownerA='account-owner-A',ownerB='account-owner-B';
     const photo=s=>'data:image/jpeg;base64,'+btoa('\xFF\xD8'+s+'\xFF\xD9');
     const make=(id,category,itemType,color='Blue')=>({id,category,itemType,color,name:itemType,pattern:'Solid',seasons:[],image:photo('crop-'+id),originalPhoto:{image:photo('source-'+id)}});
     const clothes=[make('top-A','Tops','T-shirt'),make('top-B','Tops','Polo','White'),make('top-C','Tops','Sweater','Cream'),
      make('pants-A','Bottoms','Jeans'),make('pants-B','Bottoms','Trousers','Black'),
      make('shoes-A','Shoes','Sneakers','White'),make('shoes-B','Shoes','Loafers','Brown')];
     const open=owner=>new Promise((resolve,reject)=>{
      const req=indexedDB.open('closet-current-user-'+owner,2);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('items'))req.result.createObjectStore('items',{keyPath:'id'});
       if(!req.result.objectStoreNames.contains('state'))req.result.createObjectStore('state',{keyPath:'id'});};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
     });
     const a=await open(ownerA),b=await open(ownerB);
     const write=(db,records)=>new Promise((resolve,reject)=>{
      const tx=db.transaction('items','readwrite');for(const x of records)tx.objectStore('items').put(x);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
     });
     const read=db=>new Promise((resolve,reject)=>{
      const tx=db.transaction('items','readonly'),q=tx.objectStore('items').getAll();
      tx.oncomplete=()=>resolve(q.result);tx.onerror=()=>reject(tx.error);
     });
     const saveBoard=(db,board)=>new Promise((resolve,reject)=>{
      const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'outfit-board',current:board.board,saved:[board]});
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     });
     const loadBoard=db=>new Promise((resolve,reject)=>{
      const tx=db.transaction('state','readonly'),q=tx.objectStore('state').get('outfit-board');
      tx.oncomplete=()=>resolve(q.result);tx.onerror=()=>reject(tx.error);
     });
     await write(a,clothes);await write(b,[make('top-A','Tops','T-shirt'),make('pants-A','Bottoms','Jeans'),make('shoes-A','Shoes','Sneakers')]);
     let session=ownerA,inventory=await read(a);
     const adapter={
      ownerId:ownerA,readOwner:()=>session,readCloset:()=>inventory,
      generate:(items,req)=>styleOwnedCollection(items,req,null),
      cleanBoard:(value,items)=>cleanOutfitBoard(value,items),
      slotAllows:(slot,item)=>Boolean(outfitSlots.find(x=>x.id===slot&&slotAllows(x,item)))
     };
     const lifecycle=createOutfitLifecycle(adapter);
     const request={request:'Casual',audience:'All',season:'Fall'};
     const first=await lifecycle.refresh(request);
     if(first.results.length!==3||new Set(first.results.map(x=>x.signature)).size!==3)throw Error('Three distinct owned results missing');
     const before=JSON.stringify(inventory);
     const selected=first.results[0].board.slots;
     const alternative=selected.bottom==='pants-A'?'pants-B':'pants-A';
     const swapped=await lifecycle.swap(0,'bottom',alternative);
     if(swapped.board.slots.top!==selected.top||swapped.board.slots.shoes!==selected.shoes||swapped.board.slots.bottom!==alternative)throw Error('Swap edited unrelated slots');
     const saved=await lifecycle.save(0);await saveBoard(a,saved);
     const persisted=(await loadBoard(a)).saved[0];const restored=await lifecycle.restore(persisted);
     if(restored.board.slots.bottom!==alternative)throw Error('Restoration lost swap');
     if(JSON.stringify(inventory)!==before)throw Error('Photos changed during recommendation/saving');
     await lifecycle.pin('top','top-B');
     const pinned=(await lifecycle.refresh(request)).results;
     if(pinned.length!==3||pinned.some(x=>x.board.slots.top!=='top-B'))throw Error('Pinned 3 candidates missing');
     inventory.find(x=>x.id==='top-B').color='Orange';
     if((await lifecycle.visible()).status!=='stale')throw Error('Color change did not invalidate');
     await lifecycle.refresh(request);
     inventory.find(x=>x.id==='top-B').originalPhoto.image=photo('changed-parent-source');
     if((await lifecycle.visible()).status!=='stale')throw Error('Original source change under identical crop not invalidated');
     await lifecycle.refresh(request);
     session=ownerB;
     if((await lifecycle.visible()).status!=='stale')throw Error('Cross-owner results visible');
     let blocked=false;
     try{await lifecycle.restore(persisted);}catch{blocked=true;}
     if(!blocked)throw Error('Cross-account board restored');
     if((await read(b)).length!==3)throw Error('Owner B IndexedDB changed');
     const aData=await read(a);
     if(aData.some(item=>item.originalPhoto.image===''))throw Error('Owner A original removed');
     const grid=document.querySelector('#outfits');
     for(const result of pinned){
      const card=document.createElement('article');
      card.textContent=Object.values(result.board.slots).join(' • ');
      card.dataset.slots=JSON.stringify(result.board.slots);
      grid.append(card);
     }
     if(grid.querySelectorAll('article').length!==3)throw Error('Results not rendered');
     document.querySelector('#status').textContent='Synthetic offline QA passed';
     a.close();b.close();
     return {distinctOutfits:first.results.length,pinnedOutfits:pinned.length,
      onePieceSwapPreserved:true,savedRestored:true,invalidatedOnColor:true,invalidatedOnOriginal:true,
      isolatedAccounts:true,originalsUnmodifiedByRecommendation:true};
    });
    assert.deepEqual(errors,[]);
    assert.deepEqual(outgoing,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    rows.push({browser:name,width,...result,externalRequests:0,pageErrors:0});
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(rows.length,6);
 console.log('ISSUE240_BROWSER_PASS '+JSON.stringify(rows));
}finally{await new Promise(done=>server.close(done));}
