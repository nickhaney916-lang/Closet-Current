// Real Chromium/WebKit tests execute the exact production owner callback/lease
// functions with synthetic accounts and garment IDs. No hosted data or phones.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const outputDir=resolve(process.argv[2]||'benchmark/mission3-native-board04-owner-callbacks-browser');
await mkdir(outputDir,{recursive:true});
const source=await readFile('public/outfit-board.js','utf8');
function extract(a,b){const i=source.indexOf(a),j=source.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Missing production callback source: '+a);return source.slice(i,j);}
const lease=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const lock=extract("window.addEventListener('closet:session-locked',()=>{",'async function persistBoardState(');
async function syntheticScenario(mode){
 document.body.innerHTML='<div id="authGate" hidden></div>'+
  '<main id="appShell"><p id="boardSaveStatus">idle</p>'+
  '<button id="retryBoardDraft"></button><div id="boardDraftConflictActions"></div></main>';
 captureOperationEpoch++;nativeLossless04=null;events=[];
 currentBoard={slots:{top:'original-owner-A'}};
 savedOutfitBoards=[{name:'saved-original-A'}];
 boardConflictDraft={owner:'owner-a'};
 let revoked=false;
 window.closetAuth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked')}};
 db={name:'closet-current-user-owner-a'};
 const callback=beginNativeBoard04OwnerCallbacks();
 const controller={
  status(){return {active:true}},
  readOnlySnapshot(){return {saved:[{name:'saved-A'}]}},
  dispose(){events.push('dispose')}
 };
 const status=$('boardSaveStatus');
 const swap=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
  db={name:'closet-current-user-owner-b'};
  status.textContent='owner b screen';
  currentBoard={slots:{top:'new-owner-B'}};
 };
 const relogin=()=>{
  captureOperationEpoch++;
  window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
  db={name:'closet-current-user-owner-a'};
  status.textContent='new login';
 };
 if(mode==='invalid-gate')$('authGate').hidden=false;
 if(mode==='wrong-db')db={name:'wrong-db'};
 if(mode==='attach-after-switch')swap();
 if(mode==='attach-after-relogin')relogin();
 if(mode==='before-attach-change')callback.onChange({slots:{top:'initial-A'}});
 if(!['invalid-gate','wrong-db'].includes(mode))
  callback.attach(controller);
 if(mode==='valid-status')callback.onStatus('Private A ready');
 if(mode==='bad-status')callback.onStatus({message:'PRIVATE A filename'});
 if(mode==='valid-roster')callback.onChange({slots:{top:'owned-A'}});
 if(mode==='valid-revoke')callback.onChange(null,{revoked:true});
 if(['owner-switch-status','owner-switch-roster','owner-switch-revoke','async-stale-status'].includes(mode))swap();
 if(mode==='relogin-status')relogin();
 if(mode==='epoch-rotated'){captureOperationEpoch++;status.textContent='same owner new epoch';}
 if(mode==='revoked-auth')revoked=true;
 if(mode==='replaced-controller')nativeLossless04={...controller};
 if(['owner-switch-status','relogin-status','epoch-rotated','revoked-auth','replaced-controller'].includes(mode))
  callback.onStatus('PRIVATE former A original JPEG');
 if(mode==='owner-switch-roster')callback.onChange({slots:{top:'PRIVATE old owner'}});
 if(mode==='owner-switch-revoke')callback.onChange(null,{revoked:true});
 if(mode==='async-stale-status')await Promise.resolve().then(()=>callback.onStatus('PRIVATE async A'));
 if(mode==='session-lock')window.dispatchEvent(new Event('closet:session-locked'));
 if(mode==='lock-then-switch'){
  window.dispatchEvent(new Event('closet:session-locked'));
  swap();callback.onChange(null,{revoked:true});
 }
 return {mode,events,status:status.textContent,
  currentTop:currentBoard?.slots?.top??null,savedCount:savedOutfitBoards.length,
  bridgeOwner:nativeLossless04===controller,privateLeak:status.textContent.includes('PRIVATE')};
}
const js=[
 "'use strict';",
 "let db,captureOperationEpoch=0,nativeLossless04=null,nativeLossless04Active=true,boardInitialized=true,boardDraftTimer=null,boardStatusSerial=0,boardConflictDraft=null,currentBoard={slots:{}},savedOutfitBoards=[],events=[];",
 "const $=id=>document.getElementById(id);",
 "function cancelBoardDraftTimer(){events.push('cancel-timer');}",
 "function cleanOutfitBoard(board){events.push('clean');return {...board};}",
 "function nativeLossless04ClearPreview(){events.push('clear-preview');}",
 "function syncBoardInputs(){events.push('sync');}",
 "function renderOutfitBoard(){events.push('render');}",
 "window.nativePhotoReadiness08Bridge={clear(){events.push('clear-readiness')}};",
 lease,lock,
 "window.__scenario=("+syntheticScenario.toString()+");"
].join('\n');
const modes=['valid-status','bad-status','valid-roster','valid-revoke','before-attach-change',
 'owner-switch-status','owner-switch-roster','owner-switch-revoke','relogin-status',
 'epoch-rotated','revoked-auth','replaced-controller','attach-after-switch',
 'attach-after-relogin','invalid-gate','wrong-db','async-stale-status',
 'session-lock','lock-then-switch'];
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
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const x=await page.evaluate(m=>window.__scenario(m),mode);
     assert.equal(x.privateLeak,false,engineName+' '+width+' '+mode+' previous-owner photo status');
     if(mode==='valid-status')assert.equal(x.status,'Private A ready');
     if(mode==='bad-status')assert.match(x.status,/Private outfit status is unavailable/);
     if(mode==='valid-roster'){
      assert.equal(x.currentTop,'owned-A');
      assert.deepEqual(x.events,['clear-readiness','sync','render']);
     }
     if(mode==='valid-revoke'){
      assert.equal(x.currentTop,null);assert.equal(x.savedCount,0);
      assert.ok(x.events.includes('clear-preview'));
     }
     if(mode==='before-attach-change')assert.equal(x.currentTop,'initial-A');
     if(['owner-switch-status','owner-switch-roster','owner-switch-revoke','async-stale-status'].includes(mode)){
      assert.equal(x.status,'owner b screen');assert.equal(x.currentTop,'new-owner-B');
      assert.equal(x.events.includes('clear-preview'),false);
     }
     if(mode==='relogin-status')assert.equal(x.status,'new login');
     if(mode==='epoch-rotated')assert.equal(x.status,'same owner new epoch');
     if(['attach-after-switch','attach-after-relogin'].includes(mode)){
      assert.equal(x.bridgeOwner,false);assert.deepEqual(x.events,['dispose']);
     }
     if(['invalid-gate','wrong-db'].includes(mode))assert.equal(x.bridgeOwner,false);
     if(mode==='session-lock'){
      assert.equal(x.currentTop,null);assert.equal(x.savedCount,0);
      assert.deepEqual(x.events,['cancel-timer','clean','clear-preview']);
     }
     if(mode==='lock-then-switch'){
      assert.equal(x.currentTop,'new-owner-B');
      assert.equal(x.events.filter(y=>y==='clear-preview').length,1);
     }
     results.push({engine:engineName,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],engineName+' '+width+' script errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,114);
await writeFile(resolve(outputDir,'results.json'),JSON.stringify({
 source:'actual public/outfit-board.js BOARD04 callback and lock code',
 accounts:'synthetic',familyAlpha:'HOLD',realDevices:false,
 passed:results.length,results
},null,2));
console.log('Mission 3 BOARD04 callback privacy:',results.length,'Chromium/WebKit synthetic mobile viewport tests PASS. NO DEPLOY.');
