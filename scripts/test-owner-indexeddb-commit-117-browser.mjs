/**
 * PHOTO117 research-only REAL Chromium IndexedDB acceptance: 320/390/430 px.
 * One original public-license JPEG, synthetic classification (NOT model
 * accuracy), actual browser WebCrypto + IndexedDB transactions; NO DEPLOY.
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=process.cwd();
const jpeg=readFileSync('benchmark/fixtures/commons-0053.jpg');
const dataURL='data:image/jpeg;base64,'+jpeg.toString('base64');
const SHA=createHash('sha256').update(jpeg).digest('hex');
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/__photo117_blank'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store'});
   res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="status">Research owner atomic save test</main></body></html>');
   return;
  }
  if(!['.mjs','.js'].includes(extname(pathname)))throw Error('unsupported type');
  const filename=resolve(root,'.'+pathname);
  if(!filename.startsWith(root+sep))throw Error('outside test checkout');
  const src=readFileSync(filename);
  res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8',
   'Cache-Control':'no-store'});
  res.end(src);
 }catch{
  res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');
 }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address();
const rootURL='http://127.0.0.1:'+address.port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 for(const width of [320,390,430]){
  const context=await browser.newContext({
   viewport:{width,height:820},isMobile:true,hasTouch:true,
   deviceScaleFactor:1
  });
  try{
   const page=await context.newPage();
   await page.goto(rootURL+'/__photo117_blank',{waitUntil:'domcontentloaded'});
   const outcome=await page.evaluate(async({width,dataURL,SHA})=>{
    const mod=await import('/research/owner-indexeddb-commit-117/atomic-reviewed-save.mjs');
    const ownerId='research-browser-owner-'+width;
    const db=await new Promise((resolve,reject)=>{
     const r=indexedDB.open('closet-current-user-'+ownerId,2);
     r.onupgradeneeded=()=>{
      r.result.createObjectStore('items',{keyPath:'id'});
      r.result.createObjectStore('state',{keyPath:'id'});
     };
     r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    const record={
     id:'garment-from-original',ownerId,image:dataURL,
     originalPhoto:{image:dataURL,sha256:SHA},
     sourceSHA256:SHA,sourceHashVerified:true,singleGarmentVerified:true,
     category:'Uncategorized',itemType:'Unknown',
     color:'Blue',confirmedColor:true
    };
    const extra={id:'another-pending-dress',name:'Keep this unsaved'};
    const initialDraft={id:'draft',batch:[structuredClone(record),extra],
     futureMetadata:{must:'retain'}};
    await new Promise((resolve,reject)=>{
     const tx=db.transaction('state','readwrite');
     tx.objectStore('state').put(initialDraft);
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const recognition={
     strong:true,
     choices:[{category:'Bottoms',itemType:'Jeans',score:.96}],
     details:{color:'Blue'}
    };
    const saved=await mod.commitOriginalPhotoToPrivateCloset117({
     db,ownerId,currentOwner:()=>ownerId,record,recognition
    });
    const current=await new Promise((resolve,reject)=>{
     const tx=db.transaction(['items','state'],'readonly');
     let items,draft;
     tx.objectStore('items').getAll().onsuccess=e=>items=e.target.result;
     tx.objectStore('state').get('draft').onsuccess=e=>draft=e.target.result;
     tx.oncomplete=()=>resolve({items,draft});
     tx.onabort=()=>reject(tx.error);
    });
    let deniedReopen=false;
    try{
     await mod.commitOriginalPhotoToPrivateCloset117({
      db,ownerId,currentOwner:()=>ownerId,record,recognition
     });
    }catch{deniedReopen=true;}
    let deniedOtherOwner=false;
    try{
     await mod.commitOriginalPhotoToPrivateCloset117({
      db,ownerId:'foreign-owner',currentOwner:()=> 'foreign-owner',
      record,recognition
     });
    }catch{deniedOtherOwner=true;}
    const result={
     width,realBrowserIndexedDB:typeof indexedDB==='object',
     realBrowserCrypto:typeof crypto.subtle.digest==='function',
     saved:saved.saved,bodyStatus:saved.status,
     storedExactlyOnce:current.items.length===1,
     category:current.items[0]?.category,
     itemType:current.items[0]?.itemType,
     color:current.items[0]?.color,
     ownerBound:current.items[0]?.ownerId===ownerId,
     originalJPEGUnchanged:current.items[0]?.image===dataURL&&
      current.items[0]?.originalPhoto?.image===dataURL&&
      current.items[0]?.sourceSHA256===SHA,
     remainingDraftCount:current.draft?.batch?.length,
     remainingDraftId:current.draft?.batch?.[0]?.id,
     futureMetadataPreserved:current.draft?.futureMetadata?.must==='retain',
     duplicateReopenBlocked:deniedReopen,foreignOwnerDBBlocked:deniedOtherOwner,
     noPrivatePhotoOrOwnerInResponse:
      !JSON.stringify(saved).includes('data:image/')&&
      !JSON.stringify(saved).includes(ownerId)&&
      !JSON.stringify(saved).includes(SHA),
     familyAlpha:saved.familyAlpha,releaseAuthorized:saved.releaseAuthorized
    };
    document.getElementById('status').textContent=
     result.saved&&result.originalJPEGUnchanged&&result.duplicateReopenBlocked
     ?'Public research original photo + real IndexedDB atomic save VERIFIED'
     :'Source or save NOT VERIFIED';
    db.close();
    return result;
   },{width,dataURL,SHA});
   for(const [field,expected] of Object.entries({
    realBrowserIndexedDB:true,realBrowserCrypto:true,saved:true,
    bodyStatus:'saved',storedExactlyOnce:true,category:'Bottoms',
    itemType:'Jeans',color:'Blue',ownerBound:true,
    originalJPEGUnchanged:true,remainingDraftCount:1,
    remainingDraftId:'another-pending-dress',futureMetadataPreserved:true,
    duplicateReopenBlocked:true,foreignOwnerDBBlocked:true,
    noPrivatePhotoOrOwnerInResponse:true,familyAlpha:'HOLD',
    releaseAuthorized:false
   }))assert.deepEqual(outcome[field],expected,'width '+width+' / '+field);
   assert.equal(await page.locator('#status').textContent(),
    'Public research original photo + real IndexedDB atomic save VERIFIED');
   results.push(outcome);
  }finally{await context.close();}
 }
 mkdirSync('benchmark/owner-indexeddb-commit-117',{recursive:true});
 writeFileSync('benchmark/owner-indexeddb-commit-117/browser-results.json',
  JSON.stringify({
   research:true,realBrowser:'Chromium',realSourceSHA256:SHA,
   sourceLicense:'existing repository public-license fixture',
   scientificColorOrSubtypeAccuracyMeasured:false,
   actualPhysicalPhonesTested:false,
   actualCloudAuthRLSVerified:false,
   realProductionAppWired:false,
   familyAlpha:'HOLD',releaseAuthorized:false,scenarios:results
  },null,2));
 console.log('PHOTO117 real Chromium IndexedDB original-license source 3/3 viewports PASS; research-only no deployment');
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
