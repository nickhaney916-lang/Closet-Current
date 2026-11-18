/**
 * M221: real Chromium/WebKit IndexedDB terminal lease acceptance of the
 * EXISTING M3 v3 owner-confirmed atomic importer. The test uses an independently
 * SHA-pinned public licensed original JPEG and synthetic owner IDs. No hosted
 * cloud, production, private data, deployment, or 3D claims.
 *
 * Important: prepareDefaultAtomicM3 validates the ORIGINAL v3 source first.
 * The only adapter wraps the REAL readwrite transaction's native oncomplete
 * callback, so the owner/epoch changes at the genuine durable-commit boundary.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';

const engine=process.env.M221_ENGINE;
assert.ok(['chromium','webkit'].includes(engine),'Require actual browser engine');
const bytes=await readFile('benchmark/fixtures/commons-0053.jpg');
const sourceSHA=createHash('sha256').update(bytes).digest('hex');
assert.equal(sourceSHA,'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 'Public licensed source changed');
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try {
  const u=new URL(req.url,'http://127.0.0.1');
  const path=decodeURIComponent(u.pathname);
  if(req.method!=='GET'||path.includes('\\')||path.includes('\0')||
    path.split('/').includes('..'))throw Error('path');
  if(path==='/'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});
   res.end('<!doctype html><html><meta charset="utf-8"><body>Owner lease test</body></html>');
   return;
  }
  if(!path.startsWith('/public/')||!/\.m?js$/.test(path))throw Error('module');
  const filename=resolve(root,'.'+path);
  if(!filename.startsWith(root+'/public/'))throw Error('not public');
  res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'});
  res.end(await readFile(filename));
 } catch {res.writeHead(404);res.end('not available');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try {
 browser=await ({chromium,webkit})[engine].launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const outbound=[],errors=[];
  try {
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin&&route.request().method()==='GET')return route.continue();
    outbound.push(url.hostname);
    return route.abort();
   });
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(String(e?.name||'pageerror')));
   page.on('crash',()=>errors.push('crash'));
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   const receipt=await page.evaluate(async({image,sourceSHA,width})=>{
    const {prepareDefaultAtomicM3,commitDefaultAtomicM3}=
     await import('/public/native-default-atomic-import-m3.mjs');
    const open=owner=>new Promise((ok,no)=>{
     const r=indexedDB.open('closet-current-user-'+owner,1);
     r.onupgradeneeded=()=>{
      r.result.createObjectStore('items',{keyPath:'id'});
      r.result.createObjectStore('state',{keyPath:'id'});
     };
     r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);
    });
    const inspect=db=>new Promise((ok,no)=>{
     const tx=db.transaction(['items','state'],'readonly');
     const a=tx.objectStore('items').getAll();
     const b=tx.objectStore('state').getAll();
     tx.oncomplete=()=>ok({items:a.result,state:b.result});
     tx.onerror=tx.onabort=()=>no(tx.error);
    });
    const cases=[];
    for(const mode of ['stable','new-epoch-after-commit',
                       'other-owner-after-commit','epoch-revoked-before-commit']){
     const owner='m221-synthetic-'+width+'-'+mode;
     const db=await open(owner);
     try{
      let current=owner,epoch=0,complete=false;
      const lease=()=>{
       if(current!==owner||epoch!==0)throw Error('M221_TEST_OWNER_REVOKED');
      };
      const record={id:'licensed-original',ownerId:owner,
       name:'synthetically confirmed jeans',category:'Bottoms',itemType:'Jeans',
       color:'Blue',image,originalPhoto:{image,sha256:sourceSHA},
       sourceSHA256:sourceSHA,sourceHashVerified:true};
      const input={format:'closet-current',version:3,items:[record]};
      // Use real source validation and source-byte SHA verification, rather
      // than fabricating a preapproved import plan.
      const prepared=await prepareDefaultAtomicM3({
       data:input,ownerDB:db,ownerId:owner,assertLease:lease,
       normalizeClothing:x=>x,validLook:x=>x,cleanOutfitBoard:x=>x
      });
      if(prepared.ownerId!==owner||prepared.counts.garments!==1)
       throw Error('Original prepare did not approve one source');
      const adapter={
       name:db.name,objectStoreNames:db.objectStoreNames,
       transaction(names,modeName){
        const tx=db.transaction(names,modeName);
        if(modeName!=='readwrite')return tx;
        return {
         objectStore:name=>tx.objectStore(name),
         abort:()=>tx.abort(),
         get error(){return tx.error;},
         set oncomplete(fn){
          tx.oncomplete=e=>{
           complete=true;
           if(mode==='new-epoch-after-commit')epoch++;
           if(mode==='other-owner-after-commit')current='m221-other-owner';
           fn(e);
          };
         },
         set onabort(fn){tx.onabort=fn;},
         set onerror(fn){tx.onerror=fn;}
        };
       }
      };
      let verdict,reason;
      try{
       verdict=await commitDefaultAtomicM3({
        ownerDB:adapter,ownerId:owner,assertLease:lease,
        prepared,confirmed:true,
        onStage:mode==='epoch-revoked-before-commit'?()=>{epoch++;}:null
       });
      }catch(e){reason=String(e?.message||e);}
      const state=await inspect(db);
      const preabort=mode==='epoch-revoked-before-commit';
      if(preabort){
       if(complete||verdict!==undefined||state.items.length!==0||
          state.state.length!==0||reason!=='M221_TEST_OWNER_REVOKED')
        throw Error('Precommit revoked session did not atomically abort');
      }else{
       if(!complete||state.items.length!==1||
          state.items[0].ownerId!==owner||
          state.items[0].originalPhoto.image!==image||
          state.items[0].sourceSHA256!==sourceSHA)
        throw Error('Genuine durable owner original missing or foreign');
       const marker=state.state.find(x=>x.id==='cloud-sync');
       if(!marker||marker.localRevision!==1||marker.dirty!==true)
        throw Error('Atomic cloud dirty marker was not committed');
       if(mode==='stable'){
        if(verdict?.committed!==true||verdict?.atomic!==true||
           verdict.releaseAuthorized!==false||reason!==undefined)
         throw Error('Original active session denied valid success');
       }else if(verdict!==undefined||
                reason!=='LEGACY_ATOMIC_SESSION_REVOKED_AFTER_COMMIT_RELOAD')
        throw Error('Revoked owner incorrectly received success after durable commit');
      }
      cases.push({mode,preparedFromRealSource:true,
       browserNativeIDB:true,precommitAtomicAbort:preabort,
       durableOriginalOnlyForOwner:!preabort,
       staleSuccessDenied:mode!=='stable',
       physicalPhone:false,hostedRLS:false,releaseAuthorized:false});
     }finally{db.close();}
    }
    return {width,cases};
   },{image,sourceSHA,width});
   assert.equal(receipt.cases.length,4,'Each browser width must execute 4 cases');
   assert.deepEqual(outbound,[],'Never send public fixture or owner context offsite');
   assert.deepEqual(errors,[],'Native import threw browser exceptions');
   console.log('M221_REAL_BROWSER_ATOMIC_RESTORE_TERMINAL_LEASE_PASS',JSON.stringify({
    engine,width,sourceSHA,results:receipt.cases,independentRecognition:false,
    hostedRLS:false,physicalPhone:false,photoFitted3D:false,familyAlpha:'HOLD'
   }));
  }finally{await context.close();}
 }
}finally{
 await browser?.close().catch(()=>{});
 await new Promise(ok=>server.close(ok));
}
