// Mission 3 source-executed signed-owner Style button browser race harness.
// Uses actual production callback functions + synthetic owners/photos only.
// NO NETWORK, NO PRIVATE ACCOUNTS, NO DEPLOY, Family Alpha HOLD #255.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-style-card-owner-session-browser');
await mkdir(out,{recursive:true});
const source=await readFile(resolve('public/app.js'),'utf8');
const start=source.indexOf('function ownerStyleCardActionLease(item){');
const end=source.indexOf('function ownerWardrobeMutationLease(){',start);
assert.ok(start>=0&&end>start,'Actual saved Style source required');
const actual=source.slice(start,end);
assert.match(source,/style\.onclick=\(\)=>withOwnerStyleCardAction\(item,style,/);
assert.match(source,/styleNew\.onclick=\(\)=>withOwnerStyleCardAction\(item,styleNew,/);
const js=`
'use strict';
let db,items=[],captureOperationEpoch=0;
let notices=[];
const $=id=>document.getElementById(id);
function message(text){notices.push(text);}
${actual}
window.__runStyleCase=async(mode)=>{
 document.body.innerHTML='<section id="authGate" hidden></section><section id="appShell"></section>';
 notices=[];captureOperationEpoch++;
 const photo={id:'same-wardrobe-id',ownerId:'owner-a',sourceSHA256:'fake-sha',originalPhoto:{image:'synthetic-JPEG-A'}};
 items=[photo];
 db={name:'closet-current-user-owner-a'};
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
 const button=document.createElement('button');document.body.append(button);
 let resolve,reject;
 const gate=new Promise((yes,no)=>{resolve=yes;reject=no;});gate.catch(()=>{});
 let calls=0;
 const running=withOwnerStyleCardAction(photo,button,async assertOwner=>{
  calls++;
  assertOwner();
  await gate;
  assertOwner();
  if(mode==='current-fail')throw Error('private original jpeg owner-a SECRET');
 });
 const startedDisabled=button.disabled;
 if(mode==='other-owner-fail'||mode==='other-owner-success'){
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  items=[{...photo,ownerId:'owner-b',originalPhoto:{image:'synthetic-JPEG-B'}}];
 }else if(mode==='same-id-relogin-fail'||mode==='same-id-relogin-success'){
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
  items=[{...photo,originalPhoto:{image:'new-login-JPEG-A'}}];
 }else if(mode==='same-id-rehydrate-fail'){
  items=[{...photo,name:'new owner-reviewed version'}];
 }else if(mode==='detached-fail'){
  button.remove();
 }
 if(mode.endsWith('-fail')&&mode!=='current-fail')reject(Error('prior signed owner private photo metadata SECRET'));
 else resolve();
 await running;
 return {mode,calls,startedDisabled,finalDisabled:button.disabled,connected:button.isConnected,
  notices,owner:window.closetAuth.user.id,rows:items.map(x=>({id:x.id,ownerId:x.ownerId}))};
};
`;
const modes=['current-success','current-fail','other-owner-fail','other-owner-success','same-id-relogin-fail','same-id-relogin-success','same-id-rehydrate-fail','detached-fail'];
const results=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   try{
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const got=await page.evaluate(m=>window.__runStyleCase(m),mode);
     assert.equal(got.calls,1,engineName+' '+width+' '+mode+': actual work entered');
     assert.equal(got.startedDisabled,true,engineName+' '+width+' '+mode+': disabled during await');
     assert.ok(got.notices.every(n=>!n.includes('SECRET')&&!n.includes('jpeg')),engineName+' '+width+' '+mode+': private error leaked');
     if(mode==='current-fail'){
      assert.equal(got.notices.length,1);
      assert.match(got.notices[0],/Reopen My Closet/);
      assert.equal(got.finalDisabled,false);
     }else if(mode==='current-success'){
      assert.deepEqual(got.notices,[]);assert.equal(got.finalDisabled,false);
     }else{
      assert.deepEqual(got.notices,[],engineName+' '+width+' '+mode+': stale owner notice');
      assert.equal(got.finalDisabled,true,engineName+' '+width+' '+mode+': stale control was mutated');
     }
     if(mode.startsWith('other-owner'))assert.equal(got.owner,'owner-b');
     if(mode.startsWith('same-id'))assert.equal(got.owner,'owner-a');
     results.push({engine:engineName,width,mode,passed:true});
    }
    assert.deepEqual(errors,[],engineName+' '+width+' browser page error');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,48);
await writeFile(resolve(out,'results.json'),JSON.stringify({source:'actual public/app.js owner Style callback functions',data:'synthetic only',release:'HOLD',total:results.length,results},null,2));
console.log('Mission 3 saved-photo Style browser account lease:',results.length,'PASS, Chromium+WebKit, 320/390/430; Family Alpha HOLD #255');
