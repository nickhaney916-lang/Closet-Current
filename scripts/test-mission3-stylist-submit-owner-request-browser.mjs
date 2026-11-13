// Execute the actual async Stylist form completion inside Chromium and WebKit.
// All photos/accounts are synthetic; no network, real phones or hosted data.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const dir=resolve(process.argv[2]||'benchmark/mission3-stylist-submit-owner-request-browser');
await mkdir(dir,{recursive:true});
const source=await readFile('public/closet-stylist.js','utf8');
const start=source.indexOf('function beginOwnerStyledCollectionRequest(){');
const end=source.indexOf("for(const id of ['stylistOccasion'",start);
assert.ok(start>0&&end>start,'Actual production Stylist request lease required');
const actual=source.slice(start,end);
const js=`
'use strict';
let db,items,styledCollectionResults=[],styledCollectionRequestSerial=0,captureOperationEpoch=0;
let closetReady=Promise.resolve(),activeTrendLibrary={updatedAt:'synthetic'},events=[];
let refreshStylistFocusItems,refreshTrendLibrary,styleOwnedCollection,renderStyledCollection;
function $(id){return document.getElementById(id);}
${actual}
window.__scenario=async mode=>{
 document.body.innerHTML='<div id="authGate" hidden></div><div id="appShell">'+
  '<form id="styleCollectionForm"><button id="createCollectionOutfits" type="submit">Create outfits</button></form>'+
  '<p id="stylistStatus">Idle</p>'+
  '<select id="stylistOccasion"><option>Everyday</option><option>Work</option></select>'+
  '<select id="stylistAudience"><option>Women</option><option>Men</option></select>'+
  '<select id="stylistSeason"><option>Fall</option><option>Spring</option></select>'+
  '<select id="stylistFocusItem"><option value="same-id">Original A</option>'+
   '<option value="other-id">Other</option></select></div>';
 styledCollectionResults=[];styledCollectionRequestSerial=0;captureOperationEpoch++;
 events=[];
 const a={id:'same-id',ownerId:'owner-a',image:'synthetic-original-JPEG-A'};
 items=[a];db={name:'closet-current-user-owner-a'};
 let revoked=false;
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked')}};
 const status=$('stylistStatus'),button=$('createCollectionOutfits');
 let completed;
 const gate=new Promise((yes,no)=>{completed={yes,no};});gate.catch(()=>{});
 let started;
 const began=new Promise(yes=>{started=yes;});
 refreshStylistFocusItems=()=>events.push('refresh');
 refreshTrendLibrary=()=>{
  events.push('trend');started();return gate;
 };
 styleOwnedCollection=(rows,request)=>{
  events.push('style:'+request.focusItemId);
  return [{focusItemId:request.focusItemId,original:rows[0].image,request}];
 };
 renderStyledCollection=()=>events.push('render');
 const swap=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  items=[{...a,ownerId:'owner-b',image:'synthetic-private-JPEG-B'}];
  status.textContent='new owner screen';button.disabled=true;
 };
 const relogin=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
  items=[{...a,image:'different same-owner-login photo'}];
  status.textContent='new session screen';button.disabled=true;
 };
 if(mode==='wrong-db')db={name:'closet-current-user-x'};
 if(mode==='signed-out')$('appShell').hidden=true;
 const job=$('styleCollectionForm').onsubmit(new Event('submit',{cancelable:true}));
 if(mode==='wrong-db'||mode==='signed-out'){await job;
  return {mode,events,status:status.textContent,disabled:button.disabled,resultCount:styledCollectionResults.length};}
 await began;
 if(mode==='owner-switch'||mode==='fail-after-owner-switch')swap();
 if(mode==='same-id-relogin')relogin();
 if(mode==='revoked')revoked=true;
 if(mode==='epoch-rotated')captureOperationEpoch++;
 if(mode==='rehydrate')items=[{...a,name:'new reviewed row same ID'}];
 if(mode==='extra-garment')items.push({id:'new-shoes',ownerId:'owner-a'});
 if(mode==='focus-change')$('stylistFocusItem').value='other-id';
 if(mode==='season-change')$('stylistSeason').value='Spring';
 if(mode==='season-change-back'){
  $('stylistSeason').value='Spring';
  styledCollectionRequestSerial++;
  $('stylistSeason').value='Fall';
 }
 if(mode==='fail-current'||mode==='fail-after-owner-switch')completed.no(Error('PRIVATE-JPEG-A metadata'));
 else completed.yes();
 await job;
 return {mode,events,status:status.textContent,disabled:button.disabled,
  resultCount:styledCollectionResults.length,original:styledCollectionResults[0]?.original,
  focus:styledCollectionResults[0]?.focusItemId};
};
`;
const modes=['success','fail-current','owner-switch','fail-after-owner-switch',
 'same-id-relogin','revoked','epoch-rotated','rehydrate','extra-garment',
 'focus-change','season-change','season-change-back','wrong-db','signed-out'];
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({
    viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'
   });
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(String(err)));
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const x=await page.evaluate(m=>window.__scenario(m),mode);
     assert.ok(!String(x.status).includes('PRIVATE-JPEG-A'),name+' '+width+' '+mode+' leaked private exception');
     if(mode==='success'){
      assert.deepEqual(x.events,['refresh','trend','style:same-id','render']);
      assert.equal(x.resultCount,1);
      assert.equal(x.focus,'same-id');
      assert.equal(x.disabled,false);
     }else if(mode==='fail-current'){
      assert.deepEqual(x.events,['refresh','trend']);
      assert.match(x.status,/Could not create outfits/);
      assert.equal(x.disabled,false);
     }else if(['wrong-db','signed-out'].includes(mode)){
      assert.deepEqual(x.events,[]);
      assert.equal(x.resultCount,0);
     }else{
      assert.deepEqual(x.events,['refresh','trend'],name+' '+width+' '+mode+' stale render');
      assert.equal(x.resultCount,0);
      if(['owner-switch','fail-after-owner-switch','same-id-relogin'].includes(mode))
       assert.equal(x.disabled,true,name+' '+width+' '+mode+' stale button');
     }
     results.push({browser:name,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],name+' '+width+' JS errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,84);
await writeFile(resolve(dir,'results.json'),JSON.stringify({
 source:'actual public/closet-stylist.js form handler and owner request lease',
 data:'synthetic',familyAlpha:'HOLD',releaseAuthorized:false,total:results.length,results
},null,2));
console.log('Mission 3 asynchronous Stylist submit owner and supersession lease:',results.length,'PASS Chromium/WebKit 320/390/430, no deploy');
