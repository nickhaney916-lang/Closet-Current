// Execute actual default Outfit Builder saved-card and garment picker source.
// Synthetic owner/garment records, Chromium+WebKit at three CSS mobile widths.
// This is NOT physical Android/iPhone or hosted cloud acceptance.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const dir=resolve(process.argv[2]||'benchmark/mission3-outfit-owner-bound-card-picker-browser');
await mkdir(dir,{recursive:true});
const src=await readFile('public/outfit-board.js','utf8');
function exact(a,b){
 const i=src.indexOf(a),j=src.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Expected exact production source: '+a);
 return src.slice(i,j);
}
const lease=exact('function beginOwnerBoardUiLease(){','function beginNativeBoardMountLease(){');
const picker=exact('function openBoardPicker(slotId){','function renderOutfitBoard(){');
const saved=exact('function renderSavedOutfitBoards(){','async function importBoardBackup(');
const js=[
 "'use strict';",
 "let captureOperationEpoch=1,db,nativeLossless04Active=false;",
 "let savedOutfitBoards=[],currentBoard={},items=[],outfitSlots=[{id:'top',label:'Top'}];",
 "let choosingSlot='top',events=[];",
 "const $=id=>document.getElementById(id);",
 "function node(tag,label,cl){const el=document.createElement(tag);if(label!=null)el.textContent=label;if(cl)el.className=cl;return el;}",
 "function cleanOutfitBoard(v){return structuredClone(v)}",
 "function syncBoardInputs(){events.push('sync')}",
 "function renderOutfitBoard(){events.push('render')}",
 "function storeBoard(){events.push('store');return Promise.resolve(true)}",
 "function selectBoardPiece(slot,id){events.push('select:'+slot+':'+id)}",
 "function switchView(v){events.push('view:'+v)}",
 "function slotAllows(){return true}",
 lease,picker,saved,
 "window.__probe=mode=>{",
 " document.body.innerHTML='<div id=\"authGate\" hidden></div><main id=\"appShell\">'+",
 " '<div id=\"savedBoards\"></div><div id=\"boardPickerItems\"></div>'+",
 " '<p id=\"boardPickerTitle\"></p><dialog id=\"boardPicker\"></dialog></main>';",
 " captureOperationEpoch++;events=[];",
 " const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};",
 " window.closetAuth=auth;db={name:'closet-current-user-owner-a'};",
 " savedOutfitBoards=[{name:'PRIVATE-A-SAVED',slots:{top:'PRIVATE-A-TOP'}}];",
 " currentBoard={name:'PRIVATE-A-DRAFT',slots:{}};",
 " items=[{id:'PRIVATE-A-TOP',name:'PRIVATE-A-JPEG',image:'data:image/jpeg;base64,/9j/AA==',category:'Tops',itemType:'T-shirt',color:'Blue'}];",
 " const savedMode=mode.startsWith('saved-'),addMode=mode.startsWith('add-');",
 " if(addMode)items=[];",
 " if(mode==='saved-locked'||mode==='picker-locked')$('authGate').hidden=false;",
 " let card=null;",
 " if(savedMode){renderSavedOutfitBoards();card=$('savedBoards').querySelector('button')}",
 " else{openBoardPicker('top');card=$('boardPickerItems').querySelector('button')}",
 " if(mode.endsWith('-switch')){window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};db={name:'closet-current-user-owner-b'};captureOperationEpoch++}",
 " if(mode.endsWith('-relogin')){window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};db={name:'closet-current-user-owner-a'};captureOperationEpoch++}",
 " if(mode.endsWith('-epoch'))captureOperationEpoch++;",
 " if(mode.endsWith('-db'))db={name:'closet-current-user-owner-a'};",
 " if(mode.endsWith('-revoked'))auth.revoked=true;",
 " if(mode.endsWith('-detach'))card?.remove();",
 " if(mode==='saved-roster')savedOutfitBoards=[{...savedOutfitBoards[0]}];",
 " if(mode==='picker-wardrobe')items=[{...items[0]}];",
 " if(mode.includes('switch')||mode.includes('relogin')){",
 "   currentBoard={name:'NEW-OWNER-DRAFT',slots:{}};savedOutfitBoards=[{name:'NEW-OWNER-SAVED'}];",
 " }",
 " events=[];",
 " card?.onclick?.();",
 " return {mode,hasCard:Boolean(card),events,boardName:currentBoard.name,",
 "   pickerOpen:$('boardPicker').open,buttonCount:($('savedBoards').querySelectorAll('button').length+$('boardPickerItems').querySelectorAll('button').length)};",
 "};"
].join('\n');
const modes=[
 'saved-valid','picker-valid','saved-switch','picker-switch','saved-relogin','picker-relogin',
 'saved-epoch','picker-epoch','saved-db','picker-db','saved-revoked','picker-revoked',
 'saved-detach','picker-detach','saved-roster','picker-wardrobe',
 'add-valid','add-switch','saved-locked','picker-locked'
];
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:800}});
   try{
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setContent('<div>Test harness</div>');
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const x=await page.evaluate(m=>window.__probe(m),mode);
     if(mode==='saved-valid'){
      assert.equal(x.boardName,'PRIVATE-A-SAVED');
      assert.deepEqual(x.events,['sync','render','store']);
     }else if(mode==='picker-valid'){
      assert.deepEqual(x.events,['select:top:PRIVATE-A-TOP']);
      assert.equal(x.pickerOpen,false);
     }else if(mode==='add-valid'){
      assert.deepEqual(x.events,['view:scan']);
      assert.equal(x.pickerOpen,false);
     }else if(mode==='saved-locked'||mode==='picker-locked'){
      assert.equal(x.hasCard,false);
      assert.deepEqual(x.events,[]);
     }else{
      assert.deepEqual(x.events,[],'stale callback changed owner '+mode);
      if(mode.includes('switch')||mode.includes('relogin'))
       assert.equal(x.boardName,'NEW-OWNER-DRAFT');
      else assert.equal(x.boardName,'PRIVATE-A-DRAFT');
     }
     results.push({engine:name,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],'script errors at '+name+' '+width);
    await page.screenshot({path:resolve(dir,name+'-'+width+'-synthetic.png')});
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(results.length,120);
await writeFile(resolve(dir,'results.json'),JSON.stringify({
 familyAlpha:'HOLD',noDeploy:true,synthetic:true,physicalDevice:false,
 engines:['chromium','webkit'],cssWidths:[320,390,430],
 cases:results.length,failures:0,results
},null,2));
console.log('Mission 3 default signed-owner outfit cards and picker: '+results.length+
 ' Chromium/WebKit synthetic CSS mobile viewport scenarios PASS; NO DEPLOY.');
