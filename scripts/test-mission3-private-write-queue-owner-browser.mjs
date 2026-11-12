// Mission 3: actual Chromium/WebKit native IndexedDB + authenticated queue
// lease, cloud dirty notification and private index refresh isolation.
// Only local synthetic photos and synthetic owners. No hosted writes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('public'),out=resolve(process.argv[2]||'benchmark/mission3-private-queue-owner-browser');
await mkdir(out,{recursive:true});
const bytes=await sharp({create:{width:60,height:40,channels:3,
 background:{r:114,g:156,b:78}}}).jpeg({quality:89}).toBuffer();
const original='data:image/jpeg;base64,'+bytes.toString('base64');
const sourceSHA256=createHash('sha256').update(bytes).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(requested==='/'?'/index.html':requested));
  if(!file.startsWith(root+'/')||requested.includes('\\'))throw Error('Invalid path');
  const b=await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(b);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const results=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const A='a'+width+'0000-0000-4000-8000-000000000000',
    B='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   const external=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({
     contentType:'text/javascript',body:
      "window.closetAuth={user:{id:'"+A+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
    }));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({
     contentType:'text/javascript',body:
      "window.closetCloud={start:async()=>({ok:true}),beforeWrite:async()=>{},changed:()=>{}};"
    }));
    await context.route('**/*',route=>{
     const u=new URL(route.request().url());
     if(['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1')return route.fallback();
     external.push({method:route.request().method(),path:u.pathname});return route.abort();
    });
    await context.addInitScript(()=>{
     class LocalReviewOnlyWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
       id:m.id,type:m.type==='load'?'ready':'result',strong:false,choices:[],details:{}
      }});},0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{value:LocalReviewOnlyWorker,configurable:true});
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push({engine,width,error:String(e)}));
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>closetReady);
    const result=await page.evaluate(async({A,B,original,sourceSHA256})=>{
     const events=[];
     let releaseOldCloud,oldCloudEntered=false,releaseSameCloud,sameCloudEntered=false;
     const oldDB=db;
     const row=(id,owner)=>({id,name:'Synthetic garment '+id,ownerId:owner,
      image:original,sourceSHA256,sourceHashVerified:true,
      originalPhoto:{image:original,sha256:sourceSHA256,origin:'photo-file',width:60,height:40}});
     const list=database=>new Promise((resolve,reject)=>{
      const r=database.transaction('items','readonly').objectStore('items').getAll();
      r.onsuccess=()=>resolve(r.result.map(x=>({id:x.id,ownerId:x.ownerId,sha:x.sourceSHA256})));
      r.onerror=()=>reject(r.error);
     });
     window.closetIndex02={refresh:async()=>{events.push('index:'+window.closetAuth.user?.id);}};
     window.closetCloud={
      start:async()=>({ok:true}),
      beforeWrite(database){
       events.push('before:'+database.name);
       if(database===oldDB){oldCloudEntered=true;return new Promise(resolve=>{releaseOldCloud=resolve;});}
       if(sameCloudEntered==='hold'&&database===blockedSameDB){
        sameCloudEntered=true;return new Promise(resolve=>{releaseSameCloud=resolve;});
       }
      },
      changed(){events.push('changed:'+window.closetAuth.user?.id);}
     };
     const tick=async()=>{for(let i=0;i<35;i++)await Promise.resolve();};
     const blockedA=writeAll([row('A-delayed',A)]).then(()=>({status:'success'}),
      error=>({status:'rejected',message:String(error.message)}));
     for(let i=0;i<60&&!oldCloudEntered;i++)await tick();
     if(!oldCloudEntered)throw Error('A pending cloud beforeWrite did not begin');
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:B};
     db=await openDB();
     const bSaved=await writeAll([row('B-current',B)]);
     await tick();
     const bBeforeRelease=await list(db);
     releaseOldCloud();
     const oldResult=await blockedA;await tick();
     const bAfterOldResult=await list(db);
     const aReopened=await new Promise((resolve,reject)=>{
      const req=indexedDB.open('closet-current-user-'+A,2);
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
     });
     const aAfterOld=await list(aReopened);aReopened.close();
     // Same account ID re-login must be as strong as switching owners.
     // Reuse the same ID but open a new native database connection.
     const blockedSameDB=db;sameCloudEntered='hold';
     const staleSame=writeAll([row('B-old-session',B)]).then(
      ()=>({status:'success'}),error=>({status:'rejected',message:String(error.message)}));
     for(let i=0;i<60&&sameCloudEntered==='hold';i++)await tick();
     if(sameCloudEntered!=='true'&&sameCloudEntered!==true)
      throw Error('Same-ID pending beforeWrite did not begin');
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:B};
     db=await openDB();
     const bFresh=await writeAll([row('B-after-relogin',B)]);
     await tick();releaseSameCloud();
     const oldSameResult=await staleSame;await tick();
     const bFinal=await list(db);
     return {A,B,sourceSHA256,
      aAfterOld,bBeforeRelease,bAfterOldResult,bFinal,
      oldResult,oldSameResult,
      bSaved:typeof bSaved,bFresh:typeof bFresh,
      events,sourceOwnerId:window.closetAuth.user.id
     };
    },{A,B,original,sourceSHA256});
    assert.equal(result.oldResult.status,'rejected');
    assert.match(result.oldResult.message,/account session changed|changed accounts/i);
    assert.deepEqual(result.aAfterOld,[]);
    assert.deepEqual(result.bBeforeRelease,[{id:'B-current',ownerId:B,sha:sourceSHA256}]);
    assert.deepEqual(result.bAfterOldResult,result.bBeforeRelease);
    assert.equal(result.oldSameResult.status,'rejected');
    assert.deepEqual(result.bFinal.map(x=>x.id).sort(),['B-after-relogin','B-current']);
    assert.ok(result.bFinal.every(x=>x.ownerId===B&&x.sha===sourceSHA256));
    assert.equal(result.sourceOwnerId,B);
    assert.deepEqual(result.events.filter(x=>x.startsWith('changed:')),['changed:'+B,'changed:'+B]);
    assert.deepEqual(result.events.filter(x=>x.startsWith('index:')),['index:'+B,'index:'+B]);
    assert.equal(result.events.filter(x=>x.startsWith('before:')&&x.endsWith(B)).length,0);
    assert.equal(external.filter(x=>x.method!=='GET').length,0);
    const shot=await page.screenshot({path:resolve(out,engine+'-'+width+'-queue-owner.png')});
    assert.equal((await sharp(shot).metadata()).width,width);
    results.push({engine,width,ownerIsolation:true,sameIdReLoginRevoked:true,
     deviceWriteNonBlocking:true,noOldCloudDirty:true,noOldIndexRefresh:true,
     nativeIndexedDB:true,syntheticJPEG:true,hostedSupabase:false,
     screenshotSha256:createHash('sha256').update(shot).digest('hex')});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(results.length,6);assert.deepEqual(errors,[]);
 const data=JSON.stringify({milestone:'mission3-private-queue-owner',cases:results,errors,
  familyAlphaHold:true,physicalAndroid:false,physicalIphone:false,hostedSupabase:false},null,2)+'\n';
 await writeFile(resolve(out,'results.json'),data);
 await writeFile(resolve(out,'sha256.txt'),createHash('sha256').update(data).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit 320/390/430 real native IndexedDB queued owner/cloud/index race and same-ID session revocation cases');
}finally{server.close();}
