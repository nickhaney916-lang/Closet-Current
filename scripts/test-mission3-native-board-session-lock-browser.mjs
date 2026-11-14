// Browser validation executes the exact production session-lock handler and
// private outfit editor clearing in Chromium/WebKit at synthetic CSS widths.
// No real physical device, owner data, hosted auth or cloud writes.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const dir=resolve(process.argv[2]||'benchmark/mission3-native-board-session-lock-browser');
await mkdir(dir,{recursive:true});
const source=await readFile('public/outfit-board.js','utf8');
function extract(begin,end){
 const i=source.indexOf(begin),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Missing production session-lock source: '+begin);
 return source.slice(i,j);
}
const preview=extract('function nativeLossless04ClearPreview(){','function boardLink(');
const lease=extract('function beginOwnerBoardUiLease(){','function boardDraftStatus(');
const inputs=extract('function syncBoardInputs(){','function selectBoardPiece(');
const lock=extract("window.addEventListener('closet:session-locked',()=>{",'async function persistBoardState(');
const inputIds=['boardName','boardOccasion','boardSeason','boardAudience','boardSize','boardBudget'];
const gridIds=['boardSlots','savedBoards','boardPickerItems','boardOwnedOptions','boardRecommendations'];
const bridgeKeys=['native3D05Bridge','nativePhotoReadiness08Bridge','styleOwnedLive03Bridge','nativeMobile09Bridge','nativeLossless04Bridge'];
const bootstrap=[
 "'use strict';",
 "let currentBoard={name:'PRIVATE-A'},savedOutfitBoards=[],nativeLossless04=null;",
 "let db=null,captureOperationEpoch=0,nativeLossless04Active=true;",
 "let boardStatusSerial=0,boardConflictDraft=null,events=[],boardDraftTimer=null;",
 "const $=id=>document.getElementById(id);",
 "function cleanOutfitBoard(){events.push('clean');return {name:'',slots:{}}}",
 "function cancelBoardDraftTimer(){events.push('cancel-timer');boardDraftTimer=null;}",
 preview,lease,inputs,lock,
 "window.__probe=mode=>{",
 " const inputIds="+JSON.stringify(inputIds)+";",
 " const gridIds="+JSON.stringify(gridIds)+";",
 " const bridgeKeys="+JSON.stringify(bridgeKeys)+";",
 " const fields=inputIds.map(id=>'<input id=\"'+id+'\" value=\"PRIVATE-A-'+id+'\">').join('');",
 " const grids=gridIds.map(id=>'<div id=\"'+id+'\">PRIVATE-A-'+id+'</div>').join('');",
 " document.body.innerHTML='<div id=\"authGate\" hidden></div><div id=\"appShell\">'+",
 "  '<p id=\"boardSaveStatus\">PRIVATE-A-SHA</p>'+",
 "  '<button id=\"retryBoardDraft\"></button><div id=\"boardDraftConflictActions\"></div>'+",
 "  fields+grids+'<dialog id=\"boardPicker\" open>PRIVATE-A</dialog></div>';",
 " events=[];boardStatusSerial=2;boardDraftTimer=1;",
 " boardConflictDraft={private:'PRIVATE-A-CONFLICT'};",
 " currentBoard={name:'PRIVATE-A-OUTFIT',slots:{top:'PRIVATE-A-CLOTHING'}};",
 " savedOutfitBoards=[{name:'PRIVATE-A-SAVED'}];",
 " nativeLossless04Active=mode!=='non-native';",
 " captureOperationEpoch++;",
 " window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};",
 " db={name:'closet-current-user-owner-a'};",
 " let oldCallbacks=null;",
 " const controller={",
 "  status(){return {active:true}},readOnlySnapshot(){return {saved:[{name:'private-a'}]}},",
 "  dispose(){",
 "   events.push('dispose:controller');",
 "   if(mode==='old-callback-in-dispose'&&oldCallbacks){",
 "    oldCallbacks.onChange({name:'PRIVATE-A-REBOUND'});oldCallbacks.onStatus('PRIVATE-A-LEAK');",
 "   }",
 "   if(mode==='controller-throws')throw Error('PRIVATE-A-EXCEPTION');",
 "  }",
 " };",
 " nativeLossless04=controller;",
 " oldCallbacks=beginNativeBoardMountLease();",
 " oldCallbacks?.bind(controller);",
 " for(const key of bridgeKeys){",
 "  if(mode==='no-controller'&&key==='nativeLossless04Bridge')continue;",
 "  if(key==='nativeLossless04Bridge'){window[key]=controller;continue;}",
 "  window[key]={dispose(){events.push('dispose:'+key);",
 "   if((mode==='viewer-throws'&&key==='native3D05Bridge')||",
 "      (mode==='style-throws'&&key==='styleOwnedLive03Bridge'))",
 "     throw Error('PRIVATE-A-EXCEPTION');",
 "  }};",
 " }",
 " if(mode==='pending-mount'){nativeLossless04=null;oldCallbacks=beginNativeBoardMountLease();}",
 " // APP36's lock event is sent after the current auth epoch has been revoked.",
 " captureOperationEpoch++;",
 " window.dispatchEvent(new Event('closet:session-locked'));",
 " if(mode==='repeated')window.dispatchEvent(new Event('closet:session-locked'));",
 " const fieldsNow=inputIds.map(id=>$(id).value);",
 " const gridsNow=gridIds.map(id=>$(id).textContent);",
 " const bridgesNow=bridgeKeys.map(key=>window[key]??null);",
 " const first={fieldsNow,gridsNow,bridgesNow,board:currentBoard.name,",
 "  saved:savedOutfitBoards.length,status:$('boardSaveStatus').textContent,",
 "  pickerOpen:$('boardPicker').open,events:[...events],",
 "  retryHidden:$('retryBoardDraft').hidden,",
 "  conflictHidden:$('boardDraftConflictActions').hidden};",
 " if(mode==='new-owner-after-lock'||mode==='same-id-after-lock'||mode==='pending-mount'){",
 "  if(mode==='new-owner-after-lock'){window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};db={name:'closet-current-user-owner-b'}}",
 "  else{window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};db={name:'closet-current-user-owner-a'}}",
 "  captureOperationEpoch++;",
 "  currentBoard={name:'NEW-SESSION-CLOSET'};",
 "  $('boardSaveStatus').textContent='NEW-SESSION-STATUS';",
 "  oldCallbacks?.onChange({name:'OLD-A-PRIVATE'});oldCallbacks?.onStatus('OLD-A-PRIVATE');",
 "  first.after={board:currentBoard.name,status:$('boardSaveStatus').textContent};",
 " }",
 " return first;",
 "};"
].join('\n');
const modes=[
 'standard','new-owner-after-lock','same-id-after-lock','pending-mount',
 'viewer-throws','style-throws','controller-throws','old-callback-in-dispose',
 'no-controller','repeated','non-native'
];
const results=[];
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:790}});
   const page=await context.newPage();
   try{
    await page.setContent('<main id="session-lock-test"></main>');
    await page.addScriptTag({content:bootstrap});
    for(const mode of modes){
     const x=await page.evaluate(mode=>window.__probe(mode),mode);
     assert.equal(x.retryHidden,true);
     assert.equal(x.conflictHidden,true);
     if(mode==='non-native'){
      assert.equal(x.board,'PRIVATE-A-OUTFIT');
      assert.ok(x.fieldsNow[0].startsWith('PRIVATE-A-'));
      assert.equal(x.saved,1);
      assert.equal(x.events.filter(y=>y.startsWith('dispose:')).length,0);
     }else{
      assert.equal(x.board,'');
      assert.equal(x.saved,0);
      assert.ok(x.fieldsNow.every(y=>y===''),'old outfit field visible after '+mode);
      assert.ok(x.gridsNow.every(y=>y===''),'old preview grid visible after '+mode);
      assert.ok(x.bridgesNow.every(y=>y===null),'old private bridge survived '+mode);
      assert.equal(x.pickerOpen,false);
      assert.equal(x.status,'Signed-out private outfit cleared. Reopen Outfit Builder.');
      const disposals=x.events.filter(y=>y.startsWith('dispose:'));
      assert.equal(disposals.length,mode==='no-controller'?4:5);
      if(x.after){
       assert.equal(x.after.board,'NEW-SESSION-CLOSET');
       assert.equal(x.after.status,'NEW-SESSION-STATUS');
      }
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
 cases:66,failures:0,engines:['chromium','webkit'],widths:[320,390,430],results
},null,2));
console.log('Mission 3 native session-lock private UI clearing: 66 Chromium/WebKit synthetic mobile-width cases PASS; HOLD, NO DEPLOY.');
