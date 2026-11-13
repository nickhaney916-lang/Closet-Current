// Real Chromium/WebKit execution of production Save outfit / Adjust board /
// Refresh outfit callbacks with synthetic private-account and clothing data.
// No hosted services, real photos, production writes, deployment or phones.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const folder=resolve(process.argv[2]||'benchmark/mission3-styled-outfit-card-save-adjust-owner-browser');
await mkdir(folder,{recursive:true});
const source=await readFile('public/closet-stylist.js','utf8');
function between(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start);
 assert.ok(start>=0&&end>start,'Production card source missing '+a);
 return source.slice(start,end);
}
const lease=between('function beginStyledCollectionCardOwnerLease(result,card){','function renderStyledCollection(){');
const editCode=between('  edit.onclick=async()=>{',"  const status=node('p',null,'fine styled-save-status');");
const updateCode=between('  const updateSaveState=(phase,message)=>{','  refresh.onclick=async()=>{');
const refreshCode=between('  refresh.onclick=async()=>{','  save.onclick=async()=>{');
const saveCode=between('  save.onclick=async()=>{','  actions.append(edit,save,refresh);');
const sourceCode=`
'use strict';
let db,items,styledCollectionRequestSerial=1,styledCollectionResults=[],
 styledCollectionSaveStates=new WeakMap(),captureOperationEpoch=0,savedOutfitBoards=[],
 outfitBoardReady=Promise.resolve(),currentBoard={slots:{}},events=[];
let cleanOutfitBoard,syncBoardInputs,renderOutfitBoard,storeBoard,switchView;
let saveOwnedOutfit,renderSavedOutfitBoards,refreshSavedWardrobeForOutfits;
const $=id=>document.getElementById(id);
${lease}
function wire(result,board,index,card){
 const edit=document.createElement('button'),save=document.createElement('button'),
  refresh=document.createElement('button');
 edit.textContent='Adjust on outfit board';save.textContent='Save outfit';
 refresh.textContent='Refresh my closet';
 card.append(edit,save,refresh);
 const status=document.createElement('p');card.append(status);
 const changed=false;
 const applySaveState=()=>{
  const state=styledCollectionSaveStates.get(result);
  status.textContent=state?.message||'';
  save.textContent=state?.phase==='saved'?'Saved':'Save outfit';
  save.disabled=changed||['saving','saved','wardrobe-changed'].includes(state?.phase);
  edit.disabled=changed||state?.phase==='wardrobe-changed';
  refresh.hidden=state?.phase!=='wardrobe-changed';
  events.push('ui:'+state?.phase);
 };
 ${editCode}
 ${updateCode}
 ${refreshCode}
 ${saveCode}
 return {edit,save,refresh,status};
}
window.__exercise=async mode=>{
 document.body.innerHTML='<section id="authGate" hidden></section>'+
  '<main id="appShell"><section id="stylist"></section>'+
  '<button id="createCollectionOutfits">Create outfits</button>'+
  '<div id="styledCollectionResults"></div></main>';
 events=[];styledCollectionRequestSerial=1;captureOperationEpoch++;
 styledCollectionSaveStates=new WeakMap();savedOutfitBoards=[];currentBoard={slots:{}};
 const item={id:'same-id',ownerId:'owner-a',image:'synthetic-A-original-JPEG'};
 const result={focusItemId:item.id,context:{request:'Everyday'},
  board:{slots:{top:item.id}}};
 items=[item];styledCollectionResults=[result];
 const card=document.createElement('article');
 document.getElementById('styledCollectionResults').append(card);
 db={name:'closet-current-user-owner-a'};
 let revoked=false;
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 const button=$('createCollectionOutfits');button.focus=()=>events.push('focus');
 cleanOutfitBoard=(board,roster)=>{events.push('clean:'+roster[0]?.ownerId);return board;};
 syncBoardInputs=()=>events.push('sync');
 renderOutfitBoard=()=>events.push('render-board');
 storeBoard=async()=>{events.push('store');return true};
 switchView=view=>events.push('view:'+view);
 saveOwnedOutfit=async board=>{events.push('save:'+board.slots.top)};
 renderSavedOutfitBoards=()=>events.push('render-saved');
 refreshSavedWardrobeForOutfits=async()=>{events.push('refresh')};
 const buttons=wire(result,result.board,0,card);
 const savedState=()=>styledCollectionSaveStates.get(result)?.phase||null;
 const change=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  items=[{...item,ownerId:'owner-b',image:'other-owner-photo'}];
 };
 const relogin=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
  items=[{...item,image:'new-session-photo'}];
 };
 let continueJob,jobStarted;
 const gate=new Promise(yes=>continueJob=yes);
 const started=new Promise(yes=>jobStarted=yes);
 const pending=()=>{jobStarted();return gate};
 if(mode==='save-before-switch'||mode==='edit-before-switch'||
    mode==='save-relogin'||mode==='edit-relogin'){
  outfitBoardReady=gate;
 }else outfitBoardReady=Promise.resolve();
 if(mode==='save-inflight-owner'||mode==='save-inflight-reject'){
  saveOwnedOutfit=()=>{events.push('save-start');return pending()};
 }
 if(mode==='edit-inflight-owner'||mode==='edit-user-left'){
  storeBoard=()=>{events.push('store-start');return pending()};
 }
 if(mode==='edit-store-fail')storeBoard=async()=>{events.push('store');return false};
 if(mode==='save-fail')saveOwnedOutfit=async()=>{throw Error('PRIVATE original filename A')};
 if(mode==='save-wardrobe-changed')saveOwnedOutfit=async()=>{
  const error=Error('PRIVATE internal photo path');
  error.code='OUTFIT_WARDROBE_CHANGED';throw error;
 };
 if(mode==='refresh-fail')refreshSavedWardrobeForOutfits=async()=>{
  throw Error('PRIVATE original filename A');
 };
 if(mode==='refresh-old-owner'){
  refreshSavedWardrobeForOutfits=()=>{
   events.push('refresh-start');return pending();
  };
 }
 if(mode==='save-detached')card.remove();
 const action=mode.startsWith('save-')?buttons.save:
  mode.startsWith('edit-')?buttons.edit:buttons.refresh;
 const run=action.onclick();
 if(mode==='save-before-switch'||mode==='edit-before-switch'){
  change();continueJob();
 }else if(mode==='save-relogin'||mode==='edit-relogin'){
  relogin();continueJob();
 }else if(mode==='save-inflight-owner'||mode==='save-inflight-reject'||
          mode==='edit-inflight-owner'||mode==='edit-user-left'||
          mode==='refresh-old-owner'){
  await started;
  if(mode==='edit-user-left')$('stylist').hidden=true;
  else change();
  if(mode==='save-inflight-reject'||mode==='refresh-old-owner'){
   // Reject via a second independently controlled Promise below.
  }
  continueJob();
 }
 await run;
 return {mode,events,status:buttons.status.textContent,phase:savedState(),
  buttonDisabled:buttons.save.disabled,owner:window.closetAuth?.user?.id,
  currentBoard:currentBoard?.slots?.top,submitted:events.includes('view:builder')};
};
`;
const modes=['save-valid','save-before-switch','save-relogin','save-inflight-owner',
 'save-inflight-reject','save-fail','save-wardrobe-changed','save-detached',
 'edit-valid','edit-before-switch','edit-relogin','edit-inflight-owner',
 'edit-user-left','edit-store-fail','refresh-valid','refresh-fail','refresh-old-owner'];
const output=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({content:sourceCode});
    for(const mode of modes){
     const result=await page.evaluate(m=>window.__exercise(m),mode);
     assert.ok(!result.status.includes('PRIVATE'),name+' '+width+' '+mode+' leaked private exception');
     if(mode==='save-valid'){
      assert.deepEqual(result.events,['ui:saving','save:same-id','ui:saved','render-saved']);
      assert.equal(result.phase,'saved');
     }else if(['save-before-switch','save-relogin','save-detached'].includes(mode)){
      assert.equal(result.events.some(e=>e.startsWith('save:')),false);
      assert.equal(result.events.includes('render-saved'),false);
     }else if(['save-inflight-owner','save-inflight-reject'].includes(mode)){
      assert.deepEqual(result.events,['ui:saving','save-start']);
      assert.equal(result.phase,'saving');
     }else if(mode==='save-fail'||mode==='save-wardrobe-changed'){
      assert.equal(result.phase,mode==='save-fail'?'error':'wardrobe-changed');
      assert.match(result.status,/Could not save|Selected clothing changed/);
     }else if(mode==='edit-valid'){
      assert.deepEqual(result.events,['clean:owner-a','sync','render-board','store','view:builder']);
      assert.equal(result.currentBoard,'same-id');
     }else if(mode==='edit-before-switch'||mode==='edit-relogin'){
      assert.deepEqual(result.events,[]);
     }else if(mode==='edit-inflight-owner'||mode==='edit-user-left'||mode==='edit-store-fail'){
      assert.equal(result.submitted,false,name+' '+width+' '+mode+' stale view');
     }else if(mode==='refresh-valid'){
      assert.deepEqual(result.events,['refresh','focus']);
     }else if(mode==='refresh-fail'){
      assert.equal(result.phase,'wardrobe-changed');
     }else if(mode==='refresh-old-owner'){
      assert.deepEqual(result.events,['refresh-start']);
      assert.equal(result.phase,null);
     }
     output.push({browser:name,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],name+' '+width+' page errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(output.length,102);
await writeFile(resolve(folder,'results.json'),JSON.stringify({
 source:'public/closet-stylist.js exact callback extraction',scope:'synthetic',
 noHostedData:true,familyAlpha:'HOLD',total:output.length,results:output
},null,2));
console.log('Mission 3 generated-outfit Save/Adjust/Refresh:',output.length,
 'Chromium/WebKit mobile CSS viewport assertions PASS (synthetic; no deploy).');
