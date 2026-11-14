// Real Chromium/WebKit callback-source harness for exact owner-signed
// "Get three outfit ideas" selection. Synthetic users and outfits only.
// No app deployment, cloud access, customer garments, or physical phone claim.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const folder=resolve(process.argv[2]||'benchmark/mission3-saved-outfit-focus-owner-session-browser');
await mkdir(folder,{recursive:true});
const source=await readFile('public/app.js','utf8');
const start=source.indexOf('function ownerStyleCardActionLease(item){');
const end=source.indexOf('function ownerWardrobeMutationLease(){',start);
assert.ok(start>=0&&end>start,'Production card focus/lease source not found');
assert.match(source,/styleFocus\.onclick=\(\)=>focusSavedClosetCardOwnerSafe\(item,styleFocus\)/);
const production=source.slice(start,end);
const js=`
'use strict';
let db,items,captureOperationEpoch=0;
let refreshStylistFocusItems,switchView;
let events=[];
const $=id=>document.getElementById(id);
function message(text){events.push('message:'+text);}
${production}
window.__exerciseFocus=(mode)=>{
 document.body.innerHTML='<section id="authGate" hidden></section><main id="appShell"></main>'+
  '<select id="stylistFocusItem"><option value="same-id">Synthetic original</option>'+
  '<option value="other">Other garment</option></select>'+
  '<form id="styleCollectionForm"></form>';
 events=[];captureOperationEpoch++;
 const item={id:'same-id',ownerId:'owner-a',image:'synthetic-JPEG-original-A'};
 items=[item];db={name:'closet-current-user-owner-a'};
 let revoked=false;
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked session')}};
 const button=document.createElement('button');button.textContent='Get three outfit ideas';
 document.getElementById('appShell').append(button);
 const select=$('stylistFocusItem'),form=$('styleCollectionForm');
 form.requestSubmit=()=>events.push('submit:'+select.value);
 const change=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  items=[{...item,ownerId:'owner-b',image:'other-user-JPEG'}];
 };
 const relogin=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
  items=[{...item,image:'new session-JPEG'}];
 };
 refreshStylistFocusItems=()=>{
  events.push('refresh');
  if(mode==='refresh-change')change();
  if(mode==='refresh-relogin')relogin();
  if(mode==='refresh-detach')button.remove();
  if(mode==='refresh-error')throw Error('PRIVATE original JPEG filename should not display');
 };
 switchView=view=>{
  events.push('switch:'+view);
  // Real app switchView() calls render() and removes the old closet card.
  // This is a valid same-owner navigation and must not cancel selection.
  button.remove();
  if(mode==='switch-change')change();
  if(mode==='switch-relogin')relogin();
 };
 if(mode==='old-owner')change();
 if(mode==='relogin')relogin();
 if(mode==='rehydrate')items=[{...item,name:'replacement same ID'}];
 if(mode==='revoked')revoked=true;
 if(mode==='signed-out')$('appShell').hidden=true;
 if(mode==='wrong-db')db={name:'closet-current-user-owner-x'};
 if(mode==='detached')button.remove();
 if(mode==='no-category')select.replaceChildren(new Option('Other','other'));
 if(mode==='no-form')form.remove();
 if(mode==='value-change'){
  let selected='';
  Object.defineProperty(select,'value',{configurable:true,
   get(){return selected;},set(value){selected=value;change();}});
 }
 focusSavedClosetCardOwnerSafe(item,button);
 return {mode,events,selected:select.value,owner:window.closetAuth?.user?.id,
  buttonConnected:button.isConnected,itemCount:items.length};
};
`;
const modes=['valid','old-owner','relogin','rehydrate','revoked','signed-out',
 'wrong-db','detached','no-category','no-form','refresh-change','refresh-relogin',
 'refresh-detach','refresh-error','switch-change','switch-relogin','value-change'];
const results=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   try{
    const page=await context.newPage(),pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const actual=await page.evaluate(value=>window.__exerciseFocus(value),mode);
     assert.ok(actual.events.every(event=>!event.includes('PRIVATE')&&
      !event.includes('should not display')),engineName+' '+width+' '+mode+' disclosure');
     if(mode==='valid'){
      assert.deepEqual(actual.events,['refresh','switch:stylist','submit:same-id']);
      assert.equal(actual.buttonConnected,false,'real switchView rerenders and detaches old card');
     }else if(['old-owner','relogin','rehydrate','revoked','signed-out','wrong-db','detached'].includes(mode)){
      assert.deepEqual(actual.events,[],engineName+' '+width+' '+mode+' rejects stale intent');
     }else if(['no-category','no-form','refresh-error'].includes(mode)){
      assert.equal(actual.events[0],'refresh');
      assert.equal(actual.events.length,2);
      assert.match(actual.events[1],/Could not safely style/);
     }else if(['refresh-change','refresh-relogin','refresh-detach'].includes(mode)){
      assert.deepEqual(actual.events,['refresh']);
     }else if(['switch-change','switch-relogin','value-change'].includes(mode)){
      assert.deepEqual(actual.events,['refresh','switch:stylist']);
     }
     results.push({browser:engineName,width,mode,pass:true});
    }
    assert.deepEqual(pageErrors,[],engineName+' '+width+' page errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,102);
await writeFile(resolve(folder,'results.json'),JSON.stringify({
 source:'exact production ownerStyleCardActionLease/focusSavedClosetCardOwnerSafe',
 data:'synthetic only',familyAlpha:'HOLD',releaseAuthorized:false,total:results.length,
 results
},null,2));
console.log('Mission 3 general outfit focus owner session:',results.length,
 'browser-source assertions PASS, Chromium/WebKit, mobile viewport widths, HOLD.');
