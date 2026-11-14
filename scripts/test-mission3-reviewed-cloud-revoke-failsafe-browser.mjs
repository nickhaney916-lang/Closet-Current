// Execute P146 real consent settlement and revoke source in Chromium + WebKit.
// Uses synthetic owner-only DOM and deliberately throwing local services.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-reviewed-cloud-revoke-failsafe-browser');
await mkdir(out,{recursive:true});
const src=await readFile('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
function slice(a,b){const x=src.indexOf(a),y=src.indexOf(b,x);
 assert.ok(x>=0&&y>x,'P146 source marker '+a);return src.slice(x,y);}
const settleSource=slice(' function settle(answer){'," by('owner146Cancel').onclick");
const revokeSource=slice(' function revoke(){',' const onLocked=()=>revoke();');
async function scenario(mode){
 document.body.innerHTML='<div id="accountMenu"><section id="ownerReview146Panel">'+
  '<button id="owner146Preview">Preview</button><button id="owner146Backup">Backup</button>'+
  '<button id="owner146Restore">Restore</button></section></div>';
 panel=document.getElementById('ownerReview146Panel');
 dialog=document.createElement('dialog');dialog.id='ownerReview146Modal';
 dialog.innerHTML='<button id="owner146Approve">Approve</button>';
 document.body.append(dialog);dialog.setAttribute('open','');
 style=document.createElement('style');style.id='owner146Style';document.head.append(style);
 const buttons=[...panel.querySelectorAll('button')];
 revoked=false;events=[];let consents=0,answer=null;
 pending=value=>{
  consents++;answer=value;events.push('settle:'+value);
  if(mode==='consent-throw')throw Error('PRIVATE old owner approval');
 };
 const backupThrows=['backup-throw','both-throw','backup-dialog-throw'].includes(mode);
 const restoreThrows=['restore-throw','both-throw'].includes(mode);
 backupService={revoke(){events.push('backup.revoke');if(backupThrows)throw Error('PRIVATE former JPEG backup')}};
 restoreService={revoke(){events.push('restore.revoke');if(restoreThrows)throw Error('PRIVATE former JPEG restore')}};
 if(['dialog-throw','backup-dialog-throw'].includes(mode)){
  dialog.close=()=>{events.push('dialog.close.throw');throw Error('PRIVATE modal close')};
 }
 if(mode==='button-throw')failingButton='owner146Backup';
 else failingButton=null;
 if(mode==='no-consent')pending=null;
 window.addEventListener('closet:session-locked',onLocked,{once:true});
 window.addEventListener('pagehide',onLocked,{once:true});
 if(mode==='session-lock')window.dispatchEvent(new Event('closet:session-locked'));
 else if(mode==='pagehide')window.dispatchEvent(new Event('pagehide'));
 else revoke();
 const afterFirst=events.length;
 revoke();
 const result={
  mode,revoked,pending:pending===null,consents,answer,
  privatePanelPresent:!!document.getElementById('ownerReview146Panel'),
  dialogPresent:!!document.getElementById('ownerReview146Modal'),
  stylePresent:!!document.getElementById('owner146Style'),
  privateButtonsConnected:buttons.some(b=>b.isConnected),
  backupAttempted:events.includes('backup.revoke'),
  restoreAttempted:events.includes('restore.revoke'),
  eventCountAfterFirst:afterFirst,eventCountAfterSecond:events.length,
  buttonsDisabled:buttons.map(b=>b.disabled),
  onclickCleared:buttons.map(b=>b.onclick===null),
  rawPrivateErrorVisible:document.body.textContent.includes('PRIVATE')
 };
 return result;
}
const js=[
 "'use strict';",
 "let revoked=false,pending=null,backupService=null,restoreService=null,panel=null,dialog=null,style=null,events=[],failingButton=null;",
 "const buttonIds=['owner146Preview','owner146Backup','owner146Restore'];",
 "const by=id=>{if(id===failingButton)throw Error('PRIVATE button access');return document.getElementById(id)};",
 settleSource,revokeSource,
 "const onLocked=()=>revoke();",
 "window.__scenario=("+scenario.toString()+");"
].join('\n');
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html;charset=utf-8','cache-control':'no-store'});
 res.end('<!doctype html><html><body>synthetic P146</body></html>')});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
const modes=['normal','backup-throw','restore-throw','both-throw','dialog-throw',
 'backup-dialog-throw','consent-throw','button-throw','session-lock','pagehide','no-consent','repeated-revoke'];
const results=[];
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
     await page.goto(url);await page.addScriptTag({content:js});
     for(const mode of modes){
      const x=await page.evaluate(m=>window.__scenario(m),mode);
      assert.equal(x.revoked,true,name+' '+width+' '+mode);
      assert.equal(x.pending,true);
      assert.equal(x.privatePanelPresent,false);
      assert.equal(x.dialogPresent,false);
      assert.equal(x.stylePresent,false);
      assert.equal(x.privateButtonsConnected,false);
      assert.equal(x.backupAttempted,true);
      assert.equal(x.restoreAttempted,true);
      assert.equal(x.rawPrivateErrorVisible,false);
      assert.equal(x.eventCountAfterSecond,x.eventCountAfterFirst,'non-idempotent revoke');
      if(mode==='no-consent')assert.equal(x.consents,0);
      else{assert.equal(x.consents,1);if(mode!=='consent-throw')assert.equal(x.answer,false)}
      if(mode!=='button-throw')assert.deepEqual(x.buttonsDisabled,[true,true,true]);
      else assert.deepEqual(x.buttonsDisabled,[true,false,true]);
      results.push({browser:name,width,mode,pass:true});
     }
     assert.deepEqual(errors,[],name+' '+width+' unhandled browser errors');
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(ok=>server.close(ok));}
assert.equal(results.length,72);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 source:'real research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs consent/revoke source',
 syntheticLocalOwnerOnly:true,realHostedCloud:false,physicalPhones:false,familyAlpha:'HOLD',
 passed:results.length,results
},null,2));
console.log('Mission3 P146 fail-safe private panel cleanup:',results.length,'Chromium/WebKit synthetic cases PASS — NO DEPLOY.');
