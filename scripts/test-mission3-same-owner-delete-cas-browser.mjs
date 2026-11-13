// Real Chromium and WebKit native IndexedDB same-account two-tab delete CAS.
// All garments/JPEGs/users are synthetic and local. No hosted Supabase writes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-same-owner-delete-cas-browser');
await mkdir(out,{recursive:true});
const jpg=await sharp({create:{width:96,height:72,channels:3,
 background:{r:83,g:140,b:193}}}).jpeg({quality:90}).toBuffer();
const photo='data:image/jpeg;base64,'+jpg.toString('base64');
const originalSHA=createHash('sha256').update(jpg).digest('hex');
const root=resolve('public');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/')||pathname.includes('\\'))throw Error('Bad source path');
  const data=await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port,results=[],pageErrors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]])
 for(const width of [320,390,430]){
  const owner='a'+width+'0000-0000-4000-8000-000000000000',
   other='b'+width+'0000-0000-4000-8000-000000000000';
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  const context=await browser.newContext({viewport:{width,height:844},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const offHost=[];
  try{
   await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',
    body:"window.closetAuth={user:{id:'"+owner+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
   await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',
    body:'window.closetCloud={start:async()=>({}),beforeWrite:async()=>{},changed:()=>{}};'}));
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.hostname==='127.0.0.1'||['blob:','data:'].includes(u.protocol))return route.fallback();
    offHost.push({host:u.hostname,url:u.pathname,method:route.request().method});return route.abort();
   });
   await context.addInitScript(()=>{
    class OfflineRecognitionWorker{
     constructor(){this.onmessage=null;this.terminated=false;}
     postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:
      {id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}}
     });},0);}
     terminate(){this.terminated=true;}
    }
    Object.defineProperty(window,'Worker',{value:OfflineRecognitionWorker,configurable:true});
   });
   const a=await context.newPage();a.on('pageerror',error=>pageErrors.push({engine,width,error:String(error)}));
   await a.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await a.evaluate(()=>closetReady);
   const seed=await a.evaluate(async({owner,photo,originalSHA})=>{
    const original=normalizeClothing({
     id:'same-owner-delete-cas-original',name:'Blue cotton top',
     category:'Tops',itemType:'T-shirt',color:'Blue',ownerId:owner,image:photo,
     sourceSHA256:originalSHA,sourceHashVerified:true,
     originalPhoto:{image:photo,sha256:originalSHA,width:96,height:72,origin:'photo-file'}
    });
    await writeAll([original]);
    return {id:original.id,sourceSHA256:original.sourceSHA256};
   },{owner,photo,originalSHA});
   await a.reload({waitUntil:'domcontentloaded'});
   await a.evaluate(()=>closetReady);
   assert.equal(await a.evaluate(()=>items.length),1);
   const stale=await a.evaluate(()=>{
    const row=items.find(x=>x.id==='same-owner-delete-cas-original');
    return {id:row.id,name:row.name,color:row.color,sha:row.sourceSHA256};
   });
   const b=await context.newPage();b.on('pageerror',error=>pageErrors.push({engine,width,error:String(error)}));
   await b.goto(origin+'/',{waitUntil:'domcontentloaded'});await b.evaluate(()=>closetReady);
   // Another tab changes the same garment in its *real owner-only native*
   // IndexedDB transaction, without changing the original photograph.
   const newRow=await b.evaluate(async()=>{
    const row=items.find(x=>x.id==='same-owner-delete-cas-original');
    if(!row)throw Error('Original saved item is unavailable');
    const updated={...structuredClone(row),color:'Red',
     notes:'Changed in second signed tab'};
    await new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     tx.objectStore('items').put(updated);
     tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
    });
    return {id:updated.id,color:updated.color,notes:updated.notes};
   });
   // The ordinary Adjust-photo save must not overwrite the newer same-owner
   // tab's revised garment or silently replace it as a "new" duplicate ID.
   const saveAttempt=async expected=>a.evaluate(async({expected})=>{
    const row=items.find(x=>x.id==='same-owner-delete-cas-original');
    try{
     await savePiece({...structuredClone(row),color:'Green',
      notes:'Older tab must not win'},[],{expectedSavedRow:expected?structuredClone(row):null});
     return {status:'unexpected-overwrite'};
    }catch(error){return {status:'rejected',message:String(error?.message||error)};}
   },{expected});
   const staleSavedAdjust=await saveAttempt(true);
   assert.equal(staleSavedAdjust.status,'rejected');
   assert.match(staleSavedAdjust.message,/CLOSET_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
   const collidingNewSave=await saveAttempt(false);
   assert.equal(collidingNewSave.status,'rejected');
   assert.match(collidingNewSave.message,/CLOSET_ALREADY_SAVED_RELOAD_WARDROBE/);
   // The still-open first tab has a stale BLUE saved-row snapshot. Exercise
   // the actual app.js crop callback against native same-owner IndexedDB:
   // the second tab's newer RED original must survive a stale image crop.
   const invokeCrop=async page=>page.evaluate(async()=>{
    const row=items.find(x=>x.id==='same-owner-delete-cas-original');
    if(!row)throw Error('Saved test garment not found');
    const priorOpen=window.openPhotoCrop,priorCheck=window.checkPhoto;
    let operations=null;
    window.openPhotoCrop=(item,config)=>{operations=config;return Promise.resolve();};
    window.checkPhoto=async()=>({colorEstimate:null,signature:'crop-fixture',aspect:1});
    try{
     cropClothingPhoto(row);
     if(!operations?.save)throw Error('The real crop controller did not open');
     await operations.save({image:row.image,
      cropBounds:{x:0,y:0,width:1,height:1}},null);
     return {status:'saved'};
    }catch(error){return {status:'rejected',message:String(error?.message||error)};}
    finally{window.openPhotoCrop=priorOpen;window.checkPhoto=priorCheck;}
   });
   const staleCrop=await invokeCrop(a);
   assert.equal(staleCrop.status,'rejected');
   assert.match(staleCrop.message,/CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
   const staleResult=await a.evaluate(async()=>{
    try{await removeItem('same-owner-delete-cas-original',
     items.find(x=>x.id==='same-owner-delete-cas-original'));
     return {status:'unexpected-deleted'};}
    catch(error){return {status:'rejected',message:String(error.message)};}
   });
   assert.equal(staleResult.status,'rejected');
   assert.match(staleResult.message,/CLOSET_STALE_DELETE_REOPEN_EDITOR/);
   const preserved=await b.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').get('same-owner-delete-cas-original');
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   }));
   assert.equal(preserved.color,'Red');
   assert.equal(preserved.notes,'Changed in second signed tab');
   assert.equal(preserved.originalPhoto.sha256,originalSHA);
   assert.equal(preserved.originalPhoto.image,photo);
   // Even when a duplicate ID is already gone, stale UI must NOT pretend
   // deletion succeeded. A fresh review must re-open the newer row.
   await a.reload({waitUntil:'domcontentloaded'});await a.evaluate(()=>closetReady);
   const updatedInA=await a.evaluate(()=>{
    const row=items.find(x=>x.id==='same-owner-delete-cas-original');
    return {color:row.color,notes:row.notes};
   });
   assert.equal(updatedInA.color,'Red');
   // After reloading the revised row, cropping it normally may proceed.
   const freshCrop=await invokeCrop(a);
   assert.equal(freshCrop.status,'saved');
   const accepted=await a.evaluate(async()=>{
    await removeItem('same-owner-delete-cas-original',
     items.find(x=>x.id==='same-owner-delete-cas-original'));
    return {status:'deleted-after-review'};
   });
   assert.equal(accepted.status,'deleted-after-review');
   const deleted=await b.evaluate(()=>new Promise((resolve,reject)=>{
    const q=db.transaction('items').objectStore('items').get('same-owner-delete-cas-original');
    q.onsuccess=()=>resolve(q.result===undefined);q.onerror=()=>reject(q.error);
   }));
   assert.equal(deleted,true);
   // Different owner private database is untouched.
   const unrelated=await b.evaluate(async({other,photo,originalSHA})=>{
    const d=await new Promise((resolve,reject)=>{
     const q=indexedDB.open('closet-current-user-'+other,2);
     q.onupgradeneeded=()=>{
      if(!q.result.objectStoreNames.contains('items'))
       q.result.createObjectStore('items',{keyPath:'id'});
      if(!q.result.objectStoreNames.contains('state'))
       q.result.createObjectStore('state',{keyPath:'id'});
     };
     q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    const item={id:'other-account-private-item',ownerId:other,
     image:photo,originalPhoto:{image:photo,sha256:originalSHA}};
    await new Promise((resolve,reject)=>{
     const tx=d.transaction('items','readwrite');tx.objectStore('items').put(item);
     tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
    });
    const found=await new Promise((resolve,reject)=>{
     const q=d.transaction('items').objectStore('items').get(item.id);
     q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    d.close();return {id:found.id,ownerId:found.ownerId};
   },{other,photo,originalSHA});
   assert.deepEqual(unrelated,{id:'other-account-private-item',ownerId:other});
   // All off-host requests are intentionally aborted by the route above.
   // An unrelated public model API can attempt a POST while offline; that
   // is not a successful cloud write. Explicitly reject any attempted
   // mutation of hosted Supabase Auth/Storage instead.
   assert.equal(offHost.filter(x=>x.host.endsWith('supabase.co')&&
    x.method!=='GET').length,0,'No attempted hosted Supabase mutations');
   const image=await a.screenshot({path:resolve(out,engine+'-'+width+'-cas.png')});
   assert.equal((await sharp(image).metadata()).width,width);
   results.push({engine,width,originalSHA256:originalSHA,
    nativeIndexedDB:true,staleTwoTabDeleteRejected:true,
    staleTwoTabCropRejected:true,freshReviewedCropSucceeds:true,
    staleSameOwnerPhotoSaveRejected:true,collidingNewPhotoSaveRejected:true,
    originalPreservedAfterConflict:true,reviewedLatestDeleteSucceeds:true,
    secondOwnerUntouched:true,hostedSupabase:false,physicalPhone:false,
    screenshotSHA256:createHash('sha256').update(image).digest('hex')});
  }finally{await context.close();await browser.close();}
 }
 assert.equal(results.length,6);assert.deepEqual(pageErrors,[]);
 const receipt=JSON.stringify({milestone:'mission3-same-owner-stale-delete-cas',
  familyAlphaHold:true,syntheticOnly:true,
  cropCASAcrossSameOwnerTabs:true,cases:results,pageErrors},null,2)+'\n';
 await writeFile(resolve(out,'results.json'),receipt);
 await writeFile(resolve(out,'sha256.txt'),
  createHash('sha256').update(receipt).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit 320/390/430 real IndexedDB two-tab edited garment deletion CAS + original JPEG preservation');
}finally{server.close();}
