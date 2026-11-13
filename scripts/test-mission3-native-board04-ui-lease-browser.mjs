// Execute the production native BOARD04 UI source in actual Chromium/WebKit
// with synthetic owner IDs and a fake controller; no hosted/auth/phone access.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const dir=resolve(process.argv[2]||'benchmark/mission3-native-board04-ui-lease-browser');
await mkdir(dir,{recursive:true});
const source=await readFile('public/outfit-board.js','utf8');
function extract(a,b){const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Source boundary '+a);return source.slice(i,j)}
const helpers=extract('function nativeLossless04Notify(error){','function nativeLossless04ClearPreview(){');
const lease=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const save=extract("$('saveBoard').onclick=async()=>{",'function renderTrendReferences()');
const controls=extract('   function addControl(id,label,fn){',"   $('saveBoard').after(controls);");
const js=`
'use strict';
let nativeLossless04Active=true,nativeLossless04=null,db,captureOperationEpoch=0,
 boardStatusSerial=0,currentBoard={slots:{top:'same-id'}},savedOutfitBoards=[],
 boardConflictDraft=null,events=[];
const $=id=>document.getElementById(id);
function node(kind,label){const el=document.createElement(kind);el.textContent=label;return el;}
function confirmDelete(){events.push('confirm');return window.__approve;}
window.confirm=confirmDelete;
function cancelBoardDraftTimer(){events.push('cancel-timer');}
function boardDraftStatus(){events.push('normal-board-status');}
function renderSavedOutfitBoards(){events.push('render-saved');}
async function saveOwnedOutfit(){events.push('normal-save');}
${helpers}
${lease}
${save}
const saveProduction=$('saveBoard').onclick;
function wire(){
 const controls=$('native-controls');
 ${controls}
}
window.__scenario=async mode=>{
 document.body.innerHTML='<div id="authGate" hidden></div><main id="appShell">'+
  '<button id="saveBoard">Save outfit</button><p id="boardSaveStatus">initial</p>'+
  '<section id="native-controls"></section></main>';
 $('saveBoard').onclick=saveProduction;wire();
 captureOperationEpoch++;events=[];window.__approve=mode!=='delete-declined';
 let active=true,revoked=false;
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked')}};
 db={name:'closet-current-user-owner-a'};
 let begin,finish,fail;
 const started=new Promise(yes=>begin=yes);
 const pending=new Promise((yes,no)=>{finish=yes;fail=no});pending.catch(()=>{});
 const controller={
  status(){return {active}},
  persist:async settings=>{events.push('persist:'+settings.asNew)},
  cancel:async()=>{events.push('cancel')},
  remove:async index=>{events.push('remove:'+index)},
  get selected(){return 0}
 };
 if(['save-owner','save-relogin','save-stale-error','save-consumer-replaced',
      'changes-owner','delete-owner'].includes(mode)){
  if(mode==='delete-owner')controller.remove=()=>{events.push('remove-pending');begin();return pending};
  else controller.persist=()=>{events.push('persist-pending');begin();return pending};
 }
 if(['save-error','changes-error'].includes(mode))
  controller.persist=async()=>{throw Error('PRIVATE original JPEG path A')};
 if(mode==='save-inactive')active=false;
 nativeLossless04=controller;
 const change=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  $('boardSaveStatus').textContent='new owner';
 };
 const relogin=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
  $('boardSaveStatus').textContent='new session';
 };
 const action=mode.startsWith('save-')?$('saveBoard'):
  mode.startsWith('changes-')?$('native04SaveChanges'):
  mode.startsWith('cancel-')?$('native04CancelChanges'):
  $('native04DeleteOutfit');
 const task=action.onclick();
 if(['save-owner','save-relogin','save-stale-error','save-consumer-replaced',
     'changes-owner','delete-owner'].includes(mode)){
  await started;
  if(mode==='save-relogin')relogin();
  else if(mode==='save-consumer-replaced')nativeLossless04={...controller};
  else change();
  if(mode==='save-stale-error')fail(Error('PRIVATE original JPEG path B'));
  else finish();
 }
 if(mode==='edit-revoked')revoked=true;
 await task;
 return {mode,events,status:$('boardSaveStatus').textContent,disabled:action.disabled};
};
`;
const modes=['save-valid','save-owner','save-relogin','save-stale-error',
 'save-consumer-replaced','save-error','save-inactive','changes-valid',
 'changes-owner','changes-error','cancel-valid','delete-valid',
 'delete-declined','delete-owner'];
const rows=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.setContent('<!doctype html><html><body><button id="saveBoard"></button></body></html>');
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const got=await page.evaluate(mode=>window.__scenario(mode),mode);
     assert.ok(!got.status.includes('PRIVATE'),name+' '+width+' '+mode+' private text');
     if(mode==='save-valid'){
      assert.deepEqual(got.events,['persist:true']);assert.equal(got.disabled,false);
     }else if(['save-owner','save-relogin','save-stale-error','save-consumer-replaced'].includes(mode)){
      assert.deepEqual(got.events,['persist-pending']);assert.equal(got.disabled,true);
     }else if(mode==='save-error'){
      assert.match(got.status,/private outfit action could not finish/i);
      assert.equal(got.disabled,false);
     }else if(mode==='save-inactive'){
      assert.deepEqual(got.events,[]);assert.equal(got.disabled,false);
     }else if(mode==='changes-valid'){
      assert.deepEqual(got.events,['persist:false']);assert.equal(got.disabled,false);
     }else if(mode==='changes-owner'){
      assert.deepEqual(got.events,['persist-pending']);assert.equal(got.disabled,true);
     }else if(mode==='changes-error'){
      assert.match(got.status,/private outfit action could not finish/i);
     }else if(mode==='cancel-valid'){
      assert.deepEqual(got.events,['cancel']);
     }else if(mode==='delete-valid'){
      assert.deepEqual(got.events,['confirm','remove:0']);
     }else if(mode==='delete-declined'){
      assert.deepEqual(got.events,['confirm']);
     }else if(mode==='delete-owner'){
      assert.deepEqual(got.events,['confirm','remove-pending']);
      assert.equal(got.disabled,true);
     }
     rows.push({browser:name,width,mode,passed:true});
    }
    assert.deepEqual(errors,[],name+' '+width+' page errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(rows.length,84);
await writeFile(resolve(dir,'results.json'),JSON.stringify({
 source:'production research-native BOARD04 controls and exact owner lease',
 scope:'synthetic, not live device or cloud',familyAlpha:'HOLD',passed:rows.length,results:rows
},null,2));
console.log('Native research BOARD04 async control owner lease:',rows.length,'Chromium/WebKit synthetic browser cases PASS. NO DEPLOY.');
