/**
 * MAIN226 — run unchanged browser-native opt-in v4 module and ACTUAL IndexedDB
 * in fresh Chromium/WebKit pages on licensed public JPEG bytes. All negative
 * source-retired checks occur BEFORE replacement consent and durable writes.
 * No mocked Worker, auth, IDB transactions, SHA, or hosted account data.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';

const engine=process.env.M58_ENGINE||'webkit';
const width=Number(process.env.M226_WIDTH||430);
assert.ok(['chromium','webkit'].includes(engine));
assert.ok([320,390,430].includes(width));
const photo=await readFile('benchmark/fixtures/commons-0053.jpg');
assert.equal(photo[0],255);assert.equal(photo[1],216);
const sha=createHash('sha256').update(photo).digest('hex');
const jpeg='data:image/jpeg;base64,'+photo.toString('base64');
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/m226-native-fixture'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});
   res.end('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><p>Source-only M226 fixture</p></body></html>');
   return;
  }
  if(req.method!=='GET'||!['/public/','/research/'].some(p=>path.startsWith(p))||
     path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('invalid source only request');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('outside repo');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':['.js','.mjs'].includes(extname(file))?'text/javascript':'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not a source-only fixture');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser,context;
try{
 browser=await(engine==='webkit'?webkit:chromium).launch(
  engine==='chromium'?{headless:true,args:['--no-sandbox']}:{headless:true});
 context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e.message).slice(0,200)));
 await page.goto(origin+'/m226-native-fixture',{waitUntil:'domcontentloaded'});
 const report=await page.evaluate(async({jpeg,sha,engine,width})=>{
  const {exportLosslessV4M3,restoreLosslessV4M3}=
   await import('/public/native-lossless-v4-owner-acceptance-m3.mjs');
  const row=(owner,flag)=>({
   id:'owned-top',ownerId:owner,image:jpeg,
   originalPhoto:{ownerId:owner,image:jpeg,sha256:sha},
   sourceSHA256:sha,sourceHashVerified:true,ownerReviewed:true,
   category:'Tops',itemType:'T-shirt',color:'Blue',...(flag?{[flag]:true}:{})
  });
  const board=where=>{
   const used={name:'Reviewed owner outfit',slots:{top:'owned-top'}};
   const empty={name:'Empty',slots:{}};
   return {id:'outfit-board',current:where==='current'?used:empty,
    saved:where==='saved'?[used]:[]};
  };
  const data=(owner,flag,where)=>({
   format:'closet-current',version:4,ownerId:owner,
   items:[row(owner,flag)],state:{
    draft:{id:'draft',batch:[]},looks:{id:'looks',looks:[]},
    'outfit-board':board(where)}
  });
  const makeDb=owner=>new Promise((resolve,reject)=>{
   const q=indexedDB.open('closet-current-user-'+owner,1);
   q.onupgradeneeded=()=>{
    q.result.createObjectStore('items',{keyPath:'id'});
    q.result.createObjectStore('state',{keyPath:'id'});
   };
   q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
  });
  const write=(db,store,value)=>new Promise((resolve,reject)=>{
   const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);
   tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
  });
  const snapshot=db=>new Promise((resolve,reject)=>{
   const tx=db.transaction(['items','state'],'readonly');
   const i=tx.objectStore('items').getAll(),s=tx.objectStore('state').getAll();
   tx.oncomplete=()=>resolve(JSON.stringify({items:i.result,state:s.result}));
   tx.onerror=tx.onabort=()=>reject(tx.error);
  });
  const all=[];
  for(const flag of ['deleted','sourceRevoked']){
   for(const where of ['current','saved']){
    for(const action of ['export','import']){
     const owner=['m226',engine,width,flag,where,action].join('-');
     const db=await makeDb(owner);
     try{
      await write(db,'state',{id:'cloud-sync',localRevision:1,dirty:false});
      if(action==='export'){
       await write(db,'items',row(owner,flag));
       await write(db,'state',board(where));
      }
      const before=await snapshot(db);
      let consent=0,reason='',accepted=false;
      try{
       if(action==='export')await exportLosslessV4M3({
        ownerDB:db,ownerId:owner,assertLease:()=>{}});
       else await restoreLosslessV4M3({
        ownerDB:db,ownerId:owner,assertLease:()=>{},
        data:data(owner,flag,where),
        confirm:async()=>{consent++;return true;}
       });
       accepted=true;
      }catch(error){reason=String(error.message||error);}
      const unchanged=(await snapshot(db))===before;
      all.push({flag,where,action,reason,accepted,consent,unchanged});
     }finally{db.close();}
    }
   }
  }
  // A current, independently reviewed (nonretired) source must remain
  // eligible; this is not a blanket outfit-import prohibition.
  for(const action of ['export','import']){
   const owner=['m226',engine,width,'active',action].join('-');
   const db=await makeDb(owner);
   try{
    await write(db,'state',{id:'cloud-sync',localRevision:1,dirty:false});
    if(action==='export'){
     await write(db,'items',row(owner,null));
     await write(db,'state',board('current'));
    }
    const result=action==='export'?
     await exportLosslessV4M3({ownerDB:db,ownerId:owner,assertLease:()=>{}}):
     await restoreLosslessV4M3({ownerDB:db,ownerId:owner,assertLease:()=>{},
      data:data(owner,null,'current'),confirm:async()=>true});
    all.push({action,flag:'active',success:action==='export'?result.savedCount===1:result.restored===true,
     sourceUnchanged:action==='export'?result.data.items[0].originalPhoto.image===jpeg:
      JSON.parse(await snapshot(db)).items[0]?.originalPhoto?.image===jpeg});
   }finally{db.close();}
  }
  return all;
 },{jpeg,sha,engine,width});
 assert.equal(report.length,10);
 for(const entry of report){
  if(entry.flag==='active'){
   assert.equal(entry.success,true,JSON.stringify(entry));
   assert.equal(entry.sourceUnchanged,true,JSON.stringify(entry));
  }else{
   assert.equal(entry.accepted,false,JSON.stringify(entry));
   assert.match(entry.reason,/M3_V4_RETIRED_OUTFIT_SOURCE/,JSON.stringify(entry));
   assert.equal(entry.consent,0,JSON.stringify(entry));
   assert.equal(entry.unchanged,true,JSON.stringify(entry));
  }
 }
 assert.deepEqual(pageErrors,[],'actual native browser page errors');
 console.log('M226_REAL_NATIVE_V4_RETIRED_OUTFIT_SOURCE_FENCE_PASS',JSON.stringify({
  engine,width,negativeCases:8,positiveCases:2,
  realIndexedDB:true,realWebCrypto:true,exactLicensedOriginalSHA256:sha,
  zeroPrematureConsent:true,zeroPrivateWritesOnReject:true,
  browserPageErrors:0,noHostedAuth:true,physicalPhone:false,
  familyAlpha:'HOLD',releaseAuthorized:false
 }));
}finally{
 await context?.close();await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}