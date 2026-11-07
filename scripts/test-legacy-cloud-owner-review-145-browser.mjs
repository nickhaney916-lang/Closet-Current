import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {chromium,webkit} from 'playwright';

const source=readFileSync('public/cloud-backup.js','utf8');
const output=process.env.ARTIFACT_DIR||'benchmark/legacy-cloud-owner-review-145';
mkdirSync(output,{recursive:true});
const host='127.0.0.1',port=await new Promise((resolve,reject)=>{
 const server=createServer((req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1');
  if(u.pathname==='/cloud-backup.js'){
   res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});
   res.end(source);return;
  }
  if(u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
    <h1>Owner-review safety fixture</h1><p id="cloudStatus" role="status" hidden></p>
    <p id="cloudBanner" hidden></p><button id="syncCloset">Legacy sync</button>
    <button id="resolveCloudConflict">Legacy merge</button>
    <script>window.ClosetBackupEngine={};window.closetAuth={user:{id:'11111111-1111-4111-8111-111111111111'},getAccessToken(){throw Error('legacy auth token requested');}};</script>
    <script src="/cloud-backup.js"></script></body></html>`);
 });
 server.listen(0,host,()=>resolve({server,port:server.address().port}));
 server.on('error',reject);
});
const server=port.server,results=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:780},deviceScaleFactor:1});
    const page=await context.newPage();
    const external=[];
    page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:'))external.push(request.url());});
    await page.goto(`http://127.0.0.1:${port.port}/?ownerReview145=research`,{waitUntil:'load'});
    const proof=await page.evaluate(async()=>{
     let calls=0;
     const db={transaction(){calls++;throw Error('LEGACY INDEXEDDB TRANSACTION');}};
     const active=window.closetCloud.ownerReviewHold145();
     const outcome=await window.closetCloud.start(db,{});
     await window.closetCloud.beforeWrite(db);
     window.closetCloud.changed();
     await window.closetCloud.sync();
     await window.closetCloud.sync({keepBoth:true});
     window.dispatchEvent(new Event('focus'));
     window.dispatchEvent(new Event('online'));
     window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
     return {active,paused:outcome?.paused===true,reason:outcome?.reason,
      syncHidden:document.getElementById('syncCloset').hidden,
      resolveHidden:document.getElementById('resolveCloudConflict').hidden,
      status:document.getElementById('cloudStatus').textContent,dbCalls:calls};
    });
    assert.equal(proof.active,true);
    assert.equal(proof.paused,true);
    assert.equal(proof.reason,'owner-review-required');
    assert.equal(proof.syncHidden,true);
    assert.equal(proof.resolveHidden,true);
    assert.equal(proof.dbCalls,0);
    assert.match(proof.status,/automatic cloud backup and restore are paused/);
    assert.equal(external.length,0,'no external network traffic permitted');
    const file=path.join(output,`owner-review145-${name}-${width}.png`);
    await page.screenshot({path:file,fullPage:true});
    results.push({engine:name,width,status:'PASS',paused:proof.paused,dbCalls:proof.dbCalls,
      externalRequests:external.length,screenshot:path.basename(file)});
    await context.close();
   }
  }finally{await browser.close();}
 }
}finally{
 await new Promise(resolve=>server.close(resolve));
}
writeFileSync(path.join(output,'results.json'),JSON.stringify({priority:145,mode:'local research fixture only',familyAlpha:'HOLD',
 hostedJWT:false,physicalPhone:false,ordinaryAppCloudUI:false,results},null,2));
console.log(JSON.stringify(results,null,2));
