// Actual source-executed private cloud preview/status/approve owner fences.
// Synthetic DOM only, genuine Playwright Chromium/WebKit, no private accounts.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-reviewed-cloud-private-preview-session-browser');
await mkdir(out,{recursive:true});
const src=await readFile('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
function slice(a,b){const i=src.indexOf(a),j=src.indexOf(b,i);
 assert.ok(i>=0&&j>i,'actual P146 source '+a);return src.slice(i,j);}
const actual=[
 slice(' const status=(message)=>',' function decide(info,type){'),
 slice(' function settle(answer){'," by('owner146Cancel').onclick"),
 slice(' function revoke(){',' const onLocked=()=>revoke();')
].join('\n');
const frameCode=[
 "'use strict';",
 'let revoked=false,pending=null,panel=null,dialog=null,style=null,backupService=null,restoreService=null,ownerValid=true,answer=null;',
 "const buttonIds=['owner146Preview','owner146Backup','owner146Restore'];",
 "const by=id=>document.getElementById(id);",
 "function assertLocalOwner(){if(!ownerValid||revoked)throw Error('owner-session-revoked')}",
 actual,
 'const onLocked=()=>revoke();',
 `window.__scenario=async function(mode){
   document.body.innerHTML='<div id="menu"><section id="ownerReview146Panel">'+
    '<button id="owner146Preview">Preview</button>'+
    '<button id="owner146Backup">Backup</button>'+
    '<button id="owner146Restore">Restore</button>'+
    '<p id="owner146Status">Original owner only</p>'+
    '<div id="owner146Counts" hidden></div>'+
    '</section></div>';
   panel=document.getElementById('ownerReview146Panel');
   dialog=document.createElement('dialog');dialog.id='ownerReview146Modal';
   dialog.innerHTML='<div id="owner146LocalItems">—</div>'+
    '<div id="owner146RemoteItems">—</div>'+
    '<div id="owner146LocalLooks">—</div>'+
    '<div id="owner146RemoteLooks">—</div>';
   document.body.append(dialog);dialog.setAttribute('open','');
   style=document.createElement('style');style.id='owner146Style';document.head.append(style);
   let revokedServices=0;
   backupService={revoke(){revokedServices++}};
   restoreService={revoke(){revokedServices++}};
   revoked=false;pending=null;ownerValid=true;answer=null;
   const sample={localReviewedGarments:2,remoteReviewedGarments:9,
    localSavedOutfits:1,remoteSavedOutfits:7,remoteRevision:4};
   if(mode==='count-current')showCounts(sample);
   if(mode==='status-current')status('Current private preview ready');
   if(mode==='count-stale'){
    await Promise.resolve();ownerValid=false;
    try{showCounts(sample)}catch(e){if(!String(e).includes('owner-session-revoked'))throw e}
   }
   if(mode==='status-stale'){
    await Promise.resolve();ownerValid=false;status('SECRET FORMER OWNER');
   }
   if(mode==='approve-stale'){
    pending=v=>{answer=v};await Promise.resolve();ownerValid=false;settle(true);
   }
   if(mode==='approve-current'){pending=v=>{answer=v};settle(true)}
   const result={mode,revoked,answer,revokedServices,
    panelPresent:!!document.getElementById('ownerReview146Panel'),
    dialogPresent:!!document.getElementById('ownerReview146Modal'),
    stylePresent:!!document.getElementById('owner146Style'),
    count:document.getElementById('owner146LocalItems')?.textContent||'',
    status:document.getElementById('owner146Status')?.textContent||'',
    secretVisible:document.body.textContent.includes('SECRET FORMER OWNER')
   };
   return result;
 }`
].join('\n');
const srv=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html;charset=utf-8','cache-control':'no-store'});
 res.end('<!doctype html><html><body>P146 synthetic phone width</body></html>')});
await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+srv.address().port+'/';
const modes=['count-current','status-current','count-stale','status-stale','approve-stale','approve-current'];
const rows=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
     hasTouch:true,serviceWorkers:'block'});
    try{
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(String(e)));
     await page.goto(url);await page.addScriptTag({content:frameCode});
     for(const mode of modes){
      const result=await page.evaluate(m=>window.__scenario(m),mode);
      assert.equal(result.secretVisible,false,name+' '+width+' '+mode);
      if(mode.endsWith('stale')){
       assert.equal(result.revoked,true,name+' '+width+' '+mode);
       assert.equal(result.panelPresent,false);
       assert.equal(result.dialogPresent,false);
       assert.equal(result.stylePresent,false);
       assert.equal(result.revokedServices,2);
      }else{
       assert.equal(result.revoked,false,name+' '+width+' '+mode);
       assert.equal(result.panelPresent,true);
      }
      if(mode==='count-current')assert.equal(result.count,'2');
      if(mode==='status-current')assert.equal(result.status,'Current private preview ready');
      if(mode==='approve-stale')assert.equal(result.answer,false);
      if(mode==='approve-current')assert.equal(result.answer,true);
      rows.push({browser:name,width,mode,pass:true});
     }
     assert.deepEqual(errors,[],name+' '+width+' page errors');
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>srv.close(ok))}
assert.equal(rows.length,36);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 source:'P146 real owner panel display and approval source, synthetic DOM only',
 noHostedSupabase:true,noPhysicalPhones:true,familyAlpha:'HOLD',
 passed:rows.length,rows
},null,2));
console.log('Mission 3 P146 session-fenced private count/status/approval:',rows.length,
 'Chromium/WebKit synthetic width cases PASS — NO DEPLOY');
