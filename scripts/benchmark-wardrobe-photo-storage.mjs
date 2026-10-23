/**
 * Standalone synthetic wardrobe photo-storage benchmark. NO CUSTOMER PHOTOS,
 * cloud calls, paid APIs or production behavior changes.
 *
 * Use via Node 22 with Playwright installed:
 *   node scripts/benchmark-wardrobe-photo-storage.mjs
 * Writes raw measurements artifacts/issue235/benchmarks.json.
 */
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {performance as nodePerformance} from 'node:perf_hooks';

const root=resolve('public'),out='artifacts/issue235',sizes=[25,100,250,500];
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  if(pathname==='/offline-issue235'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'"});
   res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic wardrobe storage benchmark</title><main><div id="closet"></div></main><script src="/cloud-backup-engine.js"></script><script src="/outfit-board-engine.js"></script><script src="/issue235-local-fixtures.js"></script>');
   return;
  }
  if(pathname==='/issue235-local-fixtures.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end('window.cleanSavedOutfitBoard=(b,i)=>cleanOutfitBoard(b,i)');return;}
  const file=resolve(root,'.'+decodeURIComponent(pathname));if(!file.startsWith(root+sep))throw Error('Path escape');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain','Cache-Control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('missing');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const endpoint='http://127.0.0.1:'+server.address().port+'/offline-issue235';
const result={date:new Date().toISOString(),commit:process.env.GITHUB_SHA||'local',node:process.version,environment:{synthetic:true,realPhotos:false,physicalPhones:false,hostedCloud:false,cloudMetrics:'offline real CloudBackupEngine.mapImages and SHA-256, no transfer',idbMetrics:'real browser IndexedDB, not server-side Supabase',renderMetrics:'DOM gallery proxy and native cleanOutfitBoard, not full customer app boot',quotaMetrics:'injected QuotaExceededError plus real atomic IDB transaction abort, not actual device quota exhaustion'},rows:[],failures:[]};
try{
 for(const [browserName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],externals=[];
   page.on('pageerror',error=>errors.push(error.message));
   await context.route('**/*',route=>{
    if(!route.request().url().startsWith('http://127.0.0.1:')){externals.push(route.request().url());return route.abort('blockedbyclient');}
    return route.continue();
   });
   await page.goto(endpoint);
   for(const size of sizes){
    const measures=await page.evaluate(async size=>{
     const owner='11111111-1111-4111-8111-111111111111',id='closet-current-issue235-'+size;
     const tick=()=>performance.now();
     const sample=(n)=>{
      const c=document.createElement('canvas');c.width=512;c.height=768;
      const x=c.getContext('2d');
      x.fillStyle='hsl('+((n*37)%360)+' 65% 45%)';x.fillRect(0,0,c.width,c.height);
      for(let j=0;j<16;j++){x.fillStyle='hsl('+((n*23+j*19)%360)+' 50% 65%)';x.fillRect(15+j*24,20,6,690);}
      for(let j=0;j<10;j++){x.fillStyle='rgba(9,40,70,'+(.15+(j%3)*.1)+')';x.fillRect(30,42+j*65,430,4);}
      x.font='24px sans-serif';x.fillStyle='white';x.fillText('SYNTHETIC '+n,30,755);
      return c.toDataURL('image/jpeg',.91);
     };
     const setupStart=tick(),images=Array.from({length:size},(_,i)=>sample(i));
     const items=images.map((image,i)=>{
      const source=i>0&&i%8===0?images[i-1]:image;
      const cat=i%5===0?'Dresses':i%5===1?'Bottoms':i%5===2?'Shoes':i%5===3?'Outerwear':'Tops';
      const item={id:'item-'+i,image:source,category:cat,itemType:cat==='Tops'?'T-shirt':cat==='Bottoms'?'Jeans':cat==='Shoes'?'Sneakers':cat==='Dresses'?'Casual dress':'Jacket',name:'Synthetic '+cat+' '+i,color:'Blue',pattern:'Striped'};
      if(i%6===0&&i+1<size){item.outfitSourceId='outfit-'+Math.floor(i/6);item.originalPhoto={image:images[Math.floor(i/6)*6]};item.cropBounds={left:40,top:20,width:300,height:600};}
      return item;
     });
     const setupMs=tick()-setupStart;
     const record={id:'outfit-board',current:{id:'board-current',name:'Offline saved outfit',slots:{top:items.find(x=>x.category==='Tops')?.id,bottom:items.find(x=>x.category==='Bottoms')?.id,shoes:items.find(x=>x.category==='Shoes')?.id}},saved:[]};
     record.saved=Array.from({length:Math.min(25,Math.floor(size/5))},(_,i)=>({...structuredClone(record.current),id:'saved-'+i}));
     const state={ 'outfit-board':record },document={schemaVersion:1,items,state};
     ClosetBackupEngine.validateDocument(document);
     const encodedChars=items.reduce((sum,x)=>sum+x.image.length+(x.originalPhoto?.image.length||0),0);
     const uniqueUrls=new Set(items.flatMap(x=>[x.image,x.originalPhoto?.image].filter(Boolean)));
     const decodedJpegBytes=[...uniqueUrls].reduce((sum,x)=>sum+Math.floor((x.length-'data:image/jpeg;base64,'.length)*3/4),0);
     const estimateDecodedRGBABytes=uniqueUrls.size*512*768*4;
     const heapBefore=typeof performance.memory?.usedJSHeapSize==='number'?performance.memory.usedJSHeapSize:null;
     const open=(name)=>new Promise((resolve,reject)=>{
      const request=indexedDB.open(name,2);
      request.onupgradeneeded=()=>{const d=request.result;if(!d.objectStoreNames.contains('items'))d.createObjectStore('items',{keyPath:'id'});if(!d.objectStoreNames.contains('state'))d.createObjectStore('state',{keyPath:'id'});};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
     });
     const db=await open(id);
     const write=(dataset)=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      for(const row of dataset)tx.objectStore('items').put(row);
      tx.objectStore('state').put(record);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage write aborted'));
     });
     let start=tick();await write(items);const idbWriteMs=tick()-start;
     const read=()=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['items','state'],'readonly'),a=tx.objectStore('items').getAll(),b=tx.objectStore('state').get('outfit-board');
      tx.oncomplete=()=>resolve({items:a.result,board:b.result});
      tx.onerror=()=>reject(tx.error);
     });
     start=tick();const loaded=await read();const idbReadMs=tick()-start;
     if(loaded.items.length!==size)throw Error('IndexedDB item count changed');
     const gallery=document.getElementById('closet');gallery.replaceChildren();
     start=tick();
     // This measures the literal photo-backed DOM card construction cost.
     const fragment=document.createDocumentFragment();
     for(const item of loaded.items){const card=document.createElement('article'),img=document.createElement('img');img.loading='lazy';img.width=120;img.height=180;img.src=item.image;img.alt=item.name;card.append(img);fragment.append(card);}
     gallery.append(fragment);
     const closetDomBuildMs=tick()-start,closetCardCount=gallery.children.length;
     start=tick();
     const restored=loaded.board.saved.map(value=>window.cleanSavedOutfitBoard(value,loaded.items));
     const savedOutfitRestoreMs=tick()-start;
     if(restored.length!==record.saved.length||restored.some(x=>Object.keys(x.slots).length<3))throw Error('Saved outfit lost garments');
     const snapshotImages=loaded.items.map(item=>item.image);
     const previousSaved=JSON.stringify(loaded.board);
     // Real atomic aborted write, covering both item and board state.
     const abortStatus=await new Promise(resolve=>{
      const tx=db.transaction(['items','state'],'readwrite');tx.objectStore('items').put({...loaded.items[0],image:sample(50000+size)});
      tx.objectStore('state').put({...loaded.board,current:{slots:{top:'invalid'}}});
      tx.onabort=()=>resolve('aborted');
      tx.oncomplete=()=>resolve('unexpected committed');
      tx.abort();
     });
     if(abortStatus!=='aborted')throw Error('Interrupted IDB write committed');
     const recovered=await read();
     if(recovered.items[0].image!==snapshotImages[0]||JSON.stringify(recovered.board)!==previousSaved)throw Error('Interrupted transaction changed saved photographs/boards');
     // Inject a quota failure at the write boundary without exhausting runner disks.
     const quota=()=>Promise.reject(new DOMException('Injected temporary quota','QuotaExceededError'));
     let quotaRecovered=false;
     try{await quota();}catch(e){quotaRecovered=e.name==='QuotaExceededError';}
     const afterQuota=await read();if(!quotaRecovered||afterQuota.items.length!==size)throw Error('Quota simulation destroyed saved closet');
     // Deletion should clean only references, not silently invent replacement garments.
     const deleteId=record.current.slots.top;
     const deleteRead=()=>new Promise((resolve,reject)=>{
      const tx=db.transaction('items','readwrite');tx.objectStore('items').delete(deleteId);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     });
     await deleteRead();const afterDelete=await read();
     if(afterDelete.items.length!==size-1)throw Error('Delete not durable');
     start=tick();const restoredAfterDelete=window.cleanSavedOutfitBoard(afterDelete.board.current,afterDelete.items);const deletionRestoreMs=tick()-start;
     if(restoredAfterDelete.slots.top||!restoredAfterDelete.slots.bottom||!restoredAfterDelete.slots.shoes)throw Error('Deleted source not safely removed from restored board');
     // Cloud backup serializer is the actual existing engine. Hashes are computed
     // for each JPEG, but no object transfer or server API is ever made.
     const makePath=async image=>{
      const raw=Uint8Array.from(atob(image.slice('data:image/jpeg;base64,'.length)),ch=>ch.charCodeAt(0));
      const digest=await crypto.subtle.digest('SHA-256',raw);
      const hex=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
      return 'closet-photo:'+owner+'/'+hex+'.jpg';
     };
     start=tick();let visits=0;
     const baselineDocument=await ClosetBackupEngine.mapImages(document,async image=>{visits++;return makePath(image);});
     ClosetBackupEngine.validateDocument(baselineDocument);
     const cloudEncodeMs=tick()-start,cloudSerializedBytes=new TextEncoder().encode(JSON.stringify(baselineDocument)).length;
     // Candidate exact-byte memoization is tested only OFFLINE. Do not change
     // the customer's SHA-256 object naming or photographs.
     const cache=new Map();start=tick();let memoHashes=0;
     const memoDoc=await ClosetBackupEngine.mapImages(document,async image=>{
      if(!cache.has(image)){memoHashes++;cache.set(image,makePath(image));}
      return cache.get(image);
     });
     const memoCloudEncodeMs=tick()-start;
     if(JSON.stringify(memoDoc)!==JSON.stringify(baselineDocument))throw Error('Memoized encoding changed source/owner/path');
     // Large JPEG within the 8 MiB bucket limit, using synthetic canvas bytes.
     const largeStart=tick();
     const large=document.createElement('canvas');large.width=2048;large.height=3072;
     const lx=large.getContext('2d');lx.fillStyle='#385799';lx.fillRect(0,0,2048,3072);
     for(let j=0;j<160;j++){lx.fillStyle='rgba(255,255,255,.33)';lx.fillRect((j*193)%2048,j*17,18,2048);}
     const largeImage=large.toDataURL('image/jpeg',.94);
     const largeJpegBytes=Math.floor((largeImage.length-'data:image/jpeg;base64,'.length)*.75);
     if(largeJpegBytes>8388608)throw Error('Synthetic large JPEG exceeded cloud limit');
     const largePhotoGenerationMs=tick()-largeStart;
     const heapAfter=typeof performance.memory?.usedJSHeapSize==='number'?performance.memory.usedJSHeapSize:null;
     db.close();
     gallery.replaceChildren();
     // Wipe only the test's randomly scoped synthetic IndexedDB.
     await new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(id);req.onsuccess=resolve;req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Synthetic DB deletion blocked'));});
     return {garments:size,setupMs,idbWriteMs,idbReadMs,closetDomBuildMs,closetCardCount,
      savedOutfitRestoreMs,savedOutfitCount:restored.length,deletionRestoreMs,encodedChars,
      retainedJpegBytesApprox:decodedJpegBytes,estimatedAllImagesDecodedRGBABytes:estimateDecodedRGBABytes,
      exactDistinctImages:uniqueUrls.size,cloudEncodeMs,memoCloudEncodeMs,shaOperations:visits,memoShaOperations:memoHashes,
      cloudSerializedBytes,largeJpegBytes,largePhotoGenerationMs,transactionAbortPreserved:true,
      quotaInjectedRecovered:true,deletedSourcePruned:true,duplicateSourcesPresent:uniqueUrls.size<visits,
      heapBefore,heapAfter,storageEstimate:await navigator.storage?.estimate?.().catch(()=>null)||null,
      physicalDevice:false};
    },size);
    assert.equal(measures.closetCardCount,size);
    assert.equal(measures.transactionAbortPreserved,true);
    assert.equal(measures.deletedSourcePruned,true);
    assert.equal(measures.quotaInjectedRecovered,true);
    assert.equal(measures.duplicateSourcesPresent,true);
    result.rows.push({browser:browserName,...measures,
      browserVersion:browser.version(),viewport:390});
    process.stdout.write('STORAGE_BENCH '+JSON.stringify({browser:browserName,garments:size,
      idbWriteMs:+measures.idbWriteMs.toFixed(2),idbReadMs:+measures.idbReadMs.toFixed(2),
      closetDomBuildMs:+measures.closetDomBuildMs.toFixed(2),savedOutfitRestoreMs:+measures.savedOutfitRestoreMs.toFixed(2),
      cloudEncodeMs:+measures.cloudEncodeMs.toFixed(2),memoCloudEncodeMs:+measures.memoCloudEncodeMs.toFixed(2),
      retainedJpegBytesApprox:measures.retainedJpegBytesApprox,cloudSerializedBytes:measures.cloudSerializedBytes,
      distinctImages:measures.exactDistinctImages,shaOperations:measures.shaOperations,memoHashes:measures.memoShaOperations,
      largeJpegBytes:measures.largeJpegBytes})+'\n');
   }
   assert.deepEqual(errors,[]);assert.deepEqual(externals,[]);
   await context.close();
  }finally{await browser.close();}
 }
}finally{
 await new Promise(resolve=>server.close(resolve));
 await mkdir(out,{recursive:true});
 await writeFile(out+'/benchmarks.json',JSON.stringify(result,null,2)+'\n');
}
if(result.rows.length!==8)throw Error('Expected eight complete browser/size measurements, got '+result.rows.length);
console.log('ISSUE235_BENCHMARK_COMPLETE '+JSON.stringify({measurements:result.rows.length,synthetic:true,externalServices:false}));
