/** NO DEPLOY: self-contained synthetic Chromium/WebKit IndexedDB/source audit. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('public');
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),file=url.pathname==='/__source-audit'?'':resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file){res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'none';script-src 'self';style-src 'unsafe-inline';img-src data:;connect-src 'none'"});res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline source/owner QA</title><style>*{box-sizing:border-box}body{margin:0;max-width:100%;padding:8px;font-family:sans-serif}main{max-width:100%}pre{overflow-wrap:anywhere;white-space:pre-wrap}</style><main><h1>Account-bound photo provenance QA — synthetic</h1><pre>Browser storage fixtures only; no real customer data.</pre></main>');return;}
  if(!file.startsWith(root+sep))throw Error('bad path');
  const content=await readFile(file);res.writeHead(200,{'Content-Type':extname(file)==='.mjs'?'text/javascript':'application/javascript','Cache-Control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port+'/__source-audit';
const summary=[];
try{
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:740},serviceWorkers:'block',deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[],remote=[];
    page.on('pageerror',err=>errors.push(err.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith('http://127.0.0.1:')){remote.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(base);
    const result=await page.evaluate(async()=>{
     const {auditRetainedPhotoProvenance,snapshotSourceHashes,verifyRestoredSources,verifyStoredCloudJPEG}=await import('/original-source-provenance-audit.mjs');
     const ownerA='11111111-1111-4111-8111-111111111111',ownerB='22222222-2222-4222-8222-222222222222';
     const c=document.createElement('canvas');c.width=64;c.height=80;const x=c.getContext('2d');
     const photo=(tone)=>{x.fillStyle=tone;x.fillRect(0,0,64,80);return c.toDataURL('image/jpeg',.94);};
     const original=photo('#553397'),crop=photo('#236987'),recognition=photo('#886622');
     const board={id:'outfit-board',current:{slots:{top:'shirt',bottom:'pants'}},saved:[{slots:{top:'shirt'}}]};
     const fixture=[
      {id:'shirt',image:crop,outfitSourceId:'same-capture',originalPhoto:{image:original},recognitionPhoto:{image:recognition}},
      {id:'pants',image:recognition,outfitSourceId:'same-capture',originalPhoto:{image:original}}
     ];
     const ctx=owner=>({authenticatedUserId:owner,indexedDbName:'closet-current-user-'+owner,currentUserId:owner,cloudOwnerId:owner});
     const put=owner=>new Promise((resolve,reject)=>{
      const req=indexedDB.open('closet-current-user-'+owner,2);
      req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('items',{keyPath:'id'});db.createObjectStore('state',{keyPath:'id'});};
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>{
       const db=req.result,tx=db.transaction(['items','state'],'readwrite');
       for(const row of fixture)tx.objectStore('items').put(row);
       tx.objectStore('state').put(board);
       tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);
      };
     });
     const get=owner=>new Promise((resolve,reject)=>{
      const req=indexedDB.open('closet-current-user-'+owner,2);
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>{
       const db=req.result,tx=db.transaction(['items','state'],'readonly'),all=tx.objectStore('items').getAll(),state=tx.objectStore('state').get('outfit-board');
       tx.oncomplete=()=>{const data={items:all.result,state:{'outfit-board':state.result}};db.close();resolve(data);};
       tx.onerror=()=>reject(tx.error);
      };
     });
     await put(ownerA);
     const local=await get(ownerA),audit=await auditRetainedPhotoProvenance(local,ctx(ownerA));
     const saved=snapshotSourceHashes(local.state['outfit-board'].current,audit);
     if(audit.garments.get('shirt').originalSha256!==audit.garments.get('pants').originalSha256)throw Error('Multi-source SHA mismatch');
     verifyRestoredSources(saved,audit);
     let otherDenied=false;
     try{await auditRetainedPhotoProvenance(local,{...ctx(ownerA),currentUserId:ownerB});}catch{otherDenied=true;}
     let crossRestoreDenied=false;
     try{verifyRestoredSources(saved,await auditRetainedPhotoProvenance(local,ctx(ownerB)));}catch{crossRestoreDenied=true;}
     const beforeCrop=local.items[0].image;
     local.items[0].originalPhoto.image=photo('#113c75');
     const modified=await auditRetainedPhotoProvenance(local,ctx(ownerA));
     let originalChangedDenied=false;
     try{verifyRestoredSources(saved,modified);}catch{originalChangedDenied=true;}
     const c2=new TextEncoder().encode('raw-test');
     const fake='data:image/jpeg;base64,'+btoa('test');
     let invalidDenied=false;
     try{await auditRetainedPhotoProvenance({items:[{id:'bad',image:fake}],state:{}},ctx(ownerA));}catch{invalidDenied=true;}
     return {sameOutfitSourceAllowed:true,unchangedCrop:beforeCrop===local.items[0].image,
      originalChangedDenied,otherDenied,crossRestoreDenied,invalidDenied,
      realJPEGOriginal:original.startsWith('data:image/jpeg;base64,'),itemCount:audit.garments.size,
      physicalPhone:false,liveCloud:false};
    });
    assert.deepEqual([result.otherDenied,result.crossRestoreDenied,result.originalChangedDenied,result.invalidDenied,result.unchangedCrop,result.sameOutfitSourceAllowed],[true,true,true,true,true,true]);
    assert.equal(result.itemCount,2);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
    summary.push({engine:name,width,...result,pageErrors:errors.length,externalRequests:remote.length});
    await context.close();
   }
  }finally{await browser.close();}
 }
 console.log('ASSIGNMENT232_ORIGINAL_PROVENANCE '+JSON.stringify(summary));
}finally{await new Promise(done=>server.close(done));}
