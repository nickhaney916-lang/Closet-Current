// P146 complete real mount factory with synthetic owner/DOM in Chromium+WebKit.
// NO private account, hosted cloud, actual phones, production or staging.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-p146-failed-mount-browser');
await mkdir(out,{recursive:true});
const original=await readFile('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
assert.ok(original.includes('const UUID='));
const actual=original.slice(original.indexOf('const UUID=')).replace(/^export /gm,'');
const runtime=[
 "'use strict';",
 "let failure='none',backupRevokes=0,restoreRevokes=0;",
 "function createLocalRemoteFence134(){if(failure==='backup-constructor')throw Error('backup-factory-rejected');return {revoke(){backupRevokes++}};}",
 "function createCloudRestoreGuard137(){if(failure==='restore-constructor')throw Error('restore-factory-rejected');return {revoke(){restoreRevokes++}};}",
 actual,
 `window.__mountScenario=async function(mode){
  document.querySelectorAll('#ownerReview146Panel,#ownerReview146Modal,#owner146Style').forEach(n=>n.remove());
  document.body.innerHTML='<header><div class="account-menu"><div></div></div></header>';
  failure=mode;backupRevokes=0;restoreRevokes=0;
  const owner='11111111-1111-4111-8111-111111111111';
  const auth={user:{id:owner},assertCurrent(){},getAccessToken:async()=>'p146-synthetic-local-only-1234567890'};
  const db={name:'closet-current-user-'+owner,transaction(){}};
  const legacy={ownerReviewHold145:()=>true};
  const originalAdd=window.addEventListener,originalRemove=window.removeEventListener;
  const active=new Map();
  window.addEventListener=function(name,fn,opts){
   if(mode==='first-global-listener'&&name==='closet:session-locked')throw Error('first-event-registration-failed');
   if(mode==='second-global-listener'&&name==='pagehide')throw Error('second-event-registration-failed');
   active.set(name,fn);return originalAdd.call(window,name,fn,opts);
  };
  window.removeEventListener=function(name,fn,opts){
   active.delete(name);return originalRemove.call(window,name,fn,opts);
  };
  let thrown='',mounted=null;
  try{
   try{
    mounted=await mountOwnerReviewedCloud146({auth,db,doc:document,loc:location,
     legacy,fetcher:async()=>{throw Error('unexpected network')},
     subtle:crypto.subtle,onRestored:async()=>{}});
    if(mode==='normal')mounted.revoke();
   }catch(error){thrown=String(error)}
   return {
    mode,thrown,backupRevokes,restoreRevokes,listeners:active.size,
    panel:!!document.getElementById('ownerReview146Panel'),
    modal:!!document.getElementById('ownerReview146Modal'),
    style:!!document.getElementById('owner146Style')
   };
  }finally{
   for(const [name,fn]of active)originalRemove.call(window,name,fn);
   window.addEventListener=originalAdd;window.removeEventListener=originalRemove;
  }
 }`
].join('\n');
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html;charset=utf-8','cache-control':'no-store'});
 res.end('<!doctype html><html><body>P146 synthetic DOM only</body></html>');});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/?ownerReview145=research&ownerReview146=research';
const modes=['backup-constructor','restore-constructor','first-global-listener','second-global-listener','normal'];
const rows=[];
try{
 for(const [browserName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:browserName==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,
     serviceWorkers:'block'});
    try{
     const page=await context.newPage(),pageErrors=[];
     page.on('pageerror',e=>pageErrors.push(String(e)));
     await page.goto(url);await page.addScriptTag({content:runtime});
     for(const mode of modes){
      const r=await page.evaluate(m=>window.__mountScenario(m),mode);
      assert.equal(r.panel,false,browserName+' '+width+' '+mode+' old owner panel leaked');
      assert.equal(r.modal,false);
      assert.equal(r.style,false);
      assert.equal(r.listeners,0);
      if(mode==='normal')assert.equal(r.thrown,'');
      else assert.match(r.thrown,/rejected|failed/,browserName+' '+width+' '+mode);
      assert.equal(r.backupRevokes,
       ['restore-constructor','first-global-listener','second-global-listener','normal'].includes(mode)?1:0);
      assert.equal(r.restoreRevokes,
       ['first-global-listener','second-global-listener','normal'].includes(mode)?1:0);
      rows.push({browser:browserName,width,mode,pass:true});
     }
     assert.deepEqual(pageErrors,[],browserName+' '+width+' uncaught errors');
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>server.close(ok))}
assert.equal(rows.length,30);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 actualSource:'complete P146 owner-reviewed cloud factory; synthetic private DOM/services only',
 physicalPhones:false,liveHostedCloud:false,familyAlpha:'HOLD',
 passed:rows.length,rows
},null,2));
console.log('Mission3 P146 complete mount abort and revoke:',rows.length,
 'Chromium/WebKit synthetic width scenarios PASS — NO DEPLOY.');
