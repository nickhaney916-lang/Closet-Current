// Real browser UI/IndexedDB, synthetic garments and links; no customer account,
// external website navigation, physical device or live-stock verification.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer((req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));if(!p.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',mime[extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,report=[];
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),blocked=[],errors=[];
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===origin&&u.pathname==='/auth.js')return route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'issue238-synthetic'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"});
    if(u.origin===origin)return route.continue();blocked.push({method:route.request().method()});return route.abort();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin);await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
   await page.waitForFunction(()=>!!activeTrendLibrary&&!trendLoading);
   const results=await page.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=12;c.height=16;const x=c.getContext('2d');x.fillStyle='#264ba7';x.fillRect(0,0,12,16);const image=c.toDataURL('image/jpeg');
    const owned=[];for(const [category,itemType,prefix,count] of [['Tops','T-shirt','top',3],['Bottoms','Jeans','bottom',2],['Shoes','Sneakers','shoes',2]])for(let i=0;i<count;i++)owned.push(normalizeClothing({id:'owned-'+prefix+'-'+i,name:'Synthetic '+itemType,category,itemType,image,color:'Blue',pattern:'Solid',seasons:['All seasons']}));
    items=owned;const before=JSON.stringify(items),date=activeTrendLibrary.updatedAt;
    activeTrendLibrary.products.push({id:'shopping-only',name:'Shop example',category:'Tops',itemType:'T-shirt',type:'T-shirt',audience:'All',url:'https://shop.example.com/item'});
    const choices=styleOwnedCollection(items,{request:'Casual',audience:'All',season:'Fall'},activeTrendLibrary);
    const ownedIDs=new Set(items.map(x=>x.id));
    const onlyOwned=choices.length===3&&choices.every(o=>Object.values(o.board.slots).every(id=>ownedIDs.has(id)));
    const gaps=matchOutfit([{id:'wanted',category:'Dresses',itemType:'Formal dress',color:'red'}],items);
    const sanitized=validLook({id:'synthetic-look',title:'Test inspiration',sourceUrl:'https://user:secret@fashion.example.com/look',pieces:[]});
    await storeLooks([sanitized]);inspirationLooks=[sanitized];renderSavedLooks();
    const restored=await new Promise((ok,no)=>{const r=db.transaction('state').objectStore('state').get('looks');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
    await refreshTrendLibrary(true);
    return {threeDistinctOwnedOutfits:onlyOwned,shoppingItemNeverInserted:JSON.stringify(items)===before,
     missingDressRemainsGap:gaps[0].status==='gap'&&!gaps[0].best,
     credentialsRemovedBeforePersist:restored.looks[0].sourceUrl==='',
     unsafeLinkAbsent:!document.querySelector('#savedLooks a'),
     offlinePriorLibraryRetained:activeTrendLibrary.updatedAt===date,
     offlineWarning:document.getElementById('trendFreshness').textContent.includes('Could not check for newer data'),
     publicURLKept:safeInspirationUrl('https://fashion.example.com/look?sku=123#blue')==='https://fashion.example.com/look?sku=123#blue'};
   });
   for(const [name,result] of Object.entries(results))assert.equal(result,true,engine.name()+' '+width+' '+name);
   await page.evaluate(()=>switchView('trends'));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Inspiration horizontal overflow');
   assert.deepEqual(errors,[]);assert.ok(blocked.every(x=>x.method==='GET'),'No external write attempts');
   report.push({engine:engine.name(),width,...results,horizontalOverflow:false,pageErrors:0,externalRequestsAllowed:0,externalRequestsBlocked:blocked.length,physicalDevice:false});
   await context.close();
  }}finally{await browser.close();}
 }
 fs.mkdirSync('artifacts/issue238-independent',{recursive:true});fs.writeFileSync('artifacts/issue238-independent/browsers.json',JSON.stringify(report,null,2)+'\n');
 console.log('ISSUE238_INDEPENDENT_BROWSERS '+JSON.stringify(report));
}finally{await new Promise(r=>server.close(r));}
