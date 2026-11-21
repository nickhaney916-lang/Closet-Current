'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const board=fs.readFileSync('public/outfit-board.js','utf8');
const closet=fs.readFileSync('public/closet-browser.js','utf8');
const engine=fs.readFileSync('public/outfit-board-engine.js','utf8');
const part=(text,label)=>{
 const begin=text.indexOf("$('"+label+"').onclick=");
 assert.ok(begin>=0,'Original production '+label+' handler required');
 // Production handlers are one line before the fix, multiple lines after it.
 // The following independent DOM handler anchors their exact complete extent.
 const end=text.indexOf("\n$('",begin+1);
 assert.ok(end>begin,'Find boundary after complete original '+label+' handler');
 return text.slice(begin,end).trim();
};
const clearBoard=part(board,'clearBoard'),clearLook=part(closet,'closetClearLook');
const start=board.indexOf('function boardBackup('),end=board.indexOf('function openBoardPicker(');
assert.ok(start>=0&&end>start,'Original real persistence helpers required');
function setup(){
 const elements=new Map(),garments=[
  {id:'shirt',name:'Original shirt',category:'Tops',image:'unaltered-original-shirt'},
  {id:'shoe',name:'Owned shoes',category:'Shoes',image:'unaltered-original-shoe'},
  {id:'coat',name:'New coat',category:'Outerwear',image:'unaltered-original-coat'}
 ];
 const context={URL,encodeURIComponent,structuredClone,items:garments,window:{closetDressPreview:true},db:{},
  outfitBoardReady:Promise.resolve(),render(){},
  $:id=>{if(!elements.has(id))elements.set(id,{textContent:'',value:''});return elements.get(id);}};
 vm.createContext(context);
 vm.runInContext(engine,context);
 vm.runInContext('let currentBoard=cleanOutfitBoard({name:"Keep this look",slots:{top:"shirt",shoes:"shoe"},ideas:{bag:{type:"Bag",color:"Gold"}},occasion:"Dinner",layerCount:0},items);let savedOutfitBoards=[];let boardInitialized=true;',context);
 vm.runInContext(board.slice(start,end),context);
 vm.runInContext('renderOutfitBoard=()=>{currentBoard=cleanOutfitBoard(currentBoard,items)};',context);
 vm.runInContext(clearBoard+'\n'+clearLook,context);
 return {
  ctx:context,elems:elements,garments,
  board:()=>JSON.parse(vm.runInContext('JSON.stringify(currentBoard)',context)),
  invoke:id=>context.$(id).onclick(),
  persistence:source=>vm.runInContext('persistBoardState='+source,context),
  evaluate:source=>vm.runInContext(source,context),
 };
}
test('failed Start a new outfit restores the existing selected photo slots and styling details',async()=>{
 const v=setup(),before=v.board(),photos=v.garments.map(x=>x.image);
 v.persistence('async()=>{throw Error("synthetic browser quota rejection")}');
 await v.invoke('clearBoard');await Promise.resolve();
 assert.deepEqual(v.board(),before,'failed write must not silently blank current outfit');
 assert.deepEqual(v.garments.map(x=>x.image),photos,'original garment photo bytes/identity untouched');
 assert.match(v.elems.get('boardSaveStatus').textContent,/could not be saved/i);
});
test('failed closet Clear look restores the prior outfit and dress-preview mode',async()=>{
 const v=setup(),before=v.board(),photos=v.garments.map(x=>x.image);
 v.persistence('async()=>{throw Error("synthetic IndexedDB AbortError")}');
 await v.invoke('closetClearLook');
 assert.deepEqual(v.board(),before,'failed closet clear must not erase persisted visual outfit');
 assert.equal(v.ctx.window.closetDressPreview,true,'failed clear must keep previous dress-preview selection');
 assert.deepEqual(v.garments.map(x=>x.image),photos);
 assert.match(v.elems.get('closetLookStatus').textContent,/could not save/i);
});
test('successful new outfit clear removes only outfit selections, not owned garments',async()=>{
 const v=setup(),photos=v.garments.map(x=>x.image);
 let commits=0;v.ctx.recordCommit=()=>{commits++;};
 v.persistence('async()=>{recordCommit()}');
 await v.invoke('clearBoard');await Promise.resolve();
 assert.deepEqual(v.board().slots,{});
 assert.deepEqual(v.board().ideas,{});
 assert.equal(commits,1);
 assert.deepEqual(v.garments.map(x=>x.image),photos);
});
test('successful closet clear retains garments and ends dress-preview mode',async()=>{
 const v=setup(),photos=v.garments.map(x=>x.image);
 v.persistence('async()=>{}');
 await v.invoke('closetClearLook');
 assert.deepEqual(v.board().slots,{});
 assert.equal(v.ctx.window.closetDressPreview,false);
 assert.match(v.elems.get('closetLookStatus').textContent,/Look cleared/);
 assert.deepEqual(v.garments.map(x=>x.image),photos);
});
test('late failed clear must not overwrite a newer outfit edit',async()=>{
 const v=setup();
 const delayed=[];v.ctx.schedule=()=>new Promise((resolve,reject)=>delayed.push({resolve,reject}));
 v.persistence('async()=>await schedule()');
 const first=v.invoke('clearBoard');
 v.evaluate('currentBoard=cleanOutfitBoard({name:"Fresh choice",slots:{top:"shirt"},occasion:"Work"},items)');
 assert.equal(delayed.length,1);
 delayed[0].reject(Error('old clear aborted'));
 await first;await Promise.resolve();
 assert.equal(v.board().name,'Fresh choice');
 assert.equal(v.board().slots.top,'shirt');
});
