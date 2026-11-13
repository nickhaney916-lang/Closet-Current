// Source-executed real-browser photo retry race tests. Synthetic photographs,
// signed accounts and local callbacks only. No network / hosted cloud / deploy.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-photo-retry-exact-session-browser');
await mkdir(out,{recursive:true});
const src=await readFile('public/app.js','utf8');
const start=src.indexOf('function ownerFailedPhotoRetryLease(item){');
const end=src.indexOf('function renderPhotoResults(grid,results){',start);
assert.ok(start>0&&end>start,'Actual source retry functions must exist');
assert.match(src,/retry\.onclick=\(\)=>retryFailedPhotoFromCard\(item,retry\)/);
const actual=src.slice(start,end);
const code=`
'use strict';
let db,items,batch,failedDraftCaptures,localPending,captureOperationEpoch=1;
let events=[],photo,button;
function $(id){return document.getElementById(id);}
function captureProofOwner(){
 const owner=window.closetAuth?.user?.id;
 return typeof owner==='string'&&db?.name==='closet-current-user-'+owner?owner:null;
}
let candidate,captureProof01Module;
function render(){events.push('render:'+window.closetAuth?.user?.id);}
function message(v){events.push('message:'+window.closetAuth?.user?.id+':'+v);}
${actual}
window.__retry=async(mode)=>{
 document.body.innerHTML='<section id="authGate" hidden></section><section id="appShell"></section>';
 events=[];captureOperationEpoch++;
 photo={id:'same-id',ownerId:'owner-a',image:'synthetic-A-JPEG',sourceHashVerified:true,
  sourceSHA256:'a'.repeat(64),originalPhoto:{image:'synthetic-A-JPEG',sha256:'a'.repeat(64)}};
 db={name:'closet-current-user-owner-a'};items=[];batch=[photo];
 failedDraftCaptures=new Set([photo.id]);localPending=new Set();
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
 button=document.createElement('button');document.body.append(button);
 captureProof01Module=async()=>({verifyStoredCanonical:async()=>mode!=='bad-proof'});
 let notify;
 const entered=new Promise(done=>notify=done);
 let finish;
 const gate=new Promise(done=>finish=done);
 candidate=async()=>{
  events.push('candidate');notify();
  await gate;
  if(mode==='current-fail')throw Error('PRIVATE original jpeg filename SECRET');
  failedDraftCaptures.delete(photo.id);return true;
 };
 if(mode==='wrong-db')db={name:'closet-current-user-other'};
 if(mode==='bad-original')photo.originalPhoto.sha256='b'.repeat(64);
 if(mode==='detached-prestart')button.remove();
 const running=retryFailedPhotoFromCard(photo,button);
 const active=!['bad-proof','bad-original','wrong-db','detached-prestart'].includes(mode);
 if(active){
  await entered;
  if(mode.startsWith('other-owner')){
   captureOperationEpoch++;
   window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   db={name:'closet-current-user-owner-b'};
   batch=[{...photo,ownerId:'owner-b',image:'synthetic-B-JPEG'}];
  }else if(mode.startsWith('relogin')){
   captureOperationEpoch++;
   window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   db={name:'closet-current-user-owner-a'};
   batch=[{...photo,name:'different login photo'}];
  }else if(mode==='same-owner-refresh'){
   batch=[{...photo,name:'new row same ID'}];
  }else if(mode==='detached-afterstart')button.remove();
  finish();
 }
 await running;
 return {mode,events,owner:window.closetAuth.user.id,buttonDisabled:button.disabled,
  connected:button.isConnected,failed:failedDraftCaptures.has(photo.id),
  batchOwner:batch[0]?.ownerId};
};
`;
const modes=['current-success','current-fail','other-owner-switch','relogin-afterstart',
 'same-owner-refresh','detached-afterstart','bad-proof','bad-original','wrong-db','detached-prestart'];
const results=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({content:code});
    for(const mode of modes){
     const got=await page.evaluate(value=>window.__retry(value),mode);
     assert.ok(got.events.every(event=>!event.includes('PRIVATE')&&!event.includes('SECRET')),engineName+' '+width+' '+mode);
     if(mode==='current-success'){
      assert.deepEqual(got.events,['candidate','render:owner-a',
       'message:owner-a:Original photograph saved privately on this device. Review the garment details before adding it to your closet.']);
      assert.equal(got.failed,false);
      assert.equal(got.buttonDisabled,false);
     }else if(mode==='current-fail'){
      assert.equal(got.events[0],'candidate');assert.equal(got.events.length,3);
      assert.match(got.events[1],/Photo is still not saved/);
      assert.equal(got.failed,true);
      assert.equal(got.buttonDisabled,false);
     }else if(['bad-original','bad-proof'].includes(mode)){
      assert.equal(got.events.length,2);
      assert.match(got.events[0],/Photo is still not saved/);
      assert.equal(got.failed,true);
     }else if(mode==='wrong-db'||mode==='detached-prestart'){
      assert.deepEqual(got.events,[]);
      assert.equal(got.buttonDisabled,false);
      assert.equal(got.failed,true);
     }else if(mode==='detached-afterstart'){
      // A genuine successful save can still notify the same signed owner;
      // a detached button alone must never be re-enabled.
      assert.equal(got.events[0],'candidate');
      assert.match(got.events[got.events.length-1],/Original photograph saved privately/);
      assert.equal(got.buttonDisabled,true);
     }else{
      assert.deepEqual(got.events,['candidate'],engineName+' '+width+' '+mode+' has no stale finalizer');
      assert.equal(got.buttonDisabled,true);
     }
     if(mode==='other-owner-switch')assert.equal(got.batchOwner,'owner-b');
     results.push({engine:engineName,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],engineName+' '+width+' JS page errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,60);
await writeFile(resolve(out,'results.json'),JSON.stringify({source:'public/app.js exact retry source',scope:'synthetic-only',familyAlpha:'HOLD',total:results.length,results},null,2));
console.log('Mission 3 retry original-photo source:',results.length,'PASS across Chromium/WebKit CSS mobile widths, no deploy.');
