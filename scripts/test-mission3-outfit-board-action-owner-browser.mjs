// Real Chromium and WebKit run the actual Board Save, draft load/retry,
// and owner-session UI finalizers. Synthetic data only, no hosted cloud.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const dir=resolve(process.argv[2]||'benchmark/mission3-outfit-board-action-owner-browser');
await mkdir(dir,{recursive:true});
const src=await readFile('public/outfit-board.js','utf8');
function extract(a,b){const i=src.indexOf(a),j=src.indexOf(b,i);
 assert.ok(i>=0&&j>i,'missing source '+a);return src.slice(i,j);}
const lease=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const store=extract('async function storeBoard({replaceDraft=null}={}){','async function loadLatestBoardDraft(){');
const load=extract('async function loadLatestBoardDraft(){','function syncBoardInputs(){');
const actions=extract("$('refreshOutfitWardrobe').onclick=async()=>{","$('closeBoardPicker').onclick=");
const save=extract("$('saveBoard').onclick=async()=>{",'function renderTrendReferences()');
const sourceCode=`
'use strict';
let db,currentBoard,items,savedOutfitBoards,boardStatusSerial=0,
 captureOperationEpoch=1,boardConflictDraft=null,boardExpectedStoredDraft='null',
 boardCommittedDraft='null',events=[],nativeLossless04Active=false;
const $=id=>document.getElementById(id);
let persistBoardState,saveOwnedOutfit,refreshSavedWardrobeForOutfits,queued;
function cancelBoardDraftTimer(){events.push('cancel');}
function boardHasUnsavedDraft(){return false;}
function renderSavedOutfitBoards(){events.push('render-saved');}
function boardDraftStatus(s,retry=false){
 events.push('status:'+s);$('boardSaveStatus').textContent=s;
 $('retryBoardDraft').hidden=!retry;
}
function cleanOutfitBoard(x){return x;}
function syncBoardInputs(){events.push('sync');}
function renderOutfitBoard(){events.push('render-board');}
function nativeLossless04Notify(s){events.push('native:'+s);}
const nativeLossless04=null;
${lease}
${store}
${load}
${actions}
${save}
window.__scenario=async mode=>{
 events=[];boardStatusSerial=0;captureOperationEpoch++;
 $('boardName').focus=()=>events.push('focus');
 boardConflictDraft=null;boardExpectedStoredDraft='null';boardCommittedDraft='null';
 currentBoard={slots:{top:'same-id'},ideas:{}};
 savedOutfitBoards=[];items=[{id:'same-id',ownerId:'owner-a',image:'synthetic-JPEG-A'}];
 let revoked=false;
 db={name:'closet-current-user-owner-a',transaction(){return{objectStore(){return{get(){
  const request={};queueMicrotask(()=>{request.result={current:{slots:{top:'same-id'}},saved:[]};request.onsuccess?.()});return request;
 }}}}}};
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked')}};
 $('authGate').hidden=true;$('appShell').hidden=false;
 $('saveBoard').disabled=false;$('boardSaveStatus').textContent='initial';
 $('refreshOutfitWardrobe').hidden=true;$('retryBoardDraft').hidden=false;
 let finish,fail,signal;
 const gate=new Promise((yes,no)=>{finish=yes;fail=no;});gate.catch(()=>{});
 const started=new Promise(yes=>signal=yes);
 persistBoardState=async()=>{events.push('persist')};
 saveOwnedOutfit=async()=>{events.push('save')};
 refreshSavedWardrobeForOutfits=async()=>{events.push('refresh')};
 queued=fn=>fn();
 const switchOwner=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  items=[{id:'same-id',ownerId:'owner-b',image:'PRIVATE-JPEG-B'}];
  $('boardSaveStatus').textContent='owner B screen';
  $('saveBoard').disabled=true;
 };
 const relogin=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
  $('boardSaveStatus').textContent='new account session';
  $('saveBoard').disabled=true;
 };
 if(mode==='store-owner'||mode==='store-relogin'||mode==='store-old-error'||
    mode==='retry-owner'||mode==='keep-owner'){
  persistBoardState=()=>{events.push('persist');signal();return gate};
 }
 if(mode==='store-current-error')persistBoardState=async()=>{throw Error('PRIVATE metadata')};
 if(mode==='save-owner'||mode==='save-relogin'||mode==='save-old-error'){
  saveOwnedOutfit=()=>{events.push('save');signal();return gate};
 }
 if(mode==='save-current-error')saveOwnedOutfit=async()=>{throw Error('PRIVATE path A')};
 if(mode==='save-wardrobe-changed')saveOwnedOutfit=async()=>{
  const e=Error('PRIVATE path A');e.code='OUTFIT_WARDROBE_CHANGED';throw e;
 };
 if(mode==='refresh-owner'){
  refreshSavedWardrobeForOutfits=()=>{events.push('refresh');signal();return gate};
 }
 if(mode==='load-owner'){
  queued=fn=>{signal();return gate.then(fn)};
 }
 if(mode.startsWith('keep-'))boardConflictDraft={stored:'original',owner:'owner-a'};
 const run=mode.startsWith('store-')?storeBoard():
  mode.startsWith('save-')?$('saveBoard').onclick():
  mode.startsWith('refresh-')?$('refreshOutfitWardrobe').onclick():
  mode.startsWith('retry-')?$('retryBoardDraft').onclick():
  mode.startsWith('load-')?$('loadLatestBoardDraft').onclick():
  $('keepLocalBoardDraft').onclick();
 const isGated=['store-owner','store-relogin','store-old-error','retry-owner','keep-owner',
  'save-owner','save-relogin','save-old-error','refresh-owner','load-owner'].includes(mode);
 if(isGated){
  await started;
  if(mode==='store-relogin'||mode==='save-relogin')relogin();else switchOwner();
  if(mode.endsWith('old-error'))fail(Error('PRIVATE old owner JPEG'));
  else finish();
 }
 await run;
 return{mode,events,status:$('boardSaveStatus').textContent,
  disabled:$('saveBoard').disabled,refreshHidden:$('refreshOutfitWardrobe').hidden};
};
`;
const modes=['store-success','store-owner','store-relogin','store-old-error',
 'store-current-error','save-success','save-owner','save-relogin','save-old-error',
 'save-current-error','save-wardrobe-changed','refresh-success','refresh-owner',
 'retry-success','retry-owner','load-success','load-owner','keep-success','keep-owner'];
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setContent('<!doctype html><html><body>'+
     '<div id="authGate" hidden></div><main id="appShell">'+
     '<button id="refreshOutfitWardrobe"></button><button id="retryBoardDraft"></button>'+
     '<button id="loadLatestBoardDraft"></button><button id="keepLocalBoardDraft"></button>'+
     '<button id="saveBoard"></button><button id="boardName"></button>'+
     '<p id="boardSaveStatus"></p></main></body></html>');
    await page.addScriptTag({content:sourceCode});
    for(const mode of modes){
     const got=await page.evaluate(mode=>window.__scenario(mode),mode);
     assert.ok(!got.status.includes('PRIVATE'),name+' '+width+' '+mode+' privacy');
     if(mode==='store-success'){
      assert.ok(got.events.includes('render-saved'));assert.match(got.status,/Outfit changes saved/);
     }else if(['store-owner','store-relogin','store-old-error'].includes(mode)){
      assert.equal(got.events.includes('render-saved'),false);
      assert.ok(!got.events.some(e=>e.includes('PRIVATE')));
     }else if(mode==='store-current-error'){
      assert.match(got.status,/This outfit could not be saved/);
     }else if(mode==='save-success'){
      assert.ok(got.events.includes('render-saved'));assert.match(got.status,/Outfit saved/);
     }else if(['save-owner','save-relogin','save-old-error'].includes(mode)){
      assert.equal(got.events.includes('render-saved'),false);
      assert.equal(got.disabled,true);
     }else if(mode==='save-current-error'){
      assert.equal(got.status,'Could not save this outfit. Please try again.');
     }else if(mode==='save-wardrobe-changed'){
      assert.match(got.status,/Selected clothing changed/);
      assert.equal(got.refreshHidden,false);
     }else if(mode==='refresh-success'||mode==='retry-success'||mode==='load-success'||mode==='keep-success'){
      assert.ok(got.events.includes('focus')||got.events.includes('sync')||got.events.includes('render-saved'),name+' '+width+' '+mode);
     }else if(['refresh-owner','retry-owner','load-owner','keep-owner'].includes(mode)){
      assert.equal(got.events.includes('focus'),false,name+' '+width+' '+mode+' stale focus');
     }
     results.push({engine:name,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],name+' '+width+' page errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,114);
await writeFile(resolve(dir,'results.json'),JSON.stringify({source:'public/outfit-board.js exact source',
 familyAlpha:'HOLD',scope:'synthetic accounts only',total:results.length,results},null,2));
console.log('Mission 3 owner-bound outfit board actions:',results.length,'PASS browser tests, no deploy');
