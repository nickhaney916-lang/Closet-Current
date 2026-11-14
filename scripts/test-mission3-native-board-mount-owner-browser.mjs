// Browser-executed real production mount-lease callbacks, synthetic owner data.
// Chromium + WebKit, 320/390/430 CSS viewport; no physical phone or hosted cloud.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const dir=resolve(process.argv[2]||'benchmark/mission3-native-board-mount-owner-browser');
await mkdir(dir,{recursive:true});
const full=await readFile('public/outfit-board.js','utf8');
const start=full.indexOf('function beginOwnerBoardUiLease(){');
const end=full.indexOf('function boardDraftStatus(',start);
assert.ok(start>=0&&end>start,'Production owner-mount lease source is required');
const leaseSource=full.slice(start,end);
const bootstrap=[
 "'use strict';",
 "let nativeLossless04=null,db=null,captureOperationEpoch=0;",
 "let currentBoard={id:'initial'},savedOutfitBoards=[],boardInitialized=true;",
 "let events=[];",
 "const $=id=>document.getElementById(id);",
 "function cleanOutfitBoard(){events.push('clean');return {id:'empty'}}",
 "function nativeLossless04ClearPreview(){events.push('preview-clear')}",
 "function syncBoardInputs(){events.push('inputs')}",
 "function renderOutfitBoard(){events.push('render')}",
 leaseSource,
 "window.__probe=mode=>{",
 " events=[];",
 " $('authGate').hidden=true;$('appShell').hidden=false;",
 " $('boardSaveStatus').textContent='initial';",
 " captureOperationEpoch=42;",
 " currentBoard={id:'before'};savedOutfitBoards=[{id:'original'}];",
 " let revoked=false;",
 " const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked')}};",
 " window.closetAuth=auth;",
 " window.nativePhotoReadiness08Bridge={clear(){events.push('clear')}};",
 " db={name:'closet-current-user-owner-a'};",
 " const lease=beginNativeBoardMountLease();",
 " if(!lease)return {missing:true};",
 " const ownerConsumer={status(){return {active:true}},readOnlySnapshot(){return {saved:[{id:'saved-a'}]}}};",
 " if(mode!=='initial-load'){nativeLossless04=ownerConsumer;lease.bind(ownerConsumer)}",
 " else nativeLossless04=null;",
 " if(mode==='initial-load'){",
 "  lease.onChange({id:'source-a'});lease.onStatus('A STATUS');",
 "  return {board:currentBoard.id,status:$('boardSaveStatus').textContent,events};",
 " }",
 " if(mode==='current'){",
 "  lease.onChange({id:'source-a'});lease.onStatus('A STATUS');",
 "  return {board:currentBoard.id,status:$('boardSaveStatus').textContent,events};",
 " }",
 " if(mode==='different-owner'){window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};db={name:'closet-current-user-owner-b'};captureOperationEpoch++}",
 " if(mode==='same-id-relogin'){window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};db={name:'closet-current-user-owner-a'};captureOperationEpoch++}",
 " if(mode==='epoch-changed')captureOperationEpoch++;",
 " if(mode==='db-object-replaced')db={name:'closet-current-user-owner-a'};",
 " if(mode==='db-name-changed')db.name='other-owner-private-db';",
 " if(mode==='revoked')revoked=true;",
 " if(mode==='auth-gate-locked')$('authGate').hidden=false;",
 " if(mode==='app-shell-locked')$('appShell').hidden=true;",
 " if(mode==='controller-replaced')nativeLossless04={...ownerConsumer};",
 " currentBoard={id:'new-owner-board'};savedOutfitBoards=[{id:'new-saved'}];",
 " $('boardSaveStatus').textContent='NEW OWNER STATUS';events=[];",
 " lease.onChange({id:'PRIVATE SOURCE A'});lease.onStatus('PRIVATE ERROR A');",
 " lease.onChange(null,{revoked:true});",
 " return {board:currentBoard.id,saved:savedOutfitBoards[0].id,",
 "  status:$('boardSaveStatus').textContent,events};",
 "}"
].join('\n');
const modes=[
 'current','initial-load',
 'different-owner','same-id-relogin','epoch-changed','db-object-replaced',
 'db-name-changed','revoked','auth-gate-locked','app-shell-locked',
 'controller-replaced'
];
const results=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:790}});
   const page=await context.newPage();
   try{
    await page.setContent('<div id="authGate" hidden></div><main id="appShell">'+
     '<p id="boardSaveStatus">initial</p></main>');
    await page.addScriptTag({content:bootstrap});
    for(const mode of modes){
     const result=await page.evaluate(mode=>window.__probe(mode),mode);
     assert.equal(result.missing,undefined,'Expected exact source lease: '+mode);
     if(mode==='current'){
      assert.equal(result.board,'source-a');
      assert.equal(result.status,'A STATUS');
      assert.deepEqual(result.events,['clear','inputs','render']);
     }else if(mode==='initial-load'){
      assert.equal(result.board,'source-a');
      assert.equal(result.status,'A STATUS');
      assert.deepEqual(result.events,['clear']);
     }else{
      assert.equal(result.board,'new-owner-board','stale source mutated '+mode);
      assert.equal(result.saved,'new-saved','stale roster mutated '+mode);
      assert.equal(result.status,'NEW OWNER STATUS','private status leak '+mode);
      assert.deepEqual(result.events,[],'stale original preview mutated '+mode);
     }
     results.push({engine:engineName,width,mode,pass:true});
    }
    await page.screenshot({path:resolve(dir,engineName+'-'+width+'-synthetic.png')});
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,66);
await writeFile(resolve(dir,'results.json'),JSON.stringify({
 familyAlpha:'HOLD',noDeploy:true,synthetic:true,physicalDevice:false,
 engines:['chromium','webkit'],cssWidths:[320,390,430],cases:results.length,
 failures:0,results
},null,2));
console.log('Mission 3 native research BOARD04 mount owner lease: '+results.length+
 ' synthetic Chromium/WebKit CSS mobile-width assertions PASS; no deploy.');
