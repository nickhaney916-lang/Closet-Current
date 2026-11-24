/** Native app, DOM, promises and IndexedDB. Worker envelopes, JPEGs and auth are fixtures. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium, webkit} from 'playwright';
import sharp from 'sharp';

const root=resolve('public');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async (req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/p1605-worker-fixture.mjs'){
   res.writeHead(200,{'content-type':'text/javascript'});
   res.end('self.onmessage=({data})=>{if(data.reply)self.postMessage(data.reply)};');
   return;
  }
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/'))throw Error('Outside fixture server');
  const content=await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(content);
 }catch{res.writeHead(404).end();}
});
const photos=await Promise.all(['#3c4760','#a1552a','#135c39'].map(async background=>{
 const bytes=await sharp({create:{width:90,height:110,channels:3,background}}).jpeg().toBuffer();
 return {image:'data:image/jpeg;base64,'+bytes.toString('base64'),
  sha:createHash('sha256').update(bytes).digest('hex')};
}));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const receipts=[];
try{
 for(const [engine,browserType] of Object.entries({chromium,webkit})){
  const browser=await browserType.launch();
  try{
   for(const width of [320,390,430]){
    for(const [mode,query] of [['default',''],['instance','?outfitInstances840=1'],
      ['unit-color','?outfitInstances840=1&outfitUnits70=1&color76=1']]){
     const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
     try{
      await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.fallback():r.abort());
      await context.route('**/auth.js*',r=>r.fulfill({contentType:'text/javascript',body:
       "window.closetAuth={user:{id:'p1605-synthetic'},ready:Promise.resolve(),assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
      await context.route('**/cloud-backup.js*',r=>r.fulfill({contentType:'text/javascript',body:
       'window.closetCloud={start:async()=>{},beforeWrite:async()=>{},changed:()=>{}};'}));
      await context.addInitScript(()=>{
       const NativeWorker=Worker;
       window.Worker=class extends NativeWorker{
        constructor(url,options){
         // Real message event delivery over a Worker with controlled output.
         super('/p1605-worker-fixture.mjs',options);
        }
       };
      });
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/'+query);
      await page.evaluate(()=>closetReady);
      const result=await page.evaluate(async photos=>{
       const [original,crop,foreign]=photos;
       const queue=queueAutomatic;
       // Separate outfit parsing from the automatic single-photo queue.
       queueAutomatic=()=>{};
       const fail=(test,detail)=>{if(!test)throw Error(detail);};
       const start=(source=original)=>{startOutfitSplit(source.image);return outfitSplitJob;};
       const send=(job,data)=>new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('Fixture worker response timed out: '+data.type)),5000);
        job.worker.addEventListener('message',()=>queueMicrotask(async()=>{
         await job.messageQueue;
         clearTimeout(timer);
         resolve();
        }),{once:true});
        job.worker.postMessage({reply:{...data,id:job.id}});
       });
       const pieceFor=(job,source=original)=>({
        image:crop.image,label:'Fixture shoes',hint:{categories:['Shoes'],types:[],confidence:.8},
        requiresReview:true,instanceMethod:'connected_footwear_component',
        cropBounds:{x:.1,y:.1,width:.4,height:.4},
        colorEstimate:{color:'Blue',source:'photo-estimate',support:.4},
        reconciliation70:{sourceSha256:source.sha,maskSha256:'a'.repeat(64),instanceOrdinal:0},
        colorResearch76:{ownerId:job.ownerId,requestId:job.id,sourceSha256:source.sha,
         maskSha256:'a'.repeat(64),status:'review',proposedPrimary:'Blue'}
       });
       const originalDraft=()=>batch[0]?.originalPhoto?.image===original.image;
       const verifyFailure=(pattern,source=original)=>{
        fail(!outfitSplitJob&&!busy&&!$('outfitRetry').hidden,'retry must be offered');
        fail(lastOutfitPhoto===source.image&&originalDraft()&&batch.length===1&&items.length===0,'photo or draft changed');
        fail(pattern.test($('outfitSplitStatus').textContent),$('outfitSplitStatus').textContent);
       };
       let job=start();
       await send(job,{type:'piece',piece:pieceFor(job)});
       fail(batch.length===1&&originalDraft()&&batch[0].requiresOwnershipConfirmation,'valid unsaved region missing');
       fail(batch[0].colorMethod!=='garment-mask'&&batch[0].color!=='Blue','unsupported mask color applied');
       await send(job,{type:'done',count:2});
       verifyFailure(/incomplete result/);
       const firstId=batch[0].id;
       $('outfitRetry').click();job=outfitSplitJob;
       await send(job,{type:'piece',piece:pieceFor(job)});
       await send(job,{type:'done',count:1});
       fail($('outfitRetry').hidden&&batch[0].id===firstId&&batch.length===1,'same-source retry must coalesce');
       for(const invalid of [
        {recognitionPhoto:{image:{invalid:true}}},
        {hint:{categories:['Invalid'],types:[]}},
        {hint:{categories:['Shoes'],types:['Hat']}},
        {hint:{categories:['Shoes'],types:[],confidence:2}},
        {cropBounds:{x:.8,y:.1,width:.5,height:.4}},
       ]){
        job=start();
        await send(job,{type:'piece',piece:{...pieceFor(job),...invalid}});
        verifyFailure(/could not be verified|invalid recognition metadata/);
       }
       job=start();await send(job,{type:'unexpected'});verifyFailure(/unreadable message/);
       job=start();job.worker.onmessageerror(new MessageEvent('messageerror'));verifyFailure(/unreadable message/);
       job=start();
       const admit=candidate;
       candidate=()=>{throw Error('Fixture admission interrupted');};
       try{await send(job,{type:'piece',piece:pieceFor(job)});}
       finally{candidate=admit;}
       verifyFailure(/processing was interrupted/);
       job=start(foreign);
       await send(job,{type:'piece',piece:pieceFor(job,foreign)});
       verifyFailure(/identical clothing crop/,foreign);
       await persistDraft();
       const stored=await new Promise((resolve,reject)=>{
        const req=db.transaction('state').objectStore('state').get('draft');
        req.onsuccess=()=>resolve(req.result.batch);
        req.onerror=()=>reject(req.error);
       });
       fail(stored.length===1&&stored[0].id===firstId&&stored[0].originalPhoto.image===original.image,'durable draft changed');
       fail((await readAll()).length===0,'worker wrote to saved wardrobe');
       queueAutomatic=queue;
       const realRecognize=recognizeItem;
       const first=batch[0],next={...first,id:'p1605-next'};
       batch.push(next);
       let release;
       const barrier=new Promise(resolve=>{release=resolve;});
       const visited=[];
       recognizeItem=async item=>{
        visited.push(item.id);
        if(item===first){await barrier;throw Error('Fixture recognition interruption');}
        item.localAnalyzed=true;
       };
       queueAutomatic(first);queueAutomatic(next);
       release();
       window.p1605Queue={first,next,visited,realRecognize};
       return {original:stored[0].originalPhoto.image,
        cases:['count','same-source-retry','photo-type','category','subtype','confidence','crop-bounds',
         'unknown-envelope','messageerror','processing-exception','cross-source-collision','unsupported-color','owner-review']};
      },photos);
      await page.waitForFunction(()=>!automaticRunning);
      await page.evaluate(async ()=>{
       const {first,next,visited,realRecognize}=window.p1605Queue;
       if(!first.scanFailed||!first.requiresOwnershipConfirmation||!next.localAnalyzed||
         visited.join()!==[first.id,next.id].join()||localPending.size)
        throw Error('Isolated rejection did not release the queued recognitions');
       let release;
       const barrier=new Promise(resolve=>{release=resolve;});
       const calls=[];
       recognizeItem=async item=>{calls.push(item.id);if(item===first)await barrier;};
       queueAutomatic(first);queueAutomatic(next);
       const owner=window.closetAuth.user;
       window.closetAuth.user={...owner};
       release();
       window.p1605Revoked={owner,realRecognize,calls,first,next};
      });
      await page.waitForFunction(()=>!automaticRunning);
      await page.evaluate(()=>{
       const {owner,realRecognize,calls,first,next}=window.p1605Revoked;
       window.closetAuth.user=owner;recognizeItem=realRecognize;
       if(calls.join()!==first.id||localPending.has(next.id))throw Error('Revoked queued lease was adopted');
      });
      result.cases.push('queue-continues-after-rejection','revoked-owner-lease');
      const observed=createHash('sha256').update(Buffer.from(result.original.split(',')[1],'base64')).digest('hex');
      assert.equal(observed,photos[0].sha);
      assert.deepEqual(errors,[]);
      const receipt={engine,version:browser.version(),width,mode,cases:result.cases,originalShaPreserved:true};
      receipts.push(receipt);
      console.log('P1605_BROWSER',JSON.stringify(receipt));
     }finally{await context.close();}
    }
   }
  }finally{await browser.close();}
 }
 assert.equal(receipts.length,18);
}finally{await new Promise(resolve=>server.close(resolve));}
