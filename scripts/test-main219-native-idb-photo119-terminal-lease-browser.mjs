/**
 * MAIN219: test ACTUAL Chromium/WebKit native IndexedDB commit behavior at
 * PHOTO119's postcommit acknowledgment. Public SHA-locked Commons-0053 JPEG,
 * explicit SYNTHETIC owner-review, no hosted auth, deploy, real owner data,
 * live model, phone, release, 3D or silent wardrobe save.
 *
 * Transaction writes and completion are the browser's real IDB objects.
 * Only the original tx.oncomplete callback registration is wrapped to deliver
 * a deterministic owner/session change at the exact event boundary.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';

const engine=process.env.M219_ENGINE;
assert.ok(['chromium','webkit'].includes(engine),'M219_ENGINE must be genuine chromium or webkit');
const jpeg=await readFile('benchmark/fixtures/commons-0053.jpg');
assert.equal(jpeg[0],255);assert.equal(jpeg[1],216);
const sha=createHash('sha256').update(jpeg).digest('hex');
const dataURI='data:image/jpeg;base64,'+jpeg.toString('base64');
const root=resolve('.');
const mime={'.mjs':'text/javascript','.js':'text/javascript'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const path=decodeURIComponent(url.pathname);
  if(req.method!=='GET'||path.includes('\\')||path.includes('\0')||
    path.split('/').includes('..'))throw Error('unsupported request');
  if(path==='/'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});
   res.end('<!doctype html><html><head><meta charset="utf-8"></head><body>Native PHOTO119 IDB acceptance, no user data</body></html>');
   return;
  }
  if(!path.startsWith('/public/')||!/\.m?js$/.test(path))
   throw Error('not public module');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/public/'))throw Error('outside public modules');
  const data=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'text/javascript',
   'cache-control':'no-store'});
  res.end(data);
 }catch{res.writeHead(404);res.end('M219 denied');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const errors=[];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 for(const width of [320,390,430]){
  const context=await browser.newContext({
   viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'
  });
  const outbound=[];
  try{
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===origin&&route.request().method()==='GET')return route.continue();
    outbound.push({host:u.hostname,method:route.request().method()});
    return route.abort();
   });
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push({width,kind:String(error?.name||'pageerror')}));
   page.on('crash',()=>errors.push({width,kind:'crash'}));
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   const receipt=await page.evaluate(async({dataURI,sha,width})=>{
    const {commitHumanReviewedPhoto119}=await import('/public/native-reviewed-private-save-167.mjs');
    const open=(owner)=>new Promise((resolve,reject)=>{
     const r=indexedDB.open('closet-current-user-'+owner,1);
     r.onupgradeneeded=()=>{
      r.result.createObjectStore('items',{keyPath:'id'});
      r.result.createObjectStore('state',{keyPath:'id'});
     };
     r.onsuccess=()=>resolve(r.result);
     r.onerror=()=>reject(r.error);
    });
    const stageDraft=(db,row)=>new Promise((resolve,reject)=>{
     const tx=db.transaction('state','readwrite');
     tx.objectStore('state').put({id:'draft',batch:[structuredClone(row)],
      unknownFuture:{unchanged:true}});
     tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);
    });
    const inspect=(db)=>new Promise((resolve,reject)=>{
     const tx=db.transaction(['items','state'],'readonly');
     const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').get('draft');
     tx.oncomplete=()=>resolve({items:a.result,draft:b.result});
     tx.onerror=tx.onabort=()=>reject(tx.error);
    });
    const cases=[];
    for(const mode of ['stable','same-owner-new-epoch','different-owner','review-edited']){
     const owner='m219-synthetic-'+width+'-'+mode;
     const db=await open(owner);
     try{
      const record={id:'reviewed-photo',ownerId:owner,
       image:dataURI,originalPhoto:{image:dataURI,sha256:sha},
       sourceSHA256:sha,sourceHashVerified:true,
       category:'Uncategorized',itemType:'Unknown',color:'Unknown',
       singleGarmentVerified:false};
      const review={confirmed:true,recordId:record.id,originalSHA256:sha,
       category:'Bottoms',itemType:'Jeans',color:'Blue',singleGarmentConfirmed:true};
      await stageDraft(db,record);
      let current=owner,epoch=0,transactionCompleted=false;
      const dbAdapter={
       name:db.name,objectStoreNames:db.objectStoreNames,
       transaction(names,modeOfTx){
        const tx=db.transaction(names,modeOfTx);
        if(modeOfTx!=='readwrite'||!Array.isArray(names)||
           !names.includes('items')||!names.includes('state'))return tx;
        // Real browser transaction, real requests and real completion event.
        return {
         objectStore:name=>tx.objectStore(name),
         abort:()=>tx.abort(),
         get error(){return tx.error;},
         set oncomplete(fn){
          tx.oncomplete=e=>{
           transactionCompleted=true;
           if(mode==='same-owner-new-epoch')epoch++;
           if(mode==='different-owner')current='another-synthetic-owner';
           if(mode==='review-edited')review.color='Red';
           fn(e);
          };
         },
         set onabort(fn){tx.onabort=fn;},
         set onerror(fn){tx.onerror=fn;}
        };
       }
      };
      let result,reason=null;
      try{
       result=await commitHumanReviewedPhoto119({
        db:dbAdapter,ownerId:owner,currentOwner:()=>current,
        record,review,assertLease:()=>epoch===0,cryptoProvider:crypto
       });
      }catch(e){reason=String(e?.message||e);}
      const rows=await inspect(db);
      if(transactionCompleted!==true)throw Error('IDB did not actually complete');
      if(rows.items.length!==1||rows.items[0].ownerId!==owner||
          rows.items[0].originalPhoto.image!==dataURI||
          rows.items[0].color!=='Blue')throw Error('original owner committed photo incorrect');
      if(rows.draft.batch.length!==0||rows.draft.unknownFuture?.unchanged!==true)
       throw Error('atomic original owner items/draft state incorrect');
      const live=mode==='stable';
      if(live&&(!result?.saved||result?.familyAlpha!=='HOLD'||result?.releaseAuthorized!==false))
       throw Error('genuine stable signed owner must receive acknowledged saved confirmation');
      if(!live&&(result!==undefined||reason!=='PHOTO119_SESSION_REVOKED_AFTER_COMMIT_RELOAD'))
       throw Error('genuine postcommit revoked lease returned unsafe acknowledgment');
      cases.push({mode,realBrowserIndexedDBCommitted:true,
       originalPrivatePhotoPreserved:true,sourceSHA256Verified:true,
       staleAcknowledgmentDenied:!live,stableSaved:live,
       silentAutoSave:false,releaseAllowed:false});
     }finally{db.close();}
    }
    return {width,cases};
   },{dataURI,sha,width});
   assert.equal(receipt.cases.length,4);
   assert.deepEqual(outbound,[],'M219 private JPEG or owner data egress forbidden');
   assert.deepEqual(errors,[],'M219 actual browser errors forbidden');
   console.log('M219_REAL_BROWSER_PHOTO119_POSTCOMMIT_LEASE_PASS',JSON.stringify({
    engine,width,actualNativeIDB:true,exactLicensedJPEGSourceSHA256:sha,
    tests:receipt.cases,hostedRLS:false,realPhone:false,
    independentHumanLabelAccuracy:false,photoFitted3D:false,
    familyAlpha:'HOLD',releaseAllowed:false
   }));
  }finally{await context.close();}
 }
}finally{
 await browser?.close().catch(()=>{});
 await new Promise(resolve=>server.close(resolve));
}
