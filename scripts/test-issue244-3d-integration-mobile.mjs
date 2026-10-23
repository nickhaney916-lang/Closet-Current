/** Offline PR231/PR232 QA: 6 mobile emulations, real synthetic IndexedDB,
 * reference bridge and actual procedural WebGL renderer or explicit 2D.
 * Uses only local generated fixture JPEGs. No production UI/network/cloud. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('.');
const srv=createServer(async(req,res)=>{
 try{
  const route=new URL(req.url,'http://127.0.0.1').pathname;
  if(route==='/issue244'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'"});
   res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline 3D integration QA</title><style>body{margin:0;font:15px sans-serif}main{max-width:100%;padding:12px;overflow-wrap:anywhere}canvas{max-width:100%;width:240px;height:360px;display:block}img{width:60px;height:90px;object-fit:contain}</style><main><h1>Local synthetic outfit boundary</h1><canvas width="240" height="360" id="renderer"></canvas><section id="fallback"></section></main>');
   return;
  }
  if(!route.startsWith('/research/issue244/')&&!route.startsWith('/public/'))throw Error('Unrecognized path');
  const path=resolve(root,'.'+decodeURIComponent(route));if(!path.startsWith(root+sep))throw Error('Root escape');
  res.writeHead(200,{'Content-Type':extname(path)==='.mjs'?'text/javascript':'text/plain','Cache-Control':'no-store'});res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>srv.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+srv.address().port,report=[];
try{
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:780},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],outside=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(host)){outside.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(host+'/issue244');
    const outcome=await page.evaluate(async()=>{
     const {syntheticAuthSource,createOfflineIntegrationQA}=await import('/research/issue244/offline-3d-integration-qa.mjs');
     const {makeSyntheticCloset,makeSyntheticPiece,syntheticJPEGs}=await import('/research/issue244/qa-fixtures.mjs');
     const {createDetailedHumanoid3D}=await import('/research/issue244/reference/pr232/humanoid-3d-detailed-renderer.mjs');
     const open=id=>new Promise((ok,no)=>{
      const r=indexedDB.open('closet-current-user-'+id,2);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});};
      r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);
     });
     const put=(db,items)=>new Promise((ok,no)=>{
      const tx=db.transaction('items','readwrite');for(const item of items)tx.objectStore('items').put(item);
      tx.oncomplete=ok;tx.onerror=()=>no(tx.error);
     });
     const all=db=>new Promise((ok,no)=>{
      const tx=db.transaction('items','readonly'),req=tx.objectStore('items').getAll();
      tx.oncomplete=()=>ok(req.result);tx.onerror=()=>no(tx.error);
     });
     const a=await open('issue244-owner-a'),b=await open('issue244-owner-b');
     const initial=makeSyntheticCloset();
     await put(a,initial);await put(b,[makeSyntheticPiece('B-shirt','Tops','Polo'),makeSyntheticPiece('B-shoes','Shoes','Sneakers')]);
     const scoped=syntheticAuthSource({'A':await all(a),'B':await all(b)});scoped.signIn('A');
     const qa=createOfflineIntegrationQA(scoped),board={slots:{top:'top-1',bottom:'bottom-1',shoes:'shoes-1'}};
     const valid=await qa.present(board);
     if(valid.mode!=='3d-placeholder')throw Error('No verified placeholder: '+valid.reason);
     const payload=JSON.stringify(valid.renderer);
     if(payload.includes('data:')||payload.includes('/9j/')||payload.includes('ownerId'))throw Error('Photo/owner leaked into renderer input');
     const renderer=createDetailedHumanoid3D(document.querySelector('#renderer'));
     let webgl=false,turned=false,drawn=0;
     if(renderer.supported){
      if(!renderer.setOutfit(valid.renderer.colors))throw Error('Renderer rejected verified RGBA');
      if(!renderer.rotate(Math.PI/2)||!renderer.rotate(Math.PI*3/2))throw Error('360 rotation failed');
      const state=renderer.getState();webgl=true;turned=Math.abs(state.yaw)<.000001;drawn=state.drawn.length;
      let denied=false;
      try{renderer.setOutfit({top:[1,-5,0,1]});}catch{denied=true;}
      if(!denied||!turned||drawn===0)throw Error('WebGL colors or 360 contract violated');
     }
     // Browser WebGL is optional; unsupported renderer still must present 2D.
     const fallback=document.querySelector('#fallback');
     const showSafe2D=item=>{fallback.replaceChildren();const img=document.createElement('img');img.src=item.image;img.alt='Synthetic 2D clothing';fallback.append(img);};
     if(!webgl)showSafe2D(initial[0]);
     const saved=(await qa.save(board)).record;
     if((await qa.restore(saved)).mode!=='3d-placeholder')throw Error('Saved verified snapshot failed');
     const modified=structuredClone(initial);modified[0].originalPhoto.image=syntheticJPEGs.olive;
     if(modified[0].image!==initial[0].image)throw Error('Changed preview rather than full original');
     scoped.update('A',modified);
     const restore=await qa.restore(saved);
     if(restore.mode!=='2d')throw Error('Changed original was still 3D');
     showSafe2D(modified[0]);
     if(!fallback.querySelector('img')||!fallback.querySelector('img').src.startsWith('data:image/jpeg'))throw Error('Authorized 2D fallback missing');
     const jacket=await qa.present({slots:{...board.slots,layer2:'jacket-1'}});
     if(jacket.mode!=='2d'||jacket.board.slots.layer2!=='jacket-1')throw Error('Unsupported 3D jacket was lost');
     scoped.signIn('B');fallback.replaceChildren();if(renderer.supported)renderer.dispose();
     const after=await qa.restore(saved);
     if(after.mode!=='unavailable'||fallback.childNodes.length)throw Error('Cross-owner data retained');
     if((await all(b)).length!==2)throw Error('Account B wardrobe modified');
     a.close();b.close();
     return {sourceVerified:true,sharedOriginalSeparateCrops:true,realOwnerIndexedDB:true,webglSupported:webgl,
      rotated360:turned,garmentMeshesDrawn:drawn,rendererInputContainsImages:false,staleOriginalFallback2D:true,
      jacketFallback2D:true,crossOwnerBlocked:true};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    report.push({browser:name,width,...outcome,pageErrors:0,externalRequests:0});
    await context.close();
   }
  }finally{await browser.close();}
 }
 if(report.length!==6)throw Error('Missing mobile tests');
 console.log('ISSUE244_BROWSER_PASS '+JSON.stringify(report));
}finally{await new Promise(ok=>srv.close(ok));}
