// Real Chromium/WebKit execute exact owner-bound panel publication and logout
// source. All accounts and image IDs are synthetic. No network/hosted cloud.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-native-optional-panel-mount-owner-browser');
await mkdir(out,{recursive:true});
const source=await readFile('public/outfit-board.js','utf8');
function extract(a,b){const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'missing actual source: '+a);return source.slice(i,j);}
const leases=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const lock=extract("window.addEventListener('closet:session-locked',()=>{",'async function persistBoardState(');
async function scenario(mode){
 document.body.innerHTML='<div id="authGate" hidden></div><main id="appShell">'+
  '<button id="retryBoardDraft"></button><div id="boardDraftConflictActions"></div>'+
  '<p id="boardSaveStatus">owner A</p></main>';
 captureOperationEpoch++;nativeLossless04Active=true;events=[];
 let active=true,revoked=false;
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 db={name:'closet-current-user-owner-a'};
 const original={status(){return {active}},dispose(){events.push('dispose:controller')}};
 nativeLossless04=original;
 currentBoard={slots:{top:'original-A'}};savedOutfitBoards=[{name:'owner-a'}];
 boardConflictDraft={owner:'owner-a'};
 for(const key of panelKeys)window[key]=null;
 window.nativeLossless04Bridge=original;
 const callbacks=beginNativeBoard04OwnerCallbacks();
 const name=mode.startsWith('3d-')?'native3D05Bridge':
  mode.startsWith('readiness-')?'nativePhotoReadiness08Bridge':
  mode.startsWith('style-')?'styleOwnedLive03Bridge':'nativeMobile09Bridge';
 const pane={dispose(){events.push('dispose:panel')}};
 const change=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  $('boardSaveStatus').textContent='owner B';
 };
 if(mode.endsWith('switch'))change();
 if(mode==='same-id-relogin'){
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
 }
 if(mode==='epoch-rotate')captureOperationEpoch++;
 if(mode==='revoked-auth')revoked=true;
 if(mode==='inactive-controller')active=false;
 if(mode==='replace-controller')nativeLossless04={status(){return {active:true}}};
 if(mode==='wrong-db')db={name:'not-private'};
 if(mode==='throw-dispose'){
  change();pane.dispose=()=>{events.push('dispose-threw');throw Error('PRIVATE old JPEG')};
 }
 const action=mode==='signout'||mode==='lock-then-stale'?'lock':'mount';
 let published;
 if(action==='mount'){
  published=publishNative04OwnerPanel(callbacks,original,pane,name);
 }else{
  for(const key of panelKeys){
   window[key]={dispose(){events.push('clear:'+key)}};
  }
  window.dispatchEvent(new Event('closet:session-locked'));
  if(mode==='lock-then-stale'){
   change();
   published=publishNative04OwnerPanel(callbacks,original,pane,'native3D05Bridge');
  }
 }
 return {mode,events,published:published??null,
  retainedPanel:window[name]===pane,
  bridgeNull:panelKeys.every(key=>window[key]===null),
  controllerNull:nativeLossless04===null,
  privateStatus:$('boardSaveStatus').textContent.includes('PRIVATE'),
  clearedBoard:currentBoard?.slots?.top===undefined,
  savedCount:savedOutfitBoards.length};
}
const js=[
 "'use strict';",
 "let db,captureOperationEpoch=0,nativeLossless04=null,nativeLossless04Active=true,boardDraftTimer=null,boardStatusSerial=0,boardConflictDraft=null,currentBoard={slots:{}},savedOutfitBoards=[],events=[];",
 "const panelKeys=['native3D05Bridge','nativePhotoReadiness08Bridge','styleOwnedLive03Bridge','nativeMobile09Bridge'];",
 "const $=id=>document.getElementById(id);",
 "function cancelBoardDraftTimer(){events.push('cancel-timer')}",
 "function cleanOutfitBoard(x){events.push('empty-board');return {...x}}",
 "function nativeLossless04ClearPreview(){events.push('clear-preview')}",
 "function syncBoardInputs(){events.push('sync')}",
 "function renderOutfitBoard(){events.push('render')}",
 leases,lock,
 "window.__scenario=("+scenario.toString()+");"
].join('\n');
const modes=['3d-valid','readiness-valid','style-valid','mobile-valid',
 '3d-switch','readiness-switch','style-switch','mobile-switch',
 'same-id-relogin','epoch-rotate','revoked-auth','inactive-controller',
 'replace-controller','wrong-db','throw-dispose','signout','lock-then-stale'];
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
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const x=await page.evaluate(m=>window.__scenario(m),mode);
     assert.equal(x.privateStatus,false,name+' '+width+' '+mode+' private error text');
     if(mode.endsWith('-valid')){
      assert.equal(x.published,true);assert.equal(x.retainedPanel,true);
      assert.deepEqual(x.events,[]);
     }else if(mode.endsWith('-switch')||['same-id-relogin','epoch-rotate','revoked-auth',
      'inactive-controller','replace-controller','wrong-db'].includes(mode)){
      assert.equal(x.published,false,name+' '+width+' '+mode);
      assert.equal(x.retainedPanel,false);
      assert.deepEqual(x.events,['dispose:panel']);
     }else if(mode==='throw-dispose'){
      assert.equal(x.published,false);assert.deepEqual(x.events,['dispose-threw']);
     }else if(mode==='signout'||mode==='lock-then-stale'){
      assert.equal(x.bridgeNull,true);
      assert.equal(x.controllerNull,true);
      assert.equal(x.clearedBoard,true);
      assert.equal(x.savedCount,0);
      assert.ok(x.events.includes('clear-preview'));
      if(mode==='lock-then-stale')assert.equal(x.published,false);
     }
     results.push({engine:name,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],name+' '+width+' page JS errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,102);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 source:'actual native optional panel publishing and signed owner lock source',
 cases:results.length,accounts:'synthetic',physicalPhones:false,familyAlpha:'HOLD',
 results
},null,2));
console.log('Mission 3 native panel mounts: 102 Chromium/WebKit synthetic mobile cases PASS; no deploy.');
