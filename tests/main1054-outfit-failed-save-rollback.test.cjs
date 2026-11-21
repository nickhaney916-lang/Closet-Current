'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');

const engine=fs.readFileSync(path.join(__dirname,'../public/outfit-board-engine.js'),'utf8');
const board=fs.readFileSync(path.join(__dirname,'../public/outfit-board.js'),'utf8');
const browser=fs.readFileSync(path.join(__dirname,'../public/closet-browser.js'),'utf8');
const start=board.indexOf('function boardBackup('),end=board.indexOf('function openBoardPicker(');
assert.ok(start>=0&&end>start,'load actual board save and selection handlers');
const browserEnd=browser.indexOf('function renderClosetBrowser(');
assert.ok(browserEnd>0,'load actual closet placement handler');

function setup(){
 const elements=new Map(),items=[
  {id:'shirt',name:'Original shirt',image:'original-jpeg',category:'Tops',itemType:'T-shirt'},
  {id:'newshirt',name:'New shirt',image:'new-jpeg',category:'Tops',itemType:'Blouse'},
  {id:'thirdshirt',name:'Third shirt',image:'third-jpeg',category:'Tops',itemType:'Sweater'},
  {id:'jacket',name:'Jacket',image:'jacket-jpeg',category:'Outerwear',itemType:'Jacket'},
 ];
 const context={URL,encodeURIComponent,structuredClone,items,db:{},window:{},
  $:id=>{if(!elements.has(id))elements.set(id,{textContent:'',value:''});return elements.get(id);},
  render(){},outfitBoardReady:Promise.resolve()};
 vm.createContext(context);
 vm.runInContext(engine,context);
 vm.runInContext('let currentBoard=cleanOutfitBoard({slots:{top:"shirt"},layerCount:0},items);let savedOutfitBoards=[];let boardInitialized=true;',context);
 vm.runInContext(board.slice(start,end),context);
 vm.runInContext('renderOutfitBoard=()=>{currentBoard=cleanOutfitBoard(currentBoard,items)};',context);
 vm.runInContext(browser.slice(0,browserEnd),context);
 const state=()=>JSON.parse(vm.runInContext('JSON.stringify(currentBoard)',context));
 const updatePersist=script=>vm.runInContext('persistBoardState='+script,context);
 return {context,elements,items,state,updatePersist};
}
test('failed top swap must roll back the previously saved outfit without changing either original photograph',async()=>{
 const v=setup(),before=v.state(),images=v.items.map(x=>x.image);
 v.updatePersist('async()=>{throw Error("simulated browser quota rejection")}');
 assert.equal(await v.context.selectBoardPiece('top','newshirt'),false);
 assert.deepEqual(v.state(),before,'a rejected write must never leave an unsaved top selected');
 assert.deepEqual(v.items.map(x=>x.image),images);
 assert.match(v.elements.get('boardSaveStatus').textContent,/could not be saved/);
});

test('failed layer choice must not leave an unsaved jacket or raise the layer count',async()=>{
 const v=setup(),before=v.state();
 v.updatePersist('async()=>{throw Error("simulated IndexedDB transaction abort")}');
 assert.equal(await v.context.placeClosetPiece(v.items[3],'layer2'),false);
 assert.deepEqual(v.state(),before,'failed closet placement must restore selected slots and layerCount');
 assert.match(v.elements.get('closetLookStatus').textContent,/could not save/i);
});

test('successful save retains new selection and derives the required garment layer',async()=>{
 const v=setup();
 v.updatePersist('async()=>{}');
 assert.equal(await v.context.placeClosetPiece(v.items[3],'layer2'),true);
 assert.equal(v.state().slots.top,'shirt');
 assert.equal(v.state().slots.layer2,'jacket');
 assert.equal(v.state().layerCount,2);
 assert.equal(v.items[0].image,'original-jpeg');
});

test('an older delayed persistence failure must not erase a newer selected garment',async()=>{
 const v=setup();
 const pending=[];
 v.context.enqueuePersist=()=>new Promise((resolve,reject)=>pending.push({resolve,reject}));
 v.updatePersist('async()=>await enqueuePersist()');
 const first=v.context.selectBoardPiece('top','newshirt');
 const second=v.context.selectBoardPiece('top','thirdshirt');
 assert.equal(pending.length,2,'both actual writes must have started');
 pending[1].resolve();assert.equal(await second,true);
 pending[0].reject(Error('old transaction rejected'));assert.equal(await first,false);
 assert.equal(v.state().slots.top,'thirdshirt','late failed save must not roll back the newer selection');
});
